import json
from datetime import datetime
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

# Import your models
from app.models.sds_master import MaterialSDSMaster
from app.models.sds_identification_sec1 import SDSTable
from app.models.sds_hazards_sec2 import SDSHazards
from app.models.sds_composition_sec3 import SDSComposition
from app.models.sds_properties_sec9 import SDSProperties
from app.models.ghs_classification import MaterialGHSClassification
from app.models.dg_classification import MaterialDGClassification


from app.core.database import Base  # same Base used in models

DB_URL = "sqlite:///dev.db"

engine = create_engine(DB_URL)
Session = sessionmaker(bind=engine)

# Create tables
Base.metadata.drop_all(engine)
Base.metadata.create_all(engine)


def load_json():
    with open(r"app\models\sdsRecords.json", "r") as f:
        return json.load(f)


def insert_material(session, item):
    material_id = item["id"]
    material_code = item["materialId"]

    master = MaterialSDSMaster(
        material_id=material_id,
        material_code=material_code,
        material_name=item["materialName"],
        sds_version="1",
        sds_date=None,
        pdf_file_path=item.get("sdsSheetUrl"),
        source_file_path=item.get("source"),
        processing_status="processed"
    )
    session.add(master)
    return master


def insert_sds_info(session, item):
    sds = SDSTable(
        material_id=item["id"],
        material_code=item["materialId"],
        product_identifier=item["partNumber"],
        product_name=item["materialName"],
        recommended_use=item["intendedUse"],
        supplier_name=item["manufacturer"],
        supplier_address=item["manufacturerLocation"],
        emergency_phone=item["emergencyContact"]
    )
    session.add(sds)


def insert_hazards(session, item):
    sec2 = item["sections"]["section2"]

    hazards = SDSHazards(
        material_id=item["id"],
        material_code=item["materialId"],
        classification=sec2["classification"],
        signal_word=sec2["signalWord"],
        hazard_statements=sec2["hazardStatements"],
        precautionary_statements=sec2["precautionaryStatements"],
        pictograms=item["ghsPictograms"],
        # precautionary_codes=sec2["precautionaryCodes"]

    )
    session.add(hazards)


def insert_composition(session, item):
    comp = item["sections"]["section3"]["composition"]

    for idx, chem in enumerate(comp, start=1):
        row = SDSComposition(
            material_id=item["id"],
            ingredient_sequence=idx,
            product_type=item["productType"],
            chemical_name=chem["chemicalName"],
            cas_number=chem.get("casNumber"),
            concentration=chem.get("concentration")
        )
        session.add(row)


def insert_properties(session, item):
    sec9 = item["sections"]["section9"]

    prop = SDSProperties(
        material_id=item["id"],
        material_code=item["materialId"],
        appearance=sec9.get("appearance"),
        odor=sec9.get("odour"),
        flash_point=sec9.get("flashPoint"),
        boiling_point=sec9.get("boilingPoint"),
        vapor_pressure=sec9.get("vapourPressure"),
        physical_state = sec9.get("physicalState")
    )
    session.add(prop)


def insert_ghs(session, item):
    ghs = MaterialGHSClassification(
        material_id=item["id"],
        material_code=item["materialId"],
        ghs_classification=item["sections"]["section2"]["classification"],
        ghs_category="Mixed",
        ghs_reason=item["ghsRationale"],
        ghs_status=item["GHSStatus"],
        ai_model_name="gpt",
        ai_model_version="v1",
        reviewed_by="system",
        reviewed_at=datetime.utcnow()
    )
    session.add(ghs)


def insert_dg(session, item):
    dg = MaterialDGClassification(
        material_id=item["id"],
        material_code=item["materialId"],
        dg_classification=item["aiRecommendedDGCode"],
        dg_reason=item["dgRationale"],
        dg_status=item["DGStatus"],
        material_description=item["materialName"],
        confidence_score="0.9",
        ai_model_name="gpt",
        ai_model_version="v1",
        reviewed_by="system",
        reviewed_at=datetime.utcnow(),
        hazardous_waste=str(item.get("hazardousWaste")),
        rationale_summary=item["rationaleSummary"]
    )
    session.add(dg)

from app.models.sds_toxicology_sec11 import SDSToxicology
from datetime import datetime, UTC

def insert_toxicology(session, item):
    sec2 = item.get("sections", {}).get("section2", {})

    tox = SDSToxicology(
        material_id=item["id"],
        material_code=item["materialId"],

        skin_irritation="Yes" if "Skin irritation" in str(sec2.get("hazards")) else None,
        eye_irritation="Yes" if "Eye irritation" in str(sec2.get("hazards")) else None,
        respiratory_sensitization="Yes" if "Skin sensitization" in str(sec2.get("hazards")) else None,

        carcinogenicity=sec2.get("carcinogenicity"),
        reproductive_toxicity="Suspected" if "H361" in str(sec2.get("ghsCodes")) else None,

        aspiration_hazard=None,
        acute_toxicity=None,
        skin_corrosion=None,
        eye_damage=None,
        stot_single_exposure=None,
        stot_repeated_exposure=None,
        germ_cell_mutagenicity=None,

        extraction_timestamp=datetime.now(UTC),
        raw_text=str(sec2)
    )

    session.add(tox)




from app.models.sds_transpotation_sec14 import SDSTransportation
from datetime import datetime, UTC

def insert_transport(session, item):
    sec14 = item.get("sections", {}).get("section14", {})
    iata = sec14.get("iata", {})
    imdg = sec14.get("imdg", {})

    transport = SDSTransportation(
        material_id=item["id"],
        material_code=item["materialId"],

        marine_pollutant=imdg.get("marinePollutant"),

        un_number=iata.get("unNumber"),
        un_proper_shipping_name=iata.get("description"),

        transport_hazard_class=iata.get("class"),
        packing_group=iata.get("packingGroup"),

        maritime_transport=str(imdg),
        air_transport=str(iata),
        road_transport=sec14.get("dot"),
        rail_transport=None,

        environmental_hazards=None,
        special_precautions=sec14.get("otherInformation"),

        extraction_timestamp=datetime.now(UTC),
        raw_text=str(sec14)
    )

    session.add(transport)

def main():
    data = load_json()
    session = Session()

    for item in data:
        insert_material(session, item)
        insert_sds_info(session, item)
        insert_hazards(session, item)
        insert_composition(session, item)
        insert_properties(session, item)
        insert_ghs(session, item)
        insert_dg(session, item)
        insert_toxicology(session, item)
        insert_transport(session, item)



    session.commit()
    session.close()
    print("Inserted successfully")


if __name__ == "__main__":
    main()
