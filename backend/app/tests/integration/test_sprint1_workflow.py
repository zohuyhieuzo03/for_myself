from fastapi.testclient import TestClient
from sqlmodel import Session, select

from app.models import (
    User,
)


class TestSprint1Integration:
    """Integration tests for Sprint 1 workflow"""

    def test_complete_sprint_workflow(
        self, client: TestClient, db: Session, normal_user_token_headers: dict[str, str]
    ) -> None:
        """Test complete Sprint 1 workflow: Sprint -> Allocation Rules -> Account -> Category -> Income -> Transaction"""

        # Get user
        user = db.exec(select(User).where(User.email == "test@example.com")).first()
        assert user is not None

        # 1. Create Sprint
        sprint_data = {
            "start_date": "2024-01-01",
            "end_date": "2024-01-31",
            "payday_anchor": "2024-01-01",
            "is_closed": False,
        }

        sprint_response = client.post(
            "/api/v1/sprints/", json=sprint_data, headers=normal_user_token_headers
        )
        assert sprint_response.status_code == 200
        sprint = sprint_response.json()
        sprint_id = sprint["id"]

        # 2. Create Allocation Rules (50/30/20)
        allocation_rules_data = [
            {"grp": "needs", "percent": 50.0, "sprint_id": sprint_id},
            {"grp": "wants", "percent": 30.0, "sprint_id": sprint_id},
            {"grp": "savings_debt", "percent": 20.0, "sprint_id": sprint_id},
        ]

        allocation_rules = []
        for rule_data in allocation_rules_data:
            rule_response = client.post(
                "/api/v1/allocation-rules/",
                json=rule_data,
                headers=normal_user_token_headers,
            )
            assert rule_response.status_code == 200
            allocation_rules.append(rule_response.json())

        # Verify total percentage
        total_percent = sum(rule["percent"] for rule in allocation_rules)
        assert total_percent == 100.0

        # 3. Create Account
        account_data = {
            "name": "Main Bank Account",
            "type": "bank",
            "currency": "VND",
            "is_active": True,
        }

        account_response = client.post(
            "/api/v1/accounts/", json=account_data, headers=normal_user_token_headers
        )
        assert account_response.status_code == 200
        account = account_response.json()
        account_id = account["id"]

        # 4. Create Categories
        categories_data = [
            {"name": "Groceries", "grp": "needs", "is_envelope": True},
            {"name": "Entertainment", "grp": "wants", "is_envelope": True},
            {"name": "Emergency Fund", "grp": "savings_debt", "is_envelope": True},
        ]

        categories = []
        for category_data in categories_data:
            category_response = client.post(
                "/api/v1/categories/",
                json=category_data,
                headers=normal_user_token_headers,
            )
            assert category_response.status_code == 200
            categories.append(category_response.json())

        # 5. Create Income
        income_data = {
            "received_at": "2024-01-15",
            "source": "Salary",
            "gross_amount": 10000000.0,
            "net_amount": 8500000.0,
            "currency": "VND",
            "sprint_id": sprint_id,
        }

        income_response = client.post(
            "/api/v1/incomes/", json=income_data, headers=normal_user_token_headers
        )
        assert income_response.status_code == 200
        # income = income_response.json()  # Not used in this test

        # 6. Create Transactions
        transactions_data = [
            {
                "txn_date": "2024-01-16",
                "type": "out",
                "amount": 500000.0,
                "currency": "VND",
                "merchant": "Supermarket ABC",
                "note": "Weekly groceries",
                "account_id": account_id,
                "category_id": categories[0]["id"],  # Groceries
                "sprint_id": sprint_id,
            },
            {
                "txn_date": "2024-01-17",
                "type": "out",
                "amount": 200000.0,
                "currency": "VND",
                "merchant": "Cinema XYZ",
                "note": "Movie tickets",
                "account_id": account_id,
                "category_id": categories[1]["id"],  # Entertainment
                "sprint_id": sprint_id,
            },
            {
                "txn_date": "2024-01-18",
                "type": "out",
                "amount": 1000000.0,
                "currency": "VND",
                "merchant": "Bank Transfer",
                "note": "Emergency fund deposit",
                "account_id": account_id,
                "category_id": categories[2]["id"],  # Emergency Fund
                "sprint_id": sprint_id,
            },
        ]

        transactions = []
        for transaction_data in transactions_data:
            transaction_response = client.post(
                "/api/v1/transactions/",
                json=transaction_data,
                headers=normal_user_token_headers,
            )
            assert transaction_response.status_code == 200
            transactions.append(transaction_response.json())

        # 7. Verify Sprint Summary
        sprint_get_response = client.get(
            f"/api/v1/sprints/{sprint_id}", headers=normal_user_token_headers
        )
        assert sprint_get_response.status_code == 200
        # sprint_summary = sprint_get_response.json()  # Not used in this test

        # 8. Verify Allocation Rules
        allocation_rules_response = client.get(
            "/api/v1/allocation-rules/", headers=normal_user_token_headers
        )
        assert allocation_rules_response.status_code == 200
        allocation_rules_summary = allocation_rules_response.json()
        assert allocation_rules_summary["count"] == 3

        # 9. Verify Transactions
        transactions_response = client.get(
            "/api/v1/transactions/", headers=normal_user_token_headers
        )
        assert transactions_response.status_code == 200
        transactions_summary = transactions_response.json()
        assert transactions_summary["count"] == 3

        # 10. Calculate Budget vs Actual Spending
        total_spent = sum(txn["amount"] for txn in transactions)
        assert total_spent == 1700000.0  # 500k + 200k + 1000k

        # Calculate spending by category group
        spending_by_group: dict[str, float] = {}
        for transaction in transactions:
            category_id = transaction["category_id"]
            category = next(cat for cat in categories if cat["id"] == category_id)
            group = category["grp"]
            amount = transaction["amount"]
            spending_by_group[group] = spending_by_group.get(group, 0) + amount

        # Verify spending distribution
        assert spending_by_group["needs"] == 500000.0  # Groceries
        assert spending_by_group["wants"] == 200000.0  # Entertainment
        assert spending_by_group["savings_debt"] == 1000000.0  # Emergency Fund

        # Test completed successfully

    def test_sprint_budget_allocation_validation(
        self, client: TestClient, db: Session, normal_user_token_headers: dict[str, str]
    ) -> None:
        """Test budget allocation validation against actual spending"""

        # Get user
        user = db.exec(select(User).where(User.email == "test@example.com")).first()
        assert user is not None

        # Create Sprint
        sprint_data = {
            "start_date": "2024-01-01",
            "end_date": "2024-01-31",
            "payday_anchor": "2024-01-01",
            "is_closed": False,
        }

        sprint_response = client.post(
            "/api/v1/sprints/", json=sprint_data, headers=normal_user_token_headers
        )
        sprint = sprint_response.json()
        sprint_id = sprint["id"]

        # Create Allocation Rules (60/30/10)
        allocation_rules_data = [
            {"grp": "needs", "percent": 60.0, "sprint_id": sprint_id},
            {"grp": "wants", "percent": 30.0, "sprint_id": sprint_id},
            {"grp": "savings_debt", "percent": 10.0, "sprint_id": sprint_id},
        ]

        for rule_data in allocation_rules_data:
            client.post(
                "/api/v1/allocation-rules/",
                json=rule_data,
                headers=normal_user_token_headers,
            )

        # Create Account
        account_data = {
            "name": "Test Account",
            "type": "bank",
            "currency": "VND",
            "is_active": True,
        }

        account_response = client.post(
            "/api/v1/accounts/", json=account_data, headers=normal_user_token_headers
        )
        account = account_response.json()
        account_id = account["id"]

        # Create Categories
        categories_data = [
            {"name": "Food", "grp": "needs", "is_envelope": True},
            {"name": "Movies", "grp": "wants", "is_envelope": True},
            {"name": "Savings", "grp": "savings_debt", "is_envelope": True},
        ]

        categories = []
        for category_data in categories_data:
            category_response = client.post(
                "/api/v1/categories/",
                json=category_data,
                headers=normal_user_token_headers,
            )
            categories.append(category_response.json())

        # Create Income
        income_data = {
            "received_at": "2024-01-15",
            "source": "Salary",
            "gross_amount": 10000000.0,
            "net_amount": 8000000.0,
            "currency": "VND",
            "sprint_id": sprint_id,
        }

        client.post(
            "/api/v1/incomes/", json=income_data, headers=normal_user_token_headers
        )

        # Create Transactions that match allocation rules
        transactions_data = [
            {
                "txn_date": "2024-01-16",
                "type": "out",
                "amount": 4800000.0,  # 60% of 8M
                "currency": "VND",
                "merchant": "Food Store",
                "account_id": account_id,
                "category_id": categories[0]["id"],  # Food
                "sprint_id": sprint_id,
            },
            {
                "txn_date": "2024-01-17",
                "type": "out",
                "amount": 2400000.0,  # 30% of 8M
                "currency": "VND",
                "merchant": "Cinema",
                "account_id": account_id,
                "category_id": categories[1]["id"],  # Movies
                "sprint_id": sprint_id,
            },
            {
                "txn_date": "2024-01-18",
                "type": "out",
                "amount": 800000.0,  # 10% of 8M
                "currency": "VND",
                "merchant": "Bank",
                "account_id": account_id,
                "category_id": categories[2]["id"],  # Savings
                "sprint_id": sprint_id,
            },
        ]

        for transaction_data in transactions_data:
            client.post(
                "/api/v1/transactions/",
                json=transaction_data,
                headers=normal_user_token_headers,
            )

        # Verify budget allocation
        net_income = 8000000.0
        expected_allocation = {
            "needs": net_income * 0.6,  # 4,800,000
            "wants": net_income * 0.3,  # 2,400,000
            "savings_debt": net_income * 0.1,  # 800,000
        }

        actual_spending = {
            "needs": 4800000.0,
            "wants": 2400000.0,
            "savings_debt": 800000.0,
        }

        # Verify spending matches allocation
        for group in expected_allocation:
            assert actual_spending[group] == expected_allocation[group]

        # Budget allocation validation completed successfully
