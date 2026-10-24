"""Storage behaves the same on SQLite and Postgres.

The Postgres half runs only when TEST_DATABASE_URL points at a scratch database, for example:
    TEST_DATABASE_URL=postgresql://localhost:54329/postgres .venv/bin/python -m unittest tests.test_storage
"""
import json
import os
import secrets
import tempfile
import unittest

from crs import service
from crs.storage import Store

SUMMARY = {"interest": "Sosial (Membantu Orang)", "top": [{"title": "Guru", "match": 97}]}


class StorageContract:
    def new_user(self, name="Sari"):
        email = f"{secrets.token_hex(6)}@example.com"      # unique, so the Postgres run can be repeated
        return self.store.create_user(name, email, "scrypt$hash"), email

    def test_accounts_and_logins(self):
        store = self.store
        uid, email = self.new_user()
        self.assertIsNone(store.create_user("Lain", email, "x"))          # the email is taken
        self.assertEqual(store.get_user_by_email(email)["id"], uid)
        self.assertIsNone(store.get_user_by_email("tidak@ada.com"))

        store.add_login(uid, "hash-baru", "2999-01-01T00:00:00+00:00")
        store.add_login(uid, "hash-lama", "2000-01-01T00:00:00+00:00")
        user = store.get_login_user("hash-baru")
        self.assertEqual((user["id"], user["name"], user["email"]), (uid, "Sari", email))
        self.assertIsNone(store.get_login_user("hash-lama"))              # expired
        self.assertIsNone(store.get_login_user("tidak-ada"))
        store.delete_login("hash-baru")
        self.assertIsNone(store.get_login_user("hash-baru"))

    def test_new_password_ends_every_login(self):
        store = self.store
        uid, email = self.new_user()
        store.add_login(uid, "hash-hp", "2999-01-01T00:00:00+00:00")
        store.add_login(uid, "hash-laptop", "2999-01-01T00:00:00+00:00")
        store.set_password(uid, "scrypt$baru")
        self.assertEqual(store.get_user_by_email(email)["password_hash"], "scrypt$baru")
        self.assertIsNone(store.get_login_user("hash-hp"))
        self.assertIsNone(store.get_login_user("hash-laptop"))
        self.assertEqual(store.get_user(uid)["email"], email)
        self.assertIsNone(store.get_user("tidak-ada"))

        store.add_login(uid, "hash-ini", "2999-01-01T00:00:00+00:00")
        store.add_login(uid, "hash-lain", "2999-01-01T00:00:00+00:00")
        store.set_password(uid, "scrypt$lagi", keep_login="hash-ini")
        self.assertIsNotNone(store.get_login_user("hash-ini"))
        self.assertIsNone(store.get_login_user("hash-lain"))

    def test_reset_links_expire_are_replaced_and_used_up(self):
        store = self.store
        uid, email = self.new_user()
        store.add_password_reset(uid, "link-lama", "2999-01-01T00:00:00+00:00")
        store.add_password_reset(uid, "link-baru", "2999-01-01T00:00:00+00:00")
        self.assertIsNone(store.get_password_reset_user("link-lama"))       # only the newest one works
        self.assertEqual(store.get_password_reset_user("link-baru")["email"], email)
        store.set_password(uid, "scrypt$baru")
        self.assertIsNone(store.get_password_reset_user("link-baru"))       # a new password uses it up
        store.add_password_reset(uid, "link-basi", "2000-01-01T00:00:00+00:00")
        self.assertIsNone(store.get_password_reset_user("link-basi"))       # expired

    def test_admin_lists_users_and_feedback(self):
        store = self.store
        uid, email = self.new_user()
        quiet, _ = self.new_user("Budi")
        first = store.add_result(uid, None, [1] * 60, SUMMARY)
        store.add_result(uid, None, [2] * 60, SUMMARY)
        store.save_result_feedback(first, 4, 5, "jelas")
        users = {u["id"]: u for u in store.all_users()}
        self.assertEqual((users[uid]["tests"], users[uid]["email"]), (2, email))
        self.assertIsNotNone(users[uid]["last_test"])
        self.assertEqual((users[quiet]["tests"], users[quiet]["last_test"]), (0, None))
        fb = next(f for f in store.all_feedback_with_users() if f["result_id"] == first)
        self.assertEqual((fb["name"], fb["email"], fb["relevance"], fb["ease"], fb["comment"]),
                         ("Sari", email, 4, 5, "jelas"))
        self.assertEqual(fb["summary"], SUMMARY)

    def test_export_keeps_ids_and_defuses_formulas(self):
        uid, _ = self.new_user()
        rid = "-" + secrets.token_hex(6)                                # random ids may start with "-"
        self.store._run("INSERT INTO results (id, user_id, created_at, max_job_zone, answers, summary) "
                        "VALUES (?, ?, ?, ?, ?, ?)",
                        (rid, uid, "2026-01-01T00:00:00+00:00", None, json.dumps([1] * 60), json.dumps(SUMMARY)))
        self.store.save_result_feedback(rid, 3, 3, "=1+1")
        line = next(l for l in service.export_feedback(self.store).splitlines() if l.startswith(rid))
        self.assertTrue(line.endswith(",'=1+1"), line)

    def test_attempts_are_counted_per_kind_and_key(self):
        store = self.store
        key = secrets.token_hex(6)
        for _ in range(3):
            store.add_attempt("password", key, "2000-01-01T00:00:00+00:00")
        store.add_attempt("reset-email", key, "2000-01-01T00:00:00+00:00")
        self.assertEqual(store.count_attempts("password", key, "2000-01-01T00:00:00+00:00"), 3)
        self.assertEqual(store.count_attempts("password", key, "2999-01-01T00:00:00+00:00"), 0)   # all older
        store.clear_attempts("password", key)
        self.assertEqual(store.count_attempts("password", key, "2000-01-01T00:00:00+00:00"), 0)
        self.assertEqual(store.count_attempts("reset-email", key, "2000-01-01T00:00:00+00:00"), 1)

    def test_progress_is_one_per_user_and_replaced(self):
        store = self.store
        uid, _ = self.new_user()
        self.assertIsNone(store.get_progress(uid))
        store.save_progress(uid, {"answers": {"1": 3}, "pos": 1, "plan": 0})
        store.save_progress(uid, {"answers": {"1": 3, "2": 0}, "pos": 2, "plan": 4})
        self.assertEqual(store.get_progress(uid), {"answers": {"1": 3, "2": 0}, "pos": 2, "plan": 4})
        store.delete_progress(uid)
        self.assertIsNone(store.get_progress(uid))

    def test_results_and_feedback_belong_to_their_user(self):
        store = self.store
        uid, _ = self.new_user()
        other, _ = self.new_user("Budi")
        self.assertIsNone(store.latest_result(uid))
        answers = [4 if n % 6 == 3 else 1 for n in range(60)]
        first = store.add_result(uid, 4, answers, SUMMARY)
        second = store.add_result(uid, None, answers[::-1], SUMMARY)
        self.assertEqual({r["id"] for r in store.list_results(uid)}, {first, second})
        self.assertEqual(store.list_results(uid)[0]["summary"], SUMMARY)
        self.assertEqual(store.list_results(other), [])
        self.assertEqual(store.get_result(uid, first)["answers"], answers)
        self.assertEqual(store.get_result(uid, first)["max_job_zone"], 4)
        self.assertIsNone(store.get_result(other, first))
        self.assertIn(store.latest_result(uid)["id"], {first, second})
        self.assertEqual(store.latest_result(uid)["id"], store.latest_result_id(uid))

        self.assertIsNone(store.get_result_feedback(first))
        store.save_result_feedback(first, 3, 4, "")
        store.save_result_feedback(first, 5, 4, "bagus")                   # replaces
        fb = store.get_result_feedback(first)
        self.assertEqual((fb["relevance"], fb["ease"], fb["comment"]), (5, 4, "bagus"))
        line = next(l for l in service.export_feedback(store).splitlines() if l.startswith(first))
        self.assertTrue(line.endswith(",Sosial (Membantu Orang),Guru,97,5,4,bagus"), line)

        store.delete_results(other)                                        # someone else clearing theirs
        self.assertEqual(len(store.list_results(uid)), 2)
        store.delete_results(uid)
        self.assertEqual(store.list_results(uid), [])
        self.assertIsNone(store.get_result_feedback(first))


class SqliteStorageTest(StorageContract, unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory()
        os.environ["CRS_DB"] = os.path.join(self.tmp.name, "test.sqlite3")
        self.store = Store()

    def tearDown(self):
        os.environ.pop("CRS_DB", None)
        self.tmp.cleanup()

    def test_backend(self):
        self.assertEqual(self.store.backend, "sqlite")

    def test_falls_back_to_a_temporary_file_when_the_data_folder_is_not_writable(self):
        from crs import storage
        os.environ.pop("CRS_DB")
        original = storage.DEFAULT_DB
        storage.DEFAULT_DB = os.path.join(self.tmp.name, "tidak", "ada", "crs.sqlite3")
        fallback = os.path.join(tempfile.gettempdir(), "crs.sqlite3")
        existed = os.path.exists(fallback)
        try:
            store = Store()
            uid = store.create_user("Sari", f"{secrets.token_hex(6)}@example.com", "x")
            self.assertIsNotNone(uid)
            self.assertEqual(str(store.sqlite_path()), fallback)
        finally:
            storage.DEFAULT_DB = original
            if not existed and os.path.exists(fallback):
                os.remove(fallback)


@unittest.skipUnless(os.environ.get("TEST_DATABASE_URL"), "TEST_DATABASE_URL tidak diisi")
class PostgresStorageTest(StorageContract, unittest.TestCase):
    def setUp(self):
        self.store = Store(os.environ["TEST_DATABASE_URL"])

    def test_backend(self):
        self.assertEqual(self.store.backend, "postgres")

    def test_reconnects_after_the_connection_drops(self):
        uid, email = self.new_user()
        self.store._pg.close()                                  # what an idle hosted connection looks like
        self.assertEqual(self.store.get_user_by_email(email)["id"], uid)


if __name__ == "__main__":
    unittest.main()
