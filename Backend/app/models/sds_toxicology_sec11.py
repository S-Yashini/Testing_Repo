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



class SDSToxicology(Base):
    __tablename__ = "sds_toxicology_sec11"

    material_id = Column(
        Integer,
        ForeignKey("material_sds_master.material_id"),
        primary_key=True,
        nullable=False,
    )

    material_code = Column(String(100), nullable=False)

    aspiration_hazard = Column(Text, nullable=True)
    acute_toxicity = Column(Text, nullable=True)

    skin_corrosion = Column(Text, nullable=True)
    skin_irritation = Column(Text, nullable=True)

    eye_damage = Column(Text, nullable=True)
    eye_irritation = Column(Text, nullable=True)

    respiratory_sensitization = Column(Text, nullable=True)

    carcinogenicity = Column(Text, nullable=True)
    reproductive_toxicity = Column(Text, nullable=True)

    stot_single_exposure = Column(Text, nullable=True)
    stot_repeated_exposure = Column(Text, nullable=True)

    germ_cell_mutagenicity = Column(Text, nullable=True)

    extraction_timestamp = Column(
        DateTime,
        nullable=False,
        default=datetime.utcnow
    )

    raw_text = Column(Text, nullable=True)

    # Relationship
    material = relationship("MaterialSDSMaster", backref="toxicology")
