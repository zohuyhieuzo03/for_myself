import uuid
from datetime import datetime, timezone
from typing import Any

from sqlmodel import Session, select

from app.models import Category, CategoryCreate, CategoryUpdate


def create_category(
    *, session: Session, category_in: CategoryCreate, user_id: uuid.UUID
) -> Category:
    db_category = Category.model_validate(category_in, update={"user_id": user_id})
    session.add(db_category)
    session.commit()
    session.refresh(db_category)
    return db_category


def update_category(
    *, session: Session, db_category: Category, category_in: CategoryUpdate
) -> Any:
    category_data = category_in.model_dump(exclude_unset=True)
    extra_data = {"updated_at": datetime.now(timezone.utc)}
    db_category.sqlmodel_update(category_data, update=extra_data)
    session.add(db_category)
    session.commit()
    session.refresh(db_category)
    return db_category


def get_category(*, session: Session, category_id: uuid.UUID) -> Category | None:
    statement = select(Category).where(Category.id == category_id)
    return session.exec(statement).first()


def get_categories(
    *, session: Session, user_id: uuid.UUID, skip: int = 0, limit: int = 100
) -> tuple[list[Category], int]:
    statement = (
        select(Category).where(Category.user_id == user_id).offset(skip).limit(limit)
    )
    categories = list(session.exec(statement).all())
    count_statement = select(Category).where(Category.user_id == user_id)
    count = len(session.exec(count_statement).all())
    return categories, count


def delete_category(*, session: Session, category_id: uuid.UUID) -> Category | None:
    statement = select(Category).where(Category.id == category_id)
    category = session.exec(statement).first()
    if category:
        session.delete(category)
        session.commit()
    return category
