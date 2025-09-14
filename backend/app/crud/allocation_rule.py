import uuid
from datetime import datetime, timezone
from typing import Any

from sqlmodel import Session, select

from app.models import AllocationRule, AllocationRuleCreate, AllocationRuleUpdate


def create_allocation_rule(
    *, session: Session, allocation_rule_in: AllocationRuleCreate, user_id: uuid.UUID
) -> AllocationRule:
    db_allocation_rule = AllocationRule.model_validate(
        allocation_rule_in, update={"user_id": user_id}
    )
    session.add(db_allocation_rule)
    session.commit()
    session.refresh(db_allocation_rule)
    return db_allocation_rule


def update_allocation_rule(
    *,
    session: Session,
    db_allocation_rule: AllocationRule,
    allocation_rule_in: AllocationRuleUpdate,
) -> Any:
    allocation_rule_data = allocation_rule_in.model_dump(exclude_unset=True)
    extra_data = {"updated_at": datetime.now(timezone.utc)}
    db_allocation_rule.sqlmodel_update(allocation_rule_data, update=extra_data)
    session.add(db_allocation_rule)
    session.commit()
    session.refresh(db_allocation_rule)
    return db_allocation_rule


def get_allocation_rule(
    *, session: Session, allocation_rule_id: uuid.UUID
) -> AllocationRule | None:
    statement = select(AllocationRule).where(AllocationRule.id == allocation_rule_id)
    return session.exec(statement).first()


def get_allocation_rules(
    *, session: Session, user_id: uuid.UUID, skip: int = 0, limit: int = 100
) -> tuple[list[AllocationRule], int]:
    statement = (
        select(AllocationRule)
        .where(AllocationRule.user_id == user_id)
        .offset(skip)
        .limit(limit)
    )
    allocation_rules = list(session.exec(statement).all())
    count_statement = select(AllocationRule).where(AllocationRule.user_id == user_id)
    count = len(session.exec(count_statement).all())
    return allocation_rules, count


def delete_allocation_rule(
    *, session: Session, allocation_rule_id: uuid.UUID
) -> AllocationRule | None:
    statement = select(AllocationRule).where(AllocationRule.id == allocation_rule_id)
    allocation_rule = session.exec(statement).first()
    if allocation_rule:
        session.delete(allocation_rule)
        session.commit()
    return allocation_rule
