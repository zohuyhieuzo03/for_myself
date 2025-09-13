from datetime import date

from sqlmodel import Session, select

from app import crud
from app.models import (
    Account,
    AccountType,
    Category,
    CategoryGroup,
    Sprint,
    TransactionCreate,
    TransactionUpdate,
    TxnType,
    User,
)


class TestTransactionCRUD:
    def test_create_transaction(
        self, db: Session, normal_user_token_headers: dict[str, str]
    ) -> None:
        """Test creating a transaction"""
        # Get user from token
        user = db.exec(select(User).where(User.email == "test@example.com")).first()
        assert user is not None

        # Create sprint first
        sprint_data = Sprint(
            start_date=date(2024, 1, 1),
            end_date=date(2024, 1, 31),
            payday_anchor=date(2024, 1, 1),
            is_closed=False,
            user_id=user.id,
        )
        db.add(sprint_data)
        db.commit()
        db.refresh(sprint_data)

        # Create account
        account_data = Account(
            name="Test Bank Account",
            type=AccountType.bank,
            currency="VND",
            is_active=True,
            user_id=user.id,
        )
        db.add(account_data)
        db.commit()
        db.refresh(account_data)

        # Create category
        category_data = Category(
            name="Food & Dining",
            grp=CategoryGroup.needs,
            is_envelope=True,
            user_id=user.id,
        )
        db.add(category_data)
        db.commit()
        db.refresh(category_data)

        # Create transaction data
        transaction_data = TransactionCreate(
            txn_date=date(2024, 1, 15),
            type=TxnType.expense,
            amount=150000.0,
            currency="VND",
            merchant="Restaurant ABC",
            note="Lunch with colleagues",
            account_id=account_data.id,
            category_id=category_data.id,
            sprint_id=sprint_data.id,
        )

        # Create transaction
        transaction = crud.create_transaction(
            session=db, transaction_in=transaction_data, user_id=user.id
        )

        # Assertions
        assert transaction.id is not None
        assert transaction.user_id == user.id
        assert transaction.sprint_id == sprint_data.id
        assert transaction.account_id == account_data.id
        assert transaction.category_id == category_data.id
        assert transaction.txn_date == date(2024, 1, 15)
        assert transaction.type == TxnType.expense
        assert transaction.amount == 150000.0
        assert transaction.currency == "VND"
        assert transaction.merchant == "Restaurant ABC"
        assert transaction.note == "Lunch with colleagues"
        assert transaction.created_at is not None
        assert transaction.updated_at is not None

    def test_create_transaction_with_minimal_data(
        self, db: Session, normal_user_token_headers: dict[str, str]
    ) -> None:
        """Test creating a transaction with minimal required data"""
        # Get user from token
        user = db.exec(select(User).where(User.email == "test@example.com")).first()
        assert user is not None

        # Create account
        account_data = Account(
            name="Cash Wallet",
            type=AccountType.cash,
            currency="VND",
            is_active=True,
            user_id=user.id,
        )
        db.add(account_data)
        db.commit()
        db.refresh(account_data)

        # Create transaction data with minimal required fields
        transaction_data = TransactionCreate(
            txn_date=date(2024, 1, 15),
            type=TxnType.income,
            amount=500000.0,
            account_id=account_data.id,
        )

        # Create transaction
        transaction = crud.create_transaction(
            session=db, transaction_in=transaction_data, user_id=user.id
        )

        # Assertions
        assert transaction.id is not None
        assert transaction.user_id == user.id
        assert transaction.account_id == account_data.id
        assert transaction.txn_date == date(2024, 1, 15)
        assert transaction.type == TxnType.income
        assert transaction.amount == 500000.0
        assert transaction.currency == "VND"  # Default value
        assert transaction.merchant is None
        assert transaction.note is None
        assert transaction.sprint_id is None
        assert transaction.category_id is None

    def test_get_transaction(
        self, db: Session, normal_user_token_headers: dict[str, str]
    ) -> None:
        """Test getting a transaction by ID"""
        # Get user from token
        user = db.exec(select(User).where(User.email == "test@example.com")).first()
        assert user is not None

        # Create account
        account_data = Account(
            name="Test Account",
            type=AccountType.bank,
            currency="VND",
            is_active=True,
            user_id=user.id,
        )
        db.add(account_data)
        db.commit()
        db.refresh(account_data)

        # Create transaction
        transaction_data = TransactionCreate(
            txn_date=date(2024, 1, 15),
            type=TxnType.expense,
            amount=100000.0,
            account_id=account_data.id,
        )
        transaction = crud.create_transaction(
            session=db, transaction_in=transaction_data, user_id=user.id
        )

        # Get transaction
        retrieved_transaction = crud.get_transaction(
            session=db, transaction_id=transaction.id
        )

        # Assertions
        assert retrieved_transaction is not None
        assert retrieved_transaction.id == transaction.id
        assert retrieved_transaction.user_id == user.id
        assert retrieved_transaction.amount == 100000.0

    def test_get_transactions(
        self, db: Session, normal_user_token_headers: dict[str, str]
    ) -> None:
        """Test getting all transactions for a user"""
        # Get user from token
        user = db.exec(select(User).where(User.email == "test@example.com")).first()
        assert user is not None

        # Create account
        account_data = Account(
            name="Test Account",
            type=AccountType.bank,
            currency="VND",
            is_active=True,
            user_id=user.id,
        )
        db.add(account_data)
        db.commit()
        db.refresh(account_data)

        # Create multiple transactions
        transaction_data1 = TransactionCreate(
            txn_date=date(2024, 1, 15),
            type=TxnType.expense,
            amount=100000.0,
            account_id=account_data.id,
        )
        transaction_data2 = TransactionCreate(
            txn_date=date(2024, 1, 16),
            type=TxnType.income,
            amount=500000.0,
            account_id=account_data.id,
        )

        crud.create_transaction(
            session=db, transaction_in=transaction_data1, user_id=user.id
        )
        crud.create_transaction(
            session=db, transaction_in=transaction_data2, user_id=user.id
        )

        # Get transactions
        transactions, count = crud.get_transactions(session=db, user_id=user.id)

        # Assertions
        assert len(transactions) == 2
        assert count == 2
        assert all(transaction.user_id == user.id for transaction in transactions)

    def test_update_transaction(
        self, db: Session, normal_user_token_headers: dict[str, str]
    ) -> None:
        """Test updating a transaction"""
        # Get user from token
        user = db.exec(select(User).where(User.email == "test@example.com")).first()
        assert user is not None

        # Create account
        account_data = Account(
            name="Test Account",
            type=AccountType.bank,
            currency="VND",
            is_active=True,
            user_id=user.id,
        )
        db.add(account_data)
        db.commit()
        db.refresh(account_data)

        # Create transaction
        transaction_data = TransactionCreate(
            txn_date=date(2024, 1, 15),
            type=TxnType.expense,
            amount=100000.0,
            account_id=account_data.id,
        )
        transaction = crud.create_transaction(
            session=db, transaction_in=transaction_data, user_id=user.id
        )

        # Update transaction
        update_data = TransactionUpdate(
            amount=150000.0, merchant="Updated Merchant", note="Updated note"
        )
        updated_transaction = crud.update_transaction(
            session=db, db_transaction=transaction, transaction_in=update_data
        )

        # Assertions
        assert updated_transaction.amount == 150000.0
        assert updated_transaction.merchant == "Updated Merchant"
        assert updated_transaction.note == "Updated note"
        assert updated_transaction.txn_date == date(
            2024, 1, 15
        )  # Should remain unchanged
        assert updated_transaction.type == TxnType.expense  # Should remain unchanged
        assert updated_transaction.updated_at >= transaction.updated_at

    def test_delete_transaction(
        self, db: Session, normal_user_token_headers: dict[str, str]
    ) -> None:
        """Test deleting a transaction"""
        # Get user from token
        user = db.exec(select(User).where(User.email == "test@example.com")).first()
        assert user is not None

        # Create account
        account_data = Account(
            name="Test Account",
            type=AccountType.bank,
            currency="VND",
            is_active=True,
            user_id=user.id,
        )
        db.add(account_data)
        db.commit()
        db.refresh(account_data)

        # Create transaction
        transaction_data = TransactionCreate(
            txn_date=date(2024, 1, 15),
            type=TxnType.expense,
            amount=100000.0,
            account_id=account_data.id,
        )
        transaction = crud.create_transaction(
            session=db, transaction_in=transaction_data, user_id=user.id
        )
        transaction_id = transaction.id

        # Delete transaction
        deleted_transaction = crud.delete_transaction(
            session=db, transaction_id=transaction_id
        )

        # Assertions
        assert deleted_transaction is not None
        assert deleted_transaction.id == transaction_id

        # Verify transaction is deleted
        retrieved_transaction = crud.get_transaction(
            session=db, transaction_id=transaction_id
        )
        assert retrieved_transaction is None

    def test_transaction_types(
        self, db: Session, normal_user_token_headers: dict[str, str]
    ) -> None:
        """Test creating transactions with different types"""
        # Get user from token
        user = db.exec(select(User).where(User.email == "test@example.com")).first()
        assert user is not None

        # Create account
        account_data = Account(
            name="Test Account",
            type=AccountType.bank,
            currency="VND",
            is_active=True,
            user_id=user.id,
        )
        db.add(account_data)
        db.commit()
        db.refresh(account_data)

        # Test both transaction types
        transaction_types = [TxnType.income, TxnType.expense]

        for txn_type in transaction_types:
            transaction_data = TransactionCreate(
                txn_date=date(2024, 1, 15),
                type=txn_type,
                amount=100000.0,
                account_id=account_data.id,
            )
            transaction = crud.create_transaction(
                session=db, transaction_in=transaction_data, user_id=user.id
            )
            assert transaction.type == txn_type

    def test_transaction_amounts(
        self, db: Session, normal_user_token_headers: dict[str, str]
    ) -> None:
        """Test creating transactions with different amounts"""
        # Get user from token
        user = db.exec(select(User).where(User.email == "test@example.com")).first()
        assert user is not None

        # Create account
        account_data = Account(
            name="Test Account",
            type=AccountType.bank,
            currency="VND",
            is_active=True,
            user_id=user.id,
        )
        db.add(account_data)
        db.commit()
        db.refresh(account_data)

        # Test different amounts
        amounts = [1000.0, 50000.0, 1000000.0, 5000000.0]

        for amount in amounts:
            transaction_data = TransactionCreate(
                txn_date=date(2024, 1, 15),
                type=TxnType.expense,
                amount=amount,
                account_id=account_data.id,
            )
            transaction = crud.create_transaction(
                session=db, transaction_in=transaction_data, user_id=user.id
            )
            assert transaction.amount == amount

    def test_transaction_currencies(
        self, db: Session, normal_user_token_headers: dict[str, str]
    ) -> None:
        """Test creating transactions with different currencies"""
        # Get user from token
        user = db.exec(select(User).where(User.email == "test@example.com")).first()
        assert user is not None

        # Create account
        account_data = Account(
            name="Test Account",
            type=AccountType.bank,
            currency="VND",
            is_active=True,
            user_id=user.id,
        )
        db.add(account_data)
        db.commit()
        db.refresh(account_data)

        # Test different currencies
        currencies = ["VND", "USD", "EUR", "JPY"]

        for currency in currencies:
            transaction_data = TransactionCreate(
                txn_date=date(2024, 1, 15),
                type=TxnType.expense,
                amount=100.0,
                currency=currency,
                account_id=account_data.id,
            )
            transaction = crud.create_transaction(
                session=db, transaction_in=transaction_data, user_id=user.id
            )
            assert transaction.currency == currency
