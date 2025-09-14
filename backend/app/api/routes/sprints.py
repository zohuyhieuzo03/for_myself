import uuid
from typing import Any

from fastapi import APIRouter, HTTPException

from app import crud
from app.api.deps import CurrentUser, SessionDep
from app.models import (
    Message,
    SprintCreate,
    SprintDetailPublic,
    SprintPublic,
    SprintsPublic,
    SprintUpdate,
)

router = APIRouter(prefix="/sprints", tags=["sprints"])


@router.get("/", response_model=SprintsPublic)
def read_sprints(
    session: SessionDep, current_user: CurrentUser, skip: int = 0, limit: int = 100
) -> Any:
    """
    Retrieve sprints for current user.
    """
    sprints, count = crud.get_sprints(
        session=session, user_id=current_user.id, skip=skip, limit=limit
    )
    return SprintsPublic(data=sprints, count=count)


@router.post("/", response_model=SprintPublic)
def create_sprint(
    *, session: SessionDep, current_user: CurrentUser, sprint_in: SprintCreate
) -> Any:
    """
    Create new sprint.
    """
    sprint = crud.create_sprint(
        session=session, sprint_in=sprint_in, user_id=current_user.id
    )
    return sprint


@router.patch("/{sprint_id}", response_model=SprintPublic)
def update_sprint(
    *,
    session: SessionDep,
    current_user: CurrentUser,
    sprint_id: uuid.UUID,
    sprint_in: SprintUpdate,
) -> Any:
    """
    Update a sprint.
    """
    db_sprint = crud.get_sprint(session=session, sprint_id=sprint_id)
    if not db_sprint:
        raise HTTPException(
            status_code=404,
            detail="The sprint with this id does not exist in the system",
        )
    if db_sprint.user_id != current_user.id:
        raise HTTPException(
            status_code=403,
            detail="Not enough permissions",
        )
    db_sprint = crud.update_sprint(
        session=session, db_sprint=db_sprint, sprint_in=sprint_in
    )
    return db_sprint


@router.get("/{sprint_id}", response_model=SprintPublic)
def read_sprint(
    *, session: SessionDep, current_user: CurrentUser, sprint_id: uuid.UUID
) -> Any:
    """
    Get a specific sprint by id.
    """
    sprint = crud.get_sprint(session=session, sprint_id=sprint_id)
    if not sprint:
        raise HTTPException(
            status_code=404,
            detail="The sprint with this id does not exist in the system",
        )
    if sprint.user_id != current_user.id:
        raise HTTPException(
            status_code=403,
            detail="Not enough permissions",
        )
    return sprint


@router.get("/{sprint_id}/detail", response_model=SprintDetailPublic)
def read_sprint_detail(
    *, session: SessionDep, current_user: CurrentUser, sprint_id: uuid.UUID
) -> Any:
    """
    Get sprint detail with all related financial data.
    """
    sprint_detail = crud.get_sprint_detail(
        session=session, sprint_id=sprint_id, user_id=current_user.id
    )
    if not sprint_detail:
        raise HTTPException(
            status_code=404,
            detail="The sprint with this id does not exist in the system",
        )
    
    # Convert to SprintDetailPublic format
    return SprintDetailPublic(
        id=sprint_detail["sprint"].id,
        user_id=sprint_detail["sprint"].user_id,
        start_date=sprint_detail["sprint"].start_date,
        end_date=sprint_detail["sprint"].end_date,
        payday_anchor=sprint_detail["sprint"].payday_anchor,
        is_closed=sprint_detail["sprint"].is_closed,
        created_at=sprint_detail["sprint"].created_at,
        updated_at=sprint_detail["sprint"].updated_at,
        incomes=sprint_detail["incomes"],
        transactions=sprint_detail["transactions"],
        allocation_rules=sprint_detail["allocation_rules"],
        accounts=sprint_detail["accounts"],
        categories=sprint_detail["categories"],
        financial_summary=sprint_detail["financial_summary"]
    )


@router.delete("/{sprint_id}", response_model=Message)
def delete_sprint(
    session: SessionDep, current_user: CurrentUser, sprint_id: uuid.UUID
) -> Message:
    """
    Delete a sprint.
    """
    sprint = crud.get_sprint(session=session, sprint_id=sprint_id)
    if not sprint:
        raise HTTPException(status_code=404, detail="Sprint not found")
    if sprint.user_id != current_user.id:
        raise HTTPException(
            status_code=403,
            detail="Not enough permissions",
        )
    crud.delete_sprint(session=session, sprint_id=sprint_id)
    return Message(message="Sprint deleted successfully")
