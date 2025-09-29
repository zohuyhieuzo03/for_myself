from typing import Optional

from sqlmodel import Session, select

from app.models import Feedback, FeedbackCreate, FeedbackPublic, FeedbackUpdate


def create_feedback(*, db: Session, user_id: str, feedback_in: FeedbackCreate) -> Feedback:
    feedback = Feedback(user_id=user_id, **feedback_in.model_dump())
    db.add(feedback)
    db.commit()
    db.refresh(feedback)
    return feedback


def get_feedback(*, db: Session, id: str, user_id: str) -> Optional[Feedback]:
    statement = select(Feedback).where(Feedback.id == id, Feedback.user_id == user_id)
    return db.exec(statement).first()


def get_feedbacks(*, db: Session, user_id: str, skip: int = 0, limit: int = 100) -> tuple[list[Feedback], int]:
    statement = select(Feedback).where(Feedback.user_id == user_id).offset(skip).limit(limit)
    data = list(db.exec(statement).all())
    count_statement = select(Feedback).where(Feedback.user_id == user_id)
    total = len(list(db.exec(count_statement).all()))
    return data, total


def update_feedback(*, db: Session, db_obj: Feedback, feedback_in: FeedbackUpdate) -> Feedback:
    obj_data = db_obj.model_dump()
    update_data = feedback_in.model_dump(exclude_unset=True)
    for field in update_data:
        if field in obj_data:
            setattr(db_obj, field, update_data[field])
    db.add(db_obj)
    db.commit()
    db.refresh(db_obj)
    return db_obj


def delete_feedback(*, db: Session, db_obj: Feedback) -> None:
    db.delete(db_obj)
    db.commit()

