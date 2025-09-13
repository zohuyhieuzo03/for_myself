import uuid
from datetime import date

from fastapi.testclient import TestClient
from sqlmodel import Session, select

from app.models import Sprint, User


class TestSprintAPI:
    def test_create_sprint(
        self, client: TestClient, db: Session, normal_user_token_headers: dict[str, str]
    ) -> None:
        """Test creating a sprint via API"""
        sprint_data = {
            "start_date": "2024-01-01",
            "end_date": "2024-01-31",
            "payday_anchor": "2024-01-01",
            "is_closed": False,
        }

        response = client.post(
            "/api/v1/sprints/", json=sprint_data, headers=normal_user_token_headers
        )

        assert response.status_code == 200
        data = response.json()
        assert data["start_date"] == "2024-01-01"
        assert data["end_date"] == "2024-01-31"
        assert data["payday_anchor"] == "2024-01-01"
        assert data["is_closed"] is False
        assert "id" in data
        assert "user_id" in data
        assert "created_at" in data
        assert "updated_at" in data

    def test_get_sprints(
        self, client: TestClient, db: Session, normal_user_token_headers: dict[str, str]
    ) -> None:
        """Test getting sprints via API"""
        # Get user and create some sprints first
        user = db.exec(select(User).where(User.email == "test@example.com")).first()
        assert user is not None

        sprint1 = Sprint(
            start_date=date(2024, 1, 1),
            end_date=date(2024, 1, 31),
            payday_anchor=date(2024, 1, 1),
            is_closed=False,
            user_id=user.id,
        )
        sprint2 = Sprint(
            start_date=date(2024, 2, 1),
            end_date=date(2024, 2, 28),
            payday_anchor=date(2024, 2, 1),
            is_closed=False,
            user_id=user.id,
        )

        db.add(sprint1)
        db.add(sprint2)
        db.commit()

        response = client.get("/api/v1/sprints/", headers=normal_user_token_headers)

        assert response.status_code == 200
        data = response.json()
        assert data["count"] == 2
        assert len(data["data"]) == 2

    def test_get_sprint_by_id(
        self, client: TestClient, db: Session, normal_user_token_headers: dict[str, str]
    ) -> None:
        """Test getting a specific sprint by ID via API"""
        # Get user and create a sprint first
        user = db.exec(select(User).where(User.email == "test@example.com")).first()
        assert user is not None

        sprint = Sprint(
            start_date=date(2024, 1, 1),
            end_date=date(2024, 1, 31),
            payday_anchor=date(2024, 1, 1),
            is_closed=False,
            user_id=user.id,
        )

        db.add(sprint)
        db.commit()
        db.refresh(sprint)

        response = client.get(
            f"/api/v1/sprints/{sprint.id}", headers=normal_user_token_headers
        )

        assert response.status_code == 200
        data = response.json()
        assert data["id"] == str(sprint.id)
        assert data["start_date"] == "2024-01-01"
        assert data["end_date"] == "2024-01-31"

    def test_update_sprint(
        self, client: TestClient, db: Session, normal_user_token_headers: dict[str, str]
    ) -> None:
        """Test updating a sprint via API"""
        # Get user and create a sprint first
        user = db.exec(select(User).where(User.email == "test@example.com")).first()
        assert user is not None

        sprint = Sprint(
            start_date=date(2024, 1, 1),
            end_date=date(2024, 1, 31),
            payday_anchor=date(2024, 1, 1),
            is_closed=False,
            user_id=user.id,
        )

        db.add(sprint)
        db.commit()
        db.refresh(sprint)

        update_data = {"is_closed": True, "end_date": "2024-01-30"}

        response = client.patch(
            f"/api/v1/sprints/{sprint.id}",
            json=update_data,
            headers=normal_user_token_headers,
        )

        assert response.status_code == 200
        data = response.json()
        assert data["is_closed"] is True
        assert data["end_date"] == "2024-01-30"
        assert data["start_date"] == "2024-01-01"  # Should remain unchanged

    def test_delete_sprint(
        self, client: TestClient, db: Session, normal_user_token_headers: dict[str, str]
    ) -> None:
        """Test deleting a sprint via API"""
        # Get user and create a sprint first
        user = db.exec(select(User).where(User.email == "test@example.com")).first()
        assert user is not None

        sprint = Sprint(
            start_date=date(2024, 1, 1),
            end_date=date(2024, 1, 31),
            payday_anchor=date(2024, 1, 1),
            is_closed=False,
            user_id=user.id,
        )

        db.add(sprint)
        db.commit()
        db.refresh(sprint)

        response = client.delete(
            f"/api/v1/sprints/{sprint.id}", headers=normal_user_token_headers
        )

        assert response.status_code == 200
        data = response.json()
        assert data["message"] == "Sprint deleted successfully"

        # Verify sprint is deleted
        get_response = client.get(
            f"/api/v1/sprints/{sprint.id}", headers=normal_user_token_headers
        )
        assert get_response.status_code == 404

    def test_get_nonexistent_sprint(
        self, client: TestClient, normal_user_token_headers: dict[str, str]
    ) -> None:
        """Test getting a nonexistent sprint via API"""
        fake_id = uuid.uuid4()
        response = client.get(
            f"/api/v1/sprints/{fake_id}", headers=normal_user_token_headers
        )

        assert response.status_code == 404

    def test_update_nonexistent_sprint(
        self, client: TestClient, normal_user_token_headers: dict[str, str]
    ) -> None:
        """Test updating a nonexistent sprint via API"""
        fake_id = uuid.uuid4()
        update_data = {"is_closed": True}

        response = client.patch(
            f"/api/v1/sprints/{fake_id}",
            json=update_data,
            headers=normal_user_token_headers,
        )

        assert response.status_code == 404

    def test_delete_nonexistent_sprint(
        self, client: TestClient, normal_user_token_headers: dict[str, str]
    ) -> None:
        """Test deleting a nonexistent sprint via API"""
        fake_id = uuid.uuid4()
        response = client.delete(
            f"/api/v1/sprints/{fake_id}", headers=normal_user_token_headers
        )

        assert response.status_code == 404

    def test_create_sprint_unauthorized(self, client: TestClient) -> None:
        """Test creating a sprint without authentication"""
        sprint_data = {
            "start_date": "2024-01-01",
            "end_date": "2024-01-31",
            "payday_anchor": "2024-01-01",
            "is_closed": False,
        }

        response = client.post("/api/v1/sprints/", json=sprint_data)

        assert response.status_code == 401

    def test_get_sprints_unauthorized(self, client: TestClient) -> None:
        """Test getting sprints without authentication"""
        response = client.get("/api/v1/sprints/")

        assert response.status_code == 401
