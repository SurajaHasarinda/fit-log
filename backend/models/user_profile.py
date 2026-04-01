from __future__ import annotations
from typing import Optional
import uuid
from datetime import datetime, timezone

from sqlalchemy import String, JSON, DateTime, Date, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.dialects.postgresql import UUID

from database import Base


class UserProfile(Base):
    __tablename__ = "user_profiles"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), unique=True
    )
    name: Mapped[str] = mapped_column(String(100), default="")
    height_cm: Mapped[float | None] = mapped_column(default=None)
    date_of_birth: Mapped[str | None] = mapped_column(Date, default=None)
    gender: Mapped[str | None] = mapped_column(String(20), default=None)
    gym_days: Mapped[dict | None] = mapped_column(
        JSON, default=None, comment="List of weekday names, e.g. ['Mon','Wed','Fri']"
    )
    target_weight_kg: Mapped[float | None] = mapped_column(default=None)
    fitness_goal: Mapped[str | None] = mapped_column(
        String(50), default=None, comment="e.g. 'bulk', 'cut', 'maintain'"
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc)
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc)
    )

    # Relationships
    user = relationship("User", back_populates="profile")
    plans = relationship("WorkoutPlan", back_populates="user", cascade="all, delete-orphan")
    weight_logs = relationship("WeightLog", back_populates="user", cascade="all, delete-orphan")
