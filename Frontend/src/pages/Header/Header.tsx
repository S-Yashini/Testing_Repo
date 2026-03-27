import { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import sdsRecordsData from '../../data/sdsRecords.json';
import Modal from '../../components/Modal/Modal';
import { GHS_PICTOGRAMS } from '../../components/GHSInfo/GHSInfo';

interface PageInfo {
  title: string;
  subtitle?: string;
}

interface HeaderProps {
  setSidebarOpen: (open: boolean) => void;
  pageInfo: PageInfo;
}

interface SDSRecord {
  status: string;
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

const Header = ({ setSidebarOpen, pageInfo }: HeaderProps) => {
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isDGReferenceOpen, setIsDGReferenceOpen] = useState(false);
  const [isGHSReferenceOpen, setIsGHSReferenceOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const notificationsRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  // Load and calculate notifications data
  const notifications = useMemo(() => {
    const records = sdsRecordsData as SDSRecord[];
    const total = records.length;
    const approved = records.filter(r => r.status === 'Approved').length;
    const pending = records.filter(r => r.status === 'Pending Review').length;
    const rejected = records.filter(r => r.status === 'Rejected').length;
    
    const approvalRate = total > 0 ? Math.round((approved / total) * 100) : 0;
    const rejectionRate = total > 0 ? Math.round((rejected / total) * 100) : 0;
    
    // Get recent pending (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const recentPending = records.filter(r => {
      if (r.status !== 'Pending Review') return false;
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
  }, []);

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

  const handleProfileClick = () => {
    setIsProfileDropdownOpen(!isProfileDropdownOpen);
  };

  const handleLogout = async () => {
    try {
      // Clear localStorage
      localStorage.clear();
      
      // Clear sessionStorage
      sessionStorage.clear();
      
      // Clear service worker cache if available
      if ('caches' in window) {
        const cacheNames = await caches.keys();
        await Promise.all(
          cacheNames.map(cacheName => caches.delete(cacheName))
        );
      }
      
      // Clear IndexedDB if available
      if ('indexedDB' in window) {
        try {
          const databases = await indexedDB.databases();
          await Promise.all(
            databases
              .filter(db => db.name) // Filter out databases without names
              .map(db => {
                return new Promise<void>((resolve, reject) => {
                  const deleteReq = indexedDB.deleteDatabase(db.name!);
                  deleteReq.onsuccess = () => resolve();
                  deleteReq.onerror = () => reject(deleteReq.error);
                  deleteReq.onblocked = () => resolve(); // Resolve even if blocked
                });
              })
          );
        } catch (error) {
          console.warn('Error clearing IndexedDB:', error);
        }
      }
      
      // Clear any cookies (optional - be careful with this as it might clear other app cookies)
      // document.cookie.split(";").forEach(c => {
      //   document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/");
      // });
      
      setIsProfileDropdownOpen(false);
      
      // Force a hard reload to clear any remaining cache
      window.location.href = '/login';
    } catch (error) {
      console.error('Error during logout:', error);
      // Even if clearing cache fails, still navigate to login
      setIsProfileDropdownOpen(false);
      navigate('/login');
    }
  };

  const handleProfile = () => {
    // TODO: Navigate to profile page
    alert('Profile clicked');
    setIsProfileDropdownOpen(false);
  };

  const handleSettings = () => {
    // TODO: Navigate to settings page
    alert('Settings clicked');
    setIsProfileDropdownOpen(false);
  };

  return (
    <header className="bg-white shadow-sm sticky top-0 z-10">
      <div className="flex items-center justify-between h-16 px-6">
        <button
          onClick={() => setSidebarOpen(true)}
          className="lg:hidden text-gray-600 hover:text-gray-900"
        >
          <svg
            className="w-6 h-6"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 6h16M4 12h16M4 18h16"
            />
          </svg>
        </button>

        <div className="lg:ml-0 ml-4 text-left">
          <h2 className="text-lg font-semibold text-gray-800">{pageInfo.title}</h2>
          {pageInfo.subtitle && (
            <p className="text-sm text-gray-600 mt-0.5">{pageInfo.subtitle}</p>
          )}
        </div>

        <div className="flex items-center space-x-4">
          {/* DG Reference Button */}
          <button 
            onClick={() => setIsDGReferenceOpen(true)}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors flex items-center gap-2"
          >
            <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            DG Reference
          </button>

          {/* GHS Reference Button */}
          <button 
            onClick={() => setIsGHSReferenceOpen(true)}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors flex items-center gap-2"
          >
            <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            GHS Reference
          </button>

          <div className="relative" ref={notificationsRef}>
            <button
              onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
              className="text-gray-600 hover:text-gray-900 relative"
            >
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
                />
              </svg>
              {notifications.pendingReview > 0 && (
                <span className="absolute top-0 right-0 block h-2 w-2 rounded-full bg-red-500 ring-2 ring-white"></span>
              )}
            </button>

            {/* Notifications Dropdown */}
            {isNotificationsOpen && (
              <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50">
                <div className="px-4 py-2 border-b border-gray-200">
                  <h3 className="text-sm font-semibold text-gray-900">Notifications</h3>
                </div>
                <div className="max-h-96 overflow-y-auto">
                  <div className="px-4 py-3 hover:bg-gray-50 transition-colors">
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                        <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-left text-gray-900">Approval Rate</p>
                        <p className="text-sm text-left text-gray-600 mt-0.5">{notifications.approvalRate}%</p>
                      </div>
                    </div>
                  </div>

                  <div className="px-4 py-3 hover:bg-gray-50 transition-colors">
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-full bg-yellow-100 flex items-center justify-center flex-shrink-0">
                        <svg className="w-4 h-4 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                      <div className="flex-1">
                        <p className="text-sm text-left font-medium text-gray-900">Classifications Awaiting Review</p>
                        <p className="text-sm text-left text-gray-600 mt-0.5">{notifications.pendingReview} classifications awaiting review</p>
                      </div>
                    </div>
                  </div>

                  {notifications.recentPending > 0 && (
                    <div className="px-4 py-3 hover:bg-gray-50 transition-colors">
                      <div className="flex items-start gap-3">
                        <div className="w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center flex-shrink-0">
                          <svg className="w-4 h-4 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                          </svg>
                        </div>
                        <div className="flex-1">
                          <p className="text-sm text-left font-medium text-gray-900">Recent Pending</p>
                          <p className="text-sm text-left text-gray-600 mt-0.5">{notifications.recentPending} new classifications in the last 7 days</p>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="px-4 py-3 hover:bg-gray-50 transition-colors">
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
                        <svg className="w-4 h-4 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </div>
                      <div className="flex-1">
                        <p className="text-sm text-left font-medium text-gray-900">Rejection Rate</p>
                        <p className="text-sm text-left text-gray-600 mt-0.5">{notifications.rejectionRate}%</p>
                      </div>
                    </div>
                  </div>

                  <div className="px-4 py-3 hover:bg-gray-50 transition-colors">
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                        <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                        </svg>
                      </div>
                      <div className="flex-1">
                        <p className="text-sm   text-left font-medium text-gray-900">Total Classifications</p>
                        <p className="text-sm text-left text-gray-600 mt-0.5">{notifications.totalClassifications} total classifications</p>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="px-4 py-2 border-t border-gray-200">
                  <button
                    onClick={() => {
                      setIsNotificationsOpen(false);
                      navigate('/raw-materials');
                    }}
                    className="text-sm text-blue-600 hover:text-blue-700 font-medium w-full text-center"
                  >
                    View All
                  </button>
                </div>
              </div>
            )}
          </div>

          <div className="relative" ref={dropdownRef}>
            <button
              onClick={handleProfileClick}
              className="flex items-center space-x-3 hover:bg-gray-50 rounded-lg px-2 py-1 transition-colors"
            >
              <div className="w-8 h-8 rounded-full bg-gray-300 flex items-center justify-center">
                <span className="text-sm">👤</span>
              </div>
              <span className="hidden md:block text-sm font-medium text-gray-700">
                Admin
              </span>
              <svg
                className={`w-4 h-4 text-gray-500 transition-transform ${
                  isProfileDropdownOpen ? 'rotate-180' : ''
                }`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 9l-7 7-7-7"
                />
              </svg>
            </button>

            {/* Dropdown Menu */}
            {isProfileDropdownOpen && (
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50">
                <button
                  onClick={handleProfile}
                  className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors flex items-center space-x-2"
                >
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                    />
                  </svg>
                  <span>Profile</span>
                </button>
                <button
                  onClick={handleSettings}
                  className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors flex items-center space-x-2"
                >
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                    />
                  </svg>
                  <span>Settings</span>
                </button>
                <div className="border-t border-gray-200 my-1"></div>
                <button
                  onClick={handleLogout}
                  className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors flex items-center space-x-2"
                >
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                    />
                  </svg>
                  <span>Logout</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* DG Reference Modal */}
      <Modal
        isOpen={isDGReferenceOpen}
        onClose={() => setIsDGReferenceOpen(false)}
        title="DG Classification Reference"
        size="xl"
      >
        <div className="space-y-2 mb-4">
          <p className="text-sm text-left text-gray-600">
            UN Transport Classes for Dangerous Goods - Used for shipment and storage safety
          </p>
        </div>
        <div className="max-h-[calc(80vh-200px)] overflow-y-auto pr-2">
          <div className="space-y-4">
            {DG_DEFINITIONS.map((def) => (
              <div key={def.class} className="border border-gray-200 rounded-lg p-4 space-y-3">
                <div className="flex items-start gap-3">
                  <div
                    className={`h-12 w-16 rounded flex items-center justify-center text-white font-bold text-sm shrink-0 ${def.labelColor}`}
                  >
                    {def.class}
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-left text-base text-gray-900">{def.name}</h3>
                    <p className="text-xs text-left text-gray-500">UN Dangerous Goods Classification</p>
                  </div>
                </div>

                <p className="text-sm text-left text-gray-700">{def.description}</p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                  <div>
                    <p className="font-semibold text-left text-gray-700 mb-2">Hazard Characteristics:</p>
                    <ul className="list-disc text-left list-inside space-y-1 text-gray-600">
                      {def.hazardCharacteristics.map((char, i) => (
                        <li key={i}>{char}</li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <p className="font-semibold text-left text-gray-700 mb-2">Common Examples:</p>
                    <ul className="list-disc text-left list-inside space-y-1 text-gray-600">
                      {def.examples.slice(0, 5).map((ex, i) => (
                        <li key={i}>{ex}</li>
                      ))}
                      
                    </ul>
                  </div>
                </div>

                {def.packingGroup && (
                  <div className="bg-gray-50 p-2 rounded text-xs">
                    <p className="text-gray-700 text-left">
                      <span className="font-semibold">Packing Groups:</span> {def.packingGroup}
                    </p>
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
        <div className="space-y-2 mb-4">
          <p className="text-sm text-left text-gray-600">
            Complete guide to the 9 Globally Harmonized System pictograms and their hazard classifications
          </p>
        </div>
        <div className="max-h-[calc(80vh-200px)] overflow-y-auto pr-2">
          <div className="space-y-4">
            {Object.values(GHS_PICTOGRAMS).map((def) => (
              <div key={def.code} className="border border-gray-200 rounded-lg p-4 space-y-2">
                <div className="flex items-start gap-3">
                  <div className="w-12 h-12 rounded flex items-center justify-center text-2xl shrink-0 bg-gray-100">
                    {def.icon}
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-left text-base text-gray-900">
                      {def.code}: {def.name}
                    </h3>
                    <p className="text-xs text-left text-gray-500">
                      Signal Word: <span className="font-medium">{def.signalWord}</span>
                    </p>
                  </div>
                </div>
                <p className="text-sm text-left text-gray-700">{def.description}</p>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                  <div>
                    <p className="font-semibold text-left text-gray-700 mb-1">Hazard Statements:</p>
                    <ul className="list-disc text-left list-inside space-y-0.5 text-gray-600">
                      {def.hazardStatements.slice(0, 3).map((stmt, i) => (
                        <li key={i}>{stmt}</li>
                      ))}
                      {/* {def.hazardStatements.length > 3 && (
                        <li className="text-gray-500 italic">+{def.hazardStatements.length - 3} more</li>
                      )} */}
                    </ul>
                  </div>
                  <div>
                    <p className="font-semibold text-left text-gray-700 mb-1">Precautionary Measures:</p>
                    <ul className="list-disc text-left list-inside space-y-0.5 text-gray-600">
                      {def.precautionaryStatements.slice(0, 3).map((stmt, i) => (
                        <li key={i}>{stmt}</li>
                      ))}
                      {/* {def.precautionaryStatements.length > 3 && (
                        <li className="text-gray-500 italic">+{def.precautionaryStatements.length - 3} more</li>
                      )} */}
                    </ul>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </Modal>
    </header>
  );
};

export default Header;

