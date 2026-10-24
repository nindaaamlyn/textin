"""Storage for accounts, the test a student is in the middle of, results and feedback.

Two backends behind the same functions:
  - SQLite file (default, data/crs.sqlite3; override with CRS_DB) for local use
  - Postgres, when a DATABASE_URL is given, for hosting where local files do not survive restarts

An account holds a name, an email and a password hash. Each finished test is kept under its
account so the student can see it again (Riwayat), with the feedback given on it.
"""
import json
import os
import secrets
import sqlite3
import tempfile
import threading
from datetime import datetime, timezone
from pathlib import Path

DEFAULT_DB = Path(__file__).resolve().parent.parent / "data" / "crs.sqlite3"

TABLES = [
    """CREATE TABLE IF NOT EXISTS users (
        id            TEXT PRIMARY KEY,
        name          TEXT NOT NULL,
        email         TEXT NOT NULL UNIQUE,
        password_hash TEXT NOT NULL,
        created_at    TEXT NOT NULL
    )""",
    """CREATE TABLE IF NOT EXISTS logins (
        token_hash  TEXT PRIMARY KEY,
        user_id     TEXT NOT NULL REFERENCES users(id),
        created_at  TEXT NOT NULL,
        expires_at  TEXT NOT NULL
    )""",
    """CREATE TABLE IF NOT EXISTS password_resets (
        token_hash  TEXT PRIMARY KEY,
        user_id     TEXT NOT NULL REFERENCES users(id),
        created_at  TEXT NOT NULL,
        expires_at  TEXT NOT NULL
    )""",
    """CREATE TABLE IF NOT EXISTS attempts (
        kind  TEXT NOT NULL,
        key   TEXT NOT NULL,
        at    TEXT NOT NULL
    )""",
    "CREATE INDEX IF NOT EXISTS attempts_by_key ON attempts (kind, key, at)",
    """CREATE TABLE IF NOT EXISTS results (
        id            TEXT PRIMARY KEY,
        user_id       TEXT NOT NULL REFERENCES users(id),
        created_at    TEXT NOT NULL,
        max_job_zone  INTEGER,
        answers       TEXT NOT NULL,
        summary       TEXT NOT NULL
    )""",
    """CREATE TABLE IF NOT EXISTS result_feedback (
        result_id   TEXT PRIMARY KEY REFERENCES results(id),
        relevance   INTEGER NOT NULL,
        ease        INTEGER NOT NULL,
        comment     TEXT,
        created_at  TEXT NOT NULL
    )""",
    """CREATE TABLE IF NOT EXISTS progress (
        user_id     TEXT PRIMARY KEY REFERENCES users(id),
        data        TEXT NOT NULL,
        updated_at  TEXT NOT NULL
    )""",
]


def _now():
    return datetime.now(timezone.utc).isoformat(timespec="seconds")


class Store:
    """Queries are written with '?' placeholders and work on both backends."""

    def __init__(self, database_url=None):
        self.database_url = database_url
        self._lock = threading.Lock()
        self._pg = None
        self._ready_for = None   # SQLite path whose schema has been prepared
        self._fallback = None    # temporary SQLite path, used when the default one is not writable

    @property
    def backend(self):
        return "postgres" if self.database_url else "sqlite"

    # ---- connections
    def sqlite_path(self):
        return Path(os.environ.get("CRS_DB") or self._fallback or DEFAULT_DB)

    def _sqlite(self):
        path = self.sqlite_path()
        try:
            conn = sqlite3.connect(path)
            conn.execute("BEGIN IMMEDIATE")   # takes the write lock: fails here if the file cannot be written
            conn.rollback()
        except sqlite3.OperationalError:
            # Read-only or missing folder on the host: keep the app usable with a temporary file.
            if os.environ.get("CRS_DB") or self._fallback:
                raise
            self._fallback = Path(tempfile.gettempdir()) / "crs.sqlite3"
            return self._sqlite()
        conn.row_factory = sqlite3.Row
        if self._ready_for != path:
            for ddl in TABLES:
                conn.execute(ddl)
            conn.commit()
            self._ready_for = path
        return conn

    def _postgres(self):
        import psycopg
        from psycopg.rows import dict_row
        if self._pg is None or self._pg.closed:
            # prepare_threshold=None: hosted Postgres is often reached through a transaction pooler,
            # which does not support server-side prepared statements.
            self._pg = psycopg.connect(self.database_url, autocommit=True, row_factory=dict_row,
                                       prepare_threshold=None, connect_timeout=15)
            for ddl in TABLES:
                self._pg.execute(ddl)
        return self._pg

    def _run(self, sql, params=(), fetch=None):
        """fetch: None (write), 'one' or 'all'."""
        if self.backend == "sqlite":
            conn = self._sqlite()
            try:
                cur = conn.execute(sql, params)
                rows = cur.fetchone() if fetch == "one" else cur.fetchall() if fetch == "all" else None
                conn.commit()
                return rows
            finally:
                conn.close()
        import psycopg
        with self._lock:
            for attempt in (1, 2):   # a hosted connection can drop while the app is idle: reconnect once
                try:
                    cur = self._postgres().execute(sql.replace("?", "%s"), params)
                    return cur.fetchone() if fetch == "one" else cur.fetchall() if fetch == "all" else None
                except psycopg.OperationalError:
                    if self._pg is not None:
                        self._pg.close()
                    self._pg = None
                    if attempt == 2:
                        raise

    # ---- accounts
    def create_user(self, name, email, password_hash):
        """Return the new user's id, or None when the email is already registered."""
        if self.get_user_by_email(email) is not None:
            return None
        user_id = secrets.token_urlsafe(12)
        try:
            self._run("INSERT INTO users (id, name, email, password_hash, created_at) VALUES (?, ?, ?, ?, ?)",
                      (user_id, name, email, password_hash, _now()))
        except Exception as error:   # two registrations of one email at the same moment
            if type(error).__name__ in ("IntegrityError", "UniqueViolation"):
                return None
            raise
        return user_id

    def get_user_by_email(self, email):
        return self._run("SELECT * FROM users WHERE email = ?", (email,), "one")

    def add_login(self, user_id, token_hash, expires_at):
        self._run("DELETE FROM logins WHERE expires_at < ?", (_now(),))   # tidy up while we are here
        self._run("INSERT INTO logins (token_hash, user_id, created_at, expires_at) VALUES (?, ?, ?, ?)",
                  (token_hash, user_id, _now(), expires_at))

    def get_login_user(self, token_hash):
        """The user behind a login token, or None when it is unknown or expired."""
        return self._run("SELECT users.id, users.name, users.email FROM logins JOIN users ON users.id = logins.user_id "
                         "WHERE logins.token_hash = ? AND logins.expires_at > ?", (token_hash, _now()), "one")

    def delete_login(self, token_hash):
        self._run("DELETE FROM logins WHERE token_hash = ?", (token_hash,))

    def get_user(self, user_id):
        return self._run("SELECT id, name, email FROM users WHERE id = ?", (user_id,), "one")

    def set_password(self, user_id, password_hash, keep_login=None):
        """Replace the password, end every login of this user but `keep_login` (a token hash), and
        cancel any reset link still waiting."""
        self._run("UPDATE users SET password_hash = ? WHERE id = ?", (password_hash, user_id))
        self._run("DELETE FROM logins WHERE user_id = ? AND token_hash != ?", (user_id, keep_login or ""))
        self._run("DELETE FROM password_resets WHERE user_id = ?", (user_id,))

    # ---- "Lupa password": a link sent by email
    def add_password_reset(self, user_id, token_hash, expires_at):
        """Only the newest link of a user works."""
        self._run("DELETE FROM password_resets WHERE expires_at < ? OR user_id = ?", (_now(), user_id))
        self._run("INSERT INTO password_resets (token_hash, user_id, created_at, expires_at) VALUES (?, ?, ?, ?)",
                  (token_hash, user_id, _now(), expires_at))

    def get_password_reset_user(self, token_hash):
        """The user a reset link is for, or None when it is unknown, used or expired."""
        return self._run("SELECT users.id, users.name, users.email FROM password_resets p "
                         "JOIN users ON users.id = p.user_id WHERE p.token_hash = ? AND p.expires_at > ?",
                         (token_hash, _now()), "one")

    # ---- attempts counted against a limit (wrong passwords, reset emails). Kept here rather than in
    # memory, because a hosted site runs on several servers that restart often.
    def count_attempts(self, kind, key, since):
        row = self._run("SELECT COUNT(*) AS n FROM attempts WHERE kind = ? AND key = ? AND at > ?",
                        (kind, key, since), "one")
        return int(row["n"])

    def add_attempt(self, kind, key, forget_before):
        self._run("DELETE FROM attempts WHERE at < ?", (forget_before,))   # tidy up while we are here
        self._run("INSERT INTO attempts (kind, key, at) VALUES (?, ?, ?)", (kind, key, _now()))

    def clear_attempts(self, kind, key):
        self._run("DELETE FROM attempts WHERE kind = ? AND key = ?", (kind, key))

    # ---- what the admin page lists
    def all_users(self):
        """Newest first: [{id, name, email, created_at, tests, last_test}]."""
        rows = self._run("SELECT u.id, u.name, u.email, u.created_at, COUNT(r.id) AS tests, "
                         "MAX(r.created_at) AS last_test FROM users u LEFT JOIN results r ON r.user_id = u.id "
                         "GROUP BY u.id, u.name, u.email, u.created_at ORDER BY u.created_at DESC, u.id", fetch="all")
        return [{"id": r["id"], "name": r["name"], "email": r["email"], "created_at": r["created_at"],
                 "tests": int(r["tests"]), "last_test": r["last_test"]} for r in rows]

    def all_feedback_with_users(self):
        """Every feedback with who gave it and the result it is about, newest first."""
        rows = self._run("SELECT f.result_id, f.created_at, f.relevance, f.ease, f.comment, r.summary, "
                         "u.name, u.email FROM result_feedback f JOIN results r ON r.id = f.result_id "
                         "JOIN users u ON u.id = r.user_id ORDER BY f.created_at DESC, f.result_id", fetch="all")
        return [{"result_id": r["result_id"], "created_at": r["created_at"], "relevance": r["relevance"],
                 "ease": r["ease"], "comment": r["comment"] or "", "name": r["name"], "email": r["email"],
                 "summary": json.loads(r["summary"])} for r in rows]

    # ---- results kept per account (Riwayat)
    def add_result(self, user_id, max_job_zone, answers, summary):
        result_id = secrets.token_urlsafe(12)
        self._run("INSERT INTO results (id, user_id, created_at, max_job_zone, answers, summary) "
                  "VALUES (?, ?, ?, ?, ?, ?)",
                  (result_id, user_id, _now(), max_job_zone, json.dumps(answers), json.dumps(summary)))
        return result_id

    def list_results(self, user_id):
        """Newest first: [{id, created_at, summary}]."""
        rows = self._run("SELECT id, created_at, summary FROM results WHERE user_id = ? "
                         "ORDER BY created_at DESC, id", (user_id,), "all")
        return [{"id": r["id"], "created_at": r["created_at"], "summary": json.loads(r["summary"])} for r in rows]

    def get_result(self, user_id, result_id):
        """One result of this user as {id, created_at, max_job_zone, answers}, or None."""
        r = self._run("SELECT * FROM results WHERE id = ? AND user_id = ?", (result_id, user_id), "one")
        if r is None:
            return None
        return {"id": r["id"], "created_at": r["created_at"], "max_job_zone": r["max_job_zone"],
                "answers": json.loads(r["answers"])}

    def latest_result(self, user_id):
        """The newest result as {id, max_job_zone, answers}, or None."""
        row = self._run("SELECT id, max_job_zone, answers FROM results WHERE user_id = ? "
                        "ORDER BY created_at DESC, id LIMIT 1", (user_id,), "one")
        if row is None:
            return None
        return {"id": row["id"], "max_job_zone": row["max_job_zone"], "answers": json.loads(row["answers"])}

    def latest_result_id(self, user_id):
        row = self._run("SELECT id FROM results WHERE user_id = ? ORDER BY created_at DESC, id LIMIT 1",
                        (user_id,), "one")
        return row["id"] if row else None

    def delete_results(self, user_id):
        self._run("DELETE FROM result_feedback WHERE result_id IN (SELECT id FROM results WHERE user_id = ?)",
                  (user_id,))
        self._run("DELETE FROM results WHERE user_id = ?", (user_id,))

    # ---- feedback on a result, kept with the account's result
    def save_result_feedback(self, result_id, relevance, ease, comment):
        self._run("INSERT INTO result_feedback (result_id, relevance, ease, comment, created_at) "
                  "VALUES (?, ?, ?, ?, ?) ON CONFLICT (result_id) DO UPDATE SET relevance = excluded.relevance, "
                  "ease = excluded.ease, comment = excluded.comment, created_at = excluded.created_at",
                  (result_id, relevance, ease, comment or None, _now()))

    def get_result_feedback(self, result_id):
        return self._run("SELECT * FROM result_feedback WHERE result_id = ?", (result_id,), "one")

    def all_result_feedback(self):
        """Every feedback with its result's summary, oldest first. No names or emails."""
        rows = self._run("SELECT f.result_id, f.created_at, f.relevance, f.ease, f.comment, r.summary "
                         "FROM result_feedback f JOIN results r ON r.id = f.result_id ORDER BY f.created_at, f.result_id",
                         fetch="all")
        return [{"result_id": r["result_id"], "created_at": r["created_at"], "relevance": r["relevance"],
                 "ease": r["ease"], "comment": r["comment"] or "", "summary": json.loads(r["summary"])} for r in rows]

    # ---- the test a student is in the middle of
    def save_progress(self, user_id, data):
        self._run("INSERT INTO progress (user_id, data, updated_at) VALUES (?, ?, ?) "
                  "ON CONFLICT (user_id) DO UPDATE SET data = excluded.data, updated_at = excluded.updated_at",
                  (user_id, json.dumps(data), _now()))

    def get_progress(self, user_id):
        row = self._run("SELECT data FROM progress WHERE user_id = ?", (user_id,), "one")
        return json.loads(row["data"]) if row else None

    def delete_progress(self, user_id):
        self._run("DELETE FROM progress WHERE user_id = ?", (user_id,))
