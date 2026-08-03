from fastapi import FastAPI, APIRouter, HTTPException, Query
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict
from typing import List, Optional, Literal
import uuid
from datetime import datetime, timezone


ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

app = FastAPI()
api_router = APIRouter(prefix="/api")

# ---------- Models ----------
GameId = Literal["dontTouchRed", "towerBloxx", "matiks", "reflex"]


class ScoreCreate(BaseModel):
    game: GameId
    player: str = Field(default="Anon", max_length=100)
    score: float  # higher is better for all games (reflex uses inverted score)
    display: Optional[str] = None  # human-readable score e.g. "212 ms"


class ScoreEntry(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    game: GameId
    player: str
    score: float
    display: Optional[str] = None
    created_at: str


# ---------- Routes ----------
@api_router.get("/")
async def root():
    return {"message": "HyperArcade API online"}


@api_router.post("/leaderboard", response_model=ScoreEntry)
async def submit_score(payload: ScoreCreate):
    # sanitise player name
    player = payload.player.strip()[:20] or "Anon"
    entry = {
        "id": str(uuid.uuid4()),
        "game": payload.game,
        "player": player,
        "score": float(payload.score),
        "display": payload.display,
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    await db.arcade_scores.insert_one(entry)
    return ScoreEntry(**entry)


@api_router.get("/leaderboard/{game}", response_model=List[ScoreEntry])
async def get_leaderboard(game: GameId, limit: int = Query(10, ge=1, le=50)):
    cursor = db.arcade_scores.find({"game": game}, {"_id": 0}).sort("score", -1).limit(limit)
    docs = await cursor.to_list(length=limit)
    return [ScoreEntry(**d) for d in docs]


@api_router.get("/leaderboard", response_model=dict)
async def get_all_leaderboards(limit: int = Query(5, ge=1, le=20)):
    games = ["dontTouchRed", "towerBloxx", "matiks", "reflex"]
    result = {}
    for g in games:
        cursor = db.arcade_scores.find({"game": g}, {"_id": 0}).sort("score", -1).limit(limit)
        result[g] = await cursor.to_list(length=limit)
    return result


app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
