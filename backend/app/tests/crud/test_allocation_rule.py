from datetime import date

from sqlmodel import Session, select

from app import crud
from app.models import (
    AllocationRuleCreate,
    AllocationRuleUpdate,
    CategoryGroup,
    Sprint,
    User,
)


class TestAllocationRuleCRUD:
    def test_create_allocation_rule(
        self, db: Session, normal_user_token_headers: dict[str, str]
    ) -> None:
        """Test creating an allocation rule"""
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

        # Create allocation rule data
        allocation_rule_data = AllocationRuleCreate(
            grp=CategoryGroup.needs, percent=50.0, sprint_id=sprint_data.id
        )

        # Create allocation rule
        allocation_rule = crud.create_allocation_rule(
            session=db, allocation_rule_in=allocation_rule_data, user_id=user.id
        )

        # Assertions
        assert allocation_rule.id is not None
        assert allocation_rule.user_id == user.id
        assert allocation_rule.sprint_id == sprint_data.id
        assert allocation_rule.grp == CategoryGroup.needs
        assert allocation_rule.percent == 50.0
        assert allocation_rule.created_at is not None
        assert allocation_rule.updated_at is not None

    def test_create_allocation_rule_50_30_20(
        self, db: Session, normal_user_token_headers: dict[str, str]
    ) -> None:
        """Test creating the standard 50/30/20 allocation rules"""
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

        # Create the standard 50/30/20 allocation rules
        rules_data = [
            AllocationRuleCreate(
                grp=CategoryGroup.needs, percent=50.0, sprint_id=sprint_data.id
            ),
            AllocationRuleCreate(
                grp=CategoryGroup.wants, percent=30.0, sprint_id=sprint_data.id
            ),
            AllocationRuleCreate(
                grp=CategoryGroup.savings_debt, percent=20.0, sprint_id=sprint_data.id
            ),
        ]

        created_rules = []
        for rule_data in rules_data:
            rule = crud.create_allocation_rule(
                session=db, allocation_rule_in=rule_data, user_id=user.id
            )
            created_rules.append(rule)

        # Assertions
        assert len(created_rules) == 3
        assert created_rules[0].grp == CategoryGroup.needs
        assert created_rules[0].percent == 50.0
        assert created_rules[1].grp == CategoryGroup.wants
        assert created_rules[1].percent == 30.0
        assert created_rules[2].grp == CategoryGroup.savings_debt
        assert created_rules[2].percent == 20.0

        # Verify total percentage
        total_percent = sum(rule.percent for rule in created_rules)
        assert total_percent == 100.0

    def test_get_allocation_rule(
        self, db: Session, normal_user_token_headers: dict[str, str]
    ) -> None:
        """Test getting an allocation rule by ID"""
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

        # Create allocation rule
        allocation_rule_data = AllocationRuleCreate(
            grp=CategoryGroup.needs, percent=50.0, sprint_id=sprint_data.id
        )
        allocation_rule = crud.create_allocation_rule(
            session=db, allocation_rule_in=allocation_rule_data, user_id=user.id
        )

        # Get allocation rule
        retrieved_rule = crud.get_allocation_rule(
            session=db, allocation_rule_id=allocation_rule.id
        )

        # Assertions
        assert retrieved_rule is not None
        assert retrieved_rule.id == allocation_rule.id
        assert retrieved_rule.user_id == user.id
        assert retrieved_rule.grp == CategoryGroup.needs

    def test_get_allocation_rules(
        self, db: Session, normal_user_token_headers: dict[str, str]
    ) -> None:
        """Test getting all allocation rules for a user"""
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

        # Create multiple allocation rules
        rules_data = [
            AllocationRuleCreate(
                grp=CategoryGroup.needs, percent=50.0, sprint_id=sprint_data.id
            ),
            AllocationRuleCreate(
                grp=CategoryGroup.wants, percent=30.0, sprint_id=sprint_data.id
            ),
            AllocationRuleCreate(
                grp=CategoryGroup.savings_debt, percent=20.0, sprint_id=sprint_data.id
            ),
        ]

        for rule_data in rules_data:
            crud.create_allocation_rule(
                session=db, allocation_rule_in=rule_data, user_id=user.id
            )

        # Get allocation rules
        allocation_rules, count = crud.get_allocation_rules(session=db, user_id=user.id)

        # Assertions
        assert len(allocation_rules) == 3
        assert count == 3
        assert all(rule.user_id == user.id for rule in allocation_rules)

    def test_update_allocation_rule(
        self, db: Session, normal_user_token_headers: dict[str, str]
    ) -> None:
        """Test updating an allocation rule"""
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

        # Create allocation rule
        allocation_rule_data = AllocationRuleCreate(
            grp=CategoryGroup.needs, percent=50.0, sprint_id=sprint_data.id
        )
        allocation_rule = crud.create_allocation_rule(
            session=db, allocation_rule_in=allocation_rule_data, user_id=user.id
        )

        # Update allocation rule
        update_data = AllocationRuleUpdate(percent=60.0)
        updated_rule = crud.update_allocation_rule(
            session=db,
            db_allocation_rule=allocation_rule,
            allocation_rule_in=update_data,
        )

        # Assertions
        assert updated_rule.percent == 60.0
        assert updated_rule.grp == CategoryGroup.needs  # Should remain unchanged
        assert updated_rule.sprint_id == sprint_data.id  # Should remain unchanged
        assert updated_rule.updated_at >= allocation_rule.updated_at

    def test_delete_allocation_rule(
        self, db: Session, normal_user_token_headers: dict[str, str]
    ) -> None:
        """Test deleting an allocation rule"""
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

        # Create allocation rule
        allocation_rule_data = AllocationRuleCreate(
            grp=CategoryGroup.needs, percent=50.0, sprint_id=sprint_data.id
        )
        allocation_rule = crud.create_allocation_rule(
            session=db, allocation_rule_in=allocation_rule_data, user_id=user.id
        )
        rule_id = allocation_rule.id

        # Delete allocation rule
        deleted_rule = crud.delete_allocation_rule(
            session=db, allocation_rule_id=rule_id
        )

        # Assertions
        assert deleted_rule is not None
        assert deleted_rule.id == rule_id

        # Verify allocation rule is deleted
        retrieved_rule = crud.get_allocation_rule(
            session=db, allocation_rule_id=rule_id
        )
        assert retrieved_rule is None

    def test_allocation_rule_percentages(
        self, db: Session, normal_user_token_headers: dict[str, str]
    ) -> None:
        """Test creating allocation rules with different percentages"""
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

        # Test different percentages
        percentages = [10.0, 25.0, 50.0, 75.0, 100.0]

        for percent in percentages:
            allocation_rule_data = AllocationRuleCreate(
                grp=CategoryGroup.needs, percent=percent, sprint_id=sprint_data.id
            )
            allocation_rule = crud.create_allocation_rule(
                session=db, allocation_rule_in=allocation_rule_data, user_id=user.id
            )
            assert allocation_rule.percent == percent

    def test_allocation_rule_groups(
        self, db: Session, normal_user_token_headers: dict[str, str]
    ) -> None:
        """Test creating allocation rules for different category groups"""
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

        # Test all category groups
        category_groups = [
            CategoryGroup.needs,
            CategoryGroup.wants,
            CategoryGroup.savings_debt,
        ]

        for group in category_groups:
            allocation_rule_data = AllocationRuleCreate(
                grp=group, percent=33.33, sprint_id=sprint_data.id
            )
            allocation_rule = crud.create_allocation_rule(
                session=db, allocation_rule_in=allocation_rule_data, user_id=user.id
            )
            assert allocation_rule.grp == group

    def test_allocation_rule_percentage_validation(
        self, db: Session, normal_user_token_headers: dict[str, str]
    ) -> None:
        """Test allocation rule percentage validation (0 < percent <= 100)"""
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

        # Test valid percentages
        valid_percentages = [0.1, 1.0, 50.0, 99.9, 100.0]

        for percent in valid_percentages:
            allocation_rule_data = AllocationRuleCreate(
                grp=CategoryGroup.needs, percent=percent, sprint_id=sprint_data.id
            )
            allocation_rule = crud.create_allocation_rule(
                session=db, allocation_rule_in=allocation_rule_data, user_id=user.id
            )
            assert allocation_rule.percent == percent
