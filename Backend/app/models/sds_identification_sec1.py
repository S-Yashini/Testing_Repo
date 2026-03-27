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



class SDSTable(Base):
    __tablename__ = "sds_identification_sec1"

    material_id = Column(
        Integer,
        ForeignKey("material_sds_master.material_id"),
        primary_key=True,
        nullable=False,
    )

    material_code = Column(String(100), nullable=False)

    product_identifier = Column(String(255), nullable=True)
    product_name = Column(String(255), nullable=True)
    recommended_use = Column(Text, nullable=True)

    supplier_name = Column(String(255), nullable=True)
    supplier_address = Column(Text, nullable=True)

    supplier_city = Column(String(100), nullable=True)
    supplier_country = Column(String(100), nullable=True)
    supplier_postal_code = Column(String(50), nullable=True)

    emergency_phone = Column(String(100), nullable=True)
    emergency_email = Column(String(255), nullable=True)

    extraction_timestamp = Column(
        DateTime, nullable=False, default=datetime.utcnow
    )

    raw_text = Column(Text, nullable=True)

    # Relationship
    material = relationship("MaterialSDSMaster", back_populates="sds_info")
