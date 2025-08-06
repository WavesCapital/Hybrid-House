#!/usr/bin/env python3
"""
Focused Database Normalization Testing
Tests the specific normalization requirements from the review request
"""

import requests
import json

API_BASE_URL = "http://localhost:8001/api"

def test_database_normalization():
    """Test the database normalization implementation"""
    print("🧪 FOCUSED DATABASE NORMALIZATION TESTING")
    print("=" * 60)
    
    results = {
        'tests_passed': 0,
        'tests_total': 0,
        'issues_found': []
    }
    
    # Test 1: Check athlete profiles structure
    print("\n1️⃣ Testing Athlete Profiles Structure")
    print("-" * 40)
    
    response = requests.get(f"{API_BASE_URL}/athlete-profiles")
    if response.status_code == 200:
        data = response.json()
        profiles = data.get('profiles', [])
        print(f"✅ Found {len(profiles)} athlete profiles")
        
        if profiles:
            profile = profiles[0]
            
            # Check for user_id linking
            has_user_id = profile.get('user_id') is not None
            print(f"User ID linking: {'✅' if has_user_id else '❌'} {profile.get('user_id')}")
            
            # Check for performance data
            has_score_data = profile.get('score_data') is not None
            print(f"Performance data: {'✅' if has_score_data else '❌'}")
            
            # Check for personal data (should NOT be in athlete_profiles)
            personal_data_fields = ['first_name', 'last_name', 'email', 'age', 'sex']
            personal_data_found = []
            for field in personal_data_fields:
                if profile.get(field) is not None:
                    personal_data_found.append(field)
            
            if not personal_data_found:
                print("✅ No personal data in athlete_profiles (normalized)")
                results['tests_passed'] += 1
            else:
                print(f"❌ Personal data found in athlete_profiles: {personal_data_found}")
                results['issues_found'].append(f"Personal data in athlete_profiles: {personal_data_found}")
            
            results['tests_total'] += 1
            
            if not has_user_id:
                results['issues_found'].append("Athlete profiles missing user_id links")
        else:
            print("⚠️  No athlete profiles to test")
    else:
        print(f"❌ Failed to get athlete profiles: {response.status_code}")
        results['issues_found'].append("Cannot access athlete profiles API")
    
    # Test 2: Check leaderboard JOINs
    print("\n2️⃣ Testing Leaderboard JOINs")
    print("-" * 30)
    
    response = requests.get(f"{API_BASE_URL}/leaderboard")
    if response.status_code == 200:
        data = response.json()
        leaderboard = data.get('leaderboard', [])
        print(f"✅ Leaderboard API accessible, {len(leaderboard)} entries")
        
        if leaderboard:
            entry = leaderboard[0]
            
            # Check for performance data from athlete_profiles
            has_performance = entry.get('score') is not None
            print(f"Performance data: {'✅' if has_performance else '❌'}")
            
            # Check for personal data from user_profiles JOIN
            has_personal = (entry.get('display_name') is not None and 
                          entry.get('age') is not None and 
                          entry.get('gender') is not None)
            print(f"Personal data (via JOIN): {'✅' if has_personal else '❌'}")
            
            if has_performance and has_personal:
                print("✅ Leaderboard shows proper normalized structure")
                results['tests_passed'] += 1
            else:
                print("❌ Leaderboard missing proper JOIN data")
                results['issues_found'].append("Leaderboard JOINs not working properly")
            
            results['tests_total'] += 1
        else:
            print("⚠️  Empty leaderboard - cannot test JOINs")
            results['issues_found'].append("Empty leaderboard - no data to test JOINs")
    else:
        print(f"❌ Failed to get leaderboard: {response.status_code}")
        results['issues_found'].append("Cannot access leaderboard API")
    
    # Test 3: Check webhook endpoint exists
    print("\n3️⃣ Testing Webhook Endpoint")
    print("-" * 30)
    
    # Test with minimal data to see if endpoint exists
    test_data = {"test": "data"}
    response = requests.post(f"{API_BASE_URL}/webhook/hybrid-score-result", json=test_data)
    
    if response.status_code == 422:
        print("✅ Webhook endpoint exists (422 = validation error expected)")
        results['tests_passed'] += 1
    elif response.status_code == 404:
        print("❌ Webhook endpoint not found")
        results['issues_found'].append("Webhook endpoint missing")
    else:
        print(f"⚠️  Webhook endpoint response: {response.status_code}")
    
    results['tests_total'] += 1
    
    # Test 4: Check data integrity
    print("\n4️⃣ Testing Data Integrity")
    print("-" * 30)
    
    response = requests.get(f"{API_BASE_URL}/athlete-profiles")
    if response.status_code == 200:
        data = response.json()
        profiles = data.get('profiles', [])
        
        profiles_with_user_id = sum(1 for p in profiles if p.get('user_id') is not None)
        profiles_with_scores = sum(1 for p in profiles if p.get('score_data') is not None)
        
        print(f"Profiles with user_id: {profiles_with_user_id}/{len(profiles)}")
        print(f"Profiles with scores: {profiles_with_scores}/{len(profiles)}")
        
        if profiles_with_user_id > 0:
            print("✅ Some profiles have user_id links")
            results['tests_passed'] += 1
        else:
            print("❌ No profiles have user_id links")
            results['issues_found'].append("No user_id links in athlete_profiles")
        
        results['tests_total'] += 1
    
    # Summary
    print("\n" + "=" * 60)
    print("📊 DATABASE NORMALIZATION TEST SUMMARY")
    print("=" * 60)
    
    success_rate = (results['tests_passed'] / results['tests_total']) * 100 if results['tests_total'] > 0 else 0
    print(f"Tests passed: {results['tests_passed']}/{results['tests_total']} ({success_rate:.1f}%)")
    
    if results['issues_found']:
        print("\n🚨 ISSUES FOUND:")
        for i, issue in enumerate(results['issues_found'], 1):
            print(f"   {i}. {issue}")
    
    if success_rate >= 75:
        print("\n✅ DATABASE NORMALIZATION: MOSTLY WORKING")
        print("The core structure is in place with minor issues to address")
    elif success_rate >= 50:
        print("\n⚠️  DATABASE NORMALIZATION: PARTIALLY WORKING")
        print("Some normalization is in place but significant issues remain")
    else:
        print("\n❌ DATABASE NORMALIZATION: NEEDS MAJOR WORK")
        print("Critical normalization issues detected")
    
    return success_rate >= 50

if __name__ == "__main__":
    test_database_normalization()