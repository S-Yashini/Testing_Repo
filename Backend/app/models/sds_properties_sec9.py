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



class SDSProperties(Base):
    __tablename__ = "sds_properties_sec9"

    material_id = Column(
        Integer,
        ForeignKey("material_sds_master.material_id"),
        primary_key=True,
        nullable=False,
    )

    material_code = Column(String(100), nullable=False)
    physical_state = Column(String(255), nullable=True)

    appearance = Column(String(255), nullable=True)
    odor = Column(String(255), nullable=True)

    ph = Column(String(50), nullable=True)
    ph_numeric = Column(Float, nullable=True)

    melting_point = Column(String(100), nullable=True)
    melting_point_celsius = Column(Float, nullable=True)

    boiling_point = Column(String(100), nullable=True)
    boiling_point_celsius = Column(Float, nullable=True)

    flash_point = Column(String(100), nullable=True)
    flash_point_celsius = Column(Float, nullable=True)

    vapor_pressure = Column(String(100), nullable=True)
    vapor_pressure_pa = Column(Float, nullable=True)

    density = Column(String(100), nullable=True)
    density_kg_per_m3 = Column(Float, nullable=True)

    solubility = Column(String(255), nullable=True)

    extraction_timestamp = Column(
        DateTime,
        nullable=False,
        default=datetime.utcnow
    )

    raw_text = Column(Text, nullable=True)

    # Relationship
    material = relationship("MaterialSDSMaster", backref="properties")
