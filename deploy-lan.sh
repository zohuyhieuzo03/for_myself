#!/bin/bash

# LAN Deployment Script for FastAPI Template with mDNS
# Usage: ./deploy-lan.sh

echo "🚀 Deploying FastAPI Template to LAN with mDNS..."

# Get local IP
LOCAL_IP=$(ifconfig | grep "inet " | grep -v 127.0.0.1 | head -1 | awk '{print $2}')
echo "📍 Local IP: $LOCAL_IP"

echo "🔧 Starting services with mDNS..."
docker compose -f docker-compose.lan.yml up --build -d

echo "⏳ Waiting for services to be ready..."
sleep 15

echo "✅ Deployment complete!"
echo ""
echo "🌐 Your application is now accessible via:"
echo "   🎯 Frontend: http://fastapi-dev.local:5173"
echo "   🔧 Backend API: http://fastapi-dev.local:8000"
echo "   📚 API Docs: http://fastapi-dev.local:8000/docs"
echo "   🗄️  Adminer: http://fastapi-dev.local:8080"
echo "   📧 MailCatcher: http://fastapi-dev.local:1080"
echo ""
echo "💡 Your teammates can now access using 'fastapi-dev.local' instead of IP!"
echo "   No need to share IP addresses anymore! 🎉"
echo ""
echo "🔍 To check status: docker compose -f docker-compose.lan.yml ps"
echo "📋 To view logs: docker compose -f docker-compose.lan.yml logs"
echo "🛑 To stop: docker compose -f docker-compose.lan.yml down"
