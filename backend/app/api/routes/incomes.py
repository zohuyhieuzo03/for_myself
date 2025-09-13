import uuid
from typing import Any

from fastapi import APIRouter, HTTPException

from app import crud
from app.api.deps import CurrentUser, SessionDep
from app.models import (
    IncomeCreate,
    IncomePublic,
    IncomesPublic,
    IncomeUpdate,
    Message,
)

router = APIRouter(prefix="/incomes", tags=["incomes"])


@router.get("/", response_model=IncomesPublic)
def read_incomes(
    session: SessionDep, current_user: CurrentUser, skip: int = 0, limit: int = 100
) -> Any:
    """
    Retrieve incomes for current user.
    """
    incomes, count = crud.get_incomes(
        session=session, user_id=current_user.id, skip=skip, limit=limit
    )
    return IncomesPublic(data=incomes, count=count)


@router.post("/", response_model=IncomePublic)
def create_income(
    *, session: SessionDep, current_user: CurrentUser, income_in: IncomeCreate
) -> Any:
    """
    Create new income.
    """
    income = crud.create_income(
        session=session, income_in=income_in, user_id=current_user.id
    )
    return income


@router.patch("/{income_id}", response_model=IncomePublic)
def update_income(
    *,
    session: SessionDep,
    current_user: CurrentUser,
    income_id: uuid.UUID,
    income_in: IncomeUpdate,
) -> Any:
    """
    Update an income.
    """
    db_income = crud.get_income(session=session, income_id=income_id)
    if not db_income:
        raise HTTPException(
            status_code=404,
            detail="The income with this id does not exist in the system",
        )
    if db_income.user_id != current_user.id:
        raise HTTPException(
            status_code=403,
            detail="Not enough permissions",
        )
    db_income = crud.update_income(
        session=session, db_income=db_income, income_in=income_in
    )
    return db_income


@router.get("/{income_id}", response_model=IncomePublic)
def read_income(
    *, session: SessionDep, current_user: CurrentUser, income_id: uuid.UUID
) -> Any:
    """
    Get a specific income by id.
    """
    income = crud.get_income(session=session, income_id=income_id)
    if not income:
        raise HTTPException(
            status_code=404,
            detail="The income with this id does not exist in the system",
        )
    if income.user_id != current_user.id:
        raise HTTPException(
            status_code=403,
            detail="Not enough permissions",
        )
    return income


@router.delete("/{income_id}", response_model=Message)
def delete_income(
    session: SessionDep, current_user: CurrentUser, income_id: uuid.UUID
) -> Message:
    """
    Delete an income.
    """
    income = crud.get_income(session=session, income_id=income_id)
    if not income:
        raise HTTPException(status_code=404, detail="Income not found")
    if income.user_id != current_user.id:
        raise HTTPException(
            status_code=403,
            detail="Not enough permissions",
        )
    crud.delete_income(session=session, income_id=income_id)
    return Message(message="Income deleted successfully")
