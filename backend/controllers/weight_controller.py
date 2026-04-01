from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
import logging

logger = logging.getLogger("fitlog.weight")

from database import get_db
from models.user_profile import UserProfile
from schemas.weight_log import WeightLogCreate, WeightLogRead
from services.weight_service import WeightService
from services.auth_service import get_current_profile

router = APIRouter(prefix="/api/weight", tags=["Weight"])


@router.get("", response_model=list[WeightLogRead])
async def list_weights(
    limit: int = 100,
    profile: UserProfile = Depends(get_current_profile),
    db: AsyncSession = Depends(get_db),
):
    return await WeightService.list_weights(db, profile, limit)


@router.post("", response_model=WeightLogRead, status_code=201)
async def log_weight(
    data: WeightLogCreate,
    profile: UserProfile = Depends(get_current_profile),
    db: AsyncSession = Depends(get_db),
):
    logger.info(f"User {profile.name} is logging weight: {data.weight_kg}kg")
    return await WeightService.log_weight(db, profile, data)


@router.delete("/{weight_id}", status_code=204)
async def delete_weight(
    weight_id: UUID,
    profile: UserProfile = Depends(get_current_profile),
    db: AsyncSession = Depends(get_db),
):
    logger.info(f"User {profile.name} is deleting weight entry {weight_id}")
    success = await WeightService.delete_weight(db, weight_id, profile.id)
    if not success:
        raise HTTPException(status_code=404, detail="Weight entry not found")
