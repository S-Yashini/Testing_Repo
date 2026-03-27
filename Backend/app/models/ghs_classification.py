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

class MaterialGHSClassification(Base):
    __tablename__ = "ghs_classification"

    material_id = Column(
        Integer,
        ForeignKey("material_sds_master.material_id"),
        primary_key=True,
        nullable=False,
    )

    material_code = Column(String(100), nullable=False)

    ghs_classification = Column(String(255), nullable=True)

    ghs_category = Column(String(100), nullable=False)

    ghs_reason = Column(Text, nullable=True)

    ghs_status = Column(String(50), nullable=True)
    ghs_rejected_reason = Column(Text, nullable=True)

    confidence_score = Column(String(50), nullable=True)

    ai_model_name = Column(String(100), nullable=False)
    ai_model_version = Column(String(50), nullable=False)

    classified_at = Column(
        DateTime,
        nullable=False,
        default=datetime.utcnow
    )

    reviewed_by = Column(String(100), nullable=False)
    reviewed_at = Column(DateTime, nullable=False)

    modified_at = Column(
        DateTime,
        nullable=False,
        default=datetime.utcnow
    )

    # Relationship
    material = relationship("MaterialSDSMaster", backref="ghs_classification")
