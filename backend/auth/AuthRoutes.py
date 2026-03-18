# # backend/auth/AuthRoutes.py
# from fastapi import APIRouter, Depends, HTTPException
# from sqlalchemy.orm import Session
# from pydantic import BaseModel
# from typing import Optional
# from backend.db.database import SessionLocal
# from backend.auth.service import register_user, verify_email, login_user
# from backend.auth.schemas import RegisterRequest, LoginRequest
# from backend.auth.dependencies import get_current_user, get_db
# from backend.models.user import User
# from backend.models.interview_session import InterviewSession as DBInterviewSession
# from backend.models.interview_response import InterviewResponse
# import bcrypt

# AuthRouter = APIRouter(prefix="/auth", tags=["Auth"])


# def get_db():
#     db = SessionLocal()
#     try:
#         yield db
#     finally:
#         db.close()


# def _serialize_user(user: User) -> dict:
#     return {
#         "id":       user.id,
#         "name":     user.name     or "",
#         "email":    user.email    or "",
#         "bio":      user.bio      or "",
#         "role":     user.role     or "",
#         "location": user.location or "",
#         "avatar":   user.avatar   or None,
#     }


# # ── auth ──────────────────────────────────────────────────────────────
# @AuthRouter.post("/register")
# def register(request: RegisterRequest, db: Session = Depends(get_db)):
#     return register_user(db, request.name, request.email, request.password)

# @AuthRouter.post("/login")
# def login(request: LoginRequest, db: Session = Depends(get_db)):
#     return login_user(db, request.email, request.password)

# @AuthRouter.get("/verify")
# def verify(token: str, db: Session = Depends(get_db)):
#     return verify_email(db, token)


# # ── GET profile ───────────────────────────────────────────────────────
# @AuthRouter.get("/me")
# def get_me(current_user: User = Depends(get_current_user)):
#     return _serialize_user(current_user)


# # ── UPDATE profile ────────────────────────────────────────────────────
# class UpdateProfileRequest(BaseModel):
#     name:     Optional[str] = None
#     bio:      Optional[str] = None
#     role:     Optional[str] = None
#     location: Optional[str] = None
#     avatar:   Optional[str] = None   # base64 data-url

# @AuthRouter.put("/me")
# def update_me(
#     body: UpdateProfileRequest,
#     current_user: User = Depends(get_current_user),
#     db: Session        = Depends(get_db),
# ):
#     user = db.query(User).filter(User.id == current_user.id).first()
#     if not user:
#         raise HTTPException(status_code=404, detail="User not found")

#     if body.name     is not None: user.name     = body.name
#     if body.bio      is not None: user.bio      = body.bio
#     if body.role     is not None: user.role     = body.role
#     if body.location is not None: user.location = body.location
#     if body.avatar   is not None: user.avatar   = body.avatar

#     db.commit()
#     db.refresh(user)
#     return _serialize_user(user)


# # ── GET real stats ────────────────────────────────────────────────────
# @AuthRouter.get("/stats")
# def get_stats(
#     current_user: User = Depends(get_current_user),
#     db: Session        = Depends(get_db),
# ):
#     sessions   = db.query(DBInterviewSession).filter(
#         DBInterviewSession.user_id == current_user.id
#     ).all()

#     total      = len(sessions)
#     practice   = sum(1 for s in sessions if s.mode == "practice")
#     interview  = sum(1 for s in sessions if s.mode == "interview")
#     scores_raw = [s.average_score for s in sessions if s.average_score and s.average_score > 0]
#     avg_pct    = round((sum(scores_raw) / len(scores_raw)) * 100) if scores_raw else 0
#     best_pct   = round(max(scores_raw) * 100)                     if scores_raw else 0

#     return {
#         "total_sessions":     total,
#         "interview_sessions": interview,
#         "practice_sessions":  practice,
#         "average_score_pct":  avg_pct,
#         "best_score_pct":     best_pct,
#     }


# # ── CHANGE password ───────────────────────────────────────────────────
# class ChangePasswordRequest(BaseModel):
#     current_password: str
#     new_password:     str

# @AuthRouter.put("/password")
# def change_password(
#     body: ChangePasswordRequest,
#     current_user: User = Depends(get_current_user),
#     db: Session        = Depends(get_db),
# ):
#     user = db.query(User).filter(User.id == current_user.id).first()
#     if not user:
#         raise HTTPException(status_code=404, detail="User not found")

#     if not bcrypt.checkpw(body.current_password.encode(), user.password_hash.encode()):
#         raise HTTPException(status_code=400, detail="Current password is incorrect")

#     if len(body.new_password) < 6:
#         raise HTTPException(status_code=400, detail="Password must be at least 6 characters")

#     user.password_hash = bcrypt.hashpw(body.new_password.encode(), bcrypt.gensalt()).decode()
#     db.commit()
#     return {"message": "Password updated successfully"}


# # ── DELETE account ────────────────────────────────────────────────────
# class DeleteAccountRequest(BaseModel):
#     password: str

# @AuthRouter.delete("/me")
# def delete_account(
#     body: DeleteAccountRequest,
#     current_user: User = Depends(get_current_user),
#     db: Session        = Depends(get_db),
# ):
#     user = db.query(User).filter(User.id == current_user.id).first()
#     if not user:
#         raise HTTPException(status_code=404, detail="User not found")

#     if not bcrypt.checkpw(body.password.encode(), user.password_hash.encode()):
#         raise HTTPException(status_code=400, detail="Incorrect password")

#     # cascade delete: responses → sessions → user
#     session_ids = [s.id for s in db.query(DBInterviewSession).filter(
#         DBInterviewSession.user_id == user.id
#     ).all()]

#     if session_ids:
#         db.query(InterviewResponse).filter(
#             InterviewResponse.session_id.in_(session_ids)
#         ).delete(synchronize_session=False)

#     db.query(DBInterviewSession).filter(
#         DBInterviewSession.user_id == user.id
#     ).delete(synchronize_session=False)

#     db.delete(user)
#     db.commit()
#     return {"message": "Account deleted"}

# backend/auth/AuthRoutes.py
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional
from datetime import datetime, timedelta
from jose import jwt, JWTError
import os
import bcrypt

from backend.db.database import SessionLocal
from backend.auth.service import (
    register_user, verify_email, login_user,
    forgot_password, reset_password
)
from backend.auth.schemas import RegisterRequest, LoginRequest
from backend.auth.dependencies import get_current_user, get_db
from backend.models.user import User
from backend.models.interview_session import InterviewSession as DBInterviewSession
from backend.models.interview_response import InterviewResponse

AuthRouter = APIRouter(prefix="/auth", tags=["Auth"])

SECRET_KEY = os.getenv("SECRET_KEY", "fallback-secret")
ALGORITHM  = "HS256"


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def _serialize_user(user: User) -> dict:
    return {
        "id":       user.id,
        "name":     user.name     or "",
        "email":    user.email    or "",
        "bio":      user.bio      or "",
        "role":     user.role     or "",
        "location": user.location or "",
        "avatar":   user.avatar   or None,
    }


# ── Auth ──────────────────────────────────────────────────────────────
@AuthRouter.post("/register")
def register(request: RegisterRequest, db: Session = Depends(get_db)):
    return register_user(db, request.name, request.email, request.password)

@AuthRouter.post("/login")
def login(request: LoginRequest, db: Session = Depends(get_db)):
    return login_user(db, request.email, request.password)

@AuthRouter.get("/verify")
def verify(token: str, db: Session = Depends(get_db)):
    return verify_email(db, token)


# ── Refresh Token ─────────────────────────────────────────────────────
class RefreshTokenRequest(BaseModel):
    refresh_token: str

@AuthRouter.post("/refresh")
def refresh_access_token(
    body: RefreshTokenRequest,
    db: Session = Depends(get_db)
):
    try:
        payload  = jwt.decode(body.refresh_token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id  = payload.get("sub")
        tok_type = payload.get("type")

        if not user_id or tok_type != "refresh":
            raise HTTPException(status_code=401, detail="Invalid refresh token")

        user = db.query(User).filter(User.id == int(user_id)).first()
        if not user:
            raise HTTPException(status_code=401, detail="User not found")

        if user.refresh_token != body.refresh_token:
            raise HTTPException(status_code=401, detail="Refresh token mismatch")

        # Issue new access token (30 min)
        new_access_token = jwt.encode(
            {   
                "sub":  str(user.id),
                "type": "access",
                "exp":  datetime.utcnow() + timedelta(minutes=30)
            },
            SECRET_KEY,
            algorithm=ALGORITHM
        )
        
        new_refresh_token = jwt.encode(
            {
                "sub": str(user.id),
                "type": "refresh",
            "exp": datetime.utcnow() + timedelta(days=7)
            },
        SECRET_KEY,
        algorithm=ALGORITHM
        )

        user.refresh_token = new_refresh_token
        db.commit()

        return {"access_token": new_access_token, "token_type": "bearer", "refresh_token": new_refresh_token,}

    except JWTError:
        raise HTTPException(status_code=401, detail="Refresh token expired or invalid")


# ── Forgot / Reset password ───────────────────────────────────────────
class ForgotPasswordRequest(BaseModel):
    email: str

class ResetPasswordRequest(BaseModel):
    token:            str
    new_password:     str
    confirm_password: str

@AuthRouter.post("/forgot-password")
def forgot_password_route(body: ForgotPasswordRequest, db: Session = Depends(get_db)):
    return forgot_password(db, body.email)

@AuthRouter.post("/reset-password")
def reset_password_route(body: ResetPasswordRequest, db: Session = Depends(get_db)):
    if body.new_password != body.confirm_password:
        raise HTTPException(status_code=400, detail="Passwords do not match.")
    return reset_password(db, body.token, body.new_password)


# ── GET profile ───────────────────────────────────────────────────────
@AuthRouter.get("/me")
def get_me(current_user: User = Depends(get_current_user)):
    return _serialize_user(current_user)


# ── UPDATE profile ────────────────────────────────────────────────────
class UpdateProfileRequest(BaseModel):
    name:     Optional[str] = None
    bio:      Optional[str] = None
    role:     Optional[str] = None
    location: Optional[str] = None
    avatar:   Optional[str] = None

@AuthRouter.put("/me")
def update_me(
    body: UpdateProfileRequest,
    current_user: User = Depends(get_current_user),
    db: Session        = Depends(get_db),
):
    user = db.query(User).filter(User.id == current_user.id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    if body.name     is not None: user.name     = body.name
    if body.bio      is not None: user.bio      = body.bio
    if body.role     is not None: user.role     = body.role
    if body.location is not None: user.location = body.location
    if body.avatar   is not None: user.avatar   = body.avatar

    db.commit()
    db.refresh(user)
    return _serialize_user(user)


# ── GET stats ─────────────────────────────────────────────────────────
@AuthRouter.get("/stats")
def get_stats(
    current_user: User = Depends(get_current_user),
    db: Session        = Depends(get_db),
):
    sessions   = db.query(DBInterviewSession).filter(
        DBInterviewSession.user_id == current_user.id
    ).all()

    total      = len(sessions)
    practice   = sum(1 for s in sessions if s.mode == "practice")
    interview  = sum(1 for s in sessions if s.mode == "interview")
    scores_raw = [s.average_score for s in sessions if s.average_score and s.average_score > 0]
    avg_pct    = round((sum(scores_raw) / len(scores_raw)) * 100) if scores_raw else 0
    best_pct   = round(max(scores_raw) * 100)                     if scores_raw else 0

    return {
        "total_sessions":     total,
        "interview_sessions": interview,
        "practice_sessions":  practice,
        "average_score_pct":  avg_pct,
        "best_score_pct":     best_pct,
    }


# ── CHANGE password ───────────────────────────────────────────────────
class ChangePasswordRequest(BaseModel):
    current_password: str
    new_password:     str

@AuthRouter.put("/password")
def change_password(
    body: ChangePasswordRequest,
    current_user: User = Depends(get_current_user),
    db: Session        = Depends(get_db),
):
    user = db.query(User).filter(User.id == current_user.id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    if not bcrypt.checkpw(body.current_password.encode(), user.password_hash.encode()):
        raise HTTPException(status_code=400, detail="Current password is incorrect")

    if len(body.new_password) < 6:
        raise HTTPException(status_code=400, detail="Password must be at least 6 characters")

    user.password_hash = bcrypt.hashpw(body.new_password.encode(), bcrypt.gensalt()).decode()
    db.commit()
    return {"message": "Password updated successfully"}


# ── DELETE account ────────────────────────────────────────────────────
class DeleteAccountRequest(BaseModel):
    password: str

@AuthRouter.delete("/me")
def delete_account(
    body: DeleteAccountRequest,
    current_user: User = Depends(get_current_user),
    db: Session        = Depends(get_db),
):
    user = db.query(User).filter(User.id == current_user.id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    if not bcrypt.checkpw(body.password.encode(), user.password_hash.encode()):
        raise HTTPException(status_code=400, detail="Incorrect password")

    session_ids = [s.id for s in db.query(DBInterviewSession).filter(
        DBInterviewSession.user_id == user.id
    ).all()]

    if session_ids:
        db.query(InterviewResponse).filter(
            InterviewResponse.session_id.in_(session_ids)
        ).delete(synchronize_session=False)

    db.query(DBInterviewSession).filter(
        DBInterviewSession.user_id == user.id
    ).delete(synchronize_session=False)

    db.delete(user)
    db.commit()
    return {"message": "Account deleted"}


@AuthRouter.post("/logout")
def logout(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):

    user = db.query(User).filter(User.id == current_user.id).first()
    
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    user.refresh_token = None
    db.commit()

    return {"message": "Logged out successfully"}