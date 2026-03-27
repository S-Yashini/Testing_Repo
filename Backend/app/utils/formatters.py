import re
import json
import ast


def _safe_parse(t):
    if isinstance(t, dict):
        return t

    if not t or not isinstance(t, str):
        return {}

    t = t.strip()

    try:
        parsed = json.loads(t)
        if isinstance(parsed, str):  # double encoded
            return json.loads(parsed)
        return parsed
    except:
        pass

    try:
        return ast.literal_eval(t)
    except:
        return {}
    


def format_section2(h):
    if not h:
        return {}

    def safe_str(val):
        return val if isinstance(val, str) else ""

    def split_codes(val):
        if not val or not isinstance(val, str):
            return []
        return [code.strip() for code in val.split("|") if code.strip()]

    # Parse pictograms
    pictograms = []
    if h.get("pictograms"):
        try:
            pictograms = json.loads(h["pictograms"])
        except:
            pictograms = []

    # Extract hazards (unchanged)
    hazards = []
    classification = safe_str(h.get("classification_substance"))

    if classification:
        for part in classification.split(";"):
            hazards.append(part.split(",")[0].strip())

    hazard_codes = split_codes(h.get("hazard_codes"))
    precautionary_codes = split_codes(h.get("precautionary_codes"))

    hazard_text = safe_str(h.get("hazard_statements"))
    precaution_text = safe_str(h.get("precautionary_statements"))

    return {
        "classification": classification,
        "hazards": hazards,
        "ghs_codes": pictograms + hazard_codes,
        "signal_word": h.get("signal_word"),
        "hazard_statements": hazard_text.strip('"'),
        "precautionary_codes": precautionary_codes,
        "precautionary_statements": precaution_text.strip('"'),
        # "carcinogenicity": "Not specified in source material.",
        # "additional_notes": "These classifications are explicitly stated by the manufacturer in Section 2 and supported by component toxicology in Sections 3 and 11."
    }



# def format_section3(composition, sds_info, ghs, dg):
#     if not composition:
#         return {}

#     # Chemical nature (take from first row product_type)
#     chemical_nature = composition[0].get("product_type")

#     # Build description
#     description = (
#         f"{sds_info.get('product_name', '')} - Fragrance / Perfume compound. "
#         f"Product Identifier: {sds_info.get('product_identifier', '')}, "
#         f"Internal code: {sds_info.get('material_code', '')}. "
#         f"Manufacturer: {sds_info.get('supplier_name', '')}, "
#         f"{sds_info.get('supplier_address', '')}."
#     )

#     formatted_composition = []
#     for item in composition:
#         formatted_composition.append({
#             "chemical_name": item.get("chemical_name"),
#             "cas_number": item.get("cas_number"),
#             "concentration": item.get("concentration"),
#             "ghs_classification": [],
#             "hazard_statements": []
#         })

#     return {
#         "chemical_nature": chemical_nature,
#         "description": description,
#         "composition": formatted_composition
#     }



def format_section3(composition, sds_info=None, ghs=None, dg=None):
    if not composition:
        return {}

    chemical_nature = composition[0].get("product_type") if composition else None

    description = (
        f"{(sds_info or {}).get('product_name', '')} - Fragrance / Perfume compound. "
        f"Product Identifier: {(sds_info or {}).get('product_identifier', '')}, "
        f"Internal code: {(sds_info or {}).get('material_code', '')}. "
        f"Manufacturer: {(sds_info or {}).get('supplier_name', '')}, "
        f"{(sds_info or {}).get('supplier_address', '')}."
    )

    final_composition = []

    for row in composition:
        comp_json = row.get("composition")

        parsed = _safe_parse(comp_json)

        if isinstance(parsed, list):
            final_composition.extend(parsed)

    return {
        "chemical_nature": chemical_nature,
        "description": description,
        "composition": final_composition
    }




def format_section9(props):
    if not props:
        return {}

    def clean_text(val):
        if not val:
            return val
        return (
            val.replace("Â°F", "°F")
               .replace("Â°C", "°C")
               .strip()
        )

    flash_point = clean_text(props.get("flash_point"))
    

    return {
        "physical_state": props.get("physical_state"),
        "appearance": props.get("appearance"),
        "odour": props.get("odor"),  # rename
        "flash_point": flash_point,
        "boiling_point": props.get("boiling_point"),
        "vapour_pressure": props.get("vapor_pressure"),
        "note": (
            "Flash point exceeds 60 °C, excluding it from Class 3 flammable liquids "
            "but still meeting the U.S. definition of a combustible liquid."
            if flash_point and "°C" in flash_point else None
        )
    }




def clean_text(val):
    if not val:
        return val
    return (
        val.replace("â†’", "→")
           .replace("â‰¤", "≤")
           .replace("Â", "")
           .strip()
    )

def parse_dict_string(val):
    try:
        return ast.literal_eval(val) if val else {}
    except:
        return {}


def to_snake_case_dict(d):
    if not d:
        return {}

    def camel_to_snake(key):
        return re.sub(r'(?<!^)(?=[A-Z])', '_', key).lower()

    return {camel_to_snake(k): v for k, v in d.items()}

# def format_section14(t):
#     if not t:
#         return {}

#     iata_raw = parse_dict_string(t.get("air_transport") or "")
#     imdg_raw = parse_dict_string(t.get("maritime_transport") or "")

#     return {
#         "dot": t.get("road_transport"),
#         "iata": to_snake_case_dict(iata_raw),
#         "imdg": to_snake_case_dict(imdg_raw),
#         "otherInformation": t.get("special_precautions")
#     }





def format_section14(section14):
    if not section14:
        return section14

    raw_modes = section14.get("transport_modes")

    parsed_modes = _safe_parse(raw_modes)

    if not isinstance(parsed_modes, dict):
        section14["transport_modes"] = {}
        return section14

    normalized_modes = {}

    for mode, details in parsed_modes.items():
        # 🔥 KEEP MODE KEY EXACTLY SAME
        if isinstance(details, dict):
            normalized_details = {
                k.strip().replace(" ", "_"): v   # optional normalization
                for k, v in details.items()
            }
        else:
            normalized_details = details

        normalized_modes[mode] = normalized_details  # ← no casing change

    section14["transport_modes"] = normalized_modes

    return section14




def ghs_extract_classifications(text):
    if not isinstance(text, str) or not text.strip():
        return []

    if "not classified" in text.lower():
        return []

    results = []

    # 🔥 Split by both | and ;
    parts = re.split(r"\||;", text)

    for part in parts:
        part = part.strip()
        if not part:
            continue

        try:
            # ✅ Case 1: "Flammable liquids: Category 2"
            match = re.search(r"(.+?):\s*Category\s*([0-9A-Za-z]+)", part, re.I)
            if match:
                results.append({
                    "classification_name": match.group(1).strip(),
                    "category": match.group(2).strip()
                })
                continue

            # ✅ Case 2: "Flammable liquids: Category 2A" (already handled above but safe)
            match = re.search(r"(.+?):\s*Sub-category\s*([0-9A-Za-z]+)", part, re.I)
            if match:
                results.append({
                    "classification_name": match.group(1).strip(),
                    "category": match.group(2).strip()
                })
                continue

            # ✅ Case 3: "Skin Irrit. 2" or "Aquatic Chronic 2"
            match = re.search(r"(.+?)\s+([0-9][A-Za-z]?)$", part)
            if match:
                results.append({
                    "classification_name": match.group(1).strip(),
                    "category": match.group(2).strip()
                })
                continue

            # ✅ Case 4: "Flammable liquids 3" (no 'Category')
            match = re.search(r"(.+?)\s+([0-9][A-Za-z]?)", part)
            if match:
                results.append({
                    "classification_name": match.group(1).strip(),
                    "category": match.group(2).strip()
                })
                continue

            # ✅ Case 5: Only classification (e.g., "Combustible Dust")
            results.append({
                "classification_name": part,
                "category": ""
            })

        except Exception:
            continue

    return results


def parse_ghs_pictograms(raw):
    """
    Converts pictogram field into a clean list of GHS codes.
    
    Supports:
    - JSON list string: '["GHS02", "GHS07"]'
    - Pipe-separated: 'GHS02 | GHS07 | GHS08'
    - Comma-separated: 'GHS02, GHS07'
    
    Returns:
    - List[str] → ['GHS02', 'GHS07']
    """

    if not raw:
        return []

    try:
        # Case 1: JSON string
        if isinstance(raw, str) and raw.strip().startswith("["):
            parsed = json.loads(raw)

            return [
                str(p).strip().upper()
                for p in parsed
                if p and str(p).strip().upper().startswith("GHS")
            ]

        # Case 2: Normal string (pipe/comma separated)
        parts = re.split(r"[|,]", str(raw))

        return [
            p.strip().upper()
            for p in parts
            if p.strip() and p.strip().upper().startswith("GHS")
        ]

    except Exception:
        return []