import uuid
from datetime import date, datetime, timezone
from enum import Enum

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
    sprints: list["Sprint"] = Relationship(back_populates="user", cascade_delete=True)
    accounts: list["Account"] = Relationship(back_populates="user", cascade_delete=True)
    categories: list["Category"] = Relationship(
        back_populates="user", cascade_delete=True
    )
    incomes: list["Income"] = Relationship(back_populates="user", cascade_delete=True)
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


# Shared properties for Todo
class TodoBase(SQLModel):
    title: str = Field(min_length=1, max_length=255)
    description: str | None = Field(default=None, max_length=500)
    is_completed: bool = Field(default=False)


# Properties to receive on todo creation
class TodoCreate(TodoBase):
    pass


# Properties to receive on todo update
class TodoUpdate(BaseModel):
    title: str | None = Field(default=None, min_length=1, max_length=255)
    description: str | None = Field(default=None, max_length=500)
    is_completed: bool | None = Field(default=None)


# Database model, database table inferred from class name
class Todo(TodoBase, table=True):
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    owner_id: uuid.UUID = Field(
        foreign_key="user.id", nullable=False, ondelete="CASCADE"
    )
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    owner: User | None = Relationship(back_populates="todos")


# Properties to return via API, id is always required
class TodoPublic(TodoBase):
    id: uuid.UUID
    owner_id: uuid.UUID
    created_at: datetime
    updated_at: datetime


class TodosPublic(SQLModel):
    data: list[TodoPublic]
    count: int


# ========= ENUMS =========
class AccountType(str, Enum):
    cash = "cash"
    bank = "bank"
    ewallet = "ewallet"
    investment = "investment"
    credit_card = "credit_card"
    other = "other"


class TxnType(str, Enum):
    income = "in"
    expense = "out"


class CategoryGroup(str, Enum):
    needs = "needs"
    wants = "wants"
    savings_debt = "savings_debt"


# ========= SPRINT =========
class SprintBase(SQLModel):
    start_date: date
    end_date: date
    payday_anchor: date
    is_closed: bool = False


class SprintCreate(SprintBase):
    pass


class SprintUpdate(BaseModel):
    start_date: date | None = None
    end_date: date | None = None
    payday_anchor: date | None = None
    is_closed: bool | None = None


class Sprint(SprintBase, table=True):
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    user_id: uuid.UUID = Field(foreign_key="user.id", nullable=False)
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

    user: User | None = Relationship(back_populates="sprints")
    incomes: list["Income"] = Relationship(back_populates="sprint", cascade_delete=True)
    txns: list["Transaction"] = Relationship(
        back_populates="sprint", cascade_delete=True
    )
    allocation_rules: list["AllocationRule"] = Relationship(
        back_populates="sprint", cascade_delete=True
    )


class SprintPublic(SprintBase):
    id: uuid.UUID
    user_id: uuid.UUID
    created_at: datetime
    updated_at: datetime


class SprintsPublic(SQLModel):
    data: list[SprintPublic]
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


# ========= INCOME =========
class IncomeBase(SQLModel):
    received_at: date
    source: str = Field(max_length=255)
    gross_amount: float
    net_amount: float
    currency: str = Field(default="VND", max_length=10)


class IncomeCreate(IncomeBase):
    sprint_id: uuid.UUID | None = None
    
    @field_validator('sprint_id', mode='before')
    @classmethod
    def validate_sprint_id(cls, v):
        return convert_empty_string_to_none(v)


class IncomeUpdate(BaseModel):
    received_at: date | None = None
    source: str | None = Field(default=None, max_length=255)
    gross_amount: float | None = None
    net_amount: float | None = None
    currency: str | None = Field(default=None, max_length=10)
    sprint_id: uuid.UUID | None = None
    
    @field_validator('sprint_id', mode='before')
    @classmethod
    def validate_sprint_id(cls, v):
        return convert_empty_string_to_none(v)


class Income(IncomeBase, table=True):
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    user_id: uuid.UUID = Field(foreign_key="user.id", nullable=False)
    sprint_id: uuid.UUID | None = Field(foreign_key="sprint.id", nullable=True)
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

    user: User | None = Relationship(back_populates="incomes")
    sprint: Sprint | None = Relationship(back_populates="incomes")


class IncomePublic(IncomeBase):
    id: uuid.UUID
    user_id: uuid.UUID
    sprint_id: uuid.UUID | None
    created_at: datetime
    updated_at: datetime


class IncomesPublic(SQLModel):
    data: list[IncomePublic]
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
    sprint_id: uuid.UUID | None = None
    
    @field_validator('category_id', 'sprint_id', mode='before')
    @classmethod
    def validate_optional_ids(cls, v):
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
    sprint_id: uuid.UUID | None = None
    
    @field_validator('category_id', 'sprint_id', mode='before')
    @classmethod
    def validate_optional_ids(cls, v):
        return convert_empty_string_to_none(v)


class Transaction(TransactionBase, table=True):
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    user_id: uuid.UUID = Field(foreign_key="user.id", nullable=False)
    sprint_id: uuid.UUID | None = Field(foreign_key="sprint.id")
    account_id: uuid.UUID = Field(foreign_key="account.id", nullable=False)
    category_id: uuid.UUID | None = Field(foreign_key="category.id")
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

    user: User | None = Relationship(back_populates="transactions")
    sprint: Sprint | None = Relationship(back_populates="txns")
    account: Account | None = Relationship(back_populates="txns")
    category: Category | None = Relationship(back_populates="txns")


class TransactionPublic(TransactionBase):
    id: uuid.UUID
    user_id: uuid.UUID
    sprint_id: uuid.UUID | None
    account_id: uuid.UUID
    category_id: uuid.UUID | None
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
    sprint_id: uuid.UUID | None = None
    
    @field_validator('sprint_id', mode='before')
    @classmethod
    def validate_sprint_id(cls, v):
        return convert_empty_string_to_none(v)


class AllocationRuleUpdate(BaseModel):
    grp: CategoryGroup | None = None
    percent: float | None = Field(default=None, gt=0, le=100)
    sprint_id: uuid.UUID | None = None
    
    @field_validator('sprint_id', mode='before')
    @classmethod
    def validate_sprint_id(cls, v):
        return convert_empty_string_to_none(v)


class AllocationRule(AllocationRuleBase, table=True):
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    user_id: uuid.UUID = Field(foreign_key="user.id", nullable=False)
    sprint_id: uuid.UUID | None = Field(foreign_key="sprint.id", nullable=True)
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

    user: User | None = Relationship(back_populates="allocation_rules")
    sprint: Sprint | None = Relationship(back_populates="allocation_rules")


class AllocationRulePublic(AllocationRuleBase):
    id: uuid.UUID
    user_id: uuid.UUID
    sprint_id: uuid.UUID | None
    created_at: datetime
    updated_at: datetime


class AllocationRulesPublic(SQLModel):
    data: list[AllocationRulePublic]
    count: int


# ========= FINANCIAL REPORTS =========
class MonthlyFinancialReport(SQLModel):
    year: int
    month: int
    total_income: float = 0.0
    total_expenses: float = 0.0
    net_amount: float = 0.0
    income_count: int = 0
    expense_count: int = 0
    incomes: list[IncomePublic] = []
    transactions: list[TransactionPublic] = []
    allocation_rules: list[AllocationRulePublic] = []


class MonthlyFinancialSummary(SQLModel):
    year: int
    month: int
    total_income: float = 0.0
    total_expenses: float = 0.0
    net_amount: float = 0.0
    income_count: int = 0
    expense_count: int = 0
    category_breakdown: dict[str, float] = {}
    account_breakdown: dict[str, float] = {}


class MonthlyFinancialReports(SQLModel):
    data: list[MonthlyFinancialReport]
    count: int


# ========= SPRINT DETAIL =========
class SprintDetailPublic(SprintPublic):
    incomes: list[IncomePublic] = []
    transactions: list[TransactionPublic] = []
    allocation_rules: list[AllocationRulePublic] = []
    accounts: list[AccountPublic] = []
    categories: list[CategoryPublic] = []
    financial_summary: dict = {}


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
    seen: bool = Field(default=False)  # Whether the email has been seen by user
    raw_content: str | None = Field(default=None)  # Full email content


class EmailTransactionCreate(EmailTransactionBase):
    gmail_connection_id: uuid.UUID


class EmailTransactionUpdate(BaseModel):
    amount: float | None = None
    merchant: str | None = Field(default=None, max_length=255)
    account_number: str | None = Field(default=None, max_length=100)
    transaction_type: str | None = Field(default=None, max_length=50)
    status: EmailTransactionStatus | None = None
    seen: bool | None = None
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
