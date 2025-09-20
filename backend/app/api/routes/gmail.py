import uuid
from datetime import datetime, timedelta, timezone
from typing import Any

import logging
from fastapi import APIRouter, Depends, HTTPException, Query, Request
from sqlmodel import Session

from app import crud
from app.api.deps import CurrentUser, SessionDep, get_valid_gmail_connection_with_token
from app.models import (
    EmailTransaction,
    EmailTransactionCreate,
    EmailTransactionPublic,
    EmailTransactionUpdate,
    EmailTransactionsPublic,
    EmailTxnDashboard,
    GmailConnection,
    GmailConnectionCreate,
    GmailConnectionPublic,
    GmailConnectionUpdate,
    GmailConnectionsPublic,
    Message,
    TransactionCreate,
    TransactionPublic,
)
from app.services.gmail_service import EmailTransactionProcessor, GmailService
from app.utils import decrypt_token, encrypt_token, is_token_expired, normalize_to_utc
from app.core import security
from app.core.config import settings
import jwt

router = APIRouter(prefix="/gmail", tags=["gmail"])
logger = logging.getLogger(__name__)


# ========= GMAIL CONNECTION ROUTES =========
@router.get("/connections", response_model=GmailConnectionsPublic)
def get_gmail_connections(
    session: SessionDep,
    current_user: CurrentUser,
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=100),
) -> Any:
    """Get all Gmail connections for the current user."""
    connections = crud.get_gmail_connections(
        session=session, user_id=current_user.id, skip=skip, limit=limit
    )
    
    # Convert to public models (without encrypted tokens)
    public_connections = []
    for conn in connections:
        public_conn = GmailConnectionPublic.model_validate(conn)
        public_connections.append(public_conn)
    
    return GmailConnectionsPublic(data=public_connections, count=len(public_connections))


@router.post("/connect", response_model=dict)
def initiate_gmail_connection(
    current_user: CurrentUser,
) -> Any:
    """Initiate Gmail OAuth connection."""
    gmail_service = GmailService()
    
    # Generate state parameter for security (embed signed user id, 10 min expiry)
    expires_at = datetime.now(timezone.utc) + timedelta(minutes=10)
    state_payload = {
        "sub": str(current_user.id),
        "type": "gmail_state",
        "exp": expires_at
    }
    state = jwt.encode(state_payload, settings.SECRET_KEY, algorithm=security.ALGORITHM)
    
    # Get authorization URL
    auth_url = gmail_service.get_authorization_url(state=state)
    
    return {
        "authorization_url": auth_url,
        "state": state,
        "message": "Please visit the authorization URL to connect your Gmail account"
    }


@router.get("/callback", response_model=GmailConnectionPublic)
def handle_gmail_callback(
    session: SessionDep,
    code: str = Query(..., description="Authorization code from Google"),
    state: str = Query(..., description="State parameter for security"),
) -> Any:
    """Handle Gmail OAuth callback and create connection."""
    try:
        # Decode state to identify user (no Authorization header on Google redirect)
        try:
            payload = jwt.decode(state, settings.SECRET_KEY, algorithms=[security.ALGORITHM])
            if payload.get("type") != "gmail_state":
                raise HTTPException(status_code=400, detail="Invalid state parameter")
            user_id = payload.get("sub")
        except Exception:
            raise HTTPException(status_code=401, detail="Not authenticated")
        
        # Load current user from DB
        from app.models import User
        current_user = session.get(User, user_id)
        if not current_user:
            raise HTTPException(status_code=404, detail="User not found")
        if not current_user.is_active:
            raise HTTPException(status_code=400, detail="Inactive user")
        
        gmail_service = GmailService()
        
        # Exchange code for tokens
        tokens = gmail_service.exchange_code_for_tokens(code)
        
        # Get authenticated user's email from Gmail profile API
        gmail_email = gmail_service.get_user_email(tokens['access_token'])
        if not gmail_email:
            raise HTTPException(status_code=400, detail="Could not retrieve Gmail profile")
        
        # Check if connection for this gmail_email already exists for the user
        existing_same_email = crud.get_gmail_connection_by_user_and_email(
            session=session, user_id=current_user.id, gmail_email=gmail_email
        )

        if existing_same_email:
            # Update tokens for this email's existing connection; keep it active
            connection_update = GmailConnectionUpdate()
            connection_update.is_active = True

            existing_same_email.access_token = encrypt_token(tokens['access_token'])
            existing_same_email.refresh_token = encrypt_token(tokens['refresh_token'])
            existing_same_email.expires_at = (
                normalize_to_utc(datetime.fromisoformat(tokens['expires_at']))
                if tokens['expires_at'] else None
            )
            existing_same_email.last_sync_at = datetime.now(timezone.utc)

            updated_connection = crud.update_gmail_connection(
                session=session, db_connection=existing_same_email, connection_in=connection_update
            )
            return GmailConnectionPublic.model_validate(updated_connection)
        else:
            # Create a new active connection for this email. Do not deactivate others.
            connection_data = GmailConnectionCreate(
                gmail_email=gmail_email,
                is_active=True,
            )

            new_connection = crud.create_gmail_connection(
                session=session,
                gmail_connection_in=connection_data,
                user_id=current_user.id,
                encrypted_access_token=encrypt_token(tokens['access_token']),
                encrypted_refresh_token=encrypt_token(tokens['refresh_token']),
                expires_at=(
                    normalize_to_utc(datetime.fromisoformat(tokens['expires_at']))
                    if tokens['expires_at'] else None
                ),
                last_sync_at=datetime.now(timezone.utc),
            )
            return GmailConnectionPublic.model_validate(new_connection)
            
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to connect Gmail: {str(e)}")


@router.patch("/connections/{connection_id}", response_model=GmailConnectionPublic)
def update_gmail_connection(
    session: SessionDep,
    current_user: CurrentUser,
    connection_id: uuid.UUID,
    connection_in: GmailConnectionUpdate,
) -> Any:
    """Update a Gmail connection."""
    connection = crud.get_gmail_connection(session=session, connection_id=connection_id)
    if not connection:
        raise HTTPException(status_code=404, detail="Gmail connection not found")
    
    if connection.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not enough permissions")
    
    updated_connection = crud.update_gmail_connection(
        session=session, db_connection=connection, connection_in=connection_in
    )
    
    return GmailConnectionPublic.model_validate(updated_connection)


@router.delete("/connections/{connection_id}", response_model=Message)
def delete_gmail_connection(
    session: SessionDep,
    current_user: CurrentUser,
    connection_id: uuid.UUID,
) -> Any:
    """Delete a Gmail connection."""
    connection = crud.get_gmail_connection(session=session, connection_id=connection_id)
    if not connection:
        raise HTTPException(status_code=404, detail="Gmail connection not found")
    
    if connection.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not enough permissions")
    
    crud.delete_gmail_connection(session=session, connection_id=connection_id)
    
    return Message(message="Gmail connection deleted successfully")


# ========= EMAIL TRANSACTION ROUTES =========
@router.get("/email-transactions", response_model=EmailTransactionsPublic)
def get_email_transactions(
    session: SessionDep,
    current_user: CurrentUser,
    connection_id: uuid.UUID = Query(..., description="Gmail connection ID"),
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=10000),
    status: str = Query(None, description="Filter by status (pending, processed, ignored)"),
    unseen_only: bool = Query(False, description="Filter to show only unseen emails"),
) -> Any:
    """Get email transactions for a Gmail connection."""
    # Verify connection belongs to user
    connection = crud.get_gmail_connection(session=session, connection_id=connection_id)
    if not connection or connection.user_id != current_user.id:
        raise HTTPException(status_code=404, detail="Gmail connection not found")
    
    # Get transactions based on filters
    if unseen_only:
        transactions = crud.get_unseen_email_transactions(
            session=session, gmail_connection_id=connection_id, skip=skip, limit=limit
        )
        total_count = crud.count_unseen_email_transactions(
            session=session, gmail_connection_id=connection_id
        )
    elif status:
        if status == "pending":
            transactions = crud.get_pending_email_transactions(
                session=session, gmail_connection_id=connection_id, skip=skip, limit=limit
            )
        else:
            # For other statuses, we need to filter by status
            transactions = crud.get_email_transactions(
                session=session, gmail_connection_id=connection_id, skip=skip, limit=limit
            )
            transactions = [t for t in transactions if t.status == status]
        total_count = crud.count_email_transactions(
            session=session, gmail_connection_id=connection_id, status=status
        )
    else:
        transactions = crud.get_email_transactions(
            session=session, gmail_connection_id=connection_id, skip=skip, limit=limit
        )
        total_count = crud.count_email_transactions(
            session=session, gmail_connection_id=connection_id, status=status
        )
    
    # Create public transactions with category names
    public_transactions = []
    for t in transactions:
        transaction_dict = t.model_dump()
        if t.category:
            transaction_dict['category_name'] = t.category.name
        public_transactions.append(EmailTransactionPublic.model_validate(transaction_dict))
    
    return EmailTransactionsPublic(data=public_transactions, count=total_count)


@router.post("/sync-emails", response_model=Message)
def sync_emails(
    session: SessionDep,
    current_user: CurrentUser,
    connection_id: uuid.UUID = Query(..., description="Gmail connection ID"),
    max_results: int = Query(1000, ge=1, le=5000, description="Maximum number of emails to sync"),
) -> Any:
    """Sync emails from Gmail and extract transaction information."""
    # Use middleware to get valid connection and token
    connection, access_token = get_valid_gmail_connection_with_token(session, current_user, connection_id)
    
    try:
        # Sync emails
        gmail_service = GmailService()
        emails = gmail_service.search_transaction_emails(access_token, max_results=max_results)
        
        processor = EmailTransactionProcessor()
        synced_count = 0
        
        for email in emails:
            # Check if email already exists
            existing_transaction = crud.get_email_transaction_by_email_id(
                session=session, email_id=email['id'], gmail_connection_id=connection_id
            )
            
            if existing_transaction:
                continue  # Skip already processed emails
            
            # Extract transaction information
            transaction_info = processor.extract_transaction_info(email)
            
            # Create email transaction
            email_transaction_data = EmailTransactionCreate(
                gmail_connection_id=connection_id,
                email_id=email['id'],
                subject=email['subject'],
                sender=email['sender'],
                received_at=email['date'],
                amount=transaction_info.get('amount'),
                merchant=transaction_info.get('merchant'),
                account_number=transaction_info.get('account_number'),
                transaction_type=transaction_info.get('transaction_type'),
                raw_content=email['body']
            )
            
            crud.create_email_transaction(
                session=session, email_transaction_in=email_transaction_data
            )
            synced_count += 1
        
        # Update last sync time
        connection.last_sync_at = datetime.now(timezone.utc)
        session.add(connection)
        session.commit()
        
        return Message(message=f"Successfully synced {synced_count} emails")
        
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to sync emails: {str(e)}")


@router.post("/sync-emails-by-month", response_model=Message)
def sync_emails_by_month(
    session: SessionDep,
    current_user: CurrentUser,
    connection_id: uuid.UUID = Query(..., description="Gmail connection ID"),
    year: int = Query(..., description="Year to sync (e.g., 2024)"),
    month: int = Query(..., description="Month to sync (1-12)"),
    max_results: int = Query(1000, ge=1, le=5000, description="Maximum number of emails to sync"),
) -> Any:
    """Sync emails from Gmail for a specific month and extract transaction information."""
    # Validate month
    if month < 1 or month > 12:
        raise HTTPException(status_code=400, detail="Month must be between 1 and 12")
    
    # Validate year
    if year < 2020 or year > 2030:
        raise HTTPException(status_code=400, detail="Year must be between 2020 and 2030")
    
    # Use middleware to get valid connection and token
    connection, access_token = get_valid_gmail_connection_with_token(session, current_user, connection_id)
    
    try:
        # Sync emails for specific month
        gmail_service = GmailService()
        emails = gmail_service.search_transaction_emails_by_month(access_token, year, month, max_results=max_results)
        
        processor = EmailTransactionProcessor()
        synced_count = 0
        
        for email in emails:
            # Check if email already exists
            existing_transaction = crud.get_email_transaction_by_email_id(
                session=session, email_id=email['id'], gmail_connection_id=connection_id
            )
            
            if existing_transaction:
                continue  # Skip already processed emails
            
            # Extract transaction information
            transaction_info = processor.extract_transaction_info(email)
            
            # Create email transaction
            email_transaction_data = EmailTransactionCreate(
                gmail_connection_id=connection_id,
                email_id=email['id'],
                subject=email['subject'],
                sender=email['sender'],
                received_at=email['date'],
                amount=transaction_info.get('amount'),
                merchant=transaction_info.get('merchant'),
                account_number=transaction_info.get('account_number'),
                transaction_type=transaction_info.get('transaction_type'),
                raw_content=email['body']
            )
            
            crud.create_email_transaction(
                session=session, email_transaction_in=email_transaction_data
            )
            synced_count += 1
        
        # Update last sync time
        connection.last_sync_at = datetime.now(timezone.utc)
        session.add(connection)
        session.commit()
        
        return Message(message=f"Successfully synced {synced_count} emails for {year}/{month:02d}")
        
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to sync emails for {year}/{month:02d}: {str(e)}")


@router.patch("/email-transactions/{transaction_id}", response_model=EmailTransactionPublic)
def update_email_transaction(
    session: SessionDep,
    current_user: CurrentUser,
    transaction_id: uuid.UUID,
    transaction_in: EmailTransactionUpdate,
) -> Any:
    """Update an email transaction."""
    transaction = crud.get_email_transaction(session=session, transaction_id=transaction_id)
    if not transaction:
        raise HTTPException(status_code=404, detail="Email transaction not found")
    
    # Verify connection belongs to user
    connection = crud.get_gmail_connection(session=session, connection_id=transaction.gmail_connection_id)
    if not connection or connection.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not enough permissions")
    
    updated_transaction = crud.update_email_transaction(
        session=session, db_transaction=transaction, transaction_in=transaction_in
    )
    
    return EmailTransactionPublic.model_validate(updated_transaction)


@router.post("/email-transactions/{transaction_id}/mark-seen", response_model=EmailTransactionPublic)
def mark_email_transaction_as_seen(
    session: SessionDep,
    current_user: CurrentUser,
    transaction_id: uuid.UUID,
) -> Any:
    """Mark an email transaction as seen."""
    transaction = crud.get_email_transaction(session=session, transaction_id=transaction_id)
    if not transaction:
        raise HTTPException(status_code=404, detail="Email transaction not found")
    
    # Verify connection belongs to user
    connection = crud.get_gmail_connection(session=session, connection_id=transaction.gmail_connection_id)
    if not connection or connection.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not enough permissions")
    
    updated_transaction = crud.mark_email_transaction_as_seen(
        session=session, transaction_id=transaction_id
    )
    
    return EmailTransactionPublic.model_validate(updated_transaction)


@router.delete("/email-transactions/{transaction_id}", response_model=Message)
def delete_email_transaction(
    session: SessionDep,
    current_user: CurrentUser,
    transaction_id: uuid.UUID,
) -> Any:
    """Delete an email transaction."""
    transaction = crud.get_email_transaction(session=session, transaction_id=transaction_id)
    if not transaction:
        raise HTTPException(status_code=404, detail="Email transaction not found")
    
    # Verify connection belongs to user
    connection = crud.get_gmail_connection(session=session, connection_id=transaction.gmail_connection_id)
    if not connection or connection.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not enough permissions")
    
    crud.delete_email_transaction(session=session, transaction_id=transaction_id)
    
    return Message(message="Email transaction deleted successfully")


@router.get("/email-transactions/dashboard", response_model=EmailTxnDashboard)
def get_email_transactions_dashboard(
    session: SessionDep,
    current_user: CurrentUser,
    connection_id: uuid.UUID = Query(..., description="Gmail connection ID"),
    year: int | None = Query(None, description="Year filter for monthly chart"),
    month: int | None = Query(None, description="Month filter (1-12)"),
) -> Any:
    """Email transaction dashboard data by category and monthly totals, filterable by month.

    If year and month are provided, results are restricted to that month; otherwise, all-time.
    """
    # Verify connection belongs to user
    connection = crud.get_gmail_connection(session=session, connection_id=connection_id)
    if not connection or connection.user_id != current_user.id:
        raise HTTPException(status_code=404, detail="Gmail connection not found")

    if (year is None) ^ (month is None):
        raise HTTPException(status_code=400, detail="Both year and month must be provided together")
    if month is not None and (month < 1 or month > 12):
        raise HTTPException(status_code=400, detail="Month must be between 1 and 12")

    dashboard = crud.get_email_txn_dashboard(
        session=session,
        gmail_connection_id=connection_id,
        year=year,
        month=month,
    )
    return dashboard


@router.get("/email-transactions/unseen", response_model=EmailTransactionsPublic)
def get_unseen_email_transactions(
    session: SessionDep,
    current_user: CurrentUser,
    connection_id: uuid.UUID = Query(..., description="Gmail connection ID"),
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=10000),
) -> Any:
    """Get unseen email transactions for a Gmail connection."""
    # Verify connection belongs to user
    connection = crud.get_gmail_connection(session=session, connection_id=connection_id)
    if not connection or connection.user_id != current_user.id:
        raise HTTPException(status_code=404, detail="Gmail connection not found")
    
    transactions = crud.get_unseen_email_transactions(
        session=session, gmail_connection_id=connection_id, skip=skip, limit=limit
    )
    total_count = crud.count_unseen_email_transactions(
        session=session, gmail_connection_id=connection_id
    )
    
    # Create public transactions with category names
    public_transactions = []
    for t in transactions:
        transaction_dict = t.model_dump()
        if t.category:
            transaction_dict['category_name'] = t.category.name
        public_transactions.append(EmailTransactionPublic.model_validate(transaction_dict))
    
    return EmailTransactionsPublic(data=public_transactions, count=total_count)


@router.post("/auto-sync", response_model=Message)
def trigger_auto_sync(
    session: SessionDep,
    current_user: CurrentUser,
    connection_id: uuid.UUID = Query(..., description="Gmail connection ID"),
) -> Any:
    """Trigger automatic sync for recent emails (last 24 hours)."""
    # Verify connection belongs to user
    connection = crud.get_gmail_connection(session=session, connection_id=connection_id)
    if not connection or connection.user_id != current_user.id:
        raise HTTPException(status_code=404, detail="Gmail connection not found")
    
    if not connection.is_active:
        raise HTTPException(status_code=400, detail="Gmail connection is not active")
    
    try:
        # Get valid access token
        _, access_token = get_valid_gmail_connection_with_token(session, current_user, connection_id)
        
        # Sync recent emails (last 7 days)
        gmail_service = GmailService()
        emails = gmail_service.search_recent_transaction_emails(access_token, days=7)
        
        processor = EmailTransactionProcessor()
        synced_count = 0
        
        for email in emails:
            # Check if email already exists
            existing_transaction = crud.get_email_transaction_by_email_id(
                session=session, email_id=email['id'], gmail_connection_id=connection_id
            )
            
            if existing_transaction:
                continue  # Skip already processed emails
            
            # Extract transaction information
            transaction_info = processor.extract_transaction_info(email)
            
            # Create email transaction
            email_transaction_data = EmailTransactionCreate(
                gmail_connection_id=connection_id,
                email_id=email['id'],
                subject=email['subject'],
                sender=email['sender'],
                received_at=email['date'],
                amount=transaction_info.get('amount'),
                merchant=transaction_info.get('merchant'),
                account_number=transaction_info.get('account_number'),
                transaction_type=transaction_info.get('transaction_type'),
                raw_content=email['body']
            )
            
            crud.create_email_transaction(
                session=session, email_transaction_in=email_transaction_data
            )
            synced_count += 1
        
        # Update last sync time
        connection.last_sync_at = datetime.now(timezone.utc)
        session.add(connection)
        session.commit()
        
        return Message(message=f"Auto-sync completed. Synced {synced_count} new emails.")
        
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Auto-sync failed: {str(e)}")


# ========= SCHEDULER MANAGEMENT ROUTES =========
@router.get("/scheduler/status", response_model=dict)
def get_scheduler_status(
    current_user: CurrentUser,
) -> Any:
    """Get the status of the Gmail sync scheduler."""
    if not current_user.is_superuser:
        raise HTTPException(status_code=403, detail="Not enough permissions")
    
    from app.services.scheduler_service import get_scheduler_status
    return get_scheduler_status()


@router.post("/scheduler/start", response_model=Message)
def start_scheduler(
    current_user: CurrentUser,
) -> Any:
    """Start the Gmail sync scheduler (admin only)."""
    if not current_user.is_superuser:
        raise HTTPException(status_code=403, detail="Not enough permissions")
    
    from app.services.scheduler_service import start_gmail_sync_scheduler
    
    try:
        start_gmail_sync_scheduler()
        return Message(message="Gmail sync scheduler started successfully")
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to start scheduler: {str(e)}")


@router.post("/scheduler/stop", response_model=Message)
def stop_scheduler(
    current_user: CurrentUser,
) -> Any:
    """Stop the Gmail sync scheduler (admin only)."""
    if not current_user.is_superuser:
        raise HTTPException(status_code=403, detail="Not enough permissions")
    
    from app.services.scheduler_service import stop_gmail_sync_scheduler
    
    try:
        stop_gmail_sync_scheduler()
        return Message(message="Gmail sync scheduler stopped successfully")
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to stop scheduler: {str(e)}")


@router.post("/scheduler/sync-all", response_model=Message)
def trigger_sync_all_connections(
    current_user: CurrentUser,
    days: int = Query(1, ge=1, le=30, description="Number of days to sync back"),
) -> Any:
    """Trigger sync for all active Gmail connections (admin only)."""
    if not current_user.is_superuser:
        raise HTTPException(status_code=403, detail="Not enough permissions")
    
    from app.services.gmail_service import sync_all_active_connections
    
    try:
        results = sync_all_active_connections(days=days)
        total_synced = sum(results.values())
        
        return Message(
            message=f"Sync completed for {len(results)} connections. "
                   f"Total emails synced: {total_synced}"
        )
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to sync all connections: {str(e)}")


# ========= EMAIL TRANSACTION TO TRANSACTION CONVERSION =========
@router.post("/email-transactions/{email_transaction_id}/create-transaction", response_model=TransactionPublic)
def create_transaction_from_email(
    *,
    session: SessionDep,
    current_user: CurrentUser,
    email_transaction_id: uuid.UUID,
    account_id: uuid.UUID = Query(...),
    category_id: uuid.UUID | None = Query(None),
    sprint_id: uuid.UUID | None = Query(None),
    note: str | None = Query(None),
) -> Any:
    """
    Create a transaction from an email transaction.
    """
    # Get the email transaction
    email_transaction = crud.get_email_transaction(
        session=session, transaction_id=email_transaction_id
    )
    if not email_transaction:
        raise HTTPException(status_code=404, detail="Email transaction not found")
    
    # Verify the email transaction belongs to the current user
    if email_transaction.gmail_connection.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not enough permissions")
    
    # Check if email transaction has required data
    if not email_transaction.amount:
        raise HTTPException(status_code=400, detail="Email transaction has no amount")
    
    if not email_transaction.transaction_type:
        raise HTTPException(status_code=400, detail="Email transaction has no transaction type")
    
    # Determine transaction type
    from app.models import TxnType
    if email_transaction.transaction_type.lower() in ['debit', 'withdrawal', 'expense']:
        txn_type = TxnType.expense
    elif email_transaction.transaction_type.lower() in ['credit', 'deposit', 'income']:
        txn_type = TxnType.income
    else:
        raise HTTPException(status_code=400, detail="Invalid transaction type in email")
    
    # Create transaction data
    transaction_data = TransactionCreate(
        txn_date=email_transaction.received_at.date(),
        type=txn_type,
        amount=email_transaction.amount,
        currency="VND",
        merchant=email_transaction.merchant,
        note=note or f"Created from email: {email_transaction.subject}",
        account_id=account_id,
        category_id=category_id,
        sprint_id=sprint_id,
    )
    
    # Create the transaction
    transaction = crud.create_transaction(
        session=session, transaction_in=transaction_data, user_id=current_user.id
    )
    
    # Update email transaction to link with the created transaction
    email_transaction_update = EmailTransactionUpdate(
        linked_transaction_id=transaction.id,
        category_id=category_id,
        status="processed"
    )
    crud.update_email_transaction(
        session=session, 
        db_transaction=email_transaction, 
        transaction_in=email_transaction_update
    )
    
    return transaction
