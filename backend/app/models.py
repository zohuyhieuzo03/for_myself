import uuid
from datetime import date, datetime, timezone
from enum import Enum
from typing import Optional

from pydantic import BaseModel, EmailStr, field_validator
from sqlmodel import Field, Relationship, SQLModel

from app.utils import convert_empty_string_to_none


# Shared properties
class UserBase(SQLModel):
    email: EmailStr = Field(unique=True, index=True, max_length=255)
    is_active: bool = True
    is_superuser: bool = False
    full_name: str | None = Field(default=None, max_length=255)


# Properties to receive via API on creation
class UserCreate(UserBase):
    password: str = Field(min_length=8, max_length=40)


class UserRegister(SQLModel):
    email: EmailStr = Field(max_length=255)
    password: str = Field(min_length=8, max_length=40)
    full_name: str | None = Field(default=None, max_length=255)


# Properties to receive via API on update, all are optional
class UserUpdate(BaseModel):
    email: EmailStr | None = Field(default=None, max_length=255)
    password: str | None = Field(default=None, min_length=8, max_length=40)
    is_superuser: bool | None = None


class UserUpdateMe(SQLModel):
    full_name: str | None = Field(default=None, max_length=255)
    email: EmailStr | None = Field(default=None, max_length=255)


class UpdatePassword(SQLModel):
    current_password: str = Field(min_length=8, max_length=40)
    new_password: str = Field(min_length=8, max_length=40)


# Database model, database table inferred from class name
class User(UserBase, table=True):
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    hashed_password: str
    items: list["Item"] = Relationship(back_populates="owner", cascade_delete=True)
    todos: list["Todo"] = Relationship(back_populates="owner", cascade_delete=True)
    accounts: list["Account"] = Relationship(back_populates="user", cascade_delete=True)
    categories: list["Category"] = Relationship(
        back_populates="user", cascade_delete=True
    )
    transactions: list["Transaction"] = Relationship(
        back_populates="user", cascade_delete=True
    )
    allocation_rules: list["AllocationRule"] = Relationship(
        back_populates="user", cascade_delete=True
    )
    gmail_connections: list["GmailConnection"] = Relationship(
        back_populates="user", cascade_delete=True
    )


# Properties to return via API, id is always required
class UserPublic(UserBase):
    id: uuid.UUID


class UsersPublic(SQLModel):
    data: list[UserPublic]
    count: int


# Shared properties
class ItemBase(SQLModel):
    title: str = Field(min_length=1, max_length=255)
    description: str | None = Field(default=None, max_length=255)


# Properties to receive on item creation
class ItemCreate(ItemBase):
    pass


# Properties to receive on item update
class ItemUpdate(BaseModel):
    title: str | None = Field(default=None, min_length=1, max_length=255)


# Database model, database table inferred from class name
class Item(ItemBase, table=True):
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    owner_id: uuid.UUID = Field(
        foreign_key="user.id", nullable=False, ondelete="CASCADE"
    )
    owner: User | None = Relationship(back_populates="items")


# Properties to return via API, id is always required
class ItemPublic(ItemBase):
    id: uuid.UUID
    owner_id: uuid.UUID


class ItemsPublic(SQLModel):
    data: list[ItemPublic]
    count: int


# Generic message
class Message(SQLModel):
    message: str


# JSON payload containing access token
class Token(SQLModel):
    access_token: str
    token_type: str = "bearer"


# Contents of JWT token
class TokenPayload(SQLModel):
    sub: str | None = None


class NewPassword(SQLModel):
    token: str
    new_password: str = Field(min_length=8, max_length=40)


# ========= ENUMS =========
class AccountType(str, Enum):
    cash = "cash"
    bank = "bank"
    ewallet = "ewallet"
    investment = "investment"
    credit_card = "credit_card"
    other = "other"


class TxnType(str, Enum):
    expense = "out"
    income = "in"


class CategoryGroup(str, Enum):
    needs = "needs"
    wants = "wants"
    savings_debt = "savings_debt"
    income = "income"


class TodoStatus(str, Enum):
    backlog = "backlog"
    todo = "todo"
    doing = "doing"
    planning = "planning"
    done = "done"
    archived = "archived"


class TodoPriority(str, Enum):
    low = "low"
    medium = "medium"
    high = "high"
    urgent = "urgent"


class TodoType(str, Enum):
    work = "work"
    learning = "learning"
    daily_life = "daily_life"
    task = "task"
    personal = "personal"
    health = "health"
    finance = "finance"
    other = "other"


# Shared properties for Todo
class TodoBase(SQLModel):
    title: str = Field(min_length=1, max_length=255)
    description: str | None = Field(default=None, max_length=500)
    status: TodoStatus = Field(default=TodoStatus.todo)
    estimate_minutes: int | None = Field(default=None, ge=0)  # Estimate in minutes
    priority: TodoPriority = Field(default=TodoPriority.medium)
    type: TodoType = Field(default=TodoType.task)


# Properties to receive on todo creation
class TodoCreate(TodoBase):
    parent_id: uuid.UUID | None = None

    @field_validator('parent_id', mode='before')
    @classmethod
    def validate_parent_id(cls, v):
        return convert_empty_string_to_none(v)


# Properties to receive on todo update
class TodoUpdate(BaseModel):
    title: str | None = Field(default=None, min_length=1, max_length=255)
    description: str | None = Field(default=None, max_length=500)
    status: TodoStatus | None = None
    estimate_minutes: int | None = Field(default=None, ge=0)
    priority: TodoPriority | None = None
    type: TodoType | None = None
    parent_id: uuid.UUID | None = None

    @field_validator('parent_id', mode='before')
    @classmethod
    def validate_parent_id(cls, v):
        return convert_empty_string_to_none(v)


# Database model, database table inferred from class name
class Todo(TodoBase, table=True):
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    owner_id: uuid.UUID = Field(
        foreign_key="user.id", nullable=False, ondelete="CASCADE"
    )
    parent_id: uuid.UUID | None = Field(
        default=None, foreign_key="todo.id", ondelete="SET NULL"
    )
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    owner: User | None = Relationship(back_populates="todos")
    parent: Optional["Todo"] = Relationship(
        back_populates="children", sa_relationship_kwargs={"remote_side": "Todo.id"}
    )
    children: list["Todo"] = Relationship(back_populates="parent")
    checklist_items: list["ChecklistItem"] = Relationship(
        back_populates="todo", cascade_delete=True
    )


# Properties to return via API, id is always required
class TodoPublic(TodoBase):
    id: uuid.UUID
    owner_id: uuid.UUID
    parent_id: uuid.UUID | None = None
    created_at: datetime
    updated_at: datetime
    checklist_items: list["ChecklistItemPublic"] = []


class TodosPublic(SQLModel):
    data: list[TodoPublic]
    count: int


# ========= CHECKLIST ITEM =========
# Shared properties for ChecklistItem
class ChecklistItemBase(SQLModel):
    title: str = Field(min_length=1, max_length=255)
    is_completed: bool = Field(default=False)
    order_index: int = Field(default=0)


# Properties to receive on checklist item creation
class ChecklistItemCreate(ChecklistItemBase):
    pass


# Properties to receive on checklist item update
class ChecklistItemUpdate(BaseModel):
    title: str | None = Field(default=None, min_length=1, max_length=255)
    is_completed: bool | None = None
    order_index: int | None = None


# Database model, database table inferred from class name
class ChecklistItem(ChecklistItemBase, table=True):
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    todo_id: uuid.UUID = Field(
        foreign_key="todo.id", nullable=False, ondelete="CASCADE"
    )
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    todo: Todo | None = Relationship(back_populates="checklist_items")


# Properties to return via API, id is always required
class ChecklistItemPublic(ChecklistItemBase):
    id: uuid.UUID
    todo_id: uuid.UUID
    created_at: datetime
    updated_at: datetime


class ChecklistItemsPublic(SQLModel):
    data: list[ChecklistItemPublic]
    count: int


# ========= ACCOUNT =========
class AccountBase(SQLModel):
    name: str = Field(max_length=255)
    type: AccountType = Field(default=AccountType.cash)
    currency: str = Field(default="VND", max_length=10)
    is_active: bool = Field(default=True)


class AccountCreate(AccountBase):
    pass


class AccountUpdate(BaseModel):
    name: str | None = Field(default=None, max_length=255)
    type: AccountType | None = None
    currency: str | None = Field(default=None, max_length=10)
    is_active: bool | None = None


class Account(AccountBase, table=True):
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    user_id: uuid.UUID = Field(foreign_key="user.id", nullable=False)
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

    user: User | None = Relationship(back_populates="accounts")
    txns: list["Transaction"] = Relationship(
        back_populates="account", cascade_delete=True
    )


class AccountPublic(AccountBase):
    id: uuid.UUID
    user_id: uuid.UUID
    created_at: datetime
    updated_at: datetime


class AccountsPublic(SQLModel):
    data: list[AccountPublic]
    count: int


# ========= CATEGORY =========
class CategoryBase(SQLModel):
    name: str = Field(max_length=255)
    grp: CategoryGroup
    is_envelope: bool = True


class CategoryCreate(CategoryBase):
    pass


class CategoryUpdate(BaseModel):
    name: str | None = Field(default=None, max_length=255)
    grp: CategoryGroup | None = None
    is_envelope: bool | None = None


class Category(CategoryBase, table=True):
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    user_id: uuid.UUID = Field(foreign_key="user.id", nullable=False)
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

    user: User | None = Relationship(back_populates="categories")
    txns: list["Transaction"] = Relationship(
        back_populates="category", cascade_delete=True
    )


class CategoryPublic(CategoryBase):
    id: uuid.UUID
    user_id: uuid.UUID
    created_at: datetime
    updated_at: datetime


class CategoriesPublic(SQLModel):
    data: list[CategoryPublic]
    count: int


# ========= TRANSACTION =========
class TransactionBase(SQLModel):
    txn_date: date
    type: TxnType
    amount: float = Field(gt=0)
    currency: str = Field(default="VND", max_length=10)
    merchant: str | None = Field(default=None, max_length=255)
    note: str | None = Field(default=None, max_length=500)


class TransactionCreate(TransactionBase):
    account_id: uuid.UUID
    category_id: uuid.UUID | None = None
    
    @field_validator('category_id', mode='before')
    @classmethod
    def validate_category_id(cls, v):
        return convert_empty_string_to_none(v)


class TransactionUpdate(BaseModel):
    txn_date: date | None = None
    type: TxnType | None = None
    amount: float | None = Field(default=None, gt=0)
    currency: str | None = Field(default=None, max_length=10)
    merchant: str | None = Field(default=None, max_length=255)
    note: str | None = Field(default=None, max_length=500)
    account_id: uuid.UUID | None = None
    category_id: uuid.UUID | None = None
    
    @field_validator('category_id', mode='before')
    @classmethod
    def validate_category_id(cls, v):
        return convert_empty_string_to_none(v)


class Transaction(TransactionBase, table=True):
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    user_id: uuid.UUID = Field(foreign_key="user.id", nullable=False)
    account_id: uuid.UUID = Field(foreign_key="account.id", nullable=False)
    category_id: uuid.UUID | None = Field(foreign_key="category.id")
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

    user: User | None = Relationship(back_populates="transactions")
    account: Account | None = Relationship(back_populates="txns")
    category: Category | None = Relationship(back_populates="txns")


class TransactionPublic(TransactionBase):
    id: uuid.UUID
    user_id: uuid.UUID
    account_id: uuid.UUID
    category_id: uuid.UUID | None
    category_name: str | None = None
    created_at: datetime
    updated_at: datetime


class TransactionsPublic(SQLModel):
    data: list[TransactionPublic]
    count: int


# ========= ALLOCATION RULE =========
class AllocationRuleBase(SQLModel):
    grp: CategoryGroup
    percent: float = Field(gt=0, le=100)


class AllocationRuleCreate(AllocationRuleBase):
    pass


class AllocationRuleUpdate(BaseModel):
    grp: CategoryGroup | None = None
    percent: float | None = Field(default=None, gt=0, le=100)


class AllocationRule(AllocationRuleBase, table=True):
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    user_id: uuid.UUID = Field(foreign_key="user.id", nullable=False)
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

    user: User | None = Relationship(back_populates="allocation_rules")


class AllocationRulePublic(AllocationRuleBase):
    id: uuid.UUID
    user_id: uuid.UUID
    created_at: datetime
    updated_at: datetime


class AllocationRulesPublic(SQLModel):
    data: list[AllocationRulePublic]
    count: int


# ========= FINANCIAL REPORTS =========
class MonthlyFinancialReport(SQLModel):
    year: int
    month: int
    total_expenses: float = 0.0
    net_amount: float = 0.0
    expense_count: int = 0
    transactions: list[TransactionPublic] = []
    allocation_rules: list[AllocationRulePublic] = []


class MonthlyFinancialSummary(SQLModel):
    year: int
    month: int
    total_expenses: float = 0.0
    net_amount: float = 0.0
    expense_count: int = 0
    category_breakdown: dict[str, float] = {}
    account_breakdown: dict[str, float] = {}


class MonthlyFinancialReports(SQLModel):
    data: list[MonthlyFinancialReport]
    count: int


# ========= GMAIL INTEGRATION =========
class GmailConnectionBase(SQLModel):
    gmail_email: EmailStr = Field(max_length=255)
    is_active: bool = Field(default=True)


class GmailConnectionCreate(GmailConnectionBase):
    pass


class GmailConnectionUpdate(BaseModel):
    is_active: bool | None = None


class GmailConnection(GmailConnectionBase, table=True):
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    user_id: uuid.UUID = Field(foreign_key="user.id", nullable=False)
    access_token: str = Field(max_length=2000)  # Encrypted token
    refresh_token: str = Field(max_length=2000)  # Encrypted token
    expires_at: datetime | None = None
    last_sync_at: datetime | None = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

    user: User | None = Relationship(back_populates="gmail_connections")
    email_transactions: list["EmailTransaction"] = Relationship(
        back_populates="gmail_connection", cascade_delete=True
    )


class GmailConnectionPublic(GmailConnectionBase):
    id: uuid.UUID
    user_id: uuid.UUID
    expires_at: datetime | None
    last_sync_at: datetime | None
    created_at: datetime
    updated_at: datetime


class GmailConnectionsPublic(SQLModel):
    data: list[GmailConnectionPublic]
    count: int


# ========= EMAIL TRANSACTION =========
class EmailTransactionStatus(str, Enum):
    pending = "pending"
    processed = "processed"
    ignored = "ignored"


class EmailTransactionBase(SQLModel):
    email_id: str = Field(max_length=255, index=True)
    subject: str = Field(max_length=500)
    sender: str = Field(max_length=255)
    received_at: datetime
    amount: float | None = None
    merchant: str | None = Field(default=None, max_length=255)
    account_number: str | None = Field(default=None, max_length=100)
    transaction_type: str | None = Field(default=None, max_length=50)  # debit/credit
    status: EmailTransactionStatus = Field(default=EmailTransactionStatus.pending)
    raw_content: str | None = Field(default=None)  # Full email content


class EmailTransactionCreate(EmailTransactionBase):
    gmail_connection_id: uuid.UUID


class EmailTransactionUpdate(BaseModel):
    amount: float | None = None
    merchant: str | None = Field(default=None, max_length=255)
    account_number: str | None = Field(default=None, max_length=100)
    transaction_type: str | None = Field(default=None, max_length=50)
    status: EmailTransactionStatus | None = None
    linked_transaction_id: uuid.UUID | None = None
    category_id: uuid.UUID | None = None


class EmailTransaction(EmailTransactionBase, table=True):
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    gmail_connection_id: uuid.UUID = Field(foreign_key="gmailconnection.id", nullable=False)
    linked_transaction_id: uuid.UUID | None = Field(default=None, foreign_key="transaction.id", ondelete="SET NULL")
    category_id: uuid.UUID | None = Field(default=None, foreign_key="category.id")
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

    gmail_connection: GmailConnection | None = Relationship(back_populates="email_transactions")
    linked_transaction: Transaction | None = Relationship()
    category: Category | None = Relationship()


class EmailTransactionPublic(EmailTransactionBase):
    id: uuid.UUID
    gmail_connection_id: uuid.UUID
    linked_transaction_id: uuid.UUID | None
    category_id: uuid.UUID | None
    category_name: str | None = None
    created_at: datetime
    updated_at: datetime


class EmailTransactionsPublic(SQLModel):
    data: list[EmailTransactionPublic]
    count: int


# ========= EMAIL TRANSACTION DASHBOARD RESPONSES =========
class EmailTxnCategoryAmount(SQLModel):
    category_id: uuid.UUID | None = None
    category_name: str | None = None
    total_amount: float = 0.0


class EmailTxnMonthlyAmount(SQLModel):
    year: int
    month: int
    total_amount: float = 0.0


class EmailTxnDashboard(SQLModel):
    by_category: list[EmailTxnCategoryAmount] = []
    monthly: list[EmailTxnMonthlyAmount] = []
