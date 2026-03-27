from sqlalchemy import text, bindparam
class MaterialQueries:

    GET_MASTER_BY_TYPE = """
        SELECT *
        FROM sds_master
        WHERE source_material_type = :material_type
        ORDER BY created_date DESC
    """

    COUNT_BY_TYPE = """
        SELECT COUNT(*) as total
        FROM sds_master
        WHERE source_material_type = :material_type
    """

    GET_BY_TYPE = """
        SELECT *
        FROM sds_master
        WHERE source_material_type = :material_type
        ORDER BY created_date DESC
        LIMIT :limit OFFSET :offset
    """


    GET_MATERIAL_BY_CODE = """
        SELECT
            *
        FROM sds_master
        WHERE material_code = :material_code
    """



    UPDATE_GHS_STATUS = text("""
        UPDATE ghs_classification
        SET 
            ghs_status = :ghs_status,
            ghs_rejected_reason = :reject_reason
        WHERE material_code IN :material_codes
    """).bindparams(bindparam("material_codes", expanding=True))


    UPDATE_DG_STATUS = text("""
        UPDATE dg_classification
        SET 
            dg_status = :dg_status,
            dg_rejected_reason = :reject_reason
        WHERE material_code IN :material_codes
    """).bindparams(bindparam("material_codes", expanding=True))


    GET_MATERIAL_CODE_BY_ID = """
        SELECT material_code
        FROM sds_master
        WHERE material_code = :material_code
    """


    GET_CHILDREN_BY_PARENT="""
    SELECT
        material_id,
        material_code,
        material_name,
        source_file_path,
        pdf_file_path,
        created_date,
        parent_material_code
    FROM sds_master
    WHERE parent_material_code = :parent_material_code
    ORDER BY created_date DESC

    """


    COUNT_CHILDREN_BY_PARENT = """
    SELECT COUNT(*)
    FROM sds_master
    WHERE parent_material_code = :parent_material_code;

    """


    CHECK_CHILD_EXISTS = """
        SELECT material_id
        FROM sds_master
        WHERE material_code = :material_code
    """

    UPDATE_PARENT_FOR_CHILD = """
        UPDATE sds_master
        SET parent_material_code = :parent_material_code
        WHERE material_code = :material_code
    """


    GET_EXISTING_MATERIAL_CODES = text("""
    SELECT material_code
    FROM dg_classification
    WHERE material_code IN :material_codes
    """).bindparams(bindparam("material_codes", expanding=True))