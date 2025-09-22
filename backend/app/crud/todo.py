import uuid
from datetime import datetime, timezone
from typing import Any

from sqlmodel import Session, select

from app.models import (
    ChecklistItem,
    ChecklistItemCreate,
    ChecklistItemUpdate,
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


# ========= CHECKLIST ITEM CRUD =========
def create_checklist_item(*, session: Session, checklist_item_in: ChecklistItemCreate, todo_id: uuid.UUID) -> ChecklistItem:
    db_checklist_item = ChecklistItem.model_validate(checklist_item_in, update={"todo_id": todo_id})
    session.add(db_checklist_item)
    session.commit()
    session.refresh(db_checklist_item)
    return db_checklist_item


def update_checklist_item(*, session: Session, db_checklist_item: ChecklistItem, checklist_item_in: ChecklistItemUpdate) -> Any:
    checklist_item_data = checklist_item_in.model_dump(exclude_unset=True)
    extra_data = {"updated_at": datetime.now(timezone.utc)}
    db_checklist_item.sqlmodel_update(checklist_item_data, update=extra_data)
    session.add(db_checklist_item)
    session.commit()
    session.refresh(db_checklist_item)
    return db_checklist_item


def get_checklist_item(*, session: Session, checklist_item_id: uuid.UUID) -> ChecklistItem | None:
    statement = select(ChecklistItem).where(ChecklistItem.id == checklist_item_id)
    checklist_item = session.exec(statement).first()
    return checklist_item


def get_checklist_items_by_todo(
    *, session: Session, todo_id: uuid.UUID
) -> list[ChecklistItem]:
    statement = select(ChecklistItem).where(ChecklistItem.todo_id == todo_id).order_by(ChecklistItem.order_index)
    checklist_items = list(session.exec(statement).all())
    return checklist_items


def delete_checklist_item(*, session: Session, checklist_item_id: uuid.UUID) -> ChecklistItem | None:
    statement = select(ChecklistItem).where(ChecklistItem.id == checklist_item_id)
    checklist_item = session.exec(statement).first()
    if checklist_item:
        session.delete(checklist_item)
        session.commit()
    return checklist_item
