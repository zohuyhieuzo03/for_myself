import uuid
from typing import Any

from sqlmodel import Session, select

from app.models import EmailTransaction, EmailTransactionCreate, EmailTransactionUpdate


def create_email_transaction(
    *, session: Session, email_transaction_in: EmailTransactionCreate
) -> EmailTransaction:
    """Create a new email transaction."""
    db_obj = EmailTransaction.model_validate(email_transaction_in)
    session.add(db_obj)
    session.commit()
    session.refresh(db_obj)
    return db_obj


def get_email_transaction(*, session: Session, transaction_id: uuid.UUID) -> EmailTransaction | None:
    """Get an email transaction by ID."""
    statement = select(EmailTransaction).where(EmailTransaction.id == transaction_id)
    return session.exec(statement).first()


def get_email_transactions(
    *, session: Session, gmail_connection_id: uuid.UUID, skip: int = 0, limit: int = 100
) -> list[EmailTransaction]:
    """Get all email transactions for a Gmail connection."""
    statement = (
        select(EmailTransaction)
        .where(EmailTransaction.gmail_connection_id == gmail_connection_id)
        .offset(skip)
        .limit(limit)
        .order_by(EmailTransaction.received_at.desc())
    )
    return session.exec(statement).all()


def get_pending_email_transactions(
    *, session: Session, gmail_connection_id: uuid.UUID, skip: int = 0, limit: int = 100
) -> list[EmailTransaction]:
    """Get pending email transactions for a Gmail connection."""
    statement = (
        select(EmailTransaction)
        .where(
            EmailTransaction.gmail_connection_id == gmail_connection_id,
            EmailTransaction.status == "pending"
        )
        .offset(skip)
        .limit(limit)
        .order_by(EmailTransaction.received_at.desc())
    )
    return session.exec(statement).all()


def update_email_transaction(
    *, session: Session, db_transaction: EmailTransaction, transaction_in: EmailTransactionUpdate
) -> EmailTransaction:
    """Update an email transaction."""
    transaction_data = transaction_in.model_dump(exclude_unset=True)
    for field, value in transaction_data.items():
        setattr(db_transaction, field, value)
    
    session.add(db_transaction)
    session.commit()
    session.refresh(db_transaction)
    return db_transaction


def delete_email_transaction(*, session: Session, transaction_id: uuid.UUID) -> EmailTransaction | None:
    """Delete an email transaction."""
    statement = select(EmailTransaction).where(EmailTransaction.id == transaction_id)
    transaction = session.exec(statement).first()
    if transaction:
        session.delete(transaction)
        session.commit()
    return transaction


def get_email_transaction_by_email_id(
    *, session: Session, email_id: str, gmail_connection_id: uuid.UUID
) -> EmailTransaction | None:
    """Get an email transaction by Gmail email ID."""
    statement = select(EmailTransaction).where(
        EmailTransaction.email_id == email_id,
        EmailTransaction.gmail_connection_id == gmail_connection_id
    )
    return session.exec(statement).first()


def bulk_update_email_transactions(
    *, session: Session, transaction_ids: list[uuid.UUID], updates: EmailTransactionUpdate
) -> list[EmailTransaction]:
    """Bulk update multiple email transactions."""
    statement = select(EmailTransaction).where(EmailTransaction.id.in_(transaction_ids))
    transactions = session.exec(statement).all()
    
    update_data = updates.model_dump(exclude_unset=True)
    for transaction in transactions:
        for field, value in update_data.items():
            setattr(transaction, field, value)
        session.add(transaction)
    
    session.commit()
    for transaction in transactions:
        session.refresh(transaction)
    
    return transactions
