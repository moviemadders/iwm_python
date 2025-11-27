import requests
import uuid
import base64
import json
import time

BASE_URL = "http://localhost:8000/api/v1"

# 1. Create a new user
username = f"test_history_{uuid.uuid4().hex[:8]}"
email = f"{username}@example.com"
password = "password123"

print(f"Creating user {username}...")
try:
    resp = requests.post(f"{BASE_URL}/auth/signup", json={
        "email": email,
        "password": password,
        "username": username,
        "name": "Test User"
    })
    
    if resp.status_code not in [200, 201]:
        print(f"Failed to create user: {resp.text}")
        exit(1)
        
    print("User created.")
    data = resp.json()
    token = data["access_token"]
    
    # Decode token to get user ID (sub)
    try:
        # Simple decode without signature check to see payload
        payload_part = token.split('.')[1]
        # Add padding
        payload_part += '=' * (-len(payload_part) % 4)
        payload = json.loads(base64.b64decode(payload_part).decode('utf-8'))
        print(f"Token payload: {payload}")
        user_id = payload.get("sub")
        print(f"User ID from token: {user_id}")
    except Exception as e:
        print(f"Failed to decode token: {e}")
        exit(1)

    headers = {"Authorization": f"Bearer {token}"}

    # Verify user with /auth/me
    print("Verifying user with /auth/me...")
    me_resp = requests.get(f"{BASE_URL}/auth/me", headers=headers)
    if me_resp.status_code == 200:
        user_data = me_resp.json()
        print(f"User verified: {user_data}")
        # The backend expects external_id (email) for watchlist operations, NOT the internal ID from token.
        user_id = user_data["id"]
        print(f"Using user_id (external_id) from /auth/me: {user_id}")
    else:
        print(f"Failed to verify user: {me_resp.text}")
        exit(1)

    # 2. Add movie to watchlist
    print("Fetching a movie...")
    movies_resp = requests.get(f"{BASE_URL}/movies?limit=1", headers=headers)
    
    movies_data = movies_resp.json()
    if movies_resp.status_code != 200:
        print(f"Failed to fetch movies: {movies_resp.text}")
        exit(1)
        
    # Check if response is a list or dict with items
    if isinstance(movies_data, dict) and "items" in movies_data:
        movies_list = movies_data["items"]
    elif isinstance(movies_data, list):
        movies_list = movies_data
    else:
        print(f"Unexpected movies response format: {type(movies_data)}")
        exit(1)

    if not movies_list:
        print("No movies found.")
        exit(1)

    movie_id = movies_list[0]["id"]
    print(f"Using movie ID: {movie_id}")

    print("Adding to watchlist...")
    # The watchlist API expects 'userId' as a query param or in body?
    # Let's check the backend code or just try body.
    # frontend uses body: { movieId, userId, status, priority }
    add_resp = requests.post(f"{BASE_URL}/watchlist", json={
        "movieId": movie_id,
        "userId": user_id, 
        "status": "want-to-watch"
    }, headers=headers)

    if add_resp.status_code not in [200, 201]:
        print(f"Failed to add to watchlist: {add_resp.text}")
        exit(1)

    watchlist_item = add_resp.json()
    watchlist_id = watchlist_item["id"]
    print(f"Watchlist item created: {watchlist_id}")

    # 3. Mark as watched
    print("Marking as watched...")
    patch_resp = requests.patch(f"{BASE_URL}/watchlist/{watchlist_id}", json={
        "status": "watched"
    }, headers=headers)

    if patch_resp.status_code != 200:
        print(f"Failed to mark as watched: {patch_resp.text}")
        exit(1)

    print("Marked as watched.")

    # 4. Fetch history
    print("Fetching history...")
    # Frontend calls: /watchlist?userId={userId}&status=watched
    history_resp = requests.get(f"{BASE_URL}/watchlist?userId={user_id}&status=watched", headers=headers)

    if history_resp.status_code != 200:
        print(f"Failed to fetch history: {history_resp.text}")
        exit(1)

    history = history_resp.json()
    print(f"History items: {len(history)}")

    found = False
    for item in history:
        if item["movieId"] == movie_id:
            found = True
            print("SUCCESS: Movie found in history.")
            print(f"Item content: {item}")
            break

    if not found:
        print("FAILURE: Movie NOT found in history.")
        print("History content:", history)

except Exception as e:
    print(f"Error: {e}")
    exit(1)
