import pandas as pd
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

# ----------------------------------
# SQLITE DATABASE CONNECTION
# ----------------------------------
DATABASE_URL = "sqlite:///dev.db"

# ----------------------------------
# LOAD JURISDICTION SHEET
# ----------------------------------

from sqlalchemy import Column, Integer, String
from sqlalchemy.orm import declarative_base

Base = declarative_base()

class Jurisdiction(Base):
    __tablename__ = "sdg_jurisdiction_master"

    id = Column(Integer, primary_key=True, autoincrement=True)

    material_code = Column(String(100))
    authority_country = Column(String(10))
    un_number = Column(String(50))
    psn = Column(String(255))
    packaging_group = Column(String(50))
    hazard_class = Column(String(50), nullable=False)

engine = create_engine(DATABASE_URL, echo=False)
Base.metadata.create_all(engine)
Session = sessionmaker(bind=engine)
session = Session()


excel_file = "app\models\Sample Raw codes & Jurudiction.xlsx"
sheet_name = "DG Jurudiction"  # change if different

jur_df = pd.read_excel(
    excel_file,
    sheet_name=sheet_name,
    dtype={"material_code": str},
    keep_default_na=False
)

jur_df["material_code"] = (
    jur_df["material_code"]
        .astype(str)
        .str.strip()
)
jur_df["packaging_group"] = (
    jur_df["packaging_group"]
        .astype(str)
        .str.strip()
)
# Clean column names
jur_df.columns = jur_df.columns.str.strip().str.lower()

# Remove rows missing PK fields
jur_df.columns = (
    jur_df.columns
    .str.strip()
    .str.lower()
    .str.replace(" ", "_")
)

jur_df = jur_df.dropna(subset=["un_number", "authority_country"])

for _, row in jur_df.iterrows():

    if pd.isna(row.get("hazard_category")):
        raise ValueError(
            f"Hazard class missing for UN {row.get('un_number')} "
            f"in {row.get('authority_country')}"
        )

    jurisdiction_record = Jurisdiction(
        # material_id=MATERIAL_ID,
        material_code=row.get("material_code"),
        authority_country=str(row["authority_country"]).strip().upper(),
        un_number=str(row["un_number"]).strip().upper(),
        psn=row.get("psn"),
        packaging_group=row.get("packaging_group"),
        hazard_class=row.get("hazard_category"),
    )

    session.merge(jurisdiction_record)

session.commit()
session.close()

print("Jurisdiction table populated successfully.")