import requests
import sys
import json

API_BASE = "http://localhost:8000/api/v1"
USER1_EMAIL = "user1@iwm.com"
USER1_PASSWORD = "rmrnn0077"

def print_step(step):
    print(f"\n=== {step} ===")

def verify_bookmark_share():
    # 1. Login as User 1
    print_step("1. Logging in as User 1")
    try:
        resp = requests.post(f"{API_BASE}/auth/login", json={
            "email": USER1_EMAIL,
            "password": USER1_PASSWORD
        })
        if resp.status_code != 200:
            print(f"❌ Login failed: {resp.text}")
            return False
        
        token = resp.json()["access_token"]
        headers = {"Authorization": f"Bearer {token}"}
        print(f"✅ Logged in as {USER1_EMAIL}")
    except Exception as e:
        print(f"❌ Connection failed: {e}")
        return False

    # 2. Create a Pulse Post
    print_step("2. Creating a Pulse Post")
    try:
        resp = requests.post(f"{API_BASE}/pulse", headers=headers, json={
            "contentText": "Testing bookmark & share! #share",
            "contentMedia": [],
            "hashtags": ["share"]
        })
        if resp.status_code != 200:
            print(f"❌ Create pulse failed: {resp.text}")
            return False
        
        pulse_id = resp.json()["id"]
        print(f"✅ Created Pulse: {pulse_id}")
    except Exception as e:
        print(f"❌ Create pulse failed: {e}")
        return False

    # 3. Bookmark Pulse
    print_step("3. Bookmarking Pulse")
    try:
        resp = requests.post(f"{API_BASE}/pulse/{pulse_id}/bookmark", headers=headers)
        if resp.status_code != 200:
            print(f"❌ Bookmark failed: {resp.text}")
            return False
        
        data = resp.json()
        if not data["bookmarked"]:
            print("❌ Bookmark response incorrect")
            return False
            
        print("✅ Pulse bookmarked")
    except Exception as e:
        print(f"❌ Bookmark failed: {e}")
        return False

    # 4. Unbookmark Pulse
    print_step("4. Unbookmarking Pulse")
    try:
        resp = requests.delete(f"{API_BASE}/pulse/{pulse_id}/bookmark", headers=headers)
        if resp.status_code != 200:
            print(f"❌ Unbookmark failed: {resp.text}")
            return False
        
        data = resp.json()
        if data["bookmarked"]:
            print("❌ Unbookmark response incorrect")
            return False
            
        print("✅ Pulse unbookmarked")
    except Exception as e:
        print(f"❌ Unbookmark failed: {e}")
        return False

    # 5. Share Pulse
    print_step("5. Sharing Pulse")
    try:
        resp = requests.post(f"{API_BASE}/pulse/{pulse_id}/share", headers=headers)
        if resp.status_code != 200:
            print(f"❌ Share failed: {resp.text}")
            return False
        
        data = resp.json()
        if not data["shared"] or data["shares_count"] != 1:
            print(f"❌ Share response incorrect: {data}")
            return False
            
        print("✅ Pulse shared")
    except Exception as e:
        print(f"❌ Share failed: {e}")
        return False

    # 6. Verify Share Count in Feed
    print_step("6. Verifying Share Count in Feed")
    try:
        resp = requests.get(f"{API_BASE}/pulse/feed?filter=latest&limit=1", headers=headers)
        if resp.status_code != 200:
            print(f"❌ Get feed failed: {resp.text}")
            return False
        
        feed = resp.json()
        post = next((p for p in feed if p["id"] == pulse_id), None)
        
        if not post:
            print("❌ Post not found in feed")
            return False
            
        print(f"ℹ️ Post share count: {post['engagement']['shares']}")
        
        if post["engagement"]["shares"] != 1:
             print(f"❌ Feed share count incorrect: {post['engagement']['shares']}")
             return False
             
        print("✅ Feed share count verified")
    except Exception as e:
        print(f"❌ Feed verification failed: {e}")
        return False

    print("\n✨ ALL CHECKS PASSED SUCCESSFULLY ✨")
    return True

if __name__ == "__main__":
    if verify_bookmark_share():
        sys.exit(0)
    else:
        sys.exit(1)
