# Migration Helper Scripts

Các script này giúp bạn quản lý Alembic migrations một cách dễ dàng và tự động copy file migration từ container về máy host.

## Scripts có sẵn

### 1. `migration.sh` - Bash Script
Script bash với đầy đủ tính năng và giao diện màu sắc.

### 2. `migration.py` - Python Script  
Script Python với giao diện đơn giản và dễ sử dụng.

## Cách sử dụng

### Tạo migration mới

#### Sử dụng Bash Script:
```bash
# Tạo migration với autogenerate
./scripts/migration.sh -m "Add user profile fields" -a

# Tạo migration trống
./scripts/migration.sh -m "Add user profile fields"

# Chỉ copy migrations từ container
./scripts/migration.sh -c
```

#### Sử dụng Python Script:
```bash
# Tạo migration với autogenerate
python scripts/migration.py -m "Add user profile fields" -a

# Tạo migration trống
python scripts/migration.py -m "Add user profile fields"

# Tạo và chạy migration ngay
python scripts/migration.py -m "Add user profile fields" -a -r

# Chỉ copy migrations từ container
python scripts/migration.py -c

# Xem trạng thái migrations
python scripts/migration.py -s

# Rollback migration cuối cùng
python scripts/migration.py --rollback
```

### Chạy migrations

#### Sử dụng Bash Script:
Script sẽ hỏi bạn có muốn chạy migration ngay không sau khi tạo.

#### Sử dụng Python Script:
```bash
# Chạy migrations
python scripts/migration.py -r

# Hoặc chạy trực tiếp trong container
docker compose exec backend bash -c "cd /app && alembic upgrade head"
```

## Quy trình làm việc khuyến nghị

### 1. Thay đổi model trong code
```python
# backend/app/models.py
class Todo(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    title: str
    description: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)  # Thêm cột mới
    updated_at: datetime = Field(default_factory=datetime.utcnow)  # Thêm cột mới
```

### 2. Tạo migration
```bash
python scripts/migration.py -m "Add created_at and updated_at to Todo" -a
```

### 3. Kiểm tra migration file
```bash
# Xem file migration được tạo
ls backend/app/alembic/versions/
cat backend/app/alembic/versions/[migration_file].py
```

### 4. Chạy migration
```bash
python scripts/migration.py -r
```

### 5. Commit vào git
```bash
git add backend/app/alembic/versions/
git commit -m "Add migration: Add created_at and updated_at to Todo"
```

## Xử lý lỗi thường gặp

### Lỗi "Can't locate revision"
```bash
# Reset database về revision hiện tại
docker compose exec db psql -U postgres -d app -c "DELETE FROM alembic_version;"
docker compose exec backend bash -c "cd /app && alembic stamp head"
```

### Lỗi "column contains null values"
Khi thêm cột NOT NULL vào bảng có dữ liệu, cần:
1. Thêm cột nullable=True trước
2. Cập nhật dữ liệu hiện tại
3. Sau đó mới set nullable=False

### File migration không xuất hiện trên host
```bash
# Copy thủ công từ container
docker compose cp backend:/app/app/alembic/versions/[filename] backend/app/alembic/versions/
```

## Lưu ý quan trọng

- ✅ **Luôn tạo migration** khi thay đổi models
- ✅ **Luôn chạy migration** sau khi tạo
- ✅ **Commit migration files** vào git
- ❌ **Không chỉnh sửa** migration files đã commit
- ❌ **Không xóa** migration files đã commit

## Troubleshooting

### Container không chạy
```bash
docker compose up -d
```

### Kiểm tra trạng thái migrations
```bash
python scripts/migration.py -s
```

### Xem lịch sử migrations
```bash
docker compose exec backend bash -c "cd /app && alembic history"
```

### Rollback migration
```bash
python scripts/migration.py --rollback
```
