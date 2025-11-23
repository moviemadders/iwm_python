import requests
import sys
import json

API_BASE = "http://localhost:8000/api/v1"
USER1_EMAIL = "user1@iwm.com"
USER1_PASSWORD = "rmrnn0077"

def print_step(step):
    print(f"\n=== {step} ===")

def verify_like():
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
            "contentText": "Testing reactions! #like",
            "contentMedia": [],
            "hashtags": ["like"]
        })
        if resp.status_code != 200:
            print(f"❌ Create pulse failed: {resp.text}")
            return False
        
        pulse_id = resp.json()["id"]
        print(f"✅ Created Pulse: {pulse_id}")
    except Exception as e:
        print(f"❌ Create pulse failed: {e}")
        return False

    # 3. Add Reaction (Love)
    print_step("3. Adding Reaction (Love)")
    try:
        resp = requests.post(f"{API_BASE}/pulse/{pulse_id}/reactions", headers=headers, json={
            "type": "love"
        })
        if resp.status_code != 200:
            print(f"❌ Add reaction failed: {resp.text}")
            return False
        
        data = resp.json()
        reactions = data["reactions"]
        user_reaction = data["userReaction"]
        
        print(f"ℹ️ Reactions: {reactions}")
        print(f"ℹ️ User Reaction: {user_reaction}")
        
        if reactions["love"] != 1 or reactions["total"] != 1 or user_reaction != "love":
            print("❌ Reaction counts incorrect")
            return False
            
        print("✅ Reaction added successfully")
    except Exception as e:
        print(f"❌ Add reaction failed: {e}")
        return False

    # 4. Verify in Feed
    print_step("4. Verifying in Feed")
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
            
        if post["engagement"]["userReaction"] != "love" or post["engagement"]["reactions"]["love"] != 1:
             print(f"❌ Feed data incorrect: {post['engagement']}")
             return False
             
        print("✅ Feed data verified")
    except Exception as e:
        print(f"❌ Feed verification failed: {e}")
        return False

    # 5. Toggle Off Reaction (Love)
    print_step("5. Toggling Off Reaction")
    try:
        resp = requests.post(f"{API_BASE}/pulse/{pulse_id}/reactions", headers=headers, json={
            "type": "love"
        })
        if resp.status_code != 200:
            print(f"❌ Toggle reaction failed: {resp.text}")
            return False
        
        data = resp.json()
        reactions = data["reactions"]
        user_reaction = data["userReaction"]
        
        print(f"ℹ️ Reactions: {reactions}")
        print(f"ℹ️ User Reaction: {user_reaction}")
        
        if reactions["love"] != 0 or reactions["total"] != 0 or user_reaction is not None:
            print("❌ Reaction counts incorrect after toggle")
            return False
            
        print("✅ Reaction toggled off successfully")
    except Exception as e:
        print(f"❌ Toggle reaction failed: {e}")
        return False

    # 6. Switch Reaction (Fire)
    print_step("6. Switching Reaction (Fire)")
    try:
        # First add love again
        requests.post(f"{API_BASE}/pulse/{pulse_id}/reactions", headers=headers, json={"type": "love"})
        
        # Now switch to fire
        resp = requests.post(f"{API_BASE}/pulse/{pulse_id}/reactions", headers=headers, json={
            "type": "fire"
        })
        if resp.status_code != 200:
            print(f"❌ Switch reaction failed: {resp.text}")
            return False
        
        data = resp.json()
        reactions = data["reactions"]
        user_reaction = data["userReaction"]
        
        print(f"ℹ️ Reactions: {reactions}")
        print(f"ℹ️ User Reaction: {user_reaction}")
        
        if reactions["love"] != 0 or reactions["fire"] != 1 or reactions["total"] != 1 or user_reaction != "fire":
            print("❌ Reaction counts incorrect after switch")
            return False
            
        print("✅ Reaction switched successfully")
    except Exception as e:
        print(f"❌ Switch reaction failed: {e}")
        return False

    print("\n✨ ALL CHECKS PASSED SUCCESSFULLY ✨")
    return True

if __name__ == "__main__":
    if verify_like():
        sys.exit(0)
    else:
        sys.exit(1)
