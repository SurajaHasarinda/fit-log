from uuid import UUID
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from sqlalchemy.ext.asyncio import AsyncSession

from models.user_profile import UserProfile
from models.workout_plan import WorkoutPlan
from models.workout_day import WorkoutDay
from models.exercise import Exercise
from schemas.workout_plan import WorkoutPlanCreate, WorkoutPlanUpdate
from schemas.workout_day import WorkoutDayCreate, WorkoutDayUpdate


class PlanService:

    @staticmethod
    async def list_plans(db: AsyncSession, profile: UserProfile) -> list[WorkoutPlan]:
        result = await db.execute(
            select(WorkoutPlan)
            .where(WorkoutPlan.user_id == profile.id)
            .order_by(WorkoutPlan.created_at.desc())
        )
        return list(result.scalars().all())

    @staticmethod
    async def get_plan(db: AsyncSession, plan_id: UUID) -> WorkoutPlan | None:
        result = await db.execute(
            select(WorkoutPlan)
            .where(WorkoutPlan.id == plan_id)
            .options(
                selectinload(WorkoutPlan.days).selectinload(WorkoutDay.exercises).selectinload(Exercise.prs)
            )
        )
        return result.scalar_one_or_none()

    @staticmethod
    async def get_plan_raw(db: AsyncSession, plan_id: UUID) -> WorkoutPlan | None:
        """Get plan without eager loading relationships."""
        result = await db.execute(
            select(WorkoutPlan).where(WorkoutPlan.id == plan_id)
        )
        return result.scalar_one_or_none()

    @staticmethod
    async def create_plan(db: AsyncSession, profile: UserProfile, data: WorkoutPlanCreate) -> WorkoutPlan:
        plan = WorkoutPlan(
            user_id=profile.id,
            name=data.name,
            total_days=data.total_days,
            description=data.description,
        )
        db.add(plan)
        await db.flush()

        # Auto-create workout day placeholders
        for i in range(1, data.total_days + 1):
            day = WorkoutDay(
                plan_id=plan.id,
                day_number=i,
                label=f"Day {i}",
                sort_order=i,
            )
            db.add(day)
        await db.flush()

        # Reload with relationships
        return await PlanService.get_plan(db, plan.id)

    @staticmethod
    async def duplicate_plan(db: AsyncSession, profile: UserProfile, plan_id: UUID) -> WorkoutPlan | None:
        original = await PlanService.get_plan(db, plan_id)
        if not original:
            return None

        # Create new plan
        new_plan = WorkoutPlan(
            user_id=profile.id,
            name=f"{original.name} (Copy)",
            total_days=original.total_days,
            description=original.description,
            is_current=False,
        )
        db.add(new_plan)
        await db.flush()

        for original_day in original.days:
            new_day = WorkoutDay(
                plan_id=new_plan.id,
                day_number=original_day.day_number,
                label=original_day.label,
                sort_order=original_day.sort_order,
            )
            db.add(new_day)
            await db.flush()

            for original_ex in original_day.exercises:
                new_ex = Exercise(
                    workout_day_id=new_day.id,
                    name=original_ex.name,
                    sets=original_ex.sets,
                    reps=original_ex.reps,
                    sort_order=original_ex.sort_order,
                )
                db.add(new_ex)

        await db.flush()
        return await PlanService.get_plan(db, new_plan.id)

    @staticmethod
    async def update_plan(db: AsyncSession, plan_id: UUID, data: WorkoutPlanUpdate) -> WorkoutPlan | None:
        plan = await PlanService.get_plan(db, plan_id)
        if not plan:
            return None
        update_data = data.model_dump(exclude_unset=True)
        for key, value in update_data.items():
            setattr(plan, key, value)
        await db.flush()
        return plan

    @staticmethod
    async def delete_plan(db: AsyncSession, plan_id: UUID) -> bool:
        result = await db.execute(
            select(WorkoutPlan).where(WorkoutPlan.id == plan_id)
        )
        plan = result.scalar_one_or_none()
        if not plan:
            return False
        await db.delete(plan)
        await db.flush()
        return True

    @staticmethod
    async def set_current(db: AsyncSession, profile: UserProfile, plan_id: UUID) -> WorkoutPlan | None:
        # Unset all current plans for this user
        result = await db.execute(
            select(WorkoutPlan).where(
                WorkoutPlan.user_id == profile.id,
                WorkoutPlan.is_current == True,
            )
        )
        for plan in result.scalars().all():
            plan.is_current = False

        # Set the target plan as current
        target = await PlanService.get_plan(db, plan_id)
        if not target or target.user_id != profile.id:
            return None
        target.is_current = True
        await db.flush()
        return target

    # ---- Workout Day operations ----

    @staticmethod
    async def add_day(db: AsyncSession, plan_id: UUID, data: WorkoutDayCreate) -> WorkoutDay:
        day = WorkoutDay(
            plan_id=plan_id,
            day_number=data.day_number,
            label=data.label,
            sort_order=data.sort_order or data.day_number,
        )
        db.add(day)
        await db.flush()
        return day

    @staticmethod
    async def update_day(db: AsyncSession, day_id: UUID, data: WorkoutDayUpdate, user_id: UUID) -> WorkoutDay | None:
        result = await db.execute(
            select(WorkoutDay)
            .join(WorkoutPlan, WorkoutDay.plan_id == WorkoutPlan.id)
            .where(WorkoutDay.id == day_id, WorkoutPlan.user_id == user_id)
        )
        day = result.scalar_one_or_none()
        if not day:
            return None
        update_data = data.model_dump(exclude_unset=True)
        for key, value in update_data.items():
            setattr(day, key, value)
        await db.flush()
        return day

    @staticmethod
    async def delete_day(db: AsyncSession, day_id: UUID, user_id: UUID) -> bool:
        result = await db.execute(
            select(WorkoutDay)
            .join(WorkoutPlan, WorkoutDay.plan_id == WorkoutPlan.id)
            .where(WorkoutDay.id == day_id, WorkoutPlan.user_id == user_id)
        )
        day = result.scalar_one_or_none()
        if not day:
            return False
        await db.delete(day)
        await db.flush()
        return True
