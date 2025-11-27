import requests
import sys
import json
import time

API_BASE = "http://localhost:8000/api/v1"
USER1_EMAIL = "user1@iwm.com"
USER1_PASSWORD = "rmrnn0077"
# We need a second user to follow. Let's assume there's a user2 or create one.
# For now, let's try to follow the admin user if it exists, or create a temp user.
# Actually, let's use the admin user created in previous steps if available, or sign up a new one.

def print_step(step):
    print(f"\n=== {step} ===")

def verify_follow():
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
        
        token1 = resp.json()["access_token"]
        headers1 = {"Authorization": f"Bearer {token1}"}
        print(f"✅ Logged in as {USER1_EMAIL}")
    except Exception as e:
        print(f"❌ Connection failed: {e}")
        return False

    # 2. Create/Get User 2 to follow
    print_step("2. Getting User 2 to follow")
    user2_email = f"user2_{int(time.time())}@iwm.com"
    user2_password = "password123"
    user2_username = f"user2_{int(time.time())}"
    
    try:
        # Register User 2
        resp = requests.post(f"{API_BASE}/auth/signup", json={
            "email": user2_email,
            "password": user2_password,
            "name": "User Two",
            "username": user2_username
        })
        if resp.status_code == 200:
            print(f"✅ Created User 2: {user2_username}")
            token2 = resp.json()["access_token"]
            headers2 = {"Authorization": f"Bearer {token2}"}
            # Fetch user details to get ID
            resp = requests.get(f"{API_BASE}/auth/me", headers=headers2)
            user2_id = resp.json()["id"]
            user2_username = resp.json()["username"] # Ensure we have the correct username
        else:
            print(f"⚠️ Signup failed (maybe exists): {resp.text}")
            # Try login
            resp = requests.post(f"{API_BASE}/auth/login", json={
                "email": user2_email,
                "password": user2_password
            })
            if resp.status_code == 200:
                 print(f"✅ Logged in as User 2")
                 # We need user2's username or ID to follow.
                 # Let's fetch profile to get username/id
                 token2 = resp.json()["access_token"]
                 headers2 = {"Authorization": f"Bearer {token2}"}
                 resp = requests.get(f"{API_BASE}/auth/me", headers=headers2)
                 user2_username = resp.json()["username"]
                 user2_id = resp.json()["id"]
            else:
                print("❌ Could not access User 2")
                return False

    except Exception as e:
        print(f"❌ User 2 setup failed: {e}")
        return False

    # 3. Check Initial Stats
    print_step("3. Checking Initial Stats")
    try:
        resp = requests.get(f"{API_BASE}/users/{user2_username}", headers=headers1)
        if resp.status_code != 200:
            print(f"❌ Get profile failed: {resp.text}")
            return False
        stats = resp.json()["stats"]
        initial_followers = stats["followers"]
        print(f"ℹ️ User 2 Initial Followers: {initial_followers}")
        
        resp = requests.get(f"{API_BASE}/auth/me", headers=headers1) # User 1 profile
        my_username = resp.json()["username"]
        resp = requests.get(f"{API_BASE}/users/{my_username}", headers=headers1)
        stats = resp.json()["stats"]
        initial_following = stats["following"]
        print(f"ℹ️ User 1 Initial Following: {initial_following}")

    except Exception as e:
        print(f"❌ Stats check failed: {e}")
        return False

    # 4. Follow User 2
    print_step("4. Following User 2")
    try:
        resp = requests.post(f"{API_BASE}/users/{user2_username}/follow", headers=headers1)
        if resp.status_code != 200:
            print(f"❌ Follow failed: {resp.text}")
            return False
        print("✅ Follow request successful")
    except Exception as e:
        print(f"❌ Follow request failed: {e}")
        return False

    # 5. Verify Stats Update
    print_step("5. Verifying Stats Update")
    try:
        resp = requests.get(f"{API_BASE}/users/{user2_username}", headers=headers1)
        stats = resp.json()["stats"]
        new_followers = stats["followers"]
        print(f"ℹ️ User 2 New Followers: {new_followers}")
        
        if new_followers != initial_followers + 1:
            print(f"❌ Follower count did not increase! Expected {initial_followers + 1}, got {new_followers}")
            return False
            
        resp = requests.get(f"{API_BASE}/users/{my_username}", headers=headers1)
        stats = resp.json()["stats"]
        new_following = stats["following"]
        print(f"ℹ️ User 1 New Following: {new_following}")
        
        if new_following != initial_following + 1:
             print(f"❌ Following count did not increase! Expected {initial_following + 1}, got {new_following}")
             return False
             
        print("✅ Stats updated correctly")

    except Exception as e:
        print(f"❌ Stats verification failed: {e}")
        return False

    # 6. Unfollow User 2
    print_step("6. Unfollowing User 2")
    try:
        resp = requests.delete(f"{API_BASE}/users/{user2_username}/follow", headers=headers1)
        if resp.status_code != 200:
            print(f"❌ Unfollow failed: {resp.text}")
            return False
        print("✅ Unfollow request successful")
    except Exception as e:
        print(f"❌ Unfollow request failed: {e}")
        return False

    # 7. Verify Stats Revert
    print_step("7. Verifying Stats Revert")
    try:
        resp = requests.get(f"{API_BASE}/users/{user2_username}", headers=headers1)
        stats = resp.json()["stats"]
        final_followers = stats["followers"]
        print(f"ℹ️ User 2 Final Followers: {final_followers}")
        
        if final_followers != initial_followers:
            print(f"❌ Follower count did not revert! Expected {initial_followers}, got {final_followers}")
            return False
            
        print("✅ Stats reverted correctly")

    except Exception as e:
        print(f"❌ Stats revert verification failed: {e}")
        return False

    print("\n✨ ALL CHECKS PASSED SUCCESSFULLY ✨")
    return True

if __name__ == "__main__":
    if verify_follow():
        sys.exit(0)
    else:
        sys.exit(1)
