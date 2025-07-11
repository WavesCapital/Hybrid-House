from fastapi import FastAPI, APIRouter, Depends, HTTPException, status
from fastapi.security import HTTPBearer
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
from jose import jwt, JWTError
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field
from typing import List, Optional
import uuid
from datetime import datetime


ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# Environment variables
mongo_url = os.environ['MONGO_URL']
SUPABASE_JWT_SECRET = os.environ.get('SUPABASE_JWT_SECRET')

# MongoDB connection
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Create the main app without a prefix
app = FastAPI()

# Create a router with the /api prefix and security
api_router = APIRouter(prefix="/api")
security = HTTPBearer()

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
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    client_name: str
    timestamp: datetime = Field(default_factory=datetime.utcnow)

class StatusCheckCreate(BaseModel):
    client_name: str

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
async def root():
    return {"message": "Hybrid House API with Authentication"}

@api_router.post("/status", response_model=StatusCheck)
async def create_status_check(input: StatusCheckCreate):
    status_dict = input.dict()
    status_obj = StatusCheck(**status_dict)
    _ = await db.status_checks.insert_one(status_obj.dict())
    return status_obj

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
    profile = await db.user_profiles.find_one({"user_id": user_id})
    
    if not profile:
        # Create default profile
        profile_data = {
            "user_id": user_id,
            "email": user.get("email"),
            "name": user.get("user_metadata", {}).get("name"),
            "created_at": user.get("created_at")
        }
        await db.user_profiles.insert_one(profile_data)
        profile = profile_data
    
    # Convert ObjectId to string if present
    if "_id" in profile:
        profile["_id"] = str(profile["_id"])
    
    return profile

@api_router.post("/athlete-profiles")
async def save_athlete_profile(
    profile_data: AthleteProfileData,
    user: dict = Depends(verify_jwt)
):
    """Save an athlete profile for the authenticated user"""
    user_id = user["sub"]
    
    # Create profile document
    profile_doc = {
        "id": str(uuid.uuid4()),
        "user_id": user_id,
        "profile_text": profile_data.profile_text,
        "score_data": profile_data.score_data,
        "created_at": profile_data.created_at,
        "updated_at": profile_data.created_at
    }
    
    result = await db.athlete_profiles.insert_one(profile_doc)
    
    return {
        "id": profile_doc["id"],
        "message": "Athlete profile saved successfully"
    }

@api_router.get("/athlete-profiles")
async def get_athlete_profiles(user: dict = Depends(verify_jwt)):
    """Get all athlete profiles for the authenticated user"""
    user_id = user["sub"]
    
    profiles = await db.athlete_profiles.find(
        {"user_id": user_id}
    ).sort("created_at", -1).to_list(100)
    
    # Convert ObjectIds to strings
    for profile in profiles:
        profile["_id"] = str(profile["_id"])
    
    return profiles

@api_router.get("/athlete-profiles/{profile_id}")
async def get_athlete_profile(
    profile_id: str,
    user: dict = Depends(verify_jwt)
):
    """Get a specific athlete profile for the authenticated user"""
    user_id = user["sub"]
    
    profile = await db.athlete_profiles.find_one({
        "id": profile_id,
        "user_id": user_id
    })
    
    if not profile:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Profile not found"
        )
    
    profile["_id"] = str(profile["_id"])
    return profile

@api_router.get("/status", response_model=List[StatusCheck])
async def get_status_checks():
    status_checks = await db.status_checks.find().to_list(1000)
    return [StatusCheck(**status_check) for status_check in status_checks]

# Include the router in the main app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
