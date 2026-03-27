class DGMasterQueries:

    GET_BY_UN = ""


    GET_BY_UN_PG_HAZARD = """
    SELECT sample_code
    FROM dg_master
    WHERE un_number = :un_number
    AND packing_group = :pg
    AND hazard_class = :hazard_category
    """
