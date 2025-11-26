"""
Test script to verify pulse creation API
"""
import requests
import json

# Backend URL
API_BASE = "http://localhost:8000/api/v1"

# Test data
pulse_data = {
    "contentText": "Testing pulse creation from API! 🚀",
    "hashtags": ["test", "api"]
}

# You'll need a valid access token
# For testing, get it from the frontend after login
token = input("Enter your access token (from browser localStorage): ")

headers = {
    "Content-Type": "application/json",
    "Authorization": f"Bearer {token}"
}

print("\n📝 Creating pulse...")
print(f"Data: {json.dumps(pulse_data, indent=2)}\n")

try:
    response = requests.post(
        f"{API_BASE}/pulse",
        headers=headers,
        json=pulse_data
    )
    
    print(f"Status Code: {response.status_code}")
    print(f"Response: {json.dumps(response.json(), indent=2)}")
    
    if response.status_code == 201:
        print("\n✅ Pulse created successfully!")
    else:
        print(f"\n❌ Failed to create pulse")
        
except Exception as e:
    print(f"\n❌ Error: {e}")
