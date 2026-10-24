"""Accounts: checking what a student types, hashing passwords, and login tokens.

Passwords are never stored: only a salted scrypt hash is. A login is a random token kept in an
HttpOnly cookie; the database holds only its SHA-256, so a leaked database cannot be used to log in.
"""
import base64
import hashlib
import hmac
import re
import secrets
from datetime import datetime, timedelta, timezone

SCRYPT_N, SCRYPT_R, SCRYPT_P = 2 ** 14, 8, 1
MIN_PASSWORD = 8
LOGIN_DAYS = 30            # with "Ingat saya"
SHORT_LOGIN_HOURS = 12     # without it; the cookie still survives closing the browser
MAX_FAILURES, FAILURE_WINDOW = 10, 15 * 60   # wrong passwords allowed per email, per 15 minutes
MAX_RESET_EMAILS = 3       # reset links sent per email, per 15 minutes: not a way to flood someone's inbox
RESET_MINUTES = 30         # a reset link works this long, and once
_EMAIL = re.compile(r"^[^@\s]+@[^@\s]+\.[^@\s]+$")


def clean_email(email):
    """Lower-cased, trimmed email, or None when it does not look like one."""
    email = (email or "").strip().lower()
    return email if len(email) <= 254 and _EMAIL.match(email) else None


def hash_password(password):
    salt = secrets.token_bytes(16)
    digest = hashlib.scrypt(password.encode(), salt=salt, n=SCRYPT_N, r=SCRYPT_R, p=SCRYPT_P)
    return "scrypt${}${}${}${}${}".format(SCRYPT_N, SCRYPT_R, SCRYPT_P, base64.b64encode(salt).decode(),
                                         base64.b64encode(digest).decode())


def verify_password(password, stored):
    try:
        _, n, r, p, salt, digest = stored.split("$")
        expected = base64.b64decode(digest)
        actual = hashlib.scrypt(password.encode(), salt=base64.b64decode(salt), n=int(n), r=int(r), p=int(p),
                                dklen=len(expected))
    except (ValueError, AttributeError):
        return False
    return hmac.compare_digest(actual, expected)


# Checked when the email is unknown, so a wrong email takes as long as a wrong password.
_DUMMY_HASH = hash_password(secrets.token_urlsafe(16))


def check_login(user, password):
    """True when the password fits. `user` is a row with password_hash, or None."""
    return verify_password(password, user["password_hash"] if user else _DUMMY_HASH) and user is not None


_READABLE = "abcdefghjkmnpqrstuvwxyz23456789"   # no 0/o, 1/l/i: read out or typed from a screen


def temporary_password(length=10):
    """A new password the admin hands to a student who forgot theirs."""
    return "".join(secrets.choice(_READABLE) for _ in range(length))


def new_token():
    """(token for the cookie, its hash for the database)."""
    token = secrets.token_urlsafe(32)
    return token, token_hash(token)


def token_hash(token):
    return hashlib.sha256(token.encode()).hexdigest()


def login_life(remember):
    return timedelta(days=LOGIN_DAYS) if remember else timedelta(hours=SHORT_LOGIN_HOURS)


def expiry(remember):
    """ISO time after which a login stops working."""
    return (datetime.now(timezone.utc) + login_life(remember)).isoformat(timespec="seconds")


def reset_expiry():
    return (datetime.now(timezone.utc) + timedelta(minutes=RESET_MINUTES)).isoformat(timespec="seconds")


# The limits are counted in the database (`db` is a crs.storage.Store), so they hold on every server.
def _window_start():
    return (datetime.now(timezone.utc) - timedelta(seconds=FAILURE_WINDOW)).isoformat(timespec="seconds")


def too_many_failures(db, email):
    return db.count_attempts("password", email, _window_start()) >= MAX_FAILURES


def record_failure(db, email):
    db.add_attempt("password", email, _window_start())


def clear_failures(db, email):
    db.clear_attempts("password", email)


def too_many_reset_emails(db, email):
    return db.count_attempts("reset-email", email, _window_start()) >= MAX_RESET_EMAILS


def record_reset_email(db, email):
    db.add_attempt("reset-email", email, _window_start())
