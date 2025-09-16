# Gmail Integration Setup Guide

## Overview
This guide will help you set up Gmail integration for automatic email transaction processing in the FastAPI template.

## Prerequisites
- Google Cloud Console account
- Gmail account with transaction emails
- Backend and frontend running

## Step 1: Google Cloud Console Setup

### 1.1 Create a Google Cloud Project
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Note your project ID

### 1.2 Enable Gmail API
1. In the Google Cloud Console, go to "APIs & Services" > "Library"
2. Search for "Gmail API"
3. Click on "Gmail API" and enable it

### 1.3 Create OAuth 2.0 Credentials
1. Go to "APIs & Services" > "Credentials"
2. Click "Create Credentials" > "OAuth 2.0 Client IDs"
3. Choose "Web application" as the application type
4. Add authorized redirect URIs:
   - For development: `http://localhost:8000/api/v1/gmail/callback`
   - For production: `https://yourdomain.com/api/v1/gmail/callback`
5. Download the credentials JSON file

## Step 2: Backend Configuration

### 2.1 Environment Variables
Add the following variables to your `.env` file:

```bash
# Gmail Integration Settings
GOOGLE_CLIENT_ID=your_client_id_here
GOOGLE_CLIENT_SECRET=your_client_secret_here
GOOGLE_REDIRECT_URI=http://localhost:8000/api/v1/gmail/callback
GMAIL_ENCRYPTION_KEY=your_32_character_encryption_key_here
```

### 2.2 Install Dependencies
The required dependencies are already added to `pyproject.toml`:
- `google-auth`
- `google-auth-oauthlib`
- `google-auth-httplib2`
- `google-api-python-client`
- `cryptography`

Run:
```bash
cd backend
source .venv/bin/activate
uv sync
```

### 2.3 Database Migration
The Gmail integration models are already created and migrated. If you need to run migrations manually:

```bash
cd backend
source .venv/bin/activate
alembic upgrade head
```

## Step 3: Frontend Configuration

### 3.1 Generate API Client
The OpenAPI client is automatically generated. If you need to regenerate:

```bash
cd backend
source .venv/bin/activate
cd ..
./scripts/generate-client.sh
```

### 3.2 Routes
The Gmail integration routes are automatically available:
- `/gmail` - Gmail connections management
- `/gmail/transactions` - Email transactions management

## Step 4: Usage

### 4.1 Connect Gmail Account
1. Navigate to `/gmail` in your application
2. Click "Connect Gmail Account"
3. Complete the OAuth flow in the popup window
4. Your Gmail account will be connected

### 4.2 Sync Emails
1. Go to `/gmail/transactions`
2. Select your Gmail connection
3. Click "Sync Emails" to import transaction emails
4. Review and process the imported transactions

### 4.3 Process Transactions
1. View email transaction details
2. Edit transaction information if needed
3. Mark transactions as processed or ignored
4. Link transactions to existing accounts/categories

## Features

### Email Processing
- **Automatic Detection**: Identifies transaction emails from banks and merchants
- **Data Extraction**: Extracts amounts, merchants, account numbers, and transaction types
- **Smart Parsing**: Uses regex patterns to parse Vietnamese currency and bank information
- **Confidence Scoring**: Provides confidence scores for extracted data

### Security
- **Token Encryption**: All Gmail tokens are encrypted before storage
- **OAuth 2.0**: Secure authentication with Google
- **User Isolation**: Each user can only access their own Gmail connections
- **Token Refresh**: Automatic token refresh when expired

### Supported Banks (Vietnam)
- Vietcombank (VCB)
- VietinBank
- BIDV
- Agribank
- Techcombank
- TPBank
- MB Bank
- VPBank
- ACB
- Sacombank
- HDBank
- SHB
- Eximbank
- MSB

## API Endpoints

### Gmail Connections
- `GET /api/v1/gmail/connections` - List Gmail connections
- `POST /api/v1/gmail/connect` - Initiate OAuth flow
- `POST /api/v1/gmail/callback` - Handle OAuth callback
- `PATCH /api/v1/gmail/connections/{id}` - Update connection
- `DELETE /api/v1/gmail/connections/{id}` - Delete connection

### Email Transactions
- `GET /api/v1/gmail/email-transactions` - List email transactions
- `POST /api/v1/gmail/sync-emails` - Sync emails from Gmail
- `PATCH /api/v1/gmail/email-transactions/{id}` - Update transaction
- `DELETE /api/v1/gmail/email-transactions/{id}` - Delete transaction

## Troubleshooting

### Common Issues

1. **OAuth Error**: Check that redirect URI matches exactly
2. **Token Expired**: The system will automatically refresh tokens
3. **No Emails Found**: Ensure Gmail account has transaction emails
4. **Permission Denied**: Check Gmail API permissions in Google Cloud Console

### Debug Mode
Enable debug logging by setting:
```bash
LOG_LEVEL=DEBUG
```

### Testing
Run the test suite:
```bash
cd backend
source .venv/bin/activate
pytest tests/
```

## Security Considerations

1. **Encryption Key**: Use a strong, unique encryption key for `GMAIL_ENCRYPTION_KEY`
2. **HTTPS**: Always use HTTPS in production
3. **Token Storage**: Tokens are encrypted and stored securely
4. **Access Control**: Users can only access their own Gmail connections
5. **Data Retention**: Consider implementing data retention policies for email content

## Future Enhancements

- Real-time email processing with Gmail push notifications
- Machine learning for better transaction detection
- Support for more email providers
- Advanced transaction categorization
- Bulk transaction operations
- Email template recognition
- Multi-language support

## Support

For issues or questions:
1. Check the logs for error messages
2. Verify Google Cloud Console configuration
3. Test OAuth flow manually
4. Check database migrations
5. Review API documentation at `/docs`
