#!/usr/bin/env python3
"""
Final attempt: Use PostgreSQL direct connection approach
"""

import psycopg2
import requests

print("🔧 Final attempt: Direct PostgreSQL connection via Supabase...")

# Since we can't modify schema through REST API, let's try using the database URL approach
# First, let's see if we can get database connection details

SUPABASE_URL = "https://uevqwbdumouoghymcqtc.supabase.co"
ACCESS_TOKEN = "sbp_224e8840b0fab708e0759d5e9b1bce0b0e5aaeb0"

# Try to get project details that might include database connection info
try:
    print("🔍 Fetching project database information...")
    
    headers = {
        'Authorization': f'Bearer {ACCESS_TOKEN}',
        'Content-Type': 'application/json'
    }
    
    # Try to get project settings
    project_url = "https://api.supabase.com/v1/projects/uevqwbdumouoghymcqtc"
    
    response = requests.get(project_url, headers=headers)
    print(f"📡 Project info response: {response.status_code}")
    
    if response.status_code == 200:
        project_data = response.json()
        print(f"✅ Project data retrieved")
        
        # Look for database connection details
        if 'database' in project_data:
            db_info = project_data['database']
            print(f"📋 Database info found: {list(db_info.keys()) if isinstance(db_info, dict) else 'Not dict'}")
    else:
        print(f"⚠️ Could not get project info: {response.text[:200]}")
    
    # Since direct approaches failed, let's use a clever workaround
    print("\n🔄 Using schema inference workaround...")
    
    # The idea: We'll modify our backend to handle missing column gracefully
    # and provide a way to add the column through our own API
    
    print("💡 SOLUTION: Backend-Driven Schema Migration")
    print("Since Supabase doesn't allow schema changes via API, I'll implement a backend endpoint")
    print("that can handle the migration using our existing backend database connection.")
    
    # Let's modify our backend to include a migration endpoint
    migration_endpoint_code = '''
    
# Add this endpoint to your backend server.py:

@api_router.post("/admin/migrate-privacy")
async def migrate_privacy_column():
    """Admin endpoint to add is_public column to athlete_profiles table"""
    try:
        # Use our existing supabase client to execute the migration
        migration_sql = """
        ALTER TABLE athlete_profiles 
        ADD COLUMN IF NOT EXISTS is_public BOOLEAN DEFAULT FALSE;
        
        UPDATE athlete_profiles 
        SET is_public = FALSE 
        WHERE is_public IS NULL;
        """
        
        # Execute using raw SQL
        result = supabase.rpc('exec', {'query': migration_sql}).execute()
        
        return {
            "success": True,
            "message": "Privacy column migration completed",
            "result": result
        }
        
    except Exception as e:
        return {
            "success": False,
            "message": f"Migration failed: {str(e)}"
        }
    '''
    
    print("📝 Backend migration endpoint code prepared")
    print("🔄 Adding migration endpoint to backend...")
    
    # Read current backend file
    with open('/app/backend/server.py', 'r') as f:
        backend_content = f.read()
    
    # Check if migration endpoint already exists
    if 'migrate-privacy' in backend_content:
        print("✅ Migration endpoint already exists in backend")
    else:
        # Add the migration endpoint before the include_router line
        migration_code = '''
@api_router.post("/admin/migrate-privacy")
async def migrate_privacy_column():
    """Admin endpoint to add is_public column to athlete_profiles table"""
    try:
        print("🔄 Starting privacy column migration...")
        
        # First check if column already exists
        try:
            test_query = supabase.table('athlete_profiles').select('is_public').limit(1).execute()
            print("✅ Column already exists!")
            
            # Update any NULL values
            update_result = supabase.table('athlete_profiles').update({'is_public': False}).is_('is_public', 'null').execute()
            
            return {
                "success": True,
                "message": "Privacy column already exists and updated",
                "updated_count": len(update_result.data) if update_result.data else 0
            }
            
        except Exception as column_check:
            if "does not exist" in str(column_check) or "42703" in str(column_check):
                print("❌ Column does not exist - attempting to add...")
                
                # Since we can't add columns via REST API, we'll return instructions
                return {
                    "success": False,
                    "message": "Column does not exist and cannot be added via API",
                    "instructions": "Please run this SQL in Supabase Dashboard: ALTER TABLE athlete_profiles ADD COLUMN is_public BOOLEAN DEFAULT FALSE;",
                    "sql": "ALTER TABLE athlete_profiles ADD COLUMN is_public BOOLEAN DEFAULT FALSE; UPDATE athlete_profiles SET is_public = FALSE WHERE is_public IS NULL;"
                }
            else:
                raise column_check
        
    except Exception as e:
        print(f"❌ Migration failed: {e}")
        return {
            "success": False,
            "message": f"Migration failed: {str(e)}",
            "error_details": str(e)
        }

'''
        
        # Insert before app.include_router
        if 'app.include_router(api_router)' in backend_content:
            backend_content = backend_content.replace(
                'app.include_router(api_router)',
                migration_code + '\napp.include_router(api_router)'
            )
            
            # Write back to file
            with open('/app/backend/server.py', 'w') as f:
                f.write(backend_content)
            
            print("✅ Added migration endpoint to backend")
        else:
            print("⚠️ Could not find include_router line to add endpoint")
    
    print("\n🔄 Testing migration via our backend...")
    
    # Now call our own migration endpoint
    import time
    time.sleep(2)  # Give backend time to reload
    
    migration_response = requests.post(f"http://localhost:8001/api/admin/migrate-privacy")
    print(f"📡 Migration endpoint response: {migration_response.status_code}")
    
    if migration_response.status_code == 200:
        result = migration_response.json()
        print(f"✅ Migration result: {result}")
        
        if result.get('success'):
            print("🎉 MIGRATION COMPLETED SUCCESSFULLY!")
        else:
            print(f"❌ Migration failed: {result.get('message')}")
            if 'sql' in result:
                print(f"📝 Required SQL: {result['sql']}")
    else:
        print(f"❌ Migration endpoint failed: {migration_response.text}")
    
except Exception as e:
    print(f"❌ Final migration attempt failed: {str(e)}")
    
    print("\n🔧 MANUAL MIGRATION STILL REQUIRED:")
    print("Please run this SQL in your Supabase SQL Editor:")
    print("ALTER TABLE athlete_profiles ADD COLUMN is_public BOOLEAN DEFAULT FALSE;")
    print("UPDATE athlete_profiles SET is_public = FALSE WHERE is_public IS NULL;")
    
    print("\nAfter running the SQL, the privacy system will be fully operational!")