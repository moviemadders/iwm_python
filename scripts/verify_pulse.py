import requests
import random
import string
import time
import sys

API_BASE = "http://localhost:8000/api/v1"

def generate_random_string(length=8):
    return ''.join(random.choices(string.ascii_lowercase + string.digits, k=length))

def check_health():
    try:
        print("Checking backend health...")
        response = requests.get("http://localhost:8000/docs")
        if response.status_code == 200:
            print("Backend is UP")
            return True
        else:
            print(f"Backend returned {response.status_code}")
            return False
    except Exception as e:
        print(f"Backend is DOWN: {e}")
        return False

def create_user():
    username = f"demo_{generate_random_string()}"
    email = f"{username}@example.com"
    password = "Password123!"
    
    print(f"Creating user: {username} / {email} ...")
    
    try:
        # Register
        resp = requests.post(f"{API_BASE}/auth/signup", json={
            "email": email,
            "password": password,
            "name": "Demo User"
        })
        
        if resp.status_code != 200 and resp.status_code != 201:
            print(f"Registration failed: {resp.text}")
            return None, None
            
        print("User created successfully.")
        
        # Login
        login_resp = requests.post(f"{API_BASE}/auth/login", json={
            "email": email,
            "password": password
        })
        
        if login_resp.status_code != 200:
            print(f"Login failed: {login_resp.text}")
            return None, None
            
        token = login_resp.json()["access_token"]
        print("Logged in successfully.")
        return token, username
        
    except Exception as e:
        print(f"User creation failed: {e}")
        return None, None

def create_pulse(token):
    print("Creating a public pulse...")
    headers = {"Authorization": f"Bearer {token}"}
    content = f"This is a public pulse created at {time.ctime()} #demo #public"
    
    try:
        resp = requests.post(f"{API_BASE}/pulse", json={
            "contentText": content,
            "hashtags": ["demo", "public"]
        }, headers=headers)
        
        if resp.status_code != 200 and resp.status_code != 201:
            print(f"Pulse creation failed: {resp.text}")
            return None
            
        pulse_data = resp.json()
        print(f"Pulse created: {pulse_data['id']}")
        return pulse_data['id']
        
    except Exception as e:
        print(f"Pulse creation failed: {e}")
        return None

def verify_feed(pulse_id):
    print("Verifying pulse in public feed...")
    try:
        # Fetch feed without auth (public)
        resp = requests.get(f"{API_BASE}/pulse/feed?filter=latest")
        
        if resp.status_code != 200:
            print(f"Feed fetch failed: {resp.text}")
            return False
            
        posts = resp.json()  # API returns list directly, not dict with "posts" key
        
        if not isinstance(posts, list):
            print(f"Unexpected response format: {type(posts)}")
            return False
        
        found = False
        for post in posts:
            if post["id"] == pulse_id:
                found = True
                print("Pulse FOUND in public feed!")
                break
        
        if not found:
            print(f"Pulse NOT found in public feed. Found {len(posts)} posts total.")
            
        return found
        
    except Exception as e:
        print(f"Feed verification failed: {e}")
        return False

if __name__ == "__main__":
    if not check_health():
        sys.exit(1)
        
    token, username = create_user()
    if not token:
        sys.exit(1)
        
    pulse_id = create_pulse(token)
    if not pulse_id:
        sys.exit(1)
        
    if verify_feed(pulse_id):
        print("\nSUCCESS: Pulse creation and public visibility verified.")
        print(f"Demo Account: {username}@example.com / Password123!")
    else:
        print("\nFAILURE: Pulse not visible in feed.")
        sys.exit(1)
