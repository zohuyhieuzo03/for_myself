import uuid
from fastapi.testclient import TestClient
from sqlmodel import Session, select

from app.models import Category, CategoryGroup, User


def test_read_categories_pagination(
    client: TestClient, normal_user_token_headers: dict[str, str], db: Session
) -> None:
    """Test pagination for categories endpoint."""
    # Note: Categories might already exist from init_db, so we'll clear them first
    # to have a clean test
    user = db.exec(select(User).where(User.email == "test@example.com")).first()
    
    # Delete existing categories for this test
    existing = db.exec(select(Category).where(Category.user_id == user.id)).all()
    for cat in existing:
        db.delete(cat)
    db.commit()
    
    # Create multiple categories
    categories = []
    for i in range(15):
        category = Category(
            name=f"Category {i}",
            grp=CategoryGroup.needs,
            user_id=user.id,
        )
        db.add(category)
        categories.append(category)
    
    db.commit()
    
    # Test default pagination
    response = client.get("/api/v1/categories/", headers=normal_user_token_headers)
    assert response.status_code == 200
    
    data = response.json()
    assert "data" in data
    assert "count" in data
    
    # Should return all 15 categories
    assert len(data["data"]) == 15
    assert data["count"] == 15
    
    # Test with skip and limit
    response = client.get(
        "/api/v1/categories/?skip=0&limit=5", 
        headers=normal_user_token_headers
    )
    assert response.status_code == 200
    
    data = response.json()
    assert len(data["data"]) == 5
    assert data["count"] == 15
    
    # Test second page (skip first 5)
    response = client.get(
        "/api/v1/categories/?skip=5&limit=5", 
        headers=normal_user_token_headers
    )
    assert response.status_code == 200
    
    data = response.json()
    assert len(data["data"]) == 5
    assert data["count"] == 15
    
    # Test third page
    response = client.get(
        "/api/v1/categories/?skip=10&limit=5", 
        headers=normal_user_token_headers
    )
    assert response.status_code == 200
    
    data = response.json()
    assert len(data["data"]) == 5
    assert data["count"] == 15


def test_read_categories_empty(
    client: TestClient, normal_user_token_headers: dict[str, str], db: Session
) -> None:
    """Test categories endpoint with no data."""
    # Delete all categories for this test
    user = db.exec(select(User).where(User.email == "test@example.com")).first()
    existing = db.exec(select(Category).where(Category.user_id == user.id)).all()
    for cat in existing:
        db.delete(cat)
    db.commit()
    
    response = client.get("/api/v1/categories/", headers=normal_user_token_headers)
    assert response.status_code == 200
    
    data = response.json()
    assert data["data"] == []
    assert data["count"] == 0


def test_read_categories_invalid_page(
    client: TestClient, normal_user_token_headers: dict[str, str]
) -> None:
    """Test categories endpoint with invalid skip parameter."""
    # Test negative skip
    response = client.get(
        "/api/v1/categories/?skip=-1", 
        headers=normal_user_token_headers
    )
    assert response.status_code == 422  # Validation error


def test_read_categories_invalid_size(
    client: TestClient, normal_user_token_headers: dict[str, str]
) -> None:
    """Test categories endpoint with invalid limit parameter."""
    # Test negative limit
    response = client.get(
        "/api/v1/categories/?limit=-1", 
        headers=normal_user_token_headers
    )
    assert response.status_code == 422  # Validation error
    
    # Test limit 0
    response = client.get(
        "/api/v1/categories/?limit=0", 
        headers=normal_user_token_headers
    )
    assert response.status_code == 422  # Validation error
    
    # Test very large limit (should be allowed)
    response = client.get(
        "/api/v1/categories/?limit=1000", 
        headers=normal_user_token_headers
    )
    # This should be allowed
    assert response.status_code == 200
