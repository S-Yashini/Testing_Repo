import { useState, useEffect, useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import sdsRecordsData from '../../data/sdsRecords.json';
import extenderRecordsData from '../../data/extenderRecords.json';
import { GHS_PICTOGRAMS } from '../../components/GHSInfo/GHSInfo';

// DG Definitions - matching Header.tsx
interface DGDefinition {
  class: string;
  name: string;
  description: string;
  hazardCharacteristics: string[];
  examples: string[];
  packingGroup?: string;
  labelColor: string;
}

const DG_DEFINITIONS: DGDefinition[] = [
  { class: 'Class 1', name: 'Explosives', description: '', hazardCharacteristics: [], examples: [], packingGroup: '', labelColor: '' },
  { class: 'Class 2', name: 'Gases', description: '', hazardCharacteristics: [], examples: [], packingGroup: '', labelColor: '' },
  { class: 'Class 3', name: 'Flammable Liquids', description: '', hazardCharacteristics: [], examples: [], packingGroup: '', labelColor: '' },
  { class: 'Class 4', name: 'Flammable Solids', description: '', hazardCharacteristics: [], examples: [], packingGroup: '', labelColor: '' },
  { class: 'Class 5', name: 'Oxidizing Substances', description: '', hazardCharacteristics: [], examples: [], packingGroup: '', labelColor: '' },
  { class: 'Class 6', name: 'Toxic and Infectious Substances', description: '', hazardCharacteristics: [], examples: [], packingGroup: '', labelColor: '' },
  { class: 'Class 7', name: 'Radioactive Materials', description: '', hazardCharacteristics: [], examples: [], packingGroup: '', labelColor: '' },
  { class: 'Class 8', name: 'Corrosive Substances', description: '', hazardCharacteristics: [], examples: [], packingGroup: '', labelColor: '' },
  { class: 'Class 9', name: 'Miscellaneous Dangerous Goods', description: '', hazardCharacteristics: [], examples: [], packingGroup: '', labelColor: '' },
];

// Helper function to get DG class name from class number
const getDGClassName = (classStr: string): string => {
  const dgDef = DG_DEFINITIONS.find(def => def.class === classStr);
  return dgDef ? dgDef.name : classStr;
};

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
  sections: {
    section9: {
      flashPoint: string;
    };
  };
}

const Analytics = () => {
  const [sdsRecords, setSdsRecords] = useState<SDSRecord[]>([]);
  const [extenderRecords, setExtenderRecords] = useState<SDSRecord[]>([]);
  const [isGhsChecked, setIsGhsChecked] = useState<boolean>(true);
  const [isDgChecked, setIsDgChecked] = useState<boolean>(true);

  useEffect(() => {
    // Load from localStorage if available, otherwise use JSON file
    const savedRecords = localStorage.getItem('sdsRecords');
    let records: any[] = [];
    
    if (savedRecords) {
      try {
        records = JSON.parse(savedRecords);
      } catch (error) {
        console.error('Error loading from localStorage:', error);
        records = sdsRecordsData as any[];
      }
    } else {
      records = sdsRecordsData as any[];
    }
    
    // Map JSON fields - they're already in the correct format
    setSdsRecords(records as SDSRecord[]);
  }, []);

  useEffect(() => {
    // Load extenders from localStorage if available, otherwise use JSON file
    const savedExtenders = localStorage.getItem('extenderRecords');
    if (savedExtenders) {
      try {
        setExtenderRecords(JSON.parse(savedExtenders));
      } catch (error) {
        console.error('Error loading extender records from localStorage:', error);
        setExtenderRecords(extenderRecordsData as SDSRecord[]);
      }
    } else {
      setExtenderRecords(extenderRecordsData as SDSRecord[]);
    }
  }, []);

  // Calculate KPI stats for cards (GHS, DG, Extenders)
  const kpiCards = useMemo(() => {
    const getGhsStatus = (record: SDSRecord) => record.GHSStatus || record.status || 'Pending Review';
    const getDgStatus = (record: SDSRecord) => record.DGStatus || record.status || 'Pending Review';

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

  // Calculate KPI stats (for backward compatibility with existing code)
  const kpiStats = useMemo(() => {
    const total = sdsRecords.length;
    const pending = sdsRecords.filter(record => record.status === 'Pending Review').length;
    const approved = sdsRecords.filter(record => record.status === 'Approved').length;
    const rejected = sdsRecords.filter(record => record.status === 'Rejected').length;

    return { total, pending, approved, rejected };
  }, [sdsRecords]);

  // Prepare data for bar chart (past 6 months with approvals and rejections)
  const barChartData = useMemo(() => {
    // Calculate the past 6 months from current date
    const now = new Date();
    const past6Months: string[] = [];
    const monthMap = new Map<string, { 
      ghsApproved: number; 
      ghsRejected: number; 
      dgApproved: number; 
      dgRejected: number; 
      monthName: string 
    }>();
    
    // Generate month keys for the past 6 months
    for (let i = 5; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      const monthName = date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
      past6Months.push(monthKey);
      monthMap.set(monthKey, { ghsApproved: 0, ghsRejected: 0, dgApproved: 0, dgRejected: 0, monthName });
    }
    
    // Process records and count based on approval/rejection date, not upload date
    sdsRecords.forEach(record => {
      // GHS status
      if (isGhsChecked) {
        const ghsStatus = record.GHSStatus || record.status || 'Pending Review';
        const ghsDate = (record as any)['GHS Approval/Rejection Date'];
        if (ghsStatus === 'Approved' && ghsDate) {
          // Use GHS Approval/Rejection Date to determine which month to count this approval
          const approvedDate = new Date(ghsDate);
          const monthKey = `${approvedDate.getFullYear()}-${String(approvedDate.getMonth() + 1).padStart(2, '0')}`;
          
          // Only count if this month is in the past 6 months
          if (past6Months.includes(monthKey)) {
            const monthData = monthMap.get(monthKey);
            if (monthData) {
              monthData.ghsApproved++;
            }
          }
        } else if (ghsStatus === 'Rejected' && ghsDate) {
          // Use GHS Approval/Rejection Date to determine which month to count this rejection
          const rejectedDate = new Date(ghsDate);
          const monthKey = `${rejectedDate.getFullYear()}-${String(rejectedDate.getMonth() + 1).padStart(2, '0')}`;
          
          // Only count if this month is in the past 6 months
          if (past6Months.includes(monthKey)) {
            const monthData = monthMap.get(monthKey);
            if (monthData) {
              monthData.ghsRejected++;
            }
          }
        }
      }
      
      // DG status
      if (isDgChecked) {
        const dgStatus = record.DGStatus || record.status || 'Pending Review';
        const dgDate = (record as any)['DG Approval/Rejection Date'];
        if (dgStatus === 'Approved' && dgDate) {
          // Use DG Approval/Rejection Date to determine which month to count this approval
          const approvedDate = new Date(dgDate);
          const monthKey = `${approvedDate.getFullYear()}-${String(approvedDate.getMonth() + 1).padStart(2, '0')}`;
          
          // Only count if this month is in the past 6 months
          if (past6Months.includes(monthKey)) {
            const monthData = monthMap.get(monthKey);
            if (monthData) {
              monthData.dgApproved++;
            }
          }
        } else if (dgStatus === 'Rejected' && dgDate) {
          // Use DG Approval/Rejection Date to determine which month to count this rejection
          const rejectedDate = new Date(dgDate);
          const monthKey = `${rejectedDate.getFullYear()}-${String(rejectedDate.getMonth() + 1).padStart(2, '0')}`;
          
          // Only count if this month is in the past 6 months
          if (past6Months.includes(monthKey)) {
            const monthData = monthMap.get(monthKey);
            if (monthData) {
              monthData.dgRejected++;
            }
          }
        }
      }
    });
    
    // Convert to array in the correct order (past 6 months)
    const months = past6Months
      .map((key) => {
        const data = monthMap.get(key)!;
        const result: any = {
          month: data.monthName,
          monthKey: key,
        };
        
        if (isGhsChecked) {
          result['Approved - GHS'] = data.ghsApproved;
          result['Rejected - GHS'] = data.ghsRejected;
        }
        
        if (isDgChecked) {
          result['Approved - DG'] = data.dgApproved;
          result['Rejected - DG'] = data.dgRejected;
        }
        
        return result;
      });
    
    return months;
  }, [sdsRecords, isGhsChecked, isDgChecked]);

  // Prepare data for extender bar chart (past 6 months with approvals and rejections - DG only)
  const extenderBarChartData = useMemo(() => {
    // Calculate the past 6 months from current date
    const now = new Date();
    const past6Months: string[] = [];
    const monthMap = new Map<string, { 
      dgApproved: number; 
      dgRejected: number; 
      monthName: string 
    }>();
    
    // Generate month keys for the past 6 months
    for (let i = 5; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      const monthName = date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
      past6Months.push(monthKey);
      monthMap.set(monthKey, { dgApproved: 0, dgRejected: 0, monthName });
    }
    
    // Process records and count based on approval/rejection date from JSON
    extenderRecords.forEach(record => {
      const jsonRecord = record as any;
      // Get the date from "Approve/Reject Date" field in JSON (extenders use this field)
      const approveRejectDate = jsonRecord['Approve/Reject Date'];
      
      // DG status (extenders only have DG, no GHS)
      const dgStatus = record.DGStatus || record.status || 'Pending Review';
      
      if (dgStatus === 'Approved' && approveRejectDate && approveRejectDate.trim() !== '') {
        // Use Approve/Reject Date to determine which month to count this approval
        const approvedDate = new Date(approveRejectDate);
        const monthKey = `${approvedDate.getFullYear()}-${String(approvedDate.getMonth() + 1).padStart(2, '0')}`;
        
        // Only count if this month is in the past 6 months
        if (past6Months.includes(monthKey)) {
          const monthData = monthMap.get(monthKey);
          if (monthData) {
            monthData.dgApproved++;
          }
        }
      } else if (dgStatus === 'Rejected' && approveRejectDate && approveRejectDate.trim() !== '') {
        // Use Approve/Reject Date to determine which month to count this rejection
        const rejectedDate = new Date(approveRejectDate);
        const monthKey = `${rejectedDate.getFullYear()}-${String(rejectedDate.getMonth() + 1).padStart(2, '0')}`;
        
        // Only count if this month is in the past 6 months
        if (past6Months.includes(monthKey)) {
          const monthData = monthMap.get(monthKey);
          if (monthData) {
            monthData.dgRejected++;
          }
        }
      }
    });
    
    // Convert to array in the correct order (past 6 months)
    const months = past6Months
      .map((key) => {
        const data = monthMap.get(key)!;
        return {
          month: data.monthName,
          monthKey: key,
          'Approved - DG': data.dgApproved,
          'Rejected - DG': data.dgRejected,
        };
      });
    
    return months;
  }, [extenderRecords]);

  // Prepare data for donut chart
  const donutChartData = useMemo(() => {
    return [
      { name: 'Approved', value: kpiStats.approved, color: '#10b981' },
      { name: 'Rejected', value: kpiStats.rejected, color: '#ef4444' },
      { name: 'Pending Review', value: kpiStats.pending, color: '#f59e0b' },
    ];
  }, [kpiStats]);

  // Calculate Classification Accuracy for Raw Materials (GHS and DG) and Extenders
  const classificationAccuracy = useMemo(() => {
    // Raw Materials GHS accuracy
    const rawGHSTotalReviewed = sdsRecords.filter(r => {
      const ghsStatus = r.GHSStatus || r.status || 'Pending Review';
      return ghsStatus === 'Approved' || ghsStatus === 'Rejected' || ghsStatus === 'Pending Review';
    }).length;
    const rawGHSApproved = sdsRecords.filter(r => (r.GHSStatus || r.status) === 'Approved').length;
    const rawGHSAccuracy = rawGHSTotalReviewed > 0 ? Math.round((rawGHSApproved / rawGHSTotalReviewed) * 100) : 0;

    // Raw Materials DG accuracy
    const rawDGTotalReviewed = sdsRecords.filter(r => {
      const dgStatus = r.DGStatus || r.status || 'Pending Review';
      return dgStatus === 'Approved' || dgStatus === 'Rejected' || dgStatus === 'Pending Review';
    }).length;
    const rawDGApproved = sdsRecords.filter(r => (r.DGStatus || r.status) === 'Approved').length;
    const rawDGAccuracy = rawDGTotalReviewed > 0 ? Math.round((rawDGApproved / rawDGTotalReviewed) * 100) : 0;

    // Extenders accuracy (DG only)
    const extTotalReviewed = extenderRecords.filter(r => r.status === 'Approved' || r.status === 'Rejected' || r.status === 'Pending Review').length;
    const extApproved = extenderRecords.filter(r => r.status === 'Approved').length;
    const extAccuracy = extTotalReviewed > 0 ? Math.round((extApproved / extTotalReviewed) * 100) : 0;

    return {
      rawMaterialsGHS: {
        accuracy: rawGHSAccuracy,
        approved: rawGHSApproved,
        total: rawGHSTotalReviewed
      },
      rawMaterialsDG: {
        accuracy: rawDGAccuracy,
        approved: rawDGApproved,
        total: rawDGTotalReviewed
      },
      extenders: {
        accuracy: extAccuracy,
        approved: extApproved,
        total: extTotalReviewed
      }
    };
  }, [sdsRecords, extenderRecords]);

  // Prepare data for Flashpoint Distribution
  const flashpointDistribution = useMemo(() => {
    const ranges = [
      { range: '< 0°C', min: -Infinity, max: 0, count: 0 },
      { range: '0-23°C', min: 0, max: 23, count: 0 },
      { range: '23-60°C', min: 23, max: 60, count: 0 },
      { range: '60-93°C', min: 60, max: 93, count: 0 },
      { range: '> 93°C', min: 93, max: Infinity, count: 0 },
    ];

    sdsRecords.forEach(record => {
      if (record.sections && record.sections.section9 && record.sections.section9.flashPoint) {
        const flashPointStr = record.sections.section9.flashPoint;
        
        // Skip if "Not applicable" or similar
        if (flashPointStr.toLowerCase().includes('not applicable') || 
            flashPointStr.toLowerCase().includes('n/a')) {
          return;
        }

        let celsiusValue: number | null = null;

        // Try multiple patterns to extract Celsius value
        // Pattern 1: (number °C) - e.g., "246 °F (119 °C)"
        let match = flashPointStr.match(/\(([\d.]+)\s*°C\)/);
        if (match && match[1]) {
          celsiusValue = parseFloat(match[1]);
        } else {
          // Pattern 2: number°C (without parentheses) - e.g., "240°C (464°F)"
          match = flashPointStr.match(/([\d.]+)\s*°C/);
          if (match && match[1]) {
            celsiusValue = parseFloat(match[1]);
          } else {
            // Pattern 3: number °C (with space, no parentheses) - e.g., "9.7 °C (closed cup)"
            match = flashPointStr.match(/([\d.]+)\s*°C/);
            if (match && match[1]) {
              celsiusValue = parseFloat(match[1]);
            }
          }
        }

        // If we found a valid Celsius value, categorize it
        if (celsiusValue !== null && !isNaN(celsiusValue)) {
          // Handle edge cases for range boundaries
          for (const range of ranges) {
            if (range.min === -Infinity) {
              // For < 0°C range
              if (celsiusValue < range.max) {
                range.count++;
                break;
              }
            } else if (range.max === Infinity) {
              // For > 93°C range
              if (celsiusValue >= range.min) {
                range.count++;
                break;
              }
            } else {
              // For ranges with both min and max
              if (celsiusValue >= range.min && celsiusValue < range.max) {
                range.count++;
                break;
              }
            }
          }
        }
      }
    });

    // Return all ranges to show complete distribution
    return ranges;
  }, [sdsRecords]);

  // Prepare data for GHS Class Frequency
  const ghsFrequency = useMemo(() => {
    const ghsMap = new Map<string, number>();
    
    sdsRecords.forEach(record => {
      record.ghsPictograms.forEach(ghsCode => {
        ghsMap.set(ghsCode, (ghsMap.get(ghsCode) || 0) + 1);
      });
    });

    return Array.from(ghsMap.entries())
      .map(([code, count]) => {
        // Get the name from GHS_PICTOGRAMS, fallback to code if not found
        const ghsInfo = GHS_PICTOGRAMS[code];
        const name = ghsInfo ? ghsInfo.name : code;
        return { code, name, count };
      })
      .sort((a, b) => b.count - a.count);
  }, [sdsRecords]);

  // GHS Pictogram Summary (Top 5)
  const ghsPictogramSummary = useMemo(() => {
    const pictogramMap = new Map<string, number>();
    sdsRecords.forEach(record => {
      record.ghsPictograms.forEach(ghs => {
        pictogramMap.set(ghs, (pictogramMap.get(ghs) || 0) + 1);
      });
    });
    return Array.from(pictogramMap.entries())
      .map(([code, count]) => ({ code, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
  }, [sdsRecords]);

  // Prepare data for DG Class Frequency
  const dgClassFrequency = useMemo(() => {
    const classMap = new Map<string, number>();
    
    sdsRecords.forEach(record => {
      let dgClass = '';
      const dgCode = record.aiRecommendedDGCode || '';
      
      // Try to extract Class number (e.g., "Class 3", "Class 9")
      const classMatch = dgCode.match(/Class\s+([\d.]+)/);
      if (classMatch) {
        dgClass = `Class ${classMatch[1]}`;
      } else {
        // Handle other formats
        if (dgCode.toLowerCase().includes('not regulated') || 
            dgCode.toLowerCase().includes('not dangerous')) {
          dgClass = 'Not Regulated';
        } else if (dgCode.includes('NA1993') || 
                   dgCode.toLowerCase().includes('combustible liquid')) {
          dgClass = 'Combustible Liquid (NA1993)';
        } else if (dgCode.includes('UN') && dgCode.includes('Class')) {
          // Extract class from formats like "UN3082 - Class 9"
          const altMatch = dgCode.match(/Class\s+([\d.]+)/);
          if (altMatch) {
            dgClass = `Class ${altMatch[1]}`;
          } else {
            // If we have UN number but no class, use the UN number
            const unMatch = dgCode.match(/UN\d+/);
            dgClass = unMatch ? unMatch[0] : 'Other';
          }
        } else if (dgCode.trim() === '') {
          dgClass = 'Not Specified';
        } else {
          dgClass = 'Other';
        }
      }
      
      if (dgClass) {
        classMap.set(dgClass, (classMap.get(dgClass) || 0) + 1);
      }
    });
    
    return Array.from(classMap.entries())
      .map(([classStr, count]) => {
        // Get the name from DG_DEFINITIONS, fallback to classStr if not found
        const name = getDGClassName(classStr);
        return { class: classStr, name, count };
      })
      .sort((a, b) => b.count - a.count);
  }, [sdsRecords]);

  // Prepare data for Extenders DG Class Frequency
  const extenderDgClassFrequency = useMemo(() => {
    const classMap = new Map<string, number>();
    
    extenderRecords.forEach(record => {
      let dgClass = '';
      const dgCode = record.aiRecommendedDGCode || '';
      
      // Try to extract Class number (e.g., "Class 3", "Class 9")
      const classMatch = dgCode.match(/Class\s+([\d.]+)/);
      if (classMatch) {
        dgClass = `Class ${classMatch[1]}`;
      } else {
        // Handle other formats
        if (dgCode.toLowerCase().includes('not regulated') || 
            dgCode.toLowerCase().includes('not dangerous')) {
          dgClass = 'Not Regulated';
        } else if (dgCode.includes('NA1993') || 
                   dgCode.toLowerCase().includes('combustible liquid')) {
          dgClass = 'Combustible Liquid (NA1993)';
        } else if (dgCode.includes('UN') && dgCode.includes('Class')) {
          // Extract class from formats like "UN3082 - Class 9"
          const altMatch = dgCode.match(/Class\s+([\d.]+)/);
          if (altMatch) {
            dgClass = `Class ${altMatch[1]}`;
          } else {
            // If we have UN number but no class, use the UN number
            const unMatch = dgCode.match(/UN\d+/);
            dgClass = unMatch ? unMatch[0] : 'Other';
          }
        } else if (dgCode.trim() === '') {
          dgClass = 'Not Specified';
        } else {
          dgClass = 'Other';
        }
      }
      
      if (dgClass) {
        classMap.set(dgClass, (classMap.get(dgClass) || 0) + 1);
      }
    });
    
    return Array.from(classMap.entries())
      .map(([classStr, count]) => {
        // Get the name from DG_DEFINITIONS, fallback to classStr if not found
        const name = getDGClassName(classStr);
        return { class: classStr, name, count };
      })
      .sort((a, b) => b.count - a.count);
  }, [extenderRecords]);
 
  
 


  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {kpiCards.map((stat) => (
          <div
            key={stat.title}
            className="bg-white rounded-lg shadow p-6 hover:shadow-md transition-shadow"
          >
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-600 text-left">{stat.title}</p>
                <div className="mt-2 flex items-end gap-4">
                  <div className="flex flex-col">
                    <p className="text-3xl font-bold text-gray-900">{stat.ghsValue}</p>
                    <span className="text-xs font-medium text-gray-500 mt-1">RAW - GHS</span>
                  </div>
                  <div className="flex flex-col">
                    <p className="text-3xl font-bold text-gray-900">{stat.dgValue}</p>
                    <span className="text-xs font-medium text-gray-500 mt-1">RAW - DG</span>
                  </div>
                  <div className="flex flex-col">
                    <p className="text-3xl font-bold text-gray-900">{stat.extValue}</p>
                    <span className="text-xs font-medium text-gray-500 mt-1">Extenders - DG</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center justify-center">{stat.icon}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Classification Accuracy Card */}
      {/* <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Classification Accuracy</h3>
        <div className="flex items-center justify-center gap-8">
          <div className="text-center">
            <div className="text-4xl font-bold text-gray-900 mb-2">{classificationAccuracy.rawMaterialsGHS.accuracy}%</div>
            <p className="text-sm font-medium text-gray-600 mb-1">Raw Materials - GHS</p>
            <p className="text-xs text-gray-500">{classificationAccuracy.rawMaterialsGHS.approved} approved out of {classificationAccuracy.rawMaterialsGHS.total} total</p>
          </div>
          <div className="text-center">
            <div className="text-4xl font-bold text-gray-900 mb-2">{classificationAccuracy.rawMaterialsDG.accuracy}%</div>
            <p className="text-sm font-medium text-gray-600 mb-1">Raw Materials - DG</p>
            <p className="text-xs text-gray-500">{classificationAccuracy.rawMaterialsDG.approved} approved out of {classificationAccuracy.rawMaterialsDG.total} total</p>
          </div>
          <div className="text-center">
            <div className="text-4xl font-bold text-gray-900 mb-2">{classificationAccuracy.extenders.accuracy}%</div>
            <p className="text-sm font-medium text-gray-600 mb-1">Extenders - DG</p>
            <p className="text-xs text-gray-500">{classificationAccuracy.extenders.approved} approved out of {classificationAccuracy.extenders.total} total</p>
          </div>
        </div>
      </div> */}

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Bar Chart - Approvals and Rejections Over Past 6 Months */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Raw materials Approval vs Rejection Trends</h3>
            <div className="flex items-center gap-3">
              <label className="flex items-center gap-2 cursor-pointer px-3 py-2 bg-blue-600 rounded-md hover:bg-blue-700 transition-colors group">
                <input
                  type="checkbox"
                  checked={isGhsChecked}
                  onChange={(e) => {
                    const newValue = e.target.checked;
                    if (!newValue && !isDgChecked) { return; }
                    setIsGhsChecked(newValue);
                  }}
                  className="w-4 h-4 accent-white border-2 border-white rounded focus:outline-none checked:bg-white checked:border-white group-hover:border-blue-200 transition-all cursor-pointer"
                />
                <span className="text-sm font-medium text-white">GHS</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer px-3 py-2 bg-green-600 rounded-md hover:bg-green-700 transition-colors group">
                <input
                  type="checkbox"
                  checked={isDgChecked}
                  onChange={(e) => {
                    const newValue = e.target.checked;
                    if (!newValue && !isGhsChecked) { return; }
                    setIsDgChecked(newValue);
                  }}
                  className="w-4 h-4 accent-white border-2 border-white rounded focus:outline-none checked:bg-white checked:border-white group-hover:border-green-200 transition-all cursor-pointer"
                />
                <span className="text-sm font-medium text-white">DG</span>
              </label>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={barChartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Legend />
              {isGhsChecked && (
                <>
                  <Bar dataKey="Approved - GHS" fill="#58D68D" name="Approved - GHS" />
                  <Bar dataKey="Rejected - GHS" fill="#EC7063" name="Rejected - GHS" />
                </>
              )}
              {isDgChecked && (
                <>
                  <Bar dataKey="Approved - DG" fill="#52BE80" name="Approved - DG" />
                  <Bar dataKey="Rejected - DG" fill="#CD6155" name="Rejected - DG" />
                </>
              )}
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Extenders Approval vs Rejection Trends Chart */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Extenders Approval vs Rejection Trends</h3>
            <div className="flex items-center gap-3">
              <label className="flex items-center gap-2 cursor-pointer px-3 py-2 bg-green-600 rounded-md">
                <span className="text-sm font-medium text-white">DG</span>
              </label>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={extenderBarChartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="Approved - DG" fill="#52BE80" name="Approved - DG" />
              <Bar dataKey="Rejected - DG" fill="#CD6155" name="Rejected - DG" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Donut Chart - Status Distribution */}
        {/* <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Overall Raw Materials Status Distribution</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={donutChartData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }: { name?: string; percent?: number }) => 
                  name && percent !== undefined ? `${name}: ${(percent * 100).toFixed(0)}%` : ''
                }
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {donutChartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div> */}
      </div>

      {/* Flashpoint Distribution and GHS/DG Class Frequency */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
 
    
        {/* GHS Class Frequency */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">GHS Class Frequency for Raw Materials</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={ghsFrequency} margin={{ bottom: 50 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
              dataKey="name" 
                   angle={-45}
                   textAnchor="end"
                   
                   interval={0}
                   tick={{ fontSize: 11 }}
                   tickFormatter={(value) => {
                     // Truncate long text with ellipses
                     const maxLength = 15;
                     if (value.length > maxLength) {
                       return value.substring(0, maxLength) + '...';
                     }
                     return value;
                   }} />
              <YAxis />
              <Tooltip />
              <Bar dataKey="count" fill="#EB984E" name="Frequency" />
            </BarChart>
          </ResponsiveContainer>
        </div>
        {/* DG Class Frequency */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">DG Class Frequency for Raw Materials</h3>
          <ResponsiveContainer width="100%" height={300}>
          <BarChart data={dgClassFrequency} margin={{ bottom: 50 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="name" 
                angle={-45}
                textAnchor="end"
                
                interval={0}
                tick={{ fontSize: 11 }}
                tickFormatter={(value) => {
                  // Truncate long text with ellipses
                  const maxLength = 15;
                  if (value.length > maxLength) {
                    return value.substring(0, maxLength) + '...';
                  }
                  return value;
                }}
              />
              <YAxis />
              <Tooltip 
                formatter={(value: any) => value}
                labelFormatter={(label) => {
                  // Show full text in tooltip
                  return label;
                }}
              />
              <Bar dataKey="count" fill="#A569BD" name="Frequency" />
          </BarChart>
          </ResponsiveContainer>
        </div>
        {/* DG Class Frequency for Extenders */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">DG Class Frequency for Extenders</h3>
          <ResponsiveContainer width="100%" height={300}>
          <BarChart data={extenderDgClassFrequency} margin={{ bottom: 50 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="name" 
                angle={-45}
                textAnchor="end"
                
                interval={0}
                tick={{ fontSize: 11 }}
                tickFormatter={(value) => {
                  // Truncate long text with ellipses
                  const maxLength = 15;
                  if (value.length > maxLength) {
                    return value.substring(0, maxLength) + '...';
                  }
                  return value;
                }}
              />
              <YAxis />
              <Tooltip 
                formatter={(value: any) => value}
                labelFormatter={(label) => {
                  // Show full text in tooltip
                  return label;
                }}
              />
              <Bar dataKey="count" fill="#45B39D" name="Frequency" />
          </BarChart>
          </ResponsiveContainer>
        </div>
{/* Flashpoint Distribution */}
<div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Flashpoint Distribution for Raw Materials</h3>
                <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={flashpointDistribution} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" />
                    <YAxis dataKey="range" type="category" width={80} reversed />
                    <Tooltip />
                    <Bar dataKey="count" fill="#5D6D7E" name="Count" />
                    </BarChart>
                </ResponsiveContainer>
                </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

              
 {/* GHS Pictogram Summary */}
 <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">GHS Pictogram Summary for Raw Materials</h3>
          <div className="space-y-3">
            {ghsPictogramSummary.map((item) => {
              const ghsData = GHS_PICTOGRAMS[item.code];
              if (!ghsData) return null;
              return (
                <div key={item.code} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded flex items-center justify-center text-white">
                      {ghsData.icon}
                    </div>
                    <span className="text-sm font-medium text-gray-900">{ghsData.shortName}</span>
                  </div>
                  <span className="text-sm font-bold text-gray-700">{item.count}</span>
                </div>
              );
            })}
          </div>
        </div>
            
      </div>
    </div>
  );
};

export default Analytics;
