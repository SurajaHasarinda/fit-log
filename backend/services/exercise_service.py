from uuid import UUID
from datetime import datetime
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from sqlalchemy.ext.asyncio import AsyncSession

from models.exercise import Exercise
from models.exercise_pr import ExercisePR
from schemas.exercise import ExerciseCreate, ExerciseUpdate, ExerciseReorder


class ExerciseService:

    @staticmethod
    async def _verify_day_owner(db: AsyncSession, day_id: UUID, user_id: UUID) -> bool:
        from models.workout_day import WorkoutDay
        from models.workout_plan import WorkoutPlan
        result = await db.execute(
            select(WorkoutDay)
            .join(WorkoutPlan, WorkoutDay.plan_id == WorkoutPlan.id)
            .where(WorkoutDay.id == day_id, WorkoutPlan.user_id == user_id)
        )
        return result.scalar_one_or_none() is not None

    @staticmethod
    async def list_exercises(db: AsyncSession, day_id: UUID, user_id: UUID) -> list[Exercise]:
        if not await ExerciseService._verify_day_owner(db, day_id, user_id):
            return []
        result = await db.execute(
            select(Exercise)
            .where(Exercise.workout_day_id == day_id)
            .options(selectinload(Exercise.prs))
            .order_by(Exercise.sort_order)
        )
        return list(result.scalars().all())

    @staticmethod
    async def create_exercise(db: AsyncSession, day_id: UUID, data: ExerciseCreate, user_id: UUID) -> Exercise | None:
        if not await ExerciseService._verify_day_owner(db, day_id, user_id):
            return None
        # Determine sort_order
        if data.sort_order is None:
            existing = await ExerciseService.list_exercises(db, day_id, user_id)
            sort_order = len(existing)
        else:
            sort_order = data.sort_order

        exercise = Exercise(
            workout_day_id=day_id,
            name=data.name,
            sets=data.sets,
            reps=data.reps,
            sort_order=sort_order,
        )
        db.add(exercise)
        await db.flush()
        await db.refresh(exercise, ["prs"])
        return exercise

    @staticmethod
    async def update_exercise(db: AsyncSession, exercise_id: UUID, data: ExerciseUpdate, user_id: UUID) -> Exercise | None:
        from models.workout_day import WorkoutDay
        from models.workout_plan import WorkoutPlan
        result = await db.execute(
            select(Exercise)
            .join(WorkoutDay, Exercise.workout_day_id == WorkoutDay.id)
            .join(WorkoutPlan, WorkoutDay.plan_id == WorkoutPlan.id)
            .where(Exercise.id == exercise_id, WorkoutPlan.user_id == user_id)
        )
        exercise = result.scalar_one_or_none()
        if not exercise:
            return None
        update_data = data.model_dump(exclude_unset=True)
        for key, value in update_data.items():
            setattr(exercise, key, value)
        await db.flush()
        await db.refresh(exercise, ["prs"])
        return exercise

    @staticmethod
    async def delete_exercise(db: AsyncSession, exercise_id: UUID, user_id: UUID) -> bool:
        from models.workout_day import WorkoutDay
        from models.workout_plan import WorkoutPlan
        result = await db.execute(
            select(Exercise)
            .join(WorkoutDay, Exercise.workout_day_id == WorkoutDay.id)
            .join(WorkoutPlan, WorkoutDay.plan_id == WorkoutPlan.id)
            .where(Exercise.id == exercise_id, WorkoutPlan.user_id == user_id)
        )
        exercise = result.scalar_one_or_none()
        if not exercise:
            return False
        await db.delete(exercise)
        await db.flush()
        return True

    @staticmethod
    async def reorder_exercises(db: AsyncSession, day_id: UUID, data: ExerciseReorder, user_id: UUID) -> list[Exercise]:
        if not await ExerciseService._verify_day_owner(db, day_id, user_id):
            return []
        for idx, exercise_id in enumerate(data.exercise_ids):
            result = await db.execute(
                select(Exercise).where(
                    Exercise.id == exercise_id,
                    Exercise.workout_day_id == day_id,
                )
            )
            exercise = result.scalar_one_or_none()
            if exercise:
                exercise.sort_order = idx
        await db.flush()
        return await ExerciseService.list_exercises(db, day_id, user_id)

    @staticmethod
    async def add_pr(db: AsyncSession, exercise_id: UUID, user_id: UUID, weight: float, recorded_at: datetime | None = None) -> ExercisePR | None:
        from models.workout_day import WorkoutDay
        from models.workout_plan import WorkoutPlan
        result = await db.execute(
            select(Exercise)
            .join(WorkoutDay, Exercise.workout_day_id == WorkoutDay.id)
            .join(WorkoutPlan, WorkoutDay.plan_id == WorkoutPlan.id)
            .where(Exercise.id == exercise_id, WorkoutPlan.user_id == user_id)
        )
        exercise = result.scalar_one_or_none()
        if not exercise:
            return None
        pr = ExercisePR(
            exercise_id=exercise_id,
            weight=weight,
            recorded_at=recorded_at or datetime.utcnow()
        )
        db.add(pr)
        await db.flush()
        return pr

    @staticmethod
    async def delete_pr(db: AsyncSession, pr_id: UUID, user_id: UUID) -> bool:
        from models.workout_day import WorkoutDay
        from models.workout_plan import WorkoutPlan
        result = await db.execute(
            select(ExercisePR)
            .join(Exercise, ExercisePR.exercise_id == Exercise.id)
            .join(WorkoutDay, Exercise.workout_day_id == WorkoutDay.id)
            .join(WorkoutPlan, WorkoutDay.plan_id == WorkoutPlan.id)
            .where(ExercisePR.id == pr_id, WorkoutPlan.user_id == user_id)
        )
        pr = result.scalar_one_or_none()
        if not pr:
            return False
        await db.delete(pr)
        await db.flush()
        return True
