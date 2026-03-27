from sqlalchemy import (
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


class DGMaster(Base):
    __tablename__ = "dg_master"

    dg_id = Column(Integer, primary_key=True, nullable=False)

    sample_code = Column(String(100), nullable=False)
    un_number = Column(String(50), nullable=False)

    proper_shipping_name = Column(String(255), nullable=False)
    hazard_class = Column(String(50), nullable=False)
    packing_group = Column(String(50), nullable=False)

    notes = Column(Text, nullable=True)
