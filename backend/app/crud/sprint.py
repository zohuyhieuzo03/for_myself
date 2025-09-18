import uuid
from datetime import datetime, timezone
from typing import Any

from sqlmodel import Session, select

from app.models import (
    Sprint,
    SprintCreate,
    SprintUpdate,
    Income,
    Transaction,
    AllocationRule,
    Account,
    Category,
)


def create_sprint(
    *, session: Session, sprint_in: SprintCreate, user_id: uuid.UUID
) -> Sprint:
    db_sprint = Sprint.model_validate(sprint_in, update={"user_id": user_id})
    session.add(db_sprint)
    session.commit()
    session.refresh(db_sprint)
    return db_sprint


def update_sprint(
    *, session: Session, db_sprint: Sprint, sprint_in: SprintUpdate
) -> Any:
    sprint_data = sprint_in.model_dump(exclude_unset=True)
    extra_data = {"updated_at": datetime.now(timezone.utc)}
    db_sprint.sqlmodel_update(sprint_data, update=extra_data)
    session.add(db_sprint)
    session.commit()
    session.refresh(db_sprint)
    return db_sprint


def get_sprint(*, session: Session, sprint_id: uuid.UUID) -> Sprint | None:
    statement = select(Sprint).where(Sprint.id == sprint_id)
    return session.exec(statement).first()


def get_sprints(
    *, session: Session, user_id: uuid.UUID, skip: int = 0, limit: int = 100
) -> tuple[list[Sprint], int]:
    statement = (
        select(Sprint).where(Sprint.user_id == user_id).offset(skip).limit(limit)
    )
    sprints = list(session.exec(statement).all())
    count_statement = select(Sprint).where(Sprint.user_id == user_id)
    count = len(session.exec(count_statement).all())
    return sprints, count


def delete_sprint(*, session: Session, sprint_id: uuid.UUID) -> Sprint | None:
    statement = select(Sprint).where(Sprint.id == sprint_id)
    sprint = session.exec(statement).first()
    if sprint:
        session.delete(sprint)
        session.commit()
    return sprint


def get_sprint_detail(*, session: Session, sprint_id: uuid.UUID, user_id: uuid.UUID) -> dict | None:
    """
    Get sprint with all related financial data for detailed view.
    """
    # Get the sprint
    sprint = get_sprint(session=session, sprint_id=sprint_id)
    if not sprint or sprint.user_id != user_id:
        return None
    
    # Get all related data for this sprint
    incomes_statement = select(Income).where(Income.sprint_id == sprint_id)
    incomes = list(session.exec(incomes_statement).all())
    
    transactions_statement = select(Transaction).where(Transaction.sprint_id == sprint_id)
    transactions = list(session.exec(transactions_statement).all())
    
    allocation_rules_statement = select(AllocationRule).where(AllocationRule.sprint_id == sprint_id)
    allocation_rules = list(session.exec(allocation_rules_statement).all())
    
    # Get all user's accounts and categories for reference
    accounts_statement = select(Account).where(Account.user_id == user_id)
    accounts = list(session.exec(accounts_statement).all())
    
    categories_statement = select(Category).where(Category.user_id == user_id)
    categories = list(session.exec(categories_statement).all())
    
    # Calculate financial summary
    total_income = sum(income.amount for income in incomes)
    total_expenses = sum(txn.amount for txn in transactions if txn.type == "out")
    total_inflows = sum(txn.amount for txn in transactions if txn.type == "in")
    net_cash_flow = total_income + total_inflows - total_expenses
    
    # Calculate spending by category
    spending_by_category = {}
    for category in categories:
        category_transactions = [txn for txn in transactions if txn.category_id == category.id and txn.type == "out"]
        category_spending = sum(txn.amount for txn in category_transactions)
        if category_spending > 0:
            spending_by_category[category.id] = {
                "amount": category_spending,
                "name": category.name,
                "group": category.grp
            }
    
    # Calculate spending by account
    spending_by_account = {}
    for account in accounts:
        account_transactions = [txn for txn in transactions if txn.account_id == account.id]
        account_spending = sum(txn.amount for txn in account_transactions if txn.type == "out")
        account_inflows = sum(txn.amount for txn in account_transactions if txn.type == "in")
        if account_spending > 0 or account_inflows > 0:
            spending_by_account[account.id] = {
                "amount": account_spending - account_inflows,
                "name": account.name,
                "type": account.type
            }
    
    # Calculate daily spending trend
    daily_spending = {}
    for txn in transactions:
        if txn.type == "out":
            date_str = txn.txn_date.isoformat()
            daily_spending[date_str] = daily_spending.get(date_str, 0) + txn.amount
    
    average_daily_spending = sum(daily_spending.values()) / len(daily_spending) if daily_spending else 0
    
    # Calculate budget utilization
    total_allocated = sum(rule.percent for rule in allocation_rules) * total_income / 100 if allocation_rules else 0
    budget_utilization = (total_expenses / total_allocated * 100) if total_allocated > 0 else 0
    
    financial_summary = {
        "total_income": total_income,
        "total_expenses": total_expenses,
        "total_inflows": total_inflows,
        "net_cash_flow": net_cash_flow,
        "spending_by_category": spending_by_category,
        "spending_by_account": spending_by_account,
        "daily_spending": daily_spending,
        "average_daily_spending": average_daily_spending,
        "total_allocated": total_allocated,
        "budget_utilization": budget_utilization
    }
    
    return {
        "sprint": sprint,
        "incomes": incomes,
        "transactions": transactions,
        "allocation_rules": allocation_rules,
        "accounts": accounts,
        "categories": categories,
        "financial_summary": financial_summary
    }
