from __future__ import annotations
from typing import Optional
import uuid

from sqlalchemy import String, Integer, Float, ForeignKey, desc
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.dialects.postgresql import UUID

from database import Base


class Exercise(Base):
    __tablename__ = "exercises"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    workout_day_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("workout_days.id", ondelete="CASCADE"), index=True
    )
    name: Mapped[str] = mapped_column(String(200))
    sets: Mapped[int] = mapped_column(Integer, default=3)
    reps: Mapped[int] = mapped_column(Integer, default=10)
    sort_order: Mapped[int] = mapped_column(Integer, default=0)

    # Relationships
    workout_day = relationship("WorkoutDay", back_populates="exercises")
    prs = relationship("ExercisePR", back_populates="exercise", cascade="all, delete-orphan", order_by="ExercisePR.recorded_at")
