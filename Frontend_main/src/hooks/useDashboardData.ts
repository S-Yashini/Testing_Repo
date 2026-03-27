/**
 * Dashboard overview API hook
 * GET /api/v1/dashboard/overview?recent_activity_days={number}
 */

import { useQuery } from '@tanstack/react-query';

// const DASHBOARD_API_BASE = (
//   (import.meta.env.VITE_RAW_MATERIALS_API_URL as string) || 'http://localhost:8000/api/v1/materials/'
// )
//   .replace(/\/*$/, '')
//   .replace(/\/materials\/?$/, '');
//  const DASHBOARD_API_BASE = (
//    (import.meta.env.VITE_BACKEND_API_URL as string) || 'http://localhost:8000/api/v1/materials/');
 

const BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';


export type DashboardOverviewResponse = {
  total_classifications: { raw_ghs: number; raw_dg: number; extenders_dg: number };
  pending_reviews: { raw_ghs: number; raw_dg: number; extenders_dg: number };
  approved: { raw_ghs: number; raw_dg: number; extenders_dg: number };
  rejected: { raw_ghs: number; raw_dg: number; extenders_dg: number };
  compliance_status: {
    raw_materials_ghs: { approved: number; total: number; percentage: number };
    raw_materials_dg: { approved: number; total: number; percentage: number };
    extenders_dg: { approved: number; total: number; percentage: number };
  };
  system_status: {
    overall_avg_review_time_days: number;
    recent_raw_materials: number;
    recent_extenders: number;
    recent_activity_days: number;
    last_update_days_ago: number;
  };
};

async function fetchDashboardOverview(
  recentActivityDays: number
): Promise<DashboardOverviewResponse> {
  //const url = `${DASHBOARD_API_BASE}/dashboard/overview?recent_activity_days=${recentActivityDays}`;
  const url = `${BASE_URL}/v1/dashboard/overview?recent_activity_days=${recentActivityDays}`;

  const response = await fetch(url);
  const contentType = response.headers.get('content-type') || '';
  const isJson = contentType.includes('application/json');

  if (!response.ok) {
    let errorMessage = `Dashboard overview failed: ${response.status} ${response.statusText}`;
    if (isJson) {
      try {
        const err = await response.json();
        errorMessage = err.message || err.detail || errorMessage;
      } catch {
        // ignore
      }
    }
    throw new Error(errorMessage);
  }

  if (!isJson) {
    const text = await response.text();
    throw new Error(`Expected JSON from dashboard overview. ${text.substring(0, 100)}`);
  }

  return response.json() as Promise<DashboardOverviewResponse>;
}

function getComplianceStyle(percentage: number): { status: string; statusColor: string; bgColor: string } {
  if (percentage < 50) {
    return { status: 'Critical', statusColor: 'text-red-600', bgColor: 'bg-red-100' };
  }
  if (percentage < 75) {
    return { status: 'Warning', statusColor: 'text-yellow-600', bgColor: 'bg-yellow-100' };
  }
  return { status: 'Good', statusColor: 'text-green-600', bgColor: 'bg-green-100' };
}

export type DashboardKpiCard = {
  title: string;
  ghsValue: string;
  dgValue: string;
  extValue: string;
  iconKey: 'total' | 'pending' | 'approved' | 'rejected';
};

export type DashboardComplianceStatus = {
  rawMaterials: {
    ghs: {
      complianceRate: number;
      status: string;
      statusColor: string;
      bgColor: string;
      approved: number;
      total: number;
    };
    dg: {
      complianceRate: number;
      status: string;
      statusColor: string;
      bgColor: string;
      approved: number;
      total: number;
    };
  };
  extenders: {
    complianceRate: number;
    status: string;
    statusColor: string;
    bgColor: string;
    approved: number;
    total: number;
  };
};

export type DashboardSystemStatus = {
  averageReviewTime: string;
  recentRawMaterials: number;
  recentExtenders: number;
  lastUpdate: string;
};

export type DashboardData = {
  kpiCards: DashboardKpiCard[];
  complianceStatus: DashboardComplianceStatus;
  systemStatus: DashboardSystemStatus;
  pendingReviews: { raw_ghs: number; raw_dg: number; extenders_dg: number };
};

function formatLastUpdate(daysAgo: number): string {
  if (daysAgo === 0) return 'Today';
  if (daysAgo === 1) return '1 day ago';
  return `${daysAgo} days ago`;
}

function mapOverviewToDashboardData(data: DashboardOverviewResponse): DashboardData {
  const { total_classifications, pending_reviews, approved, rejected, compliance_status, system_status } = data;

  const ghs = compliance_status.raw_materials_ghs;
  const dg = compliance_status.raw_materials_dg;
  const ext = compliance_status.extenders_dg;

  const kpiCards: DashboardKpiCard[] = [
    {
      title: 'Total Classifications',
      ghsValue: total_classifications.raw_ghs.toLocaleString(),
      dgValue: total_classifications.raw_dg.toLocaleString(),
      extValue: total_classifications.extenders_dg.toLocaleString(),
      iconKey: 'total',
    },
    {
      title: 'Pending Reviews',
      ghsValue: pending_reviews.raw_ghs.toLocaleString(),
      dgValue: pending_reviews.raw_dg.toLocaleString(),
      extValue: pending_reviews.extenders_dg.toLocaleString(),
      iconKey: 'pending',
    },
    {
      title: 'Approved',
      ghsValue: approved.raw_ghs.toLocaleString(),
      dgValue: approved.raw_dg.toLocaleString(),
      extValue: approved.extenders_dg.toLocaleString(),
      iconKey: 'approved',
    },
    {
      title: 'Rejected',
      ghsValue: rejected.raw_ghs.toLocaleString(),
      dgValue: rejected.raw_dg.toLocaleString(),
      extValue: rejected.extenders_dg.toLocaleString(),
      iconKey: 'rejected',
    },
  ];

  const rawGhsStyle = getComplianceStyle(ghs.percentage);
  const rawDgStyle = getComplianceStyle(dg.percentage);
  const extStyle = getComplianceStyle(ext.percentage);

  const complianceStatus: DashboardComplianceStatus = {
    rawMaterials: {
      ghs: {
        complianceRate: ghs.percentage,
        status: rawGhsStyle.status,
        statusColor: rawGhsStyle.statusColor,
        bgColor: rawGhsStyle.bgColor,
        approved: ghs.approved,
        total: ghs.total,
      },
      dg: {
        complianceRate: dg.percentage,
        status: rawDgStyle.status,
        statusColor: rawDgStyle.statusColor,
        bgColor: rawDgStyle.bgColor,
        approved: dg.approved,
        total: dg.total,
      },
    },
    extenders: {
      complianceRate: ext.percentage,
      status: extStyle.status,
      statusColor: extStyle.statusColor,
      bgColor: extStyle.bgColor,
      approved: ext.approved,
      total: ext.total,
    },
  };

  const systemStatus: DashboardSystemStatus = {
    averageReviewTime:
      system_status.overall_avg_review_time_days != null
        ? `${system_status.overall_avg_review_time_days} days`
        : 'N/A',
    recentRawMaterials: system_status.recent_raw_materials,
    recentExtenders: system_status.recent_extenders,
    lastUpdate: formatLastUpdate(system_status.last_update_days_ago),
  };

  return {
    kpiCards,
    complianceStatus,
    systemStatus,
    pendingReviews: pending_reviews,
  };
}

export const dashboardDataKeys = {
  all: ['dashboard'] as const,
  overview: (days: number) => [...dashboardDataKeys.all, 'overview', days] as const,
};

export type UseDashboardDataParams = {
  recentActivityDays?: number;
};

export function useDashboardData(params?: UseDashboardDataParams) {
  const recentActivityDays = params?.recentActivityDays ?? 7;

  const query = useQuery({
    queryKey: dashboardDataKeys.overview(recentActivityDays),
    queryFn: () => fetchDashboardOverview(recentActivityDays),
    staleTime: 60 * 1000, // 1 minute
  });

  return {
    data: query.data,
    dashboardData: query.data ? mapOverviewToDashboardData(query.data) : null,
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    error: query.error,
    refetch: query.refetch,
  };
}
