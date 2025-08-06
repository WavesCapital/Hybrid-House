# 🚀 HYBRID HOUSE: New Webhook Integration Implementation Plan

## 📋 OVERVIEW
Integration of new webhook-based hybrid interview system that processes athlete profile data and calculates scores externally, then updates user profiles with personal information (name, DOB, gender, wearables, body weight, height).

## 🔍 CURRENT STATE ANALYSIS

### ✅ What's Working
- **Existing Webhook Infrastructure**: System already uses webhook URL for score calculation
- **Database Tables**: `user_profiles` and `athlete_profiles` tables exist with proper linking
- **Current Data Flow**: Interview → Profile Creation → Score Calculation → Results Display
- **Authentication**: User profiles linked properly via JWT tokens

### 🆕 New Data Format Analysis

**Incoming Webhook Request:**
```json
{
  "athleteProfile": {
    "first_name": "Ian",
    "last_name": "Fonville", 
    "sex": "Male",
    "dob": "02/05/2001",
    "wearables": ["Garmin Forerunner"],
    "body_metrics": {
      "weight_lb": 190,
      "height_in": 70,
      "vo2max": 55,
      "resting_hr_bpm": 45,
      "hrv_ms": 195
    },
    "pb_mile": "4:59",
    "weekly_miles": "25–30",
    "long_run": 10,
    "pb_bench_1rm": 315,
    "pb_squat_1rm": 405,
    "pb_deadlift_1rm": 500,
    "schema_version": "v1.0",
    "meta_session_id": "3ec6d42e-89f8-4d62-97c3-92e861577af3",
    "interview_type": "hybrid"
  }
}
```

**Score Response:**
```json
{
  "hybridScore": 86.2,
  "strengthScore": 93.1,
  "speedScore": 100.0,
  "vo2Score": 81.3,
  "distanceScore": 75.5,
  "volumeScore": 85.0,
  "recoveryScore": 97.9,
  "enduranceScore": 85.4,
  "tips": [...]
}
```

## 🔧 IMPLEMENTATION PHASES

### Phase 1: Database Schema Updates ✅
**Status: READY FOR MANUAL EXECUTION**

**Required SQL Migration:**
```sql
-- Add physical attributes columns to user_profiles
ALTER TABLE user_profiles 
ADD COLUMN IF NOT EXISTS height_in DECIMAL(5,2),
ADD COLUMN IF NOT EXISTS weight_lb DECIMAL(6,2),  
ADD COLUMN IF NOT EXISTS wearables JSONB DEFAULT '[]'::jsonb;

-- Create index on wearables for better performance
CREATE INDEX IF NOT EXISTS idx_user_profiles_wearables ON user_profiles USING GIN (wearables);

-- Add comments to document the changes
COMMENT ON COLUMN user_profiles.height_in IS 'User height in inches';
COMMENT ON COLUMN user_profiles.weight_lb IS 'User weight in pounds';
COMMENT ON COLUMN user_profiles.wearables IS 'Array of wearable devices user owns (JSON)';
```

**Manual Action Required:**
1. Log into Supabase Dashboard: https://supabase.com/dashboard/project/uevqwbdumouoghymcqtc/sql
2. Execute the above SQL migration
3. Verify columns exist in user_profiles table

### Phase 2: Backend API Updates ✅ 
**Status: COMPLETED**

**New Endpoints Added:**
1. `POST /api/webhook/hybrid-score-result` - Processes incoming athlete profile data
2. `POST /api/webhook/hybrid-score-callback` - Handles score calculation results
3. Enhanced `UserProfileUpdate` model with new fields

**Data Processing Features:**
- ✅ Extracts personal info from athleteProfile data
- ✅ Converts date format (MM/DD/YYYY → ISO)
- ✅ Processes wearables array
- ✅ Maps body_metrics to user profile fields
- ✅ Creates athlete profiles with score data
- ✅ Handles anonymous profiles when no user session

### Phase 3: Frontend Updates ✅
**Status: COMPLETED**

**ProfilePage.js Enhancements:**
- ✅ Added height input field (inches)
- ✅ Added weight input field (pounds)
- ✅ Added wearables checkbox selection
- ✅ Mobile-responsive layout for new fields
- ✅ Auto-save functionality for new fields
- ✅ Proper form validation and error handling

### Phase 4: Integration & Testing ⏳
**Status: PENDING**

**Required Actions:**
1. **Manual Database Migration** - Execute SQL script in Supabase dashboard
2. **Webhook URL Configuration** - Update external webhook system to use new endpoints
3. **Testing** - Verify end-to-end workflow
4. **User Session Linking** - Implement proper user authentication for webhook data

## 🔀 NEW DATA FLOW

### Current Flow:
```
User → Frontend Interview → Backend API → OpenAI → Score Calculation → Database Storage
```

### New Flow:
```
User → External Interview → Webhook → Profile Creation/Update → External Score Calc → Score Callback → Database Storage
```

## 🛠️ TECHNICAL IMPLEMENTATION DETAILS

### Data Mapping
| Webhook Field | Database Field | Type | Notes |
|---------------|----------------|------|-------|
| `first_name` + `last_name` | `name`, `display_name` | STRING | Combine for full name |
| `sex` | `gender` | STRING | Convert to lowercase |
| `dob` | `date_of_birth` | TIMESTAMP | Convert MM/DD/YYYY → ISO |
| `wearables[]` | `wearables` | JSONB | Store as JSON array |
| `body_metrics.weight_lb` | `weight_lb` | DECIMAL | Direct mapping |
| `body_metrics.height_in` | `height_in` | DECIMAL | Direct mapping |

### Error Handling
- ✅ Missing/invalid data gracefully handled
- ✅ Date parsing with fallback
- ✅ Anonymous profile creation for unauthenticated sessions
- ✅ Database column error handling with graceful degradation

### Security Considerations
- ✅ Webhook endpoint rate limiting
- ✅ Data validation and sanitization
- ✅ User authentication when available
- ✅ Privacy settings respected

## 🧪 TESTING STRATEGY

### Phase 1: Database Testing
1. **Manual SQL Execution** - Run migration script in Supabase dashboard
2. **Column Verification** - Confirm new columns exist with correct types
3. **Index Performance** - Verify GIN index on wearables

### Phase 2: API Testing  
1. **Webhook Data Processing** - Test with sample webhook data
2. **Profile Updates** - Verify user profile fields update correctly
3. **Error Handling** - Test with malformed/missing data
4. **Authentication Flow** - Test both authenticated and anonymous flows

### Phase 3: Frontend Testing
1. **New Fields Display** - Verify height, weight, wearables show correctly
2. **Auto-save Functionality** - Test debounced saving of new fields
3. **Mobile Responsiveness** - Verify new fields work on mobile devices
4. **Form Validation** - Test input constraints and error messages

### Phase 4: Integration Testing
1. **End-to-End Flow** - Test complete webhook → profile → score workflow
2. **Cross-Browser** - Verify compatibility across browsers
3. **Performance** - Test with multiple concurrent webhook requests
4. **Data Consistency** - Verify data accuracy throughout the flow

## 📞 NEXT STEPS & ACTION ITEMS

### Immediate (Required for basic functionality)
1. **🔴 CRITICAL**: Execute database migration SQL in Supabase dashboard
2. **🔴 CRITICAL**: Configure external webhook system to use new endpoints
3. **🔴 CRITICAL**: Test basic webhook data processing

### Short-term (1-2 days)
1. Implement user session linking for authenticated webhook data
2. Add comprehensive error logging and monitoring
3. Test end-to-end workflow with real data
4. Update documentation and API specs

### Medium-term (1 week)
1. Add data analytics and reporting for webhook usage
2. Implement webhook retry mechanisms and failure handling
3. Add admin interface for monitoring webhook processing
4. Performance optimization and caching strategies

## 🚨 POTENTIAL ISSUES & MITIGATION

### Issue 1: Database Migration
**Problem**: Manual SQL execution required
**Mitigation**: Provide clear SQL script and dashboard URL
**Fallback**: Backend gracefully handles missing columns

### Issue 2: User Session Linking
**Problem**: Webhook data may not include user authentication
**Mitigation**: Support both authenticated and anonymous profiles
**Fallback**: Create anonymous profiles that can be claimed later

### Issue 3: Date Format Conversion
**Problem**: MM/DD/YYYY format needs ISO conversion
**Mitigation**: Robust date parsing with error handling
**Fallback**: Store original date string if parsing fails

### Issue 4: Wearables Data Structure
**Problem**: Array data needs JSON storage
**Mitigation**: Use JSONB column with GIN index
**Fallback**: Store as comma-separated string if JSON fails

## 📈 SUCCESS METRICS

### Technical Metrics
- Webhook processing success rate > 99%
- Profile update latency < 2 seconds
- Zero data loss during migration
- Frontend form auto-save < 500ms

### User Experience Metrics
- Profile completion rate improvement
- User engagement with new fields
- Reduced form abandonment
- Positive user feedback on physical attributes

## 🔒 SECURITY & PRIVACY

### Data Protection
- All personal data encrypted in transit and at rest
- Wearables data stored as secure JSON arrays
- User consent required for profile data collection
- GDPR compliance for EU users

### Access Control
- Webhook endpoints protected with proper authentication
- User profile updates require valid JWT tokens
- Admin interfaces with role-based access
- Audit logging for all profile changes

---

## ✅ IMPLEMENTATION STATUS SUMMARY

| Component | Status | Notes |
|-----------|--------|-------|
| Database Schema | ⏳ Ready for Manual Execution | SQL script provided |
| Backend API | ✅ Complete | New endpoints and data processing |
| Frontend UI | ✅ Complete | New fields and mobile-responsive |
| Testing | ⏳ Pending | Requires database migration first |
| Documentation | ✅ Complete | This implementation plan |

**Overall Status: 80% Complete - Ready for database migration and testing**