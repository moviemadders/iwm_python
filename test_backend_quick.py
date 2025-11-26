"""Simple backend health check"""
import requests
import time

print("🔍 Checking backend status...\n")

# Wait a moment
time.sleep(2)

try:
    # Test 1: Health check
    print("1. Health check...")
    response = requests.get("http://localhost:8000/health", timeout=5)
    print(f"   ✅ Status: {response.status_code}")
    print(f"   Response: {response.text}\n")
    
    # Test 2: Login
    print("2. Testing login...")
    login_response = requests.post(
        "http://localhost:8000/api/v1/auth/login",
        json={"email": "user1@iwm.com", "password": "rmrnn0077"},
        timeout=10
    )
    print(f"   ✅ Status: {login_response.status_code}")
    if login_response.status_code == 200:
        print(f"   ✅ Login successful!")
        token = login_response.json().get("access_token")
        print(f"   Token: {token[:20]}...\n")
        
        # Test 3: Create simple pulse
        print("3. Creating test pulse...")
        headers = {"Authorization": f"Bearer {token}"}
        pulse_response = requests.post(
            "http://localhost:8000/api/v1/pulse",
            headers=headers,
            json={"contentText": "Test pulse from API test"},
            timeout=10
        )
        print(f"   ✅ Status: {pulse_response.status_code}")
        if pulse_response.status_code in [200, 201]:
            data = pulse_response.json()
            print(f"   ✅ Pulse created: {data.get('id')}")
            print(f"   Role: {data.get('userInfo', {}).get('role')}")
            print(f"   Verified: {data.get('userInfo', {}).get('isVerified')}")
        else:
            print(f"   ❌ Error: {pulse_response.text}")
    else:
        print(f"   ❌ Login failed: {login_response.text}")
        
except requests.exceptions.ConnectionError:
    print("❌ Cannot connect to backend at http://localhost:8000")
    print("   Make sure backend is running with: .\\start_all.bat")
except requests.exceptions.Timeout:
    print("❌ Request timed out. Backend may be starting up or overloaded.")
except Exception as e:
    print(f"❌ Error: {e}")

print("\n✅ Quick test complete!")
