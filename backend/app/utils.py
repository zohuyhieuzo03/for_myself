import logging
from dataclasses import dataclass
from datetime import datetime, timedelta, timezone, date
from pathlib import Path
from typing import Any

import emails  # type: ignore
import jwt
from jinja2 import Template
from jwt.exceptions import InvalidTokenError

from app.core import security
from app.core.config import settings
from zoneinfo import ZoneInfo

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


# ========= MONTH UTILITIES =========
def get_month_from_date(date_obj: date) -> tuple[int, int]:
    """
    Extract year and month from a date object.
    
    Args:
        date_obj: The date to extract year and month from
        
    Returns:
        Tuple of (year, month)
    """
    return date_obj.year, date_obj.month


def create_month_key(year: int, month: int) -> str:
    """
    Create a unique key for a month.
    
    Args:
        year: The year
        month: The month (1-12)
        
    Returns:
        String key in format "YYYY-MM"
    """
    return f"{year}-{month:02d}"


def get_month_key_from_date(date_obj: date) -> str:
    """
    Get month key from a date object.
    
    Args:
        date_obj: The date to get month key from
        
    Returns:
        String key in format "YYYY-MM"
    """
    year, month = get_month_from_date(date_obj)
    return create_month_key(year, month)


# ========= VALIDATION UTILITIES =========
def convert_empty_string_to_none(v: Any) -> Any:
    """
    Convert empty string to None for optional UUID fields.
    
    This utility function is used in Pydantic field validators to handle
    empty strings from frontend forms and convert them to None for optional
    database fields.
    
    Args:
        v: The value to validate (usually a string or UUID)
        
    Returns:
        None if v is empty string, otherwise returns v unchanged
    """
    if v == "":
        return None
    return v


@dataclass
class EmailData:
    html_content: str
    subject: str


def render_email_template(*, template_name: str, context: dict[str, Any]) -> str:
    template_str = (
        Path(__file__).parent / "email-templates" / "build" / template_name
    ).read_text()
    html_content = Template(template_str).render(context)
    return html_content


def send_email(
    *,
    email_to: str,
    subject: str = "",
    html_content: str = "",
) -> None:
    assert settings.emails_enabled, "no provided configuration for email variables"
    message = emails.Message(
        subject=subject,
        html=html_content,
        mail_from=(settings.EMAILS_FROM_NAME, settings.EMAILS_FROM_EMAIL),
    )
    smtp_options = {"host": settings.SMTP_HOST, "port": settings.SMTP_PORT}
    if settings.SMTP_TLS:
        smtp_options["tls"] = True
    elif settings.SMTP_SSL:
        smtp_options["ssl"] = True
    if settings.SMTP_USER:
        smtp_options["user"] = settings.SMTP_USER
    if settings.SMTP_PASSWORD:
        smtp_options["password"] = settings.SMTP_PASSWORD
    response = message.send(to=email_to, smtp=smtp_options)
    logger.info(f"send email result: {response}")


def generate_test_email(email_to: str) -> EmailData:
    project_name = settings.PROJECT_NAME
    subject = f"{project_name} - Test email"
    html_content = render_email_template(
        template_name="test_email.html",
        context={"project_name": settings.PROJECT_NAME, "email": email_to},
    )
    return EmailData(html_content=html_content, subject=subject)


def generate_reset_password_email(email_to: str, email: str, token: str) -> EmailData:
    project_name = settings.PROJECT_NAME
    subject = f"{project_name} - Password recovery for user {email}"
    link = f"{settings.FRONTEND_HOST}/reset-password?token={token}"
    html_content = render_email_template(
        template_name="reset_password.html",
        context={
            "project_name": settings.PROJECT_NAME,
            "username": email,
            "email": email_to,
            "valid_hours": settings.EMAIL_RESET_TOKEN_EXPIRE_HOURS,
            "link": link,
        },
    )
    return EmailData(html_content=html_content, subject=subject)


def generate_new_account_email(
    email_to: str, username: str, password: str
) -> EmailData:
    project_name = settings.PROJECT_NAME
    subject = f"{project_name} - New account for user {username}"
    html_content = render_email_template(
        template_name="new_account.html",
        context={
            "project_name": settings.PROJECT_NAME,
            "username": username,
            "password": password,
            "email": email_to,
            "link": settings.FRONTEND_HOST,
        },
    )
    return EmailData(html_content=html_content, subject=subject)


def generate_password_reset_token(email: str) -> str:
    delta = timedelta(hours=settings.EMAIL_RESET_TOKEN_EXPIRE_HOURS)
    now = datetime.now(timezone.utc)
    expires = now + delta
    exp = expires.timestamp()
    encoded_jwt = jwt.encode(
        {"exp": exp, "nbf": now, "sub": email},
        settings.SECRET_KEY,
        algorithm=security.ALGORITHM,
    )
    return encoded_jwt


def verify_password_reset_token(token: str) -> str | None:
    try:
        decoded_token = jwt.decode(
            token, settings.SECRET_KEY, algorithms=[security.ALGORITHM]
        )
        return str(decoded_token["sub"])
    except InvalidTokenError:
        return None


# ========= GMAIL INTEGRATION UTILITIES =========
def encrypt_token(token: str) -> str:
    """Encrypt a token for secure storage."""
    from cryptography.fernet import Fernet
    import base64
    
    # Create a Fernet cipher with the encryption key
    key_bytes = settings.GMAIL_ENCRYPTION_KEY.encode()[:32].ljust(32, b'0')
    key = base64.urlsafe_b64encode(key_bytes)
    cipher = Fernet(key)
    
    # Encrypt the token
    encrypted_token = cipher.encrypt(token.encode())
    return base64.urlsafe_b64encode(encrypted_token).decode()


def decrypt_token(encrypted_token: str) -> str:
    """Decrypt a token from storage."""
    from cryptography.fernet import Fernet
    import base64
    
    try:
        # Create a Fernet cipher with the encryption key
        key_bytes = settings.GMAIL_ENCRYPTION_KEY.encode()[:32].ljust(32, b'0')
        key = base64.urlsafe_b64encode(key_bytes)
        cipher = Fernet(key)
        
        # Decode and decrypt the token
        encrypted_data = base64.urlsafe_b64decode(encrypted_token.encode())
        decrypted_token = cipher.decrypt(encrypted_data)
        return decrypted_token.decode()
    except Exception:
        return ""


def normalize_to_utc(dt: datetime | None) -> datetime | None:
    """Return a timezone-aware UTC datetime for reliable comparisons."""
    if dt is None:
        return None
    if dt.tzinfo is None:
        return dt.replace(tzinfo=timezone.utc)
    return dt.astimezone(timezone.utc)


def is_token_expired(expires_at: datetime | None) -> bool:
    """Check if a token is expired.

    - If expires_at is naive, assume it's in Vietnam time (Asia/Ho_Chi_Minh)
      then convert to UTC for a correct comparison with current UTC time.
    - If it's timezone-aware, convert to UTC.
    """
    if expires_at is None:
        return True

    if expires_at.tzinfo is None:
        try:
            vn_tz = ZoneInfo("Asia/Ho_Chi_Minh")
            expires_utc = expires_at.replace(tzinfo=vn_tz).astimezone(timezone.utc)
        except Exception:
            # Fallback: treat naive as UTC
            expires_utc = expires_at.replace(tzinfo=timezone.utc)
    else:
        expires_utc = expires_at.astimezone(timezone.utc)

    now_utc = datetime.now(timezone.utc)
    return now_utc >= expires_utc
