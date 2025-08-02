#!/usr/bin/env python3
"""
Database Index Performance Testing for Ranking Queries
Tests the performance of leaderboard ranking calculations and identifies if database indexes are needed
"""

import requests
import json
import os
import time
from dotenv import load_dotenv
from pathlib import Path

# Load environment variables
ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / 'frontend' / '.env')

# Get backend URL from frontend env
BACKEND_URL = os.environ.get('REACT_APP_BACKEND_URL', 'http://localhost:8001')
API_BASE_URL = f"{BACKEND_URL}/api"

print(f"Testing database index performance at: {API_BASE_URL}")

class DatabaseIndexTester:
    def __init__(self):
        self.session = requests.Session()
        self.test_results = []
        
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
    
    def test_leaderboard_query_performance(self):
        """Test leaderboard query performance to identify if indexes are needed"""
        try:
            print("\n🔍 TESTING LEADERBOARD QUERY PERFORMANCE")
            
            # Test multiple requests to measure performance
            response_times = []
            for i in range(5):
                start_time = time.time()
                response = self.session.get(f"{API_BASE_URL}/leaderboard")
                end_time = time.time()
                
                response_time = end_time - start_time
                response_times.append(response_time)
                
                if response.status_code != 200:
                    self.log_test("Leaderboard Query Performance", False, f"HTTP {response.status_code} on request {i+1}", response.text)
                    return False
            
            avg_response_time = sum(response_times) / len(response_times)
            max_response_time = max(response_times)
            min_response_time = min(response_times)
            
            # Check if response times indicate need for indexing
            if avg_response_time > 2.0:  # More than 2 seconds average
                self.log_test("Leaderboard Query Performance", False, 
                             f"Slow query performance detected - Average: {avg_response_time:.3f}s, Max: {max_response_time:.3f}s", 
                             {"avg_time": avg_response_time, "max_time": max_response_time, "min_time": min_response_time, "all_times": response_times})
                return False
            elif avg_response_time > 1.0:  # More than 1 second average
                self.log_test("Leaderboard Query Performance", True, 
                             f"Moderate query performance - Consider indexing - Average: {avg_response_time:.3f}s, Max: {max_response_time:.3f}s", 
                             {"avg_time": avg_response_time, "max_time": max_response_time, "min_time": min_response_time, "all_times": response_times})
                return True
            else:
                self.log_test("Leaderboard Query Performance", True, 
                             f"Good query performance - Average: {avg_response_time:.3f}s, Max: {max_response_time:.3f}s", 
                             {"avg_time": avg_response_time, "max_time": max_response_time, "min_time": min_response_time, "all_times": response_times})
                return True
                
        except Exception as e:
            self.log_test("Leaderboard Query Performance", False, "Performance test failed", str(e))
            return False
    
    def test_athlete_profiles_query_performance(self):
        """Test athlete profiles query performance for complete score filtering"""
        try:
            print("\n🔍 TESTING ATHLETE PROFILES QUERY PERFORMANCE")
            
            # Test multiple requests to measure performance
            response_times = []
            for i in range(5):
                start_time = time.time()
                response = self.session.get(f"{API_BASE_URL}/athlete-profiles")
                end_time = time.time()
                
                response_time = end_time - start_time
                response_times.append(response_time)
                
                if response.status_code != 200:
                    self.log_test("Athlete Profiles Query Performance", False, f"HTTP {response.status_code} on request {i+1}", response.text)
                    return False
            
            avg_response_time = sum(response_times) / len(response_times)
            max_response_time = max(response_times)
            min_response_time = min(response_times)
            
            # Check if response times indicate need for indexing
            if avg_response_time > 2.0:  # More than 2 seconds average
                self.log_test("Athlete Profiles Query Performance", False, 
                             f"Slow query performance detected - Average: {avg_response_time:.3f}s, Max: {max_response_time:.3f}s", 
                             {"avg_time": avg_response_time, "max_time": max_response_time, "min_time": min_response_time, "all_times": response_times})
                return False
            elif avg_response_time > 1.0:  # More than 1 second average
                self.log_test("Athlete Profiles Query Performance", True, 
                             f"Moderate query performance - Consider indexing - Average: {avg_response_time:.3f}s, Max: {max_response_time:.3f}s", 
                             {"avg_time": avg_response_time, "max_time": max_response_time, "min_time": min_response_time, "all_times": response_times})
                return True
            else:
                self.log_test("Athlete Profiles Query Performance", True, 
                             f"Good query performance - Average: {avg_response_time:.3f}s, Max: {max_response_time:.3f}s", 
                             {"avg_time": avg_response_time, "max_time": max_response_time, "min_time": min_response_time, "all_times": response_times})
                return True
                
        except Exception as e:
            self.log_test("Athlete Profiles Query Performance", False, "Performance test failed", str(e))
            return False
    
    def test_database_scale_analysis(self):
        """Analyze current database scale to determine if indexes are needed"""
        try:
            print("\n📊 ANALYZING DATABASE SCALE FOR INDEX REQUIREMENTS")
            
            # Get athlete profiles count
            response = self.session.get(f"{API_BASE_URL}/athlete-profiles")
            if response.status_code != 200:
                self.log_test("Database Scale Analysis", False, f"Failed to get athlete profiles: HTTP {response.status_code}", response.text)
                return False
            
            profiles_data = response.json()
            total_profiles = profiles_data.get('total', 0)
            
            # Get leaderboard count
            leaderboard_response = self.session.get(f"{API_BASE_URL}/leaderboard")
            if leaderboard_response.status_code != 200:
                self.log_test("Database Scale Analysis", False, f"Failed to get leaderboard: HTTP {leaderboard_response.status_code}", leaderboard_response.text)
                return False
            
            leaderboard_data = leaderboard_response.json()
            public_profiles = leaderboard_data.get('total', 0)
            
            # Analyze scale requirements
            scale_analysis = {
                "total_profiles": total_profiles,
                "public_profiles": public_profiles,
                "private_profiles": total_profiles - public_profiles,
                "index_recommendation": "none"
            }
            
            if total_profiles > 10000:
                scale_analysis["index_recommendation"] = "critical"
                recommendation = "CRITICAL - Database indexes are essential for performance with 10,000+ profiles"
                success = False
            elif total_profiles > 1000:
                scale_analysis["index_recommendation"] = "recommended"
                recommendation = "RECOMMENDED - Database indexes will improve performance with 1,000+ profiles"
                success = True
            elif total_profiles > 100:
                scale_analysis["index_recommendation"] = "beneficial"
                recommendation = "BENEFICIAL - Database indexes will help with 100+ profiles"
                success = True
            else:
                scale_analysis["index_recommendation"] = "optional"
                recommendation = f"OPTIONAL - Current scale ({total_profiles} profiles) may not require indexes yet"
                success = True
            
            self.log_test("Database Scale Analysis", success, recommendation, scale_analysis)
            return success
            
        except Exception as e:
            self.log_test("Database Scale Analysis", False, "Scale analysis failed", str(e))
            return False
    
    def test_ranking_calculation_complexity(self):
        """Test the complexity of ranking calculations to identify optimization needs"""
        try:
            print("\n🧮 TESTING RANKING CALCULATION COMPLEXITY")
            
            # Get leaderboard data to analyze ranking complexity
            response = self.session.get(f"{API_BASE_URL}/leaderboard")
            if response.status_code != 200:
                self.log_test("Ranking Calculation Complexity", False, f"Failed to get leaderboard: HTTP {response.status_code}", response.text)
                return False
            
            data = response.json()
            leaderboard = data.get('leaderboard', [])
            
            if not leaderboard:
                self.log_test("Ranking Calculation Complexity", True, "No ranking calculations needed - empty leaderboard", {"entries": 0})
                return True
            
            # Analyze ranking complexity
            complexity_analysis = {
                "total_entries": len(leaderboard),
                "has_score_sorting": False,
                "has_age_data": False,
                "has_country_data": False,
                "has_gender_data": False,
                "ranking_fields": []
            }
            
            # Check first entry for complexity indicators
            first_entry = leaderboard[0]
            
            if 'score' in first_entry:
                complexity_analysis["has_score_sorting"] = True
                complexity_analysis["ranking_fields"].append("score")
            
            if 'age' in first_entry:
                complexity_analysis["has_age_data"] = True
                complexity_analysis["ranking_fields"].append("age")
            
            if 'country' in first_entry:
                complexity_analysis["has_country_data"] = True
                complexity_analysis["ranking_fields"].append("country")
            
            if 'gender' in first_entry:
                complexity_analysis["has_gender_data"] = True
                complexity_analysis["ranking_fields"].append("gender")
            
            # Determine if indexes would help
            ranking_fields_count = len(complexity_analysis["ranking_fields"])
            
            if ranking_fields_count >= 3:
                recommendation = f"HIGH COMPLEXITY - {ranking_fields_count} ranking fields detected, indexes recommended"
                success = True
            elif ranking_fields_count >= 2:
                recommendation = f"MODERATE COMPLEXITY - {ranking_fields_count} ranking fields detected, indexes beneficial"
                success = True
            else:
                recommendation = f"LOW COMPLEXITY - {ranking_fields_count} ranking fields detected, indexes optional"
                success = True
            
            self.log_test("Ranking Calculation Complexity", success, recommendation, complexity_analysis)
            return success
            
        except Exception as e:
            self.log_test("Ranking Calculation Complexity", False, "Complexity analysis failed", str(e))
            return False
    
    def test_index_requirements_summary(self):
        """Provide a summary of index requirements based on all tests"""
        try:
            print("\n📋 SUMMARIZING INDEX REQUIREMENTS")
            
            # Analyze all previous test results
            performance_issues = []
            scale_issues = []
            complexity_issues = []
            
            for result in self.test_results:
                if "performance" in result['test'].lower():
                    if not result['success'] or (result['details'] and result['details'].get('avg_time', 0) > 1.0):
                        performance_issues.append(result)
                elif "scale" in result['test'].lower():
                    if result['details'] and result['details'].get('index_recommendation') in ['critical', 'recommended']:
                        scale_issues.append(result)
                elif "complexity" in result['test'].lower():
                    if result['details'] and len(result['details'].get('ranking_fields', [])) >= 2:
                        complexity_issues.append(result)
            
            # Generate index recommendations
            recommendations = {
                "public_profiles_score_index": False,
                "user_profiles_age_index": False,
                "composite_index": False,
                "priority": "low",
                "reasoning": []
            }
            
            if performance_issues:
                recommendations["public_profiles_score_index"] = True
                recommendations["composite_index"] = True
                recommendations["priority"] = "high"
                recommendations["reasoning"].append("Performance issues detected in ranking queries")
            
            if scale_issues:
                recommendations["public_profiles_score_index"] = True
                recommendations["user_profiles_age_index"] = True
                recommendations["composite_index"] = True
                if recommendations["priority"] == "low":
                    recommendations["priority"] = "medium"
                recommendations["reasoning"].append("Database scale requires optimization")
            
            if complexity_issues:
                recommendations["user_profiles_age_index"] = True
                recommendations["composite_index"] = True
                if recommendations["priority"] == "low":
                    recommendations["priority"] = "medium"
                recommendations["reasoning"].append("Complex ranking calculations benefit from indexes")
            
            # Determine overall recommendation
            if recommendations["priority"] == "high":
                message = "HIGH PRIORITY - Database indexes are needed for optimal performance"
                success = False
            elif recommendations["priority"] == "medium":
                message = "MEDIUM PRIORITY - Database indexes are recommended for better performance"
                success = True
            else:
                message = "LOW PRIORITY - Database indexes are optional at current scale"
                success = True
            
            self.log_test("Index Requirements Summary", success, message, recommendations)
            return success
            
        except Exception as e:
            self.log_test("Index Requirements Summary", False, "Summary analysis failed", str(e))
            return False
    
    def run_all_tests(self):
        """Run all database index performance tests"""
        print("🚀 STARTING DATABASE INDEX PERFORMANCE TESTING")
        print("=" * 80)
        
        tests = [
            self.test_leaderboard_query_performance,
            self.test_athlete_profiles_query_performance,
            self.test_database_scale_analysis,
            self.test_ranking_calculation_complexity,
            self.test_index_requirements_summary
        ]
        
        passed = 0
        total = len(tests)
        
        for test in tests:
            if test():
                passed += 1
        
        print("\n" + "=" * 80)
        print(f"📊 DATABASE INDEX TESTING SUMMARY")
        print("=" * 80)
        print(f"✅ PASSED: {passed}")
        print(f"❌ FAILED: {total - passed}")
        print(f"📈 SUCCESS RATE: {(passed/total)*100:.1f}%")
        
        return passed, total

if __name__ == "__main__":
    tester = DatabaseIndexTester()
    passed, total = tester.run_all_tests()
    
    if passed == total:
        print("\n🎉 ALL DATABASE INDEX TESTS PASSED!")
    else:
        print(f"\n⚠️  {total - passed} DATABASE INDEX TESTS FAILED")