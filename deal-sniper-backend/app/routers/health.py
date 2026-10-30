import time
from fastapi import APIRouter
from app.config import get_settings

router = APIRouter(prefix="/api", tags=["Health"])


@router.get("/health")
async def health_check():
    """Health check endpoint to verify backend status and API configuration."""
    settings = get_settings()
    has_api_key = bool(settings.TINYFISH_API_KEY and settings.TINYFISH_API_KEY != "your_tinyfish_api_key_here")

    return {
        "status": "ok",
        "service": "deal-sniper-backend",
        "version": "1.0.0",
        "environment": settings.ENVIRONMENT,
        "tinyfish_configured": has_api_key,
        "mock_available": True,
        "timestamp": time.time(),
    }
