# Hướng dẫn Deploy Application lên VPS

## 📋 Yêu cầu chuẩn bị

### 1. VPS Requirements
- **OS**: Ubuntu 20.04+ hoặc CentOS 8+
- **RAM**: Tối thiểu 2GB (khuyến nghị 4GB+)
- **Storage**: Tối thiểu 20GB
- **Domain**: Một domain name (ví dụ: `yourdomain.com`)

### 2. DNS Configuration
Cấu hình DNS records để point về IP của VPS:
```
A     yourdomain.com           -> VPS_IP
A     *.yourdomain.com         -> VPS_IP
CNAME www.yourdomain.com       -> yourdomain.com
```

## 🚀 Bước 1: Setup VPS

### 1.1 Kết nối VPS
```bash
ssh root@your-vps-ip
```

### 1.2 Cập nhật hệ thống
```bash
apt update && apt upgrade -y
```

### 1.3 Cài đặt Docker
```bash
# Cài đặt Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh

# Thêm user hiện tại vào docker group
usermod -aG docker $USER

# Cài đặt Docker Compose
apt install docker-compose-plugin -y

# Khởi động Docker
systemctl enable docker
systemctl start docker
```

### 1.4 Cài đặt các tools cần thiết
```bash
apt install -y git curl wget unzip
```

## 🔧 Bước 2: Setup Traefik (Reverse Proxy)

### 2.1 Tạo thư mục cho Traefik
```bash
mkdir -p /root/code/traefik-public
cd /root/code/traefik-public
```

### 2.2 Copy file Traefik config
Upload file `docker-compose.traefik.yml` từ máy local lên VPS:
```bash
# Từ máy local
scp docker-compose.traefik.yml root@your-vps-ip:/root/code/traefik-public/
```

### 2.3 Tạo Docker network
```bash
docker network create traefik-public
```

### 2.4 Cấu hình environment variables cho Traefik
```bash
# Thiết lập các biến môi trường
export USERNAME=admin
export PASSWORD=your_secure_password_here
export HASHED_PASSWORD=$(openssl passwd -apr1 $PASSWORD)
export DOMAIN=yourdomain.com
export EMAIL=your-email@yourdomain.com

# Lưu vào file để sử dụng sau
cat > /root/code/traefik-public/.env << EOF
USERNAME=admin
PASSWORD=your_secure_password_here
HASHED_PASSWORD=$HASHED_PASSWORD
DOMAIN=yourdomain.com
EMAIL=your-email@yourdomain.com
EOF
```

### 2.5 Khởi động Traefik
```bash
cd /root/code/traefik-public
docker compose -f docker-compose.traefik.yml up -d
```

Kiểm tra Traefik đã chạy:
```bash
docker ps | grep traefik
```

## 📁 Bước 3: Deploy Application

### 3.1 Clone source code lên VPS
```bash
cd /root/code
git clone https://github.com/your-username/your-repo.git fastapi-app
cd fastapi-app
```

### 3.2 Tạo file environment variables
```bash
cat > .env << EOF
# Environment
ENVIRONMENT=production
DOMAIN=yourdomain.com
STACK_NAME=fastapi-app
TAG=latest

# Docker Images
DOCKER_IMAGE_BACKEND=fastapi-app-backend
DOCKER_IMAGE_FRONTEND=fastapi-app-frontend

# Frontend
FRONTEND_HOST=https://dashboard.yourdomain.com

# Backend
BACKEND_CORS_ORIGINS=["https://dashboard.yourdomain.com","https://yourdomain.com"]

# Security
SECRET_KEY=$(python3 -c "import secrets; print(secrets.token_urlsafe(32))")

# Database
POSTGRES_SERVER=db
POSTGRES_PORT=5432
POSTGRES_DB=app
POSTGRES_USER=postgres
POSTGRES_PASSWORD=$(python3 -c "import secrets; print(secrets.token_urlsafe(32))")

# First Superuser
FIRST_SUPERUSER=admin@yourdomain.com
FIRST_SUPERUSER_PASSWORD=your_admin_password_here

# Email Configuration (Optional)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_TLS=true
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password
EMAILS_FROM_EMAIL=noreply@yourdomain.com

# Project Info
PROJECT_NAME=FastAPI Application

# Sentry (Optional)
SENTRY_DSN=
EOF
```

### 3.3 Build và deploy application
```bash
# Build images
docker compose build

# Deploy với environment variables
docker compose -f docker-compose.yml up -d
```

### 3.4 Kiểm tra deployment
```bash
# Xem logs
docker compose logs -f

# Xem containers
docker ps

# Kiểm tra health check
docker compose ps
```

## 🌐 Bước 4: Access Application

Sau khi deploy thành công, bạn có thể access:

### Production URLs:
- **Frontend**: `https://dashboard.yourdomain.com`
- **Backend API**: `https://api.yourdomain.com`
- **API Docs**: `https://api.yourdomain.com/docs`
- **Adminer (Database)**: `https://adminer.yourdomain.com`
- **Traefik Dashboard**: `https://traefik.yourdomain.com`

### Credentials:
- **Traefik Dashboard**: username: `admin`, password: `your_secure_password_here`
- **Application**: email: `admin@yourdomain.com`, password: `your_admin_password_here`

## 🔧 Bước 5: Maintenance Commands

### 5.1 Update application
```bash
cd /root/code/fastapi-app
git pull origin main
docker compose build
docker compose -f docker-compose.yml up -d
```

### 5.2 Backup database
```bash
docker compose exec db pg_dump -U postgres app > backup_$(date +%Y%m%d_%H%M%S).sql
```

### 5.3 View logs
```bash
# All services
docker compose logs -f

# Specific service
docker compose logs -f backend
docker compose logs -f frontend
docker compose logs -f db
```

### 5.4 Restart services
```bash
# Restart all
docker compose restart

# Restart specific service
docker compose restart backend
```

## 🚨 Troubleshooting

### 1. Container không start
```bash
# Xem logs chi tiết
docker compose logs service-name

# Kiểm tra environment variables
docker compose config
```

### 2. Database connection issues
```bash
# Kiểm tra database container
docker compose exec db psql -U postgres -d app -c "SELECT 1;"

# Reset database (CẢNH BÁO: Xóa toàn bộ data)
docker compose down -v
docker compose up -d
```

### 3. SSL Certificate issues
```bash
# Kiểm tra Traefik logs
docker logs traefik

# Restart Traefik
docker compose -f /root/code/traefik-public/docker-compose.traefik.yml restart
```

### 4. Port conflicts
```bash
# Kiểm tra ports đang sử dụng
netstat -tulpn | grep :80
netstat -tulpn | grep :443

# Kill process nếu cần
sudo kill -9 PID
```

## 📊 Monitoring

### 1. System resources
```bash
# CPU và Memory usage
htop

# Disk usage
df -h

# Docker stats
docker stats
```

### 2. Application monitoring
```bash
# Container health
docker compose ps

# Resource usage
docker stats --no-stream
```

## 🔐 Security Best Practices

1. **Firewall**: Chỉ mở ports 80, 443, 22
2. **SSH**: Sử dụng key-based authentication
3. **Updates**: Thường xuyên update hệ thống
4. **Backup**: Setup automated backup
5. **Monitoring**: Setup log monitoring
6. **SSL**: Luôn sử dụng HTTPS

## 📝 Notes

- Thay thế `yourdomain.com` bằng domain thực tế của bạn
- Thay thế `your-vps-ip` bằng IP thực tế của VPS
- Backup database thường xuyên
- Monitor logs để phát hiện issues sớm
- Test deployment trên staging environment trước khi deploy production
