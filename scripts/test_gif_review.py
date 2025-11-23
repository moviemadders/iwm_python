"""
Automated Test Script for GIF Review Feature
Tests the complete flow: login, create review with GIF, verify submission
"""

import requests
import json
import sys

# Configuration
BASE_URL = "http://localhost:8000"
FRONTEND_URL = "http://localhost:3000"
MOVIE_ID = "9476599f-c2e2-4067-ab2a-c07abefac440"  # The Dark Knight

# Test credentials
EMAIL = "user1@iwm.com"
PASSWORD = "rmrnn0077"
# Known user external_id from database (you can update this if needed)
USER_EXTERNAL_ID = "550e8400-e29b-41d4-a716-446655440001"  # Placeholder - will be fetched

# Sample GIF URL from Tenor
SAMPLE_GIF_URL = "https://media.tenor.com/fSHRE0v2besAAAAM/mind-blown-amazed.gif"

def print_step(step_num, description):
    """Print test step"""
    print(f"\n{'='*60}")
    print(f"Step {step_num}: {description}")
    print('='*60)

def get_user_external_id():
    """Get user external_id from database"""
    import subprocess
    cmd = [
        "psql",
        "-d", "iwm_db",
        "-U", "postgres",
        "-t", "-c",
        f"SELECT external_id FROM users WHERE email = '{EMAIL}';"
    ]
    try:
        result = subprocess.run(cmd, capture_output=True, text=True)
        external_id = result.stdout.strip()
        if external_id:
            return external_id
    except:
        pass
    return None

def test_login():
    """Test user login"""
    print_step(1, "Testing Login")
    
    url = f"{BASE_URL}/api/v1/auth/login"
    payload = {
        "email": EMAIL,
        "password": PASSWORD
    }
    
    response = requests.post(url, json=payload)
    
    if response.status_code == 200:
        data = response.json()
        token = data.get("access_token")
        print(f"✅ Login successful!")
        print(f"   Token: {token[:20]}...")
        
        # Get user info from /me endpoint
        me_url = f"{BASE_URL}/api/v1/users/me"
        headers = {"Authorization": f"Bearer {token}"}
        me_response = requests.get(me_url, headers=headers)
        
        if me_response.status_code == 200:
            user = me_response.json()
            user_id = user.get("id")
            print(f"   User: {user.get('name')} ({user.get('email')})")
            print(f"   User ID: {user_id}")
            return token, user_id
        else:
            print(f"   ⚠️  Could not get user info, using email as ID")
            return token, EMAIL
    else:
        print(f"❌ Login failed: {response.status_code}")
        print(f"   Response: {response.text}")
        return None, None

def test_create_review_with_gif(token, user_id):
    """Test creating a review with GIF"""
    print_step(2, "Creating Review with GIF")
    
    url = f"{BASE_URL}/api/v1/reviews"
    headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json"
    }
    
    payload = {
        "movieId": MOVIE_ID,
        "userId": user_id,
        "rating": 9.0,
        "title": "Mind-Blowing Masterpiece!",
        "content": "An absolute masterpiece! Christopher Nolan's direction is phenomenal, and the performances are outstanding. Heath Ledger's Joker is unforgettable - his portrayal is both terrifying and mesmerizing. This film redefined superhero movies forever and set a new standard for the genre.",
        "spoilers": False,
        "gifUrl": SAMPLE_GIF_URL
    }
    
    print(f"Submitting review with GIF: {SAMPLE_GIF_URL}")
    
    response = requests.post(url, headers=headers, json=payload)
    
    if response.status_code in [200, 201]:
        data = response.json()
        review_id = data.get("id")
        print(f"✅ Review created successfully!")
        print(f"   Review ID: {review_id}")
        print(f"   Rating: {data.get('rating')}/10")
        print(f"   Title: {data.get('title')}")
        print(f"   GIF URL: {SAMPLE_GIF_URL}")
        return review_id
    else:
        print(f"❌ Review creation failed: {response.status_code}")
        print(f"   Response: {response.text}")
        return None

def test_get_review(review_id):
    """Test retrieving the created review"""
    print_step(3, "Retrieving Review to Verify GIF")
    
    url = f"{BASE_URL}/api/v1/reviews/{review_id}"
    
    response = requests.get(url)
    
    if response.status_code == 200:
        data = response.json()
        gif_url = data.get("gifUrl")
        
        print(f"✅ Review retrieved successfully!")
        print(f"   Review ID: {data.get('id')}")
        print(f"   Rating: {data.get('rating')}/10")
        print(f"   Content: {data.get('content')[:100]}...")
        
        if gif_url:
            print(f"   ✅ GIF URL present: {gif_url}")
            return True
        else:
            print(f"   ❌ GIF URL missing!")
            return False
    else:
        print(f"❌ Failed to retrieve review: {response.status_code}")
        print(f"   Response: {response.text}")
        return False

def test_tenor_api():
    """Test Tenor API connectivity"""
    print_step(4, "Testing Tenor API")
    
    api_key = "AIzaSyCj0Ts518NF6uvEaIiAE9fBx12lXvAQUZ0"
    url = f"https://tenor.googleapis.com/v2/search"
    params = {
        "key": api_key,
        "q": "mind blown",
        "client_key": "movie_madders_reviews",
        "limit": 5
    }
    
    try:
        response = requests.get(url, params=params)
        
        if response.status_code == 200:
            data = response.json()
            results = data.get("results", [])
            print(f"✅ Tenor API working!")
            print(f"   Found {len(results)} GIFs for 'mind blown'")
            
            if results:
                first_gif = results[0]
                gif_url = first_gif.get("media_formats", {}).get("gif", {}).get("url")
                print(f"   Sample GIF: {gif_url}")
            
            return True
        else:
            print(f"❌ Tenor API failed: {response.status_code}")
            print(f"   Response: {response.text}")
            return False
    except Exception as e:
        print(f"❌ Tenor API error: {str(e)}")
        return False

def main():
    """Run all tests"""
    print("\n" + "="*60)
    print("🎬 GIF REVIEW FEATURE - AUTOMATED TEST")
    print("="*60)
    
    # Get user external_id from database
    user_external_id = get_user_external_id()
    if not user_external_id:
        print("\n⚠️  Could not get user external_id from database")
        print(f"   Using hardcoded ID: {USER_EXTERNAL_ID}")
        user_external_id = USER_EXTERNAL_ID
    else:
        print(f"\n✅ Found user external_id: {user_external_id}")
    
    # Test 1: Login
    token, user_id = test_login()
    if not token:
        print("\n❌ Test failed at login step")
        sys.exit(1)
    
    # Use external_id if we have it, otherwise use what login returned
    if user_external_id:
        user_id = user_external_id
    
    # Test 2: Create review with GIF
    review_id = test_create_review_with_gif(token, user_id)
    if not review_id:
        print("\n❌ Test failed at review creation step")
        sys.exit(1)
    
    # Test 3: Verify review has GIF
    has_gif = test_get_review(review_id)
    if not has_gif:
        print("\n❌ Test failed: GIF not found in review")
        sys.exit(1)
    
    # Test 4: Verify Tenor API
    tenor_works = test_tenor_api()
    
    # Summary
    print("\n" + "="*60)
    print("📊 TEST SUMMARY")
    print("="*60)
    print(f"✅ Login: PASSED")
    print(f"✅ Create Review with GIF: PASSED")
    print(f"✅ Verify GIF in Review: PASSED")
    print(f"{'✅' if tenor_works else '❌'} Tenor API: {'PASSED' if tenor_works else 'FAILED'}")
    print("\n🎉 All critical tests PASSED!")
    print(f"\n📝 View your review at:")
    print(f"   {FRONTEND_URL}/movies/{MOVIE_ID}/reviews")
    print("="*60 + "\n")

if __name__ == "__main__":
    main()
