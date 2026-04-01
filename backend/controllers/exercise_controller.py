from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
import logging

logger = logging.getLogger("fitlog.exercises")

from database import get_db
from models.user_profile import UserProfile
from schemas.exercise import ExerciseCreate, ExerciseRead, ExerciseUpdate, ExerciseReorder, ExercisePRCreate, ExercisePRRead
from services.exercise_service import ExerciseService
from services.auth_service import get_current_profile

router = APIRouter(prefix="/api", tags=["Exercises"])


@router.get("/days/{day_id}/exercises", response_model=list[ExerciseRead])
async def list_exercises(
    day_id: UUID,
    profile: UserProfile = Depends(get_current_profile),
    db: AsyncSession = Depends(get_db),
):
    return await ExerciseService.list_exercises(db, day_id, profile.id)


@router.post("/days/{day_id}/exercises", response_model=ExerciseRead, status_code=201)
async def create_exercise(
    day_id: UUID,
    data: ExerciseCreate,
    profile: UserProfile = Depends(get_current_profile),
    db: AsyncSession = Depends(get_db),
):
    logger.info(f"User {profile.name} is adding exercise: {data.name} to day {day_id}")
    exercise = await ExerciseService.create_exercise(db, day_id, data, profile.id)
    if not exercise:
        raise HTTPException(status_code=404, detail="Workout day not found or access denied")
    return exercise


@router.put("/exercises/{exercise_id}", response_model=ExerciseRead)
async def update_exercise(
    exercise_id: UUID,
    data: ExerciseUpdate,
    profile: UserProfile = Depends(get_current_profile),
    db: AsyncSession = Depends(get_db),
):
    logger.info(f"User {profile.name} is updating exercise {exercise_id}")
    exercise = await ExerciseService.update_exercise(db, exercise_id, data, profile.id)
    if not exercise:
        raise HTTPException(status_code=404, detail="Exercise not found")
    return exercise


@router.delete("/exercises/{exercise_id}", status_code=204)
async def delete_exercise(
    exercise_id: UUID,
    profile: UserProfile = Depends(get_current_profile),
    db: AsyncSession = Depends(get_db),
):
    logger.info(f"User {profile.name} is deleting exercise {exercise_id}")
    success = await ExerciseService.delete_exercise(db, exercise_id, profile.id)
    if not success:
        raise HTTPException(status_code=404, detail="Exercise not found")


@router.put("/days/{day_id}/exercises/reorder", response_model=list[ExerciseRead])
async def reorder_exercises(
    day_id: UUID,
    data: ExerciseReorder,
    profile: UserProfile = Depends(get_current_profile),
    db: AsyncSession = Depends(get_db),
):
    return await ExerciseService.reorder_exercises(db, day_id, data, profile.id)

@router.post("/exercises/{exercise_id}/prs", response_model=ExercisePRRead, status_code=201)
async def add_exercise_pr(
    exercise_id: UUID,
    data: ExercisePRCreate,
    profile: UserProfile = Depends(get_current_profile),
    db: AsyncSession = Depends(get_db),
):
    logger.info(f"User {profile.name} is logging PR: {data.weight}kg for exercise {exercise_id}")
    pr = await ExerciseService.add_pr(db, exercise_id, profile.id, data.weight, data.recorded_at)
    if not pr:
        raise HTTPException(status_code=404, detail="Exercise not found")
    return pr

@router.delete("/prs/{pr_id}", status_code=204)
async def delete_exercise_pr(
    pr_id: UUID,
    profile: UserProfile = Depends(get_current_profile),
    db: AsyncSession = Depends(get_db),
):
    success = await ExerciseService.delete_pr(db, pr_id, profile.id)
    if not success:
        raise HTTPException(status_code=404, detail="PR not found")
