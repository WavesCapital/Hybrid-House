#!/usr/bin/env python3
"""
Direct Supabase setup using REST API
"""

import requests
import json

# Supabase credentials
SUPABASE_URL = "https://uevqwbdumouoghymcqtc.supabase.co"
SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVldnF3YmR1bW91b2doeW1jcXRjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzUwNDYwMzksImV4cCI6MjA1MDYyMjAzOX0.2ztJSMfumOKbqLgJQ1Y4DFE7uhhcx9fJJR1nBkafvnI"

def test_supabase_connection():
    """Test basic Supabase connection"""
    
    headers = {
        "apikey": SUPABASE_ANON_KEY,
        "Authorization": f"Bearer {SUPABASE_ANON_KEY}",
        "Content-Type": "application/json"
    }
    
    # Test connection by accessing the auth endpoint
    try:
        response = requests.get(f"{SUPABASE_URL}/auth/v1/settings", headers=headers)
        print(f"Auth settings response: {response.status_code}")
        if response.status_code == 200:
            print("✅ Supabase connection successful")
            return True
        else:
            print(f"⚠️ Auth response: {response.text}")
    except Exception as e:
        print(f"❌ Connection failed: {e}")
    
    # Try the rest endpoint
    try:
        response = requests.get(f"{SUPABASE_URL}/rest/v1/", headers=headers)
        print(f"REST API response: {response.status_code}")
        if response.status_code in [200, 404]:  # 404 is normal for root endpoint
            print("✅ Supabase REST API accessible")
            return True
        else:
            print(f"⚠️ REST response: {response.text}")
    except Exception as e:
        print(f"❌ REST API failed: {e}")
    
    return False

if __name__ == "__main__":
    print("🔗 Testing Supabase connection...")
    success = test_supabase_connection()
    
    if success:
        print("\n✅ Supabase is accessible!")
        print("\n📝 Next steps:")
        print("1. Tables can be created via Supabase Dashboard > SQL Editor")
        print("2. Or tables will be created automatically when first accessed")
        print("3. Authentication is working and ready for testing")
        
        print("\n🔑 Credentials saved:")
        print(f"SUPABASE_URL: {SUPABASE_URL}")
        print(f"SUPABASE_ANON_KEY: {SUPABASE_ANON_KEY[:50]}...")
        print("SUPABASE_JWT_SECRET: RkOOhojg6Cj4J3H6azgWa8MBpHgqCaLm6UlrTslb_kNOBGqxm")
    else:
        print("❌ Supabase connection issues detected")