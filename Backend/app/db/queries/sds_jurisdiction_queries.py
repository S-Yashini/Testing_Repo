class JurisdictionQueries:

    GET_BY_MATERIAL = """
        SELECT
            id,
            material_code,
            authority_country,
            un_number,
            psn,
            packaging_group,
            hazard_class,
            created_date,
            modified_date
        FROM dg_jurisdiction
        WHERE material_code = :material_code
        ORDER BY id ASC
    """


    DELETE_BY_MATERIAL_CODE = """
        DELETE FROM sds_jurisdiction_master
        WHERE material_code = :material_code
    """

    INSERT_NEW_ROW = """
        INSERT INTO sds_jurisdiction_master (
            material_code,
            authority_country,
            un_number,
            psn,
            packaging_group,
            hazard_class
        )
        VALUES (
            :material_code,
            :authority_country,
            :un_number,
            :psn,
            :packaging_group,
            :hazard_class
        )
    """


    GET_JURISDICTION_BY_PARENT = """
        SELECT
            material_code,
            authority_country,
            un_number,
            psn,
            packaging_group,
            hazard_class
        FROM sds_jurisdiction_master
        WHERE material_code = :material_code
    """
