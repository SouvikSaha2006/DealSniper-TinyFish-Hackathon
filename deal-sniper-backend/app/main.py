import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import uvicorn

from app.config import get_settings
from app.routers import audit_router, health_router

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)
logger = logging.getLogger("deal_sniper.main")


@asynccontextmanager
async def lifespan(app: FastAPI):
    settings = get_settings()
    logger.info("Initializing DealSniper Backend...")
    logger.info(f"Environment: {settings.ENVIRONMENT}")
    logger.info(
        f"TinyFish API Key configured: {'YES' if settings.TINYFISH_API_KEY and settings.TINYFISH_API_KEY != 'your_tinyfish_api_key_here' else 'NO (Deterministic Mock fallback active)'}"
    )
    yield
    logger.info("Shutting down DealSniper Backend...")


app = FastAPI(
    title="DealSniper Backend",
    description="Autonomous web agent backend for auditing dynamic e-commerce checkout flows and uncovering drip pricing using TinyFish Web Agent API.",
    version="1.0.0",
    lifespan=lifespan,
)

# Configure wide-open CORS for frontend and hackathon demo integration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["*"],
)

# Mount Routers
app.include_router(health_router)
app.include_router(audit_router)


@app.get("/")
async def root():
    """Root info endpoint."""
    return {
        "name": "DealSniper Backend",
        "description": "Autonomous checkout auditor powered by TinyFish Web Agent API",
        "version": "1.0.0",
        "documentation": "/docs",
        "endpoints": {
            "health": "GET /api/health",
            "presets": "GET /api/presets",
            "audit_stream_post": "POST /api/audit/stream",
            "audit_stream_get": "GET /api/audit/stream?query=Sony+WH-1000XM5&postal_code=560001",
            "audit_strip_post": "POST /api/audit/strip-stream",
        },
    }


if __name__ == "__main__":
    settings = get_settings()
    uvicorn.run(
        "app.main:app",
        host=settings.HOST,
        port=settings.PORT,
        reload=True,
    )
