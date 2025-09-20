import uuid
from datetime import datetime, timezone
from typing import Any

from sqlmodel import Session, select

from app.models import Transaction, TransactionCreate, TransactionUpdate


def create_transaction(
    *, session: Session, transaction_in: TransactionCreate, user_id: uuid.UUID
) -> Transaction:
    db_transaction = Transaction.model_validate(
        transaction_in, update={"user_id": user_id}
    )
    session.add(db_transaction)
    session.commit()
    session.refresh(db_transaction)
    return db_transaction


def update_transaction(
    *, session: Session, db_transaction: Transaction, transaction_in: TransactionUpdate
) -> Any:
    transaction_data = transaction_in.model_dump(exclude_unset=True)
    extra_data = {"updated_at": datetime.now(timezone.utc)}
    db_transaction.sqlmodel_update(transaction_data, update=extra_data)
    session.add(db_transaction)
    session.commit()
    session.refresh(db_transaction)
    return db_transaction


def get_transaction(
    *, session: Session, transaction_id: uuid.UUID
) -> Transaction | None:
    statement = select(Transaction).where(Transaction.id == transaction_id)
    return session.exec(statement).first()


def get_transactions(
    *, session: Session, user_id: uuid.UUID, skip: int = 0, limit: int = 100
) -> tuple[list[Transaction], int]:
    statement = (
        select(Transaction)
        .where(Transaction.user_id == user_id)
        .offset(skip)
        .limit(limit)
    )
    transactions = list(session.exec(statement).all())
    
    # Eager load category for each transaction
    for transaction in transactions:
        if transaction.category_id:
            session.refresh(transaction, ['category'])
    
    count_statement = select(Transaction).where(Transaction.user_id == user_id)
    count = len(session.exec(count_statement).all())
    return transactions, count


def delete_transaction(
    *, session: Session, transaction_id: uuid.UUID
) -> Transaction | None:
    statement = select(Transaction).where(Transaction.id == transaction_id)
    transaction = session.exec(statement).first()
    if transaction:
        session.delete(transaction)
        session.commit()
    return transaction
