import { useState, useEffect, useMemo, useRef } from 'react';
import { useHistory } from 'react-router-dom';
import { Card, Button, Input, Select, Row, Col, Typography, Spin } from 'antd';
import { Tooltip } from 'react-tooltip';
import Table from '../../components/Table/Table';
import Modal from '../../components/Modal/Modal';
import Accordion from '../../components/Accordion/Accordion';
import { GHS_PICTOGRAMS, formatGHSTooltip } from '../../components/GHSInfo/GHSInfo';
import { useQueryClient } from '@tanstack/react-query';
import { useExtenderRecords, type FetchExtenderRecordsResult, extenderRecordsKeys } from '../../hooks/useExtenderRecords';
import { useMaterialJurisdictions, useApproveRejectMaterial, useMaterialChildren } from '../../hooks/useRawMaterials';
import { useDashboardData } from '../../hooks/useDashboardData';
import type { DashboardKpiCard } from '../../hooks/useDashboardData';

const { Title, Text } = Typography;
//const BACKEND_API_URL = (import.meta.env.VITE_BACKEND_URL as string) || (typeof import.meta.env.VITE_API_BASE_URL === 'string' ? import.meta.env.VITE_API_BASE_URL.replace(/\/api\/?$/, '') : '') || 'http://localhost:8000';
const API_BASE = import.meta.env.VITE_API_BASE_URL;

if (!API_BASE) {
  throw new Error('VITE_API_BASE_URL is not defined');
}
const KPI_ICONS = {
  total: (
    <svg className="w-10 h-10 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
    </svg>
  ),
  pending: (
    <svg className="w-10 h-10 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  approved: (
    <svg className="w-10 h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  rejected: (
    <svg className="w-10 h-10 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
} as const;

interface SDSRecord {
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
  sdsSheetUrl?: string;
  status: string;
  GHSStatus?: string;
  DGStatus?: string;
  ghs_reject_reason?: string;
  dg_reject_reason?: string;
  feedback: string;
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
        concentration?: string;
        percentage?: string;
        ghsClassification?: string[];
        hazardStatements?: string[];
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
      dot: string;
      kemlerCode?: string;
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
      otherInformation: string;
    };
  };
  uploadedDate: string;
  ghsClassificationData?: Array<{ classificationName: string; category: string }>;
  hazardsCodes?: Array<{ materialCode?: string; code: string; codeDesc: string; country?: string; type?: string }>;
  approvedDate?: string;
  rejectedDate?: string;
  hazardousWaste?: boolean;
}

const Extenders = () => {
  const [sdsRecords, setSdsRecords] = useState<SDSRecord[]>([]);
  const [selectedRecord, setSelectedRecord] = useState<SDSRecord | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [detailsModalTab, setDetailsModalTab] = useState<0 | 1>(0); // 0 = Details, 1 = Jurisdiction
  // Keep child list tied to the parent we opened the modal with (so clicking a child doesn’t refetch and keeps showing child data)
  const [childListParentMaterialCode, setChildListParentMaterialCode] = useState<string | null>(null);
  const approveRejectMaterial = useApproveRejectMaterial();
  const queryClient = useQueryClient();
  const refreshDashboardKpis = async () => {
    await queryClient.invalidateQueries({ queryKey: ['dashboard'] });
  };
  const [isPdfModalOpen, setIsPdfModalOpen] = useState(false);
  const [currentPdfUrl, setCurrentPdfUrl] = useState<string>('');

  // Create Material Modal states (modal opens but does not create a record)
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newMaterialId, setNewMaterialId] = useState<string>('');
  const [createError, setCreateError] = useState<string>('');
  
  // Reject Feedback Modal states
  const [isRejectFeedbackModalOpen, setIsRejectFeedbackModalOpen] = useState(false);
  const [rejectFeedback, setRejectFeedback] = useState<string>('');
  const [recordsToReject, setRecordsToReject] = useState<Set<number>>(new Set());
  const [isBulkReject, setIsBulkReject] = useState(false);
  const [isApproveConfirmModalOpen, setIsApproveConfirmModalOpen] = useState(false);
  const [recordToApprove, setRecordToApprove] = useState<number | null>(null);

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(20);

  // Filter states - searchTerm is local input; apiSearchTerm is sent to API
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [apiSearchTerm, setApiSearchTerm] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [dgClassFilter, setDgClassFilter] = useState<string>('All');
  // const [ghsFilter, setGhsFilter] = useState<string>('All');

  const mapStatusToApi = (status: string): string => {
    if (status === 'All') return 'all';
    if (status.includes('Approved')) return 'approved';
    if (status.includes('Pending')) return 'pending';
    if (status.includes('Rejected')) return 'rejected';
    return 'all';
  };
  const mapDgClassToApi = (dgClass: string): string => {
    if (dgClass === 'All') return 'all';
    const match = dgClass.match(/Class\s+([\d.]+)/);
    return match ? `class ${match[1]}` : 'all';
  };

  // Fetch extender records from API (search and filters sent to API)
  const { data: apiData, isLoading: isLoadingRecords, error: recordsError, refetch } = useExtenderRecords({
    page: currentPage,
    page_size: itemsPerPage,
    search: apiSearchTerm || undefined,
    status: mapStatusToApi(statusFilter),
    dg_class: mapDgClassToApi(dgClassFilter),
  }) as { data: FetchExtenderRecordsResult | undefined; isLoading: boolean; error: Error | null; refetch: () => void };

  const { dashboardData } = useDashboardData({ recentActivityDays: 7 });

  const pagination = apiData?.pagination;
  
  // Selection states
  const [selectedRecords, setSelectedRecords] = useState<Set<number>>(new Set());
  const [selectAll, setSelectAll] = useState(false);

  // Row actions menu (three dots): GHS Classification, Jurisdiction, Parent Child
  const [actionsMenuRowId, setActionsMenuRowId] = useState<number | null>(null);
  const [actionModal, setActionModal] = useState<{ type: 'ghs' | 'jurisdiction' | 'parent-child'; record: SDSRecord } | null>(null);
  const actionsMenuRef = useRef<HTMLDivElement>(null);

  const jurisdictionMaterialId = actionModal?.type === 'jurisdiction' ? actionModal.record.materialId : (selectedRecord?.materialId ?? null);
  const { data: jurisdictionsData, isLoading: isJurisdictionsLoading, error: jurisdictionsError } = useMaterialJurisdictions(jurisdictionMaterialId);

  const childListMaterialCode = actionModal?.type === 'parent-child' ? actionModal.record.materialId : childListParentMaterialCode;
  const { data: childRecordsFromApi, isLoading: isLoadingChildren, error: childrenError } = useMaterialChildren(childListMaterialCode);

  useEffect(() => {
    if (actionsMenuRowId == null) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (actionsMenuRef.current && !actionsMenuRef.current.contains(e.target as Node)) {
        setActionsMenuRowId(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [actionsMenuRowId]);

  const history = useHistory();
  const location = history.location;

  // Sync records from API response
  useEffect(() => {
    if (apiData?.data) {
      setSdsRecords(apiData.data as SDSRecord[]);
    }
  }, [apiData]);

  const handleSearch = () => {
    setApiSearchTerm(searchTerm);
    setCurrentPage(1);
  };
  // const handleSearchKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
  //   if (e.key === 'Enter') handleSearch();
  // };

  // Check for create query parameter and open modal
  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    if (searchParams.get('create') === 'true') {
      setIsCreateModalOpen(true);
      const newSearchParams = new URLSearchParams(location.search);
      newSearchParams.delete('create');
      const newSearch = newSearchParams.toString();
      history.replace(`/extenders-dg${newSearch ? `?${newSearch}` : ''}`);
    }
  }, [location.search, history]);

  // Check for status query parameter and set status filter
  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const statusParam = searchParams.get('status');
    if (statusParam) {
      // Set the status filter (the value in Extenders is just the status without "- DG")
      setStatusFilter(statusParam);
      // Remove the query parameter from URL after setting the filter
      const newSearchParams = new URLSearchParams(location.search);
      newSearchParams.delete('status');
      const newSearch = newSearchParams.toString();
      history.replace(`/extenders-dg${newSearch ? `?${newSearch}` : ''}`);
    }
  }, [location.search, history]);

  // Save to localStorage and sync to JSON file whenever records change
  useEffect(() => {
    if (sdsRecords.length > 0) {
      localStorage.setItem('extenderRecords', JSON.stringify(sdsRecords));
      localStorage.setItem('extenderRecordsLastUpdated', new Date().toISOString());
      
      // Try to sync to JSON file via API (if server is running; uses same /api proxy as rest of app)
      const syncToFile = async () => {
        try {
          const response = await fetch('/api/save-extender-records', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ records: sdsRecords }),
          });
          
          if (response.ok) {
            console.log('Records synced to JSON file successfully');
          } else {
            console.warn('Failed to sync to JSON file (server may not be running)');
          }
        } catch (error) {
          // Server not running or network error - this is expected in development
          console.warn('Could not sync to JSON file. Start the server with: npm run server');
        }
      };
      
      syncToFile();
    }
  }, [sdsRecords]);

  /* const handleSelectMaterial = (result: { sdsId: string; materialId: string; materialName: string; source: string }) => {
    // Find the full record and open it in modal
    const fullRecord = sdsRecords.find((record) => record.sdsId === result.sdsId);
    if (fullRecord) {
      setSelectedRecord(fullRecord);
      setIsModalOpen(true);
    }
  }; */

  /* const handleClassify = (materialId: string) => {
    // Mock: Create a new classification request
    const newRecord: SDSRecord = {
      sdsId: `SDS${String(sdsRecords.length + 1).padStart(3, '0')}`,
      materialId: materialId || `RM${String(sdsRecords.length + 1001)}`,
      materialName: `New Material - ${materialId}`,
      source: 'New Classification',
      aiRecommendedDGCode: 'Analyzing...',
      rationaleSummary: 'AI classification in progress. Please wait...',
      ghsPictograms: [],
      status: 'Pending Review',
      sections: {
        section2: {
          classification: 'Pending AI Classification',
          hazards: ['AI Classification in Progress...'],
          ghsCodes: [],
          signalWord: 'Pending',
          hazardStatements: 'AI classification in progress...',
          precautionaryCodes: [],
          precautionaryStatements: 'AI classification in progress...',
          carcinogenicity: 'Pending analysis',
        },
        section3: {
          chemicalNature: 'Pending analysis',
          description: 'Chemical composition analysis in progress...',
          composition: [],
        },
        section9: {
          physicalState: 'Pending...',
          appearance: 'Pending...',
          odour: 'Pending...',
          flashPoint: 'Pending...',
          vapourPressure: 'Pending...',
          note: 'Analysis in progress',
        },
        section14: {
          dot: 'Pending classification',
          iata: {
            unNumber: 'Pending...',
            description: 'Pending...',
            class: 'Pending...',
            packingGroup: 'Pending...',
            labels: 'Pending...',
          },
          imdg: {
            unNumber: 'Pending...',
            description: 'Pending...',
            class: 'Pending...',
            packingGroup: 'Pending...',
            labels: 'Pending...',
            emsNumber1: 'Pending...',
            emsNumber2: 'Pending...',
            marinePollutant: 'Pending...',
          },
          otherInformation: 'Transport classification in progress...',
        },
      },
      uploadedDate: new Date().toISOString().split('T')[0],
    };

    setSdsRecords([newRecord, ...sdsRecords]);
    // TODO: Navigate to classification page or open classification modal
    alert(`Classification initiated for material: ${materialId}`);
  }; */

  const handleApprove = (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    setRecordToApprove(id);
    setIsApproveConfirmModalOpen(true);
  };

  const handleConfirmApprove = async () => {
    if (recordToApprove == null) return;
    const record = sdsRecords.find((r) => r.id === recordToApprove);
    if (!record) return;
    // Extenders UI is DG-focused: approve DG; preserve GHS status (API accepts only Approved | Rejected)
    const ghs_status: 'Approved' | 'Rejected' =
      record.GHSStatus === 'Approved' || record.GHSStatus === 'Rejected' ? record.GHSStatus : 'Rejected';
    const dg_status: 'Approved' | 'Rejected' = 'Approved';
    try {
      await approveRejectMaterial.mutateAsync({
        material_codes: [record.materialId],
        ghs_status,
        dg_status,
      });
      queryClient.invalidateQueries({ queryKey: extenderRecordsKeys.lists() });
      await refreshDashboardKpis();
      const approvedDate = new Date().toISOString();
      setSdsRecords((prevRecords) =>
        prevRecords.map((r) =>
          r.id === recordToApprove ? { ...r, status: 'Approved', DGStatus: 'Approved' as const, approvedDate, rejectedDate: undefined } : r
        )
      );
      setSelectedRecord((prev) =>
        prev?.id === recordToApprove ? { ...prev, status: 'Approved', DGStatus: 'Approved', approvedDate, rejectedDate: undefined } : prev
      );
      setIsApproveConfirmModalOpen(false);
      setRecordToApprove(null);
    } catch (error) {
      console.error('Failed to approve record:', error);
      alert('Failed to approve record. Please try again.');
    }
  };

  const handleCloseApproveConfirmModal = () => {
    setIsApproveConfirmModalOpen(false);
    setRecordToApprove(null);
  };

  const handleReject = (id: number, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent row click
    setRecordsToReject(new Set([id]));
    setIsBulkReject(false);
    setRejectFeedback('');
    setIsRejectFeedbackModalOpen(true);
  };

  const handleConfirmReject = async () => {
    const reason = rejectFeedback.trim();
    if (!reason) return;
    const recordsArray = Array.from(recordsToReject);
    const rejectedDate = new Date().toISOString();
    try {
      await Promise.all(
        recordsArray.map(async (id) => {
          const record = sdsRecords.find((r) => r.id === id);
          if (!record) return;
          const ghs_status: 'Approved' | 'Rejected' =  record.GHSStatus as 'Approved' | 'Rejected';
          const dg_status: 'Approved' | 'Rejected' = 'Rejected';
          return approveRejectMaterial.mutateAsync({
            material_codes: [record.materialId],
            ghs_status,
            dg_status,
            reject_reason: reason,
          });
        })
      );
      queryClient.invalidateQueries({ queryKey: extenderRecordsKeys.lists() });
      await refreshDashboardKpis();
      setSdsRecords((prevRecords) =>
        prevRecords.map((record) =>
          recordsToReject.has(record.id)
            ? { ...record, status: 'Rejected', DGStatus: 'Rejected', feedback: reason, rejectedDate, approvedDate: undefined }
            : record
        )
      );
      const rejectedId = recordsArray[0];
      setSelectedRecord((prev) =>
        prev?.id === rejectedId
          ? { ...prev, status: 'Rejected', DGStatus: 'Rejected', feedback: reason, rejectedDate, approvedDate: undefined }
          : prev
      );
      if (isBulkReject) {
        setSelectedRecords(new Set());
        setSelectAll(false);
      }
      alert(`${recordsArray.length} record(s) rejected successfully!`);
    } catch (error) {
      console.error('Failed to reject records:', error);
      alert('Failed to reject records. Please try again.');
    }
    setIsRejectFeedbackModalOpen(false);
    setRejectFeedback('');
    setRecordsToReject(new Set());
    setIsBulkReject(false);
  };

  const handleCloseRejectFeedbackModal = () => {
    setIsRejectFeedbackModalOpen(false);
    setRejectFeedback('');
    setRecordsToReject(new Set());
    setIsBulkReject(false);
  };

const handleViewPdf = (e: React.MouseEvent, record: SDSRecord) => {
  e.stopPropagation();

  const path = (record.sdsSheetUrl || '').replace(/^\//, '');

  // IMPORTANT FIX (no API_BASE, no backend URL)
  const pdfUrl = `/${path}`;

  setCurrentPdfUrl(pdfUrl);
  setIsPdfModalOpen(true);
};
  const handleRowClick = (record: SDSRecord) => {
    setSelectedRecord(record);
    setChildListParentMaterialCode(record.materialId);
    setDetailsModalTab(0);
    setIsModalOpen(true);
  };

  const handleClearFilters = () => {
    setSearchTerm('');
    setApiSearchTerm('');
    setStatusFilter('All');
    setDgClassFilter('All');
    // setGhsFilter('All');
  };

  // Check if any filters are active
  const hasActiveFilters = apiSearchTerm !== '' || statusFilter !== 'All' || dgClassFilter !== 'All';

  const handleCreateMaterial = () => {
    // Modal opens for manual entry but we do not create a record
    setIsCreateModalOpen(false);
    setNewMaterialId('');
    setCreateError('');
  };

  const handleCloseCreateModal = () => {
    setIsCreateModalOpen(false);
    setNewMaterialId('');
    setCreateError('');
  };

  // Handle individual checkbox selection
  const handleSelectRecord = (id: number) => {
    const newSelected = new Set(selectedRecords);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedRecords(newSelected);
    setSelectAll(newSelected.size === paginatedRecords.length && paginatedRecords.length > 0);
  };

  // Handle select all checkbox
  const handleSelectAll = () => {
    if (selectAll) {
      // Deselect all on current page
      const newSelected = new Set(selectedRecords);
      paginatedRecords.forEach(record => newSelected.delete(record.id));
      setSelectedRecords(newSelected);
      setSelectAll(false);
    } else {
      // Select all on current page
      const newSelected = new Set(selectedRecords);
      paginatedRecords.forEach(record => newSelected.add(record.id));
      setSelectedRecords(newSelected);
      setSelectAll(true);
    }
  };

  // Bulk approve selected records – same API + invalidation + local state as single approve
  const handleBulkApprove = async () => {
    if (selectedRecords.size === 0) {
      alert('Please select at least one record to approve');
      return;
    }
    const recordsArray = Array.from(selectedRecords);
    try {
      await Promise.all(
        recordsArray.map(async (id) => {
          const record = sdsRecords.find((r) => r.id === id);
          if (!record) return;
          const ghs_status: 'Approved' | 'Rejected' =  record.GHSStatus as 'Approved' | 'Rejected';
          const dg_status: 'Approved' | 'Rejected' = 'Approved';
          return approveRejectMaterial.mutateAsync({
            material_codes: [record.materialId],
            ghs_status,
            dg_status,
          });
        })
      );
      queryClient.invalidateQueries({ queryKey: extenderRecordsKeys.lists() });
      await refreshDashboardKpis();
      const approvedDate = new Date().toISOString();
      setSdsRecords((prevRecords) =>
        prevRecords.map((record) =>
          selectedRecords.has(record.id)
            ? { ...record, status: 'Approved', DGStatus: 'Approved', approvedDate, rejectedDate: undefined }
            : record
        )
      );
      setSelectedRecord((prev) =>
        prev && selectedRecords.has(prev.id)
          ? { ...prev, status: 'Approved', DGStatus: 'Approved', approvedDate, rejectedDate: undefined }
          : prev
      );
      alert(`${recordsArray.length} record(s) approved successfully!`);
      setSelectedRecords(new Set());
      setSelectAll(false);
    } catch (error) {
      console.error('Failed to approve records:', error);
      alert('Failed to approve records. Please try again.');
    }
  };

  // Bulk reject selected records
  const handleBulkReject = () => {
    if (selectedRecords.size === 0) {
      alert('Please select at least one record to reject');
      return;
    }
    
    setRecordsToReject(new Set(selectedRecords));
    setIsBulkReject(true);
    setRejectFeedback('');
    setIsRejectFeedbackModalOpen(true);
  };

  const tableColumns = [
    {
      key: 'checkbox',
      header: (
        <input
          type="checkbox"
          checked={selectAll}
          onChange={handleSelectAll}
          className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 cursor-pointer"
        />
      ),
      render: (record: SDSRecord) => (
        <input
          type="checkbox"
          checked={selectedRecords.has(record.id)}
          onChange={(e) => {
            e.stopPropagation();
            handleSelectRecord(record.id);
          }}
          onClick={(e) => e.stopPropagation()}
          className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 cursor-pointer"
        />
      ),
    },
    {
      key: 'materialId',
      header: 'Material ID',
    },
    {
      key: 'materialName',
      header: 'Material Name',
      render: (record: SDSRecord) => {
        const truncatedText = record.materialName.length > 16
          ? `${record.materialName.substring(0, 16)}...` 
          : record.materialName;
        
        const tooltipId = `material-name-${record.id}`;
        
        return (
          <span
            data-tooltip-id={tooltipId}
            data-tooltip-content={record.materialName}
            className="cursor-help truncate block max-w-xs"
          >
            {truncatedText}
          </span>
        );
      },
    },
 
    {
      key: 'aiRecommendedDGCode',
      header: 'DG Classification',
      render: (record: SDSRecord) => {
        // Extract DG information from section14
        const section14 = record.sections?.section14;
        const iata = section14?.iata;
        const imdg = section14?.imdg;
        
        // Get UN Number (prefer IATA, fallback to IMDG)
        const unNumber = iata?.unNumber && iata.unNumber !== 'Not regulated' && iata.unNumber !== 'Not assigned'
          ? iata.unNumber
          : imdg?.unNumber && imdg.unNumber !== 'Not regulated' && imdg.unNumber !== 'Not assigned'
          ? imdg.unNumber
          : 'N/A';
        
        // Get Proper Shipping Name
        const properShippingName = iata?.description && iata.description !== 'Not regulated as Dangerous Goods'
          ? iata.description
          : imdg?.description && imdg.description !== 'Not regulated as Dangerous Goods'
          ? imdg.description
          : record.materialName;
        
        // Get DG Class
        const dgClass = iata?.class && iata.class !== 'Not regulated' && iata.class !== 'None'
          ? iata.class
          : imdg?.class && imdg.class !== 'Not regulated' && imdg.class !== 'None'
          ? imdg.class
          : 'N/A';
        
        // Get Packing Group
        const packingGroup = iata?.packingGroup && iata.packingGroup !== 'Not regulated' && iata.packingGroup !== 'None'
          ? iata.packingGroup
          : imdg?.packingGroup && imdg.packingGroup !== 'Not regulated' && imdg.packingGroup !== 'None'
          ? imdg.packingGroup
          : 'N/A';
        
        // Get EMS
        const ems = imdg?.emsNumber1 && imdg?.emsNumber2
          ? `${imdg.emsNumber1}, ${imdg.emsNumber2}`
          : imdg?.emsNumber1
          ? imdg.emsNumber1
          : 'N/A';
        
        // Get Flashpoint
        const flashpoint = record.sections?.section9?.flashPoint || 'N/A';
        
        // Format DG Class display (e.g., "3 - Flammable Liquid")
        let dgClassDisplay = dgClass;
        if (dgClass !== 'N/A' && dgClass !== 'Not regulated' && dgClass !== 'None') {
          // Extract class number
          const classMatch = dgClass.match(/(\d+(?:\.\d+)?)/);
          if (classMatch) {
            const classNum = classMatch[1];
            // Map class numbers to names
            const classNames: { [key: string]: string } = {
              '2': 'Flammable Gas',
              '3': 'Flammable Liquid',
              '5.1': 'Oxidizing',
              '6': 'Toxic',
              '8': 'Corrosive',
              '9': 'Miscellaneous'
            };
            const className = classNames[classNum] || '';
            dgClassDisplay = className ? `${classNum} - ${className}` : classNum;
          }
        }
        
        const tooltipId = `dg-classification-${record.id}`;
        const tooltipContent = `
          <div style="text-align: left; font-size: 0.875rem; white-space: normal;">
            <table style="border-collapse: collapse; width: 100%; table-layout: fixed;">
              <tr>
                <td style="padding: 4px 8px; font-weight: 600; border-bottom: 1px solid #e5e7eb; white-space: nowrap; vertical-align: top;">UN Number:</td>
                <td style="padding: 4px 8px; border-bottom: 1px solid #e5e7eb; word-wrap: break-word; word-break: break-word; white-space: normal; max-width: 360px;">${unNumber}</td>
              </tr>
              <tr>
                <td style="padding: 4px 8px; font-weight: 600; border-bottom: 1px solid #e5e7eb; white-space: nowrap; vertical-align: top;">Proper Shipping Name:</td>
                <td style="padding: 4px 8px; border-bottom: 1px solid #e5e7eb; word-wrap: break-word; word-break: break-word; white-space: normal; max-width: 360px;">${properShippingName}</td>
              </tr>
              <tr>
                <td style="padding: 4px 8px; font-weight: 600; border-bottom: 1px solid #e5e7eb; white-space: nowrap; vertical-align: top;">DG Class:</td>
                <td style="padding: 4px 8px; border-bottom: 1px solid #e5e7eb; word-wrap: break-word; word-break: break-word; white-space: normal; max-width: 360px;">${dgClassDisplay}</td>
              </tr>
              <tr>
                <td style="padding: 4px 8px; font-weight: 600; border-bottom: 1px solid #e5e7eb; white-space: nowrap; vertical-align: top;">Packing Group:</td>
                <td style="padding: 4px 8px; border-bottom: 1px solid #e5e7eb; word-wrap: break-word; word-break: break-word; white-space: normal; max-width: 360px;">${packingGroup}</td>
              </tr>
              <tr>
                <td style="padding: 4px 8px; font-weight: 600; border-bottom: 1px solid #e5e7eb; white-space: nowrap; vertical-align: top;">EMS:</td>
                <td style="padding: 4px 8px; border-bottom: 1px solid #e5e7eb; word-wrap: break-word; word-break: break-word; white-space: normal; max-width: 360px;">${ems}</td>
              </tr>
              <tr>
                <td style="padding: 4px 8px; font-weight: 600; white-space: nowrap; vertical-align: top;">Flashpoint:</td>
                <td style="padding: 4px 8px; word-wrap: break-word; word-break: break-word; white-space: normal; max-width: 360px;">${flashpoint}</td>
              </tr>
            </table>
          </div>
        `;
        
        const truncatedText = record.aiRecommendedDGCode.length > 20 
          ? `${record.aiRecommendedDGCode.substring(0, 20)}...` 
          : record.aiRecommendedDGCode;
        
        return (
          <div>
            <span
              data-tooltip-id={tooltipId}
              data-tooltip-html={tooltipContent}
              className="cursor-help truncate block max-w-xs"
              title={record.aiRecommendedDGCode}
            >
              {truncatedText}
            </span>
            <Tooltip
              id={tooltipId}
              place="top"
              offset={10}
              delayShow={200}
              delayHide={0}
              float={false}
              opacity={1}
              style={{
                backgroundColor: '#ffffff',
                opacity: 1,
                color: '#1f2937',
                borderRadius: '0.5rem',
                padding: '1rem',
                maxWidth: '520px',
                fontSize: '0.875rem',
                boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
                zIndex: 9999,
                border: '1px solid #e5e7eb',
                whiteSpace: 'normal',
                wordBreak: 'break-word',
              }}
            />
          </div>
        );
      },
    },
    {
      key: 'hazardousWaste',
      header: 'Hazardous Waste',
      render: (record: SDSRecord) => {
        // Get hazardousWaste from the record (from extenderRecords.json)
        const isHazardous = record.hazardousWaste ?? false;
        return (
          <span className={`status-badge ${isHazardous ? 'status-badge--approved' : 'status-badge--rejected'}`}>
            {isHazardous ? 'Yes' : 'No'}
          </span>
        );
      },
    },
    {
      key: 'rowMenu',
      header: '\u00A0',
      render: (record: SDSRecord) => {
        const isOpen = actionsMenuRowId === record.id;
        return (
          <div
            ref={isOpen ? actionsMenuRef : undefined}
            className="relative inline-block"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setActionsMenuRowId(isOpen ? null : record.id);
              }}
              className="p-1.5 rounded hover:bg-gray-100 transition-colors inline-flex items-center justify-center"
              aria-label="Row actions"
              style={{ color: '#4b5563', backgroundColor: 'transparent',border: 0,padding: 0 }}

            >
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                style={{ display: 'block', flexShrink: 0 }}
              >
                <circle cx="12" cy="6" r="1.25" fill="currentColor" />
                <circle cx="12" cy="12" r="1.25" fill="currentColor" />
                <circle cx="12" cy="18" r="1.25" fill="currentColor" />
              </svg>
            </button>
            {isOpen && (
              <div
                className="absolute right-0 top-full mt-1 z-50 min-w-[180px] py-1 bg-white border border-gray-200 rounded-lg shadow-lg"
                style={{ boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1), 0 4px 6px -2px rgba(0,0,0,0.05)' ,width:'150px'}}
                onClick={(e) => e.stopPropagation()}
              >
                <button
                  type="button"
                  className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                  onClick={(e) => {
                    e.stopPropagation();
                    setActionModal({ type: 'ghs', record });
                    setActionsMenuRowId(null);
                  }}
                >
                  GHS Classification
                </button>
                <button
                  type="button"
                  className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                  onClick={(e) => {
                    e.stopPropagation();
                    setActionModal({ type: 'jurisdiction', record });
                    setActionsMenuRowId(null);
                  }}
                >
                  Jurisdiction
                </button>
                <button
                  type="button"
                  className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                  onClick={(e) => {
                    e.stopPropagation();
                    setActionModal({ type: 'parent-child', record });
                    setActionsMenuRowId(null);
                  }}
                >
                  Parent Child
                </button>
              </div>
            )}
          </div>
        );
      },
    },
    {
      key: 'rationaleSummary',
      header: 'Rationale',
      render: (record: SDSRecord) => {
        const rationaleText = (record.dgRationale || 'N/A').trim() || 'N/A';
        const truncatedText = rationaleText.length > 25
          ? `${rationaleText.substring(0, 25)}...`
          : rationaleText;

        const tooltipId = `rationale-${record.id}`;
        const showTooltip = rationaleText !== 'N/A' && rationaleText.length > 25;

        return (
          <div className="flex items-start gap-1">
            <span className="text-[10px] font-semibold text-gray-500 mt-0.5">DG:</span>
            <span
              className="cursor-help truncate block max-w-xs"
              data-tooltip-id={tooltipId}
              data-tooltip-content={showTooltip ? rationaleText : ''}
            >
              {truncatedText}
            </span>
          </div>
        );
      },
    },
    {
      key: 'sdsSheet',
      header: 'SDS Sheet',
      render: (record: SDSRecord) => (
        <Button size="small" onClick={(e) => handleViewPdf(e, record)}>
          View
        </Button>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (record: SDSRecord) => {
        const statusColors: Record<string, string> = {
          'Pending Review': 'status-badge status-badge--pending',
          'Approved': 'status-badge status-badge--approved',
          'Rejected': 'status-badge status-badge--rejected',
        };
        const status = record.DGStatus ?? record.status ?? 'Pending Review';
        return (
          <span className={statusColors[status] || 'status-badge status-badge--default'}>
            {record.DGStatus} - DG
          </span>
        );
      },
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (record: SDSRecord) => {
        const statusColors: Record<string, string> = {
          'Pending Review': 'status-badge status-badge--pending',
          'Approved': 'status-badge status-badge--approved',
          'Rejected': 'status-badge status-badge--rejected',
        };

        // Show buttons only when status is "Pending Review"
        if (record.DGStatus === 'Pending Review') {
          return (
            <div className="flex space-x-2" onClick={(e) => e.stopPropagation()}>
              <button
                type="button"
                onClick={(e) => handleApprove(record.id, e)}
                className="row-btn-approve px-3 py-1 rounded text-xs font-medium transition-colors flex items-center space-x-1"
                style={{ marginRight: 5 }}
              >
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  style={{ display: 'block', flexShrink: 0, marginRight: 5, marginTop: 2 }}
                >
                  <path d="M5 13l4 4L19 7" />
                </svg>
                <span>Approve - DG</span>
              </button>
              <button
                type="button"
                onClick={(e) => handleReject(record.id, e)}
                className="row-btn-reject px-3 py-1 rounded text-xs font-medium transition-colors flex items-center space-x-1"
              >
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  style={{ display: 'block', flexShrink: 0, marginRight: 5, marginTop: 2 }}
                >
                  <path d="M6 18L18 6M6 6l12 12" />
                </svg>
                <span>Reject - DG</span>
              </button>
            </div>
          );
        }

        // Show status badge when approved or rejected (classes from index.css)
        const dgStatus = record.DGStatus ?? 'Pending Review';
        return (
          <span className={statusColors[dgStatus] || 'status-badge status-badge--default'}>
            {dgStatus}
          </span>
        );
      },
    },
  ];

  const renderSection2 = (section: SDSRecord['sections']['section2']) => (
    <div className="ghs-section-wrap">
      <div className="ghs-block ghs-block--classification">
        <h4 className="ghs-block__title ghs-block__title-with-icon">
          <svg className="ghs-block__icon ghs-block__icon--red" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
          </svg>
          Classification
        </h4>
        <p className="ghs-block__body">{section.classification}</p>
      </div>

      <div className="ghs-block ghs-block--signal">
        <h4 className="ghs-block__title">Signal Word</h4>
        <span className={`ghs-signal-badge ${section.signalWord === 'Danger' ? 'ghs-signal-badge--danger' : 'ghs-signal-badge--warning'}`}>
          {section.signalWord}
        </span>
      </div>

      <div>
        <h4 className="ghs-block__title ghs-block__title-with-icon">
          <svg className="ghs-block__icon ghs-block__icon--red" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          Hazards
        </h4>
        <div className="ghs-tags">
          {section.hazards.map((hazard, idx) => (
            <span key={idx} className="ghs-tag--hazard">{hazard}</span>
          ))}
        </div>
      </div>

      <div>
        <h4 className="ghs-block__title ghs-block__title-with-icon">
          <svg className="ghs-block__icon ghs-block__icon--yellow" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
          </svg>
          GHS Codes
        </h4>
        <div className="ghs-tags">
          {section.ghsCodes.map((code, idx) => (
            <span key={idx} className="ghs-tag--ghs">{code}</span>
          ))}
        </div>
      </div>

      <div className="ghs-block ghs-block--gray">
        <h4 className="ghs-block__title">Hazard Statements</h4>
        <p className="ghs-block__body">{section.hazardStatements}</p>
      </div>

      <div>
        <h4 className="ghs-block__title ghs-block__title-with-icon">
          <svg className="ghs-block__icon ghs-block__icon--blue" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
          </svg>
          Precautionary Codes
        </h4>
        <div className="ghs-tags">
          {section.precautionaryCodes.map((code, idx) => (
            <span key={idx} className="ghs-tag--precautionary">{code}</span>
          ))}
        </div>
      </div>

      <div className="ghs-block ghs-block--gray">
        <h4 className="ghs-block__title">Precautionary Statements</h4>
        <p className="ghs-block__body">{section.precautionaryStatements}</p>
      </div>

      <div className="ghs-block ghs-block--carcinogenicity">
        <h4 className="ghs-block__title">Carcinogenicity</h4>
        <p className="ghs-block__body">{section.carcinogenicity}</p>
      </div>

      {section.additionalNotes && (
        <div className="ghs-block ghs-block--additional">
          <h4 className="ghs-block__title">Additional Notes</h4>
          <p className="ghs-block__body">{section.additionalNotes}</p>
        </div>
      )}
    </div>
  );

  const renderSection3 = (section: SDSRecord['sections']['section3']) => (
    <div className="ghs-section-wrap">
      {section.chemicalNature && (
        <div className="ghs-block ghs-block--indigo">
          <h4 className="ghs-block__title ghs-block__title-with-icon">
            <svg className="ghs-block__icon ghs-block__icon--indigo" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
            </svg>
            Chemical Nature
          </h4>
          <p className="ghs-block__body">{section.chemicalNature}</p>
        </div>
      )}
      {section.description && (
        <div className="ghs-block ghs-block--gray">
          <h4 className="ghs-block__title">Description</h4>
          <p className="ghs-block__body">{section.description}</p>
        </div>
      )}
      {section.composition && section.composition.length > 0 ? (
        <div className="sds-composition-table-wrap">
          <table className="sds-composition-table">
            <thead>
              <tr>
                <th>Chemical Name</th>
                <th>CAS Number</th>
                <th>Concentration</th>
                <th>GHS Classification</th>
                <th>Hazard Statements</th>
              </tr>
            </thead>
            <tbody>
              {section.composition.map((comp, idx) => (
                <tr key={idx}>
                  <td>{comp.chemicalName}</td>
                  <td className="sds-cell-mono">{comp.casNumber}</td>
                  <td>{comp.concentration || (comp as { percentage?: string }).percentage || 'N/A'}</td>
                  <td>
                    <div className="sds-cell-tags">
                      {comp.ghsClassification && comp.ghsClassification.length > 0 ? (
                        comp.ghsClassification.map((cls, i) => (
                          <span key={i} className="sds-tag-mini--yellow">{cls}</span>
                        ))
                      ) : (
                        <span className="text-xs text-gray-400">N/A</span>
                      )}
                    </div>
                  </td>
                  <td>
                    <div className="sds-cell-tags">
                      {comp.hazardStatements && comp.hazardStatements.length > 0 ? (
                        comp.hazardStatements.map((stmt, i) => (
                          <span key={i} className="sds-tag-mini--red">{stmt}</span>
                        ))
                      ) : (
                        <span className="text-xs text-gray-400">N/A</span>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="ghs-block ghs-block--gray sds-empty-block">
          <p>No composition data available.</p>
        </div>
      )}
    </div>
  );

  const renderSection9 = (section: SDSRecord['sections']['section9']) => (
    <div className="sds-section-wrap">
      <div className="sds-props-grid">
        <div className="sds-prop-card sds-prop-card--blue">
          <p className="sds-prop-card__label">Physical State</p>
          <p className="sds-prop-card__value">{section.physicalState}</p>
        </div>
        <div className="sds-prop-card sds-prop-card--purple">
          <p className="sds-prop-card__label">Appearance</p>
          <p className="sds-prop-card__value">{section.appearance}</p>
        </div>
        <div className="sds-prop-card sds-prop-card--green">
          <p className="sds-prop-card__label">Odour</p>
          <p className="sds-prop-card__value">{section.odour}</p>
        </div>
        <div className="sds-prop-card sds-prop-card--orange">
          <p className="sds-prop-card__label">
            <svg width={20} height={20} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.656 7.343A7.975 7.975 0 0120 13a7.975 7.975 0 01-2.343 5.657z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.879 16.121A3 3 0 1012.015 11L11 14H9c0 .768.293 1.536.879 2.121z" />
            </svg>
            Flash Point
          </p>
          <p className="sds-prop-card__value">{section.flashPoint}</p>
        </div>
        {section.boilingPoint && (
          <div className="sds-prop-card sds-prop-card--yellow">
            <p className="sds-prop-card__label">Boiling Point</p>
            <p className="sds-prop-card__value">{section.boilingPoint}</p>
          </div>
        )}
        <div className="sds-prop-card sds-prop-card--cyan">
          <p className="sds-prop-card__label">Vapour Pressure</p>
          <p className="sds-prop-card__value">{section.vapourPressure}</p>
        </div>
        {section.density && (
          <div className="sds-prop-card sds-prop-card--teal">
            <p className="sds-prop-card__label">Density</p>
            <p className="sds-prop-card__value">{section.density}</p>
          </div>
        )}
        {section.lowerExplosiveLimit && (
          <div className="sds-prop-card sds-prop-card--red">
            <p className="sds-prop-card__label">Lower Explosive Limit</p>
            <p className="sds-prop-card__value">{section.lowerExplosiveLimit}</p>
          </div>
        )}
        {section.upperExplosiveLimit && (
          <div className="sds-prop-card sds-prop-card--red">
            <p className="sds-prop-card__label">Upper Explosive Limit</p>
            <p className="sds-prop-card__value">{section.upperExplosiveLimit}</p>
          </div>
        )}
        {section.note && (
          <div className="sds-prop-card sds-prop-card--gray-note">
            <p className="sds-prop-card__label">Note</p>
            <p className="ghs-block__body">{section.note}</p>
          </div>
        )}
      </div>
    </div>
  );

  const renderSection14 = (section: SDSRecord['sections']['section14']) => (
    <div className="sds-transport-wrap">
      <div className="sds-transport-block sds-transport-block--blue">
        <h5 className="sds-transport-block__title">
          <svg className="sds-transport-block__icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
          </svg>
          DOT (Department of Transportation)
        </h5>
        <p className="sds-transport-block__body">{section.dot}</p>
      </div>

      {section.kemlerCode && (
        <div className="ghs-block ghs-block--gray">
          <p className="ghs-block__title">Kemler Code</p>
          <p className="ghs-block__body" style={{ fontFamily: 'ui-monospace, monospace', fontWeight: 600 }}>{section.kemlerCode}</p>
        </div>
      )}

      <div className="sds-transport-block sds-transport-block--green">
        <h5 className="sds-transport-block__title">
          <svg className="sds-transport-block__icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
          </svg>
          IATA (International Air Transport Association)
        </h5>
        <div className="sds-transport-grid">
          <div className="sds-transport-field sds-transport-field--green">
            <p className="sds-transport-field__label">UN Number</p>
            <p className="sds-transport-field__value sds-transport-field__value--mono">{section.iata.unNumber}</p>
          </div>
          <div className="sds-transport-field sds-transport-field--green">
            <p className="sds-transport-field__label">Class</p>
            <p className="sds-transport-field__value">{section.iata.class}</p>
          </div>
          <div className="sds-transport-field sds-transport-field--green">
            <p className="sds-transport-field__label">Packing Group</p>
            <p className="sds-transport-field__value">{section.iata.packingGroup}</p>
          </div>
          <div className="sds-transport-field sds-transport-field--green">
            <p className="sds-transport-field__label">Labels</p>
            <p className="sds-transport-field__value">{section.iata.labels}</p>
          </div>
          {section.iata.limitedQuantity && (
            <div className="sds-transport-field sds-transport-field--green">
              <p className="sds-transport-field__label">Limited Quantity</p>
              <p className="sds-transport-field__value">{section.iata.limitedQuantity}</p>
            </div>
          )}
          {section.iata.passengerAircraftLimit && (
            <div className="sds-transport-field sds-transport-field--green">
              <p className="sds-transport-field__label">Passenger Aircraft Limit</p>
              <p className="sds-transport-field__value">{section.iata.passengerAircraftLimit}</p>
            </div>
          )}
          {section.iata.cargoAircraftLimit && (
            <div className="sds-transport-field sds-transport-field--green">
              <p className="sds-transport-field__label">Cargo Aircraft Limit</p>
              <p className="sds-transport-field__value">{section.iata.cargoAircraftLimit}</p>
            </div>
          )}
          <div className="sds-transport-field sds-transport-field--green sds-transport-field--span-2">
            <p className="sds-transport-field__label">Description</p>
            <p className="sds-transport-field__value sds-transport-field__value--relaxed">{section.iata.description}</p>
          </div>
        </div>
      </div>

      <div className="sds-transport-block sds-transport-block--cyan">
        <h5 className="sds-transport-block__title">
          <svg className="sds-transport-block__icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          IMDG (International Maritime Dangerous Goods)
        </h5>
        <div className="sds-transport-grid">
          <div className="sds-transport-field sds-transport-field--cyan">
            <p className="sds-transport-field__label">UN Number</p>
            <p className="sds-transport-field__value sds-transport-field__value--mono">{section.imdg.unNumber}</p>
          </div>
          <div className="sds-transport-field sds-transport-field--cyan">
            <p className="sds-transport-field__label">Class</p>
            <p className="sds-transport-field__value">{section.imdg.class}</p>
          </div>
          <div className="sds-transport-field sds-transport-field--cyan">
            <p className="sds-transport-field__label">Packing Group</p>
            <p className="sds-transport-field__value">{section.imdg.packingGroup}</p>
          </div>
          <div className="sds-transport-field sds-transport-field--cyan">
            <p className="sds-transport-field__label">Labels</p>
            <p className="sds-transport-field__value">{section.imdg.labels}</p>
          </div>
          {section.imdg.emsNumber1 && (
            <div className="sds-transport-field sds-transport-field--cyan">
              <p className="sds-transport-field__label">EmS Number 1</p>
              <p className="sds-transport-field__value sds-transport-field__value--mono">{section.imdg.emsNumber1}</p>
            </div>
          )}
          {section.imdg.emsNumber2 && (
            <div className="sds-transport-field sds-transport-field--cyan">
              <p className="sds-transport-field__label">EmS Number 2</p>
              <p className="sds-transport-field__value sds-transport-field__value--mono">{section.imdg.emsNumber2}</p>
            </div>
          )}
          {section.imdg.marinePollutant && (
            <div className="sds-transport-field sds-transport-field--cyan">
              <p className="sds-transport-field__label">Marine Pollutant</p>
              <span className={section.imdg.marinePollutant.toLowerCase() === 'yes' ? 'sds-badge--yes' : 'sds-badge--no'}>
                {section.imdg.marinePollutant}
              </span>
            </div>
          )}
          {section.imdg.limitedQuantity && (
            <div className="sds-transport-field sds-transport-field--cyan">
              <p className="sds-transport-field__label">Limited Quantity</p>
              <p className="sds-transport-field__value">{section.imdg.limitedQuantity}</p>
            </div>
          )}
          <div className="sds-transport-field sds-transport-field--cyan sds-transport-field--span-2">
            <p className="sds-transport-field__label">Description</p>
            <p className="sds-transport-field__value sds-transport-field__value--relaxed">{section.imdg.description}</p>
          </div>
        </div>
      </div>

      {section.tdg && (
        <div className="sds-transport-block sds-transport-block--purple">
          <h5 className="sds-transport-block__title">
            <svg className="sds-transport-block__icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
            TDG (Transportation of Dangerous Goods - Canada)
          </h5>
          <div className="sds-transport-grid">
            <div className="sds-transport-field sds-transport-field--purple">
              <p className="sds-transport-field__label">Class</p>
              <p className="sds-transport-field__value">{section.tdg.class}</p>
            </div>
            <div className="sds-transport-field sds-transport-field--purple">
              <p className="sds-transport-field__label">Packing Group</p>
              <p className="sds-transport-field__value">{section.tdg.packingGroup}</p>
            </div>
          </div>
        </div>
      )}

      {section.mexico && (
        <div className="sds-transport-block sds-transport-block--orange">
          <h5 className="sds-transport-block__title">
            <svg className="sds-transport-block__icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            Mexico
          </h5>
          <div className="sds-transport-grid">
            <div className="sds-transport-field sds-transport-field--orange">
              <p className="sds-transport-field__label">Class</p>
              <p className="sds-transport-field__value">{section.mexico.class}</p>
            </div>
            <div className="sds-transport-field sds-transport-field--orange">
              <p className="sds-transport-field__label">Packing Group</p>
              <p className="sds-transport-field__value">{section.mexico.packingGroup}</p>
            </div>
          </div>
        </div>
      )}

      {section.otherInformation && (
        <div className="sds-transport-block sds-transport-block--gray">
          <h5 className="sds-transport-block__title">
            <svg className="sds-transport-block__icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Other Information
          </h5>
          <p className="sds-transport-block__body">{section.otherInformation}</p>
        </div>
      )}
    </div>
  );

  // Stats from dashboard API (extenders_dg) when available; fallback to local sdsRecords
  const stats = useMemo(() => {
    const mapCardToStat = (card: DashboardKpiCard, index: number) => ({
      title: index === 0 ? 'Total Extenders/Sub-Phases' : card.title,
      value: card.extValue,
      icon: KPI_ICONS[card.iconKey],
    });

    if (dashboardData?.kpiCards?.length) {
      return dashboardData.kpiCards.map(mapCardToStat);
    }

    // Fallback: compute from current page data
    const totalCount = sdsRecords.length;
    const approvedCount = sdsRecords.filter((r) => r.status === 'Approved').length;
    const rejectedCount = sdsRecords.filter((r) => r.status === 'Rejected').length;
    const pendingCount = sdsRecords.filter((r) => r.status === 'Pending Review').length;

    return [
      { title: 'Total Extenders/Sub-Phases', value: totalCount.toLocaleString(), icon: KPI_ICONS.total },
      { title: 'Pending Reviews', value: pendingCount.toLocaleString(), icon: KPI_ICONS.pending },
      { title: 'Approved', value: approvedCount.toLocaleString(), icon: KPI_ICONS.approved },
      { title: 'Rejected', value: rejectedCount.toLocaleString(), icon: KPI_ICONS.rejected },
    ];
  }, [dashboardData?.kpiCards, sdsRecords]);

  // Extract unique GHS codes from records
  // const ghsCodes = useMemo(() => {
  //   const codes = new Set<string>();
  //   sdsRecords.forEach(record => {
  //     record.ghsPictograms.forEach(code => {
  //       codes.add(code);
  //     });
  //   });
  //   return ['All', ...Array.from(codes).sort()];
  // }, [sdsRecords]);

  // API handles filtering and pagination; sdsRecords is the current page
  const paginatedRecords = sdsRecords;
  const totalPages = pagination?.total_pages ?? 1;
  const totalRecords = pagination?.total_records ?? 0;

  // Reset to page 1 when filters or page size change
  useEffect(() => {
    setCurrentPage(1);
  }, [statusFilter, dgClassFilter, itemsPerPage]);

  // Update select all checkbox when page changes or selections change
  useEffect(() => {
    const allSelected = paginatedRecords.length > 0 && 
      paginatedRecords.every(record => selectedRecords.has(record.id));
    setSelectAll(allSelected);
  }, [paginatedRecords, selectedRecords]);

  if (recordsError) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
        <Card style={{ textAlign: 'center', maxWidth: 400 }}>
          <Text type="danger" strong>Failed to load extenders</Text>
          <p style={{ marginTop: 8, color: 'rgba(0,0,0,0.65)' }}>{(recordsError as Error).message}</p>
          <Button type="primary" onClick={() => refetch()} style={{ marginTop: 16 }}>Retry</Button>
        </Card>
      </div>
    );
  }

  if (isLoadingRecords && !apiData?.data) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
        <Spin size="large" tip="Loading extenders..." />
      </div>
    );
  }

  return (
    <div style={{ marginBottom: 24 }}>
      <Row gutter={[24, 24]}>
        {stats.map((stat) => (
          <Col xs={24} sm={12} lg={6} key={stat.title}>
            <Card>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div style={{ flex: 1, color: '#222' }}>
                  <Text type="secondary" style={{ display: 'block', marginBottom: 8, fontWeight: 'bold', color: '#222', textAlign: 'left' }}>{stat.title}</Text>
                  <Text strong style={{ fontSize: 26, fontWeight: 'bold', color: '#000' }}>{stat.value}</Text>
                </div>
                <div>{stat.icon}</div>
              </div>
            </Card>
          </Col>
        ))}
      </Row>

      <Card style={{ marginTop: 24 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, flexWrap: 'wrap', gap: 16 }}>
          <div>
            <Title level={4} style={{ margin: 0 }}>Extenders/Sub-Phases - DG</Title>
            <Text type="secondary" style={{ fontSize: 12, display: 'block', marginTop: 4,textAlign: 'left' }}>Manage and classify Safety Data Sheets.</Text>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Button type="primary" onClick={() => setIsCreateModalOpen(true)}>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  aria-hidden="true"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 5v14M5 12h14" />
                </svg>
                <span>Manual Extender/Sub-Phase</span>
              </span>
            </Button>
          </div>
        </div>
        <div style={{ marginBottom: 16, display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 16 }}>
          <Input.Search
            placeholder="Search..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              if (e.target.value === '') { setApiSearchTerm(''); setCurrentPage(1); }
            }}
            onSearch={() => handleSearch()}
            enterButton="Search"
            allowClear
            style={{ maxWidth: 400 }}
          />
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginLeft: 'auto' }}>
            <span style={{ marginRight: 4 }}>Status:</span>
            <Select
              value={typeof statusFilter === 'string' ? statusFilter : 'All'}
              onChange={(v) => setStatusFilter(v)}
              style={{ minWidth: 180 }}
            >
              <Select.Option key="All" value="All">All</Select.Option>
              <Select.Option key="Pending Review" value="Pending Review">Pending Review - DG</Select.Option>
              <Select.Option key="Approved" value="Approved">Approved - DG</Select.Option>
              <Select.Option key="Rejected" value="Rejected">Rejected - DG</Select.Option>
            </Select>
          </div>
        </div>
        <div style={{ marginBottom: 8, textAlign: 'right' }}>
          <Text type="secondary">
            Showing {totalRecords === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1} to{' '}
            {Math.min(currentPage * itemsPerPage, totalRecords)} of {totalRecords} results
          </Text>
        </div>

        <Table
           className="w-full"
          data={paginatedRecords}
          columns={tableColumns}
          onRowClick={handleRowClick}
        />

        {/* Bulk Actions and Pagination Controls */}
        <div className="px-6 py-4 border-t border-gray-200">
          {/* Bulk Actions */}
          {selectedRecords.size > 0 && (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 12, marginBottom: 16, paddingBottom: 16, borderBottom: '1px solid #f0f0f0' }}>
              <Text strong>{selectedRecords.size} record(s) selected</Text>
              <Button type="primary" onClick={handleBulkApprove} style={{ backgroundColor: '#52c41a', borderColor: '#52c41a' }}>Approve Selected</Button>
              <Button type="danger" onClick={handleBulkReject} style={{ backgroundColor: '#ff4d4f', borderColor: '#ff4d4f' }}>Reject Selected</Button>
            </div>
          )}

          {totalPages > 1 && (
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Button
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
            >
              Previous
            </Button>

            <div className="flex items-center gap-2">
              {/* Page Numbers */}
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => {
                // Show first page, last page, current page, and pages around current
                if (
                  page === 1 ||
                  page === totalPages ||
                  (page >= currentPage - 1 && page <= currentPage + 1)
                ) {
                  return (
                    <Button
                      key={page}
                      type={currentPage === page ? 'primary' : 'default'}
                      size="small"
                      onClick={() => setCurrentPage(page)}
                    >
                      {page}
                    </Button>
                  );
                } else if (page === currentPage - 2 || page === currentPage + 2) {
                  return <span key={page} className="text-gray-500">...</span>;
                }
                return null;
              })}
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              <span style={{ marginRight: 4 }}>Per Page:</span>
              <Select
                value={itemsPerPage}
                onChange={(v) => setItemsPerPage(Number(v))}
                style={{ width: 80 }}
              >
                <Select.Option key="10" value={10}>10</Select.Option>
                <Select.Option key="20" value={20}>20</Select.Option>
                <Select.Option key="50" value={50}>50</Select.Option>
              </Select>
              <Button
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
              >
                Next
              </Button>
            </div>
            </div>
          )}

          {hasActiveFilters && (
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 16, paddingTop: 16, borderTop: '1px solid #f0f0f0' }}>
              <Button onClick={handleClearFilters}>Clear Filters</Button>
            </div>
          )}
        </div>
      </Card>

      {/* SDS Details Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => {
          setChildListParentMaterialCode(null);
          setIsModalOpen(false);
        }}
        title={selectedRecord ? `SDS Details - ${selectedRecord.materialName}` : 'SDS Details'}
        size="xl"
        minHeight="70vh"
      >
        {selectedRecord && (
          <div className="sds-details-body">
            <div className="sds-details-tabs">
              <button
                type="button"
                onClick={() => setDetailsModalTab(0)}
                className={`sds-details-tab ${detailsModalTab === 0 ? 'active' : ''}`}
              >
                Details
              </button>
              <button
                type="button"
                onClick={() => setDetailsModalTab(1)}
                className={`sds-details-tab ${detailsModalTab === 1 ? 'active' : ''}`}
              >
                Jurisdiction
              </button>
            </div>

            {detailsModalTab === 0 && (
            <>
            {/* Child records from API – display only when selected record is the parent */}
            {selectedRecord && childListParentMaterialCode != null && selectedRecord.materialId === childListParentMaterialCode && (
            <div className="sds-details-section sds-details-section--basic" style={{ marginBottom: 24 }}>
              <div className="sds-details-section-head">
                <div className="sds-details-section-accent sds-details-section-accent--blue" />
                <h3 className="sds-details-section-title">
                  Child Records for {childListParentMaterialCode}
                </h3>
              </div>
              {isLoadingChildren ? (
                <p className="sds-details-rationale-text" style={{ color: '#64748b' }}>Loading child records...</p>
              ) : childrenError ? (
                <p className="sds-details-rationale-text" style={{ color: '#dc2626' }}>Failed to load child records. Please try again.</p>
              ) : childRecordsFromApi && childRecordsFromApi.length > 0 ? (
                <div style={{ overflowX: 'auto', borderRadius: 8, border: '1px solid #e2e8f0', maxHeight: 256, overflowY: 'auto' }}>
                  <table className="sds-details-jurisdiction-table" style={{ fontSize: 13 }}>
                    <thead>
                      <tr className='bg-gray-50'>
                        <th>#</th>
                        <th>Material ID</th>
                        <th>Material Name</th>
                        <th>Source</th>
                        <th>Part/Sales</th>
                        <th>Uploaded Date</th>
                        <th>DG Code</th>
                        <th>Product Type</th>
                        <th>Manufacturer</th>
                      </tr>
                    </thead>
                    <tbody>
                      {childRecordsFromApi.map((record) => (
                        <tr key={record.materialId}>
                          <td>{record.id + 1}</td>
                          <td className="mono" style={{ whiteSpace: 'nowrap' }}>{record.materialId}</td>
                          <td style={{ maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis' }} title={record.materialName}>{record.materialName}</td>
                          <td style={{ whiteSpace: 'nowrap' }}>{record.source ?? '—'}</td>
                          <td className="mono" style={{ whiteSpace: 'nowrap' }}>{record.partNumber ?? '—'}</td>
                          <td style={{ whiteSpace: 'nowrap' }}>
                            {record.uploadedDate ? new Date(record.uploadedDate).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }) : '—'}
                          </td>
                          <td className="mono" style={{ maxWidth: 140, overflow: 'hidden', textOverflow: 'ellipsis' }} title={record.aiRecommendedDGCode}>{record.aiRecommendedDGCode ?? '—'}</td>
                          <td style={{ maxWidth: 100, overflow: 'hidden', textOverflow: 'ellipsis' }} title={record.productType ?? undefined}>{record.productType ?? '—'}</td>
                          <td style={{ maxWidth: 120, overflow: 'hidden', textOverflow: 'ellipsis' }} title={record.manufacturer ?? undefined}>{record.manufacturer ?? '—'}</td>
                          
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="sds-details-rationale-text" style={{ color: '#64748b' }}>No child records to display.</p>
              )}
            </div>
            )}

            {/* Basic Information */}
            <div className="sds-details-section sds-details-section--basic">
              <div className="sds-details-section-head">
                <div className="sds-details-section-accent sds-details-section-accent--blue" />
                <h3 className="sds-details-section-title">Basic Information</h3>
              </div>
              <div className="sds-details-grid sds-details-grid--4">
                <div className="sds-details-card">
                  <p className="sds-details-card-label">Material ID</p>
                  <p className="sds-details-card-value mono">{selectedRecord.materialId}</p>
                </div>
                {/* <div className="sds-details-card">
                  <p className="sds-details-card-label">Source</p>
                  <p className="sds-details-card-value">{selectedRecord.source}</p>
                </div> */}
                <div className="sds-details-card">
                  <p className="sds-details-card-label">Uploaded Date</p>
                  <p className="sds-details-card-value">
                    {new Date(selectedRecord.uploadedDate).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
                  </p>
                </div>
                <div className="sds-details-card">
                  <p className="sds-details-card-label">Sales Number</p>
                  <p className="sds-details-card-value">{selectedRecord.partNumber}</p>
                </div>
                {selectedRecord.sdsNumber && (
                  <div className="sds-details-card">
                    <p className="sds-details-card-label">SDS Number</p>
                    <p className="sds-details-card-value mono">{selectedRecord.sdsNumber}</p>
                  </div>
                )}
                <div className="sds-details-card">
                  <p className="sds-details-card-label">Hazardous Waste</p>
                  <span className={`sds-details-badge ${selectedRecord.hazardousWaste ? 'sds-details-badge--green' : 'sds-details-badge--red'}`}>
                    {selectedRecord.hazardousWaste ? 'Yes' : 'No'}
                  </span>
                </div>
                {selectedRecord.status && (
                  <div className="sds-details-card">
                    <p className="sds-details-card-label">Status</p>
                    <span className={`sds-details-badge ${
                      selectedRecord.status === 'Approved' ? 'sds-details-badge--green' :
                      selectedRecord.status === 'Rejected' ? 'sds-details-badge--red' :
                      'sds-details-badge--yellow'
                    }`}>
                      {selectedRecord.status}
                    </span>
                  </div>
                )}
                {selectedRecord.GHSStatus === 'Rejected' && (
                  <div className="sds-details-card sds-details-card--span2">
                    <p className="sds-details-card-label">GHS Reject Reason</p>
                    <p className="sds-details-card-value">{selectedRecord.ghs_reject_reason || '-'}</p>
                  </div>
                )}
                {selectedRecord.DGStatus === 'Rejected' && (
                  <div className="sds-details-card sds-details-card--span2">
                    <p className="sds-details-card-label">DG Reject Reason</p>
                    <p className="sds-details-card-value">{selectedRecord.dg_reject_reason || '-'}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Material Details */}
            {(selectedRecord.synonyms || selectedRecord.casNumber || selectedRecord.productType ||
              selectedRecord.intendedUse || selectedRecord.manufacturer) && (
              <div className="sds-details-section sds-details-section--material">
                <div className="sds-details-section-head">
                  <div className="sds-details-section-accent sds-details-section-accent--indigo" />
                  <h3 className="sds-details-section-title">Material Details</h3>
                </div>
                <div className="sds-details-grid">
                  {selectedRecord.synonyms && selectedRecord.synonyms.length > 0 && (
                    <div className="sds-details-card sds-details-card--span2">
                      <p className="sds-details-card-label">Synonyms</p>
                      <div className="flex flex-wrap gap-2">
                        {selectedRecord.synonyms.map((synonym, idx) => (
                          <span key={idx} className="sds-details-tag">
                            {synonym}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                  {selectedRecord.casNumber && (
                    <div className="sds-details-card">
                      <p className="sds-details-card-label">CAS Number</p>
                      <p className="sds-details-card-value mono">{selectedRecord.casNumber}</p>
                    </div>
                  )}
                  {selectedRecord.ecNumber && (
                    <div className="sds-details-card">
                      <p className="sds-details-card-label">EC Number</p>
                      <p className="sds-details-card-value mono">{selectedRecord.ecNumber}</p>
                    </div>
                  )}
                  {selectedRecord.indexNumber && (
                    <div className="sds-details-card">
                      <p className="sds-details-card-label">Index Number</p>
                      <p className="sds-details-card-value mono">{selectedRecord.indexNumber}</p>
                    </div>
                  )}
                  {selectedRecord.productType && (
                    <div className="sds-details-card">
                      <p className="sds-details-card-label">Product Type</p>
                      <p className="sds-details-card-value">{selectedRecord.productType}</p>
                    </div>
                  )}
                  {selectedRecord.intendedUse && (
                    <div className="sds-details-card">
                      <p className="sds-details-card-label">Intended Use</p>
                      <p className="sds-details-card-value">{selectedRecord.intendedUse}</p>
                    </div>
                  )}
                  {selectedRecord.manufacturer && (
                    <div className="sds-details-card sds-details-card--span2">
                      <p className="sds-details-card-label">Manufacturer/Supplier</p>
                      <p className="sds-details-card-value" style={{ marginBottom: 4 }}>{selectedRecord.manufacturer}</p>
                      {selectedRecord.manufacturerLocation && (
                        <p className="sds-details-rationale-text" style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                          <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                          {selectedRecord.manufacturerLocation}
                        </p>
                      )}
                    </div>
                  )}
                  {selectedRecord.emergencyContact && (
                    <div className="sds-details-card sds-details-card--span2">
                      <p className="sds-details-card-label">Emergency Contact</p>
                      <p className="sds-details-card-value" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <svg width="20" height="20" style={{ color: '#dc2626', flexShrink: 0 }} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>
                        {selectedRecord.emergencyContact}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* AI Classification & Rationale */}
            <div className="sds-details-section sds-details-section--ai">
              <div className="sds-details-section-head">
                <div className="sds-details-section-accent sds-details-section-accent--gradient" />
                <h3 className="sds-details-section-title">AI Classification & Rationale</h3>
              </div>
              <div className="sds-details-rationale-block">
                <p className="sds-details-rationale-label">AI-Recommended DG Code</p>
                <p className="sds-details-rationale-value">{selectedRecord.aiRecommendedDGCode}</p>
              </div>
              <div className="sds-details-rationale-block">
                <p className="sds-details-rationale-label">Rationale Summary</p>
                <p className="sds-details-rationale-text">{selectedRecord.rationaleSummary}</p>
              </div>
              {selectedRecord.ghsRationale && (
                <div className="sds-details-rationale-block">
                  <p className="sds-details-rationale-label" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    GHS Rationale
                  </p>
                  <p className="sds-details-rationale-text">{selectedRecord.ghsRationale}</p>
                </div>
              )}
              {selectedRecord.dgRationale && (
                <div className="sds-details-rationale-block">
                  <p className="sds-details-rationale-label" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
                    DG Rationale
                  </p>
                  <p className="sds-details-rationale-text">{selectedRecord.dgRationale}</p>
                </div>
              )}
              {selectedRecord.ghsPictograms && selectedRecord.ghsPictograms.length > 0 && (
                <div className="sds-details-rationale-block">
                  <p className="sds-details-rationale-label">GHS Pictograms</p>
                  <div className="sds-details-ghs-grid">
                    {selectedRecord.ghsPictograms.map((ghsCode) => {
                      const ghsData = GHS_PICTOGRAMS[ghsCode];
                      if (!ghsData) return null;
                      const tooltipId = `ghs-modal-${selectedRecord.id}-${ghsCode}`;
                      const tooltipContent = formatGHSTooltip(ghsData);
                      return (
                        <div key={ghsCode}>
                          <div
                            data-tooltip-id={tooltipId}
                            data-tooltip-content={tooltipContent}
                            className="sds-details-ghs-picto"
                          >
                            {ghsData.icon}
                          </div>
                          <Tooltip
                            id={tooltipId}
                            place="top"
                            offset={30}
                            delayShow={300}
                            delayHide={0}
                            float={false}
                            style={{
                              backgroundColor: '#1f2937',
                              color: '#fff',
                              borderRadius: '0.5rem',
                              padding: '0.75rem',
                              maxWidth: '450px',
                              fontSize: '0.875rem',
                              lineHeight: '1.5',
                              boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
                              zIndex: 9999,
                              whiteSpace: 'pre-line',
                            }}
                          />
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Feedback (if rejected) */}
            {selectedRecord.feedback && (
              <div className="sds-details-section sds-details-section--feedback">
                <div className="sds-details-feedback-head">
                  <div className="sds-details-section-accent sds-details-section-accent--red" />
                  <h3 className="sds-details-feedback-title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                    Rejection Feedback
                  </h3>
                </div>
                <div className="sds-details-rationale-block" style={{ borderColor: '#fecaca', background: '#fff' }}>
                  <p className="sds-details-rationale-text">{selectedRecord.feedback}</p>
                </div>
              </div>
            )}

            <Accordion
              items={[
                {
                  title: 'Hazards Identification',
                  content: renderSection2(selectedRecord.sections.section2),
                },
                {
                  title: 'Composition/Information on Ingredients',
                  content: renderSection3(selectedRecord.sections.section3),
                },
                {
                  title: 'Physical and Chemical Properties',
                  content: renderSection9(selectedRecord.sections.section9),
                },
                {
                  title: 'Transport Information',
                  content: renderSection14(selectedRecord.sections.section14),
                },
              ]}
            />
            </>
            )}

            {detailsModalTab === 1 && (
              <div className="sds-details-jurisdiction-box">
                <p className="sds-details-section-title" style={{ marginBottom: 16, textAlign: 'left' }}>
                  Classification: {selectedRecord.materialId}
                </p>
                {isJurisdictionsLoading && (
                  <div className="flex items-center justify-center py-8 text-gray-500">
                    <span className="inline-block animate-spin rounded-full h-6 w-6 border-2 border-gray-400 border-t-transparent mr-2" />
                    Loading jurisdictions...
                  </div>
                )}
                {jurisdictionsError && (
                  <div className="sds-details-rationale-block" style={{ background: '#fef2f2', borderColor: '#fca5a5' }}>
                    <p className="sds-details-rationale-text" style={{ color: '#b91c1c' }}>Failed to load jurisdictions: {(jurisdictionsError as Error).message}</p>
                  </div>
                )}
                {!isJurisdictionsLoading && !jurisdictionsError && (
                  <div style={{ overflowX: 'auto', borderRadius: 8 }}>
                    <table className="sds-details-jurisdiction-table">
                      <thead>
                        <tr className="bg-gray-50">
                          <th>Authority Country</th>
                          <th>UN Number</th>
                          <th>PSN</th>
                          <th>Packaging Group</th>
                          <th>Hazard Category</th> 
                        </tr>
                      </thead>
                      <tbody>
                        {(jurisdictionsData ?? []).map((row, idx) => (
                          <tr key={idx}>
                            <td>{row.authority_country}</td>
                            <td className="mono">{row.un_number}</td>
                            <td>{row.psn}</td>
                            <td>{row.packaging_group}</td>
                            <td>{row.hazard_category}</td> 
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* Row action modals: GHS Classification, Jurisdiction, Parent Child */}
      {actionModal && (
        <Modal
          isOpen={!!actionModal}
          onClose={() => setActionModal(null)}
          title={
            actionModal.type === 'ghs'
              ? 'GHS Classification'
              : actionModal.type === 'jurisdiction'
              ? 'Jurisdiction'
              : 'Parent Child'
          }
          size="xl"
        >
          <div className="py-4 text-gray-600 text-sm">
            {actionModal.type === 'ghs' && (
             <>
              <div className="overflow-x-auto rounded-lg" style={{ border: '1px solid #ccc' }}>
                <table className="w-full border-collapse text-sm" style={{ border: '1px solid #ccc' }}>
                  <thead>
                    <tr>
                      <th className="text-left py-3 px-4 font-semibold text-gray-900 bg-gray-50" style={{ border: '1px solid #ccc' }}>
                        GHS Classification
                      </th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-900 bg-gray-50" style={{ border: '1px solid #ccc' }}>
                        GHS Category
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white">
                    {(actionModal.record.ghsClassificationData ?? []).length > 0 ? (
                      (actionModal.record.ghsClassificationData ?? []).map((row, idx) => (
                        <tr key={idx}>
                          <td className="text-left py-3 px-4 text-gray-800" style={{ border: '1px solid #ccc' }}>{row.classificationName}</td>
                          <td className="text-left py-3 px-4 text-gray-800" style={{ border: '1px solid #ccc' }}>{row.category}</td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={2} className="text-left py-3 px-4 text-gray-500 italic" style={{ border: '1px solid #ccc' }}>
                          No GHS classification data available.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
              <p className="text-base font-semibold text-gray-900 mt-6 mb-2 pb-1 border-b border-gray-300 text-left">GHS/CLP Classification</p>
              <div className="overflow-x-auto rounded-lg" style={{ border: '1px solid #ccc' }}>
                <table className="w-full border-collapse text-sm" style={{ border: '1px solid #ccc' }}>
                  <thead>
                    <tr>
                      <th className="text-left py-3 px-4 font-semibold text-gray-900 bg-gray-50" style={{ border: '1px solid #ccc' }}>Code</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-900 bg-gray-50" style={{ border: '1px solid #ccc' }}>Type</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-900 bg-gray-50" style={{ border: '1px solid #ccc' }}>Code Description</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white">
                    {(actionModal.record.hazardsCodes ?? []).length > 0 ? (
                      (actionModal.record.hazardsCodes ?? []).map((row, idx) => (
                        <tr key={idx}>
                          <td className="text-left py-3 px-4 text-gray-800" style={{ border: '1px solid #ccc' }}>{row.code}</td>
                          <td className="text-left py-3 px-4 text-gray-800" style={{ border: '1px solid #ccc' }}>{row.type ?? '—'}</td>
                          <td className="text-left py-3 px-4 text-gray-800" style={{ border: '1px solid #ccc' }}>{row.codeDesc}</td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={3} className="text-left py-3 px-4 text-gray-500 italic" style={{ border: '1px solid #ccc' }}>
                          No hazard codes data available.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
              </>
            )}
            {actionModal.type === 'jurisdiction' && (
              <div className="sds-details-jurisdiction-box">
                <p className="sds-details-section-title" style={{ marginBottom: 16, textAlign: 'left' }}>
                  Classification: {actionModal.record.materialId}
                </p>
                {isJurisdictionsLoading && (
                  <div className="flex items-center justify-center py-8 text-gray-500">
                    <span className="inline-block animate-spin rounded-full h-6 w-6 border-2 border-gray-400 border-t-transparent mr-2" />
                    Loading jurisdictions...
                  </div>
                )}
                {jurisdictionsError && (
                  <div className="sds-details-rationale-block" style={{ background: '#fef2f2', borderColor: '#fca5a5' }}>
                    <p className="sds-details-rationale-text" style={{ color: '#b91c1c' }}>Failed to load jurisdictions: {(jurisdictionsError as Error).message}</p>
                  </div>
                )}
                {!isJurisdictionsLoading && !jurisdictionsError && (
                  <div style={{ overflowX: 'auto', borderRadius: 8, border: '1px solid #ccc' }}>
                    <table className="sds-details-jurisdiction-table" style={{ border: '1px solid #ccc' }}>
                      <thead>
                        <tr className="bg-gray-50">
                          <th style={{ border: '1px solid #ccc' }}>Authority Country</th>
                          <th style={{ border: '1px solid #ccc' }}>UN Number</th>
                          <th style={{ border: '1px solid #ccc' }}>PSN</th>
                          <th style={{ border: '1px solid #ccc' }}>Packaging Group</th>
                          <th style={{ border: '1px solid #ccc' }}>Hazard Category</th> 
                        </tr>
                      </thead>
                      <tbody>
                        {(jurisdictionsData ?? []).map((row, idx) => (
                          <tr key={idx}>
                            <td style={{ border: '1px solid #ccc' }}>{row.authority_country}</td>
                            <td className="mono" style={{ border: '1px solid #ccc' }}>{row.un_number}</td>
                            <td style={{ border: '1px solid #ccc' }}>{row.psn}</td>
                            <td style={{ border: '1px solid #ccc' }}>{row.packaging_group}</td>
                            <td style={{ border: '1px solid #ccc' }}>{row.hazard_category}</td> 
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}
            {actionModal.type === 'parent-child' && (
              <div className="sds-details-section sds-details-section--basic" style={{ marginBottom: 0 }}>
                <div className="sds-details-section-head">
                  <div className="sds-details-section-accent sds-details-section-accent--blue" />
                  <h3 className="sds-details-section-title">
                    Child Records for {actionModal.record.materialId}
                  </h3>
                </div>
                {isLoadingChildren ? (
                  <p className="sds-details-rationale-text" style={{ color: '#64748b' }}>Loading child records...</p>
                ) : childrenError ? (
                  <p className="sds-details-rationale-text" style={{ color: '#dc2626' }}>Failed to load child records. Please try again.</p>
                ) : childRecordsFromApi && childRecordsFromApi.length > 0 ? (
                  <div style={{ overflowX: 'auto', borderRadius: 8, border: '1px solid #e2e8f0', maxHeight: 256, overflowY: 'auto' }}>
                    <table className="sds-details-jurisdiction-table" style={{ fontSize: 13, textAlign: 'left' }}>
                      <thead>
                        <tr className='bg-gray-50'>
                          <th>#</th>
                          <th>Material ID</th>
                          <th>Material Name</th>
                          <th>DG Code</th>
                          <th>Product Type</th> 
                        </tr>
                      </thead>
                      <tbody>
                        {childRecordsFromApi.map((record) => (
                          <tr key={record.materialId}>
                            <td>{record.id + 1}</td>
                            <td className="mono" style={{ whiteSpace: 'nowrap' }}>{record.materialId}</td>
                            <td style={{ maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis' }} title={record.materialName}>{record.materialName}</td>
                       
                            <td className="mono" style={{ maxWidth: 140, overflow: 'hidden', textOverflow: 'ellipsis' }} title={record.aiRecommendedDGCode}>{record.aiRecommendedDGCode ?? '—'}</td>
                            <td style={{ maxWidth: 100, overflow: 'hidden', textOverflow: 'ellipsis' }} title={record.productType ?? undefined}>{record.productType ?? '—'}</td>
                            
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p className="sds-details-rationale-text" style={{ color: '#64748b' }}>No child records to display.</p>
                )}
              </div>
            )}
          </div>
        </Modal>
      )}

      {/* PDF Viewer Modal */}
      <Modal
        isOpen={isPdfModalOpen}
        onClose={() => setIsPdfModalOpen(false)}
        title="SDS Sheet - PDF Viewer"
        size="xl"
        minHeight="90vh"
        bodyClassName="modal-body--fill"
      >
        <iframe
          src={currentPdfUrl}
          className="w-full border-0"
          title="SDS PDF Viewer"
        />
      </Modal>

      {/* GHS Tooltips */}
      {/* {sdsRecords.map((record) => {
        // Use ghsPictograms directly from the record
        const pictogramArray = record.ghsPictograms || [];

        return pictogramArray.map((ghsCode) => {
          const ghsData = GHS_PICTOGRAMS[ghsCode];
          if (!ghsData) return null;
          
          const tooltipId = `ghs-${record.id}-${ghsCode}`;
          
          return (
            <Tooltip
              key={tooltipId}
              id={tooltipId}
              place="top"
              offset={30}
              delayShow={300}
              delayHide={0}
              float={false}
              opacity={1}
              style={{
                backgroundColor: '#1f2937',
                color: '#fff',
                borderRadius: '0.5rem',
                padding: '0.75rem',
                maxWidth: '450px',
                fontSize: '0.875rem',
                lineHeight: '1.5',
                boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
                zIndex: 9999,
                whiteSpace: 'pre-line',
              }}
            />
          );
        });
      })} */}

      {/* Rationale Tooltips */}
      {sdsRecords.map((record) => {
        const tooltipId = `rationale-${record.id}`;
        
        return (
          <Tooltip
            key={tooltipId}
            id={tooltipId}
            place="top"
            offset={30}
            delayShow={300}
            delayHide={0}
            float={false}
            style={{
              backgroundColor: '#1f2937',
              color: '#fff',
              borderRadius: '0.5rem',
              padding: '0.75rem',
              maxWidth: '400px',
              fontSize: '0.875rem',
              lineHeight: '1.5',
              boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
              zIndex: 9999,
            }}
          />
        );
      })}

      {/* Material Name Tooltips */}
      {sdsRecords.map((record) => {
        const tooltipId = `material-name-${record.id}`;
        
        return (
          <Tooltip
            key={tooltipId}
            id={tooltipId}
            place="top"
            offset={30}
            delayShow={200}
            delayHide={0}
            style={{
              backgroundColor: '#1f2937',
              color: '#fff',
              borderRadius: '0.5rem',
              padding: '0.5rem',
              maxWidth: '300px',
              fontSize: '0.875rem',
              zIndex: 9999,
            }}
          />
        );
      })}

      {/* Create Material Modal (opens for manual entry; does not create a record) */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={handleCloseCreateModal}
        title="Manual Extender/Sub-Phase (?)"
        size="md"
      >
        <div className="space-y-4">
          <div>
            <label htmlFor="materialId" className="block text-sm text-left font-medium text-gray-700 mb-2">
              Material ID <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="materialId"
              value={newMaterialId}
              onChange={(e) => {
                setNewMaterialId(e.target.value);
                setCreateError('');
              }}
              placeholder="Enter Material ID (e.g., 9999-XX-XXXX)"
              className="w-full px-4 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              autoFocus
            />
          </div>

          {createError && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-md">
              <p className="text-sm text-red-600">{createError}</p>
            </div>
          )}

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, paddingTop: 16, borderTop: '1px solid #f0f0f0' }}>
            <Button onClick={handleCloseCreateModal}>Cancel</Button>
            <Button type="primary" onClick={handleCreateMaterial}>Pull from RDS or WERCS</Button>
          </div>
        </div>
      </Modal>

      {/* Reject Feedback Modal */}
      <Modal
        isOpen={isRejectFeedbackModalOpen}
        onClose={handleCloseRejectFeedbackModal}
        title={isBulkReject ? `Reject ${recordsToReject.size} Record(s)` : 'Reject Record'}
        size="md"
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <label htmlFor="rejectFeedback" className="block text-sm text-left font-medium text-gray-700 mb-2">
              Feedback <span className="text-red-500">*</span>
            </label>
            <Input.TextArea
              id="rejectFeedback"
              value={rejectFeedback}
              onChange={(e) => setRejectFeedback(e.target.value)}
              placeholder="Enter feedback for rejection..."
              rows={5}
              autoFocus
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, paddingTop: 16, borderTop: '1px solid #f0f0f0' }}>
            <Button onClick={handleCloseRejectFeedbackModal}>Cancel</Button>
            <Button type="danger" onClick={handleConfirmReject} disabled={!rejectFeedback.trim()}>
              Reject
            </Button>
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={isApproveConfirmModalOpen}
        onClose={handleCloseApproveConfirmModal}
        title="Approve Extender"
        size="md"
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <p className="text-sm text-gray-700 text-left">
            Are you sure you want to approve this Extender?
          </p>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, paddingTop: 16, borderTop: '1px solid #f0f0f0' }}>
            <Button onClick={handleCloseApproveConfirmModal}>Cancel</Button>
            <Button type="primary" onClick={handleConfirmApprove}>
              Approve
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default Extenders;

