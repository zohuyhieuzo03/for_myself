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
    
    # Test first page
    response = client.get("/api/v1/accounts/", headers=normal_user_token_headers)
    assert response.status_code == 200
    
    data = response.json()
    assert "items" in data
    assert "total" in data
    assert "page" in data
    assert "size" in data
    assert "pages" in data
    
    # Should return all 12 accounts on first page
    assert len(data["items"]) == 12
    assert data["total"] == 12
    assert data["page"] == 1
    
    # Test with page size
    response = client.get(
        "/api/v1/accounts/?size=5", 
        headers=normal_user_token_headers
    )
    assert response.status_code == 200
    
    data = response.json()
    assert len(data["items"]) == 5
    assert data["total"] == 12
    assert data["page"] == 1
    assert data["size"] == 5
    assert data["pages"] == 3
    
    # Test second page
    response = client.get(
        "/api/v1/accounts/?page=2&size=5", 
        headers=normal_user_token_headers
    )
    assert response.status_code == 200
    
    data = response.json()
    assert len(data["items"]) == 5
    assert data["page"] == 2
    
    # Test third page (should have remaining items)
    response = client.get(
        "/api/v1/accounts/?page=3&size=5", 
        headers=normal_user_token_headers
    )
    assert response.status_code == 200
    
    data = response.json()
    assert len(data["items"]) == 2  # Remaining 2 items
    assert data["page"] == 3


def test_read_accounts_empty(
    client: TestClient, normal_user_token_headers: dict[str, str]
) -> None:
    """Test accounts endpoint with no data."""
    response = client.get("/api/v1/accounts/", headers=normal_user_token_headers)
    assert response.status_code == 200
    
    data = response.json()
    assert data["items"] == []
    assert data["total"] == 0
    assert data["page"] == 1
    assert data["size"] == 50  # default size
    assert data["pages"] == 0
