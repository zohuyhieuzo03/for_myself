from datetime import date

from sqlmodel import Session, select

from app import crud
from app.models import SprintCreate, SprintUpdate, User


class TestSprintCRUD:
    def test_create_sprint(
        self, db: Session, normal_user_token_headers: dict[str, str]
    ) -> None:
        """Test creating a sprint"""
        # Get user from token
        user = db.exec(select(User).where(User.email == "test@example.com")).first()
        assert user is not None

        # Create sprint data
        sprint_data = SprintCreate(
            start_date=date(2024, 1, 1),
            end_date=date(2024, 1, 31),
            payday_anchor=date(2024, 1, 1),
            is_closed=False,
        )

        # Create sprint
        sprint = crud.create_sprint(session=db, sprint_in=sprint_data, user_id=user.id)

        # Assertions
        assert sprint.id is not None
        assert sprint.user_id == user.id
        assert sprint.start_date == date(2024, 1, 1)
        assert sprint.end_date == date(2024, 1, 31)
        assert sprint.payday_anchor == date(2024, 1, 1)
        assert sprint.is_closed is False
        assert sprint.created_at is not None
        assert sprint.updated_at is not None

    def test_get_sprint(
        self, db: Session, normal_user_token_headers: dict[str, str]
    ) -> None:
        """Test getting a sprint by ID"""
        # Get user from token
        user = db.exec(select(User).where(User.email == "test@example.com")).first()
        assert user is not None

        # Create sprint
        sprint_data = SprintCreate(
            start_date=date(2024, 1, 1),
            end_date=date(2024, 1, 31),
            payday_anchor=date(2024, 1, 1),
            is_closed=False,
        )
        sprint = crud.create_sprint(session=db, sprint_in=sprint_data, user_id=user.id)

        # Get sprint
        retrieved_sprint = crud.get_sprint(session=db, sprint_id=sprint.id)

        # Assertions
        assert retrieved_sprint is not None
        assert retrieved_sprint.id == sprint.id
        assert retrieved_sprint.user_id == user.id

    def test_get_sprints(
        self, db: Session, normal_user_token_headers: dict[str, str]
    ) -> None:
        """Test getting all sprints for a user"""
        # Get user from token
        user = db.exec(select(User).where(User.email == "test@example.com")).first()
        assert user is not None

        # Create multiple sprints
        sprint_data1 = SprintCreate(
            start_date=date(2024, 1, 1),
            end_date=date(2024, 1, 31),
            payday_anchor=date(2024, 1, 1),
            is_closed=False,
        )
        sprint_data2 = SprintCreate(
            start_date=date(2024, 2, 1),
            end_date=date(2024, 2, 28),
            payday_anchor=date(2024, 2, 1),
            is_closed=False,
        )

        crud.create_sprint(session=db, sprint_in=sprint_data1, user_id=user.id)
        crud.create_sprint(session=db, sprint_in=sprint_data2, user_id=user.id)

        # Get sprints
        sprints, count = crud.get_sprints(session=db, user_id=user.id)

        # Assertions
        assert len(sprints) == 2
        assert count == 2
        assert all(sprint.user_id == user.id for sprint in sprints)

    def test_update_sprint(
        self, db: Session, normal_user_token_headers: dict[str, str]
    ) -> None:
        """Test updating a sprint"""
        # Get user from token
        user = db.exec(select(User).where(User.email == "test@example.com")).first()
        assert user is not None

        # Create sprint
        sprint_data = SprintCreate(
            start_date=date(2024, 1, 1),
            end_date=date(2024, 1, 31),
            payday_anchor=date(2024, 1, 1),
            is_closed=False,
        )
        sprint = crud.create_sprint(session=db, sprint_in=sprint_data, user_id=user.id)
        original_updated_at = sprint.updated_at

        # Wait a bit to ensure timestamp difference
        import time

        time.sleep(0.01)

        # Update sprint
        update_data = SprintUpdate(is_closed=True, end_date=date(2024, 1, 30))
        updated_sprint = crud.update_sprint(
            session=db, db_sprint=sprint, sprint_in=update_data
        )

        # Assertions
        assert updated_sprint.is_closed is True
        assert updated_sprint.end_date == date(2024, 1, 30)
        assert updated_sprint.start_date == date(2024, 1, 1)  # Should remain unchanged
        assert updated_sprint.updated_at >= original_updated_at

    def test_delete_sprint(
        self, db: Session, normal_user_token_headers: dict[str, str]
    ) -> None:
        """Test deleting a sprint"""
        # Get user from token
        user = db.exec(select(User).where(User.email == "test@example.com")).first()
        assert user is not None

        # Create sprint
        sprint_data = SprintCreate(
            start_date=date(2024, 1, 1),
            end_date=date(2024, 1, 31),
            payday_anchor=date(2024, 1, 1),
            is_closed=False,
        )
        sprint = crud.create_sprint(session=db, sprint_in=sprint_data, user_id=user.id)
        sprint_id = sprint.id

        # Delete sprint
        deleted_sprint = crud.delete_sprint(session=db, sprint_id=sprint_id)

        # Assertions
        assert deleted_sprint is not None
        assert deleted_sprint.id == sprint_id

        # Verify sprint is deleted
        retrieved_sprint = crud.get_sprint(session=db, sprint_id=sprint_id)
        assert retrieved_sprint is None
