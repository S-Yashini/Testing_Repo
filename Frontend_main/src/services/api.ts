/**
 * API Service
 * 
 * Centralized API functions for fetching data from the backend.
 * Replace the placeholder URLs with your actual API endpoints.
 */

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api';

export interface SDSRecord {
  id: number;
  materialId: string;
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
  hazardousWaste?: boolean;
  sdsSheetUrl?: string;
  GHSStatus?: string;
  DGStatus?: string;
  status?: string;
  'GHS Approval/Rejection Date'?: string;
  'DG Approval/Rejection Date'?: string;
  feedback?: string;
  uploadedDate: string;
  sections: {
    section2?: any;
    section3?: any;
    section9?: any;
    section14?: any;
    [key: string]: any;
  };
}

export interface ExtenderRecord {
  id: number;
  materialId: string;
  materialName: string;
  source: string;
  partNumber?: string;
  internalCode?: string;
  synonyms?: string[];
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
  hazardousWaste?: boolean;
  sdsSheetUrl?: string;
  status: string;
  'Approve/Reject Date'?: string;
  feedback?: string;
  uploadedDate: string;
  sections: {
    section2?: any;
    section3?: any;
    section9?: any;
    section10?: any;
    section11?: any;
    section12?: any;
    section14?: any;
    [key: string]: any;
  };
}

/**
 * Fetch Extender Records from API
 */
export const fetchExtenderRecords = async (): Promise<ExtenderRecord[]> => {
  try {
    const response = await fetch(`${API_BASE_URL}/extender-records`);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch extender records: ${response.statusText}`);
    }
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching extender records:', error);
    throw error;
  }
};

/**
 * Fetch a single SDS Record by ID
 */
export const fetchSDSRecordById = async (id: number): Promise<SDSRecord> => {
  try {
    const response = await fetch(`${API_BASE_URL}/sds-records/${id}`);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch SDS record: ${response.statusText}`);
    }
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching SDS record:', error);
    throw error;
  }
};

/**
 * Fetch a single Extender Record by ID
 */
export const fetchExtenderRecordById = async (id: number): Promise<ExtenderRecord> => {
  try {
    const response = await fetch(`${API_BASE_URL}/extender-records/${id}`);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch extender record: ${response.statusText}`);
    }
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching extender record:', error);
    throw error;
  }
};

/**
 * Update SDS Record (for approvals/rejections)
 */
export const updateSDSRecord = async (
  id: number,
  updates: Partial<SDSRecord>
): Promise<SDSRecord> => {
  try {
    const response = await fetch(`${API_BASE_URL}/sds-records/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(updates),
    });
    
    if (!response.ok) {
      throw new Error(`Failed to update SDS record: ${response.statusText}`);
    }
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error updating SDS record:', error);
    throw error;
  }
};

/**
 * Update Extender Record (for approvals/rejections)
 */
export const updateExtenderRecord = async (
  id: number,
  updates: Partial<ExtenderRecord>
): Promise<ExtenderRecord> => {
  try {
    const response = await fetch(`${API_BASE_URL}/extender-records/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(updates),
    });
    
    if (!response.ok) {
      throw new Error(`Failed to update extender record: ${response.statusText}`);
    }
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error updating extender record:', error);
    throw error;
  }
};

