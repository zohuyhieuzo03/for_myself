from sqlmodel import Session, select

from app import crud
from app.models import AccountCreate, AccountType, AccountUpdate, User


class TestAccountCRUD:
    def test_create_account(
        self, db: Session, normal_user_token_headers: dict[str, str]
    ) -> None:
        """Test creating an account"""
        # Get user from token
        user = db.exec(select(User).where(User.email == "test@example.com")).first()
        assert user is not None

        # Create account data
        account_data = AccountCreate(
            name="Test Bank Account",
            type=AccountType.bank,
            currency="VND",
            is_active=True,
        )

        # Create account
        account = crud.create_account(
            session=db, account_in=account_data, user_id=user.id
        )

        # Assertions
        assert account.id is not None
        assert account.user_id == user.id
        assert account.name == "Test Bank Account"
        assert account.type == AccountType.bank
        assert account.currency == "VND"
        assert account.is_active is True
        assert account.created_at is not None
        assert account.updated_at is not None

    def test_create_account_with_defaults(
        self, db: Session, normal_user_token_headers: dict[str, str]
    ) -> None:
        """Test creating an account with default values"""
        # Get user from token
        user = db.exec(select(User).where(User.email == "test@example.com")).first()
        assert user is not None

        # Create account data with minimal required fields
        account_data = AccountCreate(name="Cash Wallet")

        # Create account
        account = crud.create_account(
            session=db, account_in=account_data, user_id=user.id
        )

        # Assertions
        assert account.id is not None
        assert account.user_id == user.id
        assert account.name == "Cash Wallet"
        assert account.type == AccountType.cash  # Default value
        assert account.currency == "VND"  # Default value
        assert account.is_active is True  # Default value

    def test_get_account(
        self, db: Session, normal_user_token_headers: dict[str, str]
    ) -> None:
        """Test getting an account by ID"""
        # Get user from token
        user = db.exec(select(User).where(User.email == "test@example.com")).first()
        assert user is not None

        # Create account
        account_data = AccountCreate(
            name="Test Account", type=AccountType.ewallet, currency="USD"
        )
        account = crud.create_account(
            session=db, account_in=account_data, user_id=user.id
        )

        # Get account
        retrieved_account = crud.get_account(session=db, account_id=account.id)

        # Assertions
        assert retrieved_account is not None
        assert retrieved_account.id == account.id
        assert retrieved_account.user_id == user.id
        assert retrieved_account.name == "Test Account"

    def test_get_accounts(
        self, db: Session, normal_user_token_headers: dict[str, str]
    ) -> None:
        """Test getting all accounts for a user"""
        # Get user from token
        user = db.exec(select(User).where(User.email == "test@example.com")).first()
        assert user is not None

        # Create multiple accounts
        account_data1 = AccountCreate(
            name="Bank Account", type=AccountType.bank, currency="VND"
        )
        account_data2 = AccountCreate(
            name="E-Wallet", type=AccountType.ewallet, currency="VND"
        )

        crud.create_account(session=db, account_in=account_data1, user_id=user.id)
        crud.create_account(session=db, account_in=account_data2, user_id=user.id)

        # Get accounts
        accounts, count = crud.get_accounts(session=db, user_id=user.id)

        # Assertions
        assert len(accounts) == 2
        assert count == 2
        assert all(account.user_id == user.id for account in accounts)

    def test_update_account(
        self, db: Session, normal_user_token_headers: dict[str, str]
    ) -> None:
        """Test updating an account"""
        # Get user from token
        user = db.exec(select(User).where(User.email == "test@example.com")).first()
        assert user is not None

        # Create account
        account_data = AccountCreate(
            name="Test Account", type=AccountType.cash, currency="VND", is_active=True
        )
        account = crud.create_account(
            session=db, account_in=account_data, user_id=user.id
        )
        original_updated_at = account.updated_at

        # Wait a bit to ensure timestamp difference
        import time

        time.sleep(0.01)

        # Update account
        update_data = AccountUpdate(
            name="Updated Account", type=AccountType.bank, is_active=False
        )
        updated_account = crud.update_account(
            session=db, db_account=account, account_in=update_data
        )

        # Assertions
        assert updated_account.name == "Updated Account"
        assert updated_account.type == AccountType.bank
        assert updated_account.is_active is False
        assert updated_account.currency == "VND"  # Should remain unchanged
        assert updated_account.updated_at >= original_updated_at

    def test_delete_account(
        self, db: Session, normal_user_token_headers: dict[str, str]
    ) -> None:
        """Test deleting an account"""
        # Get user from token
        user = db.exec(select(User).where(User.email == "test@example.com")).first()
        assert user is not None

        # Create account
        account_data = AccountCreate(
            name="Test Account", type=AccountType.cash, currency="VND"
        )
        account = crud.create_account(
            session=db, account_in=account_data, user_id=user.id
        )
        account_id = account.id

        # Delete account
        deleted_account = crud.delete_account(session=db, account_id=account_id)

        # Assertions
        assert deleted_account is not None
        assert deleted_account.id == account_id

        # Verify account is deleted
        retrieved_account = crud.get_account(session=db, account_id=account_id)
        assert retrieved_account is None

    def test_account_types(
        self, db: Session, normal_user_token_headers: dict[str, str]
    ) -> None:
        """Test creating accounts with different types"""
        # Get user from token
        user = db.exec(select(User).where(User.email == "test@example.com")).first()
        assert user is not None

        # Test all account types
        account_types = [
            AccountType.cash,
            AccountType.bank,
            AccountType.ewallet,
            AccountType.investment,
            AccountType.credit_card,
            AccountType.other,
        ]

        for account_type in account_types:
            account_data = AccountCreate(
                name=f"Test {account_type.value} Account",
                type=account_type,
                currency="VND",
            )
            account = crud.create_account(
                session=db, account_in=account_data, user_id=user.id
            )
            assert account.type == account_type
