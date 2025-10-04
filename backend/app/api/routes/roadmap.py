import uuid
from typing import Any

from fastapi import APIRouter, HTTPException

from app import crud
from app.api.deps import CurrentUser, SessionDep
from app.models import (
    RoadmapCreate,
    RoadmapPublic,
    RoadmapsPublic,
    RoadmapUpdate,
    RoadmapMilestone,
    MilestoneCreate,
    MilestoneUpdate,
    MilestoneReorderRequest,
    RoadmapMilestonePublic,
    RoadmapMilestonesPublic,
    Message,
    TodoCreate,
    TodoPublic,
    TodosPublic,
)

router = APIRouter(prefix="/roadmap", tags=["roadmap"])


@router.get("/", response_model=RoadmapsPublic)
def read_roadmaps(
    session: SessionDep, current_user: CurrentUser, skip: int = 0, limit: int = 100
) -> Any:
    """
    Retrieve roadmaps for current user.
    """
    roadmaps = crud.get_roadmaps(
        session=session, user_id=current_user.id, skip=skip, limit=limit
    )
    return RoadmapsPublic(data=roadmaps, count=len(roadmaps))


@router.post("/", response_model=RoadmapPublic)
def create_roadmap(
    *, session: SessionDep, current_user: CurrentUser, roadmap_in: RoadmapCreate
) -> Any:
    """
    Create new roadmap.
    """
    roadmap = crud.create_roadmap(
        session=session, roadmap_in=roadmap_in, user_id=current_user.id
    )
    # Load with milestones to ensure progress_percentage is calculated correctly
    roadmap = crud.get_roadmap_with_milestones(
        session=session, roadmap_id=roadmap.id, user_id=current_user.id
    )
    return roadmap


@router.get("/{roadmap_id}", response_model=RoadmapPublic)
def read_roadmap(
    *, session: SessionDep, current_user: CurrentUser, roadmap_id: uuid.UUID
) -> Any:
    """
    Get roadmap by ID.
    """
    roadmap = crud.get_roadmap_with_milestones(
        session=session, roadmap_id=roadmap_id, user_id=current_user.id
    )
    if not roadmap:
        raise HTTPException(status_code=404, detail="Roadmap not found")
    return roadmap


@router.put("/{roadmap_id}", response_model=RoadmapPublic)
def update_roadmap(
    *,
    session: SessionDep,
    current_user: CurrentUser,
    roadmap_id: uuid.UUID,
    roadmap_in: RoadmapUpdate,
) -> Any:
    """
    Update a roadmap.
    """
    roadmap = crud.get_roadmap(session=session, roadmap_id=roadmap_id)
    if not roadmap or roadmap.user_id != current_user.id:
        raise HTTPException(status_code=404, detail="Roadmap not found")
    roadmap = crud.update_roadmap(
        session=session, db_roadmap=roadmap, roadmap_in=roadmap_in
    )
    return roadmap


@router.delete("/{roadmap_id}", response_model=Message)
def delete_roadmap(
    *, session: SessionDep, current_user: CurrentUser, roadmap_id: uuid.UUID
) -> Any:
    """
    Delete a roadmap.
    """
    roadmap = crud.get_roadmap(session=session, roadmap_id=roadmap_id)
    if not roadmap or roadmap.user_id != current_user.id:
        raise HTTPException(status_code=404, detail="Roadmap not found")
    crud.delete_roadmap(session=session, roadmap_id=roadmap_id)
    return Message(message="Roadmap deleted successfully")


# Milestone endpoints
@router.get("/{roadmap_id}/milestones", response_model=RoadmapMilestonesPublic)
def read_milestones(
    *,
    session: SessionDep,
    current_user: CurrentUser,
    roadmap_id: uuid.UUID,
    skip: int = 0,
    limit: int = 100,
) -> Any:
    """
    Retrieve milestones for a roadmap.
    """
    # Verify roadmap ownership
    roadmap = crud.get_roadmap(session=session, roadmap_id=roadmap_id)
    if not roadmap or roadmap.user_id != current_user.id:
        raise HTTPException(status_code=404, detail="Roadmap not found")
    
    milestones = crud.get_milestones_by_roadmap(
        session=session, roadmap_id=roadmap_id, skip=skip, limit=limit
    )
    return RoadmapMilestonesPublic(data=milestones, count=len(milestones))


@router.post("/{roadmap_id}/milestones", response_model=RoadmapMilestonePublic)
def create_milestone(
    *,
    session: SessionDep,
    current_user: CurrentUser,
    roadmap_id: uuid.UUID,
    milestone_in: MilestoneCreate,
) -> Any:
    """
    Create new milestone for a roadmap.
    """
    # Verify roadmap ownership
    roadmap = crud.get_roadmap(session=session, roadmap_id=roadmap_id)
    if not roadmap or roadmap.user_id != current_user.id:
        raise HTTPException(status_code=404, detail="Roadmap not found")
    
    milestone = crud.create_milestone(
        session=session, milestone_in=milestone_in, roadmap_id=roadmap_id
    )
    return milestone


@router.put("/{roadmap_id}/milestones/reorder", response_model=RoadmapMilestonesPublic)
def reorder_milestones(
    *,
    session: SessionDep,
    current_user: CurrentUser,
    roadmap_id: uuid.UUID,
    reorder_request: MilestoneReorderRequest,
) -> Any:
    """
    Reorder milestones by drag and drop.
    """
    # Verify roadmap ownership
    roadmap = crud.get_roadmap(session=session, roadmap_id=roadmap_id)
    if not roadmap or roadmap.user_id != current_user.id:
        raise HTTPException(status_code=404, detail="Roadmap not found")
    
    try:
        milestones = crud.reorder_milestones(
            session=session, roadmap_id=roadmap_id, reorder_request=reorder_request
        )
        return RoadmapMilestonesPublic(data=milestones, count=len(milestones))
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.put("/{roadmap_id}/milestones/{milestone_id}", response_model=RoadmapMilestonePublic)
def update_milestone(
    *,
    session: SessionDep,
    current_user: CurrentUser,
    roadmap_id: uuid.UUID,
    milestone_id: uuid.UUID,
    milestone_in: MilestoneUpdate,
) -> Any:
    """
    Update a milestone.
    """
    # Verify roadmap ownership
    roadmap = crud.get_roadmap(session=session, roadmap_id=roadmap_id)
    if not roadmap or roadmap.user_id != current_user.id:
        raise HTTPException(status_code=404, detail="Roadmap not found")
    
    milestone = crud.get_milestone(session=session, milestone_id=milestone_id)
    if not milestone or milestone.roadmap_id != roadmap_id:
        raise HTTPException(status_code=404, detail="Milestone not found")
    
    milestone = crud.update_milestone(
        session=session, db_milestone=milestone, milestone_in=milestone_in
    )
    return milestone


@router.delete("/{roadmap_id}/milestones/{milestone_id}", response_model=Message)
def delete_milestone(
    *,
    session: SessionDep,
    current_user: CurrentUser,
    roadmap_id: uuid.UUID,
    milestone_id: uuid.UUID,
) -> Any:
    """
    Delete a milestone.
    """
    # Verify roadmap ownership
    roadmap = crud.get_roadmap(session=session, roadmap_id=roadmap_id)
    if not roadmap or roadmap.user_id != current_user.id:
        raise HTTPException(status_code=404, detail="Roadmap not found")
    
    milestone = crud.get_milestone(session=session, milestone_id=milestone_id)
    if not milestone or milestone.roadmap_id != roadmap_id:
        raise HTTPException(status_code=404, detail="Milestone not found")
    
    crud.delete_milestone(session=session, milestone_id=milestone_id)
    return Message(message="Milestone deleted successfully")


# ========= SEARCH ALL MILESTONES ENDPOINT =========
@router.get("/milestones/search", response_model=RoadmapMilestonesPublic)
def search_all_milestones(
    *,
    session: SessionDep,
    current_user: CurrentUser,
    skip: int = 0,
    limit: int = 100,
    search: str | None = None,
) -> Any:
    """
    Search all milestones across all roadmaps for the current user.
    """
    milestones = crud.search_milestones_for_user(
        session=session, 
        user_id=current_user.id, 
        skip=skip, 
        limit=limit,
        search=search
    )
    return RoadmapMilestonesPublic(data=milestones, count=len(milestones))


# ========= MILESTONE TODO ENDPOINTS =========
@router.get("/{roadmap_id}/milestones/{milestone_id}/todos", response_model=TodosPublic)
def read_milestone_todos(
    *,
    session: SessionDep,
    current_user: CurrentUser,
    roadmap_id: uuid.UUID,
    milestone_id: uuid.UUID,
    skip: int = 0,
    limit: int = 100,
) -> Any:
    """
    Get todos for a milestone.
    """
    # Verify roadmap ownership
    roadmap = crud.get_roadmap(session=session, roadmap_id=roadmap_id)
    if not roadmap or roadmap.user_id != current_user.id:
        raise HTTPException(status_code=404, detail="Roadmap not found")
    
    # Verify milestone exists and belongs to roadmap
    milestone = crud.get_milestone(session=session, milestone_id=milestone_id)
    if not milestone or milestone.roadmap_id != roadmap_id:
        raise HTTPException(status_code=404, detail="Milestone not found")
    
    todos = crud.get_todos_by_milestone(session=session, milestone_id=milestone_id, owner_id=current_user.id)
    return TodosPublic(data=todos[skip:skip+limit], count=len(todos))


@router.post("/{roadmap_id}/milestones/{milestone_id}/todos", response_model=TodoPublic)
def create_milestone_todo(
    *,
    session: SessionDep,
    current_user: CurrentUser,
    roadmap_id: uuid.UUID,
    milestone_id: uuid.UUID,
    todo_in: TodoCreate,
) -> Any:
    """
    Create a new todo for a milestone.
    """
    # Verify roadmap ownership
    roadmap = crud.get_roadmap(session=session, roadmap_id=roadmap_id)
    if not roadmap or roadmap.user_id != current_user.id:
        raise HTTPException(status_code=404, detail="Roadmap not found")
    
    # Verify milestone exists and belongs to roadmap
    milestone = crud.get_milestone(session=session, milestone_id=milestone_id)
    if not milestone or milestone.roadmap_id != roadmap_id:
        raise HTTPException(status_code=404, detail="Milestone not found")
    
    # Set milestone_id in todo data
    todo_data = todo_in.model_dump()
    todo_data["milestone_id"] = milestone_id
    
    from app.models import TodoCreate
    todo_create = TodoCreate(**todo_data)
    
    todo = crud.create_todo(session=session, todo_in=todo_create, owner_id=current_user.id)
    return todo
