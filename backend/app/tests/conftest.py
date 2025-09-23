from collections.abc import Generator

import pytest
from fastapi.testclient import TestClient
from sqlmodel import Session, delete

from app.api.deps import get_db
from app.core.config import settings
from app.core.db import engine, init_db
from app.main import app
from app.models import (
    Account,
    AllocationRule,
    Category,
    Item,
    Transaction,
    User,
    EmailTransaction
)
from app.tests.utils.user import authentication_token_from_email
from app.tests.utils.utils import get_superuser_token_headers


@pytest.fixture(scope="function")
def db() -> Generator[Session, None, None]:
    """Create a fresh database session for each test function"""
    with Session(engine) as session:
        init_db(session)
        yield session
        # Clean up in reverse order of dependencies
        statement = delete(Transaction)
        session.exec(statement)
        statement = delete(AllocationRule)
        session.exec(statement)
        statement = delete(EmailTransaction)
        session.exec(statement)
        statement = delete(Category)
        session.exec(statement)
        statement = delete(Account)
        session.exec(statement)
        statement = delete(Item)
        session.exec(statement)
        statement = delete(User)
        session.exec(statement)
        session.commit()


@pytest.fixture(scope="function")
def client(db: Session) -> Generator[TestClient, None, None]:
    """Create a fresh test client for each test function"""

    def get_test_db() -> Session:
        return db

    app.dependency_overrides[get_db] = get_test_db
    with TestClient(app) as c:
        yield c
    app.dependency_overrides.clear()


@pytest.fixture(scope="function")
def superuser_token_headers(client: TestClient) -> dict[str, str]:
    """Create fresh superuser token headers for each test function"""
    # Superuser is already created by init_db, just get the token
    return get_superuser_token_headers(client)


@pytest.fixture(scope="function")
def normal_user_token_headers(client: TestClient, db: Session) -> dict[str, str]:
    """Create fresh normal user token headers for each test function"""
    return authentication_token_from_email(
        client=client, email=settings.EMAIL_TEST_USER, db=db
    )
