"""
Comprehensive test script for role-based Pulse creation API.
Tests the full flow: Login -> Create Pulse with Role -> Verify Response
"""

import requests
import json

BASE_URL = "http://localhost:8000/api/v1"

def test_role_based_pulse_api():
    print("🧪 Testing Role-Based Pulse API...\n")
    
    # Step 1: Login as user with critic role
    print("1. Logging in...")
    login_res = requests.post(f"{BASE_URL}/auth/login", json={
        "email": "user1@iwm.com",
        "password": "rmrnn0077"
    })
    
    if login_res.status_code != 200:
        print(f"❌ Login failed: {login_res.status_code}")
        print(login_res.text)
        return
    
    token = login_res.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}
    print(f"✅ Logged in successfully\n")
    
    # Step 2: Create personal pulse (no role)
    print("2. Creating personal pulse...")
    personal_res = requests.post(
        f"{BASE_URL}/pulse",
        headers=headers,
        json={
            "contentText": "Just watched a great movie! 🎬",
            "hashtags": ["movies", "test"]
        }
    )
    
    if personal_res.status_code == 201 or personal_res.status_code == 200:
        data = personal_res.json()
        print(f"✅ Personal pulse created: {data['id']}")
        print(f"   - Role: {data['userInfo'].get('role', 'None')}")
        print(f"   - isVerified: {data['userInfo']['isVerified']}\n")
    else:
        print(f"❌ Failed: {personal_res.status_code}")
        print(personal_res.text + "\n")
    
    # Step 3: Create critic pulse with rating (requires movie)
    print("3. Creating critic pulse with rating...")
    
    # First, get a movie ID
    movies_res = requests.get(f"{BASE_URL}/movies?page=1&limit=1")
    if movies_res.status_code != 200:
        print("❌ Failed to get movie")
        return
    
    movies = movies_res.json()
    if not movies or len(movies) == 0:
        print("❌ No movies found in database")
        return
    
    movie_id = movies[0]["id"]
    print(f"   Using movie: {movies[0]['title']} (ID: {movie_id})")
    
    critic_res = requests.post(
        f"{BASE_URL}/pulse",
        headers=headers,
        json={
            "contentText": "Oppenheimer is a masterpiece! Nolan's best work yet.",
            "linkedMovieId": movie_id,
            "postedAsRole": "critic",
            "starRating": 5,
            "hashtags": ["Oppenheimer", "ChristopherNolan"]
        }
    )
    
    if critic_res.status_code == 201 or critic_res.status_code == 200:
        data = critic_res.json()
        print(f"✅ Critic pulse created: {data['id']}")
        print(f"   - Role: {data['userInfo'].get('role')}")
        print(f"   - isVerified: {data['userInfo']['isVerified']}")
        print(f"   - Star Rating: {data['content'].get('starRating')}\n")
    elif critic_res.status_code == 403:
        print(f"⚠️  User doesn't have 'critic' role")
        print(f"   Response: {critic_res.json()['detail']}\n")
    else:
        print(f"❌ Failed: {critic_res.status_code}")
        print(critic_res.text + "\n")
    
    # Step 4: Try invalid role (should fail with 403)
    print("4. Testing invalid role (should fail)...")
    invalid_res = requests.post(
        f"{BASE_URL}/pulse",
        headers=headers,
        json={
            "contentText": "Test",
            "postedAsRole": "industry_pro"  # User probably doesn't have this
        }
    )
    
    if invalid_res.status_code == 403:
        print(f"✅ Correctly rejected: {invalid_res.json()['detail']}\n")
    else:
        print(f"⚠️  Expected 403, got {invalid_res.status_code}\n")
    
    # Step 5: Try rating without movie (should fail with 400)
    print("5. Testing star rating without movie (should fail)...")
    no_movie_res = requests.post(
        f"{BASE_URL}/pulse",
        headers=headers,
        json={
            "contentText": "Test",
            "postedAsRole": "critic",
            "starRating": 5
        }
    )
    
    if no_movie_res.status_code == 400:
        print(f"✅ Correctly rejected: {no_movie_res.json()['detail']}\n")
    else:
        print(f"⚠️  Expected 400, got {no_movie_res.status_code}\n")
    
    # Step 6: Verify feed shows roles correctly
    print("6. Fetching feed to verify roles...")
    feed_res = requests.get(f"{BASE_URL}/pulse/feed?limit=5", headers=headers)
    
    if feed_res.status_code == 200:
        posts = feed_res.json()
        print(f"✅ Feed retrieved ({len(posts)} posts)")
        for post in posts[:3]:
            role = post['userInfo'].get('role', 'None')
            verified = post['userInfo'].get('isVerified', False)
            rating = post['content'].get('starRating')
            print(f"   - Post {post['id'][:8]}... | Role: {role} | Verified: {verified} | Rating: {rating}")
    else:
        print(f"❌ Failed to get feed: {feed_res.status_code}")
    
    print("\n✅ API endpoint testing complete!")

if __name__ == "__main__":
    try:
        test_role_based_pulse_api()
    except requests.exceptions.ConnectionError:
        print("❌ Could not connect to backend. Is it running on http://localhost:8000?")
    except Exception as e:
        print(f"❌ Error: {e}")
