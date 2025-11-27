import requests
import sys
import json

API_BASE = "http://localhost:8000/api/v1"
USER1_EMAIL = "user1@iwm.com"
USER1_PASSWORD = "rmrnn0077"

def print_step(step):
    print(f"\n=== {step} ===")

def verify_comment():
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
            "contentText": "Testing comments! #comment",
            "contentMedia": [],
            "hashtags": ["comment"]
        })
        if resp.status_code != 200:
            print(f"❌ Create pulse failed: {resp.text}")
            return False
        
        pulse_id = resp.json()["id"]
        print(f"✅ Created Pulse: {pulse_id}")
    except Exception as e:
        print(f"❌ Create pulse failed: {e}")
        return False

    # 3. Add Comment
    print_step("3. Adding Comment")
    comment_text = "This is a test comment 🚀"
    try:
        resp = requests.post(f"{API_BASE}/pulse/{pulse_id}/comments", headers=headers, json={
            "content": comment_text
        })
        if resp.status_code != 200:
            print(f"❌ Add comment failed: {resp.text}")
            return False
        
        comment = resp.json()
        print(f"ℹ️ Comment: {comment}")
        
        if comment["content"] != comment_text or comment["postId"] != pulse_id:
            print("❌ Comment data incorrect")
            return False
            
        print("✅ Comment added successfully")
    except Exception as e:
        print(f"❌ Add comment failed: {e}")
        return False

    # 4. Get Comments
    print_step("4. Getting Comments")
    try:
        resp = requests.get(f"{API_BASE}/pulse/{pulse_id}/comments", headers=headers)
        if resp.status_code != 200:
            print(f"❌ Get comments failed: {resp.text}")
            return False
        
        comments = resp.json()
        print(f"ℹ️ Comments count: {len(comments)}")
        
        if len(comments) != 1 or comments[0]["content"] != comment_text:
            print("❌ Comments list incorrect")
            return False
            
        print("✅ Comments list verified")
    except Exception as e:
        print(f"❌ Get comments failed: {e}")
        return False

    # 5. Verify in Feed (Comment Count)
    print_step("5. Verifying in Feed")
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
            
        print(f"ℹ️ Post comments count: {post['engagement']['comments']}")
        
        if post["engagement"]["comments"] != 1:
             print(f"❌ Feed comment count incorrect: {post['engagement']['comments']}")
             return False
             
        print("✅ Feed comment count verified")
    except Exception as e:
        print(f"❌ Feed verification failed: {e}")
        return False

    print("\n✨ ALL CHECKS PASSED SUCCESSFULLY ✨")
    return True

if __name__ == "__main__":
    if verify_comment():
        sys.exit(0)
    else:
        sys.exit(1)
