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

class MaterialDGClassification(Base):
    __tablename__ = "dg_classification"

    material_id = Column(
        Integer,
        ForeignKey("material_sds_master.material_id"),
        primary_key=True,
        nullable=False,
    )

    material_code = Column(String(100), nullable=False)

    dg_classification = Column(String(255), nullable=True)
    dg_reason = Column(Text, nullable=True)

    dg_status = Column(String(50), nullable=True)
    dg_rejected_reason = Column(Text, nullable=True)

    material_description = Column(Text, nullable=True)

    confidence_score = Column(String(50), nullable=True)

    ai_model_name = Column(String(100), nullable=False)
    ai_model_version = Column(String(50), nullable=False)

    classified_at = Column(
        DateTime,
        nullable=False,
        default=datetime.utcnow
    )

    marine_pollutant = Column(String(50), nullable=True)

    hazardous_waste = Column(String(50), nullable=True)
    hazardous_waste_reason = Column(Text, nullable=True)
    hazardous_waste_status = Column(String(50), nullable=True)

    reviewed_by = Column(String(100), nullable=False)
    reviewed_at = Column(DateTime, nullable=False)

    modified_at = Column(DateTime, nullable=True)

    rationale_summary = Column(Text, nullable=True)

    # Relationship
    material = relationship("MaterialSDSMaster", backref="dg_classification")
