from fastapi import FastAPI, APIRouter, Depends, HTTPException, status
from fastapi.security import HTTPBearer
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from dotenv import load_dotenv
from supabase import create_client, Client
from jose import jwt, JWTError
from pydantic import BaseModel
from typing import Optional, List, Dict, Any
from emergentintegrations.llm.chat import LlmChat, UserMessage
import os
import uuid
import json
import asyncio
from datetime import datetime
import requests

load_dotenv()

app = FastAPI()
api_router = APIRouter(prefix="/api")
security = HTTPBearer()

# Environment variables
SUPABASE_URL = os.environ.get('SUPABASE_URL')
SUPABASE_SERVICE_KEY = os.environ.get('SUPABASE_SERVICE_KEY')
SUPABASE_JWT_SECRET = os.environ.get('SUPABASE_JWT_SECRET')
OPENAI_API_KEY = os.environ.get('OPENAI_API_KEY')
WEBHOOK_URL = "https://wavewisdom.app.n8n.cloud/webhook/b820bc30-989d-4c9b-9b0d-78b89b19b42c"

# Supabase client with service key for backend operations
supabase: Client = create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Configure appropriately for production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Pydantic models
class UserProfile(BaseModel):
    email: str
    name: Optional[str] = None
    created_at: Optional[str] = None

class AthleteProfileData(BaseModel):
    profile_text: str
    score_data: Optional[dict] = None
    created_at: Optional[str] = None

class StatusCheck(BaseModel):
    component: str
    status: str
    details: Optional[str] = None

# Interview Flow Models
class InterviewMessage(BaseModel):
    role: str
    content: str
    timestamp: Optional[str] = None

class InterviewRequest(BaseModel):
    messages: List[InterviewMessage]
    session_id: Optional[str] = None

class InterviewSession(BaseModel):
    id: str
    user_id: str
    status: str
    messages: List[InterviewMessage]
    current_index: int
    created_at: Optional[str] = None
    updated_at: Optional[str] = None

# JWT verification
async def verify_jwt(credentials: HTTPBearer = Depends(security)):
    try:
        token = credentials.credentials
        payload = jwt.decode(
            token, 
            SUPABASE_JWT_SECRET,
            audience="authenticated",
            algorithms=["HS256"]
        )
        return payload
    except JWTError as e:
        print(f"JWT Error: {e}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication token"
        )

# Routes
@api_router.get("/")
async def read_root():
    return {"message": "Hybrid House API with Supabase"}

@api_router.get("/test-score")
async def get_test_score():
    """Test endpoint that returns sample score data with new structure"""
    return [
        {
            "id": "msg_test123",
            "type": "message", 
            "status": "completed",
            "inputsUsed": {
                "bodyWeightLb": 163,
                "vo2Max": 49,
                "mileSeconds": 463,
                "longRunMiles": 7.2,
                "weeklyMiles": 12,
                "hrvMs": 68,
                "restingHrBpm": 48,
                "bench1RmLb": 262.5,
                "squat1RmLb": 0,
                "dead1RmLb": 0
            },
            "strengthScore": 92.1,
            "strengthComment": "Excellent pressing power—your bench is >1.6×BW and already in the 'advanced' range. Fill in squat and dead numbers to round out total-body strength, but upper-body force production is elite for a hybrid athlete.",
            "speedScore": 85.6,
            "speedComment": "A 7:43 mile puts you comfortably under the 8-min barrier; you're ~70 s away from that sub-6. Sharpen speed with weekly tempo/interval work and keep trimming body-fat to move the needle.",
            "vo2Score": 73.8,
            "vo2Comment": "Lab-measured 49 ml/kg still trails elite hybrid range (55–60+). More zone-2 volume and strides will push this up over the next 8–12 weeks.",
            "distanceScore": 70.9,
            "distanceComment": "Solid long run of 7 mi, but ultra aspirations will need 10-13 mi in the near term and 16-20 mi blocks later. Build slowly (+1 mi every other week).",
            "volumeScore": 72.1,
            "volumeComment": "12 mpw is a good foundation, yet true hybrid balance usually starts flourishing at 20-25 mpw. Add a 3-4 mi easy double or extend two weekday runs.",
            "enduranceScore": 75.6,
            "enduranceComment": "Running engine is respectable but still lags behind your lifting; keep layering aerobic miles and targeted speedwork.",
            "recoveryScore": 77.9,
            "recoveryComment": "HRV 68 and RHR 48 show you're bouncing back well—sauna/foam-roll sessions are paying off. Prioritise 8 h sleep to nudge this into the 80s.",
            "balanceBonus": 0,
            "balanceComment": "Strength outpaces endurance by >15 pts—no bonus. Leveling them up will unlock extra score and on-course performance.",
            "hybridPenalty": 4,
            "penaltyComment": "Small deduction for reporting only one true 1-RM. Test or estimate squat/dead to remove this hit next cycle.",
            "hybridScore": 70.9,
            "hybridComment": "You're a muscle-forward hybrid: big bench, decent mile, and fair recovery. Elevate run volume and record full-body maxes to break into the 80-plus club.",
            "tips": [
                "Progress weekly mileage toward 20–25 with 80–90 % of it in zone-2 (easy conversational pace).",
                "Add one quality session: 6×400 m at 5k pace or 3×1 km at 10k pace; recover fully between reps to chip away at the 6-min mile goal.",
                "Cycle a lower-body strength block and formally test squat and deadlift 1-RMs; aim for 1.8×BW squat and 2.2×BW dead to match bench ratio.",
                "Schedule a 10–12 mi long run every other week, building to 16 mi over 3 months to prepare for ultra volume.",
                "Push sleep to 8 h average using a strict bedtime and pre-sleep wind-down; HRV should climb into the 70s.",
                "Stay in a slight 250-300 kcal deficit while holding protein ≥0.8 g/lb to drop the last 8 lb without sacrificing muscle.",
                "Use the Echo bike for low-impact aerobic flush rides on rest days; this adds volume without extra pounding."
            ]
        }
    ]

# Protected routes
@api_router.get("/profile")
async def get_user_profile(user: dict = Depends(verify_jwt)):
    """Get the current user's profile"""
    user_id = user["sub"]
    
    try:
        # Check if user profile exists in Supabase
        result = supabase.table('user_profiles').select("*").eq('user_id', user_id).execute()
        
        if result.data:
            return result.data[0]
        else:
            # Create default profile
            profile_data = {
                "user_id": user_id,
                "email": user.get("email"),
                "name": user.get("user_metadata", {}).get("name"),
                "created_at": datetime.utcnow().isoformat()
            }
            
            insert_result = supabase.table('user_profiles').insert(profile_data).execute()
            return insert_result.data[0]
            
    except Exception as e:
        print(f"Error in get_user_profile: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error retrieving user profile"
        )

@api_router.post("/athlete-profiles")
async def save_athlete_profile(
    profile_data: AthleteProfileData,
    user: dict = Depends(verify_jwt)
):
    """Save an athlete profile for the authenticated user"""
    user_id = user["sub"]
    
    try:
        # Create profile document
        profile_doc = {
            "id": str(uuid.uuid4()),
            "user_id": user_id,
            "profile_text": profile_data.profile_text,
            "score_data": profile_data.score_data,
            "created_at": profile_data.created_at or datetime.utcnow().isoformat(),
            "updated_at": datetime.utcnow().isoformat()
        }
        
        result = supabase.table('athlete_profiles').insert(profile_doc).execute()
        
        return {
            "id": profile_doc["id"],
            "message": "Athlete profile saved successfully"
        }
        
    except Exception as e:
        print(f"Error saving athlete profile: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error saving athlete profile"
        )

@api_router.get("/athlete-profiles")
async def get_athlete_profiles(user: dict = Depends(verify_jwt)):
    """Get all athlete profiles for the authenticated user"""
    user_id = user["sub"]
    
    try:
        result = supabase.table('athlete_profiles').select("*").eq('user_id', user_id).order('created_at', desc=True).execute()
        return result.data
        
    except Exception as e:
        print(f"Error getting athlete profiles: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error retrieving athlete profiles"
        )

@api_router.get("/athlete-profiles/{profile_id}")
async def get_athlete_profile(
    profile_id: str,
    user: dict = Depends(verify_jwt)
):
    """Get a specific athlete profile for the authenticated user"""
    user_id = user["sub"]
    
    try:
        result = supabase.table('athlete_profiles').select("*").eq('id', profile_id).eq('user_id', user_id).execute()
        
        if not result.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Profile not found"
            )
        
        return result.data[0]
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error getting athlete profile: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error retrieving athlete profile"
        )

@api_router.get("/status", response_model=List[StatusCheck])
async def get_status():
    status_checks = []
    
    # Check Supabase connection
    try:
        # Test connection by trying to select from auth.users
        result = supabase.table('user_profiles').select("id").limit(1).execute()
        status_checks.append(StatusCheck(
            component="Supabase",
            status="healthy",
            details="Connection successful"
        ))
    except Exception as e:
        status_checks.append(StatusCheck(
            component="Supabase",
            status="unhealthy",
            details=str(e)
        ))
    
    # Check Supabase JWT configuration
    if SUPABASE_JWT_SECRET:
        status_checks.append(StatusCheck(
            component="Supabase JWT",
            status="configured",
            details="JWT secret is set"
        ))
    else:
        status_checks.append(StatusCheck(
            component="Supabase JWT",
            status="not configured",
            details="JWT secret is missing"
        ))
    
    return status_checks

app.include_router(api_router)

@app.on_event("startup")
async def startup_event():
    print("Starting up Hybrid House API with Supabase...")
    
    # Test Supabase connection
    try:
        # Try to access Supabase
        result = supabase.table('user_profiles').select("id").limit(1).execute()
        print("✅ Successfully connected to Supabase")
    except Exception as e:
        print(f"❌ Failed to connect to Supabase: {e}")

@app.on_event("shutdown")
async def shutdown_event():
    print("Shutting down Hybrid House API...")
