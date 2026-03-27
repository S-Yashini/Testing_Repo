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



class SDSHazards(Base):
    __tablename__ = "sds_hazards_sec2"

    material_id = Column(
        Integer,
        ForeignKey("material_sds_master.material_id"),
        primary_key=True,
        nullable=False,
    )

    material_code = Column(String(100), nullable=False)

    classification = Column(String(255), nullable=True)
    signal_word = Column(String(50), nullable=True)

    # Portable replacement for ARRAY<STRING>
    hazard_statements = Column(JSON, nullable=True)
    precautionary_statements = Column(JSON, nullable=True)
    pictograms = Column(JSON, nullable=True)

    other_hazards = Column(Text, nullable=True)

    extraction_timestamp = Column(
        DateTime, nullable=False, default=datetime.utcnow
    )

    raw_text = Column(Text, nullable=True)

    # Relationship
    material = relationship("MaterialSDSMaster", back_populates="hazards")
