from uuid import UUID
from pydantic import BaseModel, Field, EmailStr


class UserRegister(BaseModel):
    username: str = Field(..., max_length=100)
    password: str = Field(..., max_length=100)
    name: str | None = Field(default=None, max_length=100)


class UserLogin(BaseModel):
    username: str
    password: str = Field(..., max_length=100)


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user_id: str
    username: str
    name: str


class UserRead(BaseModel):
    id: UUID
    username: str
    is_active: bool

    model_config = {"from_attributes": True}
