"""Accounts: checking what a student types, hashing passwords, and login tokens.

Passwords are never stored: only a salted scrypt hash is. A login is a random token kept in an
HttpOnly cookie; the database holds only its SHA-256, so a leaked database cannot be used to log in.
"""
import base64
import hashlib
import hmac
import re
import secrets
import time
from datetime import datetime, timedelta, timezone

SCRYPT_N, SCRYPT_R, SCRYPT_P = 2 ** 14, 8, 1
MIN_PASSWORD = 8
LOGIN_DAYS = 30            # with "Ingat saya"; without it the cookie ends with the browser session
MAX_FAILURES, FAILURE_WINDOW = 10, 15 * 60   # wrong passwords allowed per email, per 15 minutes
_EMAIL = re.compile(r"^[^@\s]+@[^@\s]+\.[^@\s]+$")
_failures = {}             # email -> [time of each recent wrong password]


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


def new_token():
    """(token for the cookie, its hash for the database)."""
    token = secrets.token_urlsafe(32)
    return token, token_hash(token)


def token_hash(token):
    return hashlib.sha256(token.encode()).hexdigest()


def expiry(remember):
    """ISO time after which a login stops working."""
    life = timedelta(days=LOGIN_DAYS) if remember else timedelta(hours=12)
    return (datetime.now(timezone.utc) + life).isoformat(timespec="seconds")


def too_many_failures(email):
    recent = [t for t in _failures.get(email, []) if time.time() - t < FAILURE_WINDOW]
    _failures[email] = recent
    return len(recent) >= MAX_FAILURES


def record_failure(email):
    if len(_failures) > 10_000:   # do not let a flood of made-up emails fill the memory
        for key in [k for k, times in _failures.items() if time.time() - times[-1] >= FAILURE_WINDOW]:
            del _failures[key]
    _failures.setdefault(email, []).append(time.time())


def clear_failures(email=None):
    if email is None:
        _failures.clear()
    else:
        _failures.pop(email, None)
