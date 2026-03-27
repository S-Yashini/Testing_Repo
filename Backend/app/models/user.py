from sqlalchemy import (
    Boolean,
    Column,
    Integer,
    String,
    Date,
    DateTime,
    Text,
    ForeignKey,
    JSON,
)
from sqlalchemy.orm import declarative_base, relationship
from datetime import datetime
from app.core.database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, autoincrement=True)

    email = Column(String(255), nullable=False, unique=True)

    role_id = Column(Integer, ForeignKey("roles.id"), nullable=False)

    status = Column(Boolean, nullable=False, default=True)

    created_date = Column(
        DateTime,
        nullable=False,
        default=datetime.utcnow
    )

    last_updated_date = Column(
        DateTime,
        nullable=True,
        onupdate=datetime.utcnow
    )

    # Relationships
    role = relationship("Role", back_populates="users")

    error_logs = relationship("UIErrorLog", back_populates="user")
