import uuid
from typing import Any

from fastapi import APIRouter, HTTPException

from app import crud
from app.api.deps import CurrentUser, SessionDep
from app.models import (
    AllocationRuleCreate,
    AllocationRulePublic,
    AllocationRulesPublic,
    AllocationRuleUpdate,
    Message,
)

router = APIRouter(prefix="/allocation-rules", tags=["allocation-rules"])


@router.get("/", response_model=AllocationRulesPublic)
def read_allocation_rules(
    session: SessionDep, current_user: CurrentUser, skip: int = 0, limit: int = 100
) -> Any:
    """
    Retrieve allocation rules for current user.
    """
    allocation_rules, count = crud.get_allocation_rules(
        session=session, user_id=current_user.id, skip=skip, limit=limit
    )
    return AllocationRulesPublic(data=allocation_rules, count=count)


@router.post("/", response_model=AllocationRulePublic)
def create_allocation_rule(
    *,
    session: SessionDep,
    current_user: CurrentUser,
    allocation_rule_in: AllocationRuleCreate,
) -> Any:
    """
    Create new allocation rule.
    """
    allocation_rule = crud.create_allocation_rule(
        session=session, allocation_rule_in=allocation_rule_in, user_id=current_user.id
    )
    return allocation_rule


@router.patch("/{allocation_rule_id}", response_model=AllocationRulePublic)
def update_allocation_rule(
    *,
    session: SessionDep,
    current_user: CurrentUser,
    allocation_rule_id: uuid.UUID,
    allocation_rule_in: AllocationRuleUpdate,
) -> Any:
    """
    Update an allocation rule.
    """
    db_allocation_rule = crud.get_allocation_rule(
        session=session, allocation_rule_id=allocation_rule_id
    )
    if not db_allocation_rule:
        raise HTTPException(
            status_code=404,
            detail="The allocation rule with this id does not exist in the system",
        )
    if db_allocation_rule.user_id != current_user.id:
        raise HTTPException(
            status_code=403,
            detail="Not enough permissions",
        )
    db_allocation_rule = crud.update_allocation_rule(
        session=session,
        db_allocation_rule=db_allocation_rule,
        allocation_rule_in=allocation_rule_in,
    )
    return db_allocation_rule


@router.get("/{allocation_rule_id}", response_model=AllocationRulePublic)
def read_allocation_rule(
    *, session: SessionDep, current_user: CurrentUser, allocation_rule_id: uuid.UUID
) -> Any:
    """
    Get a specific allocation rule by id.
    """
    allocation_rule = crud.get_allocation_rule(
        session=session, allocation_rule_id=allocation_rule_id
    )
    if not allocation_rule:
        raise HTTPException(
            status_code=404,
            detail="The allocation rule with this id does not exist in the system",
        )
    if allocation_rule.user_id != current_user.id:
        raise HTTPException(
            status_code=403,
            detail="Not enough permissions",
        )
    return allocation_rule


@router.delete("/{allocation_rule_id}", response_model=Message)
def delete_allocation_rule(
    session: SessionDep, current_user: CurrentUser, allocation_rule_id: uuid.UUID
) -> Message:
    """
    Delete an allocation rule.
    """
    allocation_rule = crud.get_allocation_rule(
        session=session, allocation_rule_id=allocation_rule_id
    )
    if not allocation_rule:
        raise HTTPException(status_code=404, detail="Allocation rule not found")
    if allocation_rule.user_id != current_user.id:
        raise HTTPException(
            status_code=403,
            detail="Not enough permissions",
        )
    crud.delete_allocation_rule(session=session, allocation_rule_id=allocation_rule_id)
    return Message(message="Allocation rule deleted successfully")
