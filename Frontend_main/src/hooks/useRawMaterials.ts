/**
 * React Query hooks for Raw Materials
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

// Set VITE_RAW_MATERIALS_API_URL to your backend (e.g. http://localhost:8000/api/v1/materials/) so fetch hits the API server, not the frontend origin. Trailing slash normalized.
// const RAW_MATERIALS_API_URL = (
//   (import.meta.env.VITE_RAW_MATERIALS_API_URL as string) || 'http://localhost:8000/api/v1/materials/'
// ).replace(/\/*$/, '/');


//const RAW_MATERIALS_API_URL = (
// (import.meta.env.VITE_RAW_MATERIALS_API_URL as string) || 'http://localhost:8000/api/v1/materials/'
//).replace(/\/*$/, '/');
//const RAW_MATERIALS_API_URL = ('http://localhost:8000/api/v1/materials');
const BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';
const RAW_MATERIALS_API_URL = `${BASE_URL}/v1/materials`;


type ApiRawMaterial = {
  id: number;
  material_id: string;
  material_name: string;
  internal_code?: string;
  intended_use?: string;
  product_type?: string;
  part_number?: string;
  source?: string;
  sdssheet_url?: string;
  manufacturer?: string;
  manufacturer_location?: string;
  emergency_contact?: string;
  ai_recommended_dgcode?: string;
  rationale_summary?: string;
  ghs_rationale?: string;
  dg_rationale?: string;
  ghs_status?: string;
  dg_status?: string;
  ghs_pictograms?: string[];
  hazardous_waste?: boolean | string;
  feedback?: string;
  ghs_reject_reason?: string;
  dg_reject_reason?: string;
  uploaded_date?: string;
  sections?: any;
  ghs_classification_data?: Array<{ classification_name: string; category: string }>;
  hazards_codes?: Array<{ material_code?: string; code: string; code_desc: string; country?: string; code_type?: string }>;
  'GHS Approval/Rejection Date'?: string;
  'DG Approval/Rejection Date'?: string;
};

type ApiPaginationMeta = {
  page: number;
  page_size: number;
  total_records: number;
  total_pages: number;
  has_next: boolean;
  has_previous: boolean;
};

type ApiRawMaterialsResponse = {
  success: boolean;
  data: ApiRawMaterial[];
  meta?: {
    pagination: ApiPaginationMeta;
    available_dg_classes?: string[];
    available_ghs_classes?: string[];
  };
};

export interface SDSRecord {
  id: number;
  materialId: string;
  hazardousWaste?: boolean;
  materialName: string;
  source: string;
  partNumber?: string;
  internalCode?: string;
  sdsNumber?: string;
  synonyms?: string[];
  casNumber?: string;
  ecNumber?: string;
  indexNumber?: string;
  productType?: string;
  intendedUse?: string;
  manufacturer?: string;
  manufacturerLocation?: string;
  emergencyContact?: string;
  aiRecommendedDGCode: string;
  rationaleSummary: string;
  ghsRationale?: string;
  dgRationale?: string;
  ghsPictograms: string[];
  sdsSheetUrl?: string;
  status: string;
  GHSStatus?: string;
  DGStatus?: string;
  feedback: string;
  ghs_reject_reason?: string;
  dg_reject_reason?: string;
  sections: {
    section2: {
      classification: string;
      hazards: string[];
      ghsCodes: string[];
      signalWord: string;
      hazardStatements: string;
      precautionaryCodes: string[];
      precautionaryStatements: string;
      carcinogenicity: string;
      additionalNotes?: string;
    };
    section3: {
      chemicalNature: string;
      description: string;
      composition: Array<{
        chemicalName: string;
        casNumber: string;
        concentration: string;
        ghsClassification: string[];
        hazardStatements: string[];
      }>;
    };
    section9: {
      physicalState: string;
      appearance: string;
      odour: string;
      flashPoint: string;
      boilingPoint?: string;
      vapourPressure: string;
      density?: string;
      lowerExplosiveLimit?: string;
      upperExplosiveLimit?: string;
      note: string;
    };
    section14: {
      dot?: string;
      kemlerCode?: string;
      transportModes?: Record<
        string,
        {
          unNumber?: string;
          properShippingName?: string;
          transportHazardClass?: string;
          packingGroup?: string;
          marinePollutant?: string;
          environmentalHazards?: string;
          specialPrecautions?: string;
        }
      >;
      iata: {
        unNumber: string;
        description: string;
        class: string;
        packingGroup: string;
        labels: string;
        limitedQuantity?: string;
        passengerAircraftLimit?: string;
        cargoAircraftLimit?: string;
      };
      imdg: {
        unNumber: string;
        description: string;
        class: string;
        packingGroup: string;
        labels: string;
        emsNumber1?: string;
        emsNumber2?: string;
        marinePollutant?: string;
        limitedQuantity?: string;
      };
      tdg?: {
        class: string;
        packingGroup: string;
      };
      mexico?: {
        class: string;
        packingGroup: string;
      };
      otherInformation?: string;
    };
  };
  uploadedDate: string;
  ghsClassificationData?: Array<{ classificationName: string; category: string }>;
  hazardsCodes?: Array<{ materialCode?: string; code: string; codeDesc: string; country?: string; type?: string }>;
  'GHS Approval/Rejection Date'?: string;
  'DG Approval/Rejection Date'?: string;
}

const toOptionalBool = (value: unknown): boolean | undefined => {
  if (typeof value === 'boolean') return value;
  if (typeof value === 'string') {
    const normalized = value.trim().toLowerCase();
    if (['true', '1', 'yes', 'y'].includes(normalized)) return true;
    if (['false', '0', 'no', 'n'].includes(normalized)) return false;
  }
  return undefined;
};

export const mapApiMaterialToSdsRecord = (m: ApiRawMaterial): SDSRecord => {
  const section2 = m.sections?.section2 ?? {};
  const section3 = m.sections?.section3 ?? {};
  const section9 = m.sections?.section9 ?? {};
  const section14 = m.sections?.section14 ?? {};

  const iata = section14?.iata ?? {};
  const imdg = section14?.imdg ?? {};
  const transportModesRaw = section14?.transport_modes ?? section14?.transportModes ?? {};
  const transportModes = Object.entries(transportModesRaw as Record<string, any>).reduce(
    (acc, [mode, details]) => {
      acc[mode] = {
        unNumber: details?.un_number ?? details?.unNumber ?? '',
        properShippingName: details?.proper_shipping_name ?? details?.properShippingName ?? '',
        transportHazardClass: details?.transport_hazard_class ?? details?.transportHazardClass ?? '',
        packingGroup: details?.packing_group ?? details?.packingGroup ?? '',
        marinePollutant: details?.marine_pollutant ?? details?.marinePollutant ?? '',
        environmentalHazards: details?.environmental_hazards ?? details?.environmentalHazards ?? '',
        specialPrecautions: details?.special_precautions ?? details?.specialPrecautions ?? '',
      };
      return acc;
    },
    {} as NonNullable<SDSRecord['sections']['section14']['transportModes']>
  );

  const s: SDSRecord = {
    id: m.id,
    materialId: m.material_id || '',
    materialName: m.material_name || '',
    source: m.source || '',
    partNumber: m.part_number || '',
    internalCode: m.internal_code || '',
    intendedUse: m.intended_use || '',
    productType: m.product_type || '',
    manufacturer: m.manufacturer || '',
    manufacturerLocation: m.manufacturer_location || '',
    emergencyContact: m.emergency_contact || '',
    sdsSheetUrl: m.sdssheet_url || '',
    hazardousWaste: toOptionalBool(m.hazardous_waste) ?? false,
    aiRecommendedDGCode: m.ai_recommended_dgcode || '',
    rationaleSummary: m.rationale_summary || '',
    ghsRationale: m.ghs_rationale || '',
    dgRationale: m.dg_rationale || '',
    ghsPictograms: Array.isArray(m.ghs_pictograms) ? m.ghs_pictograms : [],
    status: 'Pending Review',
    GHSStatus: m.ghs_status || 'Pending Review',
    DGStatus: m.dg_status || 'Pending Review',
    feedback: m.feedback ?? '',
    ghs_reject_reason: m.ghs_reject_reason ?? (m as any).ghsRejectReason ?? '',
    dg_reject_reason: m.dg_reject_reason ?? (m as any).dgRejectReason ?? '',
    uploadedDate: m.uploaded_date || '',
    ghsClassificationData: Array.isArray(m.ghs_classification_data)
      ? m.ghs_classification_data.map((item: { classification_name: string; category: string }) => ({
          classificationName: item.classification_name ?? '',
          category: item.category ?? '',
        }))
      : undefined,
    hazardsCodes: Array.isArray(m.hazards_codes)
      ? m.hazards_codes.map((item: { material_code?: string; code: string; code_desc: string; country?: string; code_type?: string }) => ({
          materialCode: item.material_code,
          code: item.code ?? '',
          codeDesc: item.code_desc ?? '',
          country: item.country,
          type: item.code_type,
        }))
      : undefined,
    'GHS Approval/Rejection Date': m['GHS Approval/Rejection Date'],
    'DG Approval/Rejection Date': m['DG Approval/Rejection Date'],
    sections: {
      section2: {
        classification: section2?.classification || 'N/A',
        hazards: Array.isArray(section2?.hazards) ? section2.hazards : [],
        ghsCodes: Array.isArray(section2?.ghs_codes)
          ? section2.ghs_codes
          : Array.isArray(section2?.ghsCodes)
            ? section2.ghsCodes
            : [],
        signalWord: section2?.signal_word || section2?.signalWord || 'N/A',
        hazardStatements: section2?.hazard_statements || section2?.hazardStatements || 'N/A',
        precautionaryCodes: Array.isArray(section2?.precautionary_codes)
          ? section2.precautionary_codes
          : Array.isArray(section2?.precautionaryCodes)
            ? section2.precautionaryCodes
            : [],
        precautionaryStatements:
          section2?.precautionary_statements || section2?.precautionaryStatements || 'N/A',
        carcinogenicity: section2?.carcinogenicity || 'N/A',
        additionalNotes: section2?.additional_notes || section2?.additionalNotes,
      },
      section3: {
        chemicalNature: section3?.chemical_nature || section3?.chemicalNature || 'N/A',
        description: section3?.description || 'N/A',
        composition: Array.isArray(section3?.composition)
          ? section3.composition.map((c: any) => ({
              chemicalName: c?.chemical_name || c?.chemicalName || 'N/A',
              casNumber: c?.cas_number || c?.casNumber || 'N/A',
              concentration: c?.concentration || 'N/A',
              ghsClassification: Array.isArray(c?.ghs_classification)
                ? c.ghs_classification
                : Array.isArray(c?.ghsClassification)
                  ? c.ghsClassification
                  : [],
              hazardStatements: Array.isArray(c?.hazard_statements)
                ? c.hazard_statements
                : Array.isArray(c?.hazardStatements)
                  ? c.hazardStatements
                  : [],
            }))
          : [],
      },
      section9: {
        physicalState: section9?.physical_state || section9?.physicalState || 'N/A',
        appearance: section9?.appearance || 'N/A',
        odour: section9?.odour || section9?.odor || 'N/A',
        flashPoint: section9?.flash_point || section9?.flashPoint || 'N/A',
        boilingPoint: section9?.boiling_point || section9?.boilingPoint,
        vapourPressure: section9?.vapour_pressure || section9?.vapourPressure || 'N/A',
        density: section9?.density,
        lowerExplosiveLimit: section9?.lower_explosive_limit || section9?.lowerExplosiveLimit,
        upperExplosiveLimit: section9?.upper_explosive_limit || section9?.upperExplosiveLimit,
        note: section9?.note || 'N/A',
      },
      section14: {
        dot: section14?.dot || '',
        kemlerCode: section14?.kemler_code || section14?.kemlerCode,
        transportModes,
        iata: {
          unNumber:
            iata?.un_number ||
            iata?.unNumber ||
            transportModes?.['IATA-DGR']?.unNumber ||
            '',
          description:
            iata?.description ||
            transportModes?.['IATA-DGR']?.properShippingName ||
            '',
          class:
            iata?.class ||
            transportModes?.['IATA-DGR']?.transportHazardClass ||
            '',
          packingGroup:
            iata?.packing_group ||
            iata?.packingGroup ||
            transportModes?.['IATA-DGR']?.packingGroup ||
            '',
          labels: iata?.labels || '',
          limitedQuantity: iata?.limited_quantity || iata?.limitedQuantity,
          passengerAircraftLimit: iata?.passenger_aircraft_limit || iata?.passengerAircraftLimit,
          cargoAircraftLimit: iata?.cargo_aircraft_limit || iata?.cargoAircraftLimit,
        },
        imdg: {
          unNumber:
            imdg?.un_number ||
            imdg?.unNumber ||
            transportModes?.IMDG?.unNumber ||
            '',
          description:
            imdg?.description ||
            transportModes?.IMDG?.properShippingName ||
            '',
          class:
            imdg?.class ||
            transportModes?.IMDG?.transportHazardClass ||
            '',
          packingGroup:
            imdg?.packing_group ||
            imdg?.packingGroup ||
            transportModes?.IMDG?.packingGroup ||
            '',
          labels: imdg?.labels || '',
          emsNumber1: imdg?.ems_number1 || imdg?.emsNumber1,
          emsNumber2: imdg?.ems_number2 || imdg?.emsNumber2,
          marinePollutant:
            imdg?.marine_pollutant ||
            imdg?.marinePollutant ||
            transportModes?.IMDG?.marinePollutant,
          limitedQuantity: imdg?.limited_quantity || imdg?.limitedQuantity,
        },
        tdg: section14?.tdg
          ? {
              class: section14.tdg.class || '',
              packingGroup: section14.tdg.packing_group || section14.tdg.packingGroup || '',
            }
          : undefined,
        mexico: section14?.mexico
          ? {
              class: section14.mexico.class || '',
              packingGroup: section14.mexico.packing_group || section14.mexico.packingGroup || '',
            }
          : undefined,
        otherInformation: section14?.otherInformation || '',
      },
    },
  };

  return s;
};

export type FetchRawMaterialsParams = {
  material_type?: string;
  page?: number;
  page_size?: number;
  search?: string;
  status?: string; // 'approved' | 'pending' | 'rejected' | 'all'
  dg_class?: string; // 'all' | 'class 3' | 'class 9' etc
  ghs_class?: string; // 'all' | 'GHS07' | 'GHS08' etc
};

type FetchRawMaterialsResult = {
  data: SDSRecord[];
  pagination: ApiPaginationMeta | null;
  availableDgClasses: string[];
  availableGhsClasses: string[];
};

export const fetchRawMaterials = async (params?: FetchRawMaterialsParams): Promise<FetchRawMaterialsResult> => {
  // Build query parameters
  const queryParams = new URLSearchParams();
  
  if (params?.material_type) {
    queryParams.append('material_type', params.material_type);
  }
  if (params?.page !== undefined) {
    queryParams.append('page', params.page.toString());
  }
  if (params?.page_size !== undefined) {
    queryParams.append('page_size', params.page_size.toString());
  }
  if (params?.search && params.search.trim()) {
    queryParams.append('search', params.search.trim());
  }
  if (params?.status && params.status !== 'all') {
    queryParams.append('status', params.status);
  }
  if (params?.dg_class && params.dg_class !== 'all') {
    queryParams.append('dg_class', params.dg_class);
  }
  if (params?.ghs_class && params.ghs_class !== 'all') {
    queryParams.append('ghs_class', params.ghs_class);
  }

  // Build URL with query parameters
  const url = queryParams.toString() 
    ? `${RAW_MATERIALS_API_URL}?${queryParams.toString()}`
    : RAW_MATERIALS_API_URL;
  const response = await fetch(url);
  
  // Check if response is JSON before parsing
  const contentType = response.headers.get('content-type') || '';
  const isJson = contentType.includes('application/json');
  
  if (!response.ok) {
    // Try to get error message from response
    let errorMessage = `Failed to fetch raw materials: ${response.status} ${response.statusText}`;
    
    if (isJson) {
      try {
        const errorData = await response.json();
        errorMessage = errorData.message || errorData.error || errorMessage;
      } catch {
        // If JSON parsing fails, use default message
      }
    } else {
      // If not JSON, it's probably an HTML error page
      await response.text(); // Consume the response body
      errorMessage = `${errorMessage}. Server returned HTML instead of JSON.`;
    }
    
    throw new Error(errorMessage);
  }
  
  if (!isJson) {
    const text = await response.text();
    throw new Error(`Expected JSON response but received ${contentType}. Response preview: ${text.substring(0, 200)}`);
  }

  const json = (await response.json()) as ApiRawMaterialsResponse | any;

  // Normalize meta option arrays to string[] (API may return objects e.g. { value, label })
  const toOptionString = (v: unknown): string =>
    v == null ? '' : typeof v === 'string' ? v : typeof (v as any).value === 'string' ? (v as any).value : typeof (v as any).label === 'string' ? (v as any).label : typeof (v as any).id === 'string' ? (v as any).id : String(v);
  const normalizeOptionArray = (arr: unknown[]): string[] =>
    arr.map(toOptionString).filter(Boolean);

  // Handle different response formats
  let materials: ApiRawMaterial[] = [];
  let pagination: ApiPaginationMeta | null = null;
  let availableDgClasses: string[] = [];
  let availableGhsClasses: string[] = [];

  if (Array.isArray(json)) {
    // Direct array response (no metadata)
    materials = json;
  } else if (json?.data) {
    // Response with data field
    materials = Array.isArray(json.data) ? json.data : [];
    // Extract pagination metadata
    if (json.meta?.pagination) {
      pagination = json.meta.pagination;
    }
    // Extract filter options from meta (normalize to string[] for Select etc.)
    if (Array.isArray(json.meta?.available_dg_classes)) {
      availableDgClasses = normalizeOptionArray(json.meta.available_dg_classes);
    }
    if (Array.isArray(json.meta?.available_ghs_classes)) {
      availableGhsClasses = normalizeOptionArray(json.meta.available_ghs_classes);
    }
  }

  return {
    data: materials.map(mapApiMaterialToSdsRecord),
    pagination,
    availableDgClasses,
    availableGhsClasses,
  };
};

const updateRawMaterial = async ({
  id,
  updates,
}: {
  id: number;
  updates: Partial<SDSRecord>;
}): Promise<SDSRecord> => {
  // Convert camelCase updates to snake_case for API
  const apiUpdates: any = {};
  if (updates.GHSStatus !== undefined) apiUpdates.ghs_status = updates.GHSStatus;
  if (updates.DGStatus !== undefined) apiUpdates.dg_status = updates.DGStatus;
  if (updates.feedback !== undefined) apiUpdates.feedback = updates.feedback;
  if (updates['GHS Approval/Rejection Date'] !== undefined)
    apiUpdates['GHS Approval/Rejection Date'] = updates['GHS Approval/Rejection Date'];
  if (updates['DG Approval/Rejection Date'] !== undefined)
    apiUpdates['DG Approval/Rejection Date'] = updates['DG Approval/Rejection Date'];

  const response = await fetch(`${RAW_MATERIALS_API_URL}${id}/`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(apiUpdates),
  });

  if (!response.ok) {
    throw new Error(`Failed to update raw material: ${response.statusText}`);
  }

  const json = (await response.json()) as ApiRawMaterial | any;
  return mapApiMaterialToSdsRecord(json.data || json);
};

// Jurisdictions API types and fetcher
export type JurisdictionRow = {
  authority_country: string;
  un_number: string;
  psn: string;
  packaging_group: string;
  hazard_category: string;
  created_date: string;
  updated_date: string;
};

export const rawMaterialsJurisdictionsKeys = {
  all: ['rawMaterials', 'jurisdictions'] as const,
  list: (materialCode: string) => [...rawMaterialsJurisdictionsKeys.all, materialCode] as const,
};

const fetchMaterialJurisdictions = async (materialCode: string): Promise<JurisdictionRow[]> => {
  const url = `${RAW_MATERIALS_API_URL}/jurisdictions/${encodeURIComponent(materialCode)}`;
  const response = await fetch(url);
  const contentType = response.headers.get('content-type') || '';
  const isJson = contentType.includes('application/json');

  if (!response.ok) {
    let errorMessage = `Failed to fetch jurisdictions: ${response.status} ${response.statusText}`;
    if (isJson) {
      try {
        const err = await response.json();
        errorMessage = (err as { message?: string }).message || errorMessage;
      } catch {
        // ignore
      }
    }
    throw new Error(errorMessage);
  }

  if (!isJson) {
    const text = await response.text();
    throw new Error(`Expected JSON from jurisdictions API. ${text.substring(0, 150)}`);
  }

  const json = await response.json();
  const rows = Array.isArray(json) ? json : (json?.data && Array.isArray(json.data) ? json.data : []);
  return rows.map((r: Record<string, unknown>) => ({
    authority_country: String(r.authority_country ?? ''),
    un_number: String(r.un_number ?? r.unNumber ?? ''),
    psn: String(r.psn ?? ''),
    packaging_group: String(r.packaging_group ?? r.packagingGroup ?? ''),
    hazard_category: String(r.hazard_category ?? r.hazardCategory ?? ''),
    created_date: String(r.created_date ?? r.createdDate ?? ''),
    updated_date: String(r.updated_date ?? r.updatedDate ?? ''),
  }));
};

export const useMaterialJurisdictions = (materialCode: string | null) => {
  return useQuery({
    queryKey: rawMaterialsJurisdictionsKeys.list(materialCode ?? ''),
    queryFn: () => fetchMaterialJurisdictions(materialCode!),
    enabled: !!materialCode,
    staleTime: 2 * 60 * 1000,
    cacheTime: 5 * 60 * 1000,
  });
};

// Query keys for React Query
export const rawMaterialsKeys = {
  all: ['rawMaterials'] as const,
  lists: () => [...rawMaterialsKeys.all, 'list'] as const,
  list: (filters?: Record<string, unknown>) => [...rawMaterialsKeys.lists(), { filters }] as const,
  details: () => [...rawMaterialsKeys.all, 'detail'] as const,
  detail: (id: number) => [...rawMaterialsKeys.details(), id] as const,
};

/**
 * Hook to fetch all Raw Materials
 */
export const useRawMaterials = (params?: FetchRawMaterialsParams) => {
  // Default parameters
  const defaultParams: FetchRawMaterialsParams = {
    material_type: 'raw_materials',
    page: 1,
    page_size: 20,
    ...params,
  };

  return useQuery({
    queryKey: rawMaterialsKeys.list(defaultParams),
    queryFn: () => fetchRawMaterials(defaultParams),
    staleTime: 5 * 60 * 1000, // Consider data fresh for 5 minutes
    cacheTime: 10 * 60 * 1000, // Keep in cache for 10 minutes
    refetchOnWindowFocus: true, // Refetch when window regains focus
    refetchOnMount: true, // Refetch on component mount
  });
};

/**
 * Hook to update a Raw Material (for approvals/rejections)
 */
export const useUpdateRawMaterial = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateRawMaterial,
    onSuccess: (data, variables) => {
      // Invalidate and refetch the list
      queryClient.invalidateQueries({ queryKey: rawMaterialsKeys.lists() });

      // Update the specific record in cache
      queryClient.setQueryData(rawMaterialsKeys.detail(variables.id), data);
    },
  });
};

// Approve / Reject API: PUT /api/v1/materials/approve-reject
export type ApproveRejectParams = {
  material_codes: string[];
  ghs_status: 'Approved' | 'Rejected';
  dg_status: 'Approved' | 'Rejected';
  reject_reason?: string;
};

const approveRejectMaterial = async (params: ApproveRejectParams): Promise<unknown> => {
  const url = `${RAW_MATERIALS_API_URL}/approve-reject`;
  const response = await fetch(url, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  });
  const contentType = response.headers.get('content-type') || '';
  const isJson = contentType.includes('application/json');

  if (!response.ok) {
    let errorMessage = `Failed to approve/reject: ${response.status} ${response.statusText}`;
    if (isJson) {
      try {
        const err = (await response.json()) as { message?: string };
        errorMessage = err.message || errorMessage;
      } catch {
        // ignore
      }
    }
    throw new Error(errorMessage);
  }

  return isJson ? response.json() : {};
};

export const useApproveRejectMaterial = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: approveRejectMaterial,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: rawMaterialsKeys.lists() });
    },
  });
};

// Children API: GET /api/v1/materials/{parent_material_code}/children
export type ApiMaterialChild = {
  material_id: string;
  material_name: string;
  source: string;
  part_sales_number: string | null;
  uploaded_date: string;
  dg_code: string;
  product_type: string | null;
  manufacturer: string | null;
  status: string;
};

export type MaterialChildRecord = {
  id: number;
  materialId: string;
  materialName: string;
  source: string;
  partNumber?: string | null;
  uploadedDate: string;
  aiRecommendedDGCode: string;
  productType?: string | null;
  manufacturer?: string | null;
  status: string;
};

const fetchMaterialChildren = async (parentMaterialCode: string): Promise<MaterialChildRecord[]> => {
  const url = `${RAW_MATERIALS_API_URL}/${encodeURIComponent(parentMaterialCode)}/children`;
  const response = await fetch(url);
  const contentType = response.headers.get('content-type') || '';
  const isJson = contentType.includes('application/json');

  if (!response.ok) {
    let errorMessage = `Failed to fetch material children: ${response.status} ${response.statusText}`;
    if (isJson) {
      try {
        const err = (await response.json()) as { message?: string };
        errorMessage = err.message || errorMessage;
      } catch {
        // ignore
      }
    }
    throw new Error(errorMessage);
  }

  if (!isJson) return [];

  const json = (await response.json()) as { success?: boolean; data?: ApiMaterialChild[] };
  const data = json?.data ?? [];
  return data.map((item, index) => ({
    id: index,
    materialId: item.material_id,
    materialName: item.material_name,
    source: item.source ?? '',
    partNumber: item.part_sales_number,
    uploadedDate: item.uploaded_date,
    aiRecommendedDGCode: item.dg_code ?? '—',
    productType: item.product_type,
    manufacturer: item.manufacturer,
    status: item.status === 'Pending' ? 'Pending Review' : item.status,
  }));
};

export const materialChildrenKeys = {
  all: ['materialChildren'] as const,
  list: (parentMaterialCode: string) => [...materialChildrenKeys.all, parentMaterialCode] as const,
};

export const useMaterialChildren = (parentMaterialCode: string | null) => {
  return useQuery({
    queryKey: materialChildrenKeys.list(parentMaterialCode ?? ''),
    queryFn: () => fetchMaterialChildren(parentMaterialCode!),
    enabled: !!parentMaterialCode && parentMaterialCode.length > 0,
    staleTime: 2 * 60 * 1000,
  });
};

