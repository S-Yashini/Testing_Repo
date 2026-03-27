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



class SDSTransportation(Base):
    __tablename__ = "sds_transportation_sec14"

    material_id = Column(
        Integer,
        ForeignKey("material_sds_master.material_id"),
        primary_key=True,
        nullable=False,
    )

    material_code = Column(String(100), nullable=False)

    marine_pollutant = Column(String(50), nullable=True)

    un_number = Column(String(50), nullable=True)
    un_proper_shipping_name = Column(String(255), nullable=True)

    transport_hazard_class = Column(String(100), nullable=True)
    packing_group = Column(String(50), nullable=True)

    environmental_hazards = Column(Text, nullable=True)
    special_precautions = Column(Text, nullable=True)

    maritime_transport = Column(Text, nullable=True)
    air_transport = Column(Text, nullable=True)
    road_transport = Column(Text, nullable=True)
    rail_transport = Column(Text, nullable=True)

    extraction_timestamp = Column(
        DateTime,
        nullable=False,
        default=datetime.utcnow
    )

    raw_text = Column(Text, nullable=True)

    # Relationship
    material = relationship("MaterialSDSMaster", backref="transportation")
