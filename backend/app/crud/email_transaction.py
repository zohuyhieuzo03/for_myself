import uuid
from typing import Any

from datetime import datetime
from sqlmodel import Session, select, func

from app.models import (
    EmailTransaction,
    EmailTransactionCreate,
    EmailTransactionUpdate,
    EmailTxnCategoryAmount,
    EmailTxnMonthlyAmount,
    EmailTxnDashboard,
)


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


def count_email_transactions(
    *, session: Session, gmail_connection_id: uuid.UUID, status: str | None = None
) -> int:
    """Count email transactions for a Gmail connection."""
    statement = select(EmailTransaction).where(EmailTransaction.gmail_connection_id == gmail_connection_id)
    if status:
        statement = statement.where(EmailTransaction.status == status)
    return len(session.exec(statement).all())


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


def get_unseen_email_transactions(
    *, session: Session, gmail_connection_id: uuid.UUID, skip: int = 0, limit: int = 100
) -> list[EmailTransaction]:
    """Get unseen email transactions for a Gmail connection."""
    statement = (
        select(EmailTransaction)
        .where(
            EmailTransaction.gmail_connection_id == gmail_connection_id,
            EmailTransaction.seen == False
        )
        .offset(skip)
        .limit(limit)
        .order_by(EmailTransaction.received_at.desc())
    )
    return session.exec(statement).all()


def count_unseen_email_transactions(
    *, session: Session, gmail_connection_id: uuid.UUID
) -> int:
    """Count unseen email transactions for a Gmail connection."""
    statement = select(EmailTransaction).where(
        EmailTransaction.gmail_connection_id == gmail_connection_id,
        EmailTransaction.seen == False
    )
    return len(session.exec(statement).all())


def mark_email_transaction_as_seen(
    *, session: Session, transaction_id: uuid.UUID
) -> EmailTransaction | None:
    """Mark an email transaction as seen."""
    statement = select(EmailTransaction).where(EmailTransaction.id == transaction_id)
    transaction = session.exec(statement).first()
    if transaction:
        transaction.seen = True
        session.add(transaction)
        session.commit()
        session.refresh(transaction)
    return transaction


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


def get_email_txn_dashboard(
    *,
    session: Session,
    gmail_connection_id: uuid.UUID,
    year: int | None = None,
    month: int | None = None,
) -> EmailTxnDashboard:
    """Aggregate email transactions by category and by month.

    If year and month are provided, filter to that month; otherwise, use all.
    """
    # Base filter
    filters = [EmailTransaction.gmail_connection_id == gmail_connection_id]
    if year is not None and month is not None:
        # Compute first/last day bounds using received_at
        first_day = datetime(year, month, 1)
        next_month = month + 1
        next_year = year + 1 if next_month == 13 else year
        next_month = 1 if next_month == 13 else next_month
        first_day_next = datetime(next_year, next_month, 1)
        filters.append(EmailTransaction.received_at >= first_day)
        filters.append(EmailTransaction.received_at < first_day_next)

    # By category (join to Category name via relationship optional)
    from app.models import Category  # local import to avoid circulars at module import
    category_stmt = (
        select(EmailTransaction.category_id, Category.name, func.sum(EmailTransaction.amount))
        .join(Category, EmailTransaction.category_id == Category.id, isouter=True)
        .where(*filters, EmailTransaction.amount.is_not(None))
        .group_by(EmailTransaction.category_id, Category.name)
    )
    category_rows = session.exec(category_stmt).all()
    by_category: list[EmailTxnCategoryAmount] = []
    for category_id, category_name, total_amount in category_rows:
        by_category.append(
            EmailTxnCategoryAmount(
                category_id=category_id,
                category_name=category_name,
                total_amount=float(total_amount or 0.0),
            )
        )

    # Monthly totals
    monthly_stmt = (
        select(
            func.extract("year", EmailTransaction.received_at).label("year"),
            func.extract("month", EmailTransaction.received_at).label("month"),
            func.sum(EmailTransaction.amount).label("total"),
        )
        .where(*filters, EmailTransaction.amount.is_not(None))
        .group_by("year", "month")
        .order_by("year", "month")
    )
    monthly_rows = session.exec(monthly_stmt).all()
    monthly: list[EmailTxnMonthlyAmount] = []
    for y, m, total in monthly_rows:
        monthly.append(
            EmailTxnMonthlyAmount(
                year=int(y), month=int(m), total_amount=float(total or 0.0)
            )
        )

    return EmailTxnDashboard(by_category=by_category, monthly=monthly)
