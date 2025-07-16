import os
from supabase import create_client
from dotenv import load_dotenv

# Load environment variables from backend/.env
load_dotenv('backend/.env')

def add_score_columns():
    """Add missing score columns to athlete_profiles table"""
    # Create Supabase client
    supabase_url = os.environ.get('SUPABASE_URL')
    supabase_key = os.environ.get('SUPABASE_SERVICE_KEY')
    
    if not supabase_url or not supabase_key:
        print("❌ Error: SUPABASE_URL or SUPABASE_SERVICE_KEY not found in environment")
        return False
    
    supabase = create_client(supabase_url, supabase_key)
    
    print('🚀 Adding missing score columns to athlete_profiles table...')
    
    # First, let's check the current table structure
    try:
        result = supabase.table('athlete_profiles').select('*').limit(1).execute()
        if result.data:
            existing_columns = list(result.data[0].keys())
            print(f"✅ Current table columns: {len(existing_columns)} found")
            
            # Check which score columns are missing
            required_score_columns = [
                'hybrid_score', 'strength_score', 'endurance_score', 
                'speed_score', 'vo2_score', 'distance_score', 
                'volume_score', 'recovery_score'
            ]
            
            missing_columns = [col for col in required_score_columns if col not in existing_columns]
            
            if missing_columns:
                print(f"⚠️  Missing score columns: {missing_columns}")
                print("💡 These columns need to be added via Supabase SQL editor or dashboard")
                print("📝 SQL to add missing columns:")
                print("ALTER TABLE athlete_profiles")
                for col in missing_columns:
                    print(f"ADD COLUMN IF NOT EXISTS {col} DECIMAL(5,2),")
                print("ADD COLUMN IF NOT EXISTS dummy_col TEXT; -- Remove this line")
            else:
                print("✅ All required score columns already exist")
        else:
            print("❌ No data found in athlete_profiles table")
            
    except Exception as e:
        print(f"❌ Error checking table structure: {e}")
        return False
    
    return True

if __name__ == "__main__":
    add_score_columns()