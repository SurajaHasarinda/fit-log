from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
import logging

logger = logging.getLogger("fitlog.plans")

from database import get_db
from models.user_profile import UserProfile
from schemas.workout_plan import (
    WorkoutPlanCreate, WorkoutPlanRead, WorkoutPlanSummary, WorkoutPlanUpdate,
)
from schemas.workout_day import WorkoutDayCreate, WorkoutDayRead, WorkoutDayUpdate
from services.plan_service import PlanService
from services.auth_service import get_current_profile

router = APIRouter(prefix="/api/plans", tags=["Plans"])


@router.get("", response_model=list[WorkoutPlanSummary])
async def list_plans(
    profile: UserProfile = Depends(get_current_profile),
    db: AsyncSession = Depends(get_db),
):
    return await PlanService.list_plans(db, profile)


@router.post("", response_model=WorkoutPlanRead, status_code=201)
async def create_plan(
    data: WorkoutPlanCreate,
    profile: UserProfile = Depends(get_current_profile),
    db: AsyncSession = Depends(get_db),
):
    logger.info(f"User {profile.name} is creating a new plan: {data.name}")
    return await PlanService.create_plan(db, profile, data)


@router.get("/{plan_id}", response_model=WorkoutPlanRead)
async def get_plan(
    plan_id: UUID,
    profile: UserProfile = Depends(get_current_profile),
    db: AsyncSession = Depends(get_db),
):
    plan = await PlanService.get_plan(db, plan_id)
    if not plan or plan.user_id != profile.id:
        raise HTTPException(status_code=404, detail="Plan not found")
    return plan


@router.put("/{plan_id}", response_model=WorkoutPlanRead)
async def update_plan(
    plan_id: UUID,
    data: WorkoutPlanUpdate,
    profile: UserProfile = Depends(get_current_profile),
    db: AsyncSession = Depends(get_db),
):
    plan = await PlanService.get_plan(db, plan_id)
    if not plan or plan.user_id != profile.id:
        raise HTTPException(status_code=404, detail="Plan not found")
    plan = await PlanService.update_plan(db, plan_id, data)
    return plan


@router.post("/{plan_id}/duplicate", response_model=WorkoutPlanRead)
async def duplicate_plan(
    plan_id: UUID,
    profile: UserProfile = Depends(get_current_profile),
    db: AsyncSession = Depends(get_db),
):
    logger.info(f"User {profile.name} is duplicating plan {plan_id}")
    plan = await PlanService.get_plan_raw(db, plan_id)
    if not plan or plan.user_id != profile.id:
        logger.warning(f"Duplicate failed: Plan {plan_id} not found or not owned by {profile.name}")
        raise HTTPException(status_code=404, detail="Plan not found")
    duplicated_plan = await PlanService.duplicate_plan(db, profile, plan_id)
    logger.info(f"Plan duplicated successfully. New Plan ID: {duplicated_plan.id}")
    return duplicated_plan

@router.delete("/{plan_id}", status_code=204)
async def delete_plan(
    plan_id: UUID,
    profile: UserProfile = Depends(get_current_profile),
    db: AsyncSession = Depends(get_db),
):
    plan = await PlanService.get_plan_raw(db, plan_id)
    if not plan or plan.user_id != profile.id:
        raise HTTPException(status_code=404, detail="Plan not found")
    await PlanService.delete_plan(db, plan_id)


@router.put("/{plan_id}/set-current", response_model=WorkoutPlanRead)
async def set_current_plan(
    plan_id: UUID,
    profile: UserProfile = Depends(get_current_profile),
    db: AsyncSession = Depends(get_db),
):
    plan = await PlanService.set_current(db, profile, plan_id)
    if not plan:
        raise HTTPException(status_code=404, detail="Plan not found")
    return plan


# --- Workout Day Endpoints ---

@router.post("/{plan_id}/days", response_model=WorkoutDayRead, status_code=201)
async def add_day(
    plan_id: UUID,
    data: WorkoutDayCreate,
    profile: UserProfile = Depends(get_current_profile),
    db: AsyncSession = Depends(get_db),
):
    # Verify plan ownership
    plan = await PlanService.get_plan_raw(db, plan_id)
    if not plan or plan.user_id != profile.id:
        raise HTTPException(status_code=404, detail="Plan not found")
    return await PlanService.add_day(db, plan_id, data)


@router.put("/days/{day_id}", response_model=WorkoutDayRead)
async def update_day(
    day_id: UUID,
    data: WorkoutDayUpdate,
    profile: UserProfile = Depends(get_current_profile),
    db: AsyncSession = Depends(get_db),
):
    day = await PlanService.update_day(db, day_id, data, profile.id)
    if not day:
        raise HTTPException(status_code=404, detail="Workout day not found")
    return day


@router.delete("/days/{day_id}", status_code=204)
async def delete_day(
    day_id: UUID,
    profile: UserProfile = Depends(get_current_profile),
    db: AsyncSession = Depends(get_db),
):
    success = await PlanService.delete_day(db, day_id, profile.id)
    if not success:
        raise HTTPException(status_code=404, detail="Workout day not found")
