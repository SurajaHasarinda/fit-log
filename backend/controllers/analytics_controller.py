from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
import logging

logger = logging.getLogger("fitlog.analytics")

from database import get_db
from models.user_profile import UserProfile
from services.analytics_service import AnalyticsService
from services.auth_service import get_current_profile

router = APIRouter(prefix="/api/analytics", tags=["Analytics"])


@router.get("/weight-trend")
async def weight_trend(
    days: int = Query(90, ge=7, le=365),
    profile: UserProfile = Depends(get_current_profile),
    db: AsyncSession = Depends(get_db),
):
    logger.info(f"Computing weight trend for {profile.name} over {days} days")
    return await AnalyticsService.get_weight_trend(db, profile, days)


@router.get("/dashboard-stats")
async def get_dashboard_stats(
    profile: UserProfile = Depends(get_current_profile),
    db: AsyncSession = Depends(get_db),
):
    logger.info(f"Computing dashboard stats for {profile.name}")
    return await AnalyticsService.get_dashboard_stats(db, profile)
