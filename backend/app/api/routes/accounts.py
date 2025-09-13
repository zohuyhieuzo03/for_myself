import uuid
from typing import Any

from fastapi import APIRouter, HTTPException

from app import crud
from app.api.deps import CurrentUser, SessionDep
from app.models import (
    AccountCreate,
    AccountPublic,
    AccountsPublic,
    AccountUpdate,
    Message,
)

router = APIRouter(prefix="/accounts", tags=["accounts"])


@router.get("/", response_model=AccountsPublic)
def read_accounts(
    session: SessionDep, current_user: CurrentUser, skip: int = 0, limit: int = 100
) -> Any:
    """
    Retrieve accounts for current user.
    """
    accounts, count = crud.get_accounts(
        session=session, user_id=current_user.id, skip=skip, limit=limit
    )
    return AccountsPublic(data=accounts, count=count)


@router.post("/", response_model=AccountPublic)
def create_account(
    *, session: SessionDep, current_user: CurrentUser, account_in: AccountCreate
) -> Any:
    """
    Create new account.
    """
    account = crud.create_account(
        session=session, account_in=account_in, user_id=current_user.id
    )
    return account


@router.patch("/{account_id}", response_model=AccountPublic)
def update_account(
    *,
    session: SessionDep,
    current_user: CurrentUser,
    account_id: uuid.UUID,
    account_in: AccountUpdate,
) -> Any:
    """
    Update an account.
    """
    db_account = crud.get_account(session=session, account_id=account_id)
    if not db_account:
        raise HTTPException(
            status_code=404,
            detail="The account with this id does not exist in the system",
        )
    if db_account.user_id != current_user.id:
        raise HTTPException(
            status_code=403,
            detail="Not enough permissions",
        )
    db_account = crud.update_account(
        session=session, db_account=db_account, account_in=account_in
    )
    return db_account


@router.get("/{account_id}", response_model=AccountPublic)
def read_account(
    *, session: SessionDep, current_user: CurrentUser, account_id: uuid.UUID
) -> Any:
    """
    Get a specific account by id.
    """
    account = crud.get_account(session=session, account_id=account_id)
    if not account:
        raise HTTPException(
            status_code=404,
            detail="The account with this id does not exist in the system",
        )
    if account.user_id != current_user.id:
        raise HTTPException(
            status_code=403,
            detail="Not enough permissions",
        )
    return account


@router.delete("/{account_id}", response_model=Message)
def delete_account(
    session: SessionDep, current_user: CurrentUser, account_id: uuid.UUID
) -> Message:
    """
    Delete an account.
    """
    account = crud.get_account(session=session, account_id=account_id)
    if not account:
        raise HTTPException(status_code=404, detail="Account not found")
    if account.user_id != current_user.id:
        raise HTTPException(
            status_code=403,
            detail="Not enough permissions",
        )
    crud.delete_account(session=session, account_id=account_id)
    return Message(message="Account deleted successfully")
