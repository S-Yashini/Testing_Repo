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

class SDSHazardCodes(Base):
    __tablename__ = "sds_hazard_codes"

    code = Column(String(50), primary_key=True, nullable=False)

    material_code = Column(
        String(50),
        # ForeignKey("material_sds_master.material_id"),
        primary_key=True,
        nullable=False,
    )

    code_desc = Column(Text, nullable=True)

    code_type = Column(
        String(50),
        nullable=False,
        doc="H-Code, P-Code, Warning, Pictogram"
    )

    # Relationship
    material = relationship("MaterialSDSMaster", backref="hazard_codes")
