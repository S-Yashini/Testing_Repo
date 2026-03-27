import { useState, useEffect, useRef, useMemo } from 'react';
import { useHistory } from 'react-router-dom';
import { Layout, Button } from 'antd';
//import { useAuth } from '../../contexts/AuthContext';
//import { useSDSRecords } from '../../hooks/useSDSRecords';
import Modal from '../../components/Modal/Modal';
import { GHS_PICTOGRAMS } from '../../components/GHSInfo/GHSInfo';
import { useRawMaterials } from '../../hooks/useRawMaterials';

const { Header: AntHeader } = Layout;

/* Inline SVG icons (antd 3 icon font may not load in Vite) */
const iconStyle = {
  width: 14,
  height: 14,
  display: 'block',
  flexShrink: 0,
  verticalAlign: 'middle',
};
const iconBellStyle = {
  width: 24,
  height: 24,
  display: 'block',
  flexShrink: 0,
  verticalAlign: 'middle',
};
const MenuIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} style={iconStyle}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
  </svg>
);
const InfoCircleIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} style={iconStyle} aria-hidden="true">
    <circle cx="12" cy="12" r="10" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 16v-4M12 8h.01" />
  </svg>
);
const UploadIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} style={iconStyle} aria-hidden="true">
    <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
  </svg>
);
const BellIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} style={iconBellStyle}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
  </svg>
);

interface PageInfo {
  title: string;
  subtitle?: string;
}

interface HeaderProps {
  setSidebarOpen: (open: boolean) => void;
  pageInfo: PageInfo;
}

interface SDSRecord {
  status?: string;
  GHSStatus?: string;
  DGStatus?: string;
  uploadedDate: string;
}

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
  {
    class: 'Class 1',
    name: 'Explosives',
    description: 'Substances and articles which are capable of mass explosion hazard, projection hazard, or fire hazard. Includes explosives, blasting agents, and pyrotechnics.',
    hazardCharacteristics: [
      'Mass explosion hazard',
      'Projection hazard',
      'Fire hazard',
      'Minor blast hazard',
      'Very insensitive substances with mass explosion hazard'
    ],
    examples: ['Dynamite', 'Fireworks', 'Ammunition', 'Blasting caps', 'Rocket propellants', 'Detonators'],
    packingGroup: 'I, II, III',
    labelColor: 'bg-orange-600'
  },
  {
    class: 'Class 2',
    name: 'Gases',
    description: 'Compressed, liquefied, dissolved, refrigerated liquefied, or aerosol gases. Includes flammable, non-flammable, and toxic gases.',
    hazardCharacteristics: [
      'Flammable gases',
      'Non-flammable, non-toxic gases',
      'Toxic gases',
      'Corrosive gases',
      'Oxidizing gases'
    ],
    examples: ['Propane', 'Acetylene', 'Chlorine', 'Ammonia', 'Helium', 'Carbon dioxide'],
    packingGroup: 'N/A',
    labelColor: 'bg-red-600'
  },
  {
    class: 'Class 3',
    name: 'Flammable Liquids',
    description: 'Liquids with a flash point of not more than 60.5°C (141°F) or liquids offered for transport at temperatures at or above their flash point.',
    hazardCharacteristics: [
      'Flash point below 23°C (73°F)',
      'Flash point between 23°C and 60.5°C',
      'Highly flammable vapors',
      'May form explosive mixtures with air',
      'Vapors may travel to ignition source'
    ],
    examples: ['Gasoline', 'Acetone', 'Ethanol', 'Methanol', 'Toluene', 'Diesel fuel'],
    packingGroup: 'I, II, III',
    labelColor: 'bg-red-500'
  },
  {
    class: 'Class 4',
    name: 'Flammable Solids',
    description: 'Substances which are readily combustible or may cause or contribute to fire through friction. Includes self-reactive substances and desensitized explosives.',
    hazardCharacteristics: [
      'Readily combustible solids',
      'Self-reactive substances',
      'Substances liable to spontaneous combustion',
      'Substances which emit flammable gases when in contact with water',
      'Desensitized explosives'
    ],
    examples: ['Matches', 'Sodium', 'Phosphorus', 'Magnesium', 'Zinc powder', 'Calcium carbide'],
    packingGroup: 'II, III',
    labelColor: 'bg-red-700'
  },
  {
    class: 'Class 5',
    name: 'Oxidizing Substances',
    description: 'Substances which may cause or contribute to combustion of other material. Includes oxidizing substances and organic peroxides.',
    hazardCharacteristics: [
      'May cause fire or explosion',
      'May intensify fire',
      'May cause spontaneous ignition',
      'May be explosive when heated',
      'May be sensitive to shock or friction'
    ],
    examples: ['Hydrogen peroxide', 'Potassium permanganate', 'Sodium chlorate', 'Ammonium nitrate', 'Calcium hypochlorite'],
    packingGroup: 'I, II, III',
    labelColor: 'bg-yellow-600'
  },
  {
    class: 'Class 6',
    name: 'Toxic and Infectious Substances',
    description: 'Substances liable to cause death or serious injury or to harm human health if swallowed, inhaled, or by skin contact. Includes toxic substances and infectious substances.',
    hazardCharacteristics: [
      'Highly toxic substances',
      'Toxic substances',
      'Infectious substances',
      'May cause serious health effects',
      'May be fatal if swallowed, inhaled, or absorbed through skin'
    ],
    examples: ['Cyanide', 'Arsenic compounds', 'Mercury', 'Phenol', 'Biological samples', 'Medical waste'],
    packingGroup: 'I, II, III',
    labelColor: 'bg-orange-600 text-gray-900  border-gray-900'
  },
  {
    class: 'Class 7',
    name: 'Radioactive Materials',
    description: 'Materials containing radionuclides where both the activity concentration and the total activity exceed certain threshold values.',
    hazardCharacteristics: [
      'Ionizing radiation',
      'May cause radiation sickness',
      'Long-term health effects',
      'Contamination hazard',
      'Criticality hazard'
    ],
    examples: ['Uranium', 'Plutonium', 'Medical isotopes', 'Radioactive waste', 'Nuclear fuel'],
    packingGroup: 'N/A',
    labelColor: 'bg-yellow-400 text-gray-900'
  },
  {
    class: 'Class 8',
    name: 'Corrosive Substances',
    description: 'Substances which, by chemical action, will cause severe damage when in contact with living tissue, or will materially damage or destroy other goods or the means of transport.',
    hazardCharacteristics: [
      'Causes severe skin burns',
      'Causes serious eye damage',
      'Corrosive to metals',
      'May be toxic',
      'May produce corrosive vapors'
    ],
    examples: ['Sulfuric acid', 'Hydrochloric acid', 'Sodium hydroxide', 'Nitric acid', 'Battery acid'],
    packingGroup: 'I, II, III',
    labelColor: 'bg-red-600 text-gray-900 border-gray-900'
  },
  {
    class: 'Class 9',
    name: 'Miscellaneous Dangerous Goods',
    description: 'Substances and articles which, during transport, present a danger not covered by other classes. Includes environmentally hazardous substances.',
    hazardCharacteristics: [
      'Environmentally hazardous substances',
      'Substances dangerous to the ozone layer',
      'Elevated temperature substances',
      'Magnetized materials',
      'Substances not otherwise specified'
    ],
    examples: ['Lithium batteries', 'Asbestos', 'Dry ice', 'Genetically modified organisms', 'Polymerizing substances'],
    packingGroup: 'II, III',
    labelColor: 'bg-yellow-600 text-gray-900  border-gray-900'
  }
];

// const DG_LABEL_CLASS: Record<string, string> = {
//   'bg-orange-600': 'ref-modal-label ref-modal-label--orange',
//   'bg-red-600': 'ref-modal-label ref-modal-label--red',
//   'bg-red-500': 'ref-modal-label ref-modal-label--red500',
//   'bg-red-700': 'ref-modal-label ref-modal-label--red700',
//   'bg-yellow-600': 'ref-modal-label ref-modal-label--yellow',
//   'bg-orange-600 text-gray-900  border-gray-900': 'ref-modal-label ref-modal-label--orange-dark',
//   'bg-yellow-400 text-gray-900': 'ref-modal-label ref-modal-label--yellow400',
//   'bg-yellow-600 text-gray-900  border-gray-900': 'ref-modal-label ref-modal-label--yellow-dark',
//   'bg-red-600 text-gray-900 border-gray-900': 'ref-modal-label ref-modal-label--red-dark',
// };

const Header = ({ setSidebarOpen, pageInfo }: HeaderProps) => {
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isDGReferenceOpen, setIsDGReferenceOpen] = useState(false);
  const [isGHSReferenceOpen, setIsGHSReferenceOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const notificationsRef = useRef<HTMLDivElement>(null);
  const excelInputRef = useRef<HTMLInputElement>(null);
  const history = useHistory();

  const EXCEL_EXTENSIONS = ['.xlsx', '.xls'];
  const isExcelFile = (fileName: string) =>
    EXCEL_EXTENSIONS.some((ext) => fileName.toLowerCase().endsWith(ext));

  const handleExcelFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!isExcelFile(file.name)) {
      alert('Please select an Excel file (.xlsx or .xls only).');
      e.target.value = '';
      return;
    }
    // TODO: handle upload (e.g. send to API or process locally)
    console.log('Excel file selected:', file.name);
    e.target.value = '';
  };
  //const { user, logout } = useAuth();
  //const { data: sdsRecords = [], isLoading: isLoadingRecords } = useSDSRecords();
  const { data: rawMaterialsResponse, isLoading: isLoadingRecords } = useRawMaterials();
  const sdsRecords = rawMaterialsResponse?.data ?? [];
  // Load and calculate notifications data
  const notifications = useMemo(() => {
    if (isLoadingRecords || !sdsRecords.length) {
      return {
        approvalRate: 0,
        rejectionRate: 0,
        pendingReview: 0,
        recentPending: 0,
        totalClassifications: 0,
      };
    }

    const records = sdsRecords as SDSRecord[];
    const total = records.length;
    const approved = records.filter(r => r.status === 'Approved' || r.GHSStatus === 'Approved' || r.DGStatus === 'Approved').length;
    const pending = records.filter(r => r.status === 'Pending Review' || r.GHSStatus === 'Pending Review' || r.DGStatus === 'Pending Review').length;
    const rejected = records.filter(r => r.status === 'Rejected' || r.GHSStatus === 'Rejected' || r.DGStatus === 'Rejected').length;
    
    const approvalRate = total > 0 ? Math.round((approved / total) * 100) : 0;
    const rejectionRate = total > 0 ? Math.round((rejected / total) * 100) : 0;
    
    // Get recent pending (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const recentPending = records.filter(r => {
      const status = r.status || r.GHSStatus || r.DGStatus;
      if (status !== 'Pending Review') return false;
      const uploadDate = new Date(r.uploadedDate);
      return uploadDate >= sevenDaysAgo;
    }).length;
    
    return {
      approvalRate,
      rejectionRate,
      pendingReview: pending,
      recentPending,
      totalClassifications: total,
    };
  }, [sdsRecords, isLoadingRecords]);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsProfileDropdownOpen(false);
      }
      if (notificationsRef.current && !notificationsRef.current.contains(event.target as Node)) {
        setIsNotificationsOpen(false);
      }
    };

    if (isProfileDropdownOpen || isNotificationsOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isProfileDropdownOpen, isNotificationsOpen]);

  // const handleProfileClick = () => {
  //   setIsProfileDropdownOpen(!isProfileDropdownOpen);
  // };

  // const handleLogout = async () => {
  //   try {
  //     setIsProfileDropdownOpen(false);
      
  //     // Use auth context logout (clears tokens)
  //     logout();
      
  //     // Navigate to login
  //     history.push('/login');
  //   } catch (error) {
  //     console.error('Error during logout:', error);
  //     // Even if logout fails, still navigate to login
  //     setIsProfileDropdownOpen(false);
  //     history.push('/login');
  //   }
  // };

  // const handleProfile = () => {
  //   // TODO: Navigate to profile page
  //   alert('Profile clicked');
  //   setIsProfileDropdownOpen(false);
  // };

  // const handleSettings = () => {
  //   // TODO: Navigate to settings page
  //   alert('Settings clicked');
  //   setIsProfileDropdownOpen(false);
  // };

  return (
    <AntHeader
      style={{
        background: '#fff',
        padding: '0 24px',
        height: 64,
        lineHeight: 20,
        boxShadow: '0 1px 4px rgba(0,21,41,.08)',
        position: 'sticky',
        top: 0,
        zIndex: 10,
        display: 'flex',
        alignItems: 'center',
        minWidth: 0,
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          width: '100%',
          minWidth: 0,
          gap: 16,
        }}
      >
        <Button
          type="ghost"
          onClick={() => setSidebarOpen(true)}
          className="sidebar-toggle-mobile"
          style={{ flexShrink: 0 }}
        >
          <MenuIcon />
        </Button>

        <div
          style={{
            flex: 1,
            minWidth: 0,
            overflow: 'hidden',
            textAlign: 'left',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            gap: 2,
          }}
        >
          <h2
            style={{
              margin: 0,
              fontSize: 18,
              fontWeight: 600,
              color: 'rgba(0,0,0,0.85)',
              lineHeight: 1.4,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {pageInfo.title}
          </h2>
          {pageInfo.subtitle && (
            <p
              style={{
                margin: 0,
                fontSize: 14,
                color: 'rgba(0,0,0,0.45)',
                lineHeight: 1.4,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {pageInfo.subtitle}
            </p>
          )}
        </div>

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            flexShrink: 0,
            gap: 8,
            flexWrap: 'wrap',
            justifyContent: 'flex-end',
            marginLeft: 'auto',
          }}
        >
          <Button size="small" onClick={() => setIsDGReferenceOpen(true)} style={{ padding:'6px 15px',height:'36px'}}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 , fontWeight: 'bold'}}>
              <InfoCircleIcon />
              <span>DG Reference</span>
            </span>
          </Button>
          <Button size="small" onClick={() => setIsGHSReferenceOpen(true)} style={{ padding:'6px 15px',height:'36px'}}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 , fontWeight: 'bold'}}>
              <InfoCircleIcon />
              <span>GHS Reference</span>
            </span>
          </Button>
          <input
            ref={excelInputRef}
            type="file"
            accept=".xlsx,.xls,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel"
            onChange={handleExcelFileChange}
            style={{ display: 'none' }}
            aria-hidden
          />
          <Button size="small"  onClick={() => excelInputRef.current?.click()} style={{ padding:'6px 15px',height:'36px'}}>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 , fontWeight: 'bold'}}>
              <UploadIcon />
              <span>Upload Excel</span>
            </span>
            </Button>
          <div style={{ position: 'relative' }} ref={notificationsRef}>
            <Button
              type="ghost"
              onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
              style={{ position: 'relative', marginTop: '5px' }}
            >
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
              <BellIcon />
            </span>
              {notifications.pendingReview > 0 && (
                <span style={{ position: 'absolute', top: 0, right: 0, width: 8, height: 8, borderRadius: '50%', background: '#f5222d' }} />
              )}
            </Button>

            {/* Notifications Dropdown */}
            {isNotificationsOpen && (
              <div className="notif-dropdown">
                <div className="notif-dropdown-header">
                  <h3 className="notif-dropdown-title">Notifications</h3>
                </div>
                <div className="notif-dropdown-list">
                  <div className="notif-item">
                    <div className="notif-item-inner">
                      <div className="notif-icon notif-icon--blue">
                        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                      <div className="notif-content">
                        <p className="notif-title">Approval Rate</p>
                        <p className="notif-subtitle">{notifications.approvalRate}%</p>
                      </div>
                    </div>
                  </div>

                  <div className="notif-item">
                    <div className="notif-item-inner">
                      <div className="notif-icon notif-icon--yellow">
                        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                      <div className="notif-content">
                        <p className="notif-title">Classifications Awaiting Review</p>
                        <p className="notif-subtitle">{notifications.pendingReview} classifications awaiting review</p>
                      </div>
                    </div>
                  </div>

                  {notifications.recentPending > 0 && (
                    <div className="notif-item">
                      <div className="notif-item-inner">
                        <div className="notif-icon notif-icon--orange">
                          <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                          </svg>
                        </div>
                        <div className="notif-content">
                          <p className="notif-title">Recent Pending</p>
                          <p className="notif-subtitle">{notifications.recentPending} new classifications in the last 7 days</p>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="notif-item">
                    <div className="notif-item-inner">
                      <div className="notif-icon notif-icon--red">
                        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </div>
                      <div className="notif-content">
                        <p className="notif-title">Rejection Rate</p>
                        <p className="notif-subtitle">{notifications.rejectionRate}%</p>
                      </div>
                    </div>
                  </div>

                  <div className="notif-item">
                    <div className="notif-item-inner">
                      <div className="notif-icon notif-icon--green">
                        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                        </svg>
                      </div>
                      <div className="notif-content">
                        <p className="notif-title">Total Classifications</p>
                        <p className="notif-subtitle">{notifications.totalClassifications} total classifications</p>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="notif-footer">
                  <button
                    type="button"
                    onClick={() => {
                      setIsNotificationsOpen(false);
                      history.push('/raw-materials');
                    }}
                    className="notif-view-all"
                  >
                    View All
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* <div className="relative" ref={dropdownRef}>
            <button
              type="button"
              onClick={handleProfileClick}
              className="profile-trigger"
            >
              <div className="profile-trigger-avatar">
                <span>👤</span>
              </div>
              <span className="profile-trigger-name">
                {user?.name || 'User'}
              </span>
              <svg
                className={`profile-trigger-chevron ${isProfileDropdownOpen ? 'open' : ''}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {/* Dropdown Menu 
            {isProfileDropdownOpen && (
              <div className="profile-dropdown">
                <button type="button" onClick={handleProfile} className="profile-dropdown-item">
                  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  <span>Profile</span>
                </button>
                <button type="button" onClick={handleSettings} className="profile-dropdown-item">
                  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  <span>Settings</span>
                </button>
                <div className="profile-dropdown-divider" />
                <button type="button" onClick={handleLogout} className="profile-dropdown-item profile-dropdown-item--logout">
                  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                  <span>Logout</span>
                </button>
              </div>
            )}
          </div> */}
        </div>
      </div>

      {/* DG Reference Modal */}
      <Modal
        isOpen={isDGReferenceOpen}
        onClose={() => setIsDGReferenceOpen(false)}
        title="DG Classification Reference"
        size="xl"
      >
        <div className="ref-modal-intro">
          <p>UN Transport Classes for Dangerous Goods - Used for shipment and storage safety</p>
        </div>
        <div className="ref-modal-scroll">
          <div className="ref-modal-cards">
            {DG_DEFINITIONS.map((def) => (
              <div key={def.class} className="ref-modal-card">
                <div className="ref-modal-card-header">
                  <div className="ref-modal-label dg-reference-label">
                    {def.class}
                  </div>
                  <div className="flex-1">
                    <h3 className="ref-modal-card-title">{def.name}</h3>
                    <p className="ref-modal-card-subtitle">UN Dangerous Goods Classification</p>
                  </div>
                </div>

                <p className="ref-modal-card-desc">{def.description}</p>

                <div className="ref-modal-grid">
                  <div className="ref-modal-grid-section">
                    <p>Hazard Characteristics:</p>
                    <ul>
                      {def.hazardCharacteristics.map((char, i) => (
                        <li key={i}>{char}</li>
                      ))}
                    </ul>
                  </div>
                  <div className="ref-modal-grid-section">
                    <p>Common Examples:</p>
                    <ul>
                      {def.examples.slice(0, 5).map((ex, i) => (
                        <li key={i}>{ex}</li>
                      ))}
                    </ul>
                  </div>
                </div>

                {def.packingGroup && (
                  <div className="ref-modal-packing">
                    <span className="ref-modal-packing-label">Packing Groups:</span> {def.packingGroup}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </Modal>

      {/* GHS Reference Modal */}
      <Modal
        isOpen={isGHSReferenceOpen}
        onClose={() => setIsGHSReferenceOpen(false)}
        title="GHS Classification Codes Reference"
        size="xl"
      >
        <div className="ref-modal-intro">
          <p>Complete guide to the 9 Globally Harmonized System pictograms and their hazard classifications</p>
        </div>
        <div className="ref-modal-scroll">
          <div className="ref-modal-cards">
            {Object.values(GHS_PICTOGRAMS).map((def) => (
              <div key={def.code} className="ref-modal-card">
                <div className="ref-modal-card-header">
                  <div className="ref-modal-icon-box">
                    {def.icon}
                  </div>
                  <div className="flex-1">
                    <h3 className="ref-modal-card-title">
                      {def.code}: {def.name}
                    </h3>
                    <p className="ref-modal-card-subtitle">
                      Signal Word: <span style={{ fontWeight: 500 }}>{def.signalWord}</span>
                    </p>
                  </div>
                </div>
                <p className="ref-modal-card-desc">{def.description}</p>

                <div className="ref-modal-grid">
                  <div className="ref-modal-grid-section">
                    <p className="ref-modal-grid-heading">Hazard Statements:</p>
                    <ul>
                      {def.hazardStatements.slice(0, 3).map((stmt, i) => (
                        <li key={i}>{stmt}</li>
                      ))}
                    </ul>
                  </div>
                  <div className="ref-modal-grid-section">
                    <p className="ref-modal-grid-heading">Precautionary Measures:</p>
                    <ul>
                      {def.precautionaryStatements.slice(0, 3).map((stmt, i) => (
                        <li key={i}>{stmt}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </Modal>
    </AntHeader>
  );
};

export default Header;

