#!/usr/bin/env python3
"""
Test script to verify Supabase signup works without email confirmation
"""

import requests
import json
import time

# Supabase credentials
SUPABASE_URL = "https://uevqwbdumouoghymcqtc.supabase.co"
SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVldnF3YmR1bW91b2doeW1jcXRjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTIyNDExMzIsImV4cCI6MjA2NzgxNzEzMn0.qiHqI2PMplBCKNQkgrRMF4d-8nx10XrQEqwg33yKNZ8"

def test_signup_without_confirmation():
    """Test signup flow without email confirmation"""
    
    headers = {
        "apikey": SUPABASE_ANON_KEY,
        "Authorization": f"Bearer {SUPABASE_ANON_KEY}",
        "Content-Type": "application/json"
    }
    
    # Generate a unique test email
    timestamp = int(time.time())
    test_email = f"test+{timestamp}@hybridhouse.com"
    test_password = "TestPassword123!"
    
    print(f"🧪 Testing signup with: {test_email}")
    
    # Try to sign up
    signup_data = {
        "email": test_email,
        "password": test_password
    }
    
    try:
        response = requests.post(
            f"{SUPABASE_URL}/auth/v1/signup",
            headers=headers,
            json=signup_data
        )
        
        print(f"Signup response status: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            print("✅ Signup successful!")
            
            if data.get("user") and data.get("session"):
                print("✅ User logged in immediately (email confirmation disabled)")
                print(f"User ID: {data['user']['id']}")
                print(f"Email: {data['user']['email']}")
                print(f"Session token: {data['session']['access_token'][:50]}...")
                return True
            elif data.get("user") and not data.get("session"):
                print("⚠️ User created but not logged in (email confirmation still enabled)")
                print("Please disable email confirmation in Supabase dashboard")
                return False
            else:
                print("❌ Unexpected response format")
                print(json.dumps(data, indent=2))
                return False
        else:
            print(f"❌ Signup failed: {response.status_code}")
            print(response.text)
            return False
            
    except Exception as e:
        print(f"❌ Error during signup test: {e}")
        return False

def test_login():
    """Test if login endpoint is working"""
    
    headers = {
        "apikey": SUPABASE_ANON_KEY,
        "Authorization": f"Bearer {SUPABASE_ANON_KEY}",
        "Content-Type": "application/json"
    }
    
    # Try login with dummy credentials (should fail but show endpoint works)
    login_data = {
        "email": "test@example.com",
        "password": "wrongpassword"
    }
    
    try:
        response = requests.post(
            f"{SUPABASE_URL}/auth/v1/token?grant_type=password",
            headers=headers,
            json=login_data
        )
        
        if response.status_code == 400:
            print("✅ Login endpoint is working (expected auth failure)")
            return True
        else:
            print(f"⚠️ Unexpected login response: {response.status_code}")
            return False
            
    except Exception as e:
        print(f"❌ Error testing login: {e}")
        return False

if __name__ == "__main__":
    print("🔐 Testing Supabase Authentication Setup...")
    print()
    
    # Test login endpoint
    print("1. Testing login endpoint...")
    if test_login():
        print("   ✅ Login endpoint responsive")
    print()
    
    # Test signup
    print("2. Testing signup without email confirmation...")
    if test_signup_without_confirmation():
        print("   ✅ Signup working correctly - email confirmation disabled!")
        print()
        print("🎉 Ready for easy testing!")
        print("   - Users can sign up and immediately use the app")
        print("   - No email confirmation step required")
        print("   - Perfect for development and testing")
    else:
        print("   ⚠️ Email confirmation may still be enabled")
        print()
        print("📋 Next steps:")
        print("   1. Go to: https://supabase.com/dashboard/project/uevqwbdumouoghymcqtc")
        print("   2. Navigate: Authentication > Settings")
        print("   3. Disable: 'Enable email confirmations'")
        print("   4. Save settings")
        print("   5. Run this test again")
    print()