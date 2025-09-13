import uuid
from typing import Any

from fastapi import APIRouter, HTTPException

from app import crud
from app.api.deps import CurrentUser, SessionDep
from app.models import (
    Message,
    TransactionCreate,
    TransactionPublic,
    TransactionsPublic,
    TransactionUpdate,
)

router = APIRouter(prefix="/transactions", tags=["transactions"])


@router.get("/", response_model=TransactionsPublic)
def read_transactions(
    session: SessionDep, current_user: CurrentUser, skip: int = 0, limit: int = 100
) -> Any:
    """
    Retrieve transactions for current user.
    """
    transactions, count = crud.get_transactions(
        session=session, user_id=current_user.id, skip=skip, limit=limit
    )
    return TransactionsPublic(data=transactions, count=count)


@router.post("/", response_model=TransactionPublic)
def create_transaction(
    *, session: SessionDep, current_user: CurrentUser, transaction_in: TransactionCreate
) -> Any:
    """
    Create new transaction.
    """
    transaction = crud.create_transaction(
        session=session, transaction_in=transaction_in, user_id=current_user.id
    )
    return transaction


@router.patch("/{transaction_id}", response_model=TransactionPublic)
def update_transaction(
    *,
    session: SessionDep,
    current_user: CurrentUser,
    transaction_id: uuid.UUID,
    transaction_in: TransactionUpdate,
) -> Any:
    """
    Update a transaction.
    """
    db_transaction = crud.get_transaction(
        session=session, transaction_id=transaction_id
    )
    if not db_transaction:
        raise HTTPException(
            status_code=404,
            detail="The transaction with this id does not exist in the system",
        )
    if db_transaction.user_id != current_user.id:
        raise HTTPException(
            status_code=403,
            detail="Not enough permissions",
        )
    db_transaction = crud.update_transaction(
        session=session, db_transaction=db_transaction, transaction_in=transaction_in
    )
    return db_transaction


@router.get("/{transaction_id}", response_model=TransactionPublic)
def read_transaction(
    *, session: SessionDep, current_user: CurrentUser, transaction_id: uuid.UUID
) -> Any:
    """
    Get a specific transaction by id.
    """
    transaction = crud.get_transaction(session=session, transaction_id=transaction_id)
    if not transaction:
        raise HTTPException(
            status_code=404,
            detail="The transaction with this id does not exist in the system",
        )
    if transaction.user_id != current_user.id:
        raise HTTPException(
            status_code=403,
            detail="Not enough permissions",
        )
    return transaction


@router.delete("/{transaction_id}", response_model=Message)
def delete_transaction(
    session: SessionDep, current_user: CurrentUser, transaction_id: uuid.UUID
) -> Message:
    """
    Delete a transaction.
    """
    transaction = crud.get_transaction(session=session, transaction_id=transaction_id)
    if not transaction:
        raise HTTPException(status_code=404, detail="Transaction not found")
    if transaction.user_id != current_user.id:
        raise HTTPException(
            status_code=403,
            detail="Not enough permissions",
        )
    crud.delete_transaction(session=session, transaction_id=transaction_id)
    return Message(message="Transaction deleted successfully")
