"""Tests for the FastAPI back end of the HTML + Tailwind front end. Needs the project environment (.venv)."""
import csv
import io
import os
import re
import sqlite3
import tempfile
import unittest
from pathlib import Path

try:
    from fastapi.testclient import TestClient
except ImportError:  # running outside the virtual environment
    TestClient = None

from crs import questionnaire

STATIC = Path(__file__).resolve().parent.parent / "web" / "static"
ITEMS = questionnaire.items()


def answers(*liked):
    """4 (sangat suka) for the given RIASEC types and 1 for the rest."""
    return [4 if it.riasec in liked else 1 for it in ITEMS]


@unittest.skipIf(TestClient is None, "fastapi tidak terpasang; jalankan dengan .venv/bin/python")
class WebTest(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory()
        self.db = os.path.join(self.tmp.name, "test.sqlite3")
        os.environ["CRS_DB"] = self.db
        os.environ["CRS_ADMIN_TOKEN"] = "rahasia"
        os.environ.pop("DATABASE_URL", None)
        import web.app as web_app
        web_app._store = None                  # a fresh database, so no attempts are left from another test
        self.client = TestClient(web_app.app)

    def tearDown(self):
        for name in ("CRS_DB", "CRS_ADMIN_TOKEN", "CRS_ADMIN_EMAIL", "CRS_ADMIN_PASSWORD"):
            os.environ.pop(name, None)
        self.tmp.cleanup()

    def test_config_has_the_sixty_items(self):
        c = self.client.get("/api/config").json()
        self.assertNotIn("storing", c)
        self.assertEqual([it["number"] for it in c["items"]], list(range(1, 61)))
        self.assertEqual(len(c["responses"]), 5)
        self.assertEqual(len(c["types"]), 6)
        self.assertEqual(len(c["samples"]), 6)
        self.assertEqual(c["plans"][0]["max_job_zone"], None)

    def test_recommend_ranks_by_match_and_explains(self):
        r = self.client.post("/api/recommend", json={"answers": answers("Investigative", "Conventional")}).json()
        self.assertFalse(r["flat"])
        self.assertEqual(r["profile"][0]["percent"], 100)
        self.assertEqual({p["type"] for p in r["profile"][:2]}, {"Investigative", "Conventional"})
        matches = [c["match"] for c in r["cards"]]
        self.assertEqual(len(matches), 10)
        self.assertEqual(matches, sorted(matches, reverse=True))
        self.assertGreaterEqual(matches[0], 90)
        self.assertTrue(r["cards"][0]["reasons"])
        self.assertEqual(len(r["cards"][0]["comparison"]), 6)
        self.assertIsNone(r["result_id"])
        self.assertFalse(os.path.exists(self.db))                 # nothing is stored for a visitor who is not signed in

    def test_education_plan_limits_the_job_zone(self):
        r = self.client.post("/api/recommend", json={"answers": answers("Investigative"), "max_job_zone": 3}).json()
        self.assertTrue(all(c["job_zone"] <= 3 for c in r["cards"]))

    def test_identical_answers_give_no_cards(self):
        r = self.client.post("/api/recommend", json={"answers": [2] * 60}).json()
        self.assertTrue(r["flat"])
        self.assertEqual(r["cards"], [])
        self.assertEqual({p["percent"] for p in r["profile"]}, {50})

    def test_bad_answers_are_rejected(self):
        self.assertEqual(self.client.post("/api/recommend", json={"answers": [1] * 59}).status_code, 422)
        self.assertEqual(self.client.post("/api/recommend", json={"answers": [5] + [1] * 59}).status_code, 422)

    def test_detail_and_network(self):
        code = self.client.post("/api/recommend", json={"answers": answers("Social")}).json()["cards"][0]["code"]
        detail = self.client.get(f"/api/occupations/{code}").json()
        self.assertEqual(detail["code"], code)
        self.assertTrue(detail["skills"] and detail["related"])
        graph = self.client.get(f"/api/network/{code}").json()
        self.assertEqual(graph["centre"]["code"], code)
        self.assertEqual(len(graph["nodes"]), 8)
        self.assertEqual([n["close"] for n in graph["nodes"]], [True] * 5 + [False] * 3)
        self.assertEqual(graph["nodes"][0]["code"], detail["related"][0]["code"])
        self.assertEqual(self.client.get("/api/occupations/00-0000.00").status_code, 404)
        self.assertEqual(self.client.get("/api/network/00-0000.00").status_code, 404)

    def register(self, name="Sari Dewi", email="sari@example.com", password="rahasia-123", client=None):
        return (client or self.client).post("/api/auth/register", json={"name": name, "email": email, "password": password})

    def test_register_signs_in_and_never_stores_the_password(self):
        self.assertIsNone(self.client.get("/api/state").json()["user"])
        r = self.register(email="  Sari@Example.com ")
        self.assertEqual(r.status_code, 200)
        self.assertEqual((r.json()["name"], r.json()["email"]), ("Sari Dewi", "sari@example.com"))
        cookie = r.headers["set-cookie"]
        self.assertIn("HttpOnly", cookie)
        self.assertIn("SameSite=lax", cookie)
        self.assertEqual(self.client.get("/api/state").json()["user"]["email"], "sari@example.com")

        db = sqlite3.connect(self.db)
        stored, = db.execute("SELECT password_hash FROM users").fetchone()
        self.assertTrue(stored.startswith("scrypt$"))
        self.assertNotIn("rahasia-123", stored)
        token = self.client.cookies["texin_session"]
        self.assertNotEqual(db.execute("SELECT token_hash FROM logins").fetchone()[0], token)   # only its hash

    def test_register_rejects_bad_input_and_duplicate_email(self):
        self.assertEqual(self.register(password="pendek").status_code, 422)
        self.assertEqual(self.register(email="bukan-email").status_code, 422)
        self.assertEqual(self.register(name="   ").status_code, 422)
        self.assertEqual(self.register().status_code, 200)
        again = self.register(name="Orang Lain", email="SARI@example.com")
        self.assertEqual(again.status_code, 409)
        self.assertIn("sudah terdaftar", again.json()["detail"])

    def test_login_logout_and_wrong_password(self):
        self.register()
        self.assertEqual(self.client.post("/api/auth/logout").json(), {"ok": True})
        self.assertIsNone(self.client.get("/api/state").json()["user"])

        wrong = self.client.post("/api/auth/login", json={"email": "sari@example.com", "password": "salah-sekali"})
        unknown = self.client.post("/api/auth/login", json={"email": "tidak@ada.com", "password": "salah-sekali"})
        self.assertEqual((wrong.status_code, unknown.status_code), (401, 401))
        self.assertEqual(wrong.json(), unknown.json())            # does not reveal which emails exist

        ok = self.client.post("/api/auth/login", json={"email": "Sari@example.com", "password": "rahasia-123"})
        self.assertEqual(ok.json()["name"], "Sari Dewi")
        self.assertIn("Max-Age=43200", ok.headers["set-cookie"])  # without "Ingat saya": 12 hours, even across restarts
        kept = self.client.post("/api/auth/login",
                                json={"email": "sari@example.com", "password": "rahasia-123", "remember": True})
        self.assertIn("Max-Age=2592000", kept.headers["set-cookie"])

        old = self.client.cookies["texin_session"]
        self.client.post("/api/auth/logout")
        self.client.cookies.set("texin_session", old)             # a copied cookie is useless after logout
        self.assertIsNone(self.client.get("/api/state").json()["user"])

    def test_repeated_wrong_passwords_are_blocked_for_that_email(self):
        self.register()
        self.client.post("/api/auth/logout")
        body = {"email": "sari@example.com", "password": "salah-sekali"}
        codes = [self.client.post("/api/auth/login", json=body).status_code for _ in range(11)]
        self.assertEqual(codes, [401] * 10 + [429])
        right = {"email": "sari@example.com", "password": "rahasia-123"}
        self.assertEqual(self.client.post("/api/auth/login", json=right).status_code, 429)

    def test_history_belongs_to_the_account(self):
        self.assertEqual(self.client.get("/api/history").status_code, 401)
        self.register()
        self.assertEqual(self.client.get("/api/history").json(), {"results": []})
        given = answers("Social")
        first = self.client.post("/api/recommend", json={"answers": given, "max_job_zone": 4}).json()
        self.client.post("/api/recommend", json={"answers": [2] * 60})          # flat: nothing to keep
        rows = self.client.get("/api/history").json()["results"]
        self.assertEqual(len(rows), 1)
        self.assertEqual(rows[0]["id"], first["result_id"])
        self.assertEqual(rows[0]["top"][0], {"title": first["cards"][0]["title"], "match": first["cards"][0]["match"]})
        self.assertEqual(len(rows[0]["top"]), 3)

        same = self.client.post("/api/recommend", json={"answers": given, "max_job_zone": 4}).json()
        self.assertEqual(same["result_id"], first["result_id"])  # sent twice: still one history entry
        other_plan = self.client.post("/api/recommend", json={"answers": given, "max_job_zone": 3}).json()
        self.assertNotEqual(other_plan["result_id"], first["result_id"])
        self.assertEqual(len(self.client.get("/api/history").json()["results"]), 2)

        again = self.client.get(f"/api/history/{first['result_id']}").json()
        self.assertEqual([c["code"] for c in again["cards"]], [c["code"] for c in first["cards"]])
        self.assertTrue(all(c["job_zone"] <= 4 for c in again["cards"]))

        import web.app as web_app
        other = TestClient(web_app.app)
        self.register("Budi", "budi@example.com", client=other)
        self.assertEqual(other.get("/api/history").json(), {"results": []})
        self.assertEqual(other.get(f"/api/history/{first['result_id']}").status_code, 404)
        self.assertEqual(other.delete("/api/history").json(), {"ok": True})
        self.assertEqual(len(self.client.get("/api/history").json()["results"]), 2)   # untouched by the other user

        self.client.delete("/api/history")
        self.assertEqual(self.client.get("/api/history").json(), {"results": []})

    def test_state_follows_the_account_to_another_device(self):
        self.assertEqual(self.client.get("/api/state").json(), {"user": None, "progress": None, "result": None})
        self.assertEqual(self.client.put("/api/progress", json={"answers": {"1": 3}}).status_code, 401)
        self.register()
        self.assertEqual(self.client.put("/api/progress", json={"answers": {"61": 3}}).status_code, 422)
        self.assertEqual(self.client.put("/api/progress", json={"answers": {"1": 5}}).status_code, 422)
        self.client.put("/api/progress", json={"answers": {"1": 3, "2": 0}, "pos": 2, "plan": 3})

        import web.app as web_app
        other_device = TestClient(web_app.app)
        other_device.post("/api/auth/login", json={"email": "sari@example.com", "password": "rahasia-123"})
        seen = other_device.get("/api/state").json()
        self.assertEqual(seen["user"]["name"], "Sari Dewi")
        self.assertEqual(seen["progress"], {"answers": {"1": 3, "2": 0}, "pos": 2, "plan": 3})
        self.assertIsNone(seen["result"])

        done = other_device.post("/api/recommend", json={"answers": answers("Artistic"), "max_job_zone": 4}).json()
        seen = self.client.get("/api/state").json()               # back on the first device
        self.assertIsNone(seen["progress"])                       # finishing the test ends the progress
        self.assertEqual(seen["result"]["result_id"], done["result_id"])
        self.assertEqual([c["code"] for c in seen["result"]["cards"]], [c["code"] for c in done["cards"]])
        self.assertFalse(seen["result"]["feedback_given"])

        self.client.put("/api/progress", json={"answers": {"1": 1}})
        self.client.put("/api/progress", json={"answers": {}})    # started over
        self.assertIsNone(self.client.get("/api/state").json()["progress"])

    def test_feedback_is_kept_with_the_students_own_result(self):
        self.register()
        rid = self.client.post("/api/recommend", json={"answers": answers("Social")}).json()["result_id"]
        import web.app as web_app
        other = TestClient(web_app.app)
        self.register("Budi", "budi@example.com", client=other)
        body = {"result_id": rid, "relevance": 4, "ease": 5, "comment": " cocok "}
        self.assertEqual(TestClient(web_app.app).post("/api/feedback", json=body).status_code, 401)   # signed out
        self.assertEqual(other.post("/api/feedback", json=body).status_code, 404)        # not Budi's result
        self.assertEqual(self.client.post("/api/feedback", json=body).json(), {"saved": True})
        self.client.post("/api/feedback", json={**body, "relevance": 2})                 # replaces
        db = sqlite3.connect(self.db)
        self.assertEqual(db.execute("SELECT result_id, relevance, ease, comment FROM result_feedback").fetchall(),
                         [(rid, 2, 5, "cocok")])
        self.assertTrue(self.client.get("/api/state").json()["result"]["feedback_given"])
        self.assertTrue(self.client.get(f"/api/history/{rid}").json()["feedback_given"])

        self.assertEqual(self.client.get("/api/admin/feedback.csv?token=salah").status_code, 404)
        text = self.client.get("/api/admin/feedback.csv?token=rahasia").text
        rows = list(csv.reader(io.StringIO(text)))
        self.assertEqual(len(rows), 2)
        self.assertEqual(rows[1][-3:], ["2", "5", "cocok"])
        self.assertNotIn("sari@example.com", text)
        self.assertNotIn("Sari Dewi", text)

        self.client.delete("/api/history")                        # removes the feedback with the results
        self.assertEqual(db.execute("SELECT COUNT(*) FROM result_feedback").fetchone()[0], 0)

    def admin_client(self):
        """Signed in as the admin account, which the server creates from ADMIN_EMAIL + ADMIN_PASSWORD."""
        os.environ["CRS_ADMIN_EMAIL"] = "Admin@Example.com"
        os.environ["CRS_ADMIN_PASSWORD"] = "admin-rahasia"
        import web.app as web_app
        web_app._store = None
        admin = TestClient(web_app.app)
        r = admin.post("/api/auth/login", json={"email": "admin@example.com", "password": "admin-rahasia"})
        self.assertEqual(r.status_code, 200)
        return admin

    def test_admin_account_is_created_and_its_email_cannot_be_registered(self):
        admin = self.admin_client()
        self.assertTrue(admin.get("/api/state").json()["user"]["admin"])
        taken = self.register("Penyusup", "ADMIN@example.com")
        self.assertEqual(taken.status_code, 409)
        self.register()
        self.assertFalse(self.client.get("/api/state").json()["user"]["admin"])

    def test_admin_pages_are_hidden_from_everyone_else(self):
        self.admin_client()
        import web.app as web_app
        for client in (TestClient(web_app.app), self.client):     # signed out, then an ordinary student
            if client is self.client:
                self.register()
            self.assertEqual(client.get("/api/admin/users").status_code, 404)
            self.assertEqual(client.get("/api/admin/feedback").status_code, 404)
            self.assertEqual(client.post("/api/admin/users/x/password", json={}).status_code, 404)

    def test_admin_sees_users_and_feedback(self):
        admin = self.admin_client()
        self.register()
        rid = self.client.post("/api/recommend", json={"answers": answers("Social")}).json()["result_id"]
        self.client.post("/api/feedback", json={"result_id": rid, "relevance": 4, "ease": 5, "comment": "cocok"})
        users = {u["email"]: u for u in admin.get("/api/admin/users").json()["users"]}
        self.assertEqual(set(users), {"admin@example.com", "sari@example.com"})
        self.assertEqual((users["sari@example.com"]["tests"], users["sari@example.com"]["admin"]), (1, False))
        self.assertTrue(users["admin@example.com"]["admin"])
        self.assertNotIn("password_hash", users["sari@example.com"])
        fb, = admin.get("/api/admin/feedback").json()["feedback"]
        self.assertEqual((fb["name"], fb["email"], fb["relevance"], fb["ease"], fb["comment"]),
                         ("Sari Dewi", "sari@example.com", 4, 5, "cocok"))

        self.assertEqual(self.client.get("/api/admin/feedback/export.csv").status_code, 404)   # a student
        self.client.post("/api/feedback", json={"result_id": rid, "relevance": 4, "ease": 5,
                                                "comment": "=HYPERLINK(\"http://x\")"})
        export = admin.get("/api/admin/feedback/export.csv")
        self.assertIn("attachment", export.headers["content-disposition"])
        text = export.content.decode("utf-8")
        self.assertTrue(text.startswith("﻿"))                   # Excel reads it as UTF-8
        header, row = list(csv.reader(io.StringIO(text.lstrip("﻿"))))
        self.assertEqual(header[:3], ["Tanggal (WIB)", "Nama", "Email"])
        self.assertEqual(row[1:3], ["Sari Dewi", "sari@example.com"])
        self.assertEqual(row[-1], "'=HYPERLINK(\"http://x\")")       # not run as a formula

    def test_admin_reset_password_signs_the_student_out(self):
        admin = self.admin_client()
        self.register()
        uid = self.client.get("/api/state").json()["user"]["id"]
        self.assertEqual(admin.post("/api/admin/users/tidak-ada/password", json={}).status_code, 404)
        issued = admin.post(f"/api/admin/users/{uid}/password", json={}).json()
        self.assertEqual(issued["email"], "sari@example.com")
        self.assertGreaterEqual(len(issued["password"]), 8)
        self.assertIsNone(self.client.get("/api/state").json()["user"])            # signed out everywhere
        old = {"email": "sari@example.com", "password": "rahasia-123"}
        self.assertEqual(self.client.post("/api/auth/login", json=old).status_code, 401)
        new = {"email": "sari@example.com", "password": issued["password"]}
        self.assertEqual(self.client.post("/api/auth/login", json=new).status_code, 200)

    def mailbox(self):
        """Email switched on, with the messages caught here instead of sent."""
        from unittest import mock
        from crs import mailer
        sent = []
        os.environ["CRS_SITE_URL"] = "https://texin.example/"
        self.addCleanup(os.environ.pop, "CRS_SITE_URL", None)
        patches = [mock.patch.object(mailer, "configured", return_value=True),
                   mock.patch.object(mailer, "send", side_effect=lambda to, subject, text: sent.append((to, text)))]
        for p in patches:
            p.start()
            self.addCleanup(p.stop)
        return sent

    def test_forgot_password_is_off_without_email_settings(self):
        self.assertFalse(self.client.get("/api/config").json()["password_email"])
        self.assertEqual(self.client.post("/api/auth/forgot", json={"email": "sari@example.com"}).status_code, 503)

    def test_forgot_password_sends_a_link_that_works_once(self):
        sent = self.mailbox()
        self.assertTrue(self.client.get("/api/config").json()["password_email"])
        self.register()
        unknown = self.client.post("/api/auth/forgot", json={"email": "tidak@ada.com"})
        known = self.client.post("/api/auth/forgot", json={"email": "Sari@example.com"})
        self.assertEqual(unknown.json(), known.json())             # does not reveal which emails exist
        self.assertEqual([to for to, _ in sent], ["sari@example.com"])
        self.assertIn("https://texin.example/#/reset/", sent[0][1])
        token = re.search(r"#/reset/(\S+)", sent[0][1]).group(1)
        db = sqlite3.connect(self.db)
        self.assertNotEqual(db.execute("SELECT token_hash FROM password_resets").fetchone()[0], token)   # only its hash

        self.assertEqual(self.client.post("/api/auth/reset", json={"token": token, "password": "pendek"}).status_code, 422)
        self.assertEqual(self.client.post("/api/auth/reset", json={"token": "palsu", "password": "baru-sekali-1"}).status_code, 400)
        self.assertEqual(self.client.post("/api/auth/reset", json={"token": token, "password": "baru-sekali-1"}).json(), {"ok": True})
        self.assertIsNone(self.client.get("/api/state").json()["user"])            # signed out everywhere
        self.assertEqual(self.client.post("/api/auth/reset", json={"token": token, "password": "lagi-lagi-12"}).status_code, 400)
        old = {"email": "sari@example.com", "password": "rahasia-123"}
        self.assertEqual(self.client.post("/api/auth/login", json=old).status_code, 401)
        new = {"email": "sari@example.com", "password": "baru-sekali-1"}
        self.assertEqual(self.client.post("/api/auth/login", json=new).status_code, 200)

    def test_only_the_newest_reset_link_works_and_requests_are_limited(self):
        sent = self.mailbox()
        self.register()
        codes = [self.client.post("/api/auth/forgot", json={"email": "sari@example.com"}).status_code for _ in range(4)]
        self.assertEqual(codes, [200, 200, 200, 429])
        first, last = (re.search(r"#/reset/(\S+)", text).group(1) for _, text in (sent[0], sent[-1]))
        self.assertEqual(self.client.post("/api/auth/reset", json={"token": first, "password": "baru-sekali-1"}).status_code, 400)
        self.assertEqual(self.client.post("/api/auth/reset", json={"token": last, "password": "baru-sekali-1"}).status_code, 200)

    def test_change_password_keeps_this_device_and_signs_out_the_others(self):
        self.register()
        import web.app as web_app
        phone = TestClient(web_app.app)
        phone.post("/api/auth/login", json={"email": "sari@example.com", "password": "rahasia-123"})
        self.assertEqual(TestClient(web_app.app).post("/api/auth/password",
                                                      json={"current": "rahasia-123", "password": "baru-sekali-1"}).status_code, 401)
        wrong = self.client.post("/api/auth/password", json={"current": "salah-sekali", "password": "baru-sekali-1"})
        self.assertEqual(wrong.status_code, 400)
        ok = self.client.post("/api/auth/password", json={"current": "rahasia-123", "password": "baru-sekali-1"})
        self.assertEqual(ok.json(), {"ok": True})
        self.assertIsNotNone(self.client.get("/api/state").json()["user"])
        self.assertIsNone(phone.get("/api/state").json()["user"])
        new = {"email": "sari@example.com", "password": "baru-sekali-1"}
        self.assertEqual(phone.post("/api/auth/login", json=new).status_code, 200)

    def test_reset_link_never_takes_its_address_from_the_request(self):
        sent = self.mailbox()
        os.environ.pop("CRS_SITE_URL")                              # forgotten on the host
        self.register()
        self.assertFalse(self.client.get("/api/config").json()["password_email"])
        forged = self.client.post("/api/auth/forgot", json={"email": "sari@example.com"},
                                  headers={"host": "penipu.example"})
        self.assertEqual(forged.status_code, 503)
        self.assertEqual(sent, [])

    def test_limits_hold_across_servers(self):
        """On Vercel each request may reach another server; the count lives in the database."""
        self.register()
        self.client.post("/api/auth/logout")
        import web.app as web_app
        body = {"email": "sari@example.com", "password": "salah-sekali"}
        for _ in range(10):
            web_app._store = None                                    # as if a new server answered
            TestClient(web_app.app).post("/api/auth/login", json=body)
        web_app._store = None
        right = {"email": "sari@example.com", "password": "rahasia-123"}
        self.assertEqual(TestClient(web_app.app).post("/api/auth/login", json=right).status_code, 429)

    def test_security_headers(self):
        for path in ("/", "/static/js/main.js", "/api/config"):
            headers = self.client.get(path).headers
            self.assertEqual(headers["x-frame-options"], "DENY", path)
            self.assertEqual(headers["x-content-type-options"], "nosniff", path)
            self.assertIn("frame-ancestors 'none'", headers["content-security-policy"], path)
            self.assertIn("script-src 'self'", headers["content-security-policy"], path)
        self.assertEqual(self.client.get("/api/config").headers["cache-control"], "no-store")

    def test_nothing_private_is_served(self):
        for path in ("/docs", "/redoc", "/openapi.json", "/.env", "/.env.example", "/README.md",
                     "/web/app.py", "/data/onet_ratings.csv", "/data/crs.sqlite3",
                     "/static/../app.py", "/static/..%2fapp.py", "/static/%2e%2e/%2e%2e/.env"):
            self.assertIn(self.client.get(path).status_code, (404, 400), path)

    def test_page_and_assets_are_served_without_the_wrong_algorithm_name(self):
        page = self.client.get("/")
        self.assertEqual(page.status_code, 200)
        self.assertIn("/static/tailwind.css", page.text)
        self.assertIn("/static/js/main.js", page.text)
        for name in ("js/main.js", "tailwind.css", "img/texin-putih.png", "img/texin-icon.png"):
            self.assertEqual(self.client.get(f"/static/{name}").status_code, 200, name)
        self.assertEqual(self.client.get("/static/js/main.js").headers["cache-control"], "no-cache")
        scripts = sorted((STATIC / "js").rglob("*.js"))
        text = "".join(f.read_text(encoding="utf-8") for f in scripts)
        self.assertNotIn("PageRank", text)
        self.assertIn("Pearson Correlation", text)
        for f in scripts:                                         # every import points at a file that exists
            for target in re.findall(r'from "(\.[^"]+)"', f.read_text(encoding="utf-8")):
                self.assertTrue((f.parent / target).resolve().is_file(), f"{f.name}: {target}")


if __name__ == "__main__":
    unittest.main()
