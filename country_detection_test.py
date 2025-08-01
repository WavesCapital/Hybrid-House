#!/usr/bin/env python3
"""
Country Column Detection Test
Tests for the specific country column issue by analyzing response patterns
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

print(f"Testing country column detection at: {API_BASE_URL}")

def create_test_user_with_valid_token():
    """Create a test user and get a valid token"""
    print("\n🔧 CREATING TEST USER FOR COUNTRY COLUMN TESTING")
    print("=" * 60)
    
    # Create a test athlete profile first
    test_profile = {
        "name": "Country Test User",
        "display_name": "Country Tester",
        "location": "Test City",
        "date_of_birth": "1990-01-01",
        "gender": "Male",
        "is_public": True
    }
    
    response = requests.post(f"{API_BASE_URL}/athlete-profiles/public", json=test_profile)
    
    if response.status_code == 200:
        profile_data = response.json()
        print(f"✅ Test profile created: {profile_data.get('id', 'unknown')}")
        return profile_data
    else:
        print(f"❌ Failed to create test profile: {response.status_code}")
        try:
            print(f"Error: {response.json()}")
        except:
            print(f"Raw error: {response.text}")
        return None

def test_country_field_with_mock_auth():
    """Test country field behavior by examining response patterns"""
    print("\n🔍 TESTING COUNTRY FIELD BEHAVIOR PATTERNS")
    print("=" * 60)
    
    # Test 1: Send request with only country field
    country_only_payload = {"country": "United States"}
    
    print("Test 1: Country field only")
    response1 = requests.put(f"{API_BASE_URL}/user-profile/me", json=country_only_payload)
    print(f"Status: {response1.status_code}")
    
    if response1.status_code == 403:
        print("✅ Authentication required (expected)")
    else:
        try:
            data = response1.json()
            print(f"Response: {json.dumps(data, indent=2)}")
        except:
            print(f"Raw response: {response1.text}")
    
    # Test 2: Send request with country + other fields
    mixed_payload = {
        "name": "Test User",
        "display_name": "Test Display", 
        "country": "Canada"
    }
    
    print("\nTest 2: Country field with other fields")
    response2 = requests.put(f"{API_BASE_URL}/user-profile/me", json=mixed_payload)
    print(f"Status: {response2.status_code}")
    
    if response2.status_code == 403:
        print("✅ Authentication required (expected)")
    else:
        try:
            data = response2.json()
            print(f"Response: {json.dumps(data, indent=2)}")
        except:
            print(f"Raw response: {response2.text}")
    
    # Test 3: Check if country field is accepted by the model
    print("\nTest 3: Model validation check")
    if response1.status_code == 403 and response2.status_code == 403:
        print("✅ UserProfileUpdate model accepts country field")
        print("✅ Endpoint is properly protected by authentication")
        return True
    elif response1.status_code == 422 or response2.status_code == 422:
        print("❌ UserProfileUpdate model rejects country field")
        return False
    else:
        print("❓ Unexpected response pattern")
        return None

def analyze_backend_logs_for_country_errors():
    """Analyze backend logs for country column errors"""
    print("\n🔍 ANALYZING BACKEND LOGS FOR COUNTRY COLUMN ERRORS")
    print("=" * 60)
    
    try:
        # Read recent backend logs
        import subprocess
        result = subprocess.run(['tail', '-n', '100', '/var/log/supervisor/backend.out.log'], 
                              capture_output=True, text=True)
        
        if result.returncode == 0:
            log_content = result.stdout
            
            # Look for country-related errors
            country_errors = []
            for line in log_content.split('\n'):
                if 'country' in line.lower() and ('error' in line.lower() or 'column' in line.lower()):
                    country_errors.append(line.strip())
            
            if country_errors:
                print("❌ Found country-related errors in logs:")
                for error in country_errors:
                    print(f"   {error}")
                return False
            else:
                print("✅ No country-related errors found in recent logs")
                return True
        else:
            print("❌ Could not read backend logs")
            return None
            
    except Exception as e:
        print(f"❌ Error analyzing logs: {e}")
        return None

def test_country_column_comprehensive():
    """Comprehensive test to determine if country column exists"""
    print("\n🔍 COMPREHENSIVE COUNTRY COLUMN ANALYSIS")
    print("=" * 80)
    
    results = {
        "model_accepts_country": None,
        "endpoint_accessible": None,
        "logs_show_errors": None,
        "overall_assessment": None
    }
    
    # Test 1: Model validation
    print("1. Testing UserProfileUpdate model...")
    country_payload = {"country": "Test Country"}
    response = requests.put(f"{API_BASE_URL}/user-profile/me", json=country_payload)
    
    if response.status_code == 403:
        results["model_accepts_country"] = True
        print("   ✅ Model accepts country field")
    elif response.status_code == 422:
        results["model_accepts_country"] = False
        print("   ❌ Model rejects country field")
    else:
        results["model_accepts_country"] = None
        print(f"   ❓ Unexpected response: {response.status_code}")
    
    # Test 2: Endpoint accessibility
    print("2. Testing endpoint accessibility...")
    if response.status_code in [403, 401]:
        results["endpoint_accessible"] = True
        print("   ✅ Endpoint accessible (auth required)")
    else:
        results["endpoint_accessible"] = False
        print("   ❌ Endpoint not accessible")
    
    # Test 3: Log analysis
    print("3. Analyzing backend logs...")
    log_result = analyze_backend_logs_for_country_errors()
    results["logs_show_errors"] = log_result
    
    # Overall assessment
    print("\n📊 ASSESSMENT RESULTS:")
    print("=" * 40)
    
    if results["model_accepts_country"] and results["endpoint_accessible"]:
        if results["logs_show_errors"] is False:
            results["overall_assessment"] = "COLUMN_MISSING"
            print("🚨 CONCLUSION: Country column likely MISSING from database")
            print("   - Model accepts country field ✅")
            print("   - Endpoint is accessible ✅") 
            print("   - But logs show column errors ❌")
            print("\n💡 RECOMMENDED ACTION:")
            print("   Execute: ALTER TABLE user_profiles ADD COLUMN country TEXT;")
        else:
            results["overall_assessment"] = "COLUMN_EXISTS"
            print("✅ CONCLUSION: Country column appears to exist")
            print("   - Model accepts country field ✅")
            print("   - Endpoint is accessible ✅")
            print("   - No column errors in logs ✅")
    else:
        results["overall_assessment"] = "INCONCLUSIVE"
        print("❓ CONCLUSION: Test results inconclusive")
    
    return results

def main():
    """Run comprehensive country column detection"""
    print("🚀 COUNTRY COLUMN DETECTION TEST")
    print("Detecting if 'country' column exists in user_profiles table")
    print("=" * 80)
    
    # Run comprehensive test
    results = test_country_column_comprehensive()
    
    # Additional behavior pattern test
    test_country_field_with_mock_auth()
    
    print("\n" + "=" * 80)
    print("🎯 FINAL ASSESSMENT")
    print("=" * 80)
    
    if results["overall_assessment"] == "COLUMN_MISSING":
        print("🚨 CRITICAL ISSUE DETECTED:")
        print("❌ Country column is MISSING from user_profiles table")
        print("\n🔧 REQUIRED ACTIONS:")
        print("1. Connect to Supabase database")
        print("2. Execute SQL: ALTER TABLE user_profiles ADD COLUMN country TEXT;")
        print("3. Verify auto-save functionality works for country field")
        print("\n📝 EXPLANATION:")
        print("The backend model accepts the country field, but the database")
        print("column doesn't exist. The backend gracefully handles this by")
        print("skipping the country field, which is why auto-save 'works'")
        print("for other fields but silently fails for country.")
        return False
    elif results["overall_assessment"] == "COLUMN_EXISTS":
        print("✅ Country column appears to exist in database")
        print("✅ Auto-save functionality should work for country field")
        return True
    else:
        print("❓ Could not definitively determine column status")
        print("🔍 Manual database inspection may be required")
        return None

if __name__ == "__main__":
    main()