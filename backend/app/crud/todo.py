import uuid
from datetime import date, datetime, timezone
from typing import Any

from sqlmodel import Session, select, func

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
    *, session: Session, owner_id: uuid.UUID, skip: int = 0, limit: int = 100
) -> tuple[list[Todo], int]:
    statement = select(Todo).where(Todo.owner_id == owner_id).offset(skip).limit(limit)
    todos = list(session.exec(statement).all())
    count_statement = select(func.count()).select_from(Todo).where(Todo.owner_id == owner_id)
    count = session.exec(count_statement).one()
    return todos, count


def delete_todo(*, session: Session, todo_id: uuid.UUID) -> Todo | None:
    statement = select(Todo).where(Todo.id == todo_id)
    todo = session.exec(statement).first()
    if todo:
        session.delete(todo)
        session.commit()
    return todo


# ========= PARENT / CHILD QUERIES =========
def get_todo_children(*, session: Session, todo_id: uuid.UUID, owner_id: uuid.UUID) -> list[Todo]:
    statement = select(Todo).where(
        Todo.parent_id == todo_id,
        Todo.owner_id == owner_id
    ).order_by(Todo.created_at)
    children = list(session.exec(statement).all())
    return children


def get_todo_parent(*, session: Session, todo_id: uuid.UUID, owner_id: uuid.UUID) -> Todo | None:
    statement = select(Todo).where(Todo.id == todo_id)
    todo = session.exec(statement).first()
    if not todo:
        return None
    if todo.parent_id is None:
        return None
    parent_statement = select(Todo).where(
        Todo.id == todo.parent_id,
        Todo.owner_id == owner_id
    )
    parent = session.exec(parent_statement).first()
    return parent


# ========= MILESTONE QUERIES =========
def get_todos_by_milestone(*, session: Session, milestone_id: uuid.UUID, owner_id: uuid.UUID) -> list[Todo]:
    statement = select(Todo).where(
        Todo.milestone_id == milestone_id,
        Todo.owner_id == owner_id
    ).order_by(Todo.created_at)
    todos = list(session.exec(statement).all())
    return todos


def get_todo_milestone(*, session: Session, todo_id: uuid.UUID) -> Any | None:
    statement = select(Todo).where(Todo.id == todo_id)
    todo = session.exec(statement).first()
    if not todo:
        return None
    if todo.milestone_id is None:
        return None
    from app.models import RoadmapMilestone
    milestone = session.get(RoadmapMilestone, todo.milestone_id)
    return milestone


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


# ========= DAILY SCHEDULING =========
def get_todos_for_date(
    *, session: Session, owner_id: uuid.UUID, target_date: date
) -> list[Todo]:
    """Get all todos scheduled for a specific date"""
    statement = (
        select(Todo)
        .where(Todo.owner_id == owner_id)
        .where(Todo.scheduled_date == target_date)
        .where(Todo.status.in_(["todo", "doing", "planning"]))  # Only active statuses
        .order_by(Todo.priority.desc(), Todo.created_at.asc())
    )
    todos = list(session.exec(statement).all())
    return todos


def get_overdue_todos(*, session: Session, owner_id: uuid.UUID) -> list[Todo]:
    """Get todos that are overdue (scheduled for previous dates and not done/archived)"""
    today = date.today()
    statement = (
        select(Todo)
        .where(Todo.owner_id == owner_id)
        .where(Todo.scheduled_date < today)
        .where(Todo.status.in_(["todo", "doing", "planning"]))
        .order_by(Todo.scheduled_date.desc(), Todo.priority.desc())
    )
    todos = list(session.exec(statement).all())
    return todos


def schedule_todo_for_date(
    *, session: Session, todo_id: uuid.UUID, target_date: date
) -> Todo | None:
    """Schedule a todo for a specific date"""
    todo = session.get(Todo, todo_id)
    if not todo:
        return None
    
    todo.scheduled_date = target_date
    todo.updated_at = datetime.now(timezone.utc)
    session.add(todo)
    session.commit()
    session.refresh(todo)
    return todo


def rollover_overdue_todos(*, session: Session, owner_id: uuid.UUID) -> list[Todo]:
    """Roll over overdue todos to today"""
    overdue_todos = get_overdue_todos(session=session, owner_id=owner_id)
    today = date.today()
    
    for todo in overdue_todos:
        todo.scheduled_date = today
        todo.updated_at = datetime.now(timezone.utc)
        session.add(todo)
    
    session.commit()
    for todo in overdue_todos:
        session.refresh(todo)
    return overdue_todos


def get_daily_schedule_summary(
    *, session: Session, owner_id: uuid.UUID, days: int = 7
) -> dict[date, int]:
    """Get summary of scheduled todos for the next N days"""
    from datetime import timedelta
    
    today = date.today()
    end_date = today + timedelta(days=days)
    
    statement = (
        select(Todo.scheduled_date, func.count(Todo.id))
        .where(Todo.owner_id == owner_id)
        .where(Todo.scheduled_date >= today)
        .where(Todo.scheduled_date <= end_date)
        .where(Todo.status.in_(["todo", "doing", "planning"]))
        .group_by(Todo.scheduled_date)
    )
    
    result = session.exec(statement).all()
    return {row[0]: row[1] for row in result}
