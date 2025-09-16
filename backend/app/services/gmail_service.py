import base64
import json
import uuid
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional

from google.auth.transport.requests import Request
from google.oauth2.credentials import Credentials
from google_auth_oauthlib.flow import Flow
from googleapiclient.discovery import build
from googleapiclient.errors import HttpError
from sqlmodel import Session

from app.core.config import settings
from app.crud import gmail_connection as gmail_crud
from app.models import GmailConnection


class GmailService:
    """Service for Gmail API integration."""
    
    # Gmail API scopes
    SCOPES = ['https://www.googleapis.com/auth/gmail.readonly']
    
    def __init__(self):
        self.client_config = {
            "web": {
                "client_id": settings.GOOGLE_CLIENT_ID,
                "client_secret": settings.GOOGLE_CLIENT_SECRET,
                "auth_uri": "https://accounts.google.com/o/oauth2/auth",
                "token_uri": "https://oauth2.googleapis.com/token",
                "redirect_uris": [settings.GOOGLE_REDIRECT_URI]
            }
        }
    
    def get_authorization_url(self, state: str = None) -> str:
        """Get the authorization URL for OAuth flow."""
        flow = Flow.from_client_config(
            self.client_config,
            scopes=self.SCOPES,
            state=state
        )
        flow.redirect_uri = settings.GOOGLE_REDIRECT_URI
        
        authorization_url, _ = flow.authorization_url(
            access_type='offline',
            include_granted_scopes='true',
            prompt='consent'
        )
        
        return authorization_url
    
    def exchange_code_for_tokens(self, code: str) -> Dict[str, Any]:
        """Exchange authorization code for access and refresh tokens."""
        flow = Flow.from_client_config(
            self.client_config,
            scopes=self.SCOPES
        )
        flow.redirect_uri = settings.GOOGLE_REDIRECT_URI
        
        flow.fetch_token(code=code)
        
        credentials = flow.credentials

        if not credentials.refresh_token:
            # Without a refresh token we can't keep the connection active
            raise ValueError("Missing refresh token. Please re-connect with consent.")
        
        expiry = credentials.expiry
        if expiry and expiry.tzinfo is None:
            from datetime import timezone
            expiry = expiry.replace(tzinfo=timezone.utc)
        
        return {
            'access_token': credentials.token,
            'refresh_token': credentials.refresh_token,
            'expires_at': expiry.isoformat() if expiry else None,
            'token_uri': credentials.token_uri,
            'client_id': credentials.client_id,
            'client_secret': credentials.client_secret,
            'scopes': credentials.scopes
        }
    
    def refresh_access_token(self, refresh_token: str) -> Dict[str, Any]:
        """Refresh the access token using refresh token."""
        credentials = Credentials(
            token=None,
            refresh_token=refresh_token,
            token_uri="https://oauth2.googleapis.com/token",
            client_id=settings.GOOGLE_CLIENT_ID,
            client_secret=settings.GOOGLE_CLIENT_SECRET,
            scopes=self.SCOPES
        )
        
        credentials.refresh(Request())
        expiry = credentials.expiry
        if expiry and expiry.tzinfo is None:
            from datetime import timezone
            expiry = expiry.replace(tzinfo=timezone.utc)
        
        return {
            'access_token': credentials.token,
            'expires_at': expiry.isoformat() if expiry else None
        }
    
    def get_gmail_service(self, access_token: str):
        """Get Gmail API service instance."""
        credentials = Credentials(token=access_token)
        return build('gmail', 'v1', credentials=credentials, cache_discovery=False)
    
    def get_user_email(self, access_token: str) -> Optional[str]:
        """Return the authenticated user's primary email address using Gmail profile API.

        This avoids relying on headers of arbitrary messages which can be from any sender
        (e.g., notification@github.com).
        """
        try:
            service = self.get_gmail_service(access_token)
            profile = service.users().getProfile(userId='me').execute()
            # The profile contains 'emailAddress'
            return profile.get('emailAddress')
        except HttpError:
            return None
    
    def list_emails(
        self,
        access_token: str,
        query: str = None,
        max_results: Optional[int] = None,
    ) -> List[Dict[str, Any]]:
        """List emails from Gmail."""
        try:
            service = self.get_gmail_service(access_token)
            
            # Build query
            if not query:
                query = "is:unread"  # Default to unread emails
            
            # Get list of messages
            list_kwargs: Dict[str, Any] = {"userId": "me", "q": query}
            if max_results is not None:
                list_kwargs["maxResults"] = max_results

            results = service.users().messages().list(**list_kwargs).execute()
            
            messages = results.get('messages', [])
            
            # Get detailed information for each message
            emails = []
            for message in messages:
                email_detail = self.get_email_detail(access_token, message['id'])
                if email_detail:
                    emails.append(email_detail)
            
            return emails
            
        except HttpError as error:
            print(f"An error occurred: {error}")
            return []
    
    def get_email_detail(self, access_token: str, message_id: str) -> Optional[Dict[str, Any]]:
        """Get detailed information about a specific email."""
        try:
            service = self.get_gmail_service(access_token)
            
            message = service.users().messages().get(
                userId='me',
                id=message_id,
                format='full'
            ).execute()
            
            # Extract headers
            headers = message['payload'].get('headers', [])
            header_dict = {header['name']: header['value'] for header in headers}
            
            # Extract body content
            body = self._extract_email_body(message['payload'])
            
            # Extract date
            date_str = header_dict.get('Date', '')
            received_at = self._parse_email_date(date_str)
            
            return {
                'id': message_id,
                'subject': header_dict.get('Subject', ''),
                'sender': header_dict.get('From', ''),
                'recipient': header_dict.get('To', ''),
                'date': received_at,
                'body': body,
                'headers': header_dict,
                'thread_id': message.get('threadId', ''),
                'labels': message.get('labelIds', [])
            }
            
        except HttpError as error:
            print(f"An error occurred: {error}")
            return None
    
    def _extract_email_body(self, payload: Dict[str, Any]) -> str:
        """Extract email body content from payload."""
        body = ""
        
        if 'parts' in payload:
            # Multipart message
            for part in payload['parts']:
                if part['mimeType'] == 'text/plain':
                    data = part['body'].get('data', '')
                    if data:
                        body += base64.urlsafe_b64decode(data).decode('utf-8')
                elif part['mimeType'] == 'text/html':
                    data = part['body'].get('data', '')
                    if data:
                        body += base64.urlsafe_b64decode(data).decode('utf-8')
        else:
            # Single part message
            if payload['mimeType'] in ['text/plain', 'text/html']:
                data = payload['body'].get('data', '')
                if data:
                    body = base64.urlsafe_b64decode(data).decode('utf-8')
        
        return body
    
    def _parse_email_date(self, date_str: str) -> datetime:
        """Parse email date string to datetime."""
        try:
            from email.utils import parsedate_to_datetime
            return parsedate_to_datetime(date_str)
        except:
            return datetime.now(timezone.utc)
    
    def mark_email_as_read(self, access_token: str, message_id: str) -> bool:
        """Mark an email as read."""
        try:
            service = self.get_gmail_service(access_token)
            
            service.users().messages().modify(
                userId='me',
                id=message_id,
                body={'removeLabelIds': ['UNREAD']}
            ).execute()
            
            return True
            
        except HttpError as error:
            print(f"An error occurred: {error}")
            return False
    
    def search_transaction_emails(
        self,
        access_token: str,
        newer_than_days: int = 180,
        max_results: int = 1000,
    ) -> List[Dict[str, Any]]:
        """Search only emails from the specific VCB sender.

        Filters by sender, looks in Inbox, recent window, and includes read emails.
        """
        sender_filter = 'from:VCBDigibank@info.vietcombank.com.vn'
        query = f"{sender_filter} label:inbox newer_than:{newer_than_days}d -in:chats"

        return self.list_emails(access_token, query, max_results)

    def search_transaction_emails_by_month(
        self,
        access_token: str,
        year: int,
        month: int,
        max_results: int = 1000,
    ) -> List[Dict[str, Any]]:
        """Search emails from VCB sender for a specific month.

        Args:
            access_token: Gmail API access token
            year: Year to search (e.g., 2024)
            month: Month to search (1-12)
            max_results: Maximum number of emails to retrieve

        Returns:
            List of email dictionaries
        """
        sender_filter = 'from:VCBDigibank@info.vietcombank.com.vn'
        
        # Create date range for the month
        from datetime import datetime, timezone
        start_date = datetime(year, month, 1, tzinfo=timezone.utc)
        
        # Calculate end date (first day of next month)
        if month == 12:
            end_date = datetime(year + 1, 1, 1, tzinfo=timezone.utc)
        else:
            end_date = datetime(year, month + 1, 1, tzinfo=timezone.utc)
        
        # Format dates for Gmail query
        start_date_str = start_date.strftime('%Y/%m/%d')
        end_date_str = end_date.strftime('%Y/%m/%d')
        
        # Build Gmail query with date range
        query = f"{sender_filter} label:inbox after:{start_date_str} before:{end_date_str} -in:chats"
        
        return self.list_emails(access_token, query, max_results)


class EmailTransactionProcessor:
    """Process emails to extract transaction information."""
    
    def __init__(self):
        self.bank_patterns = [
            r'(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)',  # Amount patterns
            r'(?:VND|USD|EUR|\$|€)',  # Currency patterns
            r'(?:transaction|payment|transfer|withdrawal|deposit)',  # Transaction types
        ]
    
    def extract_transaction_info(self, email: Dict[str, Any]) -> Dict[str, Any]:
        """Extract transaction information from email."""
        import re
        
        subject = email.get('subject', '')
        body = email.get('body', '')
        sender = email.get('sender', '')
        
        # Extract amount
        amount = self._extract_amount(body + ' ' + subject)
        
        # Extract merchant/bank name
        merchant = self._extract_merchant(sender, subject, body)
        
        # Determine transaction type
        transaction_type = self._determine_transaction_type(subject, body)
        
        # Extract account number
        account_number = self._extract_account_number(body)
        
        return {
            'amount': amount,
            'merchant': merchant,
            'transaction_type': transaction_type,
            'account_number': account_number,
            'confidence': self._calculate_confidence(amount, merchant, transaction_type)
        }
    
    def _extract_amount(self, text: str) -> Optional[float]:
        """Extract amount from text."""
        import re
        
        # Pattern for Vietnamese currency (VND)
        vnd_pattern = r'(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)\s*(?:VND|đ)'
        vnd_match = re.search(vnd_pattern, text, re.IGNORECASE)
        if vnd_match:
            amount_str = vnd_match.group(1).replace(',', '')
            return float(amount_str)
        
        # Pattern for USD
        usd_pattern = r'(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)\s*(?:USD|\$)'
        usd_match = re.search(usd_pattern, text, re.IGNORECASE)
        if usd_match:
            amount_str = usd_match.group(1).replace(',', '')
            return float(amount_str)
        
        # Generic number pattern
        number_pattern = r'(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)'
        number_match = re.search(number_pattern, text)
        if number_match:
            amount_str = number_match.group(1).replace(',', '')
            # Only return if it looks like a reasonable amount
            amount = float(amount_str)
            if 1000 <= amount <= 100000000:  # Between 1K and 100M
                return amount
        
        return None
    
    def _extract_merchant(self, sender: str, subject: str, body: str) -> Optional[str]:
        """Extract merchant/bank name."""
        # Common Vietnamese banks
        banks = [
            'Vietcombank', 'VCB', 'VietinBank', 'Vietinbank',
            'BIDV', 'Agribank', 'Techcombank', 'TPBank',
            'MB Bank', 'VPBank', 'ACB', 'Sacombank',
            'HDBank', 'SHB', 'Eximbank', 'MSB'
        ]
        
        text = f"{sender} {subject} {body}".lower()
        
        for bank in banks:
            if bank.lower() in text:
                return bank
        
        # Extract from sender email
        if '@' in sender:
            domain = sender.split('@')[1]
            if any(bank.lower() in domain.lower() for bank in banks):
                return domain.split('.')[0].title()
        
        return None
    
    def _determine_transaction_type(self, subject: str, body: str) -> Optional[str]:
        """Determine transaction type (debit/credit)."""
        text = f"{subject} {body}".lower()
        
        debit_keywords = ['withdrawal', 'withdraw', 'debit', 'purchase', 'payment', 'transfer out']
        credit_keywords = ['deposit', 'credit', 'transfer in', 'refund', 'income']
        
        for keyword in debit_keywords:
            if keyword in text:
                return 'debit'
        
        for keyword in credit_keywords:
            if keyword in text:
                return 'credit'
        
        return None
    
    def _extract_account_number(self, body: str) -> Optional[str]:
        """Extract account number from email body."""
        import re
        
        # Pattern for account numbers (typically 10-16 digits)
        account_pattern = r'(?:account|tài khoản|số tài khoản)[\s:]*(\d{10,16})'
        match = re.search(account_pattern, body, re.IGNORECASE)
        if match:
            return match.group(1)
        
        return None
    
    def _calculate_confidence(self, amount: float, merchant: str, transaction_type: str) -> float:
        """Calculate confidence score for extracted transaction."""
        confidence = 0.0
        
        if amount:
            confidence += 0.4
        if merchant:
            confidence += 0.3
        if transaction_type:
            confidence += 0.3
        
        return confidence
