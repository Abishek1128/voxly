from fastapi import Depends, HTTPException
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session
from jose import jwt, JWTError
import os

from backend.db.database import SessionLocal
from backend.models.user import User

SECRET_KEY = os.getenv("SECRET_KEY", "fallback-secret")
ALGORITHM  = "HS256"

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/login")

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: Session = Depends(get_db)
) -> User:
    try:
        payload   = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        subject   = payload.get("sub")
        tok_type  = payload.get("type")

        if not subject or tok_type != "access":
            raise HTTPException(status_code=401, detail="Invalid token")

        # sub is now user ID (int)
        user = db.query(User).filter(User.id == int(subject)).first()

        # fallback: try email lookup for old tokens still in circulation
        if not user:
            user = db.query(User).filter(User.email == subject).first()

        if not user:
            raise HTTPException(status_code=401, detail="User not found")

        return user

    except (JWTError, ValueError):
        raise HTTPException(status_code=401, detail="Token expired or invalid")