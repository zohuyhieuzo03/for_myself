import uuid
from datetime import datetime, timezone
from typing import Any

from sqlmodel import Session, select

from app.models import Income, IncomeCreate, IncomeUpdate


def create_income(
    *, session: Session, income_in: IncomeCreate, user_id: uuid.UUID
) -> Income:
    db_income = Income.model_validate(income_in, update={"user_id": user_id})
    session.add(db_income)
    session.commit()
    session.refresh(db_income)
    return db_income


def update_income(
    *, session: Session, db_income: Income, income_in: IncomeUpdate
) -> Any:
    income_data = income_in.model_dump(exclude_unset=True)
    extra_data = {"updated_at": datetime.now(timezone.utc)}
    db_income.sqlmodel_update(income_data, update=extra_data)
    session.add(db_income)
    session.commit()
    session.refresh(db_income)
    return db_income


def get_income(*, session: Session, income_id: uuid.UUID) -> Income | None:
    statement = select(Income).where(Income.id == income_id)
    return session.exec(statement).first()


def get_incomes(
    *, session: Session, user_id: uuid.UUID, skip: int = 0, limit: int = 100
) -> tuple[list[Income], int]:
    statement = (
        select(Income).where(Income.user_id == user_id).offset(skip).limit(limit)
    )
    incomes = list(session.exec(statement).all())
    count_statement = select(Income).where(Income.user_id == user_id)
    count = len(session.exec(count_statement).all())
    return incomes, count


def delete_income(*, session: Session, income_id: uuid.UUID) -> Income | None:
    statement = select(Income).where(Income.id == income_id)
    income = session.exec(statement).first()
    if income:
        session.delete(income)
        session.commit()
    return income
