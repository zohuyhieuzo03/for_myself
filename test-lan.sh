#!/bin/bash

# Test script for LAN deployment
echo "🧪 Testing LAN deployment..."

# Test hostname resolution
echo "📍 Testing hostname resolution..."
if ping -c 1 fastapi-dev.local > /dev/null 2>&1; then
    echo "✅ Hostname 'fastapi-dev.local' resolves correctly"
else
    echo "❌ Hostname 'fastapi-dev.local' not resolved"
    exit 1
fi

# Test backend API
echo "🔧 Testing backend API..."
if curl -s http://fastapi-dev.local:8000/api/v1/utils/health-check/ | grep -q "true"; then
    echo "✅ Backend API is responding"
else
    echo "❌ Backend API not responding"
    exit 1
fi

# Test frontend
echo "🎯 Testing frontend..."
if curl -s -I http://fastapi-dev.local:5173 | grep -q "200 OK"; then
    echo "✅ Frontend is responding"
else
    echo "❌ Frontend not responding"
    exit 1
fi

# Test adminer
echo "🗄️ Testing Adminer..."
if curl -s -I http://fastapi-dev.local:8080 | grep -q "200 OK"; then
    echo "✅ Adminer is responding"
else
    echo "❌ Adminer not responding"
    exit 1
fi

# Test mailcatcher
echo "📧 Testing MailCatcher..."
if curl -s -I http://fastapi-dev.local:1080 | grep -q "200 OK"; then
    echo "✅ MailCatcher is responding"
else
    echo "❌ MailCatcher not responding"
    exit 1
fi

echo ""
echo "🎉 All tests passed! Your LAN deployment is working perfectly!"
echo ""
echo "🌐 URLs for your teammates:"
echo "   Frontend: http://fastapi-dev.local:5173"
echo "   Backend API: http://fastapi-dev.local:8000"
echo "   API Docs: http://fastapi-dev.local:8000/docs"
echo "   Adminer: http://fastapi-dev.local:8080"
echo "   MailCatcher: http://fastapi-dev.local:1080"
