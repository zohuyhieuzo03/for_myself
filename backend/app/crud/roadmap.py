import uuid
from datetime import datetime, timezone
from typing import Any

from sqlmodel import Session, select
from sqlalchemy.orm import selectinload

from app.models import (
    Roadmap,
    RoadmapCreate,
    RoadmapUpdate,
    RoadmapMilestone,
    MilestoneCreate,
    MilestoneUpdate,
)


def create_roadmap(
    *, session: Session, roadmap_in: RoadmapCreate, user_id: uuid.UUID
) -> Roadmap:
    db_roadmap = Roadmap.model_validate(roadmap_in, update={"user_id": user_id})
    session.add(db_roadmap)
    session.commit()
    session.refresh(db_roadmap)
    return db_roadmap


def update_roadmap(
    *, session: Session, db_roadmap: Roadmap, roadmap_in: RoadmapUpdate
) -> Any:
    roadmap_data = roadmap_in.model_dump(exclude_unset=True)
    extra_data = {"updated_at": datetime.now(timezone.utc)}
    db_roadmap.sqlmodel_update(roadmap_data, update=extra_data)
    session.add(db_roadmap)
    session.commit()
    session.refresh(db_roadmap)
    return db_roadmap


def get_roadmap(*, session: Session, roadmap_id: uuid.UUID) -> Roadmap | None:
    statement = select(Roadmap).where(Roadmap.id == roadmap_id)
    return session.exec(statement).first()


def get_roadmap_with_milestones(
    *, session: Session, roadmap_id: uuid.UUID, user_id: uuid.UUID
) -> Roadmap | None:
    statement = (
        select(Roadmap)
        .where(Roadmap.id == roadmap_id, Roadmap.user_id == user_id)
        .options(selectinload(Roadmap.milestones))
    )
    return session.exec(statement).first()


def get_roadmaps(
    *, session: Session, user_id: uuid.UUID, skip: int = 0, limit: int = 100
) -> list[Roadmap]:
    statement = (
        select(Roadmap)
        .where(Roadmap.user_id == user_id)
        .options(selectinload(Roadmap.milestones))
        .offset(skip)
        .limit(limit)
        .order_by(Roadmap.created_at.desc())
    )
    return list(session.exec(statement))


def delete_roadmap(*, session: Session, roadmap_id: uuid.UUID) -> Roadmap | None:
    roadmap = get_roadmap(session=session, roadmap_id=roadmap_id)
    if roadmap:
        session.delete(roadmap)
        session.commit()
    return roadmap


# Milestone CRUD functions
def create_milestone(
    *, session: Session, milestone_in: MilestoneCreate, roadmap_id: uuid.UUID
) -> RoadmapMilestone:
    db_milestone = RoadmapMilestone.model_validate(
        milestone_in, update={"roadmap_id": roadmap_id}
    )
    session.add(db_milestone)
    session.commit()
    session.refresh(db_milestone)
    return db_milestone


def update_milestone(
    *, session: Session, db_milestone: RoadmapMilestone, milestone_in: MilestoneUpdate
) -> Any:
    milestone_data = milestone_in.model_dump(exclude_unset=True)
    extra_data = {"updated_at": datetime.now(timezone.utc)}
    db_milestone.sqlmodel_update(milestone_data, update=extra_data)
    session.add(db_milestone)
    session.commit()
    session.refresh(db_milestone)
    return db_milestone


def get_milestone(*, session: Session, milestone_id: uuid.UUID) -> RoadmapMilestone | None:
    statement = select(RoadmapMilestone).where(RoadmapMilestone.id == milestone_id)
    return session.exec(statement).first()


def get_milestones_by_roadmap(
    *, session: Session, roadmap_id: uuid.UUID, skip: int = 0, limit: int = 100
) -> list[RoadmapMilestone]:
    statement = (
        select(RoadmapMilestone)
        .where(RoadmapMilestone.roadmap_id == roadmap_id)
        .offset(skip)
        .limit(limit)
        .order_by(RoadmapMilestone.order_index, RoadmapMilestone.created_at)
    )
    return list(session.exec(statement))


def delete_milestone(*, session: Session, milestone_id: uuid.UUID) -> RoadmapMilestone | None:
    milestone = get_milestone(session=session, milestone_id=milestone_id)
    if milestone:
        session.delete(milestone)
        session.commit()
    return milestone
