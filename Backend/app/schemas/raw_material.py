from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field, model_validator


# -----------------------------
# Section 2 Models
# -----------------------------
class Section2Model(BaseModel):
    classification: str
    hazards: List[str]
    ghsCodes: List[str]
    signalWord: str
    hazardStatements: str
    precautionaryCodes: List[str]
    precautionaryStatements: str
    carcinogenicity: Optional[str]
    additionalNotes: Optional[str]


# -----------------------------
# Section 3 Models
# -----------------------------
class CompositionItemModel(BaseModel):
    chemicalName: str
    casNumber: Optional[str]
    concentration: Optional[str]
    ghsClassification: List[str]
    hazardStatements: List[str]


class Section3Model(BaseModel):
    chemicalNature: str
    description: str
    composition: List[CompositionItemModel]


# -----------------------------
# Section 9 Models
# -----------------------------
class Section9Model(BaseModel):
    physicalState: str
    appearance: str
    odour: str
    flashPoint: str
    boilingPoint: Optional[str]
    vapourPressure: Optional[str]
    note: Optional[str]


# -----------------------------
# Section 14 Models
# -----------------------------
class TransportRegulationModel(BaseModel):
    unNumber: str
    description: str
    class_: str  # "class" is reserved in Python
    packingGroup: str
    labels: str
    marinePollutant: Optional[str] = None


class Section14Model(BaseModel):
    dot: str
    iata: TransportRegulationModel
    imdg: TransportRegulationModel
    otherInformation: Optional[str]


# -----------------------------
# Sections Wrapper Model
# -----------------------------
class SectionsModel(BaseModel):
    section2: Section2Model
    section3: Section3Model
    section9: Section9Model
    section14: Section14Model


# -----------------------------
# Main Response Schema
# -----------------------------
class MaterialResponseModel(BaseModel):
    id: int
    materialId: str
    materialName: str
    source: str
    partNumber: str
    internalCode: str
    synonyms: List[str]

    productType: str
    intendedUse: str
    manufacturer: str
    manufacturerLocation: str
    emergencyContact: Optional[str]

    aiRecommendedDGCode: str
    rationaleSummary: str
    ghsRationale: str
    dgRationale: str

    ghsPictograms: List[str]
    hazardousWaste: bool

    sdsSheetUrl: str

    GHSStatus: str
    DGStatus: str
    GHS_Approval_Rejection_Date: Optional[str] = None
    DG_Approval_Rejection_Date: Optional[str] = None

    feedback: Optional[str]

    sections: SectionsModel
    uploadedDate: str


# -----------------------------
# Response Wrapper (List API)
# -----------------------------
class MaterialListResponse(BaseModel):
    data: List[MaterialResponseModel]



from typing import Optional, Literal


class MaterialApprovalRequest(BaseModel):
    material_codes: List[str]
    ghs_status: Optional[Literal["Approved", "Rejected", "Pending Review"]] = None
    dg_status: Optional[Literal["Approved", "Rejected", "Pending Review"]] = None

    reject_reason: Optional[str] = Field(default=None)