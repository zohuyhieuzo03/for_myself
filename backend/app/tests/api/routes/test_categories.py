import uuid
from fastapi.testclient import TestClient
from sqlmodel import Session, select

from app.models import Category, CategoryGroup, User


def test_read_categories_pagination(
    client: TestClient, normal_user_token_headers: dict[str, str], db: Session
) -> None:
    """Test pagination for categories endpoint."""
    # Create test user
    user = db.exec(select(User).where(User.email == "test@example.com")).first()
    
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
    
    # Test first page (default size is usually 20)
    response = client.get("/api/v1/categories/", headers=normal_user_token_headers)
    assert response.status_code == 200
    
    data = response.json()
    assert "items" in data
    assert "total" in data
    assert "page" in data
    assert "size" in data
    assert "pages" in data
    
    # Should return all 15 categories on first page
    assert len(data["items"]) == 15
    assert data["total"] == 15
    assert data["page"] == 1
    
    # Test with page size
    response = client.get(
        "/api/v1/categories/?size=5", 
        headers=normal_user_token_headers
    )
    assert response.status_code == 200
    
    data = response.json()
    assert len(data["items"]) == 5
    assert data["total"] == 15
    assert data["page"] == 1
    assert data["size"] == 5
    assert data["pages"] == 3
    
    # Test second page
    response = client.get(
        "/api/v1/categories/?page=2&size=5", 
        headers=normal_user_token_headers
    )
    assert response.status_code == 200
    
    data = response.json()
    assert len(data["items"]) == 5
    assert data["page"] == 2
    
    # Test third page (should have remaining items)
    response = client.get(
        "/api/v1/categories/?page=3&size=5", 
        headers=normal_user_token_headers
    )
    assert response.status_code == 200
    
    data = response.json()
    assert len(data["items"]) == 5
    assert data["page"] == 3


def test_read_categories_empty(
    client: TestClient, normal_user_token_headers: dict[str, str]
) -> None:
    """Test categories endpoint with no data."""
    response = client.get("/api/v1/categories/", headers=normal_user_token_headers)
    assert response.status_code == 200
    
    data = response.json()
    assert data["items"] == []
    assert data["total"] == 0
    assert data["page"] == 1
    assert data["size"] == 50  # default size
    assert data["pages"] == 0


def test_read_categories_invalid_page(
    client: TestClient, normal_user_token_headers: dict[str, str]
) -> None:
    """Test categories endpoint with invalid page number."""
    # Test negative page
    response = client.get(
        "/api/v1/categories/?page=-1", 
        headers=normal_user_token_headers
    )
    assert response.status_code == 422  # Validation error
    
    # Test page 0
    response = client.get(
        "/api/v1/categories/?page=0", 
        headers=normal_user_token_headers
    )
    assert response.status_code == 422  # Validation error


def test_read_categories_invalid_size(
    client: TestClient, normal_user_token_headers: dict[str, str]
) -> None:
    """Test categories endpoint with invalid page size."""
    # Test negative size
    response = client.get(
        "/api/v1/categories/?size=-1", 
        headers=normal_user_token_headers
    )
    assert response.status_code == 422  # Validation error
    
    # Test size 0
    response = client.get(
        "/api/v1/categories/?size=0", 
        headers=normal_user_token_headers
    )
    assert response.status_code == 422  # Validation error
    
    # Test very large size (should be limited by max_size)
    response = client.get(
        "/api/v1/categories/?size=1000", 
        headers=normal_user_token_headers
    )
    # This might be allowed or limited, depending on configuration
    # For now, just check it doesn't crash
    assert response.status_code in [200, 422]
