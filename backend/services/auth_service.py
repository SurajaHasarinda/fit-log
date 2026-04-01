from uuid import UUID
from datetime import datetime, timedelta

from jose import jwt, JWTError
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer

from database import get_db
from models.user import User
from models.user_profile import UserProfile
from config import get_settings

settings = get_settings()

SECRET_KEY = settings.JWT_SECRET_KEY
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = settings.JWT_EXPIRE_MINUTES

import bcrypt

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login")

import asyncio

async def hash_password(password: str) -> str:
    def _hash():
        # bcrypt requires bytes; truncate to avoid 72-byte limit
        pwd_bytes = password[:72].encode('utf-8')
        salt = bcrypt.gensalt()
        return bcrypt.hashpw(pwd_bytes, salt).decode('utf-8')
    return await asyncio.to_thread(_hash)

async def verify_password(plain_password: str, hashed_password: str) -> bool:
    def _verify():
        pwd_bytes = plain_password[:72].encode('utf-8')
        hash_bytes = hashed_password.encode('utf-8')
        try:
            return bcrypt.checkpw(pwd_bytes, hash_bytes)
        except ValueError:
            return False
    return await asyncio.to_thread(_verify)


def create_access_token(data: dict, expires_delta: timedelta | None = None) -> str:
    to_encode = data.copy()
    expire = datetime.utcnow() + (expires_delta or timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES))
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)


class AuthService:

    @staticmethod
    async def register(db: AsyncSession, username: str, password: str, name: str | None = None) -> tuple[User, str]:
        """Register a new user. Returns (user, access_token)."""
        # Check if username already exists
        result = await db.execute(select(User).where(User.username == username.lower()))
        existing = result.scalar_one_or_none()
        if existing:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="An account with this username already exists",
            )

        # Create user
        user = User(
            username=username.lower(),
            hashed_password=await hash_password(password),
        )
        db.add(user)
        await db.flush()

        # Create linked profile
        profile = UserProfile(
            user_id=user.id,
            name=name or "Gym User",
        )
        db.add(profile)
        await db.flush()

        token = create_access_token({"sub": str(user.id)})
        return user, token

    @staticmethod
    async def login(db: AsyncSession, username: str, password: str) -> tuple[User, str]:
        """Authenticate user. Returns (user, access_token)."""
        result = await db.execute(select(User).where(User.username == username.lower()))
        user = result.scalar_one_or_none()

        if not user or not await verify_password(password, user.hashed_password):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid username or password",
            )

        if not user.is_active:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Account is disabled",
            )

        token = create_access_token({"sub": str(user.id)})
        return user, token

    @staticmethod
    async def get_user_by_id(db: AsyncSession, user_id: UUID) -> User | None:
        result = await db.execute(select(User).where(User.id == user_id))
        return result.scalar_one_or_none()


async def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: AsyncSession = Depends(get_db),
) -> User:
    """FastAPI dependency: extract + validate JWT, return the User."""
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id_str: str | None = payload.get("sub")
        if user_id_str is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception

    user = await AuthService.get_user_by_id(db, UUID(user_id_str))
    if user is None:
        raise credentials_exception
    return user


async def get_current_profile(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> UserProfile:
    """FastAPI dependency: get the UserProfile for the authenticated user."""
    result = await db.execute(
        select(UserProfile).where(UserProfile.user_id == current_user.id)
    )
    profile = result.scalar_one_or_none()
    if not profile:
        # Auto-create profile if missing (shouldn't happen normally)
        profile = UserProfile(user_id=current_user.id, name="Gym User")
        db.add(profile)
        await db.flush()
    return profile
