"""Sending email (the password reset link) through an SMTP account, by default Gmail.

    SMTP_USER       the Gmail address that sends
    SMTP_PASSWORD   its App Password (Google account -> Security -> 2-Step Verification -> App passwords)
    SMTP_HOST, SMTP_PORT   default smtp.gmail.com and 587 (STARTTLS)
    MAIL_FROM       the sender shown; default SMTP_USER

Without SMTP_USER and SMTP_PASSWORD, email is off and "Lupa password" is not offered.
"""
import os
import smtplib
from email.message import EmailMessage
from email.utils import formataddr


def _setting(name, default=None):
    return os.environ.get(name) or os.environ.get("CRS_" + name) or default


def configured():
    return bool(_setting("SMTP_USER") and _setting("SMTP_PASSWORD"))


def send(to, subject, text):
    user = _setting("SMTP_USER")
    message = EmailMessage()
    message["From"] = formataddr(("texin", _setting("MAIL_FROM", user)))
    message["To"] = to
    message["Subject"] = subject
    message.set_content(text)
    with smtplib.SMTP(_setting("SMTP_HOST", "smtp.gmail.com"), int(_setting("SMTP_PORT", "587")), timeout=15) as smtp:
        smtp.starttls()
        # Google shows an App Password in groups of four with spaces; it works without them.
        smtp.login(user, _setting("SMTP_PASSWORD").replace(" ", ""))
        smtp.send_message(message)
