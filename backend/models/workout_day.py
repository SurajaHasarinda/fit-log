from __future__ import annotations
import uuid

from sqlalchemy import String, Integer, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.dialects.postgresql import UUID

from database import Base


class WorkoutDay(Base):
    __tablename__ = "workout_days"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    plan_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("workout_plans.id", ondelete="CASCADE"), index=True
    )
    day_number: Mapped[int] = mapped_column(Integer)
    label: Mapped[str] = mapped_column(String(200), comment="e.g. Legs + Shoulders")
    sort_order: Mapped[int] = mapped_column(Integer, default=0)

    # Relationships
    plan = relationship("WorkoutPlan", back_populates="days")
    exercises = relationship(
        "Exercise", back_populates="workout_day", cascade="all, delete-orphan",
        order_by="Exercise.sort_order"
    )
