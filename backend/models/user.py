from sqlalchemy import Column, Integer, String, Boolean, Text, DateTime
from backend.db.database import Base
class User(Base):
    __tablename__ = "users"

    id            = Column(Integer, primary_key=True, index=True)
    name          = Column(String,  nullable=False)
    email         = Column(String,  unique=True, index=True, nullable=False)
    password_hash = Column(String,  nullable=False)
    is_verified   = Column(Boolean, default=False)

    bio           = Column(String, nullable=True, default="")
    role          = Column(String, nullable=True, default="")
    location      = Column(String, nullable=True, default="")
    avatar        = Column(Text,   nullable=True, default=None)

    reset_token         = Column(String,   nullable=True, default=None)
    reset_token_expires = Column(DateTime, nullable=True, default=None)

    # Refresh token
    refresh_token = Column(String, nullable=True, default=None)