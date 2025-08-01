#!/usr/bin/env python3
"""
Debug script to identify which fields in UserProfileUpdate are causing 500 errors
"""

import requests
import json
import os
from dotenv import load_dotenv
from pathlib import Path

# Load environment variables
ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / 'frontend' / '.env')

# Get backend URL from frontend env
BACKEND_URL = os.environ.get('REACT_APP_BACKEND_URL', 'http://localhost:8001')
API_BASE_URL = f"{BACKEND_URL}/api"

print(f"Testing backend at: {API_BASE_URL}")

# Test each field individually to identify problematic ones
test_fields = [
    {"name": "Test Name"},
    {"display_name": "Test Display"},
    {"location": "Test Location"},
    {"website": "https://example.com"},
    {"date_of_birth": "1990-01-01"},
    {"gender": "Male"},
    {"country": "US"},  # This is likely the problematic field
    {"timezone": "America/New_York"},
    {"units_preference": "imperial"},
    {"privacy_level": "private"}
]

print("\n🔍 TESTING INDIVIDUAL FIELDS FOR 500 ERRORS:")
print("=" * 60)

for i, field_data in enumerate(test_fields):
    field_name = list(field_data.keys())[0]
    field_value = field_data[field_name]
    
    try:
        response = requests.put(
            f"{API_BASE_URL}/user-profile/me",
            json=field_data,
            headers={"Content-Type": "application/json"},
            timeout=10
        )
        
        print(f"Field '{field_name}': HTTP {response.status_code}")
        
        if response.status_code == 500:
            try:
                error_data = response.json()
                print(f"  ❌ 500 ERROR: {error_data.get('detail', 'Unknown error')}")
                if 'column' in str(error_data).lower():
                    print(f"  🚨 DATABASE COLUMN ISSUE DETECTED")
            except:
                print(f"  ❌ 500 ERROR: {response.text}")
        elif response.status_code in [401, 403]:
            print(f"  ✅ Expected auth error (field is valid)")
        elif response.status_code == 422:
            try:
                error_data = response.json()
                print(f"  ⚠️  Validation error: {error_data}")
            except:
                print(f"  ⚠️  Validation error: {response.text}")
        else:
            print(f"  ❓ Unexpected response: {response.text}")
            
    except Exception as e:
        print(f"Field '{field_name}': ❌ Request failed - {e}")

print("\n🔍 TESTING COMBINATIONS:")
print("=" * 60)

# Test combinations to see which specific fields cause issues
combinations = [
    {"name": "Test", "display_name": "Test Display"},
    {"location": "NYC", "website": "https://example.com"},
    {"date_of_birth": "1990-01-01", "gender": "Male"},
    {"country": "US", "timezone": "America/New_York"},  # Likely problematic
    {"units_preference": "imperial", "privacy_level": "private"},
    # Test the full auto-save payload
    {
        "name": "Debug Auto-Save Test",
        "display_name": "Updated Display Name", 
        "location": "New York, NY",
        "website": "",
        "gender": "",
        "date_of_birth": "",
        "country": "",
        "units_preference": "imperial",
        "privacy_level": "private"
    }
]

for i, combo_data in enumerate(combinations):
    field_names = list(combo_data.keys())
    
    try:
        response = requests.put(
            f"{API_BASE_URL}/user-profile/me",
            json=combo_data,
            headers={"Content-Type": "application/json"},
            timeout=10
        )
        
        print(f"Combo {i+1} {field_names}: HTTP {response.status_code}")
        
        if response.status_code == 500:
            try:
                error_data = response.json()
                print(f"  ❌ 500 ERROR: {error_data.get('detail', 'Unknown error')}")
                if 'column' in str(error_data).lower():
                    print(f"  🚨 DATABASE COLUMN ISSUE: {error_data}")
            except:
                print(f"  ❌ 500 ERROR: {response.text}")
        elif response.status_code in [401, 403]:
            print(f"  ✅ Expected auth error (fields are valid)")
        elif response.status_code == 422:
            try:
                error_data = response.json()
                print(f"  ⚠️  Validation error: {error_data}")
            except:
                print(f"  ⚠️  Validation error: {response.text}")
                
    except Exception as e:
        print(f"Combo {i+1}: ❌ Request failed - {e}")

print("\n📋 SUMMARY:")
print("=" * 60)
print("This script helps identify which fields in the UserProfileUpdate model")
print("are causing 500 errors due to missing database columns.")
print("Fields that return 401/403 are valid (authentication required).")
print("Fields that return 500 have database schema issues.")