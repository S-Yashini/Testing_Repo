class KPIQueries:

    # Total classifications count per type
    TOTAL_CLASSIFICATIONS = """
        SELECT
            COUNT(DISTINCT CASE WHEN sm.source_material_type != 'extenders' OR sm.source_material_type IS NULL THEN g.material_id END) AS total_raw_ghs,
            COUNT(DISTINCT CASE WHEN sm.source_material_type != 'extenders' OR sm.source_material_type IS NULL THEN d.material_id END) AS total_raw_dg,
            COUNT(DISTINCT CASE WHEN sm.source_material_type = 'extenders' THEN d.material_id END) AS total_extenders_dg
        FROM sds_master sm
        LEFT JOIN ghs_classification g ON sm.material_id = g.material_id
        LEFT JOIN dg_classification d ON sm.material_id = d.material_id
    """

    # Pending reviews (status not yet approved/rejected)
    PENDING_REVIEWS = """
        SELECT
            COUNT(DISTINCT CASE WHEN (sm.source_material_type != 'extenders' OR sm.source_material_type IS NULL)
                AND g.ghs_status NOT IN ('Approved', 'Rejected') THEN g.material_id END) AS pending_raw_ghs,
            COUNT(DISTINCT CASE WHEN (sm.source_material_type != 'extenders' OR sm.source_material_type IS NULL)
                AND d.dg_status NOT IN ('Approved', 'Rejected') THEN d.material_id END) AS pending_raw_dg,
            COUNT(DISTINCT CASE WHEN sm.source_material_type = 'extenders'
                AND d.dg_status NOT IN ('Approved', 'Rejected') THEN d.material_id END) AS pending_extenders_dg
        FROM sds_master sm
        LEFT JOIN ghs_classification g ON sm.material_id = g.material_id
        LEFT JOIN dg_classification d ON sm.material_id = d.material_id
    """

    # Approved counts
    APPROVED = """
        SELECT
            COUNT(DISTINCT CASE WHEN (sm.source_material_type != 'extenders' OR sm.source_material_type IS NULL)
                AND g.ghs_status = 'Approved' THEN g.material_id END) AS approved_raw_ghs,
            COUNT(DISTINCT CASE WHEN (sm.source_material_type != 'extenders' OR sm.source_material_type IS NULL)
                AND d.dg_status = 'Approved' THEN d.material_id END) AS approved_raw_dg,
            COUNT(DISTINCT CASE WHEN sm.source_material_type = 'extenders'
                AND d.dg_status = 'Approved' THEN d.material_id END) AS approved_extenders_dg
        FROM sds_master sm
        LEFT JOIN ghs_classification g ON sm.material_id = g.material_id
        LEFT JOIN dg_classification d ON sm.material_id = d.material_id
    """

    # Rejected counts
    REJECTED = """
        SELECT
            COUNT(DISTINCT CASE WHEN (sm.source_material_type != 'extenders' OR sm.source_material_type IS NULL)
                AND g.ghs_status = 'Rejected' THEN g.material_id END) AS rejected_raw_ghs,
            COUNT(DISTINCT CASE WHEN (sm.source_material_type != 'extenders' OR sm.source_material_type IS NULL)
                AND d.dg_status = 'Rejected' THEN d.material_id END) AS rejected_raw_dg,
            COUNT(DISTINCT CASE WHEN sm.source_material_type = 'extenders'
                AND d.dg_status = 'Rejected' THEN d.material_id END) AS rejected_extenders_dg
        FROM sds_master sm
        LEFT JOIN ghs_classification g ON sm.material_id = g.material_id
        LEFT JOIN dg_classification d ON sm.material_id = d.material_id
    """

    # Overall average review time in days (upload → reviewed_date, only approved/rejected)
    AVG_REVIEW_TIME = """
        SELECT AVG(review_days) AS avg_review_days
        FROM (
            SELECT
                CAST(
                    (JULIANDAY(g.reviewed_date) - JULIANDAY(sm.created_date))
                AS INTEGER) AS review_days
            FROM sds_master sm
            JOIN ghs_classification g ON sm.material_id = g.material_id
            WHERE g.ghs_status IN ('Approved', 'Rejected')
              AND g.reviewed_date IS NOT NULL

            UNION ALL

            SELECT
                CAST(
                    (JULIANDAY(d.reviewed_date) - JULIANDAY(sm.created_date))
                AS INTEGER) AS review_days
            FROM sds_master sm
            JOIN dg_classification d ON sm.material_id = d.material_id
            WHERE d.dg_status IN ('Approved', 'Rejected')
              AND d.reviewed_date IS NOT NULL
        ) combined
    """

    # Recent activity: materials uploaded or classified within last N days
    RECENT_ACTIVITY = """
        SELECT
            COUNT(DISTINCT CASE WHEN (sm.source_material_type != 'extenders' OR sm.source_material_type IS NULL)
                AND (
                    sm.created_date >= :since
                    OR g.classified_date >= :since
                    OR d.classified_date >= :since
                ) THEN sm.material_id END) AS recent_raw_materials,
            COUNT(DISTINCT CASE WHEN sm.source_material_type = 'extenders'
                AND (
                    sm.created_date >= :since
                    OR d.classified_date >= :since
                ) THEN sm.material_id END) AS recent_extenders
        FROM sds_master sm
        LEFT JOIN ghs_classification g ON sm.material_id = g.material_id
        LEFT JOIN dg_classification d ON sm.material_id = d.material_id
    """

    # Last update: most recent created_date or classified_date across all materials
    LAST_UPDATE = """
        SELECT MAX(latest_date) AS last_update
        FROM (
            SELECT MAX(created_date) AS latest_date FROM sds_master
            UNION ALL
            SELECT MAX(classified_date) FROM ghs_classification
            UNION ALL
            SELECT MAX(classified_date) FROM dg_classification
        ) combined
    """