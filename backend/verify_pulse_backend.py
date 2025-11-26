import requests
import json
import sys

BASE_URL = "http://localhost:8000/api/v1"
EMAIL = "user1@iwm.com"
PASSWORD = "rmrnn0077"

def test_pulse_flow():
    print(f"1. Logging in as {EMAIL}...")
    try:
        login_res = requests.post(
            f"{BASE_URL}/auth/login",
            json={"email": EMAIL, "password": PASSWORD}
        )
        
        if login_res.status_code != 200:
            print(f"❌ Login failed: {login_res.status_code} - {login_res.text}")
            return False
            
        tokens = login_res.json()
        access_token = tokens.get("access_token")
        if not access_token:
            print("❌ No access token returned")
            return False
            
        print("✅ Login successful")
        
        print("\n2. Creating a pulse...")
        headers = {
            "Authorization": f"Bearer {access_token}",
            "Content-Type": "application/json"
        }
        
        pulse_data = {
            "contentText": "Automated test pulse from backend verification script 🤖",
            "hashtags": ["test", "backend_verification"]
        }
        
        create_res = requests.post(
            f"{BASE_URL}/pulse",
            headers=headers,
            json=pulse_data
        )
        
        if create_res.status_code not in [200, 201]:
            print(f"❌ Create pulse failed: {create_res.status_code} - {create_res.text}")
            return False
            
        pulse = create_res.json()
        print(f"✅ Pulse created: ID={pulse.get('id')}")
        print(f"   Content: {pulse.get('contentText')}")
        
        return True
        
    except Exception as e:
        print(f"❌ Error: {str(e)}")
        return False

if __name__ == "__main__":
    success = test_pulse_flow()
    if not success:
        sys.exit(1)
