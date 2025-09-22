# Import all CRUD functions from individual modules
from .user import (
    authenticate,
    create_user,
    get_user_by_email,
    update_user,
)
from .todo import (
    create_checklist_item,
    create_item,
    create_todo,
    delete_checklist_item,
    delete_todo,
    get_checklist_item,
    get_checklist_items_by_todo,
    get_todo,
    get_todos,
    update_checklist_item,
    update_todo,
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
from .gmail_connection import (
    create_gmail_connection,
    delete_gmail_connection,
    get_active_gmail_connection,
    get_gmail_connection_by_user_and_email,
    get_gmail_connection,
    get_gmail_connections,
    update_gmail_connection,
)
from .email_transaction import (
    bulk_update_email_transactions,
    count_email_transactions,
    create_email_transaction,
    delete_email_transaction,
    get_email_transaction,
    get_email_transaction_by_email_id,
    get_email_transactions,
    get_pending_email_transactions,
    get_email_txn_dashboard,
    update_email_transaction,
    get_email_transactions_for_all_connections,
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
    # Checklist functions
    "create_checklist_item",
    "delete_checklist_item",
    "get_checklist_item",
    "get_checklist_items_by_todo",
    "update_checklist_item",
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
    # Gmail connection functions
    "create_gmail_connection",
    "delete_gmail_connection",
    "get_active_gmail_connection",
    "get_gmail_connection_by_user_and_email",
    "get_gmail_connection",
    "get_gmail_connections",
    "update_gmail_connection",
    # Email transaction functions
    "bulk_update_email_transactions",
    "count_email_transactions",
    "create_email_transaction",
    "delete_email_transaction",
    "get_email_transaction",
    "get_email_transaction_by_email_id",
    "get_email_transactions",
    "get_pending_email_transactions",
    "get_email_txn_dashboard",
    "update_email_transaction",
    "get_email_transactions_for_all_connections",
]
