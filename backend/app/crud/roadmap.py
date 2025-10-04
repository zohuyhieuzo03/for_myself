import uuid
from datetime import datetime, timezone, timedelta
from typing import Any

from sqlmodel import Session, select
from sqlalchemy.orm import selectinload

from app.models import (
    Roadmap,
    RoadmapCreate,
    RoadmapUpdate,
    RoadmapPublic,
    RoadmapMilestone,
    MilestoneCreate,
    MilestoneUpdate,
    MilestoneReorderRequest,
)
from app.utils import calculate_roadmap_progress


def _roadmap_to_public(roadmap: Roadmap) -> RoadmapPublic:
    """Convert Roadmap model to RoadmapPublic with calculated progress_percentage."""
    progress = calculate_roadmap_progress(roadmap.milestones) if roadmap.milestones else 0
    
    return RoadmapPublic(
        id=roadmap.id,
        user_id=roadmap.user_id,
        title=roadmap.title,
        description=roadmap.description,
        status=roadmap.status,
        priority=roadmap.priority,
        start_date=roadmap.start_date,
        target_date=roadmap.target_date,
        completed_date=roadmap.completed_date,
        created_at=roadmap.created_at,
        updated_at=roadmap.updated_at,
        milestones=roadmap.milestones or [],
        progress_percentage=progress
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
) -> RoadmapPublic:
    roadmap_data = roadmap_in.model_dump(exclude_unset=True)
    extra_data = {"updated_at": datetime.now(timezone.utc)}
    db_roadmap.sqlmodel_update(roadmap_data, update=extra_data)
    session.add(db_roadmap)
    session.commit()
    session.refresh(db_roadmap)
    # Load with milestones to calculate progress_percentage
    statement = (
        select(Roadmap)
        .where(Roadmap.id == db_roadmap.id)
        .options(selectinload(Roadmap.milestones))
    )
    roadmap_with_milestones = session.exec(statement).first()
    return _roadmap_to_public(roadmap_with_milestones)


def get_roadmap(*, session: Session, roadmap_id: uuid.UUID) -> Roadmap | None:
    statement = select(Roadmap).where(Roadmap.id == roadmap_id)
    return session.exec(statement).first()


def get_roadmap_with_milestones(
    *, session: Session, roadmap_id: uuid.UUID, user_id: uuid.UUID
) -> RoadmapPublic | None:
    statement = (
        select(Roadmap)
        .where(Roadmap.id == roadmap_id, Roadmap.user_id == user_id)
        .options(selectinload(Roadmap.milestones))
    )
    roadmap = session.exec(statement).first()
    if roadmap:
        return _roadmap_to_public(roadmap)
    return None


def get_roadmaps(
    *, session: Session, user_id: uuid.UUID, skip: int = 0, limit: int = 100
) -> list[RoadmapPublic]:
    statement = (
        select(Roadmap)
        .where(Roadmap.user_id == user_id)
        .options(selectinload(Roadmap.milestones))
        .offset(skip)
        .limit(limit)
        .order_by(Roadmap.created_at.desc())
    )
    roadmaps = list(session.exec(statement))
    return [_roadmap_to_public(roadmap) for roadmap in roadmaps]


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
    # Create milestone data with roadmap_id, excluding order_index
    milestone_data = milestone_in.model_dump()
    milestone_data["roadmap_id"] = roadmap_id
    
    db_milestone = RoadmapMilestone(**milestone_data)
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
        .order_by(RoadmapMilestone.created_at)
    )
    return list(session.exec(statement))


def get_all_milestones_by_roadmap(
    *, session: Session, roadmap_id: uuid.UUID
) -> list[RoadmapMilestone]:
    """Get all milestones for a roadmap without pagination."""
    statement = (
        select(RoadmapMilestone)
        .where(RoadmapMilestone.roadmap_id == roadmap_id)
        .order_by(RoadmapMilestone.created_at)
    )
    return list(session.exec(statement))


def delete_milestone(*, session: Session, milestone_id: uuid.UUID) -> RoadmapMilestone | None:
    milestone = get_milestone(session=session, milestone_id=milestone_id)
    if milestone:
        session.delete(milestone)
        session.commit()
    return milestone


def reorder_milestones(
    *, session: Session, roadmap_id: uuid.UUID, reorder_request: MilestoneReorderRequest
) -> list[RoadmapMilestone]:
    """
    Reorder milestones by updating their created_at timestamp.
    The order in milestone_ids list determines the new order.
    """
    # Get all milestones for this roadmap (without pagination)
    milestones = get_all_milestones_by_roadmap(session=session, roadmap_id=roadmap_id)
    milestone_dict = {m.id: m for m in milestones}
    
    # Validate that all milestone IDs exist and belong to this roadmap
    for milestone_id in reorder_request.milestone_ids:
        if milestone_id not in milestone_dict:
            raise ValueError(f"Milestone {milestone_id} not found in roadmap {roadmap_id}")
    
    # Update created_at timestamps to reflect new order
    # Use a base timestamp and increment by seconds for each milestone
    base_time = datetime.now(timezone.utc)
    
    for index, milestone_id in enumerate(reorder_request.milestone_ids):
        milestone = milestone_dict[milestone_id]
        # Set created_at to base_time + index seconds
        milestone.created_at = base_time.replace(microsecond=0) + timedelta(seconds=index)
        session.add(milestone)
    
    session.commit()
    
    # Return milestones in new order
    return [milestone_dict[mid] for mid in reorder_request.milestone_ids]


def search_milestones_for_user(
    session: Session,
    user_id: uuid.UUID,
    skip: int = 0,
    limit: int = 100,
    search: str | None = None,
) -> list[RoadmapMilestone]:
    """
    Search all milestones across all roadmaps for a user.
    """
    # Build base query with joins
    statement = (
        select(RoadmapMilestone)
        .join(Roadmap, RoadmapMilestone.roadmap_id == Roadmap.id)
        .where(Roadmap.user_id == user_id)
    )
    
    # Add search condition if provided
    if search and search.strip():
        search_term = f"%{search.strip()}%"
        statement = statement.where(
            RoadmapMilestone.title.ilike(search_term) |
            RoadmapMilestone.description.ilike(search_term)
        )
    
    # Execute query with pagination
    statement = statement.order_by(RoadmapMilestone.created_at.desc()).offset(skip).limit(limit)
    milestones = session.exec(statement).all()
    
    return milestones
