/**
 * React Query hooks for Extender Records
 * Fetches from /api/v1/materials/?material_type=extenders
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  fetchExtenderRecordById,
  updateExtenderRecord,
  type ExtenderRecord,
} from '../services/api';
import { mapApiMaterialToSdsRecord, type SDSRecord } from './useRawMaterials';

// const MATERIALS_API_URL = (
//   (import.meta.env.VITE_RAW_MATERIALS_API_URL as string) || '/api/v1/materials/'
// ).replace(/\/*$/, '/');

 
const BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';

const MATERIALS_API_URL = `${BASE_URL}/v1/materials`;


type ApiPaginationMeta = {
  page: number;
  page_size: number;
  total_records: number;
  total_pages: number;
  has_next: boolean;
  has_previous: boolean;
};

export type FetchExtenderRecordsParams = {
  page?: number;
  page_size?: number;
  search?: string;
  status?: string; // 'approved' | 'pending' | 'rejected' | 'all'
  dg_class?: string; // 'all' | 'class 3' | 'class 9' etc
  ghs_class?: string; // 'all' | 'GHS07' | 'GHS08' etc
};

export type FetchExtenderRecordsResult = {
  data: SDSRecord[];
  pagination: ApiPaginationMeta | null;
};

const fetchExtenderRecordsFromApi = async (
  params?: FetchExtenderRecordsParams
): Promise<FetchExtenderRecordsResult> => {
  const page = params?.page ?? 1;
  const page_size = params?.page_size ?? 20;

  const queryParams = new URLSearchParams();
  queryParams.append('material_type', 'extenders');
  queryParams.append('page', String(page));
  queryParams.append('page_size', String(page_size));
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

  const url = `${MATERIALS_API_URL}?${queryParams.toString()}`;
  const response = await fetch(url);

  const contentType = response.headers.get('content-type') || '';
  const isJson = contentType.includes('application/json');

  if (!response.ok) {
    let errorMessage = `Failed to fetch extender records: ${response.status} ${response.statusText}`;
    if (isJson) {
      try {
        const errorData = await response.json();
        errorMessage = errorData.message || errorData.error || errorMessage;
      } catch {
        // ignore
      }
    } else {
      await response.text();
    }
    throw new Error(errorMessage);
  }

  if (!isJson) {
    const text = await response.text();
    throw new Error(
      `Expected JSON response but received ${contentType}. Response preview: ${text.substring(0, 200)}`
    );
  }

  const json = (await response.json()) as { data?: unknown[]; meta?: { pagination?: ApiPaginationMeta } };

  let materials: unknown[] = [];
  let pagination: ApiPaginationMeta | null = null;

  if (Array.isArray(json)) {
    materials = json;
  } else if (json?.data) {
    materials = Array.isArray(json.data) ? json.data : [];
    if (json.meta?.pagination) {
      pagination = json.meta.pagination;
    }
  }

  return {
    data: materials.map((m) => mapApiMaterialToSdsRecord(m as Parameters<typeof mapApiMaterialToSdsRecord>[0])),
    pagination,
  };
};

// Query keys for React Query
export const extenderRecordsKeys = {
  all: ['extenderRecords'] as const,
  lists: () => [...extenderRecordsKeys.all, 'list'] as const,
  list: (filters?: Record<string, unknown>) => [...extenderRecordsKeys.lists(), { filters }] as const,
  details: () => [...extenderRecordsKeys.all, 'detail'] as const,
  detail: (id: number) => [...extenderRecordsKeys.details(), id] as const,
};

export type UseExtenderRecordsParams = FetchExtenderRecordsParams;

/**
 * Hook to fetch Extender Records from /api/v1/materials/?material_type=extenders&page=1&page_size=20
 * Supports search, status, dg_class, ghs_class query params (same as useRawMaterials).
 */
export const useExtenderRecords = (params?: UseExtenderRecordsParams) => {
  const page = params?.page ?? 1;
  const page_size = params?.page_size ?? 20;
  const search = params?.search;
  const status = params?.status;
  const dg_class = params?.dg_class;
  const ghs_class = params?.ghs_class;

  return useQuery<FetchExtenderRecordsResult, Error>({
    queryKey: [...extenderRecordsKeys.lists(), { page, page_size, search, status, dg_class, ghs_class }],
    queryFn: () => fetchExtenderRecordsFromApi(params),
    staleTime: 5 * 60 * 1000,
    cacheTime: 10 * 60 * 1000,
    refetchOnWindowFocus: true,
    refetchOnMount: true,
  });
};

/**
 * Hook to fetch a single Extender Record by ID
 */
export const useExtenderRecord = (id: number) => {
  return useQuery({
    queryKey: extenderRecordsKeys.detail(id),
    queryFn: () => fetchExtenderRecordById(id),
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
    cacheTime: 10 * 60 * 1000,
  });
};

/**
 * Hook to update an Extender Record
 */
export const useUpdateExtenderRecord = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, updates }: { id: number; updates: Partial<ExtenderRecord> }) =>
      updateExtenderRecord(id, updates),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: extenderRecordsKeys.lists() });
      queryClient.setQueryData(extenderRecordsKeys.detail(variables.id), data);
    },
  });
};
