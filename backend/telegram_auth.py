"""Copy to app/routers/telegram_auth.py in the Voha FastAPI backend."""
import hashlib
import hmac
import json
import os
import time
from urllib.parse import parse_qsl

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models.user import User
from app.schemas.auth import AuthResponse, UserOut
from app.services import auth_service

router = APIRouter()


def validate_init_data(raw: str, token: str, now: float | None = None) -> dict:
    if not token:
        raise HTTPException(503, "Telegram login serverda sozlanmagan")
    pairs = parse_qsl(raw, keep_blank_values=True, strict_parsing=True)
    if len({key for key, _ in pairs}) != len(pairs):
        raise ValueError("duplicate fields")
    data = dict(pairs)
    digest = data.pop("hash", "")
    if len(digest) != 64:
        raise ValueError("missing hash")
    check = "\n".join(f"{key}={value}" for key, value in sorted(data.items()))
    secret = hmac.new(b"WebAppData", token.encode(), hashlib.sha256).digest()
    expected = hmac.new(secret, check.encode(), hashlib.sha256).hexdigest()
    if not hmac.compare_digest(expected, digest):
        raise ValueError("invalid signature")
    age = (time.time() if now is None else now) - int(data["auth_date"])
    if age < -30 or age > 300:
        raise ValueError("expired init data")
    user = json.loads(data["user"])
    if not isinstance(user, dict) or type(user.get("id")) is not int or not 0 < user["id"] < 2**52 or user.get("is_bot"):
        raise ValueError("invalid user")
    return user


class TelegramLoginRequest(BaseModel):
    init_data: str = Field(min_length=1, max_length=16384)


@router.post("/telegram", response_model=AuthResponse)
async def telegram_login(payload: TelegramLoginRequest, db: AsyncSession = Depends(get_db)):
    try:
        identity = validate_init_data(payload.init_data, os.environ.get("MINI_APP_BOT_TOKEN", ""))
    except (ValueError, KeyError, TypeError, json.JSONDecodeError):
        raise HTTPException(401, "Telegram tasdiqlashi yaroqsiz yoki eskirgan. Mini App’ni qayta oching.")
    # Reserved non-E.164 namespace: phone/OTP registration cannot claim a Telegram identity.
    # No automatic account linking by Telegram username or caller-supplied phone.
    identifier = f"tg:{identity['id']}"
    user = await db.scalar(select(User).where(User.phone == identifier))
    if user is None:
        user = User(phone=identifier, first_name=str(identity.get("first_name") or "Telegram")[:50],
                    last_name=str(identity.get("last_name") or "")[:50])
        db.add(user)
        try:
            await db.commit()
            await db.refresh(user)
        except IntegrityError:
            await db.rollback()
            user = await db.scalar(select(User).where(User.phone == identifier))
            if user is None:
                raise HTTPException(409, "Kirishni qayta urinib ko‘ring")
    if not user.is_active:
        raise HTTPException(403, "Bu akkaunt o‘chirilgan")
    tokens = await auth_service.issue_token_pair(db, user)
    return AuthResponse(access_token=tokens["access_token"], refresh_token=tokens["refresh_token"],
                        user=UserOut.model_validate(user))
