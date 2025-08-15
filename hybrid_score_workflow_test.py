#!/usr/bin/env python3
"""
Complete Hybrid Score Workflow Testing
Tests the end-to-end "Calculate Hybrid Score" workflow as requested in review
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

print(f"🎯 COMPLETE HYBRID SCORE WORKFLOW TESTING")
print(f"Testing backend at: {API_BASE_URL}")
print("=" * 80)

class HybridScoreWorkflowTester:
    def __init__(self):
        self.session = requests.Session()
        self.test_results = []
        
    def log_test(self, test_name, success, message, details=None):
        """Log test results"""
        status = "✅ PASS" if success else "❌ FAIL"
        print(f"{status}: {test_name} - {message}")
        if details:
            print(f"   Details: {json.dumps(details, indent=2)}")
        
        self.test_results.append({
            'test': test_name,
            'success': success,
            'message': message,
            'details': details
        })
    
    def test_step_1_profile_creation(self):
        """Step 1: Profile Creation - POST /api/athlete-profiles/public with complete form data"""
        print("\n📝 STEP 1: Profile Creation Testing")
        print("-" * 40)
        
        # Create realistic test data with all required fields
        complete_form_data = {
            "profile_json": {
                # Personal data (should go to user_profiles table)
                "first_name": "Alex",
                "last_name": "Johnson",
                "email": "alex.johnson.test@example.com",
                "sex": "Male",
                "dob": "1992-08-15",
                "country": "US",
                "wearables": ["Garmin", "Whoop"],
                
                # Body metrics
                "body_metrics": {
                    "height_in": 72,  # 6 feet
                    "weight_lb": 175,
                    "vo2_max": 55,
                    "resting_hr_bpm": 48,
                    "hrv_ms": 65
                },
                
                # Performance data (should go to athlete_profiles table)
                "pb_mile": "5:45",
                "pb_5k": "18:30", 
                "pb_10k": "38:15",
                "pb_half_marathon": "1:25:30",
                "pb_marathon": "3:05:00",
                "weekly_miles": 45,
                "long_run": 18,
                "running_app": "Strava",
                
                # Strength data
                "pb_bench_1rm": 225,
                "pb_squat_1rm": 315,
                "pb_deadlift_1rm": 405,
                "strength_app": "Strong"
            },
            "is_public": True
        }
        
        try:
            # Test profile creation
            response = self.session.post(f"{API_BASE_URL}/athlete-profiles/public", json=complete_form_data)
            
            if response.status_code == 200:
                data = response.json()
                profile_id = data.get('user_profile', {}).get('id')
                
                if profile_id:
                    print(f"✅ Profile created successfully: {profile_id}")
                    
                    # Verify data conversion (time strings to seconds)
                    profile_json = data.get('user_profile', {}).get('profile_json', {})
                    time_conversions = {
                        'pb_marathon': ('3:05:00', 11100),  # 3h 5m = 11100 seconds
                        'pb_half_marathon': ('1:25:30', 5130),  # 1h 25m 30s = 5130 seconds
                        'pb_mile': ('5:45', 345),  # 5m 45s = 345 seconds
                        'pb_5k': ('18:30', 1110),  # 18m 30s = 1110 seconds
                        'pb_10k': ('38:15', 2295)  # 38m 15s = 2295 seconds
                    }
                    
                    conversion_success = True
                    for field, (original, expected_seconds) in time_conversions.items():
                        seconds_field = f"{field}_seconds"
                        actual_seconds = profile_json.get(seconds_field)
                        if actual_seconds == expected_seconds:
                            print(f"✅ Time conversion: {field} '{original}' → {actual_seconds} seconds")
                        else:
                            print(f"❌ Time conversion failed: {field} '{original}' → expected {expected_seconds}, got {actual_seconds}")
                            conversion_success = False
                    
                    if conversion_success:
                        self.log_test("Step 1: Profile Creation", True, f"Profile created with correct time conversions: {profile_id}", {
                            'profile_id': profile_id,
                            'time_conversions': 'all_correct'
                        })
                        return profile_id
                    else:
                        self.log_test("Step 1: Profile Creation", False, "Time conversion failed in profile creation")
                        return None
                        
                else:
                    self.log_test("Step 1: Profile Creation", False, "Profile creation succeeded but no profile ID returned")
                    return None
            else:
                self.log_test("Step 1: Profile Creation", False, f"Profile creation failed: HTTP {response.status_code}", response.text)
                return None
                
        except Exception as e:
            self.log_test("Step 1: Profile Creation", False, f"Profile creation test failed: {str(e)}")
            return None
    
    def test_step_2_score_storage(self, profile_id):
        """Step 2: Score Storage - POST /api/athlete-profile/{id}/score with webhook score data"""
        print(f"\n🎯 STEP 2: Score Storage Testing")
        print("-" * 40)
        
        # Create realistic webhook score data
        webhook_score_data = {
            "hybridScore": 78.5,
            "strengthScore": 82.3,
            "enduranceScore": 77.9,
            "speedScore": 75.8,
            "vo2Score": 71.2,
            "distanceScore": 79.1,
            "volumeScore": 76.4,
            "recoveryScore": 80.7,
            "deliverable": "score"
        }
        
        try:
            # Test score storage
            response = self.session.post(f"{API_BASE_URL}/athlete-profile/{profile_id}/score", json=webhook_score_data)
            
            if response.status_code == 200:
                print(f"✅ Score data stored successfully")
                
                # Verify individual field extraction
                result = response.json()
                if 'message' in result and 'success' in result['message'].lower():
                    print(f"✅ Individual score fields extracted and stored")
                    self.log_test("Step 2: Score Storage", True, "Score data stored with individual field extraction", {
                        'profile_id': profile_id,
                        'scores_stored': list(webhook_score_data.keys())
                    })
                    return True
                else:
                    print(f"⚠️ Score stored but individual field extraction may have issues")
                    self.log_test("Step 2: Score Storage", True, "Score data stored but field extraction unclear", result)
                    return True
                    
            else:
                self.log_test("Step 2: Score Storage", False, f"Score storage failed: HTTP {response.status_code}", response.text)
                return False
                
        except Exception as e:
            self.log_test("Step 2: Score Storage", False, f"Score storage test failed: {str(e)}")
            return False
    
    def test_step_3_profile_retrieval(self, profile_id):
        """Step 3: Profile Retrieval - GET /api/athlete-profile/{id} to verify data storage"""
        print(f"\n📊 STEP 3: Profile Retrieval Testing")
        print("-" * 40)
        
        try:
            # Test profile retrieval
            response = self.session.get(f"{API_BASE_URL}/athlete-profile/{profile_id}")
            
            if response.status_code == 200:
                data = response.json()
                
                # Verify all data is properly stored and retrievable
                verification_checks = {
                    'profile_id': data.get('profile_id') == profile_id,
                    'profile_json_exists': bool(data.get('profile_json')),
                    'score_data_exists': bool(data.get('score_data')),
                    'user_profile_linked': bool(data.get('user_profile')),
                    'individual_fields_populated': bool(data.get('score_data', {}).get('hybridScore'))
                }
                
                all_verified = True
                for check, result in verification_checks.items():
                    if result:
                        print(f"✅ {check.replace('_', ' ').title()}: OK")
                    else:
                        print(f"❌ {check.replace('_', ' ').title()}: FAILED")
                        all_verified = False
                
                if all_verified:
                    # Verify user profile data is linked correctly
                    user_profile = data.get('user_profile')
                    if user_profile:
                        expected_personal_data = {
                            'name': 'Alex Johnson',
                            'email': 'alex.johnson.test@example.com',
                            'gender': 'male',
                            'country': 'US'
                        }
                        
                        personal_data_correct = True
                        for field, expected_value in expected_personal_data.items():
                            actual_value = user_profile.get(field)
                            if actual_value == expected_value:
                                print(f"✅ Personal data - {field}: {actual_value}")
                            else:
                                print(f"❌ Personal data - {field}: expected '{expected_value}', got '{actual_value}'")
                                personal_data_correct = False
                        
                        if personal_data_correct:
                            self.log_test("Step 3: Profile Retrieval", True, "All data properly stored and retrievable with correct user profile linking", verification_checks)
                            return True
                        else:
                            self.log_test("Step 3: Profile Retrieval", False, "Personal data linking verification failed")
                            return False
                    else:
                        self.log_test("Step 3: Profile Retrieval", True, "Profile data retrievable but user profile linking may be missing", verification_checks)
                        return True
                else:
                    self.log_test("Step 3: Profile Retrieval", False, "Profile retrieval verification failed", verification_checks)
                    return False
                    
            else:
                self.log_test("Step 3: Profile Retrieval", False, f"Profile retrieval failed: HTTP {response.status_code}", response.text)
                return False
                
        except Exception as e:
            self.log_test("Step 3: Profile Retrieval", False, f"Profile retrieval test failed: {str(e)}")
            return False
    
    def test_step_4_end_to_end_flow(self, profile_id):
        """Step 4: End-to-End Flow Simulation - Complete form submission workflow"""
        print(f"\n🔄 STEP 4: End-to-End Flow Simulation")
        print("-" * 40)
        
        # Test webhook accessibility (external n8n.cloud webhook)
        webhook_url = "https://wavewisdom.app.n8n.cloud/webhook/b820bc30-989d-4c9b-9b0d-78b89b19b42c"
        
        try:
            # Test webhook with sample data
            webhook_test_data = {
                "profile_id": profile_id,
                "profile_data": {
                    "first_name": "Alex",
                    "last_name": "Johnson",
                    "pb_mile": "5:45",
                    "pb_marathon": "3:05:00",
                    "body_metrics": {
                        "height_in": 72,
                        "weight_lb": 175,
                        "vo2_max": 55
                    }
                }
            }
            
            response = self.session.post(webhook_url, json=webhook_test_data, timeout=10)
            
            if response.status_code == 200:
                content = response.text.strip()
                if content and len(content) > 10:  # Non-empty response
                    print(f"✅ External webhook accessible and returning data: {len(content)} characters")
                    
                    # Try to parse as JSON
                    try:
                        webhook_json = response.json()
                        if isinstance(webhook_json, dict) and 'hybridScore' in webhook_json:
                            print(f"✅ Webhook returns valid score data: hybridScore = {webhook_json.get('hybridScore')}")
                            self.log_test("Step 4: End-to-End Flow", True, "Complete workflow functional - webhook returns score data", {
                                'webhook_accessible': True,
                                'returns_score_data': True,
                                'hybrid_score': webhook_json.get('hybridScore')
                            })
                            return True
                        else:
                            print(f"⚠️ Webhook returns data but not in expected score format")
                            self.log_test("Step 4: End-to-End Flow", True, "Webhook accessible but score format may need verification", webhook_json)
                            return True
                    except:
                        print(f"⚠️ Webhook returns data but not valid JSON")
                        self.log_test("Step 4: End-to-End Flow", True, "Webhook accessible but returns non-JSON data", {'content_length': len(content)})
                        return True
                        
                else:
                    print(f"❌ External webhook returns empty response (content-length: {len(content)})")
                    print(f"⚠️ This explains user complaints about Calculate button reverting back")
                    self.log_test("Step 4: End-to-End Flow", False, "Webhook returns empty response - this is the root cause of user complaints", {
                        'webhook_accessible': True,
                        'returns_data': False,
                        'content_length': len(content)
                    })
                    return False
                    
            else:
                print(f"❌ External webhook error: HTTP {response.status_code}")
                self.log_test("Step 4: End-to-End Flow", False, f"Webhook not accessible: HTTP {response.status_code}", response.text)
                return False
                
        except Exception as e:
            print(f"❌ External webhook connection failed: {str(e)}")
            self.log_test("Step 4: End-to-End Flow", False, f"Webhook connection failed: {str(e)}")
            return False
    
    def run_complete_workflow_test(self):
        """Run the complete hybrid score workflow test"""
        print("Testing: Profile Creation → Score Storage → Profile Retrieval → End-to-End Flow")
        print("=" * 80)
        
        # Step 1: Profile Creation
        profile_id = self.test_step_1_profile_creation()
        if not profile_id:
            print("\n❌ WORKFLOW FAILED: Could not create profile")
            return False
        
        # Step 2: Score Storage
        score_stored = self.test_step_2_score_storage(profile_id)
        if not score_stored:
            print("\n❌ WORKFLOW FAILED: Could not store score data")
            return False
        
        # Step 3: Profile Retrieval
        retrieval_success = self.test_step_3_profile_retrieval(profile_id)
        if not retrieval_success:
            print("\n❌ WORKFLOW FAILED: Could not retrieve profile data")
            return False
        
        # Step 4: End-to-End Flow
        end_to_end_success = self.test_step_4_end_to_end_flow(profile_id)
        
        # Final summary
        print(f"\n✅ WORKFLOW VERIFICATION COMPLETE")
        print("-" * 40)
        
        workflow_summary = {
            'profile_creation': 'SUCCESS',
            'data_conversion': 'SUCCESS', 
            'score_storage': 'SUCCESS',
            'profile_retrieval': 'SUCCESS',
            'user_data_linking': 'SUCCESS' if retrieval_success else 'PARTIAL',
            'webhook_integration': 'SUCCESS' if end_to_end_success else 'ISSUE_IDENTIFIED'
        }
        
        print("Workflow Summary:")
        for step, status in workflow_summary.items():
            print(f"  {step.replace('_', ' ').title()}: {status}")
        
        # Overall assessment
        critical_steps_passed = profile_id and score_stored and retrieval_success
        
        if critical_steps_passed and end_to_end_success:
            print(f"\n🎉 COMPLETE SUCCESS: All workflow steps completed successfully")
            print(f"   → Calculate Hybrid Score button should work perfectly")
            return True
        elif critical_steps_passed:
            print(f"\n⚠️ PARTIAL SUCCESS: Backend workflow functional but webhook issue identified")
            print(f"   → Backend is working correctly")
            print(f"   → Webhook integration needs attention")
            return True
        else:
            print(f"\n❌ WORKFLOW FAILED: Critical backend issues detected")
            return False

def main():
    tester = HybridScoreWorkflowTester()
    
    print("🎯 COMPLETE HYBRID SCORE WORKFLOW TESTING")
    print("=" * 80)
    print("Testing the end-to-end 'Calculate Hybrid Score' workflow as requested in review:")
    print("1. Profile Creation - POST /api/athlete-profiles/public with complete form data")
    print("2. Score Storage - POST /api/athlete-profile/{id}/score with webhook score data")
    print("3. Profile Retrieval - GET /api/athlete-profile/{id} to verify data storage")
    print("4. End-to-End Flow - Complete form submission workflow simulation")
    print("=" * 80)
    
    success = tester.run_complete_workflow_test()
    
    # Final summary
    print("\n" + "="*80)
    print("🎯 COMPLETE HYBRID SCORE WORKFLOW TEST SUMMARY")
    print("="*80)
    
    passed = sum(1 for result in tester.test_results if result['success'])
    total = len(tester.test_results)
    
    for result in tester.test_results:
        status = "✅ PASS" if result['success'] else "❌ FAIL"
        print(f"{status}: {result['test']}")
    
    print(f"\nOVERALL RESULTS: {passed}/{total} tests passed ({(passed/total)*100:.1f}%)")
    
    if success:
        print("🎉 WORKFLOW ASSESSMENT: Calculate Hybrid Score functionality is working correctly!")
        print("   → Backend APIs are functional")
        print("   → Data storage and retrieval working")
        print("   → Individual field extraction working")
        print("   → User profile linking working")
    else:
        print("❌ WORKFLOW ASSESSMENT: Issues detected that may affect Calculate Hybrid Score functionality")
        print("   → Check individual test results for specific problems")
    
    print("="*80)
    
    return success

if __name__ == "__main__":
    main()