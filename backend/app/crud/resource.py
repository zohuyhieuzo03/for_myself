import uuid
from typing import Any

from sqlmodel import Session, select

from app.models import (
    Resource,
    ResourceCreate,
    ResourcePublic,
    ResourceUpdate,
    ResourceSubject,
    ResourceSubjectCreate,
    ResourceSubjectPublic,
    ResourceSubjectUpdate,
    ResourceSubjectReorderRequest,
    ResourcesPublic,
    ResourceSubjectsPublic,
)


def _resource_to_public(resource: Resource) -> ResourcePublic:
    """Convert Resource to ResourcePublic."""
    return ResourcePublic(
        id=resource.id,
        title=resource.title,
        description=resource.description,
        url=resource.url,
        ai_chat_url=resource.ai_chat_url,
        user_id=resource.user_id,
        milestone_id=resource.milestone_id,
        created_at=resource.created_at,
        updated_at=resource.updated_at,
        subjects=[_resource_subject_to_public(subject) for subject in resource.subjects],
    )


def _resource_subject_to_public(subject: ResourceSubject) -> ResourceSubjectPublic:
    """Convert ResourceSubject to ResourceSubjectPublic."""
    return ResourceSubjectPublic(
        id=subject.id,
        title=subject.title,
        description=subject.description,
        is_completed=subject.is_completed,
        order_index=subject.order_index,
        resource_id=subject.resource_id,
        created_at=subject.created_at,
        updated_at=subject.updated_at,
    )


def create_resource(
    *, session: Session, resource_in: ResourceCreate, user_id: uuid.UUID
) -> Resource:
    """Create a new resource."""
    resource = Resource(
        **resource_in.model_dump(),
        user_id=user_id,
    )
    session.add(resource)
    session.commit()
    session.refresh(resource)
    return resource


def get_resource(*, session: Session, resource_id: uuid.UUID, user_id: uuid.UUID) -> Resource | None:
    """Get a resource by ID."""
    statement = select(Resource).where(
        Resource.id == resource_id,
        Resource.user_id == user_id,
    )
    resource = session.exec(statement).first()
    return resource


def get_resources(
    *,
    session: Session,
    user_id: uuid.UUID,
    milestone_id: uuid.UUID | None = None,
    skip: int = 0,
    limit: int = 100,
) -> ResourcesPublic:
    """Get resources for a user, optionally filtered by milestone."""
    statement = select(Resource).where(Resource.user_id == user_id)
    
    if milestone_id is not None:
        statement = statement.where(Resource.milestone_id == milestone_id)
    
    statement = statement.offset(skip).limit(limit)
    resources = session.exec(statement).all()
    
    return ResourcesPublic(
        data=[_resource_to_public(resource) for resource in resources],
        count=len(resources),
    )


def update_resource(
    *,
    session: Session,
    resource: Resource,
    resource_in: ResourceUpdate,
) -> Resource:
    """Update a resource."""
    resource_dict = resource_in.model_dump(exclude_unset=True)
    for field, value in resource_dict.items():
        setattr(resource, field, value)
    
    session.add(resource)
    session.commit()
    session.refresh(resource)
    return resource


def delete_resource(*, session: Session, resource: Resource) -> None:
    """Delete a resource."""
    session.delete(resource)
    session.commit()


# Resource Subject CRUD operations
def create_resource_subject(
    *, session: Session, subject_in: ResourceSubjectCreate, resource_id: uuid.UUID
) -> ResourceSubject:
    """Create a new resource subject."""
    # Get the next order index
    statement = select(ResourceSubject).where(ResourceSubject.resource_id == resource_id)
    existing_subjects = session.exec(statement).all()
    next_order = max([s.order_index for s in existing_subjects], default=-1) + 1
    
    subject_dict = subject_in.model_dump()
    subject_dict.update({
        "resource_id": resource_id,
        "order_index": next_order,
    })
    subject = ResourceSubject(**subject_dict)
    session.add(subject)
    session.commit()
    session.refresh(subject)
    return subject


def get_resource_subject(
    *, session: Session, subject_id: uuid.UUID, user_id: uuid.UUID
) -> ResourceSubject | None:
    """Get a resource subject by ID."""
    statement = (
        select(ResourceSubject)
        .join(Resource)
        .where(
            ResourceSubject.id == subject_id,
            Resource.user_id == user_id,
        )
    )
    subject = session.exec(statement).first()
    return subject


def get_resource_subjects(
    *,
    session: Session,
    resource_id: uuid.UUID,
    user_id: uuid.UUID,
    skip: int = 0,
    limit: int = 100,
) -> ResourceSubjectsPublic:
    """Get subjects for a resource."""
    statement = (
        select(ResourceSubject)
        .join(Resource)
        .where(
            ResourceSubject.resource_id == resource_id,
            Resource.user_id == user_id,
        )
        .order_by(ResourceSubject.order_index)
        .offset(skip)
        .limit(limit)
    )
    subjects = session.exec(statement).all()
    
    return ResourceSubjectsPublic(
        data=[_resource_subject_to_public(subject) for subject in subjects],
        count=len(subjects),
    )


def update_resource_subject(
    *,
    session: Session,
    subject: ResourceSubject,
    subject_in: ResourceSubjectUpdate,
) -> ResourceSubject:
    """Update a resource subject."""
    subject_dict = subject_in.model_dump(exclude_unset=True)
    for field, value in subject_dict.items():
        setattr(subject, field, value)
    
    session.add(subject)
    session.commit()
    session.refresh(subject)
    return subject


def delete_resource_subject(*, session: Session, subject: ResourceSubject) -> None:
    """Delete a resource subject."""
    session.delete(subject)
    session.commit()


def reorder_resource_subjects(
    *,
    session: Session,
    resource_id: uuid.UUID,
    user_id: uuid.UUID,
    reorder_request: ResourceSubjectReorderRequest,
) -> ResourceSubjectsPublic:
    """Reorder resource subjects."""
    # Verify all subjects belong to the resource and user
    statement = (
        select(ResourceSubject)
        .join(Resource)
        .where(
            ResourceSubject.resource_id == resource_id,
            Resource.user_id == user_id,
        )
    )
    existing_subjects = session.exec(statement).all()
    existing_subject_ids = {subject.id for subject in existing_subjects}
    
    if not existing_subject_ids.issuperset(reorder_request.subject_ids):
        raise ValueError("Some subject IDs do not belong to this resource")
    
    # Update order indices
    for new_order, subject_id in enumerate(reorder_request.subject_ids):
        subject = next(s for s in existing_subjects if s.id == subject_id)
        subject.order_index = new_order
        session.add(subject)
    
    session.commit()
    
    # Return updated subjects
    return get_resource_subjects(
        session=session,
        resource_id=resource_id,
        user_id=user_id,
    )
