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


class SDSComposition(Base):
    __tablename__ = "sds_composition_sec3"

    material_id = Column(
        Integer,
        ForeignKey("material_sds_master.material_id"),
        primary_key=True,
        nullable=False,
    )

    ingredient_sequence = Column(
        Integer,
        primary_key=True,
        nullable=False,
        doc="Ingredient order in composition"
    )

    product_type = Column(
        String(100),
        nullable=False,
        doc="Substance or mixture type"
    )

    chemical_name = Column(String(255), nullable=True)
    cas_number = Column(String(100), nullable=True)
    ec_number = Column(String(100), nullable=True)

    concentration = Column(String(100), nullable=True)
    concentration_numeric = Column(Float, nullable=True)

    classification = Column(Text, nullable=True)

    extraction_timestamp = Column(
        DateTime,
        nullable=False,
        default=datetime.utcnow
    )

    raw_text = Column(Text, nullable=True)

    # Relationship back to master
    material = relationship("MaterialSDSMaster", backref="composition")
