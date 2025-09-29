from typing import Any

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlmodel import Session

from app import crud
from app.api.deps import CurrentUser, get_db
from app.models import (
    Feedback,
    FeedbackCreate,
    FeedbackPublic,
    FeedbackUpdate,
    FeedbacksPublic,
    User,
)


router = APIRouter(prefix="/api/v1/feedback", tags=["feedback"])


@router.post("/", response_model=FeedbackPublic)
def create_feedback(
    *,
    db: Session = Depends(get_db),
    current_user: CurrentUser,
    feedback_in: FeedbackCreate,
) -> Any:
    feedback = crud.create_feedback(db=db, user_id=str(current_user.id), feedback_in=feedback_in)
    return feedback


@router.get("/", response_model=FeedbacksPublic)
def read_feedbacks(
    *,
    db: Session = Depends(get_db),
    current_user: CurrentUser,
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
) -> Any:
    data, count = crud.get_feedbacks(db=db, user_id=str(current_user.id), skip=skip, limit=limit)
    return FeedbacksPublic(data=data, count=count)


@router.get("/{feedback_id}", response_model=FeedbackPublic)
def read_feedback(
    *,
    db: Session = Depends(get_db),
    current_user: CurrentUser,
    feedback_id: str,
) -> Any:
    feedback = crud.get_feedback(db=db, id=feedback_id, user_id=str(current_user.id))
    if not feedback:
        raise HTTPException(status_code=404, detail="Feedback not found")
    return feedback


@router.put("/{feedback_id}", response_model=FeedbackPublic)
def update_feedback(
    *,
    db: Session = Depends(get_db),
    current_user: CurrentUser,
    feedback_id: str,
    feedback_in: FeedbackUpdate,
) -> Any:
    feedback = crud.get_feedback(db=db, id=feedback_id, user_id=str(current_user.id))
    if not feedback:
        raise HTTPException(status_code=404, detail="Feedback not found")
    feedback = crud.update_feedback(db=db, db_obj=feedback, feedback_in=feedback_in)
    return feedback


@router.delete("/{feedback_id}")
def delete_feedback(
    *,
    db: Session = Depends(get_db),
    current_user: CurrentUser,
    feedback_id: str,
) -> Any:
    feedback = crud.get_feedback(db=db, id=feedback_id, user_id=str(current_user.id))
    if not feedback:
        raise HTTPException(status_code=404, detail="Feedback not found")
    crud.delete_feedback(db=db, db_obj=feedback)
    return {"message": "Feedback deleted"}


