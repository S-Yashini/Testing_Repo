import { useState, useEffect, useMemo } from 'react';
import { useHistory } from 'react-router-dom';
import { Card, Button, Typography, Row, Col, Spin } from 'antd';
import { Tooltip } from 'react-tooltip';
import sdsRecordsData from '../../data/sdsRecords.json';
import extenderRecordsData from '../../data/extenderRecords.json';
import { GHS_PICTOGRAMS } from '../../components/GHSInfo/GHSInfo';
import { useDashboardData } from '../../hooks/useDashboardData';

const {  Text } = Typography;

interface SDSRecord {
  id: number;
  materialId: string;
  materialName: string;
  source: string;
  aiRecommendedDGCode: string;
  rationaleSummary: string;
  ghsPictograms: string[];
  status?: string;
  GHSStatus?: string;
  DGStatus?: string;
  uploadedDate: string;
  'GHS Approval/Rejection Date'?: string;
  'DG Approval/Rejection Date'?: string;
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

const Dashboard = () => {
  const [sdsRecords, setSdsRecords] = useState<SDSRecord[]>([]);
  const [extenderRecords, setExtenderRecords] = useState<SDSRecord[]>([]);

  const { dashboardData, isLoading: isDashboardLoading, error: dashboardError } = useDashboardData({ recentActivityDays: 7 });

  useEffect(() => {
    // Load from localStorage if available, otherwise use JSON file
    const savedRecords = localStorage.getItem('sdsRecords');
    let records: SDSRecord[] = [];
    
    if (savedRecords) {
      try {
        records = JSON.parse(savedRecords);
      } catch (error) {
        console.error('Error loading from localStorage:', error);
        records = sdsRecordsData as SDSRecord[];
      }
    } else {
      records = sdsRecordsData as SDSRecord[];
    }
    
    // Deduplicate records by ID to prevent duplicates
    const uniqueRecords = new Map<number, SDSRecord>();
    records.forEach(record => {
      if (!uniqueRecords.has(record.id)) {
        uniqueRecords.set(record.id, record);
      }
    });
    
    const initialized = Array.from(uniqueRecords.values()).map(record => {
      const jsonRecord = record as any;
      return {
        ...record,
        status: record.status || 'Pending Review',
        'GHS Approval/Rejection Date': jsonRecord['GHS Approval/Rejection Date'] || undefined,
        'DG Approval/Rejection Date': jsonRecord['DG Approval/Rejection Date'] || undefined,
      };
    });
    setSdsRecords(initialized);
  }, []);

  useEffect(() => {
    // Load extenders from localStorage if available, otherwise use JSON file
    const savedExtenders = localStorage.getItem('extenderRecords');
    let records: SDSRecord[] = [];

    if (savedExtenders) {
      try {
        records = JSON.parse(savedExtenders);
      } catch (error) {
        console.error('Error loading extender records from localStorage:', error);
        records = extenderRecordsData as SDSRecord[];
      }
    } else {
      records = extenderRecordsData as SDSRecord[];
    }

    // Deduplicate by ID
    const uniqueRecords = new Map<number, SDSRecord>();
    records.forEach(record => {
      if (!uniqueRecords.has(record.id)) {
        uniqueRecords.set(record.id, record);
      }
    });

    const initialized = Array.from(uniqueRecords.values()).map(record => ({
      ...record,
      status: record.status || 'Pending Review',
    }));

    setExtenderRecords(initialized);
  }, []);

  // Calculate KPI stats (separate GHS and DG counts)
  const kpiStats = useMemo(() => {
    const total = sdsRecords.length;
    
    // GHS stats
    const ghsPending = sdsRecords.filter(record => (record.GHSStatus || record.status) === 'Pending Review').length;
    const ghsApproved = sdsRecords.filter(record => (record.GHSStatus || record.status) === 'Approved').length;
    const ghsRejected = sdsRecords.filter(record => (record.GHSStatus || record.status) === 'Rejected').length;
    
    // DG stats
    const dgPending = sdsRecords.filter(record => (record.DGStatus || record.status) === 'Pending Review').length;
    const dgApproved = sdsRecords.filter(record => (record.DGStatus || record.status) === 'Approved').length;
    const dgRejected = sdsRecords.filter(record => (record.DGStatus || record.status) === 'Rejected').length;
    
    // Combined totals (for backward compatibility)
    const pending = ghsPending + dgPending;
    const approved = ghsApproved + dgApproved;
    const rejected = ghsRejected + dgRejected;

    return { 
      total, 
      pending, 
      approved, 
      rejected,
      ghsPending,
      ghsApproved,
      ghsRejected,
      dgPending,
      dgApproved,
      dgRejected
    };
  }, [sdsRecords]);

  // KPI stats for cards (GHS, DG, Extenders)
  const kpiCards = useMemo(() => {
    const getGhsStatus = (record: SDSRecord) => (record as any).GHSStatus || record.status || 'Pending Review';
    const getDgStatus = (record: SDSRecord) => (record as any).DGStatus || record.status || 'Pending Review';

    const ghsTotal = sdsRecords.length;
    const dgTotal = sdsRecords.length;
    const extTotal = extenderRecords.length;

    const ghsPending = sdsRecords.filter(r => getGhsStatus(r) === 'Pending Review').length;
    const dgPending = sdsRecords.filter(r => getDgStatus(r) === 'Pending Review').length;
    const extPending = extenderRecords.filter(r => r.status === 'Pending Review').length;

    const ghsApproved = sdsRecords.filter(r => getGhsStatus(r) === 'Approved').length;
    const dgApproved = sdsRecords.filter(r => getDgStatus(r) === 'Approved').length;
    const extApproved = extenderRecords.filter(r => r.status === 'Approved').length;

    const ghsRejected = sdsRecords.filter(r => getGhsStatus(r) === 'Rejected').length;
    const dgRejected = sdsRecords.filter(r => getDgStatus(r) === 'Rejected').length;
    const extRejected = extenderRecords.filter(r => r.status === 'Rejected').length;

    return [
      {
        title: 'Total Classifications',
        ghsValue: ghsTotal.toLocaleString(),
        dgValue: dgTotal.toLocaleString(),
        extValue: extTotal.toLocaleString(),
        icon: (
          <svg className="w-10 h-10 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
        ),
      },
      {
        title: 'Pending Reviews',
        ghsValue: ghsPending.toLocaleString(),
        dgValue: dgPending.toLocaleString(),
        extValue: extPending.toLocaleString(),
        icon: (
          <svg className="w-10 h-10 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        ),
      },
      {
        title: 'Approved',
        ghsValue: ghsApproved.toLocaleString(),
        dgValue: dgApproved.toLocaleString(),
        extValue: extApproved.toLocaleString(),
        icon: (
          <svg className="w-10 h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        ),
      },
      {
        title: 'Rejected',
        ghsValue: ghsRejected.toLocaleString(),
        dgValue: dgRejected.toLocaleString(),
        extValue: extRejected.toLocaleString(),
        icon: (
          <svg className="w-10 h-10 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        ),
      },
    ];
  }, [sdsRecords, extenderRecords]);
 
 

  // Get recent classifications (sorted by date, most recent first)
  const recentClassifications = useMemo(() => {
    // Sort by uploadedDate in descending order (newest first), then take first 5
    return [...sdsRecords]
      .sort((a, b) => {
        const dateA = new Date(a.uploadedDate).getTime();
        const dateB = new Date(b.uploadedDate).getTime();
        return dateB - dateA; // Descending order (newest first)
      })
      .slice(0, 5);
  }, [sdsRecords]);

  const recentExtenders = useMemo(() => {
    // Sort by uploadedDate in descending order (newest first), then take first 5
    return [...extenderRecords]
      .sort((a, b) => {
        const dateA = new Date(a.uploadedDate).getTime();
        const dateB = new Date(b.uploadedDate).getTime();
        return dateB - dateA; // Descending order (newest first)
      })
      .slice(0, 5);
  }, [extenderRecords]);

  // Calculate time ago
  const getTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return '1 day ago';
    return `${diffDays} days ago`;
  };

  // Extract UN number from aiRecommendedDGCode
  const getUNNumber = (dgCode: string) => {
    const match = dgCode.match(/UN\d+/);
    return match ? match[0] : '';
  };

  // Prepare data for DG Class Distribution
//   const dgClassDistribution = useMemo(() => {
//     const classMap = new Map<string, number>();
    
//     sdsRecords.forEach(record => {
//       const match = record.aiRecommendedDGCode.match(/Class\s+[\d.]+/);
//       if (match) {
//         const dgClass = match[0];
//         classMap.set(dgClass, (classMap.get(dgClass) || 0) + 1);
//       }
//     });
    
//     return Array.from(classMap.entries())
//       .map(([name, value]) => ({ name, value }))
//       .sort((a, b) => b.value - a.value);
//   }, [sdsRecords]);

  // Review Queue - Pending materials
//   const reviewQueue = useMemo(() => {
//     return sdsRecords
//       .filter(record => record.status === 'Pending Review')
//       .slice(0, 5);
//   }, [sdsRecords]);

  // High Priority Materials - Materials with multiple GHS pictograms or specific hazard codes
  const highPriorityMaterials = useMemo(() => {
    // Use a Map to store unique records by materialName + UN number combination
    const uniqueRecords = new Map<string, SDSRecord>();
    
    sdsRecords.forEach(record => {
      // High priority: 3+ GHS pictograms, or contains GHS06 (Acute Toxicity), or GHS08 (Health Hazard)
      if (record.ghsPictograms.length >= 3 || 
          record.ghsPictograms.includes('GHS06') || 
          record.ghsPictograms.includes('GHS08')) {
        // Extract UN number from aiRecommendedDGCode
        const unNumber = getUNNumber(record.aiRecommendedDGCode);
        // Create a unique key from materialName and UN number
        const uniqueKey = `${record.materialName}-${unNumber}`.toLowerCase().trim();
        
        // Only add if we haven't seen this materialName + UN number combination before
        if (!uniqueRecords.has(uniqueKey)) {
          uniqueRecords.set(uniqueKey, record);
        }
      }
    });
    
    // Convert Map values to array and take first 5
    return Array.from(uniqueRecords.values()).slice(0, 5);
  }, [sdsRecords]);


  // Material Categories Summary
//   const materialCategories = useMemo(() => {
//     const sourceMap = new Map<string, number>();
//     sdsRecords.forEach(record => {
//       sourceMap.set(record.source, (sourceMap.get(record.source) || 0) + 1);
//     });
//     return Array.from(sourceMap.entries())
//       .map(([source, count]) => ({ source, count }))
//       .sort((a, b) => b.count - a.count);
//   }, [sdsRecords]);

  // Compliance Status for Raw Materials and Extenders
  const complianceStatus = useMemo(() => {
    // Raw Materials compliance - GHS
    const rawTotal = sdsRecords.length;
    const rawGHSApproved = sdsRecords.filter(r => (r.GHSStatus || r.status) === 'Approved').length;
    const rawGHSComplianceRate = rawTotal > 0 ? Math.round((rawGHSApproved / rawTotal) * 100) : 0;
    
    let rawGHSStatus = 'Good';
    let rawGHSStatusColor = 'text-green-600';
    let rawGHSBgColor = 'bg-green-100';
    
    if (rawGHSComplianceRate < 50) {
      rawGHSStatus = 'Critical';
      rawGHSStatusColor = 'text-red-600';
      rawGHSBgColor = 'bg-red-100';
    } else if (rawGHSComplianceRate < 75) {
      rawGHSStatus = 'Warning';
      rawGHSStatusColor = 'text-yellow-600';
      rawGHSBgColor = 'bg-yellow-100';
    }
    
    // Raw Materials compliance - DG
    const rawDGApproved = sdsRecords.filter(r => (r.DGStatus || r.status) === 'Approved').length;
    const rawDGComplianceRate = rawTotal > 0 ? Math.round((rawDGApproved / rawTotal) * 100) : 0;
    
    let rawDGStatus = 'Good';
    let rawDGStatusColor = 'text-green-600';
    let rawDGBgColor = 'bg-green-100';
    
    if (rawDGComplianceRate < 50) {
      rawDGStatus = 'Critical';
      rawDGStatusColor = 'text-red-600';
      rawDGBgColor = 'bg-red-100';
    } else if (rawDGComplianceRate < 75) {
      rawDGStatus = 'Warning';
      rawDGStatusColor = 'text-yellow-600';
      rawDGBgColor = 'bg-yellow-100';
    }
    
    // Extenders compliance
    const extTotal = extenderRecords.length;
    const extApproved = extenderRecords.filter(r => r.status === 'Approved').length;
    const extComplianceRate = extTotal > 0 ? Math.round((extApproved / extTotal) * 100) : 0;
    
    let extStatus = 'Good';
    let extStatusColor = 'text-green-600';
    let extBgColor = 'bg-green-100';
    
    if (extComplianceRate < 50) {
      extStatus = 'Critical';
      extStatusColor = 'text-red-600';
      extBgColor = 'bg-red-100';
    } else if (extComplianceRate < 75) {
      extStatus = 'Warning';
      extStatusColor = 'text-yellow-600';
      extBgColor = 'bg-yellow-100';
    }
    
    return {
      rawMaterials: {
        ghs: {
          complianceRate: rawGHSComplianceRate,
          status: rawGHSStatus,
          statusColor: rawGHSStatusColor,
          bgColor: rawGHSBgColor,
          approved: rawGHSApproved,
          total: rawTotal
        },
        dg: {
          complianceRate: rawDGComplianceRate,
          status: rawDGStatus,
          statusColor: rawDGStatusColor,
          bgColor: rawDGBgColor,
          approved: rawDGApproved,
          total: rawTotal
        }
      },
      extenders: {
        complianceRate: extComplianceRate,
        status: extStatus,
        statusColor: extStatusColor,
        bgColor: extBgColor,
        approved: extApproved,
        total: extTotal
      }
    };
  }, [sdsRecords, extenderRecords]);

  // Quick Stats
//   const quickStats = useMemo(() => {
//     const totalHazards = sdsRecords.reduce((sum, r) => sum + r.ghsPictograms.length, 0);
    
//     const materialsWithMultipleHazards = sdsRecords.filter(r => r.ghsPictograms.length >= 3).length;
    
//     const pendingReviewRate = kpiStats.total > 0 
//       ? Math.round((kpiStats.pending / kpiStats.total) * 100) 
//       : 0;
    
//     return { totalHazards, materialsWithMultipleHazards, pendingReviewRate };
//   }, [sdsRecords, kpiStats]);

  // System Status
  const systemStatus = useMemo(() => {
    const recentRawMaterials = sdsRecords.filter(r => {
      const date = new Date(r.uploadedDate);
      const now = new Date();
      const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
      return diffDays <= 7;
    }).length;
    
    const recentExtenders = extenderRecords.filter(r => {
      const date = new Date(r.uploadedDate);
      const now = new Date();
      const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
      return diffDays <= 7;
    }).length;
    
    const recentActivity = recentRawMaterials + recentExtenders;
    
    // Calculate Average Review Time
    const reviewedRecords = sdsRecords.filter(record => {
      const ghsDate = (record as any)['GHS Approval/Rejection Date'];
      const dgDate = (record as any)['DG Approval/Rejection Date'];
      const hasReviewDate = (record.status === 'Approved' && (ghsDate || dgDate)) || 
                           (record.status === 'Rejected' && (ghsDate || dgDate));
      return hasReviewDate;
    });
    
    let averageReviewTime = 'N/A';
    if (reviewedRecords.length > 0) {
      const totalReviewTime = reviewedRecords.reduce((sum, record) => {
        const uploadedDate = new Date(record.uploadedDate);
        // Get the appropriate date based on status
        const ghsDate = (record as any)['GHS Approval/Rejection Date'];
        const dgDate = (record as any)['DG Approval/Rejection Date'];
        const dateStr = ghsDate || dgDate || '';
        const reviewDate = dateStr ? new Date(dateStr) : uploadedDate;
        const reviewTimeInMs = reviewDate.getTime() - uploadedDate.getTime();
        const reviewTimeInDays = reviewTimeInMs / (1000 * 60 * 60 * 24);
        return sum + reviewTimeInDays;
      }, 0);
      
      const averageDays = totalReviewTime / reviewedRecords.length;
      averageReviewTime = `${averageDays.toFixed(1)} days`;
    }
    
    return {
      isActive: true,
      recentActivity,
      recentRawMaterials,
      recentExtenders,
      lastUpdate: sdsRecords.length > 0 ? getTimeAgo(sdsRecords[0].uploadedDate) : 'N/A',
      averageReviewTime
    };
  }, [sdsRecords, extenderRecords]);

  const history = useHistory();

  // Use API dashboard data when available, otherwise fall back to local computed values
  const kpiCardsToShow = useMemo(() => {
    if (dashboardData?.kpiCards) {
      return dashboardData.kpiCards.map((card) => ({ ...card, icon: KPI_ICONS[card.iconKey] }));
    }
    return kpiCards;
  }, [dashboardData?.kpiCards, kpiCards]);

  const complianceStatusToShow = dashboardData?.complianceStatus ?? complianceStatus;
  const systemStatusToShow = dashboardData?.systemStatus ?? systemStatus;

  // Action Items (use API pending counts when available)
  const actionItems = useMemo(() => {
    const items = [];
    const rawPendingGhs = dashboardData?.pendingReviews?.raw_ghs ?? kpiStats.ghsPending;
    const rawPendingDg = dashboardData?.pendingReviews?.raw_dg ?? kpiStats.dgPending;
    const totalPending = rawPendingGhs + rawPendingDg;
    const extPending = dashboardData?.pendingReviews?.extenders_dg ?? extenderRecords.filter(r => r.status === 'Pending Review').length;
    if (totalPending > 0) {
      items.push({
        id: 1,
        title: `${totalPending} raw materials pending review (GHS: ${rawPendingGhs}, DG: ${rawPendingDg})`,
        priority: 'high',
        action: () => history.push('/raw-materials?status=Pending Review')
      });
    }
    
    if (extPending > 0) {
      items.push({
        id: 2,
        title: `${extPending} extenders/subphases pending review`,
        priority: 'high',
        action: () => history.push('/extenders-dg?status=Pending Review')
      });
    }
    
    // if (highPriorityMaterials.length > 0) {
    //   items.push({
    //     id: 3,
    //     title: `${highPriorityMaterials.length} high priority materials`,
    //     priority: 'medium',
    //     action: () => history.push('/raw-materials')
    //   });
    // }
    // if (kpiStats.rejected > 0) {
    //   items.push({
    //     id: 3,
    //     title: `${kpiStats.rejected} rejected classifications need attention`,
    //     priority: 'medium',
    //     action: () => navigate('/raw-materials?status=Rejected')
    //   });
    // }
    return items;
  }, [dashboardData?.pendingReviews, kpiStats, highPriorityMaterials, history, extenderRecords]);

  // Alerts & Notifications
//   const alerts = useMemo(() => {
//     const alertList = [];
    
//     if (kpiStats.pending > 10) {
//       alertList.push({
//         id: 1,
//         type: 'warning',
//         message: `${kpiStats.pending} materials are awaiting review`,
//         icon: '⚠️'
//       });
//     }
    
//     if (complianceStatus.complianceRate < 75) {
//       alertList.push({
//         id: 2,
//         type: 'error',
//         message: `Compliance rate is below 75% (${complianceStatus.complianceRate}%)`,
//         icon: '🚨'
//       });
//     }
    
//     const highRiskCount = sdsRecords.filter(r => 
//       r.ghsPictograms.includes('GHS06') || r.ghsPictograms.includes('GHS08')
//     ).length;
    
//     if (highRiskCount > 0) {
//       alertList.push({
//         id: 3,
//         type: 'info',
//         message: `${highRiskCount} materials have high-risk hazards (Toxicity/Health)`,
//         icon: 'ℹ️'
//       });
//     }
    
//     return alertList;
//   }, [kpiStats, complianceStatus, sdsRecords]);


  return (
    <div style={{ marginBottom: 24 }}>
      {dashboardError && (
        <div className="mb-4 p-3 rounded bg-red-50 text-red-800 text-sm">
          Failed to load dashboard overview. Showing local data.
        </div>
      )}
      {isDashboardLoading && !dashboardData && (
        <div className="mb-4 p-3 rounded bg-gray-100 text-gray-600 text-sm flex items-center gap-2">
          <Spin size="small" /> Loading dashboard overview...
        </div>
      )}
      <Row gutter={[24, 24]}>
        {kpiCardsToShow.map((stat) => (
          <Col xs={24} sm={12} lg={6} key={stat.title}>
            <Card>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div style={{ flex: 1, color: '#222' }}>
                  <Text type="secondary" style={{ display: 'block', marginBottom: 8, fontWeight: 'bold', color: '#222', textAlign: 'left' }}>{stat.title}</Text>
                  <Row gutter={16} style={{ display: 'flex', flexWrap: 'nowrap', alignItems: 'center', color: '#000' }}>
                    <Col style={{ flex: '0 0 auto' }}>
                      <Text strong style={{ fontSize: 26, fontWeight: 'bold' }}>{stat.ghsValue}</Text>
                      <span style={{ display: 'block' }}><Text type="secondary" style={{ fontSize: 12, fontWeight: 'bold' }}>RAW - GHS</Text></span>
                    </Col>
                    <Col style={{ flex: '0 0 auto' }}>
                      <Text strong style={{ fontSize: 26, fontWeight: 'bold' }}>{stat.dgValue}</Text>
                      <span style={{ display: 'block' }}><Text type="secondary" style={{ fontSize: 12, fontWeight: 'bold' }}>RAW - DG</Text></span>
                    </Col>
                    <Col style={{ flex: '0 0 auto' }}>
                      <Text strong style={{ fontSize: 26, fontWeight: 'bold' }}>{stat.extValue}</Text>
                      <span style={{ display: 'block' }}><Text type="secondary" style={{ fontSize: 12, fontWeight: 'bold' }}>Extenders - DG</Text></span>
                    </Col>
                  </Row>
                </div>
                <div>{stat.icon}</div>
              </div>
            </Card>
          </Col>
        ))}
      </Row>

      <div className="quick-actions">
        <h3 className="quick-actions__title">Quick Actions</h3>
        <div className="quick-actions__row">
          <button type="button" className="quick-actions__card" onClick={() => history.push('/raw-materials?status=Pending Review')}>
            <svg className="quick-actions__icon quick-actions__icon--blue" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <span className="quick-actions__label">Review Pending Raw Materials</span>
          </button>
          <button type="button" className="quick-actions__card" onClick={() => history.push('/extenders-dg?status=Pending Review')}>
            <svg className="quick-actions__icon quick-actions__icon--purple" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <span className="quick-actions__label">Review Pending Extenders</span>
          </button>
          <button type="button" className="quick-actions__card" onClick={() => history.push('/raw-materials?create=true')}>
            <svg className="quick-actions__icon quick-actions__icon--green" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            <span className="quick-actions__label">Manual Raw Material</span>
          </button>
          <button type="button" className="quick-actions__card" onClick={() => history.push('/extenders-dg?create=true')}>
            <svg className="quick-actions__icon quick-actions__icon--green" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            <span className="quick-actions__label">Manual Extender/Sub-Phase</span>
          </button>
          <button type="button" className="quick-actions__card" onClick={() => history.push('/analytics')}>
            <svg className="quick-actions__icon quick-actions__icon--purple" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            <span className="quick-actions__label">View Analytics</span>
          </button>
        </div>
      </div>
      <Tooltip id="export-tooltip" place="top" offset={10} delayShow={200} delayHide={0} />

      {/* Alerts & Notifications */}
      {/* {alerts.length > 0 && (
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg text-left font-semibold text-gray-900 mb-4">Alerts & Notifications</h3>
          <div className="space-y-3">
            {alerts.map((alert) => (
              <div
                key={alert.id}
                className={`p-4 rounded-lg border-l-4 ${
                  alert.type === 'error' ? 'bg-red-50 border-red-500' :
                  alert.type === 'warning' ? 'bg-yellow-50 border-yellow-500' :
                  'bg-blue-50 border-blue-500'
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{alert.icon}</span>
                  <p className="text-sm font-medium text-gray-900">{alert.message}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )} */}

      {/* Compliance Status & System Status */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Compliance Status */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Compliance Status</h3>
          <div className="space-y-4">
            {/* Compliance percentages side by side */}
            <div className="flex items-center justify-center gap-8">
              <div className="text-center">
                <div className="text-4xl font-bold text-gray-900 mb-2">{complianceStatusToShow.rawMaterials.ghs.complianceRate}%</div>
                <div className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${complianceStatusToShow.rawMaterials.ghs.bgColor} ${complianceStatusToShow.rawMaterials.ghs.statusColor}`}>
                  Raw Materials - GHS
                </div>
              </div>
              <div className="text-center">
                <div className="text-4xl font-bold text-gray-900 mb-2">{complianceStatusToShow.rawMaterials.dg.complianceRate}%</div>
                <div className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${complianceStatusToShow.rawMaterials.dg.bgColor} ${complianceStatusToShow.rawMaterials.dg.statusColor}`}>
                  Raw Materials - DG
                </div>
              </div>
              <div className="text-center">
                <div className="text-4xl font-bold text-gray-900 mb-2">{complianceStatusToShow.extenders.complianceRate}%</div>
                <div className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${complianceStatusToShow.extenders.bgColor} ${complianceStatusToShow.extenders.statusColor}`}>
                  Extenders - DG
                </div>
              </div>
            </div>
            <div className="pt-4 border-t border-gray-200 space-y-4">
              <div className="compliance-progress">
                <div className="compliance-progress__header">
                  <span className="compliance-progress__label">Approved Raw Materials - GHS</span>
                  <span className="compliance-progress__count">{complianceStatusToShow.rawMaterials.ghs.approved} / {complianceStatusToShow.rawMaterials.ghs.total}</span>
                </div>
                <div className="compliance-progress__track">
                  <div
                    className="compliance-progress__fill compliance-progress__fill--blue"
                    style={{ width: `${complianceStatusToShow.rawMaterials.ghs.complianceRate}%` }}
                  />
                </div>
              </div>
              <div className="compliance-progress">
                <div className="compliance-progress__header">
                  <span className="compliance-progress__label">Approved Raw Materials - DG</span>
                  <span className="compliance-progress__count">{complianceStatusToShow.rawMaterials.dg.approved} / {complianceStatusToShow.rawMaterials.dg.total}</span>
                </div>
                <div className="compliance-progress__track">
                  <div
                    className="compliance-progress__fill compliance-progress__fill--green"
                    style={{ width: `${complianceStatusToShow.rawMaterials.dg.complianceRate}%` }}
                  />
                </div>
              </div>
              <div className="compliance-progress">
                <div className="compliance-progress__header">
                  <span className="compliance-progress__label">Approved Extenders - DG</span>
                  <span className="compliance-progress__count">{complianceStatusToShow.extenders.approved} / {complianceStatusToShow.extenders.total}</span>
                </div>
                <div className="compliance-progress__track">
                  <div
                    className="compliance-progress__fill compliance-progress__fill--purple"
                    style={{ width: `${complianceStatusToShow.extenders.complianceRate}%` }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* System Status */}
        <div className="system-status">
          <h3 className="system-status__title">System Status</h3>
          <div className="system-status__list">
            <div className="system-status__row">
              <span className="system-status__label">Overall Average Review Time</span>
              <div className="system-status__value-wrap">
                <span className="system-status__value">
                  {systemStatusToShow.averageReviewTime}
                </span>
                <svg
                  className="system-status__icon"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  data-tooltip-id="avg-review-time-tooltip"
                  data-tooltip-content="Average time taken from material upload to approval or rejection. Calculated from all reviewed materials."
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <Tooltip
                  id="avg-review-time-tooltip"
                  place="left"
                  offset={10}
                  delayShow={200}
                  delayHide={0}
                />
              </div>
            </div>
            <div className="system-status__row">
              <span className="system-status__label">Recent Activity (7 days)</span>
              <div className="system-status__value-wrap">
                <span className="system-status__value">
                  {systemStatusToShow.recentRawMaterials} Raw Materials, {systemStatusToShow.recentExtenders} Extenders/Sub-Phases
                </span>
                <svg
                  className="system-status__icon"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  data-tooltip-id="recent-activity-tooltip"
                  data-tooltip-content="Number of materials and extenders uploaded or classified within the last 7 days."
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <Tooltip
                  id="recent-activity-tooltip"
                  place="left"
                  offset={10}
                  delayShow={200}
                  delayHide={0}
                />
              </div>
            </div>
            <div className="system-status__row">
              <span className="system-status__label">Last Update</span>
              <div className="system-status__value-wrap">
                <span className="system-status__value">{systemStatusToShow.lastUpdate}</span>
                <svg
                  className="system-status__icon"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  data-tooltip-id="last-update-tooltip"
                  data-tooltip-content="Time since the most recent material was uploaded or classified in the system."
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <Tooltip
                  id="last-update-tooltip"
                  place="left"
                  offset={10}
                  delayShow={200}
                  delayHide={0}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {actionItems.length > 0 && (
        <Card className='dashboardActionItems' title="Action Items" style={{ marginTop: 24 }}>
          {actionItems.map((item) => (
            <Button
              key={item.id}
              type="default"
              block
              style={{ textAlign: 'left', height: 'auto', padding: '12px 16px', marginBottom: 8 }}
              onClick={item.action}
              className="bg-gray-50"
            >
              <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                <span>
                  <span style={{ width: 8, height: 8, borderRadius: '50%', background: item.priority === 'high' ? '#f5222d' : '#faad14', display: 'inline-block', marginRight: 12 }} />
                  {item.title}
                </span>
                <span>
                <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path></svg>
                </span>
              </span>
            </Button>
          ))}
        </Card>
      )}

      <div className="dashboard-recent-equal-height">
      <Row gutter={[24, 24]} style={{ marginTop: 24 }}>
        <Col xs={24} md={12}>
          <Card
            title="Recent Pulled Raw Materials (5)"
            extra={<Button type="link" size="small" onClick={() => history.push('/raw-materials')}>View all</Button>}
          >
          
          <div className="space-y-3">
            {recentClassifications.map((record) => {
              const timeAgo = getTimeAgo(record.uploadedDate);
              const visiblePictograms = record.ghsPictograms.slice(0, 3);
              const remainingCount = record.ghsPictograms.length - 3;
              
              return (
                <div key={record.id} className="bg-gray-50 rounded-lg p-4 flex items-center justify-between mt-10">
                  <div className="flex items-center gap-3 flex-1">
                    {/* Document Icon */}
                    <div className="w-10 h-10 rounded flex items-center justify-center flex-shrink-0">
                      <svg width="24" height="24" className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </div>
                    
                    {/* Material Info */}
                    <div className="flex-1 min-w-0">
                      <h4 className="font-semibold text-left text-gray-900 text-sm">{record.materialName}</h4>
                      <p className="text-xs text-left text-gray-600 mt-0.5">
                        {/* {unNumber} */}
                         {timeAgo}
                      </p>
                    </div>
                  </div>
                  
                  {/* GHS Pictograms and Status */}
                  <div className="flex items-center gap-2 ml-4">
                    {/* GHS Pictograms */}
                    <div className="flex items-center gap-1">
                      {visiblePictograms.map((ghsCode) => {
                        const ghsData = GHS_PICTOGRAMS[ghsCode];
                        if (!ghsData) return null;
                        
                        return (
                          <div
                            key={ghsCode}
                            className={`w-6 h-6  rounded flex items-center justify-center text-white text-s`}
                            title={ghsData.name}
                          >
                            {ghsData.icon}
                          </div>
                        );
                      })}
                      {remainingCount > 0 && (
                        <div className="w-6 h-6  rounded flex items-center justify-center text-gray-700 text-s font-medium">
                          +{remainingCount}
                        </div>
                      )}
                    </div>
                    
                    {/* Status Badges - GHS and DG */}
                    <div className="flex flex-col gap-1">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        (record.GHSStatus || record.status || 'Pending Review') === 'Pending Review' 
                          ? 'bg-yellow-100 text-yellow-800' 
                          : (record.GHSStatus || record.status || 'Pending Review') === 'Approved'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                      }`}>
                         {record.GHSStatus || record.status || 'Pending Review'} - GHS
                      </span>
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        (record.DGStatus || record.status || 'Pending Review') === 'Pending Review' 
                          ? 'bg-yellow-100 text-yellow-800' 
                          : (record.DGStatus || record.status || 'Pending Review') === 'Approved'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {record.DGStatus || record.status || 'Pending Review'} - DG
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          </Card>
        </Col>

        <Col xs={24} md={12}>
          <Card
            title="Recent Pulled Extenders (5)"
            extra={<Button type="link" size="small" onClick={() => history.push('/extenders-dg')}>View all</Button>}
          >
          <div className="space-y-3">
            {recentExtenders.map((record) => {
              const timeAgo = getTimeAgo(record.uploadedDate);
              const visiblePictograms = record.ghsPictograms.slice(0, 3);
              const remainingCount = record.ghsPictograms.length - 3;
              
              return (
                <div key={record.id} className="bg-gray-50 rounded-lg p-4 flex items-center justify-between mt-10">
                  <div className="flex items-center gap-3 flex-1">
                    {/* Document Icon */}
                    <div className="w-10 h-10 bg-purple-100 rounded flex items-center justify-center flex-shrink-0">
                      <svg width="24" height="24" className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </div>
                    
                    {/* Material Info */}
                    <div className="flex-1 min-w-0">
                      <h4 className="font-semibold text-left text-gray-900 text-sm">{record.materialName}</h4>
                      <p className="text-xs text-left text-gray-600 mt-0.5">
                        {timeAgo}
                      </p>
                    </div>
                  </div>
                  
                  {/* GHS Pictograms and Status */}
                  <div className="flex items-center gap-2 ml-4">
                    {/* GHS Pictograms */}
                    <div className="flex items-center gap-1">
                      {visiblePictograms.map((ghsCode) => {
                        const ghsData = GHS_PICTOGRAMS[ghsCode];
                        if (!ghsData) return null;
                        
                        return (
                          <div
                            key={ghsCode}
                            className={`w-6 h-6  rounded flex items-center justify-center text-white text-s`}
                            title={ghsData.name}
                          >
                            {ghsData.icon}
                          </div>
                        );
                      })}
                      {remainingCount > 0 && (
                        <div className="w-6 h-6  rounded flex items-center justify-center text-gray-700 text-s font-medium">
                          +{remainingCount}
                        </div>
                      )}
                    </div>
                    
                    {/* Status Badge */}
                    <button className={`px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1 ${
                      record.status === 'Pending Review' 
                        ? 'bg-yellow-100 text-yellow-800' 
                        : record.status === 'Approved'
                        ? 'bg-green-100 text-green-800'
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {record.status === 'Pending Review' && (
                        <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      )}
                      {record.status === 'Approved' && (
                        <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                      {record.status === 'Rejected' && (
                        <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      )}
                      {record.status} - DG
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
          </Card>
        </Col>
      </Row>
      </div>

      {/* High Priority Materials */}
        {/* <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">High Priority Materials</h3>
            <button
              onClick={() => history.push('/raw-materials')}
              className="text-sm text-gray-700 hover:text-gray-900 flex items-center gap-1"
            >
              View all
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
          <div className="space-y-3">
            {highPriorityMaterials.length > 0 ? (
              (() => {
                // Final deduplication by materialName + UN number before rendering
                const seenCombinations = new Set<string>();
                const uniqueMaterials = highPriorityMaterials.filter(record => {
                  const unNumber = getUNNumber(record.aiRecommendedDGCode);
                  const uniqueKey = `${record.materialName}-${unNumber}`.toLowerCase().trim();
                  
                  if (seenCombinations.has(uniqueKey)) {
                    return false; // Skip duplicate
                  }
                  seenCombinations.add(uniqueKey);
                  return true;
                });

                return uniqueMaterials.map((record) => {
                  const unNumber = getUNNumber(record.aiRecommendedDGCode);
                  const hazardCount = record.ghsPictograms.length;
                  return (
                    <div key={`${record.materialName}-${unNumber}`} className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-center justify-between">
                      <div className="flex-1 text-left">
                        <h4 className="font-medium text-sm text-gray-900">{record.materialName}</h4>
                        <p className="text-xs text-gray-600 mt-1">{unNumber} • {hazardCount} hazards</p>
                      </div>
                      <div className="flex items-center gap-1">
                        {record.ghsPictograms.slice(0, 2).map((ghsCode) => {
                          const ghsData = GHS_PICTOGRAMS[ghsCode];
                          if (!ghsData) return null;
                          return (
                            <div
                              key={ghsCode}
                              className="w-5 h-5 rounded flex items-center justify-center text-white text-xs"
                              title={ghsData.name}
                            >
                              {ghsData.icon}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                });
              })()
            ) : (
              <p className="text-sm text-gray-500 text-center py-4">No high priority materials</p>
            )}
          </div>
        </div> */}

      {/* GHS Pictogram Summary & Material Categories & Quick Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        

        {/* Material Categories */}
        {/* <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Material Categories</h3>
          <div className="space-y-3">
            {materialCategories.map((category) => (
              <div key={category.source} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                <span className="text-sm font-medium text-gray-900">{category.source}</span>
                <span className="text-sm font-bold text-gray-700">{category.count}</span>
              </div>
            ))}
          </div>
        </div> */}

        {/* Quick Stats */}
        {/* <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Stats</h3>
          <div className="space-y-4">
            <div className="p-3 bg-blue-50 rounded-lg">
              <p className="text-xs text-gray-600 mb-1">Total Hazards Identified</p>
              <p className="text-2xl font-bold text-blue-600">{quickStats.totalHazards}</p>
              <p className="text-xs text-gray-500 mt-1">across all materials</p>
            </div>
            <div className="p-3 bg-orange-50 rounded-lg">
              <p className="text-xs text-gray-600 mb-1">Multiple Hazards</p>
              <p className="text-2xl font-bold text-orange-600">{quickStats.materialsWithMultipleHazards}</p>
              <p className="text-xs text-gray-500 mt-1">materials with 3+ hazards</p>
            </div>
            <div className="p-3 bg-green-50 rounded-lg">
              <p className="text-xs text-gray-600 mb-1">Classification Rate</p>
              <p className="text-2xl font-bold text-green-600">
                {kpiStats.total > 0 ? Math.round((kpiStats.approved / kpiStats.total) * 100) : 0}%
              </p>
            </div>
          </div>
        </div> */}
      </div>
    </div>
  );
};

export default Dashboard;
