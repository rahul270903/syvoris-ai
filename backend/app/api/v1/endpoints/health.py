from fastapi import APIRouter, Depends, status
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession
from app.db.session import get_db

router = APIRouter()

@router.get("/health", status_code=status.HTTP_200_OK)
async def liveness():
    """Liveness probe indicating API service is running."""
    return {"status": "ok", "service": "syvoris-api"}

@router.get("/health/ready", status_code=status.HTTP_200_OK)
async def readiness(db: AsyncSession = Depends(get_db)):
    """Readiness probe checking database connectivity."""
    try:
        await db.execute(text("SELECT 1;"))
        return {"status": "ready", "database": "connected"}
    except Exception as e:
        return {"status": "unhealthy", "database": "disconnected", "error": str(e)}
