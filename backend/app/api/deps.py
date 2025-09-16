from collections.abc import Generator
from datetime import datetime, timezone
from typing import Annotated
import uuid
import logging
import jwt
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jwt.exceptions import InvalidTokenError
from pydantic import ValidationError
from sqlmodel import Session

from app import crud
from app.core import security
from app.core.config import settings
from app.core.db import engine
from app.models import GmailConnection, TokenPayload, User
from app.services.gmail_service import GmailService
from app.utils import decrypt_token, encrypt_token, is_token_expired, normalize_to_utc

logger = logging.getLogger(__name__)

reusable_oauth2 = OAuth2PasswordBearer(
    tokenUrl=f"{settings.API_V1_STR}/login/access-token"
)


def get_db() -> Generator[Session, None, None]:
    with Session(engine) as session:
        yield session


SessionDep = Annotated[Session, Depends(get_db)]
TokenDep = Annotated[str, Depends(reusable_oauth2)]


def get_current_user(session: SessionDep, token: TokenDep) -> User:
    try:
        payload = jwt.decode(
            token, settings.SECRET_KEY, algorithms=[security.ALGORITHM]
        )
        token_data = TokenPayload(**payload)
    except (InvalidTokenError, ValidationError):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Could not validate credentials",
        )
    user = session.get(User, token_data.sub)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    if not user.is_active:
        raise HTTPException(status_code=400, detail="Inactive user")
    return user


CurrentUser = Annotated[User, Depends(get_current_user)]


def get_current_active_superuser(current_user: CurrentUser) -> User:
    if not current_user.is_superuser:
        raise HTTPException(
            status_code=403, detail="The user doesn't have enough privileges"
        )
    return current_user


def get_valid_gmail_connection_with_token(
    session: SessionDep,
    current_user: CurrentUser,
    connection_id: uuid.UUID,
) -> tuple[GmailConnection, str]:
    """
    Dependency function to get a Gmail connection with valid access token.
    This middleware handles token validation, refresh, and ensures the connection belongs to the user.
    
    Returns:
        tuple[GmailConnection, str]: (connection, valid_access_token)
    """
    
    # Get Gmail connection
    connection = crud.get_gmail_connection(session=session, connection_id=connection_id)
    if not connection or connection.user_id != current_user.id:
        raise HTTPException(status_code=404, detail="Gmail connection not found")
    
    if not connection.is_active:
        raise HTTPException(status_code=400, detail="Gmail connection is not active")
    
    # Decrypt access token
    access_token = decrypt_token(connection.access_token)
    
    # If decryption failed or token missing, try to refresh using refresh token
    if not access_token:
        logger.error(f"Access token is missing for connection {connection.id}")
        refresh_token = decrypt_token(connection.refresh_token)
        if refresh_token:
            gmail_service = GmailService()
            new_tokens = gmail_service.refresh_access_token(refresh_token)
            # Persist refreshed token
            connection.access_token = encrypt_token(new_tokens['access_token'])
            connection.expires_at = (
                normalize_to_utc(datetime.fromisoformat(new_tokens['expires_at']))
                if new_tokens['expires_at'] else None
            )
            connection.last_sync_at = datetime.now(timezone.utc)
            session.add(connection)
            session.commit()
            access_token = new_tokens['access_token']
        else:
            raise HTTPException(status_code=400, detail="Invalid tokens: cannot decrypt or refresh access token")
    
    # Check if token is expired
    if is_token_expired(connection.expires_at):
        # Try to refresh token
        logger.error(f"Access token is expired for connection {connection.id}")
        refresh_token = decrypt_token(connection.refresh_token)
        if refresh_token:
            gmail_service = GmailService()
            new_tokens = gmail_service.refresh_access_token(refresh_token)
            
            # Update connection with new tokens
            connection.access_token = encrypt_token(new_tokens['access_token'])
            connection.expires_at = (
                normalize_to_utc(datetime.fromisoformat(new_tokens['expires_at']))
                if new_tokens['expires_at'] else None
            )
            connection.last_sync_at = datetime.now(timezone.utc)
            
            session.add(connection)
            session.commit()
            
            access_token = new_tokens['access_token']
        else:
            raise HTTPException(status_code=400, detail="Token expired and cannot be refreshed")
    
    return connection, access_token


# Helper function to validate and refresh Gmail connection tokens
# This can be called directly from endpoints that need token validation
