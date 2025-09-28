import uuid
from typing import Any

from fastapi import APIRouter, HTTPException
from sqlmodel import func, select

from app.api.deps import CurrentUser, SessionDep
from app.crud import (
    create_checklist_item,
    create_todo,
    delete_checklist_item,
    delete_todo,
    get_checklist_item,
    get_checklist_items_by_todo,
    get_todo_children,
    get_todo_parent,
    get_todos_by_milestone,
    get_todo_milestone,
    update_checklist_item,
    update_todo,
)
from app.models import (
    ChecklistItemCreate,
    ChecklistItemPublic,
    ChecklistItemUpdate,
    ChecklistItemsPublic,
    Message,
    Todo,
    TodoCreate,
    TodoPublic,
    TodosPublic,
    TodoUpdate,
)

router = APIRouter(prefix="/todos", tags=["todos"])


@router.get("/", response_model=TodosPublic)
def read_todos(
    session: SessionDep, 
    current_user: CurrentUser, 
    skip: int = 0, 
    limit: int = 100,
    search: str | None = None
) -> Any:
    """
    Retrieve todos with optional search functionality.
    """

    # Base query conditions
    base_conditions = []
    if not current_user.is_superuser:
        base_conditions.append(Todo.owner_id == current_user.id)
    
    # Add search condition if provided
    if search and search.strip():
        search_term = f"%{search.strip()}%"
        search_condition = (
            Todo.title.ilike(search_term) | 
            Todo.description.ilike(search_term)
        )
        base_conditions.append(search_condition)

    # Build count statement
    count_statement = select(func.count()).select_from(Todo)
    if base_conditions:
        count_statement = count_statement.where(*base_conditions)
    count = session.exec(count_statement).one()

    # Build main query statement
    statement = select(Todo)
    if base_conditions:
        statement = statement.where(*base_conditions)
    statement = statement.offset(skip).limit(limit).order_by(Todo.created_at.desc())
    todos = session.exec(statement).all()

    return TodosPublic(data=todos, count=count)


@router.get("/{id}", response_model=TodoPublic)
def read_todo(session: SessionDep, current_user: CurrentUser, id: uuid.UUID) -> Any:
    """
    Get todo by ID.
    """
    todo = session.get(Todo, id)
    if not todo:
        raise HTTPException(status_code=404, detail="Todo not found")
    if not current_user.is_superuser and (todo.owner_id != current_user.id):
        raise HTTPException(status_code=400, detail="Not enough permissions")
    return todo


@router.post("/", response_model=TodoPublic)
def create_todo_endpoint(
    *, session: SessionDep, current_user: CurrentUser, todo_in: TodoCreate
) -> Any:
    """
    Create new todo.
    """
    todo = create_todo(session=session, todo_in=todo_in, owner_id=current_user.id)
    return todo


@router.put("/{id}", response_model=TodoPublic)
def update_todo_endpoint(
    *,
    session: SessionDep,
    current_user: CurrentUser,
    id: uuid.UUID,
    todo_in: TodoUpdate,
) -> Any:
    """
    Update a todo.
    """
    todo = session.get(Todo, id)
    if not todo:
        raise HTTPException(status_code=404, detail="Todo not found")
    if not current_user.is_superuser and (todo.owner_id != current_user.id):
        raise HTTPException(status_code=400, detail="Not enough permissions")
    todo = update_todo(session=session, db_todo=todo, todo_in=todo_in)
    return todo


@router.delete("/{id}")
def delete_todo_endpoint(
    session: SessionDep, current_user: CurrentUser, id: uuid.UUID
) -> Message:
    """
    Delete a todo.
    """
    todo = session.get(Todo, id)
    if not todo:
        raise HTTPException(status_code=404, detail="Todo not found")
    if not current_user.is_superuser and (todo.owner_id != current_user.id):
        raise HTTPException(status_code=400, detail="Not enough permissions")
    delete_todo(session=session, todo_id=id)
    return Message(message="Todo deleted successfully")


@router.get("/{id}/children", response_model=TodosPublic)
def read_todo_children(session: SessionDep, current_user: CurrentUser, id: uuid.UUID) -> Any:
    """
    Get children (subitems) of a todo.
    """
    todo = session.get(Todo, id)
    if not todo:
        raise HTTPException(status_code=404, detail="Todo not found")
    if not current_user.is_superuser and (todo.owner_id != current_user.id):
        raise HTTPException(status_code=400, detail="Not enough permissions")
    children = get_todo_children(session=session, todo_id=id)
    return TodosPublic(data=children, count=len(children))


@router.get("/{id}/parent", response_model=TodoPublic | None)
def read_todo_parent(session: SessionDep, current_user: CurrentUser, id: uuid.UUID) -> Any:
    """
    Get parent of a todo, if any.
    """
    todo = session.get(Todo, id)
    if not todo:
        raise HTTPException(status_code=404, detail="Todo not found")
    if not current_user.is_superuser and (todo.owner_id != current_user.id):
        raise HTTPException(status_code=400, detail="Not enough permissions")
    parent = get_todo_parent(session=session, todo_id=id)
    return parent


@router.get("/{id}/milestone")
def read_todo_milestone(session: SessionDep, current_user: CurrentUser, id: uuid.UUID) -> Any:
    """
    Get milestone of a todo, if any.
    """
    todo = session.get(Todo, id)
    if not todo:
        raise HTTPException(status_code=404, detail="Todo not found")
    if not current_user.is_superuser and (todo.owner_id != current_user.id):
        raise HTTPException(status_code=400, detail="Not enough permissions")
    milestone = get_todo_milestone(session=session, todo_id=id)
    return milestone


# ========= CHECKLIST ITEM ENDPOINTS =========
@router.get("/{todo_id}/checklist", response_model=ChecklistItemsPublic)
def read_checklist_items(
    session: SessionDep, current_user: CurrentUser, todo_id: uuid.UUID
) -> Any:
    """
    Get checklist items for a todo.
    """
    # First verify the todo exists and user has access
    todo = session.get(Todo, todo_id)
    if not todo:
        raise HTTPException(status_code=404, detail="Todo not found")
    if not current_user.is_superuser and (todo.owner_id != current_user.id):
        raise HTTPException(status_code=400, detail="Not enough permissions")
    
    checklist_items = get_checklist_items_by_todo(session=session, todo_id=todo_id)
    return ChecklistItemsPublic(data=checklist_items, count=len(checklist_items))


@router.post("/{todo_id}/checklist", response_model=ChecklistItemPublic)
def create_checklist_item_endpoint(
    *, session: SessionDep, current_user: CurrentUser, todo_id: uuid.UUID, checklist_item_in: ChecklistItemCreate
) -> Any:
    """
    Create new checklist item for a todo.
    """
    # First verify the todo exists and user has access
    todo = session.get(Todo, todo_id)
    if not todo:
        raise HTTPException(status_code=404, detail="Todo not found")
    if not current_user.is_superuser and (todo.owner_id != current_user.id):
        raise HTTPException(status_code=400, detail="Not enough permissions")
    
    checklist_item = create_checklist_item(session=session, checklist_item_in=checklist_item_in, todo_id=todo_id)
    return checklist_item


@router.put("/checklist/{checklist_item_id}", response_model=ChecklistItemPublic)
def update_checklist_item_endpoint(
    *,
    session: SessionDep,
    current_user: CurrentUser,
    checklist_item_id: uuid.UUID,
    checklist_item_in: ChecklistItemUpdate,
) -> Any:
    """
    Update a checklist item.
    """
    checklist_item = get_checklist_item(session=session, checklist_item_id=checklist_item_id)
    if not checklist_item:
        raise HTTPException(status_code=404, detail="Checklist item not found")
    
    # Verify user has access to the todo
    todo = session.get(Todo, checklist_item.todo_id)
    if not current_user.is_superuser and (todo.owner_id != current_user.id):
        raise HTTPException(status_code=400, detail="Not enough permissions")
    
    checklist_item = update_checklist_item(session=session, db_checklist_item=checklist_item, checklist_item_in=checklist_item_in)
    return checklist_item


@router.delete("/checklist/{checklist_item_id}")
def delete_checklist_item_endpoint(
    session: SessionDep, current_user: CurrentUser, checklist_item_id: uuid.UUID
) -> Message:
    """
    Delete a checklist item.
    """
    checklist_item = get_checklist_item(session=session, checklist_item_id=checklist_item_id)
    if not checklist_item:
        raise HTTPException(status_code=404, detail="Checklist item not found")
    
    # Verify user has access to the todo
    todo = session.get(Todo, checklist_item.todo_id)
    if not current_user.is_superuser and (todo.owner_id != current_user.id):
        raise HTTPException(status_code=400, detail="Not enough permissions")
    
    delete_checklist_item(session=session, checklist_item_id=checklist_item_id)
    return Message(message="Checklist item deleted successfully")
