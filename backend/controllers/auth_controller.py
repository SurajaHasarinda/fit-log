from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from database import get_db
import logging

logger = logging.getLogger("fitlog.auth")
from schemas.auth import UserRegister, UserLogin, TokenResponse
from services.auth_service import AuthService, get_current_user
from models.user import User

router = APIRouter(prefix="/api/auth", tags=["Authentication"])


@router.post("/register", response_model=TokenResponse, status_code=201)
async def register(data: UserRegister, db: AsyncSession = Depends(get_db)):
    logger.info(f"New registration attempt: {data.username}")
    user, token = await AuthService.register(db, data.username, data.password, data.name)
    logger.info(f"User registered successfully: {user.username} (ID: {user.id})")
    # Get profile name
    from sqlalchemy import select
    from models.user_profile import UserProfile
    result = await db.execute(select(UserProfile).where(UserProfile.user_id == user.id))
    profile = result.scalar_one_or_none()
    return TokenResponse(
        access_token=token,
        user_id=str(user.id),
        username=user.username,
        name=profile.name if profile else "Gym User",
    )


@router.post("/login", response_model=TokenResponse)
async def login(data: UserLogin, db: AsyncSession = Depends(get_db)):
    logger.info(f"Login attempt: {data.username}")
    user, token = await AuthService.login(db, data.username, data.password)
    logger.info(f"Login successful: {user.username}")
    # Get profile name
    from sqlalchemy import select
    from models.user_profile import UserProfile
    result = await db.execute(select(UserProfile).where(UserProfile.user_id == user.id))
    profile = result.scalar_one_or_none()
    return TokenResponse(
        access_token=token,
        user_id=str(user.id),
        username=user.username,
        name=profile.name if profile else "Gym User",
    )


@router.get("/me", response_model=TokenResponse)
async def get_me(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Validate token and return current user info."""
    from sqlalchemy import select
    from models.user_profile import UserProfile
    result = await db.execute(select(UserProfile).where(UserProfile.user_id == current_user.id))
    profile = result.scalar_one_or_none()
    return TokenResponse(
        access_token="",
        user_id=str(current_user.id),
        username=current_user.username,
        name=profile.name if profile else "Gym User",
    )
