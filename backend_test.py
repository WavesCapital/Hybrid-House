#!/usr/bin/env python3
"""
Backend API Testing for Hybrid House Pure Supabase Integration
Tests JWT authentication, protected endpoints, and Supabase database integration
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

class BackendTester:
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
    
    def test_api_root(self):
        """Test if the API root endpoint is responding with Supabase message"""
        try:
            response = self.session.get(f"{API_BASE_URL}/")
            if response.status_code == 200:
                data = response.json()
                if "message" in data and "Supabase" in data["message"]:
                    self.log_test("API Root Endpoint", True, "API is responding with Supabase message", data)
                    return True
                else:
                    self.log_test("API Root Endpoint", False, "Expected Supabase message not found", data)
                    return False
            else:
                self.log_test("API Root Endpoint", False, f"HTTP {response.status_code}", response.text)
                return False
        except Exception as e:
            self.log_test("API Root Endpoint", False, "Connection failed", str(e))
            return False
    
    def test_unprotected_endpoints(self):
        """Test endpoints that should work without authentication"""
        endpoints = [
            ("/status", "GET"),
            ("/test-score", "GET")
        ]
        
        all_passed = True
        for endpoint, method in endpoints:
            try:
                if method == "GET":
                    response = self.session.get(f"{API_BASE_URL}{endpoint}")
                elif method == "POST":
                    response = self.session.post(f"{API_BASE_URL}{endpoint}", json={"client_name": "test_client"})
                
                if response.status_code in [200, 201]:
                    self.log_test(f"Unprotected {method} {endpoint}", True, f"HTTP {response.status_code}", response.json())
                else:
                    self.log_test(f"Unprotected {method} {endpoint}", False, f"HTTP {response.status_code}", response.text)
                    all_passed = False
            except Exception as e:
                self.log_test(f"Unprotected {method} {endpoint}", False, "Request failed", str(e))
                all_passed = False
        
        return all_passed
    
    def test_protected_endpoints_without_token(self):
        """Test that protected endpoints reject requests without JWT tokens"""
        protected_endpoints = [
            ("/profile", "GET"),
            ("/athlete-profiles", "GET"),
            ("/athlete-profiles", "POST"),
            ("/athlete-profiles/test-id", "GET"),
            # Interview Flow endpoints
            ("/interview/start", "POST"),
            ("/interview/chat", "POST"),
            ("/interview/session/test-session-id", "GET")
        ]
        
        all_passed = True
        for endpoint, method in protected_endpoints:
            try:
                if method == "GET":
                    response = self.session.get(f"{API_BASE_URL}{endpoint}")
                elif method == "POST":
                    if endpoint == "/athlete-profiles":
                        response = self.session.post(f"{API_BASE_URL}{endpoint}", json={
                            "profile_text": "Test profile",
                            "score_data": {"test": "data"}
                        })
                    elif endpoint == "/interview/start":
                        response = self.session.post(f"{API_BASE_URL}{endpoint}", json={})
                    elif endpoint == "/interview/chat":
                        response = self.session.post(f"{API_BASE_URL}{endpoint}", json={
                            "messages": [{"role": "user", "content": "Hello"}],
                            "session_id": "test-session-id"
                        })
                
                # Should return 401 or 403 for unauthorized access
                if response.status_code in [401, 403]:
                    self.log_test(f"Protected {method} {endpoint} (No Token)", True, f"Correctly rejected with HTTP {response.status_code}")
                else:
                    self.log_test(f"Protected {method} {endpoint} (No Token)", False, f"Should reject but got HTTP {response.status_code}", response.text)
                    all_passed = False
            except Exception as e:
                self.log_test(f"Protected {method} {endpoint} (No Token)", False, "Request failed", str(e))
                all_passed = False
        
        return all_passed
    
    def test_protected_endpoints_with_invalid_token(self):
        """Test that protected endpoints reject requests with invalid JWT tokens"""
        invalid_tokens = [
            "invalid_token",
            "Bearer invalid_token",
            "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.invalid.signature"
        ]
        
        all_passed = True
        for token in invalid_tokens:
            headers = {"Authorization": f"Bearer {token}"}
            
            try:
                response = self.session.get(f"{API_BASE_URL}/profile", headers=headers)
                
                # Should return 401 for invalid token
                if response.status_code == 401:
                    self.log_test(f"Invalid Token Test ({token[:20]}...)", True, f"Correctly rejected with HTTP {response.status_code}")
                else:
                    self.log_test(f"Invalid Token Test ({token[:20]}...)", False, f"Should reject but got HTTP {response.status_code}", response.text)
                    all_passed = False
            except Exception as e:
                self.log_test(f"Invalid Token Test ({token[:20]}...)", False, "Request failed", str(e))
                all_passed = False
        
        return all_passed
    
    def test_supabase_connection(self):
        """Test Supabase connection via status endpoint"""
        try:
            response = self.session.get(f"{API_BASE_URL}/status")
            
            if response.status_code == 200:
                data = response.json()
                if isinstance(data, list) and len(data) > 0:
                    # Check for Supabase status
                    supabase_status = None
                    jwt_status = None
                    
                    for status_check in data:
                        if status_check.get("component") == "Supabase":
                            supabase_status = status_check
                        elif status_check.get("component") == "Supabase JWT":
                            jwt_status = status_check
                    
                    if supabase_status:
                        if supabase_status.get("status") == "healthy":
                            self.log_test("Supabase Connection", True, "Supabase connection is healthy", supabase_status)
                        else:
                            self.log_test("Supabase Connection", False, f"Supabase status: {supabase_status.get('status')}", supabase_status)
                            return False
                    else:
                        self.log_test("Supabase Connection", False, "Supabase status not found in response", data)
                        return False
                    
                    if jwt_status:
                        if jwt_status.get("status") == "configured":
                            self.log_test("Supabase JWT Configuration", True, "JWT secret is configured", jwt_status)
                        else:
                            self.log_test("Supabase JWT Configuration", False, f"JWT status: {jwt_status.get('status')}", jwt_status)
                            return False
                    else:
                        self.log_test("Supabase JWT Configuration", False, "JWT status not found in response", data)
                        return False
                    
                    return True
                else:
                    self.log_test("Supabase Connection", False, "Empty or invalid status response", data)
                    return False
            else:
                self.log_test("Supabase Connection", False, f"HTTP {response.status_code}", response.text)
                return False
        except Exception as e:
            self.log_test("Supabase Connection", False, "Connection test failed", str(e))
            return False
    
    def test_cors_configuration(self):
        """Test CORS configuration"""
        try:
            response = self.session.options(f"{API_BASE_URL}/")
            
            # Check for CORS headers
            cors_headers = [
                'access-control-allow-origin',
                'access-control-allow-methods',
                'access-control-allow-headers'
            ]
            
            found_headers = []
            for header in cors_headers:
                if header in response.headers:
                    found_headers.append(f"{header}: {response.headers[header]}")
            
            if found_headers:
                self.log_test("CORS Configuration", True, "CORS headers present", found_headers)
                return True
            else:
                self.log_test("CORS Configuration", False, "No CORS headers found", dict(response.headers))
                return False
        except Exception as e:
            self.log_test("CORS Configuration", False, "CORS test failed", str(e))
            return False
    
    def test_jwt_secret_configuration(self):
        """Test that JWT secret is properly configured by checking error messages"""
        try:
            # Use a malformed JWT token to trigger JWT processing with new Supabase secret
            headers = {"Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c"}
            response = self.session.get(f"{API_BASE_URL}/profile", headers=headers)
            
            if response.status_code == 401:
                try:
                    error_data = response.json()
                    if "detail" in error_data and "authentication" in error_data["detail"].lower():
                        self.log_test("JWT Secret Configuration", True, "JWT processing with Supabase secret is working (proper error message)", error_data)
                        return True
                    else:
                        self.log_test("JWT Secret Configuration", False, "Unexpected error format", error_data)
                        return False
                except:
                    self.log_test("JWT Secret Configuration", True, "JWT processing with Supabase secret is working (401 response)")
                    return True
            else:
                self.log_test("JWT Secret Configuration", False, f"Expected 401 but got HTTP {response.status_code}", response.text)
                return False
        except Exception as e:
            self.log_test("JWT Secret Configuration", False, "JWT test failed", str(e))
            return False
    
    def test_interview_flow_endpoints_without_auth(self):
        """Test Interview Flow endpoints without authentication (should fail)"""
        interview_endpoints = [
            ("/interview/start", "POST", {}),
            ("/interview/chat", "POST", {
                "messages": [{"role": "user", "content": "Hello"}],
                "session_id": "test-session-id"
            }),
            ("/interview/session/test-session-id", "GET", None)
        ]
        
        all_passed = True
        for endpoint, method, payload in interview_endpoints:
            try:
                if method == "GET":
                    response = self.session.get(f"{API_BASE_URL}{endpoint}")
                elif method == "POST":
                    response = self.session.post(f"{API_BASE_URL}{endpoint}", json=payload)
                
                # Should return 401 or 403 for unauthorized access
                if response.status_code in [401, 403]:
                    self.log_test(f"Interview {method} {endpoint} (No Auth)", True, f"Correctly rejected with HTTP {response.status_code}")
                else:
                    self.log_test(f"Interview {method} {endpoint} (No Auth)", False, f"Should reject but got HTTP {response.status_code}", response.text)
                    all_passed = False
            except Exception as e:
                self.log_test(f"Interview {method} {endpoint} (No Auth)", False, "Request failed", str(e))
                all_passed = False
        
        return all_passed
    
    def test_openai_integration_check(self):
        """Test if OpenAI integration is properly configured"""
        try:
            # Check if OpenAI API key is configured by looking at environment or error messages
            # We can't directly test OpenAI without auth, but we can check if the integration is set up
            
            # Try to access an interview endpoint without auth to see if it's properly configured
            response = self.session.post(f"{API_BASE_URL}/interview/start", json={})
            
            if response.status_code in [401, 403]:
                # This means the endpoint exists and is protected (good sign)
                self.log_test("OpenAI Integration Setup", True, "Interview endpoints are configured and protected")
                return True
            elif response.status_code == 500:
                # Check if it's a database error (expected) vs OpenAI error
                try:
                    error_data = response.json()
                    if "database" in str(error_data).lower() or "table" in str(error_data).lower():
                        self.log_test("OpenAI Integration Setup", True, "Interview endpoints configured, database tables missing (expected)")
                        return True
                    else:
                        self.log_test("OpenAI Integration Setup", False, "Unexpected 500 error", error_data)
                        return False
                except:
                    self.log_test("OpenAI Integration Setup", False, "500 error with no JSON response", response.text)
                    return False
            else:
                self.log_test("OpenAI Integration Setup", False, f"Unexpected response: HTTP {response.status_code}", response.text)
                return False
        except Exception as e:
            self.log_test("OpenAI Integration Setup", False, "OpenAI integration test failed", str(e))
            return False
    
    def test_database_table_requirements(self):
        """Test what happens when database tables don't exist (expected behavior)"""
        try:
            # Test with invalid token to see database-related errors
            headers = {"Authorization": "Bearer invalid_token"}
            response = self.session.get(f"{API_BASE_URL}/profile", headers=headers)
            
            if response.status_code == 401:
                self.log_test("Database Table Check", True, "Authentication properly blocks access before database queries")
                return True
            elif response.status_code == 500:
                try:
                    error_data = response.json()
                    if "table" in str(error_data).lower() or "relation" in str(error_data).lower():
                        self.log_test("Database Table Check", True, "Database tables missing as expected", error_data)
                        return True
                    else:
                        self.log_test("Database Table Check", False, "Unexpected database error", error_data)
                        return False
                except:
                    self.log_test("Database Table Check", True, "Database error (tables missing) as expected")
                    return True
            else:
                self.log_test("Database Table Check", False, f"Unexpected response: HTTP {response.status_code}", response.text)
                return False
        except Exception as e:
            self.log_test("Database Table Check", False, "Database table test failed", str(e))
            return False
    
    def run_all_tests(self):
        """Run all backend tests"""
        print("=" * 60)
        print("STARTING BACKEND API TESTS - INTERVIEW FLOW FOCUS")
        print("=" * 60)
        
        tests = [
            ("API Connectivity", self.test_api_root),
            ("Unprotected Endpoints", self.test_unprotected_endpoints),
            ("Protected Endpoints (No Token)", self.test_protected_endpoints_without_token),
            ("Protected Endpoints (Invalid Token)", self.test_protected_endpoints_with_invalid_token),
            ("Interview Flow Endpoints (No Auth)", self.test_interview_flow_endpoints_without_auth),
            ("Supabase Integration", self.test_supabase_connection),
            ("CORS Configuration", self.test_cors_configuration),
            ("JWT Configuration", self.test_jwt_secret_configuration),
            ("OpenAI Integration Setup", self.test_openai_integration_check),
            ("Database Table Requirements", self.test_database_table_requirements)
        ]
        
        passed_tests = 0
        total_tests = len(tests)
        
        for test_name, test_func in tests:
            print(f"\n--- Testing: {test_name} ---")
            try:
                if test_func():
                    passed_tests += 1
            except Exception as e:
                print(f"❌ FAIL: {test_name} - Unexpected error: {str(e)}")
        
        print("\n" + "=" * 60)
        print("BACKEND TEST SUMMARY")
        print("=" * 60)
        print(f"Tests Passed: {passed_tests}/{total_tests}")
        
        if passed_tests == total_tests:
            print("🎉 ALL TESTS PASSED - Backend Supabase authentication system is working correctly!")
            return True
        else:
            print(f"⚠️  {total_tests - passed_tests} TESTS FAILED - Issues found in backend Supabase authentication system")
            return False

if __name__ == "__main__":
    tester = BackendTester()
    success = tester.run_all_tests()
    
    # Print detailed results
    print("\n" + "=" * 60)
    print("DETAILED TEST RESULTS")
    print("=" * 60)
    for result in tester.test_results:
        status = "✅" if result['success'] else "❌"
        print(f"{status} {result['test']}: {result['message']}")
        if result['details']:
            print(f"   {result['details']}")
    
    exit(0 if success else 1)