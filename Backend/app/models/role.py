
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


class Role(Base):
    __tablename__ = "roles"

    id = Column(Integer, primary_key=True, autoincrement=True)

    role = Column(String(50), nullable=False, unique=True)

    status = Column(Boolean, nullable=False, default=True)

    created_at = Column(
        DateTime,
        nullable=False,
        default=datetime.utcnow
    )

    last_updated_at = Column(
        DateTime,
        nullable=True,
        onupdate=datetime.utcnow
    )

    # Relationship
    users = relationship("User", back_populates="role")
