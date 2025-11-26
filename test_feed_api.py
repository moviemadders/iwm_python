import requests

API_URL = "http://localhost:8000"

# Login
login_response = requests.post(
    f"{API_URL}/api/v1/auth/login",
    json={"email": "user1@iwm.com", "password": "rmrnn0077"}
)

if login_response.status_code != 200:
    print(f"❌ Login failed: {login_response.status_code}")
    exit(1)

token = login_response.json()["access_token"]
print("✅ Logged in successfully")

# Get feed
headers = {"Authorization": f"Bearer {token}"}
feed_response = requests.get(
    f"{API_URL}/api/v1/pulse/feed?filter=latest&page=1&limit=20",
    headers=headers
)

print(f"\n📥 Feed response status: {feed_response.status_code}")

if feed_response.status_code == 200:
    data = feed_response.json()
    print(f"✅ Feed fetched successfully!")
    print(f"   Type: {type(data)}")
    
    if isinstance(data, list):
        print(f"   Count: {len(data)} pulses")
        if len(data) > 0:
            print(f"\n   First pulse:")
            print(f"     - ID: {data[0].get('id')}")
            print(f"     - User: {data[0].get('userInfo', {}).get('displayName')}")
            print(f"     - Role: {data[0].get('userInfo', {}).get('role')}")
            print(f"     - Text: {data[0].get('content', {}).get('text')[:50]}...")
            print(f"     - Rating: {data[0].get('content', {}).get('starRating')}")
    else:
        print(f"   Data structure: {data}")
else:
    print(f"❌ Failed: {feed_response.status_code}")
    print(feed_response.text)
