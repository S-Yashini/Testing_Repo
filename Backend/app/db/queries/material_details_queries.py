class MaterialDetailsQueries:

    MASTER = """
    SELECT *
    FROM sds_master
    WHERE material_code = :material_code
    """

    SDS_INFO = """
    SELECT *
    FROM sds_identification_sec1
    WHERE material_code = :material_code
    """

    HAZARDS = """
    SELECT *
    FROM sds_hazards_sec2
    WHERE material_code = :material_code
    """

    COMPOSITION = """
    SELECT *
    FROM sds_composition_sec3
    WHERE material_id = :material_id
    """

    TOXICOLOGY = """
    SELECT *
    FROM sds_toxicology_sec11
    WHERE material_id = :material_id
    """

    PROPERTIES = """
    SELECT physical_state, appearance, odor, flash_point, boiling_point, vapor_pressure, raw_text
    FROM sds_properties_sec9
    WHERE material_code = :material_code
    """

    TRANSPORT = """
    SELECT material_code, un_number, transport_hazard_class, packing_group, transport_modes
    FROM sds_transportation_sec14
    WHERE material_code = :material_code
    """

    GHS = """
    SELECT *
    FROM ghs_classification
    WHERE material_code = :material_code
    """

    DG = """
    SELECT *
    FROM dg_classification
    WHERE material_code = :material_code
    """


    HAZARDS_CODES = """
    SELECT *
    FROM sds_hazard_codes
    WHERE material_code = :material_code
    """
