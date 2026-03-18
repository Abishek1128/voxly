# from passlib.context import CryptContext
# from jose import jwt
# from datetime import datetime, timedelta
# import os

# SECRET_KEY = os.getenv("SECRET_KEY", "supersecret")
# ALGORITHM = "HS256"
# ACCESS_TOKEN_EXPIRE_MINUTES = 60

# pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


# def hash_password(password: str):
#     return pwd_context.hash(password)


# def verify_password(plain, hashed):
#     return pwd_context.verify(plain, hashed)


# def create_access_token(data: dict):
#     to_encode = data.copy()
#     expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
#     to_encode.update({"exp": expire})
#     return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)


# backend/auth/utils.py
from datetime import datetime, timedelta
from jose import jwt
from passlib.context import CryptContext
import os

SECRET_KEY = os.getenv("SECRET_KEY", "fallback-secret")
ALGORITHM  = "HS256"

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def hash_password(password: str) -> str:
    return pwd_context.hash(password)

def verify_password(plain: str, hashed: str) -> bool:
    return pwd_context.verify(plain, hashed)

def create_access_token(data: dict) -> str:
    payload = data.copy()
    payload.update({
        "type": "access",
        "exp":  datetime.utcnow() + timedelta(minutes=30)
    })
    return jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)

def create_refresh_token(data: dict) -> str:
    payload = data.copy()
    payload.update({
        "type": "refresh",
        "exp":  datetime.utcnow() + timedelta(days=30)  # 30 days
    })
    return jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)