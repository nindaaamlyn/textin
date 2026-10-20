"""texin - find your career. FastAPI back end for the HTML + Tailwind front end in web/static.

    .venv/bin/uvicorn web.app:app --reload      ->  http://127.0.0.1:8000

The questionnaire runs in the browser; the server turns 60 answers into recommendations, keeps
accounts, and keeps each signed-in student's results (Riwayat). Environment variables:
    DATABASE_URL  Postgres address; without it everything goes to a local SQLite file
    ADMIN_TOKEN   password for the feedback export at /api/admin/feedback.csv
"""
import hmac
import os
from pathlib import Path

from fastapi import FastAPI, HTTPException, Request, Response
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel, Field

from crs import accounts, questionnaire, service
from crs.storage import Store

STATIC = Path(__file__).resolve().parent / "static"
ITEMS = questionnaire.items()


def setting(name):
    return os.environ.get(name) or os.environ.get("CRS_" + name)


app = FastAPI(title="texin - find your career")
_store = None


def store():
    """Opened on first use."""
    global _store
    if _store is None:
        _store = Store(setting("DATABASE_URL"))
    return _store


class Answers(BaseModel):
    answers: list[int] = Field(min_length=len(ITEMS), max_length=len(ITEMS))   # item 1..60, each 0..4
    max_job_zone: int | None = Field(default=None, ge=2, le=5)


class Register(BaseModel):
    name: str = Field(min_length=1, max_length=60)
    email: str = Field(max_length=254)
    password: str = Field(min_length=accounts.MIN_PASSWORD, max_length=128)


class Login(BaseModel):
    email: str = Field(max_length=254)
    password: str = Field(max_length=128)
    remember: bool = False


class Progress(BaseModel):
    answers: dict[int, int] = Field(default_factory=dict, max_length=len(ITEMS))   # item number -> 0..4
    pos: int = Field(default=0, ge=0, lt=len(ITEMS))
    plan: int = Field(default=0, ge=0, lt=len(service.EDUCATION_PLANS))


class Feedback(BaseModel):
    result_id: str = Field(max_length=64)   # one of the signed-in student's results
    relevance: int = Field(ge=1, le=5)
    ease: int = Field(ge=1, le=5)
    comment: str | None = Field(default=None, max_length=500)


# ---------------------------------------------------------------- accounts
COOKIE = "texin_session"


def current_user(request: Request):
    """The signed-in user as {id, name, email}, or None."""
    token = request.cookies.get(COOKIE)
    if not token:
        return None
    row = store().get_login_user(accounts.token_hash(token))
    return {"id": row["id"], "name": row["name"], "email": row["email"]} if row else None


def require_user(request: Request):
    user = current_user(request)
    if user is None:
        raise HTTPException(401, "Masuk dulu untuk melanjutkan")
    return user


def _sign_in(request, response, user_id, remember):
    token, hashed = accounts.new_token()
    store().add_login(user_id, hashed, accounts.expiry(remember))
    https = request.url.scheme == "https" or request.headers.get("x-forwarded-proto") == "https"
    response.set_cookie(COOKIE, token, httponly=True, samesite="lax", secure=https, path="/",
                        max_age=accounts.LOGIN_DAYS * 86400 if remember else None)


@app.post("/api/auth/register")
def register(body: Register, request: Request, response: Response):
    name, email = body.name.strip(), accounts.clean_email(body.email)
    if not name:
        raise HTTPException(422, "Nama perlu diisi")
    if email is None:
        raise HTTPException(422, "Alamat email tidak valid")
    user_id = store().create_user(name, email, accounts.hash_password(body.password))
    if user_id is None:
        raise HTTPException(409, "Email ini sudah terdaftar. Silakan masuk.")
    _sign_in(request, response, user_id, remember=True)
    return {"id": user_id, "name": name, "email": email}


@app.post("/api/auth/login")
def login(body: Login, request: Request, response: Response):
    email = accounts.clean_email(body.email) or ""
    if accounts.too_many_failures(email):
        raise HTTPException(429, "Terlalu banyak percobaan. Coba lagi dalam 15 menit.")
    user = store().get_user_by_email(email) if email else None
    if not accounts.check_login(user, body.password):
        accounts.record_failure(email)
        raise HTTPException(401, "Email atau password salah")   # the same message for both, on purpose
    accounts.clear_failures(email)
    _sign_in(request, response, user["id"], body.remember)
    return {"id": user["id"], "name": user["name"], "email": user["email"]}


@app.post("/api/auth/logout")
def logout(request: Request, response: Response):
    token = request.cookies.get(COOKIE)
    if token:
        store().delete_login(accounts.token_hash(token))
    response.delete_cookie(COOKIE, path="/")
    return {"ok": True}


# ---------------------------------------------------------------- Riwayat
@app.get("/api/history")
def history(request: Request):
    user = require_user(request)
    return {"results": [{"id": r["id"], "at": r["created_at"], **r["summary"]}
                        for r in store().list_results(user["id"])]}


@app.get("/api/history/{result_id}")
def history_result(result_id: str, request: Request):
    result = _saved_result(require_user(request), result_id)
    if result is None:
        raise HTTPException(404, "Hasil tidak ditemukan")
    return result


@app.delete("/api/history")
def clear_history(request: Request):
    store().delete_results(require_user(request)["id"])
    return {"ok": True}


def _saved_result(user, result_id):
    """A stored result rebuilt for the result pages, or None when it is not this user's."""
    saved = store().get_result(user["id"], result_id) if result_id else None
    if saved is None:
        return None
    result = service.recommendation({n + 1: v for n, v in enumerate(saved["answers"])}, saved["max_job_zone"])
    return {**result, "result_id": saved["id"], "at": saved["created_at"],
            "feedback_given": store().get_result_feedback(saved["id"]) is not None}


# ---------------------------------------------------------------- what a signed-in student sees on any device
@app.get("/api/state")
def state(request: Request):
    """Who is signed in, the test they are in the middle of, and their latest result."""
    user = current_user(request)
    if user is None:
        return {"user": None, "progress": None, "result": None}
    return {"user": user, "progress": store().get_progress(user["id"]),
            "result": _saved_result(user, store().latest_result_id(user["id"]))}


@app.put("/api/progress")
def put_progress(body: Progress, request: Request):
    user = require_user(request)
    if any(not 1 <= n <= len(ITEMS) or not 0 <= v <= 4 for n, v in body.answers.items()):
        raise HTTPException(422, "Jawaban tidak valid")
    if body.answers:
        store().save_progress(user["id"], {"answers": {str(n): v for n, v in body.answers.items()},
                                           "pos": body.pos, "plan": body.plan})
    else:
        store().delete_progress(user["id"])   # started over
    return {"ok": True}


# ---------------------------------------------------------------- questionnaire
@app.get("/api/config")
def config():
    return {
        "prompt": service.ITEM_PROMPT,
        "responses": questionnaire.RESPONSES,
        "types": [{"type": t, "label": service.RIASEC_LABELS[t], "nickname": service.RIASEC_NICKNAMES[t]}
                  for t in service.RIASEC],
        "items": [{"number": it.number, "type": it.riasec, "text": it.text_id}
                  for it in ITEMS],
        "plans": [{"label": label, "max_job_zone": zone} for label, zone in service.EDUCATION_PLANS.items()],
        "samples": [{"title": c["title"], "description": c["description"], "job_zone_name": c["job_zone_name"]}
                    for c in service.sample_careers()],
        "attribution": service.ATTRIBUTION,
    }


@app.post("/api/recommend")
def recommend(body: Answers, request: Request):
    if any(not 0 <= value <= 4 for value in body.answers):
        raise HTTPException(422, "Setiap jawaban harus antara 0 dan 4")
    result = service.recommendation({n + 1: v for n, v in enumerate(body.answers)}, body.max_job_zone)
    result["result_id"] = None
    result["feedback_given"] = False
    user = current_user(request)
    if user and result["cards"]:
        summary = {"interest": result["profile"][0]["label"],
                   "top": [{"title": c["title"], "match": c["match"]} for c in result["cards"][:3]]}
        latest = store().latest_result(user["id"])
        if latest and latest["answers"] == body.answers and latest["max_job_zone"] == body.max_job_zone:
            # the same test sent again (a double click, or Back then forward): not a new history entry
            result["result_id"] = latest["id"]
            result["feedback_given"] = store().get_result_feedback(latest["id"]) is not None
        else:
            result["result_id"] = store().add_result(user["id"], body.max_job_zone, body.answers, summary)
        store().delete_progress(user["id"])   # the test is finished
    return result


@app.post("/api/feedback")
def post_feedback(body: Feedback, request: Request):
    """Kept with the student's own result."""
    user = require_user(request)
    if store().get_result(user["id"], body.result_id) is None:
        raise HTTPException(404, "Hasil tidak ditemukan")
    store().save_result_feedback(body.result_id, body.relevance, body.ease, (body.comment or "").strip())
    return {"saved": True}


@app.get("/api/occupations/{code}")
def get_occupation(code: str):
    detail = service.occupation_detail(code)
    if detail is None:
        raise HTTPException(404, "Pekerjaan tidak ditemukan")
    return detail


@app.get("/api/network/{code}")
def get_network(code: str):
    graph = service.career_graph(code)
    if graph is None:
        raise HTTPException(404, "Pekerjaan tidak ditemukan")
    return graph


# ---------------------------------------------------------------- data export for the project team
@app.get("/api/admin/feedback.csv")
def export_feedback(token: str = ""):
    expected = setting("ADMIN_TOKEN")
    if not expected or not token or not hmac.compare_digest(token, expected):
        raise HTTPException(404, "Not Found")   # do not reveal that the export exists
    return Response(service.export_feedback(store()), media_type="text/csv; charset=utf-8",
                    headers={"Content-Disposition": 'attachment; filename="feedback.csv"'})


@app.get("/")
def index():
    return FileResponse(STATIC / "index.html", headers={"Cache-Control": "no-cache"})


class FreshStatic(StaticFiles):
    """Static files that browsers re-check on every load (a cheap 304 when unchanged), so a new
    version of the site is never mixed with scripts cached from the old one."""

    async def get_response(self, path, scope):
        response = await super().get_response(path, scope)
        response.headers["Cache-Control"] = "no-cache"
        return response


app.mount("/static", FreshStatic(directory=STATIC), name="static")
