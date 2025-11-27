import requests
import sys
import json
import time

API_BASE = "http://localhost:8000/api/v1"
EMAIL = "user1@iwm.com"
PASSWORD = "rmrnn0077"
MOVIE_ID = "03d528c6-58d4-41a8-af3e-4ef2248da8fc"  # Inception external_id

def print_step(step):
    print(f"\n=== {step} ===")

def verify_movie_link():
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

    # 2. Create Pulse with Movie Link
    print_step("2. Creating Pulse with Movie Link")
    pulse_content = f"Testing movie link via script at {time.ctime()} #inception #movie"
    try:
        resp = requests.post(f"{API_BASE}/pulse", json={
            "contentText": pulse_content,
            "hashtags": ["inception", "movie"],
            "linkedMovieId": str(MOVIE_ID)
        }, headers=headers)
        
        if resp.status_code != 200:
            print(f"❌ Create pulse failed: {resp.text}")
            return False
            
        pulse = resp.json()
        pulse_id = pulse["id"]
        print(f"✅ Pulse created: {pulse_id}")
        
        # Verify linked content in response
        if not pulse.get("content", {}).get("linkedContent"):
            print("❌ Linked content missing in create response")
            return False
            
        linked = pulse["content"]["linkedContent"]
        if str(linked.get("id")) != str(MOVIE_ID):
             print(f"❌ Incorrect linked movie ID. Expected {MOVIE_ID}, got {linked.get('id')}")
             return False
             
        print(f"✅ Linked content verified in response: {linked.get('title')}")

    except Exception as e:
        print(f"❌ Create pulse failed: {e}")
        return False

    # 3. Verify Feed
    print_step("3. Verifying Feed Data")
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
        
        # Verify linked content in feed
        if not found_post.get("content", {}).get("linkedContent"):
            print("❌ Linked content missing in feed item")
            return False
            
        linked = found_post["content"]["linkedContent"]
        if str(linked.get("id")) != str(MOVIE_ID):
             print(f"❌ Incorrect linked movie ID in feed. Expected {MOVIE_ID}, got {linked.get('id')}")
             return False
             
        print(f"✅ Linked content verified in feed: {linked.get('title')}")
            
    except Exception as e:
        print(f"❌ Feed verification failed: {e}")
        return False

    print("\n✨ ALL CHECKS PASSED SUCCESSFULLY ✨")
    return True

if __name__ == "__main__":
    if verify_movie_link():
        sys.exit(0)
    else:
        sys.exit(1)
