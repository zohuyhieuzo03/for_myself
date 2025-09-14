# Import all CRUD functions from individual modules
from .user import (
    authenticate,
    create_user,
    get_user_by_email,
    update_user,
)
from .todo import (
    create_item,
    create_todo,
    delete_todo,
    get_todo,
    get_todos,
    update_todo,
)
from .sprint import (
    create_sprint,
    delete_sprint,
    get_sprint,
    get_sprint_detail,
    get_sprints,
    update_sprint,
)
from .account import (
    create_account,
    delete_account,
    get_account,
    get_accounts,
    update_account,
)
from .category import (
    create_category,
    delete_category,
    get_category,
    get_categories,
    update_category,
)
from .income import (
    create_income,
    delete_income,
    get_income,
    get_incomes,
    update_income,
)
from .transaction import (
    create_transaction,
    delete_transaction,
    get_transaction,
    get_transactions,
    update_transaction,
)
from .allocation_rule import (
    create_allocation_rule,
    delete_allocation_rule,
    get_allocation_rule,
    get_allocation_rules,
    update_allocation_rule,
)

__all__ = [
    # User functions
    "authenticate",
    "create_user",
    "get_user_by_email",
    "update_user",
    # Todo/Item functions
    "create_item",
    "create_todo",
    "delete_todo",
    "get_todo",
    "get_todos",
    "update_todo",
    # Sprint functions
    "create_sprint",
    "delete_sprint",
    "get_sprint",
    "get_sprint_detail",
    "get_sprints",
    "update_sprint",
    # Account functions
    "create_account",
    "delete_account",
    "get_account",
    "get_accounts",
    "update_account",
    # Category functions
    "create_category",
    "delete_category",
    "get_category",
    "get_categories",
    "update_category",
    # Income functions
    "create_income",
    "delete_income",
    "get_income",
    "get_incomes",
    "update_income",
    # Transaction functions
    "create_transaction",
    "delete_transaction",
    "get_transaction",
    "get_transactions",
    "update_transaction",
    # Allocation rule functions
    "create_allocation_rule",
    "delete_allocation_rule",
    "get_allocation_rule",
    "get_allocation_rules",
    "update_allocation_rule",
]
