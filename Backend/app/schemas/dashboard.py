from pydantic import BaseModel


class ClassificationCounts(BaseModel):
    raw_ghs: int
    raw_dg: int
    extenders_dg: int


class ComplianceRate(BaseModel):
    approved: int
    total: int
    percentage: float


class ComplianceStatus(BaseModel):
    raw_materials_ghs: ComplianceRate
    raw_materials_dg: ComplianceRate
    extenders_dg: ComplianceRate


class SystemStatus(BaseModel):
    overall_avg_review_time_days: float | None
    recent_raw_materials: int
    recent_extenders: int
    recent_activity_days: int
    last_update_days_ago: int | None


class KPIOverviewResponse(BaseModel):
    total_classifications: ClassificationCounts
    pending_reviews: ClassificationCounts
    approved: ClassificationCounts
    rejected: ClassificationCounts
    compliance_status: ComplianceStatus
    system_status: SystemStatus