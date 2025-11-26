import requests
import json

API_URL = "http://localhost:8000"

# Login first
login_response = requests.post(
    f"{API_URL}/api/v1/auth/login",
    json={"email": "user1@iwm.com", "password": "rmrnn0077"}
)

if login_response.status_code != 200:
    print(f"❌ Login failed: {login_response.status_code}")
    print(login_response.text)
    exit(1)

token = login_response.json()["access_token"]
print("✅ Logged in successfully")

# Create a pulse with role and rating
headers = {
    "Authorization": f"Bearer {token}",
    "Content-Type": "application/json"
}

pulse_data = {
    "contentText": "Direct API test: This is a 5-star critic review of Inception!",
    "linkedMovieId": "movie1",  # Using a mock movie ID
    "hashtags": ["#Inception", "#5Stars"],
    "postedAsRole": "critic",
    "starRating": 5
}

print("\n📤 Sending pulse with data:")
print(json.dumps(pulse_data, indent=2))

create_response = requests.post(
    f"{API_URL}/api/v1/pulse",
    headers=headers,
    json=pulse_data
)

print(f"\n📥 Response status: {create_response.status_code}")

if create_response.status_code == 200:
    result = create_response.json()
    print("✅ Pulse created successfully!")
    print(json.dumps(result, indent=2))
    
    # Check if role and rating are in the response
    user_info = result.get("userInfo", {})
    content = result.get("content", {})
    
    print(f"\n🔍 Verification:")
    print(f"  - User Role: {user_info.get('role')}")
    print(f"  - Is Verified: {user_info.get('isVerified')}")
    print(f"  - Star Rating: {content.get('starRating')}")
    
    if user_info.get('role') == 'critic' and content.get('starRating') == 5:
        print("\n🎉 SUCCESS: Role and rating are correctly set!")
    else:
        print("\n⚠️ WARNING: Role or rating not set correctly")
else:
    print(f"❌ Failed to create pulse: {create_response.status_code}")
    print(create_response.text)
