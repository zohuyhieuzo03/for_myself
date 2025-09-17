# Gmail Auto Sync Setup Guide

Hướng dẫn thiết lập tự động sync transaction email từ Gmail.

## Tổng quan

Hệ thống sử dụng **Periodic Sync** để tự động sync transaction emails:

- **Mỗi 30 phút**: Sync emails mới (sử dụng last_sync_at để tránh duplicate)
- **Mỗi 24 giờ**: Sync emails từ 7 ngày gần nhất

## 1. Periodic Sync

### Cách hoạt động
- **Mỗi 30 phút**: Sync emails mới dựa trên `last_sync_at` timestamp
- **Mỗi 24 giờ**: Sync emails từ 7 ngày gần nhất
- **Tránh duplicate**: Sử dụng `email_id` để check email đã được sync chưa
- **Thông minh**: Chỉ sync emails mới hơn `last_sync_at` timestamp

### Tự động khởi động
Scheduler tự động khởi động khi server start và dừng khi server shutdown.

## 2. API Endpoints

### Manual Sync
```bash
# Manual trigger auto-sync cho connection cụ thể
POST /api/v1/gmail/auto-sync?connection_id={id}
```

### Scheduler Management (Admin only)
```bash
# Get scheduler status
GET /api/v1/gmail/scheduler/status

# Start scheduler manually
POST /api/v1/gmail/scheduler/start

# Stop scheduler manually
POST /api/v1/gmail/scheduler/stop

# Trigger sync all connections
POST /api/v1/gmail/scheduler/sync-all?days=7
```

## 3. Database Schema

### GmailConnection Fields
Sử dụng field `last_sync_at` có sẵn để track thời gian sync cuối cùng.

### Không cần migration mới
Hệ thống sử dụng schema hiện tại.

## 4. Monitoring & Logs

### Log Messages
- `Gmail sync scheduler started successfully`
- `Periodic sync completed. Synced X emails across Y connections`
- `Synced X recent emails for connection: {connection_id}`
- `No recent transaction emails found for connection: {connection_id}`

### Scheduler Status
```json
{
  "status": "running",
  "jobs": [
    {
      "id": "gmail_periodic_sync",
      "name": "Gmail Periodic Sync",
      "next_run": "2024-01-15T10:30:00Z",
      "trigger": "interval[0:30:00]"
    },
    {
      "id": "gmail_daily_full_sync", 
      "name": "Gmail Daily Full Sync",
      "next_run": "2024-01-16T00:00:00Z",
      "trigger": "interval[24:00:00]"
    }
  ]
}
```

## 5. Troubleshooting

### Scheduler không chạy
1. Check logs for startup errors
2. Verify APScheduler dependency
3. Check database connection

### Email không sync
1. Verify Gmail connection is active
2. Check token expiration
3. Verify VCB sender filter
4. Check email transaction processor
5. Check `last_sync_at` timestamp

## 6. Security Considerations

- Tất cả Gmail tokens được encrypt
- Admin-only scheduler management
- Efficient email filtering chỉ sync VCB emails

## 7. Performance

- Periodic sync: ~5-10 seconds per connection
- Background processing không block API responses
- Smart sync dựa trên `last_sync_at` để tránh duplicate
- Efficient email filtering chỉ sync VCB emails

## 8. Future Enhancements

- [ ] Celery integration cho distributed processing
- [ ] Email content caching
- [ ] Advanced filtering rules
- [ ] Multi-bank support
- [ ] Real-time notifications to frontend
