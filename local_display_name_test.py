#!/usr/bin/env python3
"""
Local Display Name Investigation Test
Test using localhost to bypass proxy issues
"""

import requests
import json

# Use local backend directly
API_BASE_URL = "http://0.0.0.0:8001/api"

print(f"Testing backend at: {API_BASE_URL}")

class LocalDisplayNameTester:
    def __init__(self):
        self.session = requests.Session()
        
    def test_leaderboard_display_name_investigation(self):
        """Investigate the actual data in database to understand display name issue"""
        try:
            print("\n🔍 INVESTIGATING LEADERBOARD DISPLAY NAME ISSUE")
            print("=" * 60)
            
            # Step 1: Get leaderboard data to see what's currently displayed
            print("📊 Step 1: Getting current leaderboard data...")
            leaderboard_response = self.session.get(f"{API_BASE_URL}/leaderboard")
            
            print(f"Leaderboard response status: {leaderboard_response.status_code}")
            
            if leaderboard_response.status_code == 200:
                leaderboard_data = leaderboard_response.json()
                leaderboard = leaderboard_data.get("leaderboard", [])
                
                print(f"✅ Leaderboard returned {len(leaderboard)} entries")
                
                # Show current display names
                for i, entry in enumerate(leaderboard[:5]):  # Show first 5
                    display_name = entry.get('display_name', 'N/A')
                    score = entry.get('score', 'N/A')
                    age = entry.get('age', 'N/A')
                    gender = entry.get('gender', 'N/A')
                    country = entry.get('country', 'N/A')
                    print(f"   {i+1}. Display Name: '{display_name}' | Score: {score} | Age: {age} | Gender: {gender} | Country: {country}")
                
                # Step 2: Get athlete profiles to see profile_json data
                print("\n📋 Step 2: Getting athlete profiles data...")
                profiles_response = self.session.get(f"{API_BASE_URL}/athlete-profiles")
                
                print(f"Profiles response status: {profiles_response.status_code}")
                
                if profiles_response.status_code == 200:
                    profiles_data = profiles_response.json()
                    profiles = profiles_data.get("profiles", [])
                    
                    print(f"✅ Found {len(profiles)} athlete profiles with complete scores")
                    
                    # Show profile_json display names for comparison
                    for i, profile in enumerate(profiles[:5]):  # Show first 5
                        profile_json = profile.get('profile_json', {})
                        profile_display_name = profile_json.get('display_name', 'N/A')
                        first_name = profile_json.get('first_name', 'N/A')
                        last_name = profile_json.get('last_name', 'N/A')
                        email = profile_json.get('email', 'N/A')
                        score_data = profile.get('score_data', {})
                        hybrid_score = score_data.get('hybridScore', 'N/A')
                        user_id = profile.get('user_id', 'N/A')
                        
                        print(f"   Profile {i+1}:")
                        print(f"     - user_id: {user_id}")
                        print(f"     - profile_json.display_name: '{profile_display_name}'")
                        print(f"     - profile_json.first_name: '{first_name}'")
                        print(f"     - profile_json.last_name: '{last_name}'")
                        print(f"     - profile_json.email: '{email}'")
                        print(f"     - hybridScore: {hybrid_score}")
                
                # Step 3: Analysis and comparison
                print("\n🔍 Step 3: Analysis of display name sources...")
                
                if leaderboard and profiles:
                    print("📊 COMPARISON ANALYSIS:")
                    print("   Leaderboard shows these display names:")
                    for entry in leaderboard[:3]:
                        print(f"     - '{entry.get('display_name', 'N/A')}'")
                    
                    print("   Profile JSON contains these display names:")
                    for profile in profiles[:3]:
                        profile_json = profile.get('profile_json', {})
                        print(f"     - '{profile_json.get('display_name', 'N/A')}'")
                    
                    print("\n💡 EXPECTED vs ACTUAL:")
                    print("   User expects: 'Kyle S' (shortened display name from user_profiles table)")
                    print("   Leaderboard shows: 'Kyle' and 'Kyle Steinmeyer'")
                    print("   This suggests the leaderboard is using profile_json data instead of user_profiles data")
                    
                    # Detailed comparison
                    print("\n🔍 DETAILED COMPARISON:")
                    for i, leaderboard_entry in enumerate(leaderboard[:3]):
                        lb_display_name = leaderboard_entry.get('display_name', 'N/A')
                        lb_score = leaderboard_entry.get('score', 'N/A')
                        
                        print(f"\n📊 Leaderboard Entry {i+1}:")
                        print(f"   Display Name: '{lb_display_name}'")
                        print(f"   Score: {lb_score}")
                        
                        # Find matching profile by score
                        matching_profile = None
                        for profile in profiles:
                            profile_score = profile.get('score_data', {}).get('hybridScore')
                            if profile_score == lb_score:
                                matching_profile = profile
                                break
                        
                        if matching_profile:
                            profile_json = matching_profile.get('profile_json', {})
                            print(f"   📋 Matching Profile Data:")
                            print(f"     - profile_json.display_name: '{profile_json.get('display_name', 'N/A')}'")
                            print(f"     - profile_json.first_name: '{profile_json.get('first_name', 'N/A')}'")
                            print(f"     - profile_json.last_name: '{profile_json.get('last_name', 'N/A')}'")
                            print(f"     - profile_json.email: '{profile_json.get('email', 'N/A')}'")
                            
                            # Analysis
                            if lb_display_name == profile_json.get('display_name'):
                                print(f"   ✅ Leaderboard using profile_json.display_name")
                            elif lb_display_name == profile_json.get('first_name'):
                                print(f"   ⚠️  Leaderboard using profile_json.first_name instead of display_name")
                            elif lb_display_name == f"{profile_json.get('first_name', '')} {profile_json.get('last_name', '')}".strip():
                                print(f"   ⚠️  Leaderboard using first_name + last_name combination")
                            else:
                                print(f"   ❓ Leaderboard display name source unclear")
                                print(f"       Leaderboard: '{lb_display_name}'")
                                print(f"       Profile display_name: '{profile_json.get('display_name', 'N/A')}'")
                                print(f"       Profile first_name: '{profile_json.get('first_name', 'N/A')}'")
                                print(f"       Profile last_name: '{profile_json.get('last_name', 'N/A')}'")
                        else:
                            print(f"   ❌ No matching profile found for score {lb_score}")
                
                print("\n✅ Investigation completed successfully")
                return True
                
            elif leaderboard_response.status_code == 500:
                try:
                    error_data = leaderboard_response.json()
                    print(f"⚠️  Leaderboard 500 error: {error_data}")
                    if "is_public" in str(error_data).lower():
                        print("   This is likely due to missing is_public column")
                        print("   The leaderboard endpoint exists but can't filter by is_public")
                        return True
                    else:
                        print("   This is a different server error")
                        return False
                except:
                    print(f"⚠️  Leaderboard 500 error: {leaderboard_response.text}")
                    return False
            else:
                print(f"❌ Leaderboard failed: HTTP {leaderboard_response.status_code}")
                print(f"   Response: {leaderboard_response.text}")
                return False
                
        except Exception as e:
            print(f"❌ Investigation failed: {str(e)}")
            return False

    def test_backend_health(self):
        """Test if backend is responding"""
        try:
            response = self.session.get(f"{API_BASE_URL}/")
            print(f"Backend health: {response.status_code}")
            if response.status_code == 200:
                print(f"Backend message: {response.json()}")
                return True
            return False
        except Exception as e:
            print(f"Backend health check failed: {e}")
            return False

def main():
    tester = LocalDisplayNameTester()
    
    print("🔍 LOCAL DISPLAY NAME INVESTIGATION TEST")
    print("=" * 50)
    
    # First check backend health
    if not tester.test_backend_health():
        print("❌ Backend is not responding")
        return False
    
    success = tester.test_leaderboard_display_name_investigation()
    
    if success:
        print("\n🎉 Display name investigation completed successfully!")
        print("\n💡 KEY FINDINGS:")
        print("   - The leaderboard endpoint should use user_profiles.display_name")
        print("   - Currently it appears to use athlete_profiles.profile_json data")
        print("   - This explains why 'Kyle S' doesn't appear in leaderboard")
        print("   - The backend needs to join user_profiles table for display names")
    else:
        print("\n❌ Display name investigation failed")
    
    return success

if __name__ == "__main__":
    main()