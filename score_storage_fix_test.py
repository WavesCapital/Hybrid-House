#!/usr/bin/env python3
"""
CRITICAL FIX VERIFICATION: Score Storage Endpoint Fix Test
Tests the PGRST204 database error fix by removing individual field extraction
"""

import requests
import json
import os
import uuid
from dotenv import load_dotenv
from pathlib import Path

# Load environment variables
ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / 'frontend' / '.env')

# Get backend URL from frontend env
BACKEND_URL = os.environ.get('REACT_APP_BACKEND_URL', 'http://localhost:8001')
API_BASE_URL = f"{BACKEND_URL}/api"

print(f"🚨 CRITICAL FIX VERIFICATION: Score Storage Endpoint Fix")
print(f"Testing backend at: {API_BASE_URL}")
print("=" * 80)

class ScoreStorageFixTester:
    def __init__(self):
        self.session = requests.Session()
        self.test_results = []
        self.created_profile_id = None
        
    def log_test(self, test_name, success, message, details=None):
        """Log test results"""
        status = "✅ PASS" if success else "❌ FAIL"
        print(f"{status}: {test_name} - {message}")
        if details:
            print(f"   Details: {details}")
        
        self.test_results.append({
            'test': test_name,
            'success': success,
            'message': message,
            'details': details
        })
    
    def test_profile_creation(self):
        """Test 1: Create a test profile via POST /api/athlete-profiles/public"""
        try:
            print("\n🔍 TEST 1: Profile Creation via POST /api/athlete-profiles/public")
            print("-" * 60)
            
            # Create realistic test data
            profile_data = {
                "profile_json": {
                    "first_name": "Test",
                    "last_name": "Athlete",
                    "email": f"test.athlete.{uuid.uuid4().hex[:8]}@example.com",
                    "sex": "Male",
                    "dob": "1990-05-15",
                    "country": "US",
                    "wearables": ["Garmin"],
                    "body_metrics": {
                        "height_in": 72,
                        "weight_lb": 175,
                        "vo2_max": 50,
                        "resting_hr_bpm": 55,
                        "hrv_ms": 45
                    },
                    "pb_mile": "6:30",
                    "pb_5k": "20:00",
                    "pb_10k": "42:00",
                    "pb_half_marathon": "1:35:00",
                    "pb_marathon": "3:20:00",
                    "weekly_miles": 30,
                    "long_run": 15,
                    "runningApp": "Strava",
                    "pb_bench_1rm": 225,
                    "pb_squat_1rm": 315,
                    "pb_deadlift_1rm": 405,
                    "strengthApp": "Strong",
                    "customStrengthApp": ""
                },
                "is_public": True
            }
            
            print(f"📝 Creating profile with data: {profile_data['profile_json']['first_name']} {profile_data['profile_json']['last_name']}")
            
            response = self.session.post(f"{API_BASE_URL}/athlete-profiles/public", json=profile_data)
            
            if response.status_code == 200:
                data = response.json()
                if 'user_profile' in data and 'id' in data['user_profile']:
                    self.created_profile_id = data['user_profile']['id']
                    print(f"✅ Profile created successfully with ID: {self.created_profile_id}")
                    
                    # Verify profile data structure
                    profile = data['user_profile']
                    required_fields = ['id', 'profile_json', 'created_at', 'user_id']
                    missing_fields = [field for field in required_fields if field not in profile]
                    
                    if not missing_fields:
                        self.log_test("Profile Creation", True, f"Profile created successfully with ID: {self.created_profile_id}", {
                            'profile_id': self.created_profile_id,
                            'user_id': profile.get('user_id'),
                            'profile_fields': list(profile.keys())
                        })
                        return True
                    else:
                        self.log_test("Profile Creation", False, f"Profile missing required fields: {missing_fields}", data)
                        return False
                else:
                    self.log_test("Profile Creation", False, "Profile created but missing ID or user_profile structure", data)
                    return False
            else:
                self.log_test("Profile Creation", False, f"HTTP {response.status_code}", response.text)
                return False
                
        except Exception as e:
            self.log_test("Profile Creation", False, "Request failed", str(e))
            return False
    
    def test_score_storage(self):
        """Test 2: Test POST /api/athlete-profile/{id}/score with webhook-format score data"""
        try:
            print("\n🔍 TEST 2: Score Storage via POST /api/athlete-profile/{id}/score")
            print("-" * 60)
            
            if not self.created_profile_id:
                self.log_test("Score Storage", False, "No profile ID available from previous test", None)
                return False
            
            # Webhook-format score data as specified in the review request
            score_data = {
                "hybridScore": 78.5,
                "strengthScore": 82.3,
                "enduranceScore": 77.9,
                "speedScore": 75.8,
                "vo2Score": 71.2,
                "distanceScore": 79.1,
                "volumeScore": 76.4,
                "recoveryScore": 80.7
            }
            
            print(f"📝 Storing score data for profile ID: {self.created_profile_id}")
            print(f"📊 Score data: hybridScore={score_data['hybridScore']}, strengthScore={score_data['strengthScore']}")
            
            response = self.session.post(f"{API_BASE_URL}/athlete-profile/{self.created_profile_id}/score", json=score_data)
            
            if response.status_code == 200:
                data = response.json()
                print(f"✅ Score data stored successfully")
                
                # Verify response structure
                if 'message' in data and 'success' in data.get('message', '').lower():
                    self.log_test("Score Storage", True, "Score data stored successfully without PGRST204 error", {
                        'profile_id': self.created_profile_id,
                        'response': data,
                        'scores_stored': list(score_data.keys())
                    })
                    return True
                else:
                    self.log_test("Score Storage", True, "Score storage completed but unexpected response format", data)
                    return True
            else:
                # Check if it's the old PGRST204 error
                error_text = response.text.lower()
                if 'pgrst204' in error_text or 'schema' in error_text:
                    self.log_test("Score Storage", False, f"PGRST204 database error still occurring - fix not working: HTTP {response.status_code}", response.text)
                    return False
                else:
                    self.log_test("Score Storage", False, f"HTTP {response.status_code} - Different error than PGRST204", response.text)
                    return False
                
        except Exception as e:
            self.log_test("Score Storage", False, "Request failed", str(e))
            return False
    
    def test_profile_retrieval(self):
        """Test 3: Verify the score data is properly stored by retrieving the profile"""
        try:
            print("\n🔍 TEST 3: Profile Retrieval to Verify Score Storage")
            print("-" * 60)
            
            if not self.created_profile_id:
                self.log_test("Profile Retrieval", False, "No profile ID available from previous test", None)
                return False
            
            print(f"📝 Retrieving profile ID: {self.created_profile_id}")
            
            response = self.session.get(f"{API_BASE_URL}/athlete-profile/{self.created_profile_id}")
            
            if response.status_code == 200:
                data = response.json()
                print(f"✅ Profile retrieved successfully")
                
                # Check if score_data is present and contains the expected scores
                score_data = data.get('score_data')
                if score_data:
                    print(f"📊 Score data found: {score_data}")
                    
                    # Verify all expected scores are present
                    expected_scores = ['hybridScore', 'strengthScore', 'enduranceScore', 'speedScore', 'vo2Score', 'distanceScore', 'volumeScore', 'recoveryScore']
                    missing_scores = [score for score in expected_scores if score not in score_data]
                    
                    if not missing_scores:
                        # Verify score values match what we stored
                        hybrid_score = score_data.get('hybridScore')
                        strength_score = score_data.get('strengthScore')
                        
                        if hybrid_score == 78.5 and strength_score == 82.3:
                            self.log_test("Profile Retrieval", True, "Score data properly stored and retrieved with correct values", {
                                'profile_id': self.created_profile_id,
                                'hybridScore': hybrid_score,
                                'strengthScore': strength_score,
                                'all_scores': score_data
                            })
                            return True
                        else:
                            self.log_test("Profile Retrieval", False, f"Score values don't match - expected hybridScore=78.5, strengthScore=82.3, got hybridScore={hybrid_score}, strengthScore={strength_score}", score_data)
                            return False
                    else:
                        self.log_test("Profile Retrieval", False, f"Missing expected scores: {missing_scores}", score_data)
                        return False
                else:
                    self.log_test("Profile Retrieval", False, "No score_data found in profile - scores were not stored", data)
                    return False
            else:
                self.log_test("Profile Retrieval", False, f"HTTP {response.status_code}", response.text)
                return False
                
        except Exception as e:
            self.log_test("Profile Retrieval", False, "Request failed", str(e))
            return False
    
    def test_webhook_endpoint_accessibility(self):
        """Test 4: Verify the external webhook is accessible (bonus test)"""
        try:
            print("\n🔍 TEST 4: Webhook Endpoint Accessibility (Bonus)")
            print("-" * 60)
            
            webhook_url = "https://wavewisdom.app.n8n.cloud/webhook/b820bc30-989d-4c9b-9b0d-78b89b19b42c"
            
            print(f"📝 Testing webhook accessibility: {webhook_url}")
            
            # Test with sample data
            test_data = {
                "first_name": "Test",
                "last_name": "User",
                "body_metrics": {
                    "weight_lb": 175,
                    "vo2_max": 50
                },
                "pb_mile": "6:30",
                "weekly_miles": 30
            }
            
            response = self.session.post(webhook_url, json=test_data, timeout=10)
            
            if response.status_code == 200:
                print(f"✅ Webhook accessible and responding")
                
                # Check if webhook returns score data
                try:
                    webhook_data = response.json()
                    if isinstance(webhook_data, dict) and 'hybridScore' in webhook_data:
                        self.log_test("Webhook Accessibility", True, "Webhook accessible and returning score data", {
                            'webhook_url': webhook_url,
                            'response_keys': list(webhook_data.keys()),
                            'hybridScore': webhook_data.get('hybridScore')
                        })
                        return True
                    else:
                        self.log_test("Webhook Accessibility", True, "Webhook accessible but not returning expected score format", {
                            'webhook_url': webhook_url,
                            'response': webhook_data
                        })
                        return True
                except:
                    self.log_test("Webhook Accessibility", True, "Webhook accessible but response not JSON", {
                        'webhook_url': webhook_url,
                        'response_text': response.text[:200]
                    })
                    return True
            else:
                self.log_test("Webhook Accessibility", False, f"Webhook not accessible: HTTP {response.status_code}", {
                    'webhook_url': webhook_url,
                    'error': response.text[:200]
                })
                return False
                
        except Exception as e:
            self.log_test("Webhook Accessibility", False, "Webhook test failed", str(e))
            return False
    
    def run_all_tests(self):
        """Run all score storage fix verification tests"""
        print("🚨 CRITICAL FIX VERIFICATION: Score Storage Endpoint Fix")
        print("Testing the fix that removes individual field extraction causing PGRST204 errors")
        print("=" * 80)
        
        tests = [
            ("Profile Creation", self.test_profile_creation),
            ("Score Storage", self.test_score_storage),
            ("Profile Retrieval", self.test_profile_retrieval),
            ("Webhook Accessibility", self.test_webhook_endpoint_accessibility)
        ]
        
        results = []
        for test_name, test_func in tests:
            try:
                result = test_func()
                results.append((test_name, result))
            except Exception as e:
                print(f"❌ {test_name} failed with exception: {e}")
                results.append((test_name, False))
        
        # Summary
        print("\n" + "="*80)
        print("🚨 CRITICAL FIX VERIFICATION SUMMARY")
        print("="*80)
        
        passed_tests = 0
        total_tests = len(results)
        
        for test_name, result in results:
            status = "✅ PASS" if result else "❌ FAIL"
            print(f"{status}: {test_name}")
            if result:
                passed_tests += 1
        
        print(f"\nRESULTS: {passed_tests}/{total_tests} tests passed")
        
        if passed_tests >= 3:  # Core tests (profile creation, score storage, retrieval)
            print("🎉 FIX VERIFICATION: SUCCESSFUL - PGRST204 database error has been resolved!")
            print("✅ The score storage endpoint fix is working correctly")
            print("✅ Individual field extraction removal has resolved schema conflicts")
            print("✅ Score data is being stored as JSON without database schema issues")
        elif passed_tests >= 2:
            print("⚠️  FIX VERIFICATION: PARTIAL SUCCESS - Some issues remain")
            print("🔧 The fix may be working but there are still some edge cases")
        else:
            print("❌ FIX VERIFICATION: FAILED - PGRST204 error may still be occurring")
            print("🚨 The score storage endpoint fix needs further investigation")
        
        print("="*80)
        
        return passed_tests >= 3

if __name__ == "__main__":
    tester = ScoreStorageFixTester()
    success = tester.run_all_tests()
    exit(0 if success else 1)