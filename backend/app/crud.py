import uuid
from datetime import datetime, timezone
from typing import Any

from sqlmodel import Session, select

from app.core.security import get_password_hash, verify_password
from app.models import (
    Account,
    AccountCreate,
    AccountUpdate,
    AllocationRule,
    AllocationRuleCreate,
    AllocationRuleUpdate,
    Category,
    CategoryCreate,
    CategoryUpdate,
    Income,
    IncomeCreate,
    IncomeUpdate,
    Item,
    ItemCreate,
    Sprint,
    SprintCreate,
    SprintUpdate,
    Todo,
    TodoCreate,
    TodoUpdate,
    Transaction,
    TransactionCreate,
    TransactionUpdate,
    User,
    UserCreate,
    UserUpdate,
)


def create_user(*, session: Session, user_create: UserCreate) -> User:
    db_obj = User.model_validate(
        user_create, update={"hashed_password": get_password_hash(user_create.password)}
    )
    session.add(db_obj)
    session.commit()
    session.refresh(db_obj)
    return db_obj


def update_user(*, session: Session, db_user: User, user_in: UserUpdate) -> Any:
    user_data = user_in.model_dump(exclude_unset=True)
    extra_data = {}
    if "password" in user_data:
        password = user_data["password"]
        hashed_password = get_password_hash(password)
        extra_data["hashed_password"] = hashed_password
    db_user.sqlmodel_update(user_data, update=extra_data)
    session.add(db_user)
    session.commit()
    session.refresh(db_user)
    return db_user


def get_user_by_email(*, session: Session, email: str) -> User | None:
    statement = select(User).where(User.email == email)
    session_user = session.exec(statement).first()
    return session_user


def authenticate(*, session: Session, email: str, password: str) -> User | None:
    db_user = get_user_by_email(session=session, email=email)
    if not db_user:
        return None
    if not verify_password(password, db_user.hashed_password):
        return None
    return db_user


def create_item(*, session: Session, item_in: ItemCreate, owner_id: uuid.UUID) -> Item:
    db_item = Item.model_validate(item_in, update={"owner_id": owner_id})
    session.add(db_item)
    session.commit()
    session.refresh(db_item)
    return db_item


def create_todo(*, session: Session, todo_in: TodoCreate, owner_id: uuid.UUID) -> Todo:
    db_todo = Todo.model_validate(todo_in, update={"owner_id": owner_id})
    session.add(db_todo)
    session.commit()
    session.refresh(db_todo)
    return db_todo


def update_todo(*, session: Session, db_todo: Todo, todo_in: TodoUpdate) -> Any:
    todo_data = todo_in.model_dump(exclude_unset=True)
    extra_data = {"updated_at": datetime.now(timezone.utc)}
    db_todo.sqlmodel_update(todo_data, update=extra_data)
    session.add(db_todo)
    session.commit()
    session.refresh(db_todo)
    return db_todo


def get_todo(*, session: Session, todo_id: uuid.UUID) -> Todo | None:
    statement = select(Todo).where(Todo.id == todo_id)
    session_todo = session.exec(statement).first()
    return session_todo


def get_todos(
    *, session: Session, skip: int = 0, limit: int = 100
) -> tuple[list[Todo], int]:
    statement = select(Todo).offset(skip).limit(limit)
    todos = list(session.exec(statement).all())
    count_statement = select(Todo)
    count = len(session.exec(count_statement).all())
    return todos, count


def delete_todo(*, session: Session, todo_id: uuid.UUID) -> Todo | None:
    statement = select(Todo).where(Todo.id == todo_id)
    todo = session.exec(statement).first()
    if todo:
        session.delete(todo)
        session.commit()
    return todo


# ========= SPRINT CRUD =========
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


# ========= ACCOUNT CRUD =========
def create_account(
    *, session: Session, account_in: AccountCreate, user_id: uuid.UUID
) -> Account:
    db_account = Account.model_validate(account_in, update={"user_id": user_id})
    session.add(db_account)
    session.commit()
    session.refresh(db_account)
    return db_account


def update_account(
    *, session: Session, db_account: Account, account_in: AccountUpdate
) -> Any:
    account_data = account_in.model_dump(exclude_unset=True)
    extra_data = {"updated_at": datetime.now(timezone.utc)}
    db_account.sqlmodel_update(account_data, update=extra_data)
    session.add(db_account)
    session.commit()
    session.refresh(db_account)
    return db_account


def get_account(*, session: Session, account_id: uuid.UUID) -> Account | None:
    statement = select(Account).where(Account.id == account_id)
    return session.exec(statement).first()


def get_accounts(
    *, session: Session, user_id: uuid.UUID, skip: int = 0, limit: int = 100
) -> tuple[list[Account], int]:
    statement = (
        select(Account).where(Account.user_id == user_id).offset(skip).limit(limit)
    )
    accounts = list(session.exec(statement).all())
    count_statement = select(Account).where(Account.user_id == user_id)
    count = len(session.exec(count_statement).all())
    return accounts, count


def delete_account(*, session: Session, account_id: uuid.UUID) -> Account | None:
    statement = select(Account).where(Account.id == account_id)
    account = session.exec(statement).first()
    if account:
        session.delete(account)
        session.commit()
    return account


# ========= CATEGORY CRUD =========
def create_category(
    *, session: Session, category_in: CategoryCreate, user_id: uuid.UUID
) -> Category:
    db_category = Category.model_validate(category_in, update={"user_id": user_id})
    session.add(db_category)
    session.commit()
    session.refresh(db_category)
    return db_category


def update_category(
    *, session: Session, db_category: Category, category_in: CategoryUpdate
) -> Any:
    category_data = category_in.model_dump(exclude_unset=True)
    extra_data = {"updated_at": datetime.now(timezone.utc)}
    db_category.sqlmodel_update(category_data, update=extra_data)
    session.add(db_category)
    session.commit()
    session.refresh(db_category)
    return db_category


def get_category(*, session: Session, category_id: uuid.UUID) -> Category | None:
    statement = select(Category).where(Category.id == category_id)
    return session.exec(statement).first()


def get_categories(
    *, session: Session, user_id: uuid.UUID, skip: int = 0, limit: int = 100
) -> tuple[list[Category], int]:
    statement = (
        select(Category).where(Category.user_id == user_id).offset(skip).limit(limit)
    )
    categories = list(session.exec(statement).all())
    count_statement = select(Category).where(Category.user_id == user_id)
    count = len(session.exec(count_statement).all())
    return categories, count


def delete_category(*, session: Session, category_id: uuid.UUID) -> Category | None:
    statement = select(Category).where(Category.id == category_id)
    category = session.exec(statement).first()
    if category:
        session.delete(category)
        session.commit()
    return category


# ========= INCOME CRUD =========
def create_income(
    *, session: Session, income_in: IncomeCreate, user_id: uuid.UUID
) -> Income:
    db_income = Income.model_validate(income_in, update={"user_id": user_id})
    session.add(db_income)
    session.commit()
    session.refresh(db_income)
    return db_income


def update_income(
    *, session: Session, db_income: Income, income_in: IncomeUpdate
) -> Any:
    income_data = income_in.model_dump(exclude_unset=True)
    extra_data = {"updated_at": datetime.now(timezone.utc)}
    db_income.sqlmodel_update(income_data, update=extra_data)
    session.add(db_income)
    session.commit()
    session.refresh(db_income)
    return db_income


def get_income(*, session: Session, income_id: uuid.UUID) -> Income | None:
    statement = select(Income).where(Income.id == income_id)
    return session.exec(statement).first()


def get_incomes(
    *, session: Session, user_id: uuid.UUID, skip: int = 0, limit: int = 100
) -> tuple[list[Income], int]:
    statement = (
        select(Income).where(Income.user_id == user_id).offset(skip).limit(limit)
    )
    incomes = list(session.exec(statement).all())
    count_statement = select(Income).where(Income.user_id == user_id)
    count = len(session.exec(count_statement).all())
    return incomes, count


def delete_income(*, session: Session, income_id: uuid.UUID) -> Income | None:
    statement = select(Income).where(Income.id == income_id)
    income = session.exec(statement).first()
    if income:
        session.delete(income)
        session.commit()
    return income


# ========= TRANSACTION CRUD =========
def create_transaction(
    *, session: Session, transaction_in: TransactionCreate, user_id: uuid.UUID
) -> Transaction:
    db_transaction = Transaction.model_validate(
        transaction_in, update={"user_id": user_id}
    )
    session.add(db_transaction)
    session.commit()
    session.refresh(db_transaction)
    return db_transaction


def update_transaction(
    *, session: Session, db_transaction: Transaction, transaction_in: TransactionUpdate
) -> Any:
    transaction_data = transaction_in.model_dump(exclude_unset=True)
    extra_data = {"updated_at": datetime.now(timezone.utc)}
    db_transaction.sqlmodel_update(transaction_data, update=extra_data)
    session.add(db_transaction)
    session.commit()
    session.refresh(db_transaction)
    return db_transaction


def get_transaction(
    *, session: Session, transaction_id: uuid.UUID
) -> Transaction | None:
    statement = select(Transaction).where(Transaction.id == transaction_id)
    return session.exec(statement).first()


def get_transactions(
    *, session: Session, user_id: uuid.UUID, skip: int = 0, limit: int = 100
) -> tuple[list[Transaction], int]:
    statement = (
        select(Transaction)
        .where(Transaction.user_id == user_id)
        .offset(skip)
        .limit(limit)
    )
    transactions = list(session.exec(statement).all())
    count_statement = select(Transaction).where(Transaction.user_id == user_id)
    count = len(session.exec(count_statement).all())
    return transactions, count


def delete_transaction(
    *, session: Session, transaction_id: uuid.UUID
) -> Transaction | None:
    statement = select(Transaction).where(Transaction.id == transaction_id)
    transaction = session.exec(statement).first()
    if transaction:
        session.delete(transaction)
        session.commit()
    return transaction


# ========= ALLOCATION RULE CRUD =========
def create_allocation_rule(
    *, session: Session, allocation_rule_in: AllocationRuleCreate, user_id: uuid.UUID
) -> AllocationRule:
    db_allocation_rule = AllocationRule.model_validate(
        allocation_rule_in, update={"user_id": user_id}
    )
    session.add(db_allocation_rule)
    session.commit()
    session.refresh(db_allocation_rule)
    return db_allocation_rule


def update_allocation_rule(
    *,
    session: Session,
    db_allocation_rule: AllocationRule,
    allocation_rule_in: AllocationRuleUpdate,
) -> Any:
    allocation_rule_data = allocation_rule_in.model_dump(exclude_unset=True)
    extra_data = {"updated_at": datetime.now(timezone.utc)}
    db_allocation_rule.sqlmodel_update(allocation_rule_data, update=extra_data)
    session.add(db_allocation_rule)
    session.commit()
    session.refresh(db_allocation_rule)
    return db_allocation_rule


def get_allocation_rule(
    *, session: Session, allocation_rule_id: uuid.UUID
) -> AllocationRule | None:
    statement = select(AllocationRule).where(AllocationRule.id == allocation_rule_id)
    return session.exec(statement).first()


def get_allocation_rules(
    *, session: Session, user_id: uuid.UUID, skip: int = 0, limit: int = 100
) -> tuple[list[AllocationRule], int]:
    statement = (
        select(AllocationRule)
        .where(AllocationRule.user_id == user_id)
        .offset(skip)
        .limit(limit)
    )
    allocation_rules = list(session.exec(statement).all())
    count_statement = select(AllocationRule).where(AllocationRule.user_id == user_id)
    count = len(session.exec(count_statement).all())
    return allocation_rules, count


def delete_allocation_rule(
    *, session: Session, allocation_rule_id: uuid.UUID
) -> AllocationRule | None:
    statement = select(AllocationRule).where(AllocationRule.id == allocation_rule_id)
    allocation_rule = session.exec(statement).first()
    if allocation_rule:
        session.delete(allocation_rule)
        session.commit()
    return allocation_rule
