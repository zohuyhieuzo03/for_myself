#!/usr/bin/env python3
"""
Script để debug pagination issue
"""
import requests
import json

# Configuration
BASE_URL = "http://localhost:8000"
LOGIN_URL = f"{BASE_URL}/api/v1/login/access-token"
GMAIL_TRANSACTIONS_URL = f"{BASE_URL}/api/v1/gmail/email-transactions"

def login_and_get_token():
    """Login và lấy access token"""
    login_data = {
        "username": "admin@example.com",
        "password": "changethis"
    }
    
    response = requests.post(LOGIN_URL, data=login_data)
    if response.status_code == 200:
        token_data = response.json()
        return token_data["access_token"]
    else:
        print(f"Login failed: {response.status_code} - {response.text}")
        return None

def test_pagination(token, connection_id):
    """Test pagination với các limit khác nhau"""
    headers = {"Authorization": f"Bearer {token}"}
    
    print(f"Testing pagination for connection: {connection_id}")
    print("=" * 60)
    
    # Test với limit=100
    params = {
        "connection_id": connection_id,
        "skip": 0,
        "limit": 100,
        "unseen_only": False
    }
    
    response = requests.get(GMAIL_TRANSACTIONS_URL, headers=headers, params=params)
    if response.status_code == 200:
        data = response.json()
        print(f"✅ Limit=100: count={data['count']}, data_length={len(data['data'])}")
    else:
        print(f"❌ Limit=100 failed: {response.status_code}")
        return
    
    # Test với limit=1000
    params["limit"] = 1000
    response = requests.get(GMAIL_TRANSACTIONS_URL, headers=headers, params=params)
    if response.status_code == 200:
        data = response.json()
        print(f"✅ Limit=1000: count={data['count']}, data_length={len(data['data'])}")
    else:
        print(f"❌ Limit=1000 failed: {response.status_code}")
    
    # Test với skip=100 (page 2)
    params = {
        "connection_id": connection_id,
        "skip": 100,
        "limit": 100,
        "unseen_only": False
    }
    
    response = requests.get(GMAIL_TRANSACTIONS_URL, headers=headers, params=params)
    if response.status_code == 200:
        data = response.json()
        print(f"✅ Skip=100, Limit=100: count={data['count']}, data_length={len(data['data'])}")
    else:
        print(f"❌ Skip=100 failed: {response.status_code}")
    
    # Test với skip=26800 (page 269)
    params = {
        "connection_id": connection_id,
        "skip": 26800,
        "limit": 100,
        "unseen_only": False
    }
    
    response = requests.get(GMAIL_TRANSACTIONS_URL, headers=headers, params=params)
    if response.status_code == 200:
        data = response.json()
        print(f"✅ Skip=26800, Limit=100: count={data['count']}, data_length={len(data['data'])}")
    else:
        print(f"❌ Skip=26800 failed: {response.status_code}")

def main():
    print("🔍 Debugging Pagination Issue")
    print("=" * 40)
    
    # Login
    token = login_and_get_token()
    if not token:
        print("❌ Login failed. Exiting.")
        return
    
    print("✅ Login successful!")
    
    # Test pagination
    connection_id = "45d7760c-394a-45a4-a03b-3278dcb55c9d"
    test_pagination(token, connection_id)
    
    print("\n📋 Analysis:")
    print("• API trả về count=32 (chính xác)")
    print("• Với 32 emails và limit=100, chỉ cần 1 trang")
    print("• Frontend hiển thị 269 trang = bug trong pagination logic")
    print("• Có thể do cache cũ hoặc tính toán sai trong frontend")

if __name__ == "__main__":
    main()
