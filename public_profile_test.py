#!/usr/bin/env python3
"""
URGENT: Public Profile Investigation Test
Testing the specific issue reported in the review request:
- User ID: ff6827a2-2b0b-4210-8bc6-e02cc8487752
- Issue: Returns "Profile not found"
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

print(f"🚨 URGENT PUBLIC PROFILE INVESTIGATION")
print(f"Testing backend at: {API_BASE_URL}")
print("=" * 70)

class PublicProfileTester:
    def __init__(self):
        self.session = requests.Session()
        self.test_results = []
        
    def log_test(self, test_name, success, message, details=None):
        """Log test results"""
        status = "✅ PASS" if success else "❌ FAIL"
        print(f"{status}: {test_name} - {message}")
        if details:
            print(f"   Details: {json.dumps(details, indent=2) if isinstance(details, dict) else details}")
        
        self.test_results.append({
            'test': test_name,
            'success': success,
            'message': message,
            'details': details
        })
    
    def test_direct_api_endpoint(self, target_user_id):
        """Test 1: Direct API endpoint test"""
        try:
            print(f"\n🎯 TEST 1: Direct API endpoint test")
            print(f"Testing: GET /api/public-profile/{target_user_id}")
            
            response = self.session.get(f"{API_BASE_URL}/public-profile/{target_user_id}")
            
            print(f"Response Status: {response.status_code}")
            print(f"Response Headers: {dict(response.headers)}")
            
            if response.status_code == 200:
                try:
                    data = response.json()
                    print(f"✅ SUCCESS: Public profile found!")
                    print(f"Profile Data: {json.dumps(data, indent=2)}")
                    
                    # Verify required fields
                    required_fields = ['user_id', 'display_name', 'total_assessments', 'athlete_profiles']
                    missing_fields = [field for field in required_fields if field not in data]
                    
                    if not missing_fields:
                        self.log_test("Direct API Endpoint Test", True, f"Profile found with all required fields for user {target_user_id}", data)
                        return True
                    else:
                        self.log_test("Direct API Endpoint Test", False, f"Profile found but missing fields: {missing_fields}", data)
                        return False
                        
                except json.JSONDecodeError:
                    print(f"❌ Invalid JSON response: {response.text}")
                    self.log_test("Direct API Endpoint Test", False, f"Invalid JSON response for user {target_user_id}", response.text)
                    return False
                    
            elif response.status_code == 404:
                try:
                    error_data = response.json()
                    print(f"❌ 404 NOT FOUND: {error_data}")
                    self.log_test("Direct API Endpoint Test", False, f"Profile not found for user {target_user_id} - confirms the reported issue", error_data)
                except:
                    print(f"❌ 404 NOT FOUND: {response.text}")
                    self.log_test("Direct API Endpoint Test", False, f"Profile not found for user {target_user_id} - confirms the reported issue", response.text)
                
                return False
                
            else:
                print(f"❌ Unexpected status code: {response.status_code}")
                print(f"Response: {response.text}")
                self.log_test("Direct API Endpoint Test", False, f"Unexpected response {response.status_code} for user {target_user_id}", response.text)
                return False
                
        except Exception as e:
            self.log_test("Direct API Endpoint Test", False, f"Test failed with exception for user {target_user_id}", str(e))
            return False
    
    def test_check_leaderboard_user_ids(self):
        """Test 2: Check leaderboard for available user_ids"""
        try:
            print(f"\n🎯 TEST 2: Check leaderboard for available user_ids")
            response = self.session.get(f"{API_BASE_URL}/leaderboard")
            
            if response.status_code == 200:
                data = response.json()
                leaderboard = data.get('leaderboard', [])
                
                print(f"Found {len(leaderboard)} athletes on leaderboard")
                
                # Look for any user_ids that might work
                available_user_ids = []
                for entry in leaderboard:
                    user_id = entry.get('user_id')
                    display_name = entry.get('display_name', 'Unknown')
                    score = entry.get('score', 'N/A')
                    if user_id:
                        available_user_ids.append((user_id, display_name, score))
                        print(f"   Available: {user_id} ({display_name}, Score: {score})")
                
                if available_user_ids:
                    print(f"\n✅ Found {len(available_user_ids)} user_ids on leaderboard")
                    self.log_test("Check Leaderboard User IDs", True, f"Found {len(available_user_ids)} available user_ids on leaderboard", {
                        'available_user_ids': available_user_ids[:5],
                        'total_available': len(available_user_ids)
                    })
                    return available_user_ids
                else:
                    print(f"❌ No user_ids found on leaderboard")
                    self.log_test("Check Leaderboard User IDs", False, f"No user_ids found on leaderboard - system may be empty", data)
                    return []
                    
            else:
                print(f"❌ Leaderboard API failed: {response.status_code}")
                self.log_test("Check Leaderboard User IDs", False, f"Leaderboard API failed with {response.status_code}", response.text)
                return []
                
        except Exception as e:
            self.log_test("Check Leaderboard User IDs", False, f"Test failed with exception", str(e))
            return []
    
    def test_public_profile_with_working_user_id(self, available_user_ids):
        """Test 3: Test public profile with working user_id"""
        try:
            if not available_user_ids:
                print(f"\n🎯 TEST 3: SKIPPED - No available user_ids to test")
                self.log_test("Test Working User ID", False, "No available user_ids to test", None)
                return False
            
            # Test with the first available user_id
            test_user_id, test_display_name, test_score = available_user_ids[0]
            print(f"\n🎯 TEST 3: Test public profile with working user_id")
            print(f"Testing: GET /api/public-profile/{test_user_id} ({test_display_name})")
            
            test_response = self.session.get(f"{API_BASE_URL}/public-profile/{test_user_id}")
            
            if test_response.status_code == 200:
                test_data = test_response.json()
                print(f"✅ SUCCESS: Public profile works with user_id {test_user_id}")
                print(f"Profile: {json.dumps(test_data, indent=2)}")
                
                self.log_test("Test Working User ID", True, f"Public profile endpoint works with user_id {test_user_id} ({test_display_name})", test_data)
                return True
                
            else:
                print(f"❌ Even working user_id fails: {test_response.status_code}")
                print(f"Response: {test_response.text}")
                self.log_test("Test Working User ID", False, f"Public profile endpoint broken - even working user_id {test_user_id} returns {test_response.status_code}", test_response.text)
                return False
                
        except Exception as e:
            self.log_test("Test Working User ID", False, f"Test failed with exception", str(e))
            return False
    
    def test_athlete_profile_endpoint(self, available_user_ids):
        """Test 4: Test athlete profile endpoint accessibility"""
        try:
            print(f"\n🎯 TEST 4: Test athlete profile endpoint accessibility")
            
            # First get some profile IDs from leaderboard
            response = self.session.get(f"{API_BASE_URL}/leaderboard")
            
            if response.status_code == 200:
                data = response.json()
                leaderboard = data.get('leaderboard', [])
                
                if leaderboard:
                    # Test with first available profile
                    first_entry = leaderboard[0]
                    profile_id = first_entry.get('profile_id')
                    display_name = first_entry.get('display_name', 'Unknown')
                    
                    if profile_id:
                        print(f"Testing athlete profile endpoint with: {profile_id} ({display_name})")
                        
                        profile_response = self.session.get(f"{API_BASE_URL}/athlete-profile/{profile_id}")
                        
                        if profile_response.status_code == 200:
                            profile_data = profile_response.json()
                            print(f"✅ SUCCESS: Athlete profile endpoint works")
                            print(f"Profile: {json.dumps(profile_data, indent=2)}")
                            
                            self.log_test("Athlete Profile Endpoint Test", True, f"Athlete profile endpoint accessible with profile_id {profile_id}", profile_data)
                            return True
                            
                        else:
                            print(f"❌ Athlete profile endpoint failed: {profile_response.status_code}")
                            print(f"Response: {profile_response.text}")
                            self.log_test("Athlete Profile Endpoint Test", False, f"Athlete profile endpoint failed with {profile_response.status_code} for profile_id {profile_id}", profile_response.text)
                            return False
                    else:
                        print(f"❌ No profile_id found in leaderboard entry")
                        self.log_test("Athlete Profile Endpoint Test", False, "No profile_id found in leaderboard entries", first_entry)
                        return False
                else:
                    print(f"❌ Empty leaderboard")
                    self.log_test("Athlete Profile Endpoint Test", False, "Cannot test - leaderboard is empty", data)
                    return False
            else:
                print(f"❌ Cannot get leaderboard: {response.status_code}")
                self.log_test("Athlete Profile Endpoint Test", False, f"Cannot test - leaderboard API failed with {response.status_code}", response.text)
                return False
                
        except Exception as e:
            self.log_test("Athlete Profile Endpoint Test", False, "Test failed with exception", str(e))
            return False
    
    def run_investigation(self):
        """Run the complete public profile investigation"""
        target_user_id = "ff6827a2-2b0b-4210-8bc6-e02cc8487752"
        
        print("Testing the specific issue reported:")
        print(f"- User ID: {target_user_id}")
        print("- URL: https://cb5889f7-0baa-4f21-b0c5-d9b5a5d1e3eb.preview.emergentagent.com/athlete/ff6827a2-2b0b-4210-8bc6-e02cc8487752")
        print("- Issue: Returns 'Profile not found'")
        print("=" * 70)
        
        # Test 1: Direct API endpoint test
        direct_test_result = self.test_direct_api_endpoint(target_user_id)
        
        # Test 2: Check leaderboard for available user_ids
        available_user_ids = self.test_check_leaderboard_user_ids()
        
        # Test 3: Test public profile with working user_id
        working_test_result = self.test_public_profile_with_working_user_id(available_user_ids)
        
        # Test 4: Test athlete profile endpoint
        athlete_test_result = self.test_athlete_profile_endpoint(available_user_ids)
        
        # Summary
        print("\n" + "="*80)
        print("🎯 PUBLIC PROFILE INVESTIGATION SUMMARY")
        print("="*80)
        
        passed = 0
        total = len(self.test_results)
        
        for result in self.test_results:
            status = "✅ PASS" if result['success'] else "❌ FAIL"
            print(f"{status}: {result['test']} - {result['message']}")
            if result['success']:
                passed += 1
        
        print(f"\nOVERALL RESULTS: {passed}/{total} tests passed ({(passed/total)*100:.1f}%)")
        
        # Conclusions
        print("\n🔍 INVESTIGATION CONCLUSIONS:")
        print("-" * 40)
        
        if direct_test_result:
            print("✅ ISSUE RESOLVED: The target user ID now works correctly")
        else:
            if working_test_result:
                print("❌ ISSUE CONFIRMED: The specific user ID ff6827a2-2b0b-4210-8bc6-e02cc8487752 does not exist in the system")
                print("✅ ENDPOINT WORKING: The public profile endpoint works with valid user IDs")
                if available_user_ids:
                    print(f"💡 SOLUTION: Use one of these working user IDs: {[uid for uid, _, _ in available_user_ids[:3]]}")
            else:
                print("❌ CRITICAL ISSUE: The public profile endpoint is completely broken")
        
        if athlete_test_result:
            print("✅ ATHLETE PROFILES: Individual athlete profile endpoints are working")
        else:
            print("❌ ATHLETE PROFILES: Individual athlete profile endpoints are also broken")
        
        print("="*80)
        
        return passed >= total * 0.5

if __name__ == "__main__":
    tester = PublicProfileTester()
    tester.run_investigation()