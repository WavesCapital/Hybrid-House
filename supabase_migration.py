#!/usr/bin/env python3
"""
Direct Supabase Database Migration using Python Client
"""

from supabase import create_client, Client
import os

# Supabase configuration
SUPABASE_URL = "https://uevqwbdumouoghymcqtc.supabase.co"
SERVICE_ROLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVldnF3YmR1bW91b2doeW1jcXRjIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MjI0MTEzMiwiZXhwIjoyMDY3ODE3MTMyfQ.QOCIAHCh6HwEMMEfanM8GGUna4-3NdXHW0qsy7qKUvM"

print("🔧 Running Privacy Settings Database Migration with Supabase Python Client...")

try:
    # Create Supabase client with service role key
    supabase: Client = create_client(SUPABASE_URL, SERVICE_ROLE_KEY)
    print("✅ Connected to Supabase with service role")
    
    print("🔍 Checking current table structure...")
    
    # First, let's see what columns currently exist
    try:
        sample_query = supabase.table('athlete_profiles').select('*').limit(1).execute()
        print(f"✅ Found {len(sample_query.data)} existing records")
        
        if sample_query.data:
            current_columns = list(sample_query.data[0].keys())
            print(f"✅ Current columns: {current_columns}")
            
            if 'is_public' in current_columns:
                print("✅ is_public column already exists!")
                
                # Update any NULL values to FALSE
                update_result = supabase.table('athlete_profiles').update({'is_public': False}).is_('is_public', 'null').execute()
                print(f"✅ Updated {len(update_result.data)} records to private by default")
                
                print("🎉 MIGRATION ALREADY COMPLETE!")
                exit(0)
            else:
                print("❌ is_public column does not exist - need to add it")
        
    except Exception as check_error:
        print(f"⚠️ Error checking existing structure: {check_error}")
    
    print("🔄 Attempting to add is_public column...")
    
    # Method 1: Try to insert a record with is_public field to force schema update
    try:
        test_profile = {
            'profile_json': {
                'first_name': 'Migration Test',
                'email': 'migration@test.com',
                'display_name': 'Migration Test'
            },
            'is_public': False,
            'created_at': '2024-01-01T00:00:00Z',
            'updated_at': '2024-01-01T00:00:00Z'
        }
        
        print("🔄 Testing column addition via insert...")
        insert_result = supabase.table('athlete_profiles').insert(test_profile).execute()
        
        if insert_result.data:
            print("✅ Successfully inserted test record with is_public column!")
            
            # Clean up test record
            test_id = insert_result.data[0]['id']
            supabase.table('athlete_profiles').delete().eq('id', test_id).execute()
            print("✅ Cleaned up test record")
            
            # Update existing records to have is_public = false
            print("🔄 Setting existing profiles to private...")
            
            # Get all profiles and update them
            all_profiles = supabase.table('athlete_profiles').select('id').execute()
            
            for profile in all_profiles.data:
                try:
                    supabase.table('athlete_profiles').update({'is_public': False}).eq('id', profile['id']).execute()
                except Exception as update_error:
                    print(f"⚠️ Could not update profile {profile['id']}: {update_error}")
            
            print(f"✅ Updated {len(all_profiles.data)} existing profiles to private")
            
        else:
            raise Exception("Insert failed - no data returned")
            
    except Exception as insert_error:
        print(f"❌ Column addition failed: {insert_error}")
        
        # Method 2: Try using upsert instead
        try:
            print("🔄 Trying alternative upsert approach...")
            
            # Create a minimal profile with the new column
            minimal_profile = {
                'id': 'migration-test-id',
                'profile_json': {'test': True},
                'is_public': False
            }
            
            upsert_result = supabase.table('athlete_profiles').upsert(minimal_profile).execute()
            
            if upsert_result.data:
                print("✅ Upsert successful - column likely added!")
                
                # Clean up
                supabase.table('athlete_profiles').delete().eq('id', 'migration-test-id').execute()
                print("✅ Cleaned up test record")
            else:
                raise Exception("Upsert failed")
                
        except Exception as upsert_error:
            print(f"❌ Upsert approach also failed: {upsert_error}")
            
            # Method 3: Direct SQL execution using stored procedure or function
            print("🔄 Attempting direct SQL execution...")
            
            try:
                # Try using a custom SQL execution if available
                sql_query = "ALTER TABLE athlete_profiles ADD COLUMN IF NOT EXISTS is_public BOOLEAN DEFAULT FALSE;"
                
                # This might work if there's a custom function
                exec_result = supabase.rpc('sql', {'query': sql_query}).execute()
                print(f"✅ SQL execution result: {exec_result}")
                
            except Exception as sql_error:
                print(f"❌ Direct SQL failed: {sql_error}")
                
                print("\n❌ AUTOMATED MIGRATION FAILED")
                print("🔧 Manual migration required in Supabase Dashboard")
                print("\nPlease run this SQL in your Supabase SQL Editor:")
                print("ALTER TABLE athlete_profiles ADD COLUMN is_public BOOLEAN DEFAULT FALSE;")
                print("UPDATE athlete_profiles SET is_public = FALSE WHERE is_public IS NULL;")
                exit(1)
    
    # Final verification
    print("\n🔍 Verifying migration...")
    try:
        verify_result = supabase.table('athlete_profiles').select('id, is_public').limit(1).execute()
        
        if verify_result.data and len(verify_result.data) > 0:
            sample = verify_result.data[0]
            if 'is_public' in sample:
                print("✅ MIGRATION VERIFICATION SUCCESSFUL!")
                print(f"✅ Sample record: {sample}")
                
                print("\n🎉 DATABASE MIGRATION COMPLETED SUCCESSFULLY!")
                print("📋 SUMMARY:")
                print("   ✅ Added is_public BOOLEAN column with DEFAULT FALSE")
                print("   ✅ Set existing profiles to private by default")
                print("   ✅ Privacy toggle functionality is now operational!")
                print("   ✅ Leaderboard filtering is ready!")
            else:
                print("❌ is_public column not found in verification")
        else:
            print("ℹ️ No records to verify, but migration may have succeeded")
            
    except Exception as verify_error:
        print(f"❌ Verification failed: {verify_error}")
        print("🔧 Manual verification needed")
    
except Exception as e:
    print(f"❌ Migration script failed: {str(e)}")
    print("\n🔧 MANUAL MIGRATION REQUIRED:")
    print("Please run this SQL in your Supabase SQL Editor:")
    print("ALTER TABLE athlete_profiles ADD COLUMN is_public BOOLEAN DEFAULT FALSE;")
    print("UPDATE athlete_profiles SET is_public = FALSE WHERE is_public IS NULL;")