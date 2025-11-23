import requests
import sys
import json
import time

API_BASE = "http://localhost:8000/api/v1"
EMAIL = "user1@iwm.com"
PASSWORD = "rmrnn0077"

def print_step(step):
    print(f"\n=== {step} ===")

def verify_interactions():
    # 1. Login
    print_step("1. Logging in")
    try:
        resp = requests.post(f"{API_BASE}/auth/login", json={
            "email": EMAIL,
            "password": PASSWORD
        })
        if resp.status_code != 200:
            print(f"❌ Login failed: {resp.text}")
            return False
        
        token = resp.json()["access_token"]
        headers = {"Authorization": f"Bearer {token}"}
        print(f"✅ Logged in as {EMAIL}")
    except Exception as e:
        print(f"❌ Connection failed: {e}")
        return False

    # 2. Create Pulse
    print_step("2. Creating Pulse")
    pulse_content = f"Testing interactions via script at {time.ctime()} #test #api"
    try:
        resp = requests.post(f"{API_BASE}/pulse", json={
            "contentText": pulse_content,
            "hashtags": ["test", "api"]
        }, headers=headers)
        
        if resp.status_code != 200:
            print(f"❌ Create pulse failed: {resp.text}")
            return False
            
        pulse = resp.json()
        pulse_id = pulse["id"]
        print(f"✅ Pulse created: {pulse_id}")
        print(f"   Content: {pulse['content']['text']}")
    except Exception as e:
        print(f"❌ Create pulse failed: {e}")
        return False

    # 3. React (Like)
    print_step("3. Reacting (Like)")
    try:
        resp = requests.post(f"{API_BASE}/pulse/{pulse_id}/reactions", json={
            "type": "love"
        }, headers=headers)
        
        if resp.status_code != 200:
            print(f"❌ Reaction failed: {resp.text}")
            return False
            
        data = resp.json()
        print(f"✅ Reaction added. Total reactions: {data['reactions']['total']}")
        if data['userReaction'] != 'love':
            print(f"❌ Expected userReaction 'love', got {data['userReaction']}")
            return False
    except Exception as e:
        print(f"❌ Reaction failed: {e}")
        return False

    # 4. Comment
    print_step("4. Commenting")
    comment_text = "This is a test comment from the verification script."
    try:
        resp = requests.post(f"{API_BASE}/pulse/{pulse_id}/comments", json={
            "content": comment_text
        }, headers=headers)
        
        if resp.status_code != 200:
            print(f"❌ Comment failed: {resp.text}")
            return False
            
        comment = resp.json()
        print(f"✅ Comment added: {comment['id']}")
        print(f"   Content: {comment['content']}")
    except Exception as e:
        print(f"❌ Comment failed: {e}")
        return False

    # 5. Verify Feed
    print_step("5. Verifying Feed Data")
    try:
        resp = requests.get(f"{API_BASE}/pulse/feed?filter=latest", headers=headers)
        if resp.status_code != 200:
            print(f"❌ Feed fetch failed: {resp.text}")
            return False
            
        posts = resp.json()
        found_post = next((p for p in posts if p["id"] == pulse_id), None)
        
        if not found_post:
            print("❌ Created pulse not found in feed")
            return False
            
        print(f"✅ Found pulse in feed")
        print(f"   Reactions: {found_post['engagement']['reactions']['total']} (Expected >= 1)")
        print(f"   Comments: {found_post['engagement']['comments']} (Expected >= 1)")
        print(f"   User Reaction: {found_post['engagement']['userReaction']} (Expected 'love')")
        
        if found_post['engagement']['reactions']['total'] < 1:
            print("❌ Reaction count incorrect")
            return False
        if found_post['engagement']['comments'] < 1:
            print("❌ Comment count incorrect")
            return False
            
    except Exception as e:
        print(f"❌ Feed verification failed: {e}")
        return False

    print("\n✨ ALL CHECKS PASSED SUCCESSFULLY ✨")
    return True

if __name__ == "__main__":
    if verify_interactions():
        sys.exit(0)
    else:
        sys.exit(1)
