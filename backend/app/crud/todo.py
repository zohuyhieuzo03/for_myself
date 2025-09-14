import uuid
from datetime import datetime, timezone
from typing import Any

from sqlmodel import Session, select

from app.models import (
    Item,
    ItemCreate,
    Todo,
    TodoCreate,
    TodoUpdate,
)


def create_item(*, session: Session, item_in: ItemCreate, owner_id: uuid.UUID) -> Item:
    db_item = Item.model_validate(item_in, update={"owner_id": owner_id})
    session.add(db_item)
    session.commit()
    session.refresh(db_item)
    return db_item


def create_todo(*, session: Session, todo_in: TodoCreate, owner_id: uuid.UUID) -> Todo:
    db_todo = Todo.model_validate(todo_in, update={"owner_id": owner_id})
    session.add(db_todo)
    session.commit()
    session.refresh(db_todo)
    return db_todo


def update_todo(*, session: Session, db_todo: Todo, todo_in: TodoUpdate) -> Any:
    todo_data = todo_in.model_dump(exclude_unset=True)
    extra_data = {"updated_at": datetime.now(timezone.utc)}
    db_todo.sqlmodel_update(todo_data, update=extra_data)
    session.add(db_todo)
    session.commit()
    session.refresh(db_todo)
    return db_todo


def get_todo(*, session: Session, todo_id: uuid.UUID) -> Todo | None:
    statement = select(Todo).where(Todo.id == todo_id)
    session_todo = session.exec(statement).first()
    return session_todo


def get_todos(
    *, session: Session, skip: int = 0, limit: int = 100
) -> tuple[list[Todo], int]:
    statement = select(Todo).offset(skip).limit(limit)
    todos = list(session.exec(statement).all())
    count_statement = select(Todo)
    count = len(session.exec(count_statement).all())
    return todos, count


def delete_todo(*, session: Session, todo_id: uuid.UUID) -> Todo | None:
    statement = select(Todo).where(Todo.id == todo_id)
    todo = session.exec(statement).first()
    if todo:
        session.delete(todo)
        session.commit()
    return todo
