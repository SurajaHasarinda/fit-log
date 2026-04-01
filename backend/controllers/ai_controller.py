from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
import logging

logger = logging.getLogger("fitlog.ai")

from database import get_db
from models.user_profile import UserProfile
from schemas.ai import AIAnalysisResponse
from services.ai_service import AIService
from services.auth_service import get_current_profile

router = APIRouter(prefix="/api/ai", tags=["AI"])


@router.post("/analyze", response_model=AIAnalysisResponse)
async def analyze_plan(
    profile: UserProfile = Depends(get_current_profile),
    db: AsyncSession = Depends(get_db),
):
    """Analyze the current workout plan for muscle group coverage."""
    logger.info(f"User {profile.name} requested AI plan analysis")
    insights = await AIService.analyze_plan(db, profile)
    logger.info(f"AI analysis completed for {profile.name}")
    return insights

@router.get("/insights", response_model=AIAnalysisResponse)
async def get_insights(
    profile: UserProfile = Depends(get_current_profile),
    db: AsyncSession = Depends(get_db),
):
    """Get the cached AI analysis for the current workout plan without analyzing again."""
    insights = await AIService.get_insights(db, profile)
    if not insights:
        return AIAnalysisResponse(
            summary="No AI analysis has run for your current plan yet. Click 'Analyze Current Plan' to run it.",
            covered_muscle_groups=[],
            missing_muscle_groups=[],
            new_exercises=[],
            general_tips=[],
            exercise_advice=[]
        )
    return insights
