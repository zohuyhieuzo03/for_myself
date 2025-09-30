import uuid
from typing import Any

from fastapi import APIRouter, HTTPException

from app import crud
from app.api.deps import CurrentUser, SessionDep
from app.models import (
    CategoriesPublic,
    CategoryCreate,
    CategoryPublic,
    CategoryUpdate,
    Message,
)

router = APIRouter(prefix="/categories", tags=["categories"])


@router.get("/", response_model=CategoriesPublic)
def read_categories(
    session: SessionDep,
    current_user: CurrentUser,
    skip: int = 0,
    limit: int = 100,
) -> Any:
    """
    Retrieve categories for current user.
    """
    if skip < 0:
        raise HTTPException(status_code=422, detail="skip must be >= 0")
    if limit <= 0:
        raise HTTPException(status_code=422, detail="limit must be > 0")
    
    categories, count = crud.get_categories(
        session=session, user_id=current_user.id, skip=skip, limit=limit
    )
    return CategoriesPublic(data=categories, count=count)


@router.post("/", response_model=CategoryPublic)
def create_category(
    *, session: SessionDep, current_user: CurrentUser, category_in: CategoryCreate
) -> Any:
    """
    Create new category.
    """
    category = crud.create_category(
        session=session, category_in=category_in, user_id=current_user.id
    )
    return category


@router.patch("/{category_id}", response_model=CategoryPublic)
def update_category(
    *,
    session: SessionDep,
    current_user: CurrentUser,
    category_id: uuid.UUID,
    category_in: CategoryUpdate,
) -> Any:
    """
    Update a category.
    """
    db_category = crud.get_category(session=session, category_id=category_id)
    if not db_category:
        raise HTTPException(
            status_code=404,
            detail="The category with this id does not exist in the system",
        )
    if db_category.user_id != current_user.id:
        raise HTTPException(
            status_code=403,
            detail="Not enough permissions",
        )
    db_category = crud.update_category(
        session=session, db_category=db_category, category_in=category_in
    )
    return db_category


@router.get("/{category_id}", response_model=CategoryPublic)
def read_category(
    *, session: SessionDep, current_user: CurrentUser, category_id: uuid.UUID
) -> Any:
    """
    Get a specific category by id.
    """
    category = crud.get_category(session=session, category_id=category_id)
    if not category:
        raise HTTPException(
            status_code=404,
            detail="The category with this id does not exist in the system",
        )
    if category.user_id != current_user.id:
        raise HTTPException(
            status_code=403,
            detail="Not enough permissions",
        )
    return category


@router.delete("/{category_id}", response_model=Message)
def delete_category(
    session: SessionDep, current_user: CurrentUser, category_id: uuid.UUID
) -> Message:
    """
    Delete a category.
    """
    category = crud.get_category(session=session, category_id=category_id)
    if not category:
        raise HTTPException(status_code=404, detail="Category not found")
    if category.user_id != current_user.id:
        raise HTTPException(
            status_code=403,
            detail="Not enough permissions",
        )
    crud.delete_category(session=session, category_id=category_id)
    return Message(message="Category deleted successfully")
