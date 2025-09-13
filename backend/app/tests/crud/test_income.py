from datetime import date

from sqlmodel import Session, select

from app import crud
from app.models import IncomeCreate, IncomeUpdate, Sprint, User


class TestIncomeCRUD:
    def test_create_income(
        self, db: Session, normal_user_token_headers: dict[str, str]
    ) -> None:
        """Test creating an income"""
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

        # Create income data
        income_data = IncomeCreate(
            received_at=date(2024, 1, 15),
            source="Salary",
            gross_amount=10000000.0,
            net_amount=8500000.0,
            currency="VND",
            sprint_id=sprint_data.id,
        )

        # Create income
        income = crud.create_income(session=db, income_in=income_data, user_id=user.id)

        # Assertions
        assert income.id is not None
        assert income.user_id == user.id
        assert income.sprint_id == sprint_data.id
        assert income.received_at == date(2024, 1, 15)
        assert income.source == "Salary"
        assert income.gross_amount == 10000000.0
        assert income.net_amount == 8500000.0
        assert income.currency == "VND"
        assert income.created_at is not None
        assert income.updated_at is not None

    def test_create_income_with_defaults(
        self, db: Session, normal_user_token_headers: dict[str, str]
    ) -> None:
        """Test creating an income with default values"""
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

        # Create income data with minimal required fields
        income_data = IncomeCreate(
            received_at=date(2024, 1, 15),
            source="Freelance",
            gross_amount=5000000.0,
            net_amount=4500000.0,
            sprint_id=sprint_data.id,
        )

        # Create income
        income = crud.create_income(session=db, income_in=income_data, user_id=user.id)

        # Assertions
        assert income.id is not None
        assert income.user_id == user.id
        assert income.sprint_id == sprint_data.id
        assert income.source == "Freelance"
        assert income.gross_amount == 5000000.0
        assert income.net_amount == 4500000.0
        assert income.currency == "VND"  # Default value

    def test_get_income(
        self, db: Session, normal_user_token_headers: dict[str, str]
    ) -> None:
        """Test getting an income by ID"""
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

        # Create income
        income_data = IncomeCreate(
            received_at=date(2024, 1, 15),
            source="Test Income",
            gross_amount=1000000.0,
            net_amount=900000.0,
            sprint_id=sprint_data.id,
        )
        income = crud.create_income(session=db, income_in=income_data, user_id=user.id)

        # Get income
        retrieved_income = crud.get_income(session=db, income_id=income.id)

        # Assertions
        assert retrieved_income is not None
        assert retrieved_income.id == income.id
        assert retrieved_income.user_id == user.id
        assert retrieved_income.source == "Test Income"

    def test_get_incomes(
        self, db: Session, normal_user_token_headers: dict[str, str]
    ) -> None:
        """Test getting all incomes for a user"""
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

        # Create multiple incomes
        income_data1 = IncomeCreate(
            received_at=date(2024, 1, 15),
            source="Salary",
            gross_amount=10000000.0,
            net_amount=8500000.0,
            sprint_id=sprint_data.id,
        )
        income_data2 = IncomeCreate(
            received_at=date(2024, 1, 20),
            source="Bonus",
            gross_amount=2000000.0,
            net_amount=1800000.0,
            sprint_id=sprint_data.id,
        )

        crud.create_income(session=db, income_in=income_data1, user_id=user.id)
        crud.create_income(session=db, income_in=income_data2, user_id=user.id)

        # Get incomes
        incomes, count = crud.get_incomes(session=db, user_id=user.id)

        # Assertions
        assert len(incomes) == 2
        assert count == 2
        assert all(income.user_id == user.id for income in incomes)

    def test_update_income(
        self, db: Session, normal_user_token_headers: dict[str, str]
    ) -> None:
        """Test updating an income"""
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

        # Create income
        income_data = IncomeCreate(
            received_at=date(2024, 1, 15),
            source="Test Income",
            gross_amount=1000000.0,
            net_amount=900000.0,
            sprint_id=sprint_data.id,
        )
        income = crud.create_income(session=db, income_in=income_data, user_id=user.id)

        # Update income
        update_data = IncomeUpdate(
            source="Updated Income",
            gross_amount=1500000.0,
            net_amount=1350000.0,
            currency="USD",
        )
        updated_income = crud.update_income(
            session=db, db_income=income, income_in=update_data
        )

        # Assertions
        assert updated_income.source == "Updated Income"
        assert updated_income.gross_amount == 1500000.0
        assert updated_income.net_amount == 1350000.0
        assert updated_income.currency == "USD"
        assert updated_income.received_at == date(
            2024, 1, 15
        )  # Should remain unchanged
        assert updated_income.updated_at >= income.updated_at

    def test_delete_income(
        self, db: Session, normal_user_token_headers: dict[str, str]
    ) -> None:
        """Test deleting an income"""
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

        # Create income
        income_data = IncomeCreate(
            received_at=date(2024, 1, 15),
            source="Test Income",
            gross_amount=1000000.0,
            net_amount=900000.0,
            sprint_id=sprint_data.id,
        )
        income = crud.create_income(session=db, income_in=income_data, user_id=user.id)
        income_id = income.id

        # Delete income
        deleted_income = crud.delete_income(session=db, income_id=income_id)

        # Assertions
        assert deleted_income is not None
        assert deleted_income.id == income_id

        # Verify income is deleted
        retrieved_income = crud.get_income(session=db, income_id=income_id)
        assert retrieved_income is None

    def test_income_amounts(
        self, db: Session, normal_user_token_headers: dict[str, str]
    ) -> None:
        """Test creating incomes with different amounts"""
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

        # Test different amount scenarios
        test_cases = [
            ("Small Income", 100000.0, 95000.0),
            ("Medium Income", 5000000.0, 4500000.0),
            ("Large Income", 20000000.0, 18000000.0),
        ]

        for source, gross, net in test_cases:
            income_data = IncomeCreate(
                received_at=date(2024, 1, 15),
                source=source,
                gross_amount=gross,
                net_amount=net,
                sprint_id=sprint_data.id,
            )
            income = crud.create_income(
                session=db, income_in=income_data, user_id=user.id
            )
            assert income.gross_amount == gross
            assert income.net_amount == net

    def test_income_currencies(
        self, db: Session, normal_user_token_headers: dict[str, str]
    ) -> None:
        """Test creating incomes with different currencies"""
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

        # Test different currencies
        currencies = ["VND", "USD", "EUR", "JPY"]

        for currency in currencies:
            income_data = IncomeCreate(
                received_at=date(2024, 1, 15),
                source=f"Income in {currency}",
                gross_amount=1000.0,
                net_amount=900.0,
                currency=currency,
                sprint_id=sprint_data.id,
            )
            income = crud.create_income(
                session=db, income_in=income_data, user_id=user.id
            )
            assert income.currency == currency
