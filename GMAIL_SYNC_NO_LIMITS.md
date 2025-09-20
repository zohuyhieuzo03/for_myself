# Gmail Sync API - No Limits Version

## Tổng quan

API sync emails đã được cải thiện để sync **TẤT CẢ** emails mà không bị giới hạn:
- ❌ **Loại bỏ giới hạn 500 emails** - Sử dụng pagination để sync hết
- ❌ **Loại bỏ giới hạn 180 ngày** - Sync tất cả emails từ trước đến nay
- ✅ **Pagination support** - Xử lý hàng nghìn emails một cách hiệu quả
- ✅ **Batch processing** - Tránh timeout và có thể theo dõi tiến trình

## API Endpoints

### 1. `/api/v1/gmail/sync-emails` (Cải thiện)

**Sync TẤT CẢ emails một lần**

```http
POST /api/v1/gmail/sync-emails
```

**Parameters:**
- `connection_id` (required): UUID của Gmail connection
- `batch_size` (optional): Kích thước batch (100-1000, default: 500)

**Response:**
```json
{
  "message": "Successfully synced 1250 new emails (skipped 500 existing emails)"
}
```

**⚠️ Lưu ý:** Endpoint này có thể timeout nếu có quá nhiều emails (>5000 emails)

### 2. `/api/v1/gmail/sync-emails-batch` (Mới)

**Sync emails theo từng batch để tránh timeout**

```http
POST /api/v1/gmail/sync-emails-batch
```

**Parameters:**
- `connection_id` (required): UUID của Gmail connection  
- `batch_size` (optional): Kích thước batch (100-1000, default: 500)
- `page_token` (optional): Token cho batch tiếp theo

**Response:**
```json
{
  "message": "Synced 500 new emails (skipped 0 existing emails). Use page_token='abc123' for next batch."
}
```

**Hoặc khi hoàn thành:**
```json
{
  "message": "Synced 200 new emails (skipped 0 existing emails). All emails synced!"
}
```

## Cách sử dụng

### Option 1: Sync tất cả một lần (Đơn giản)

```python
import requests

# Login để lấy token
login_response = requests.post("http://localhost:8000/api/v1/login/access-token", data={
    "username": "your_email@example.com",
    "password": "your_password"
})
token = login_response.json()["access_token"]

# Sync tất cả emails
headers = {"Authorization": f"Bearer {token}"}
response = requests.post(
    "http://localhost:8000/api/v1/gmail/sync-emails",
    headers=headers,
    params={
        "connection_id": "your-connection-uuid",
        "batch_size": 500
    }
)

print(response.json()["message"])
```

### Option 2: Sync theo batch (Khuyến nghị)

```python
import requests

# Login để lấy token
login_response = requests.post("http://localhost:8000/api/v1/login/access-token", data={
    "username": "your_email@example.com", 
    "password": "your_password"
})
token = login_response.json()["access_token"]

# Sync theo batch
headers = {"Authorization": f"Bearer {token}"}
params = {
    "connection_id": "your-connection-uuid",
    "batch_size": 100
}

batch_count = 0
total_synced = 0

while True:
    batch_count += 1
    print(f"Processing batch {batch_count}...")
    
    response = requests.post(
        "http://localhost:8000/api/v1/gmail/sync-emails-batch",
        headers=headers,
        params=params
    )
    
    if response.status_code == 200:
        result = response.json()
        message = result["message"]
        print(f"Batch {batch_count}: {message}")
        
        # Extract synced count
        if "Synced" in message:
            synced_part = message.split("Synced ")[1].split(" new emails")[0]
            synced_count = int(synced_part)
            total_synced += synced_count
        
        # Check if there are more batches
        if "page_token=" in message:
            # Extract page token for next batch
            token_part = message.split("page_token='")[1].split("'")[0]
            params["page_token"] = token_part
        else:
            print("All batches completed!")
            break
    else:
        print(f"Batch {batch_count} failed: {response.text}")
        break

print(f"Summary: Completed {batch_count} batches, total synced: {total_synced} emails")
```

## Frontend Integration

### Sử dụng auto-generated client

```typescript
import { GmailService } from "@/client"

// Sync tất cả emails
const syncAllEmails = async (connectionId: string) => {
  try {
    const response = await GmailService.syncEmails({
      connectionId,
      batchSize: 500
    })
    console.log(response.message)
  } catch (error) {
    console.error("Sync failed:", error)
  }
}

// Sync theo batch
const syncEmailsBatch = async (connectionId: string, pageToken?: string) => {
  try {
    const response = await GmailService.syncEmailsBatch({
      connectionId,
      batchSize: 100,
      pageToken
    })
    return response.message
  } catch (error) {
    console.error("Batch sync failed:", error)
    throw error
  }
}

// Sync tất cả emails theo batch
const syncAllEmailsByBatch = async (connectionId: string) => {
  let pageToken: string | undefined
  let batchCount = 0
  let totalSynced = 0
  
  while (true) {
    batchCount++
    console.log(`Processing batch ${batchCount}...`)
    
    try {
      const message = await syncEmailsBatch(connectionId, pageToken)
      console.log(`Batch ${batchCount}: ${message}`)
      
      // Extract synced count
      if (message.includes("Synced")) {
        const syncedPart = message.split("Synced ")[1].split(" new emails")[0]
        const syncedCount = parseInt(syncedPart)
        totalSynced += syncedCount
      }
      
      // Check if there are more batches
      if (message.includes("page_token=")) {
        const tokenPart = message.split("page_token='")[1].split("'")[0]
        pageToken = tokenPart
      } else {
        console.log("All batches completed!")
        break
      }
    } catch (error) {
      console.error(`Batch ${batchCount} failed:`, error)
      break
    }
  }
  
  console.log(`Summary: Completed ${batchCount} batches, total synced: ${totalSynced} emails`)
}
```

## So sánh với version cũ

| Feature | Version Cũ | Version Mới |
|---------|------------|-------------|
| **Giới hạn emails** | 500 emails | Không giới hạn (pagination) |
| **Giới hạn thời gian** | 180 ngày | Không giới hạn |
| **Timeout** | Có thể timeout | Batch processing tránh timeout |
| **Theo dõi tiến trình** | Không | Có (batch-by-batch) |
| **Error handling** | Cơ bản | Cải thiện với detailed messages |
| **Performance** | Chậm với nhiều emails | Nhanh hơn với pagination |

## Testing

Sử dụng test script để kiểm tra:

```bash
# Chạy test script
python test_sync_api.py
```

Script sẽ test cả 2 endpoints và hiển thị kết quả chi tiết.

## Lưu ý quan trọng

1. **Rate Limiting**: Gmail API có rate limits, batch processing giúp tránh vượt quá giới hạn
2. **Memory Usage**: Với nhiều emails, sử dụng batch approach để tránh memory issues
3. **Progress Tracking**: Batch approach cho phép theo dõi tiến trình và resume nếu bị gián đoạn
4. **Error Recovery**: Nếu một batch fail, có thể retry với page_token tương ứng

## Migration từ version cũ

Không cần thay đổi gì trong database schema. Chỉ cần:

1. Update frontend để sử dụng endpoints mới
2. Test với một connection nhỏ trước
3. Monitor performance và adjust batch_size nếu cần
