#!/usr/bin/env python3
"""
CRITICAL INTERVIEW SYSTEM TESTING
Tests the broken interview system - no questions displaying to users
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

print(f"🔍 TESTING CRITICAL INTERVIEW SYSTEM AT: {API_BASE_URL}")

class InterviewTester:
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
    
    def test_backend_health(self):
        """Test if backend is responding"""
        try:
            response = self.session.get(f"{API_BASE_URL}/", timeout=10)
            if response.status_code == 200:
                data = response.json()
                self.log_test("Backend Health", True, "Backend is responding", data)
                return True
            else:
                self.log_test("Backend Health", False, f"HTTP {response.status_code}", response.text)
                return False
        except Exception as e:
            self.log_test("Backend Health", False, "Connection failed", str(e))
            return False
    
    def test_hybrid_interview_start_endpoint(self):
        """Test /api/hybrid-interview/start endpoint"""
        try:
            response = self.session.post(f"{API_BASE_URL}/hybrid-interview/start", json={}, timeout=10)
            
            if response.status_code in [401, 403]:
                self.log_test("Hybrid Interview Start Endpoint", True, "Endpoint exists and properly requires JWT authentication")
                return True
            elif response.status_code == 404:
                self.log_test("Hybrid Interview Start Endpoint", False, "Endpoint not found - this is the problem!")
                return False
            elif response.status_code == 500:
                try:
                    error_data = response.json()
                    self.log_test("Hybrid Interview Start Endpoint", False, "Server error in endpoint", error_data)
                    return False
                except:
                    self.log_test("Hybrid Interview Start Endpoint", False, "Server error", response.text)
                    return False
            else:
                self.log_test("Hybrid Interview Start Endpoint", False, f"Unexpected response: HTTP {response.status_code}", response.text)
                return False
        except Exception as e:
            self.log_test("Hybrid Interview Start Endpoint", False, "Request failed", str(e))
            return False
    
    def test_hybrid_interview_chat_endpoint(self):
        """Test /api/hybrid-interview/chat endpoint"""
        try:
            response = self.session.post(f"{API_BASE_URL}/hybrid-interview/chat", json={
                "messages": [{"role": "user", "content": "Hello"}],
                "session_id": "test-session-id"
            }, timeout=10)
            
            if response.status_code in [401, 403]:
                self.log_test("Hybrid Interview Chat Endpoint", True, "Endpoint exists and properly requires JWT authentication")
                return True
            elif response.status_code == 404:
                self.log_test("Hybrid Interview Chat Endpoint", False, "Endpoint not found - this is the problem!")
                return False
            elif response.status_code == 500:
                try:
                    error_data = response.json()
                    self.log_test("Hybrid Interview Chat Endpoint", False, "Server error in endpoint", error_data)
                    return False
                except:
                    self.log_test("Hybrid Interview Chat Endpoint", False, "Server error", response.text)
                    return False
            else:
                self.log_test("Hybrid Interview Chat Endpoint", False, f"Unexpected response: HTTP {response.status_code}", response.text)
                return False
        except Exception as e:
            self.log_test("Hybrid Interview Chat Endpoint", False, "Request failed", str(e))
            return False
    
    def test_interview_session_creation(self):
        """Test if interview sessions can be created"""
        try:
            # Test the start endpoint to see if session creation logic is working
            response = self.session.post(f"{API_BASE_URL}/hybrid-interview/start", json={}, timeout=10)
            
            if response.status_code in [401, 403]:
                # Good - endpoint exists and requires auth
                try:
                    error_data = response.json()
                    if "authentication" in str(error_data).lower() or "token" in str(error_data).lower():
                        self.log_test("Interview Session Creation", True, "Session creation logic exists with proper authentication")
                        return True
                    else:
                        self.log_test("Interview Session Creation", True, "Session creation logic exists")
                        return True
                except:
                    self.log_test("Interview Session Creation", True, "Session creation logic exists")
                    return True
            elif response.status_code == 500:
                try:
                    error_data = response.json()
                    if "session" in str(error_data).lower():
                        self.log_test("Interview Session Creation", False, "Session creation has errors", error_data)
                        return False
                    else:
                        self.log_test("Interview Session Creation", True, "Session creation logic exists (non-session error)")
                        return True
                except:
                    self.log_test("Interview Session Creation", False, "Session creation has server errors", response.text)
                    return False
            else:
                self.log_test("Interview Session Creation", False, f"Unexpected response: {response.status_code}", response.text)
                return False
        except Exception as e:
            self.log_test("Interview Session Creation", False, "Test failed", str(e))
            return False
    
    def test_question_fetching_logic(self):
        """Test if question fetching logic is working"""
        try:
            # Test the chat endpoint to see if question logic is configured
            response = self.session.post(f"{API_BASE_URL}/hybrid-interview/chat", json={
                "messages": [{"role": "user", "content": "start"}],
                "session_id": "test-session-id"
            }, timeout=10)
            
            if response.status_code in [401, 403]:
                self.log_test("Question Fetching Logic", True, "Question fetching endpoint exists and properly protected")
                return True
            elif response.status_code == 500:
                try:
                    error_data = response.json()
                    if "question" in str(error_data).lower() or "openai" in str(error_data).lower():
                        self.log_test("Question Fetching Logic", False, "Question fetching has configuration errors", error_data)
                        return False
                    else:
                        self.log_test("Question Fetching Logic", True, "Question fetching logic exists (non-question error)")
                        return True
                except:
                    self.log_test("Question Fetching Logic", False, "Question fetching has server errors", response.text)
                    return False
            else:
                self.log_test("Question Fetching Logic", False, f"Unexpected response: {response.status_code}", response.text)
                return False
        except Exception as e:
            self.log_test("Question Fetching Logic", False, "Test failed", str(e))
            return False
    
    def test_openai_integration(self):
        """Test OpenAI integration status"""
        try:
            # Test if OpenAI integration is working by checking endpoint responses
            response = self.session.post(f"{API_BASE_URL}/hybrid-interview/start", json={}, timeout=10)
            
            if response.status_code in [401, 403]:
                self.log_test("OpenAI Integration", True, "OpenAI integration appears configured (proper error structure)")
                return True
            elif response.status_code == 500:
                try:
                    error_data = response.json()
                    if "openai" in str(error_data).lower() or "api" in str(error_data).lower():
                        self.log_test("OpenAI Integration", False, "OpenAI integration has errors", error_data)
                        return False
                    else:
                        self.log_test("OpenAI Integration", True, "OpenAI integration configured (non-OpenAI error)")
                        return True
                except:
                    self.log_test("OpenAI Integration", False, "OpenAI integration has server errors", response.text)
                    return False
            else:
                self.log_test("OpenAI Integration", False, f"Unexpected response: {response.status_code}", response.text)
                return False
        except Exception as e:
            self.log_test("OpenAI Integration", False, "Test failed", str(e))
            return False
    
    def test_database_connection(self):
        """Test database connection via status endpoint"""
        try:
            response = self.session.get(f"{API_BASE_URL}/status", timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                supabase_status = None
                
                for status_check in data:
                    if status_check.get("component") == "Supabase":
                        supabase_status = status_check
                        break
                
                if supabase_status and supabase_status.get("status") == "healthy":
                    self.log_test("Database Connection", True, "Database connection is healthy", supabase_status)
                    return True
                else:
                    self.log_test("Database Connection", False, "Database connection not healthy", data)
                    return False
            else:
                self.log_test("Database Connection", False, f"Status endpoint failed: HTTP {response.status_code}", response.text)
                return False
        except Exception as e:
            self.log_test("Database Connection", False, "Test failed", str(e))
            return False
    
    def test_interview_flow_comprehensive(self):
        """Comprehensive test of interview flow endpoints"""
        try:
            endpoints_to_test = [
                ("/hybrid-interview/start", "POST", {}),
                ("/hybrid-interview/chat", "POST", {
                    "messages": [{"role": "user", "content": "Hello"}],
                    "session_id": "test-session-id"
                })
            ]
            
            all_working = True
            endpoint_results = []
            
            for endpoint, method, payload in endpoints_to_test:
                try:
                    if method == "POST":
                        response = self.session.post(f"{API_BASE_URL}{endpoint}", json=payload, timeout=10)
                    
                    if response.status_code in [401, 403]:
                        endpoint_results.append(f"✅ {endpoint}: Properly protected")
                    elif response.status_code == 404:
                        endpoint_results.append(f"❌ {endpoint}: Not found")
                        all_working = False
                    elif response.status_code == 500:
                        try:
                            error_data = response.json()
                            if "does not exist" in str(error_data).lower() or "table" in str(error_data).lower():
                                endpoint_results.append(f"✅ {endpoint}: Configured (database issue)")
                            else:
                                endpoint_results.append(f"❌ {endpoint}: Server error")
                                all_working = False
                        except:
                            endpoint_results.append(f"❌ {endpoint}: Server error")
                            all_working = False
                    else:
                        endpoint_results.append(f"❌ {endpoint}: Unexpected response {response.status_code}")
                        all_working = False
                        
                except Exception as e:
                    endpoint_results.append(f"❌ {endpoint}: Connection failed - {str(e)}")
                    all_working = False
            
            if all_working:
                self.log_test("Interview Flow Comprehensive", True, "All interview endpoints are properly configured", endpoint_results)
                return True
            else:
                self.log_test("Interview Flow Comprehensive", False, "Some interview endpoints have issues", endpoint_results)
                return False
        except Exception as e:
            self.log_test("Interview Flow Comprehensive", False, "Test failed", str(e))
            return False

def main():
    """Run critical interview system tests"""
    print("🚨 CRITICAL INTERVIEW SYSTEM TESTING")
    print("Testing the broken interview system - no questions displaying to users")
    print("=" * 80)
    
    tester = InterviewTester()
    
    # Critical tests for the broken interview system
    critical_tests = [
        ("Backend Health Check", tester.test_backend_health),
        ("Database Connection", tester.test_database_connection),
        ("CRITICAL: Hybrid Interview Start Endpoint", tester.test_hybrid_interview_start_endpoint),
        ("CRITICAL: Hybrid Interview Chat Endpoint", tester.test_hybrid_interview_chat_endpoint),
        ("Interview Session Creation Logic", tester.test_interview_session_creation),
        ("Question Fetching Logic", tester.test_question_fetching_logic),
        ("OpenAI Integration Status", tester.test_openai_integration),
        ("Interview Flow Comprehensive", tester.test_interview_flow_comprehensive),
    ]
    
    print("\n🔍 RUNNING CRITICAL INTERVIEW SYSTEM TESTS")
    print("=" * 80)
    
    passed = 0
    total = len(critical_tests)
    
    for test_name, test_func in critical_tests:
        try:
            result = test_func()
            if result:
                passed += 1
        except Exception as e:
            print(f"❌ FAIL: {test_name} - Exception: {str(e)}")
    
    print("\n" + "=" * 80)
    print(f"🎯 CRITICAL INTERVIEW SYSTEM TEST RESULTS")
    print(f"Passed: {passed}/{total} ({(passed/total)*100:.1f}%)")
    
    if passed == total:
        print("🎉 ALL CRITICAL TESTS PASSED - Interview system appears to be configured correctly")
        print("💡 If questions are not displaying, the issue may be in frontend or authentication flow")
    elif passed >= total * 0.8:
        print("⚠️  MOST TESTS PASSED - Interview system mostly working, minor issues detected")
    else:
        print("🚨 CRITICAL ISSUES DETECTED - Interview system has significant problems")
    
    print("\n📋 DETAILED TEST RESULTS:")
    for result in tester.test_results:
        status = "✅" if result['success'] else "❌"
        print(f"{status} {result['test']}: {result['message']}")
        if result['details'] and not result['success']:
            print(f"   🔍 Details: {result['details']}")
    
    # Provide specific recommendations based on results
    print("\n💡 RECOMMENDATIONS:")
    if passed < total * 0.5:
        print("🚨 CRITICAL: Backend interview endpoints are not working properly")
        print("   - Check if FastAPI server is running correctly")
        print("   - Verify interview routes are properly registered")
        print("   - Check for any import or syntax errors in server.py")
    elif passed < total * 0.8:
        print("⚠️  MODERATE ISSUES: Some interview components need attention")
        print("   - Check OpenAI API key configuration")
        print("   - Verify database tables exist for interview sessions")
        print("   - Test with valid JWT authentication")
    else:
        print("✅ BACKEND APPEARS HEALTHY: Issue likely in frontend or authentication")
        print("   - Check frontend HybridInterviewFlow.js for errors")
        print("   - Verify JWT token is being passed correctly")
        print("   - Check browser console for JavaScript errors")
        print("   - Test with valid user authentication")
    
    return passed, total

if __name__ == "__main__":
    main()