import uuid
from datetime import datetime, timezone
from typing import Any

from sqlmodel import Session, select

from app.models import Account, AccountCreate, AccountUpdate


def create_account(
    *, session: Session, account_in: AccountCreate, user_id: uuid.UUID
) -> Account:
    db_account = Account.model_validate(account_in, update={"user_id": user_id})
    session.add(db_account)
    session.commit()
    session.refresh(db_account)
    return db_account


def update_account(
    *, session: Session, db_account: Account, account_in: AccountUpdate
) -> Any:
    account_data = account_in.model_dump(exclude_unset=True)
    extra_data = {"updated_at": datetime.now(timezone.utc)}
    db_account.sqlmodel_update(account_data, update=extra_data)
    session.add(db_account)
    session.commit()
    session.refresh(db_account)
    return db_account


def get_account(*, session: Session, account_id: uuid.UUID) -> Account | None:
    statement = select(Account).where(Account.id == account_id)
    return session.exec(statement).first()


def get_accounts(
    *, session: Session, user_id: uuid.UUID, skip: int = 0, limit: int = 100
) -> tuple[list[Account], int]:
    statement = (
        select(Account).where(Account.user_id == user_id).offset(skip).limit(limit)
    )
    accounts = list(session.exec(statement).all())
    count_statement = select(Account).where(Account.user_id == user_id)
    count = len(session.exec(count_statement).all())
    return accounts, count


def delete_account(*, session: Session, account_id: uuid.UUID) -> Account | None:
    statement = select(Account).where(Account.id == account_id)
    account = session.exec(statement).first()
    if account:
        session.delete(account)
        session.commit()
    return account
