#!/usr/bin/env python3
"""
Simple Leaderboard API Testing Script
Tests the new leaderboard endpoint functionality
"""

import subprocess
import json
import sys

def run_curl_test(endpoint, description):
    """Run a curl test and return the result"""
    try:
        cmd = f"curl -s http://localhost:8001/api{endpoint}"
        result = subprocess.run(cmd, shell=True, capture_output=True, text=True, timeout=10)
        
        if result.returncode == 0:
            try:
                data = json.loads(result.stdout)
                return True, data
            except json.JSONDecodeError:
                return False, f"Invalid JSON response: {result.stdout}"
        else:
            return False, f"Curl failed: {result.stderr}"
    except subprocess.TimeoutExpired:
        return False, "Request timed out"
    except Exception as e:
        return False, f"Error: {str(e)}"

def test_leaderboard_endpoint():
    """Test the leaderboard endpoint"""
    print("=" * 80)
    print("🚀 TESTING NEW LEADERBOARD API ENDPOINT")
    print("=" * 80)
    
    tests = [
        ("/", "API Root Endpoint"),
        ("/status", "Status Endpoint"),
        ("/leaderboard", "Leaderboard Endpoint")
    ]
    
    results = []
    
    for endpoint, description in tests:
        print(f"\n🔍 Testing {description}: {endpoint}")
        success, data = run_curl_test(endpoint, description)
        
        if success:
            print(f"✅ {description}: SUCCESS")
            print(f"   Response: {json.dumps(data, indent=2)}")
            results.append((description, True, data))
        else:
            print(f"❌ {description}: FAILED")
            print(f"   Error: {data}")
            results.append((description, False, data))
    
    # Specific leaderboard tests
    print(f"\n🎯 DETAILED LEADERBOARD ENDPOINT ANALYSIS")
    print("-" * 60)
    
    success, data = run_curl_test("/leaderboard", "Leaderboard")
    
    if success:
        # Test 1: Structure validation
        if isinstance(data, dict) and "leaderboard" in data and "total" in data:
            print("✅ Test 1: Correct response structure (leaderboard, total)")
            
            # Test 2: Data types
            if isinstance(data["leaderboard"], list) and isinstance(data["total"], int):
                print("✅ Test 2: Correct data types (list, int)")
                
                # Test 3: Empty data handling
                if data["total"] == 0 and len(data["leaderboard"]) == 0:
                    print("✅ Test 3: Correctly handles empty data case")
                    print("   📝 Note: No profiles with scores found in database")
                elif data["total"] > 0:
                    print(f"✅ Test 3: Found {data['total']} entries in leaderboard")
                    
                    # Test 4: Entry format validation
                    if data["leaderboard"]:
                        first_entry = data["leaderboard"][0]
                        required_fields = ["rank", "display_name", "score", "score_breakdown"]
                        missing_fields = [field for field in required_fields if field not in first_entry]
                        
                        if not missing_fields:
                            print("✅ Test 4: Leaderboard entries have correct format")
                            print(f"   Sample entry: {json.dumps(first_entry, indent=4)}")
                            
                            # Test 5: Ranking validation
                            ranks = [entry.get("rank") for entry in data["leaderboard"]]
                            expected_ranks = list(range(1, len(data["leaderboard"]) + 1))
                            
                            if ranks == expected_ranks:
                                print("✅ Test 5: Correct ranking sequence (1, 2, 3, ...)")
                            else:
                                print(f"❌ Test 5: Incorrect ranking sequence")
                                print(f"   Expected: {expected_ranks}")
                                print(f"   Got: {ranks}")
                            
                            # Test 6: Score ordering
                            scores = [entry.get("score", 0) for entry in data["leaderboard"]]
                            if scores == sorted(scores, reverse=True):
                                print("✅ Test 6: Scores in descending order")
                            else:
                                print("❌ Test 6: Scores not in descending order")
                                print(f"   Scores: {scores}")
                            
                            # Test 7: Unique display names
                            display_names = [entry.get("display_name") for entry in data["leaderboard"]]
                            if len(display_names) == len(set(display_names)):
                                print("✅ Test 7: All display names are unique (highest score per user)")
                            else:
                                print("❌ Test 7: Duplicate display names found")
                                print(f"   Display names: {display_names}")
                        else:
                            print(f"❌ Test 4: Missing required fields: {missing_fields}")
                else:
                    print("❌ Test 3: Invalid total/leaderboard length mismatch")
            else:
                print("❌ Test 2: Incorrect data types")
                print(f"   leaderboard type: {type(data['leaderboard'])}")
                print(f"   total type: {type(data['total'])}")
        else:
            print("❌ Test 1: Missing required fields in response")
            print(f"   Response keys: {list(data.keys()) if isinstance(data, dict) else 'Not a dict'}")
    else:
        print("❌ Leaderboard endpoint failed")
        print(f"   Error: {data}")
    
    # Summary
    print(f"\n" + "=" * 80)
    print("📊 LEADERBOARD API TESTING SUMMARY")
    print("=" * 80)
    
    passed = sum(1 for _, success, _ in results if success)
    total = len(results)
    
    for description, success, _ in results:
        status = "✅" if success else "❌"
        print(f"{status} {description}")
    
    print(f"\n🎯 OVERALL RESULTS:")
    print(f"   ✅ PASSED: {passed}/{total}")
    print(f"   📈 SUCCESS RATE: {(passed/total*100):.1f}%")
    
    if passed == total:
        print("\n🎉 ALL TESTS PASSED! Leaderboard API endpoint is working correctly.")
        return True
    else:
        print(f"\n⚠️  {total - passed} test(s) failed. Review the issues above.")
        return False

if __name__ == "__main__":
    success = test_leaderboard_endpoint()
    sys.exit(0 if success else 1)