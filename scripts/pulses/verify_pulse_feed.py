import requests
import json
import sys

BASE_URL = "http://localhost:8000/api/v1"
EMAIL = "user1@iwm.com"
PASSWORD = "rmrnn0077"

def verify_feed():
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
        
        print("✅ Login successful")
        
        print("\n2. Fetching Pulse Feed...")
        headers = {
            "Authorization": f"Bearer {access_token}",
            "Content-Type": "application/json"
        }
        
        # Try different filters
        filters = ["latest", "popular", "trending"]
        
        for filter_type in filters:
            print(f"\n--- Filter: {filter_type} ---")
            res = requests.get(
                f"{BASE_URL}/pulse/feed?filter={filter_type}&limit=10",
                headers=headers
            )
            
            if res.status_code != 200:
                print(f"❌ Fetch failed: {res.status_code} - {res.text}")
                continue
                
            feed = res.json()
            print(f"✅ Found {len(feed)} pulses")
            
            for p in feed:
                print(f"   - [{p['id']}] {p['content']['text'][:50]}... (User: {p['userInfo']['username']})")
                
    except Exception as e:
        print(f"❌ Error: {str(e)}")
        return False

if __name__ == "__main__":
    verify_feed()
