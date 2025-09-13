from sqlmodel import Session, select

from app import crud
from app.models import CategoryCreate, CategoryGroup, CategoryUpdate, User


class TestCategoryCRUD:
    def test_create_category(
        self, db: Session, normal_user_token_headers: dict[str, str]
    ) -> None:
        """Test creating a category"""
        # Get user from token
        user = db.exec(select(User).where(User.email == "test@example.com")).first()
        assert user is not None

        # Create category data
        category_data = CategoryCreate(
            name="Food & Dining", grp=CategoryGroup.needs, is_envelope=True
        )

        # Create category
        category = crud.create_category(
            session=db, category_in=category_data, user_id=user.id
        )

        # Assertions
        assert category.id is not None
        assert category.user_id == user.id
        assert category.name == "Food & Dining"
        assert category.grp == CategoryGroup.needs
        assert category.is_envelope is True
        assert category.created_at is not None
        assert category.updated_at is not None

    def test_create_category_with_defaults(
        self, db: Session, normal_user_token_headers: dict[str, str]
    ) -> None:
        """Test creating a category with default values"""
        # Get user from token
        user = db.exec(select(User).where(User.email == "test@example.com")).first()
        assert user is not None

        # Create category data with minimal required fields
        category_data = CategoryCreate(name="Entertainment", grp=CategoryGroup.wants)

        # Create category
        category = crud.create_category(
            session=db, category_in=category_data, user_id=user.id
        )

        # Assertions
        assert category.id is not None
        assert category.user_id == user.id
        assert category.name == "Entertainment"
        assert category.grp == CategoryGroup.wants
        assert category.is_envelope is True  # Default value

    def test_get_category(
        self, db: Session, normal_user_token_headers: dict[str, str]
    ) -> None:
        """Test getting a category by ID"""
        # Get user from token
        user = db.exec(select(User).where(User.email == "test@example.com")).first()
        assert user is not None

        # Create category
        category_data = CategoryCreate(
            name="Test Category", grp=CategoryGroup.savings_debt, is_envelope=False
        )
        category = crud.create_category(
            session=db, category_in=category_data, user_id=user.id
        )

        # Get category
        retrieved_category = crud.get_category(session=db, category_id=category.id)

        # Assertions
        assert retrieved_category is not None
        assert retrieved_category.id == category.id
        assert retrieved_category.user_id == user.id
        assert retrieved_category.name == "Test Category"

    def test_get_categories(
        self, db: Session, normal_user_token_headers: dict[str, str]
    ) -> None:
        """Test getting all categories for a user"""
        # Get user from token
        user = db.exec(select(User).where(User.email == "test@example.com")).first()
        assert user is not None

        # Create multiple categories
        category_data1 = CategoryCreate(
            name="Groceries", grp=CategoryGroup.needs, is_envelope=True
        )
        category_data2 = CategoryCreate(
            name="Movies", grp=CategoryGroup.wants, is_envelope=True
        )
        category_data3 = CategoryCreate(
            name="Emergency Fund", grp=CategoryGroup.savings_debt, is_envelope=True
        )

        crud.create_category(session=db, category_in=category_data1, user_id=user.id)
        crud.create_category(session=db, category_in=category_data2, user_id=user.id)
        crud.create_category(session=db, category_in=category_data3, user_id=user.id)

        # Get categories
        categories, count = crud.get_categories(session=db, user_id=user.id)

        # Assertions
        assert len(categories) == 3
        assert count == 3
        assert all(category.user_id == user.id for category in categories)

    def test_update_category(
        self, db: Session, normal_user_token_headers: dict[str, str]
    ) -> None:
        """Test updating a category"""
        # Get user from token
        user = db.exec(select(User).where(User.email == "test@example.com")).first()
        assert user is not None

        # Create category
        category_data = CategoryCreate(
            name="Test Category", grp=CategoryGroup.needs, is_envelope=True
        )
        category = crud.create_category(
            session=db, category_in=category_data, user_id=user.id
        )

        # Update category
        update_data = CategoryUpdate(
            name="Updated Category", grp=CategoryGroup.wants, is_envelope=False
        )
        updated_category = crud.update_category(
            session=db, db_category=category, category_in=update_data
        )

        # Assertions
        assert updated_category.name == "Updated Category"
        assert updated_category.grp == CategoryGroup.wants
        assert updated_category.is_envelope is False
        assert updated_category.updated_at >= category.updated_at

    def test_delete_category(
        self, db: Session, normal_user_token_headers: dict[str, str]
    ) -> None:
        """Test deleting a category"""
        # Get user from token
        user = db.exec(select(User).where(User.email == "test@example.com")).first()
        assert user is not None

        # Create category
        category_data = CategoryCreate(
            name="Test Category", grp=CategoryGroup.needs, is_envelope=True
        )
        category = crud.create_category(
            session=db, category_in=category_data, user_id=user.id
        )
        category_id = category.id

        # Delete category
        deleted_category = crud.delete_category(session=db, category_id=category_id)

        # Assertions
        assert deleted_category is not None
        assert deleted_category.id == category_id

        # Verify category is deleted
        retrieved_category = crud.get_category(session=db, category_id=category_id)
        assert retrieved_category is None

    def test_category_groups(
        self, db: Session, normal_user_token_headers: dict[str, str]
    ) -> None:
        """Test creating categories with different groups"""
        # Get user from token
        user = db.exec(select(User).where(User.email == "test@example.com")).first()
        assert user is not None

        # Test all category groups
        category_groups = [
            CategoryGroup.needs,
            CategoryGroup.wants,
            CategoryGroup.savings_debt,
        ]

        for group in category_groups:
            category_data = CategoryCreate(
                name=f"Test {group.value} Category", grp=group, is_envelope=True
            )
            category = crud.create_category(
                session=db, category_in=category_data, user_id=user.id
            )
            assert category.grp == group

    def test_category_envelope_flag(
        self, db: Session, normal_user_token_headers: dict[str, str]
    ) -> None:
        """Test creating categories with different envelope flags"""
        # Get user from token
        user = db.exec(select(User).where(User.email == "test@example.com")).first()
        assert user is not None

        # Test envelope flag variations
        test_cases = [("Envelope Category", True), ("Non-Envelope Category", False)]

        for name, is_envelope in test_cases:
            category_data = CategoryCreate(
                name=name, grp=CategoryGroup.needs, is_envelope=is_envelope
            )
            category = crud.create_category(
                session=db, category_in=category_data, user_id=user.id
            )
            assert category.is_envelope == is_envelope
