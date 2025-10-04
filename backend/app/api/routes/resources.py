import uuid
from typing import Any

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlmodel import Session

from app import crud
from app.api.deps import get_current_active_superuser, get_current_user, get_db, CurrentUser, SessionDep
from app.models import (
    Resource,
    ResourceCreate,
    ResourcePublic,
    ResourceUpdate,
    ResourcesPublic,
    ResourceSubject,
    ResourceSubjectCreate,
    ResourceSubjectPublic,
    ResourceSubjectUpdate,
    ResourceSubjectReorderRequest,
    ResourceSubjectsPublic,
    User,
)

router = APIRouter()


@router.post("/", response_model=ResourcePublic)
def create_resource(
    *,
    db: Session = Depends(get_db),
    resource_in: ResourceCreate,
    current_user: User = Depends(get_current_user),
) -> Any:
    """
    Create new resource.
    """
    resource = crud.create_resource(
        session=db, resource_in=resource_in, user_id=current_user.id
    )
    return resource


@router.get("/", response_model=ResourcesPublic)
def read_resources(
    db: Session = Depends(get_db),
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=100),
    milestone_id: uuid.UUID | None = Query(None),
    current_user: User = Depends(get_current_user),
) -> Any:
    """
    Retrieve resources.
    """
    resources = crud.get_resources(
        session=db,
        user_id=current_user.id,
        milestone_id=milestone_id,
        skip=skip,
        limit=limit,
    )
    return resources


@router.get("/{resource_id}", response_model=ResourcePublic)
def read_resource(
    *,
    db: Session = Depends(get_db),
    resource_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
) -> Any:
    """
    Get resource by ID.
    """
    resource = crud.get_resource(
        session=db, resource_id=resource_id, user_id=current_user.id
    )
    if not resource:
        raise HTTPException(status_code=404, detail="Resource not found")
    return resource


@router.put("/{resource_id}", response_model=ResourcePublic)
def update_resource(
    *,
    db: Session = Depends(get_db),
    resource_id: uuid.UUID,
    resource_in: ResourceUpdate,
    current_user: User = Depends(get_current_user),
) -> Any:
    """
    Update a resource.
    """
    resource = crud.get_resource(
        session=db, resource_id=resource_id, user_id=current_user.id
    )
    if not resource:
        raise HTTPException(status_code=404, detail="Resource not found")
    resource = crud.update_resource(session=db, resource=resource, resource_in=resource_in)
    return resource


@router.delete("/{resource_id}")
def delete_resource(
    *,
    db: Session = Depends(get_db),
    resource_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
) -> Any:
    """
    Delete a resource.
    """
    resource = crud.get_resource(
        session=db, resource_id=resource_id, user_id=current_user.id
    )
    if not resource:
        raise HTTPException(status_code=404, detail="Resource not found")
    crud.delete_resource(session=db, resource=resource)
    return {"message": "Resource deleted successfully"}


# Resource Subject endpoints
@router.post("/{resource_id}/subjects", response_model=ResourceSubjectPublic)
def create_resource_subject(
    *,
    db: Session = Depends(get_db),
    resource_id: uuid.UUID,
    subject_in: ResourceSubjectCreate,
    current_user: User = Depends(get_current_user),
) -> Any:
    """
    Create new resource subject.
    """
    # Verify resource exists and belongs to user
    resource = crud.get_resource(
        session=db, resource_id=resource_id, user_id=current_user.id
    )
    if not resource:
        raise HTTPException(status_code=404, detail="Resource not found")
    
    subject = crud.create_resource_subject(
        session=db, subject_in=subject_in, resource_id=resource_id
    )
    return subject


@router.get("/{resource_id}/subjects", response_model=ResourceSubjectsPublic)
def read_resource_subjects(
    *,
    db: Session = Depends(get_db),
    resource_id: uuid.UUID,
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=100),
    current_user: User = Depends(get_current_user),
) -> Any:
    """
    Retrieve resource subjects.
    """
    # Verify resource exists and belongs to user
    resource = crud.get_resource(
        session=db, resource_id=resource_id, user_id=current_user.id
    )
    if not resource:
        raise HTTPException(status_code=404, detail="Resource not found")
    
    subjects = crud.get_resource_subjects(
        session=db,
        resource_id=resource_id,
        user_id=current_user.id,
        skip=skip,
        limit=limit,
    )
    return subjects


# ========= SEARCH ALL SUBJECTS ENDPOINT =========
@router.get("/subjects/search", response_model=ResourceSubjectsPublic)
def search_all_subjects(
    *,
    session: SessionDep,
    current_user: CurrentUser,
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=100),
    search: str = Query(None),
) -> Any:
    """
    Search all subjects across all resources for the current user.
    """
    subjects = crud.search_subjects_for_user(
        session=session,
        user_id=current_user.id,
        skip=skip,
        limit=limit,
        search=search,
    )
    return ResourceSubjectsPublic(data=subjects, count=len(subjects))


@router.get("/subjects/{subject_id}", response_model=ResourceSubjectPublic)
def read_resource_subject(
    *,
    db: Session = Depends(get_db),
    subject_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
) -> Any:
    """
    Get resource subject by ID.
    """
    subject = crud.get_resource_subject(
        session=db, subject_id=subject_id, user_id=current_user.id
    )
    if not subject:
        raise HTTPException(status_code=404, detail="Resource subject not found")
    return subject


@router.put("/subjects/{subject_id}", response_model=ResourceSubjectPublic)
def update_resource_subject(
    *,
    db: Session = Depends(get_db),
    subject_id: uuid.UUID,
    subject_in: ResourceSubjectUpdate,
    current_user: User = Depends(get_current_user),
) -> Any:
    """
    Update a resource subject.
    """
    subject = crud.get_resource_subject(
        session=db, subject_id=subject_id, user_id=current_user.id
    )
    if not subject:
        raise HTTPException(status_code=404, detail="Resource subject not found")
    subject = crud.update_resource_subject(session=db, subject=subject, subject_in=subject_in)
    return subject


@router.delete("/subjects/{subject_id}")
def delete_resource_subject(
    *,
    db: Session = Depends(get_db),
    subject_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
) -> Any:
    """
    Delete a resource subject.
    """
    subject = crud.get_resource_subject(
        session=db, subject_id=subject_id, user_id=current_user.id
    )
    if not subject:
        raise HTTPException(status_code=404, detail="Resource subject not found")
    crud.delete_resource_subject(session=db, subject=subject)
    return {"message": "Resource subject deleted successfully"}


@router.put("/{resource_id}/subjects/reorder", response_model=ResourceSubjectsPublic)
def reorder_resource_subjects(
    *,
    db: Session = Depends(get_db),
    resource_id: uuid.UUID,
    reorder_request: ResourceSubjectReorderRequest,
    current_user: User = Depends(get_current_user),
) -> Any:
    """
    Reorder resource subjects.
    """
    # Verify resource exists and belongs to user
    resource = crud.get_resource(
        session=db, resource_id=resource_id, user_id=current_user.id
    )
    if not resource:
        raise HTTPException(status_code=404, detail="Resource not found")
    
    try:
        subjects = crud.reorder_resource_subjects(
            session=db,
            resource_id=resource_id,
            user_id=current_user.id,
            reorder_request=reorder_request,
        )
        return subjects
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
