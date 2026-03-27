from sqlalchemy import (
    Column,
    Float,
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


class SDSJurisdictionMaster(Base):
    __tablename__ = "sds_jurisdiction_master"

    authority_country = Column(String(10), primary_key=True, nullable=False)

    un_number = Column(String(50), primary_key=True, nullable=False)

    psn = Column(String(255), nullable=False)

    packaging_group = Column(String(50), nullable=False)

    hazard_class = Column(String(50), nullable=False)
