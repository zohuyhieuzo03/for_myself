import uuid
from typing import Any

from sqlmodel import Session, select

from app.models import GmailConnection, GmailConnectionCreate, GmailConnectionUpdate


def create_gmail_connection(
    *,
    session: Session,
    gmail_connection_in: GmailConnectionCreate,
    user_id: uuid.UUID,
    encrypted_access_token: str,
    encrypted_refresh_token: str,
    expires_at=None,
    last_sync_at=None,
) -> GmailConnection:
    """Create a new Gmail connection for a user with required encrypted tokens."""
    db_obj = GmailConnection.model_validate(
        gmail_connection_in,
        update={
            "user_id": user_id,
            "access_token": encrypted_access_token,
            "refresh_token": encrypted_refresh_token,
            "expires_at": expires_at,
            "last_sync_at": last_sync_at,
        },
    )
    session.add(db_obj)
    session.commit()
    session.refresh(db_obj)
    return db_obj


def get_gmail_connection(*, session: Session, connection_id: uuid.UUID) -> GmailConnection | None:
    """Get a Gmail connection by ID."""
    statement = select(GmailConnection).where(GmailConnection.id == connection_id)
    return session.exec(statement).first()


def get_gmail_connections(
    *, session: Session, user_id: uuid.UUID, skip: int = 0, limit: int = 100
) -> list[GmailConnection]:
    """Get all Gmail connections for a user."""
    statement = (
        select(GmailConnection)
        .where(GmailConnection.user_id == user_id)
        .offset(skip)
        .limit(limit)
    )
    return session.exec(statement).all()


def update_gmail_connection(
    *, session: Session, db_connection: GmailConnection, connection_in: GmailConnectionUpdate
) -> GmailConnection:
    """Update a Gmail connection."""
    connection_data = connection_in.model_dump(exclude_unset=True)
    for field, value in connection_data.items():
        setattr(db_connection, field, value)
    
    session.add(db_connection)
    session.commit()
    session.refresh(db_connection)
    return db_connection


def delete_gmail_connection(*, session: Session, connection_id: uuid.UUID) -> GmailConnection | None:
    """Delete a Gmail connection."""
    statement = select(GmailConnection).where(GmailConnection.id == connection_id)
    connection = session.exec(statement).first()
    if connection:
        session.delete(connection)
        session.commit()
    return connection


def get_active_gmail_connection(*, session: Session, user_id: uuid.UUID) -> GmailConnection | None:
    """Get the active Gmail connection for a user."""
    statement = select(GmailConnection).where(
        GmailConnection.user_id == user_id,
        GmailConnection.is_active == True
    )
    return session.exec(statement).first()
