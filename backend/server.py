from fastapi import FastAPI, APIRouter, Request, Response
from dotenv import load_dotenv
import httpx
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict
from typing import List
import uuid
from datetime import datetime, timezone


ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Create the main app without a prefix
app = FastAPI()

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")


# Define Models
class StatusCheck(BaseModel):
    model_config = ConfigDict(extra="ignore")  # Ignore MongoDB's _id field
    
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    client_name: str
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class StatusCheckCreate(BaseModel):
    client_name: str

# Add your routes to the router instead of directly to app
@api_router.get("/")
async def root():
    return {"message": "Hello World"}

@api_router.post("/status", response_model=StatusCheck)
async def create_status_check(input: StatusCheckCreate):
    status_dict = input.model_dump()
    status_obj = StatusCheck(**status_dict)
    
    # Convert to dict and serialize datetime to ISO string for MongoDB
    doc = status_obj.model_dump()
    doc['timestamp'] = doc['timestamp'].isoformat()
    
    _ = await db.status_checks.insert_one(doc)
    return status_obj

@api_router.get("/status", response_model=List[StatusCheck])
async def get_status_checks():
    # Exclude MongoDB's _id field from the query results
    status_checks = await db.status_checks.find({}, {"_id": 0}).to_list(1000)
    
    # Convert ISO string timestamps back to datetime objects
    for check in status_checks:
        if isinstance(check['timestamp'], str):
            check['timestamp'] = datetime.fromisoformat(check['timestamp'])
    
    return status_checks

# ---------------------------------------------------------------------------
# DarkSwap passthrough proxy (server-side -> avoids browser CORS / auth issues)
# Maps  /api/ds/<path>  ->  https://darkswap.app/api/swap/<path>
# ---------------------------------------------------------------------------
DS_BASE = "https://darkswap.app/api/swap"
DS_HEADERS = {
    "accept": "application/json",
    "content-type": "application/json",
    "origin": "https://darkswap.app",
    "referer": "https://darkswap.app/swap",
    "user-agent": (
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
        "(KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36"
    ),
}
# Only these path prefixes are allowed to be proxied.
DS_ALLOWED = ("tokens", "chains", "quotes", "orders", "near")


def _ds_allowed(path: str) -> bool:
    return any(path == p or path.startswith(p + "/") or path.startswith(p + "?")
               for p in DS_ALLOWED) or path.split("/")[0] in DS_ALLOWED


@api_router.get("/ds/{path:path}")
async def ds_proxy_get(path: str, request: Request):
    if not _ds_allowed(path):
        return Response(content='{"error":"path not allowed"}', status_code=403,
                        media_type="application/json")
    url = f"{DS_BASE}/{path}"
    params = dict(request.query_params)
    try:
        async with httpx.AsyncClient(timeout=45) as client:
            r = await client.get(url, params=params, headers=DS_HEADERS)
        return Response(content=r.content, status_code=r.status_code,
                        media_type="application/json")
    except httpx.HTTPError as e:
        logger.error(f"ds proxy GET {path} failed: {e}")
        return Response(content='{"error":"upstream unreachable"}', status_code=502,
                        media_type="application/json")


@api_router.post("/ds/{path:path}")
async def ds_proxy_post(path: str, request: Request):
    if not _ds_allowed(path):
        return Response(content='{"error":"path not allowed"}', status_code=403,
                        media_type="application/json")
    url = f"{DS_BASE}/{path}"
    body = await request.body()
    try:
        async with httpx.AsyncClient(timeout=45) as client:
            r = await client.post(url, content=body, headers=DS_HEADERS)
        return Response(content=r.content, status_code=r.status_code,
                        media_type="application/json")
    except httpx.HTTPError as e:
        logger.error(f"ds proxy POST {path} failed: {e}")
        return Response(content='{"error":"upstream unreachable"}', status_code=502,
                        media_type="application/json")


# Include the router in the main app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
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