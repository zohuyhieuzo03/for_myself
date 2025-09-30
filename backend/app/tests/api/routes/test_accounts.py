import uuid
from fastapi.testclient import TestClient
from sqlmodel import Session, select

from app.models import Account, User


def test_read_accounts_pagination(
    client: TestClient, normal_user_token_headers: dict[str, str], db: Session
) -> None:
    """Test pagination for accounts endpoint."""
    # Create test user
    user = db.exec(select(User).where(User.email == "test@example.com")).first()
    
    # Create multiple accounts
    accounts = []
    for i in range(12):
        account = Account(
            name=f"Account {i}",
            account_type="cash",
            user_id=user.id,
        )
        db.add(account)
        accounts.append(account)
    
    db.commit()
    
    # Test default pagination
    response = client.get("/api/v1/accounts/", headers=normal_user_token_headers)
    assert response.status_code == 200
    
    data = response.json()
    assert "data" in data
    assert "count" in data
    
    # Should return all 12 accounts
    assert len(data["data"]) == 12
    assert data["count"] == 12
    
    # Test with skip and limit
    response = client.get(
        "/api/v1/accounts/?skip=0&limit=5", 
        headers=normal_user_token_headers
    )
    assert response.status_code == 200
    
    data = response.json()
    assert len(data["data"]) == 5
    assert data["count"] == 12
    
    # Test second page (skip first 5)
    response = client.get(
        "/api/v1/accounts/?skip=5&limit=5", 
        headers=normal_user_token_headers
    )
    assert response.status_code == 200
    
    data = response.json()
    assert len(data["data"]) == 5
    assert data["count"] == 12
    
    # Test third page (should have remaining items)
    response = client.get(
        "/api/v1/accounts/?skip=10&limit=5", 
        headers=normal_user_token_headers
    )
    assert response.status_code == 200
    
    data = response.json()
    assert len(data["data"]) == 2  # Remaining 2 items
    assert data["count"] == 12


def test_read_accounts_empty(
    client: TestClient, normal_user_token_headers: dict[str, str]
) -> None:
    """Test accounts endpoint with no data."""
    response = client.get("/api/v1/accounts/", headers=normal_user_token_headers)
    assert response.status_code == 200
    
    data = response.json()
    assert data["data"] == []
    assert data["count"] == 0
