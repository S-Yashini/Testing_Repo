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



class MaterialSDSMaster(Base):
    __tablename__ = "sds_master"

    material_id = Column(Integer, primary_key=True, nullable=False)
    material_code = Column(String(100), unique=True, nullable=False)

    material_name = Column(String(255), nullable=True)
    sds_version = Column(String(50), nullable=True)
    sds_date = Column(Date, nullable=True)

    pdf_file_path = Column(Text, nullable=True)
    source_file_path = Column(Text, nullable=True)

    extraction_timestamp = Column(
        DateTime, nullable=False, default=datetime.utcnow
    )

    processing_status = Column(String(50), nullable=False)

    source_material_type = Column(String(100), nullable=True)
    # Relationships
    sds_info = relationship("SDSTable", back_populates="material", uselist=False)
    hazards = relationship("SDSHazards", back_populates="material", uselist=False)