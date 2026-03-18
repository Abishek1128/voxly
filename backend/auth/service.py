# import uuid
# from datetime import datetime
# from sqlalchemy.orm import Session
# from backend.models.user import User
# from backend.models.verification_token import EmailVerificationToken
# from backend.auth.utils import hash_password, verify_password, create_access_token
# from backend.auth.email import send_verification_email
# from fastapi import HTTPException


# def register_user(db: Session, name : str, email: str, password: str):
#     existing = db.query(User).filter(User.email == email).first()
#     if existing:
#         raise HTTPException(status_code=400, detail="Email already registered")

#     user = User(
#         name=name,
#         email=email,
#         password_hash=hash_password(password),
#         is_verified=False
#     )
#     db.add(user)
#     db.commit()
#     db.refresh(user)

#     token_str = str(uuid.uuid4())
#     token = EmailVerificationToken(
#         user_id=user.id,
#         token=token_str
#     )

#     db.add(token)
#     db.commit()

#     send_verification_email(email, token_str)

#     return {"message": "User registered. Check your email to verify."}


# def verify_email(db: Session, token_str: str):
#     token = db.query(EmailVerificationToken).filter(
#         EmailVerificationToken.token == token_str
#     ).first()

#     if not token:
#         # Check if user is already verified
#         user = db.query(User).filter(User.is_verified == True).first()
#         if user:
#             return {"message": "Email already verified"}
#         raise HTTPException(status_code=400, detail="Invalid token")

#     if token.expires_at < datetime.utcnow():
#         raise HTTPException(status_code=400, detail="Token expired")

#     user = db.query(User).filter(User.id == token.user_id).first()

#     if user.is_verified:
#         return {"message": "Email already verified"}

#     user.is_verified = True
#     db.delete(token)
#     db.commit()

#     return {"message": "Email verified successfully"}


# def login_user(db: Session, email: str, password: str):
#     user = db.query(User).filter(User.email == email).first()

#     if not user:
#         raise HTTPException(status_code=400, detail="Email does not exists")

#     if not verify_password(password, user.password_hash):
#         raise HTTPException(status_code=400, detail="Invalid password")


#     if not user.is_verified:
#         raise HTTPException(status_code=400, detail="Email not verified")


#     token = create_access_token({"sub": user.email})

#     return {"access_token": token, "token_type": "bearer"}import uuid
import secrets
import uuid
from datetime import datetime, timedelta

from sqlalchemy.orm import Session
from fastapi import HTTPException

from backend.models.user import User
from backend.models.verification_token import EmailVerificationToken
from backend.auth.utils import hash_password, verify_password, create_access_token, create_refresh_token
from backend.auth.email import send_verification_email, send_reset_email


# ── Register ──────────────────────────────────────────────────────────
def register_user(db: Session, name: str, email: str, password: str):
    existing = db.query(User).filter(User.email == email).first()
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")

    user = User(
        name          = name,
        email         = email,
        password_hash = hash_password(password),
        is_verified   = False,
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    token_str = str(uuid.uuid4())
    token     = EmailVerificationToken(user_id=user.id, token=token_str)
    db.add(token)
    db.commit()

    send_verification_email(email, token_str)
    return {"message": "User registered. Check your email to verify."}


# ── Verify email ──────────────────────────────────────────────────────
def verify_email(db: Session, token_str: str):
    token = db.query(EmailVerificationToken).filter(
        EmailVerificationToken.token == token_str
    ).first()

    if not token:
        user = db.query(User).filter(User.is_verified == True).first()
        if user:
            return {"message": "Email already verified"}
        raise HTTPException(status_code=400, detail="Invalid token")

    if token.expires_at < datetime.utcnow():
        raise HTTPException(status_code=400, detail="Token expired")

    user = db.query(User).filter(User.id == token.user_id).first()

    if user.is_verified:
        return {"message": "Email already verified"}

    user.is_verified = True
    db.delete(token)
    db.commit()
    return {"message": "Email verified successfully"}


# ── Login ─────────────────────────────────────────────────────────────
def login_user(db: Session, email: str, password: str):
    user = db.query(User).filter(User.email == email).first()

    if not user:
        raise HTTPException(status_code=400, detail="Email does not exist")

    if not verify_password(password, user.password_hash):
        raise HTTPException(status_code=400, detail="Invalid password")

    if not user.is_verified:
        raise HTTPException(status_code=403, detail="Email not verified")

    # Create both tokens
    access_token  = create_access_token({"sub": str(user.id)})
    refresh_token = create_refresh_token({"sub": str(user.id)})

    # Store refresh token in DB
    user.refresh_token = refresh_token
    db.commit()

    return {
        "access_token":  access_token,
        "refresh_token": refresh_token,
        "token_type":    "bearer"
    }


# ── Forgot password ───────────────────────────────────────────────────
def forgot_password(db: Session, email: str):
    user = db.query(User).filter(User.email == email).first()

    if not user:
        return {"message": "If that email is registered, a reset link has been sent."}

    token                    = secrets.token_urlsafe(32)
    user.reset_token         = token
    user.reset_token_expires = datetime.utcnow() + timedelta(minutes=15)
    db.commit()

    send_reset_email(user.email, token)
    return {"message": "If that email is registered, a reset link has been sent."}


# ── Reset password ────────────────────────────────────────────────────
def reset_password(db: Session, token: str, new_password: str):
    if len(new_password) < 6:
        raise HTTPException(status_code=400, detail="Password must be at least 6 characters.")

    user = db.query(User).filter(User.reset_token == token).first()

    if not user or user.reset_token_expires < datetime.utcnow():
        raise HTTPException(status_code=400, detail="Reset link is invalid or has expired.")

    user.password_hash       = hash_password(new_password)
    user.reset_token         = None
    user.reset_token_expires = None
    db.commit()

    return {"message": "Password reset successfully. You can now sign in."}