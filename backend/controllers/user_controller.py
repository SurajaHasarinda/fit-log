from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
import logging

logger = logging.getLogger("fitlog.user")

from database import get_db
from models.user_profile import UserProfile
from schemas.user_profile import UserProfileRead, UserProfileUpdate, GymDaysUpdate
from services.user_service import UserService
from services.auth_service import get_current_profile

router = APIRouter(prefix="/api/profile", tags=["Profile"])


@router.get("", response_model=UserProfileRead)
async def get_profile(
    profile: UserProfile = Depends(get_current_profile),
):
    return profile


@router.put("", response_model=UserProfileRead)
async def update_profile(
    data: UserProfileUpdate,
    profile: UserProfile = Depends(get_current_profile),
    db: AsyncSession = Depends(get_db),
):
    logger.info(f"User {profile.id} is updating their profile with data: {data.model_dump(exclude_unset=True)}")
    updated = await UserService.update_profile(db, profile, data)
    return updated


@router.put("/gym-days", response_model=UserProfileRead)
async def update_gym_days(
    data: GymDaysUpdate,
    profile: UserProfile = Depends(get_current_profile),
    db: AsyncSession = Depends(get_db),
):
    updated = await UserService.update_gym_days(db, profile, data)
    return updated
