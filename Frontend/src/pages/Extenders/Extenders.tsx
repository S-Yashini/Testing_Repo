import { useState, useEffect, useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Tooltip } from 'react-tooltip';
// import MaterialSearch from './MaterialSearch';
import Table from '../../components/Table/Table';
import Modal from '../../components/Modal/Modal';
import Accordion from '../../components/Accordion/Accordion';
import { GHS_PICTOGRAMS, formatGHSTooltip } from '../../components/GHSInfo/GHSInfo';
import extenderRecordsData from '../../data/extenderRecords.json';

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
  approvedDate?: string;
  rejectedDate?: string;
  hazardousWaste?: boolean;
}

const Extenders = () => {
  const [sdsRecords, setSdsRecords] = useState<SDSRecord[]>([]);
  const [selectedRecord, setSelectedRecord] = useState<SDSRecord | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isPdfModalOpen, setIsPdfModalOpen] = useState(false);
  const [currentPdfUrl, setCurrentPdfUrl] = useState<string>('');
  
  // Create Material Modal states
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newMaterialId, setNewMaterialId] = useState<string>('');
  const [createError, setCreateError] = useState<string>('');

  // Reject Feedback Modal states
  const [isRejectFeedbackModalOpen, setIsRejectFeedbackModalOpen] = useState(false);
  const [rejectFeedback, setRejectFeedback] = useState<string>('');
  const [recordsToReject, setRecordsToReject] = useState<Set<number>>(new Set());
  const [isBulkReject, setIsBulkReject] = useState(false);

  // Array of chemical names for random selection
  const chemicalNames = [
    'Acetone',
    'Methanol',
    'Ethanol',
    'Isopropyl Alcohol',
    'Toluene',
    'Xylene',
    'Benzene',
    'Chloroform',
    'Ethyl Acetate',
    'Hexane',
    'Acetonitrile',
    'Dichloromethane'
  ];
  
  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  
  // Filter states
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [dgClassFilter, setDgClassFilter] = useState<string>('All');
  // const [ghsFilter, setGhsFilter] = useState<string>('All');
  
  // Selection states
  const [selectedRecords, setSelectedRecords] = useState<Set<number>>(new Set());
  const [selectAll, setSelectAll] = useState(false);

  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    // Load from localStorage if available, otherwise use JSON file
    const savedRecords = localStorage.getItem('extenderRecords');
    if (savedRecords) {
      try {
        setSdsRecords(JSON.parse(savedRecords));
      } catch (error) {
        console.error('Error loading from localStorage:', error);
        setSdsRecords(extenderRecordsData as SDSRecord[]);
      }
    } else {
      setSdsRecords(extenderRecordsData as SDSRecord[]);
    }
  }, []);

  // Check for create query parameter and open modal
  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    if (searchParams.get('create') === 'true') {
      setIsCreateModalOpen(true);
      // Remove the query parameter from URL
      const newSearchParams = new URLSearchParams(location.search);
      newSearchParams.delete('create');
      const newSearch = newSearchParams.toString();
      navigate(`/extenders-dg${newSearch ? `?${newSearch}` : ''}`, { replace: true });
    }
  }, [location.search, navigate]);

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
      navigate(`/extenders-dg${newSearch ? `?${newSearch}` : ''}`, { replace: true });
    }
  }, [location.search, navigate]);

  // Save to localStorage and sync to JSON file whenever records change
  useEffect(() => {
    if (sdsRecords.length > 0) {
      localStorage.setItem('extenderRecords', JSON.stringify(sdsRecords));
      localStorage.setItem('extenderRecordsLastUpdated', new Date().toISOString());
      
      // Try to sync to JSON file via API (if server is running)
      const syncToFile = async () => {
        try {
          const response = await fetch('http://localhost:3001/api/save-extender-records', {
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
    e.stopPropagation(); // Prevent row click
    const approvedDate = new Date().toISOString();
    setSdsRecords((prevRecords) =>
      prevRecords.map((record) =>
        record.id === id ? { ...record, status: 'Approved', approvedDate, rejectedDate: undefined } : record
      )
    );
  };

  const handleReject = (id: number, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent row click
    setRecordsToReject(new Set([id]));
    setIsBulkReject(false);
    setRejectFeedback('');
    setIsRejectFeedbackModalOpen(true);
  };

  const handleConfirmReject = () => {
    const rejectedDate = new Date().toISOString();
    if (isBulkReject) {
      // Bulk reject with feedback
      setSdsRecords(prevRecords =>
        prevRecords.map(record =>
          recordsToReject.has(record.id) 
            ? { ...record, status: 'Rejected', feedback: rejectFeedback, rejectedDate, approvedDate: undefined } 
            : record
        )
      );
      alert(`${recordsToReject.size} record(s) rejected successfully!`);
      setSelectedRecords(new Set());
      setSelectAll(false);
    } else {
      // Single reject with feedback
      setSdsRecords(prevRecords =>
        prevRecords.map(record =>
          recordsToReject.has(record.id) 
            ? { ...record, status: 'Rejected', feedback: rejectFeedback, rejectedDate, approvedDate: undefined } 
            : record
        )
      );
    }

    // Close modal and reset
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
    e.stopPropagation(); // Prevent row click
    console.log("record.sdsSheetUrl", record, "sssss", record.sdsSheetUrl);
    const pdfUrl = record.sdsSheetUrl || '/sds sheets/MSDS1.pdf';
    console.log("pdfUrl", pdfUrl);
    setCurrentPdfUrl(pdfUrl);
    setIsPdfModalOpen(true);
  };

  const handleRowClick = (record: SDSRecord) => {
    setSelectedRecord(record);
    setIsModalOpen(true);
  };

  const handleClearFilters = () => {
    setSearchTerm('');
    setStatusFilter('All');
    setDgClassFilter('All');
    // setGhsFilter('All');
  };

  // Check if any filters are active
  const hasActiveFilters = searchTerm !== '' || statusFilter !== 'All' || dgClassFilter !== 'All';

  const handleCreateMaterial = () => {
    // Validate empty fields
    if (!newMaterialId.trim()) {
      setCreateError('Material ID is required');
      return;
    }

    // Validate if starts with "RM"
    if (!newMaterialId.trim().startsWith('9999-')) {
      setCreateError('There is no material in the RDS to create');
      return;
    }

    // Check if material ID already exists
    const exists = sdsRecords.some(record => record.materialId === newMaterialId.trim());
    if (exists) {
      setCreateError('Material ID already exists');
      return;
    }

    // Generate new ID (incremental from 1)
    const maxId = Math.max(
      ...sdsRecords.map(record => record.id || 0),
      0
    );
    const newId = maxId + 1;

    // Randomly select a chemical name
    const randomMaterialName = chemicalNames[Math.floor(Math.random() * chemicalNames.length)];

    // Create new record with sample details
    const newRecord: SDSRecord = {
      id: newId,
      materialId: newMaterialId.trim(),
      materialName: randomMaterialName,
      source: 'RDS',
      partNumber: 'WRK-120B',
      synonyms: [
        'Ethyl alcohol',
        'Alcohol',
        'EtOH',
        'Grain alcohol',
        'Denatured Alcohol',
        'Methylated Spirits',
        'Ethyl hydroxide',
        'Cologne spirit',
        'Methylcarbinol'
      ],
      casNumber: '64-17-5',
      ecNumber: '200-578-6',
      indexNumber: '603-002-00-5',
      productType: 'Substance (100% ethanol)',
      intendedUse: 'Reagents and standards for analytical chemical laboratory use',
      manufacturer: 'Agilent Technologies, Inc.',
      manufacturerLocation: 'Santa Clara, California, USA',
      emergencyContact: 'CHEMTREC® 1-800-424-9300',
      aiRecommendedDGCode: 'UN1170 - Class 3',
      rationaleSummary: 'Highly flammable liquid and vapor. May cause cancer. Causes serious eye irritation.',
      ghsRationale: "Ethanol's low flash point (~13 °C) and ability to form explosive vapor-air mixtures clearly meet the criteria for Flammable Liquid Category 2 (H225). The SDS assigns Carcinogenicity Category 1A (H350) based on regulatory listings (e.g., IARC Group 1 references), which triggers the GHS08 health hazard pictogram. Eye exposure data supports Eye Irritation Category 2A (H319). These combined hazards justify the \"Danger\" signal word and multiple pictograms.",
      dgRationale: 'Under UN Model Regulations, liquids with flash point < 23 °C and sustained flammable vapor behavior are classified as Class 3 Flammable Liquids. Ethanol therefore receives UN 1170, Class 3, Packing Group II (medium danger). This classification is mandatory across road, sea, and air transport, regardless of laboratory or commercial use.',
      ghsPictograms: ['GHS02', 'GHS08', 'GHS07'],
      sdsSheetUrl: '/public/extenders/WrK-120B.pdf',
      status: 'Pending Review',
      feedback: '',
      sections: {
        section2: {
          classification: 'Flammable Liquids, Category 2; Carcinogenicity, Category 1A; Eye Irritation, Category 2A',
          hazards: [
            'Flammable liquid',
            'Carcinogenicity',
            'Eye irritation'
          ],
          ghsCodes: [
            'GHS02',
            'GHS08',
            'GHS07',
            'H225',
            'H350',
            'H319'
          ],
          signalWord: 'Danger',
          hazardStatements: 'H225: Highly flammable liquid and vapor. H350: May cause cancer. H319: Causes serious eye irritation. Additional statement: May form explosive mixtures with air.',
          precautionaryCodes: [
            'P210',
            'P233',
            'P240',
            'P241',
            'P242',
            'P243',
            'P280',
            'P305+P351+P338',
            'P308+P313',
            'P370+P378'
          ],
          precautionaryStatements: 'P210: Keep away from heat, sparks, open flames, hot surfaces. P233: Keep container tightly closed. P240: Ground/bond container and receiving equipment. P241: Use explosion-proof electrical equipment. P242: Use only non-sparking tools. P243: Take precautionary measures against static discharge. P280: Wear protective gloves, eye protection, face protection. P305+P351+P338: IF IN EYES: Rinse cautiously with water for several minutes. P308+P313: IF exposed or concerned: Get medical advice/attention. P370+P378: In case of fire: Use dry chemical, dry sand, or alcohol-resistant foam for extinction. Store in a well-ventilated place; keep cool.',
          carcinogenicity: "This product is classified as Carcinogenicity Category 1A (H350) based on regulatory listings including IARC Group 1 references. May cause cancer. This SDS applies a more conservative carcinogenic classification (Carc. 1A) than many general ethanol SDSs, based on regulatory interpretation referenced by the supplier.",
          additionalNotes: 'No additional health or environmental hazard classes are assigned at this concentration (pure ethanol), but flammability alone is sufficient for GHS hazard classification.'
        },
        section3: {
          chemicalNature: 'Substance (organic solvent, laboratory grade)',
          description: 'Ethanol (Ethyl Alcohol) - CAS Number: 64-17-5, EC Number: 200-578-6, Index Number: 603-002-00-5. Intended use: Reagents and standards for analytical chemical laboratory use. Manufacturer: Agilent Technologies, Inc., Santa Clara, California, USA.',
          composition: [
            {
              chemicalName: 'Ethanol',
              casNumber: '64-17-5',
              concentration: '100%',
              ghsClassification: [
                'Flam. Liq. 2',
                'Carc. 1A',
                'Eye Irrit. 2A'
              ],
              hazardStatements: [
                'H225',
                'H350',
                'H319'
              ]
            }
          ]
        },
        section9: {
          physicalState: 'liquid',
          appearance: 'Clear, colorless liquid',
          odour: 'Alcohol-like',
          flashPoint: '9.7 °C (closed cup) / ~13 °C (55.4 °F)',
          boilingPoint: '78.29 °C',
          vapourPressure: 'Not specified',
          lowerExplosiveLimit: '3.3%',
          upperExplosiveLimit: '19%',
          note: 'Explosive vapor/air mixtures possible. Lower explosive limit: 3.3%. Upper explosive limit: 19%.'
        },
        section14: {
          dot: 'UN 1170, Ethanol / Ethyl Alcohol / Ethanol Solution, Class 3, Packing Group II',
          kemlerCode: '33',
          iata: {
            unNumber: 'UN1170',
            description: 'ETHANOL / ETHYL ALCOHOL',
            class: '3',
            packingGroup: 'II',
            labels: '3',
            limitedQuantity: 'Allowed, subject to volume limits',
            passengerAircraftLimit: '5 L',
            cargoAircraftLimit: '60 L'
          },
          imdg: {
            unNumber: 'UN1170',
            description: 'ETHANOL / ETHYL ALCOHOL',
            class: '3',
            packingGroup: 'II',
            labels: '3',
            emsNumber1: 'F-E',
            emsNumber2: 'S-D',
            marinePollutant: 'no',
            limitedQuantity: '1 L'
          },
          tdg: {
            class: '3',
            packingGroup: 'II'
          },
          mexico: {
            class: '3',
            packingGroup: 'II'
          },
          otherInformation: 'Kemler Code: 33. EMS: F-E, S-D. Limited Quantity (IMDG): 1 L. Passenger Aircraft Limit: 5 L. Cargo Aircraft Limit: 60 L. Emergency Contact: CHEMTREC® 1-800-424-9300. Classification is mandatory across road (DOT), sea (IMDG), and air (IATA) transport. Transport modes covered: DOT (US): UN 1170, Class 3, PG II; IMDG (Sea): UN 1170, Class 3, PG II; IATA/ICAO (Air): UN 1170, Class 3, PG II; TDG (Canada): Class 3, PG II; Mexico: Class 3, PG II.'
        }
      },
      uploadedDate: new Date().toISOString().split('T')[0],
    };

    // Add the new record to the beginning of the list
    setSdsRecords([newRecord, ...sdsRecords]);

    // Close modal and reset form
    setIsCreateModalOpen(false);
    setNewMaterialId('');
    setCreateError('');

    // Show success message
    //alert(`Material "${randomMaterialName}" (${newMaterialId.trim()}) created successfully!`);
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

  // Bulk approve selected records
  const handleBulkApprove = () => {
    if (selectedRecords.size === 0) {
      alert('Please select at least one record to approve');
      return;
    }
    
    const approvedDate = new Date().toISOString();
    setSdsRecords(prevRecords =>
      prevRecords.map(record =>
        selectedRecords.has(record.id) ? { ...record, status: 'Approved', feedback: record.feedback || '', approvedDate, rejectedDate: undefined } : record
      )
    );
    
    alert(`${selectedRecords.size} record(s) approved successfully!`);
    setSelectedRecords(new Set());
    setSelectAll(false);
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
          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
            isHazardous 
              ? 'bg-green-100 text-green-800 border border-green-200' 
              : 'bg-red-100 text-red-800 border border-red-200'
          }`}>
            {isHazardous ? 'Yes' : 'No'}
          </span>
        );
      },
    },
    // {
    //   key: 'ghs',
    //   header: 'GHS Classification',
    //   render: (record: SDSRecord) => {
    //     // Use ghsPictograms directly from the record
    //     const pictogramArray = record.ghsPictograms || [];

    //     // Get classification from section2 if available (same for all pictograms in this record)
    //     const section2 = record.sections?.section2;
    //     const classification = section2?.classification || 'N/A';
        
    //     return (
    //       <div className="flex gap-1 flex-wrap">
    //         {pictogramArray.length > 0 ? (
    //           <>
    //             {pictogramArray.map((ghsCode) => {
    //               const ghsData = GHS_PICTOGRAMS[ghsCode];
    //               if (!ghsData) return null;
                  
    //               // Extract H-codes from hazard statements
    //              // const hCodes = ghsData.hazardStatements.map(h => h.split(':')[0]).join(', ');
                  
    //               // Extract P-codes from precautionary statements
    //             //   const pCodes = ghsData.precautionaryStatements.map(p => {
    //             //     const match = p.match(/^P\d+(?:\+\d+)?/);
    //             //     return match ? match[0] : '';
    //             //   }).filter(Boolean).join(', ');
                  
    //               const tooltipId = `ghs-${record.id}-${ghsCode}`;
    //               // Create detailed HTML tooltip content
    //             //   <tr>
    //             //            <td style="padding: 4px 8px; font-weight: 600; border-bottom: 1px solid #e5e7eb; white-space: nowrap; vertical-align: top; color: #1f2937;">Hazard Codes (H):</td>
    //             //            <td style="padding: 4px 8px; border-bottom: 1px solid #e5e7eb; word-wrap: break-word; word-break: break-word; white-space: normal; max-width: 360px; color: #1f2937;">${hCodes || 'N/A'}</td>
    //             //          </tr>
    //             //          <tr>
    //             //            <td style="padding: 4px 8px; font-weight: 600; border-bottom: 1px solid #e5e7eb; white-space: nowrap; vertical-align: top; color: #1f2937;">Precautionary Codes (P):</td>
    //             //            <td style="padding: 4px 8px; border-bottom: 1px solid #e5e7eb; word-wrap: break-word; word-break: break-word; white-space: normal; max-width: 360px; color: #1f2937;">${pCodes || 'N/A'}</td>
    //             //          </tr>
    //               const tooltipContent = `
    //                 <div style="text-align: left;font-size: 0.875rem; white-space: normal; background-color: #ffffff; color: #1f2937; width: 650px;">
    //                   <table style="border-collapse: collapse; width: 95%; table-layout: fixed; color: #1f2937;">
    //                     <tr>
    //                       <td width="30%" style="padding: 4px 8px; font-weight: 600; border-bottom: 1px solid #e5e7eb; white-space: nowrap; vertical-align: top; color: #1f2937;">GHS Code:</td>
    //                       <td width="70%" style="padding: 4px 8px; border-bottom: 1px solid #e5e7eb; word-wrap: break-word; word-break: break-word; white-space: normal; max-width: 500px; color: #1f2937;">${ghsData.code}</td>
    //                     </tr>
    //                     <tr>
    //                       <td style="padding: 4px 8px; font-weight: 600; border-bottom: 1px solid #e5e7eb; white-space: nowrap; vertical-align: top; color: #1f2937;">Name:</td>
    //                       <td style="padding: 4px 8px; border-bottom: 1px solid #e5e7eb; word-wrap: break-word; word-break: break-word; white-space: normal; max-width: 500px; color: #1f2937;">${ghsData.name}</td>
    //                     </tr>
    //                     <tr>
    //                       <td style="padding: 4px 8px; font-weight: 600; border-bottom: 1px solid #e5e7eb; white-space: nowrap; vertical-align: top; color: #1f2937;">Category/Classification:</td>
    //                       <td style="padding: 4px 8px; border-bottom: 1px solid #e5e7eb; word-wrap: break-word; word-break: break-word; white-space: normal; max-width: 500px; color: #1f2937;">${classification}</td>
    //                     </tr>
    //                     <tr>
    //                       <td style="padding: 4px 8px; font-weight: 600; border-bottom: 1px solid #e5e7eb; white-space: nowrap; vertical-align: top; color: #1f2937;">Description:</td>
    //                       <td style="padding: 4px 8px; border-bottom: 1px solid #e5e7eb; word-wrap: break-word; word-break: break-word; white-space: normal; max-width: 500px; color: #1f2937;">${ghsData.description}</td>
    //                     </tr>
    //                     <tr>
    //                       <td style="padding: 4px 8px; font-weight: 600; border-bottom: 1px solid #e5e7eb; white-space: nowrap; vertical-align: top; color: #1f2937;">Signal Word:</td>
    //                       <td style="padding: 4px 8px; border-bottom: 1px solid #e5e7eb; word-wrap: break-word; word-break: break-word; white-space: normal; max-width: 500px; color: #1f2937;">${ghsData.signalWord}</td>
    //                     </tr>
                        
    //                     <tr>
    //                       <td style="padding: 4px 8px; font-weight: 600; border-bottom: 1px solid #e5e7eb; white-space: nowrap; vertical-align: top; color: #1f2937;">Hazard Statements:</td>
    //                       <td style="padding: 4px 8px; border-bottom: 1px solid #e5e7eb; word-wrap: break-word; word-break: break-word; white-space: normal; max-width: 500px; color: #1f2937;">${ghsData.hazardStatements.join('<br>')}</td>
    //                     </tr>
    //                     <tr>
    //                       <td style="padding: 4px 8px; font-weight: 600; white-space: nowrap; vertical-align: top; color: #1f2937;">Precautionary Statements:</td>
    //                       <td style="padding: 4px 8px; word-wrap: break-word; word-break: break-word; white-space: normal; max-width: 500px; color: #1f2937;">${ghsData.precautionaryStatements.join('<br>')}</td>
    //                     </tr>
    //                   </table>
    //                 </div>
    //               `;
                  
    //               return (
    //                 <span
    //                   key={ghsCode}
    //                   data-tooltip-id={tooltipId}
    //                   data-tooltip-html={tooltipContent}
    //                   className="text-xl cursor-help inline-block"
    //                   style={{ lineHeight: 1 }}
    //                 >
    //                   {ghsData.icon}
    //                 </span>
    //               );
    //             })}
    //             {/* {pictogramArray.map((ghsCode) => {
    //               const ghsData = GHS_PICTOGRAMS[ghsCode];
    //               if (!ghsData) return null;
                  
    //               const tooltipId = `ghs-${record.id}-${ghsCode}`;
                  
    //               return (  
    //                 <Tooltip
    //                   key={`tooltip-${tooltipId}`}
    //                   id={tooltipId}
    //                   place="top"
    //                   offset={10}
    //                   delayShow={200}
    //                   delayHide={0}
    //                   float={false}
    //                   opacity={1}
    //                   style={{
    //                     backgroundColor: '#ffffff',
    //                     opacity: 1,
    //                     color: '#1f2937',
    //                     borderRadius: '0.5rem',
    //                     padding: '1rem',
    //                     maxWidth: '520px',
    //                     fontSize: '0.875rem',
    //                     boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
    //                     zIndex: 9999,
    //                     border: '1px solid #e5e7eb',
    //                     whiteSpace: 'normal',
    //                     wordBreak: 'break-word',
    //                   }}
    //                 />
    //               );
    //             })} */}
    //           </>
    //         ) : (
    //           <span className="text-xs text-gray-400">N/A</span>
    //         )}
    //       </div>
    //     );
    //   },
    // },
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
        <button
          onClick={(e) => handleViewPdf(e, record)}
          className="px-3 py-1 border border-gray-900 text-gray-900 rounded text-xs font-medium hover:bg-gray-50 transition-colors flex items-center space-x-1"
          style={{ borderColor: 'rgb(17 24 39 / var(--tw-bg-opacity, 1))', color: 'rgb(17 24 39 / var(--tw-bg-opacity, 1))' }}
        >
          <svg
            className="w-3.5 h-3.5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"
            />
          </svg>
          <span>View</span>
        </button>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (record: SDSRecord) => {
        const statusColors: Record<string, string> = {
          'Pending Review': 'bg-yellow-100 text-yellow-800',
          'Approved': 'bg-green-100 text-green-800',
          'Rejected': 'bg-red-100 text-red-800',
        };
        return (
          <span
            className={`px-3 py-1 rounded-full text-xs font-medium ${
              statusColors[record.status] || 'bg-gray-100 text-gray-800'
            }`}
          >
            {record.status} - DG
          </span>
        );
      },
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (record: SDSRecord) => {
        const statusColors: Record<string, string> = {
          'Pending Review': 'bg-yellow-100 text-yellow-800',
          'Approved': 'bg-green-100 text-green-800',
          'Rejected': 'bg-red-100 text-red-800',
        };

        // Show buttons only when status is "Pending Review"
        if (record.status === 'Pending Review') {
          return (
            <div className="flex space-x-2" onClick={(e) => e.stopPropagation()}>
              <button
                onClick={(e) => handleApprove(record.id, e)}
                className="px-3 py-1 rounded text-xs font-medium transition-colors flex items-center space-x-1 bg-green-600 text-white hover:bg-green-700"
              >
                <svg
                  className="w-3.5 h-3.5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={3}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
                <span>Approve - DG</span>
              </button>
              <button
                onClick={(e) => handleReject(record.id, e)}
                className="px-3 py-1 rounded text-xs font-medium transition-colors flex items-center space-x-1 bg-red-600 text-white hover:bg-red-700"
              >
                <svg
                  className="w-3.5 h-3.5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={3}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
                <span>Reject - DG</span>
              </button>
            </div>
          );
        }

        // Show status badge when approved or rejected
        return (
          <span
            className={`px-3 py-1 rounded-full text-xs font-medium ${
              statusColors[record.status] || 'bg-gray-100 text-gray-800'
            }`}
          >
            {record.status} 
          </span>
        );
      },
    },
  ];

  const renderSection2 = (section: SDSRecord['sections']['section2']) => (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-red-50 to-orange-50 rounded-lg p-4 border-l-4 border-red-500">
        <h4 className="font-bold text-gray-900 mb-2 text-sm uppercase tracking-wide flex items-center gap-2">
          <svg className="w-4 h-4 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
          </svg>
          Classification
        </h4>
        <p className="text-sm text-gray-800 leading-relaxed">{section.classification}</p>
      </div>
      
      <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
        <h4 className="font-bold text-gray-900 mb-2 text-sm uppercase tracking-wide">Signal Word</h4>
        <span className={`inline-flex items-center px-4 py-2 rounded-lg text-sm font-bold ${
          section.signalWord === 'Danger' 
            ? 'bg-red-100 text-red-800 border-2 border-red-300' 
            : 'bg-yellow-100 text-yellow-800 border-2 border-yellow-300'
        }`}>
          {section.signalWord}
        </span>
      </div>

      <div>
        <h4 className="font-bold text-gray-900 mb-3 text-sm uppercase tracking-wide flex items-center gap-2">
          <svg className="w-4 h-4 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          Hazards
        </h4>
        <div className="flex flex-wrap gap-2">
          {section.hazards.map((hazard, idx) => (
            <span
              key={idx}
              className="px-4 py-2 bg-red-100 text-red-800 rounded-lg text-sm font-medium border border-red-200 shadow-sm hover:shadow-md transition-shadow"
            >
              {hazard}
            </span>
          ))}
        </div>
      </div>

      <div>
        <h4 className="font-bold text-gray-900 mb-3 text-sm uppercase tracking-wide flex items-center gap-2">
          <svg className="w-4 h-4 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
          </svg>
          GHS Codes
        </h4>
        <div className="flex flex-wrap gap-2">
          {section.ghsCodes.map((code, idx) => (
            <span
              key={idx}
              className="px-3 py-1.5 bg-yellow-100 text-yellow-800 rounded-lg text-sm font-mono font-semibold border border-yellow-200 shadow-sm"
            >
              {code}
            </span>
          ))}
        </div>
      </div>

      <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
        <h4 className="font-bold text-gray-900 mb-2 text-sm uppercase tracking-wide">Hazard Statements</h4>
        <p className="text-sm text-gray-800 leading-relaxed">{section.hazardStatements}</p>
      </div>

      <div>
        <h4 className="font-bold text-gray-900 mb-3 text-sm uppercase tracking-wide flex items-center gap-2">
          <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
          </svg>
          Precautionary Codes
        </h4>
        <div className="flex flex-wrap gap-2">
          {section.precautionaryCodes.map((code, idx) => (
            <span
              key={idx}
              className="px-3 py-1.5 bg-blue-100 text-blue-800 rounded-lg text-sm font-mono font-semibold border border-blue-200 shadow-sm"
            >
              {code}
            </span>
          ))}
        </div>
      </div>

      <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
        <h4 className="font-bold text-gray-900 mb-2 text-sm uppercase tracking-wide">Precautionary Statements</h4>
        <p className="text-sm text-gray-800 leading-relaxed">{section.precautionaryStatements}</p>
      </div>

      <div className="bg-red-50 rounded-lg p-4 border-l-4 border-red-500">
        <h4 className="font-bold text-gray-900 mb-2 text-sm uppercase tracking-wide">Carcinogenicity</h4>
        <p className="text-sm text-gray-800 leading-relaxed">{section.carcinogenicity}</p>
      </div>

      {section.additionalNotes && (
        <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
          <h4 className="font-bold text-gray-900 mb-2 text-sm uppercase tracking-wide">Additional Notes</h4>
          <p className="text-sm text-gray-800 leading-relaxed">{section.additionalNotes}</p>
        </div>
      )}
    </div>
  );

  const renderSection3 = (section: SDSRecord['sections']['section3']) => (
    <div className="space-y-6">
      {section.chemicalNature && (
        <div className="bg-indigo-50 rounded-lg p-4 border-l-4 border-indigo-500">
          <h4 className="font-bold text-gray-900 mb-2 text-sm uppercase tracking-wide flex items-center gap-2">
            <svg className="w-4 h-4 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
            </svg>
            Chemical Nature
          </h4>
          <p className="text-sm text-gray-800 leading-relaxed">{section.chemicalNature}</p>
        </div>
      )}
      {section.description && (
        <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
          <h4 className="font-bold text-gray-900 mb-2 text-sm uppercase tracking-wide">Description</h4>
          <p className="text-sm text-gray-800 leading-relaxed">{section.description}</p>
        </div>
      )}
      {section.composition && section.composition.length > 0 ? (
        <div className="overflow-x-auto rounded-lg border border-gray-200 shadow-sm">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gradient-to-r from-gray-100 to-gray-200">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                  Chemical Name
                </th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                  CAS Number
                </th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                  Concentration
                </th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                  GHS Classification
                </th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                  Hazard Statements
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {section.composition.map((comp, idx) => (
                <tr key={idx} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 text-sm font-medium text-gray-900">{comp.chemicalName}</td>
                  <td className="px-6 py-4 text-sm text-gray-800 font-mono">{comp.casNumber}</td>
                  <td className="px-6 py-4 text-sm text-gray-800">{comp.concentration || (comp as any).percentage || 'N/A'}</td>
                  <td className="px-6 py-4 text-sm text-gray-800">
                    <div className="flex flex-wrap gap-1">
                      {comp.ghsClassification && comp.ghsClassification.length > 0 ? (
                        comp.ghsClassification.map((cls, i) => (
                          <span key={i} className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded text-xs font-semibold">
                            {cls}
                          </span>
                        ))
                      ) : (
                        <span className="text-xs text-gray-400">N/A</span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-800">
                    <div className="flex flex-wrap gap-1">
                      {comp.hazardStatements && comp.hazardStatements.length > 0 ? (
                        comp.hazardStatements.map((stmt, i) => (
                          <span key={i} className="px-2 py-1 bg-red-100 text-red-800 rounded text-xs font-mono">
                            {stmt}
                          </span>
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
        <div className="bg-gray-50 rounded-lg p-6 border border-gray-200 text-center">
          <p className="text-sm text-gray-600">No composition data available.</p>
        </div>
      )}
    </div>
  );

  const renderSection9 = (section: SDSRecord['sections']['section9']) => (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg p-4 border border-blue-200">
          <p className="text-xs font-bold text-blue-700 uppercase tracking-wide mb-1">Physical State</p>
          <p className="text-sm font-semibold text-gray-900">{section.physicalState}</p>
        </div>
        <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-lg p-4 border border-purple-200">
          <p className="text-xs font-bold text-purple-700 uppercase tracking-wide mb-1">Appearance</p>
          <p className="text-sm font-semibold text-gray-900">{section.appearance}</p>
        </div>
        <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg p-4 border border-green-200">
          <p className="text-xs font-bold text-green-700 uppercase tracking-wide mb-1">Odour</p>
          <p className="text-sm font-semibold text-gray-900">{section.odour}</p>
        </div>
        <div className="bg-gradient-to-br from-orange-50 to-red-50 rounded-lg p-4 border border-orange-200">
          <p className="text-xs font-bold text-orange-700 uppercase tracking-wide mb-1 inline-flex items-center gap-1">
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.656 7.343A7.975 7.975 0 0120 13a7.975 7.975 0 01-2.343 5.657z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.879 16.121A3 3 0 1012.015 11L11 14H9c0 .768.293 1.536.879 2.121z" />
            </svg>
            Flash Point
          </p>
          <p className="text-sm font-semibold text-gray-900">{section.flashPoint}</p>
        </div>
        {section.boilingPoint && (
          <div className="bg-gradient-to-br from-yellow-50 to-amber-50 rounded-lg p-4 border border-yellow-200">
            <p className="text-xs font-bold text-yellow-700 uppercase tracking-wide mb-1">Boiling Point</p>
            <p className="text-sm font-semibold text-gray-900">{section.boilingPoint}</p>
          </div>
        )}
        <div className="bg-gradient-to-br from-cyan-50 to-blue-50 rounded-lg p-4 border border-cyan-200">
          <p className="text-xs font-bold text-cyan-700 uppercase tracking-wide mb-1">Vapour Pressure</p>
          <p className="text-sm font-semibold text-gray-900">{section.vapourPressure}</p>
        </div>
        {section.density && (
          <div className="bg-gradient-to-br from-teal-50 to-cyan-50 rounded-lg p-4 border border-teal-200">
            <p className="text-xs font-bold text-teal-700 uppercase tracking-wide mb-1">Density</p>
            <p className="text-sm font-semibold text-gray-900">{section.density}</p>
          </div>
        )}
        {section.lowerExplosiveLimit && (
          <div className="bg-gradient-to-br from-red-50 to-rose-50 rounded-lg p-4 border border-red-200">
            <p className="text-xs font-bold text-red-700 uppercase tracking-wide mb-1">Lower Explosive Limit</p>
            <p className="text-sm font-semibold text-gray-900">{section.lowerExplosiveLimit}</p>
          </div>
        )}
        {section.upperExplosiveLimit && (
          <div className="bg-gradient-to-br from-red-50 to-rose-50 rounded-lg p-4 border border-red-200">
            <p className="text-xs font-bold text-red-700 uppercase tracking-wide mb-1">Upper Explosive Limit</p>
            <p className="text-sm font-semibold text-gray-900">{section.upperExplosiveLimit}</p>
          </div>
        )}
        {section.note && (
          <div className="md:col-span-2 bg-gray-50 rounded-lg p-4 border-l-4 border-gray-400">
            <p className="text-xs font-bold text-gray-700 uppercase tracking-wide mb-1">Note</p>
            <p className="text-sm text-gray-800 leading-relaxed">{section.note}</p>
          </div>
        )}
      </div>
    </div>
  );

  const renderSection14 = (section: SDSRecord['sections']['section14']) => (
    <div className="space-y-6">
      {/* DOT */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-5 border-l-4 border-blue-500 shadow-sm">
        <h5 className="text-sm font-bold text-gray-800 mb-3 uppercase tracking-wide flex items-center gap-2">
          <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
          </svg>
          DOT (Department of Transportation)
        </h5>
        <p className="text-sm text-gray-800 leading-relaxed">{section.dot}</p>
      </div>

      {section.kemlerCode && (
        <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
          <p className="text-xs font-bold text-gray-700 uppercase tracking-wide mb-1">Kemler Code</p>
          <p className="text-sm font-semibold text-gray-900 font-mono">{section.kemlerCode}</p>
        </div>
      )}

      {/* IATA */}
      <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg p-5 border-l-4 border-green-500 shadow-sm">
        <h5 className="text-sm font-bold text-gray-800 mb-4 uppercase tracking-wide flex items-center gap-2">
          <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
          </svg>
          IATA (International Air Transport Association)
        </h5>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-white rounded-lg p-3 border border-green-200">
            <p className="text-xs font-bold text-green-700 uppercase tracking-wide mb-1">UN Number</p>
            <p className="text-sm font-semibold text-gray-900 font-mono">{section.iata.unNumber}</p>
          </div>
          <div className="bg-white rounded-lg p-3 border border-green-200">
            <p className="text-xs font-bold text-green-700 uppercase tracking-wide mb-1">Class</p>
            <p className="text-sm font-semibold text-gray-900">{section.iata.class}</p>
          </div>
          <div className="bg-white rounded-lg p-3 border border-green-200">
            <p className="text-xs font-bold text-green-700 uppercase tracking-wide mb-1">Packing Group</p>
            <p className="text-sm font-semibold text-gray-900">{section.iata.packingGroup}</p>
          </div>
          <div className="bg-white rounded-lg p-3 border border-green-200">
            <p className="text-xs font-bold text-green-700 uppercase tracking-wide mb-1">Labels</p>
            <p className="text-sm font-semibold text-gray-900">{section.iata.labels}</p>
          </div>
          {section.iata.limitedQuantity && (
            <div className="bg-white rounded-lg p-3 border border-green-200">
              <p className="text-xs font-bold text-green-700 uppercase tracking-wide mb-1">Limited Quantity</p>
              <p className="text-sm font-semibold text-gray-900">{section.iata.limitedQuantity}</p>
            </div>
          )}
          {section.iata.passengerAircraftLimit && (
            <div className="bg-white rounded-lg p-3 border border-green-200">
              <p className="text-xs font-bold text-green-700 uppercase tracking-wide mb-1">Passenger Aircraft Limit</p>
              <p className="text-sm font-semibold text-gray-900">{section.iata.passengerAircraftLimit}</p>
            </div>
          )}
          {section.iata.cargoAircraftLimit && (
            <div className="bg-white rounded-lg p-3 border border-green-200">
              <p className="text-xs font-bold text-green-700 uppercase tracking-wide mb-1">Cargo Aircraft Limit</p>
              <p className="text-sm font-semibold text-gray-900">{section.iata.cargoAircraftLimit}</p>
            </div>
          )}
          <div className="md:col-span-2 bg-white rounded-lg p-3 border border-green-200">
            <p className="text-xs font-bold text-green-700 uppercase tracking-wide mb-1">Description</p>
            <p className="text-sm text-gray-800 leading-relaxed">{section.iata.description}</p>
          </div>
        </div>
      </div>

      {/* IMDG */}
      <div className="bg-gradient-to-r from-cyan-50 to-blue-50 rounded-lg p-5 border-l-4 border-cyan-500 shadow-sm">
        <h5 className="text-sm font-bold text-gray-800 mb-4 uppercase tracking-wide flex items-center gap-2">
          <svg className="w-5 h-5 text-cyan-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          IMDG (International Maritime Dangerous Goods)
        </h5>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-white rounded-lg p-3 border border-cyan-200">
            <p className="text-xs font-bold text-cyan-700 uppercase tracking-wide mb-1">UN Number</p>
            <p className="text-sm font-semibold text-gray-900 font-mono">{section.imdg.unNumber}</p>
          </div>
          <div className="bg-white rounded-lg p-3 border border-cyan-200">
            <p className="text-xs font-bold text-cyan-700 uppercase tracking-wide mb-1">Class</p>
            <p className="text-sm font-semibold text-gray-900">{section.imdg.class}</p>
          </div>
          <div className="bg-white rounded-lg p-3 border border-cyan-200">
            <p className="text-xs font-bold text-cyan-700 uppercase tracking-wide mb-1">Packing Group</p>
            <p className="text-sm font-semibold text-gray-900">{section.imdg.packingGroup}</p>
          </div>
          <div className="bg-white rounded-lg p-3 border border-cyan-200">
            <p className="text-xs font-bold text-cyan-700 uppercase tracking-wide mb-1">Labels</p>
            <p className="text-sm font-semibold text-gray-900">{section.imdg.labels}</p>
          </div>
          {section.imdg.emsNumber1 && (
            <div className="bg-white rounded-lg p-3 border border-cyan-200">
              <p className="text-xs font-bold text-cyan-700 uppercase tracking-wide mb-1">EmS Number 1</p>
              <p className="text-sm font-semibold text-gray-900 font-mono">{section.imdg.emsNumber1}</p>
            </div>
          )}
          {section.imdg.emsNumber2 && (
            <div className="bg-white rounded-lg p-3 border border-cyan-200">
              <p className="text-xs font-bold text-cyan-700 uppercase tracking-wide mb-1">EmS Number 2</p>
              <p className="text-sm font-semibold text-gray-900 font-mono">{section.imdg.emsNumber2}</p>
            </div>
          )}
          {section.imdg.marinePollutant && (
            <div className="bg-white rounded-lg p-3 border border-cyan-200">
              <p className="text-xs font-bold text-cyan-700 uppercase tracking-wide mb-1">Marine Pollutant</p>
              <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${
                section.imdg.marinePollutant.toLowerCase() === 'yes' 
                  ? 'bg-red-100 text-red-800 border border-red-200' 
                  : 'bg-green-100 text-green-800 border border-green-200'
              }`}>
                {section.imdg.marinePollutant}
              </span>
            </div>
          )}
          {section.imdg.limitedQuantity && (
            <div className="bg-white rounded-lg p-3 border border-cyan-200">
              <p className="text-xs font-bold text-cyan-700 uppercase tracking-wide mb-1">Limited Quantity</p>
              <p className="text-sm font-semibold text-gray-900">{section.imdg.limitedQuantity}</p>
            </div>
          )}
          <div className="md:col-span-2 bg-white rounded-lg p-3 border border-cyan-200">
            <p className="text-xs font-bold text-cyan-700 uppercase tracking-wide mb-1">Description</p>
            <p className="text-sm text-gray-800 leading-relaxed">{section.imdg.description}</p>
          </div>
        </div>
      </div>

      {/* TDG */}
      {section.tdg && (
        <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg p-5 border-l-4 border-purple-500 shadow-sm">
          <h5 className="text-sm font-bold text-gray-800 mb-4 uppercase tracking-wide flex items-center gap-2">
            <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
            TDG (Transportation of Dangerous Goods - Canada)
          </h5>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-white rounded-lg p-3 border border-purple-200">
              <p className="text-xs font-bold text-purple-700 uppercase tracking-wide mb-1">Class</p>
              <p className="text-sm font-semibold text-gray-900">{section.tdg.class}</p>
            </div>
            <div className="bg-white rounded-lg p-3 border border-purple-200">
              <p className="text-xs font-bold text-purple-700 uppercase tracking-wide mb-1">Packing Group</p>
              <p className="text-sm font-semibold text-gray-900">{section.tdg.packingGroup}</p>
            </div>
          </div>
        </div>
      )}

      {/* Mexico */}
      {section.mexico && (
        <div className="bg-gradient-to-r from-orange-50 to-amber-50 rounded-lg p-5 border-l-4 border-orange-500 shadow-sm">
          <h5 className="text-sm font-bold text-gray-800 mb-4 uppercase tracking-wide flex items-center gap-2">
            <svg className="w-5 h-5 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            Mexico
          </h5>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-white rounded-lg p-3 border border-orange-200">
              <p className="text-xs font-bold text-orange-700 uppercase tracking-wide mb-1">Class</p>
              <p className="text-sm font-semibold text-gray-900">{section.mexico.class}</p>
            </div>
            <div className="bg-white rounded-lg p-3 border border-orange-200">
              <p className="text-xs font-bold text-orange-700 uppercase tracking-wide mb-1">Packing Group</p>
              <p className="text-sm font-semibold text-gray-900">{section.mexico.packingGroup}</p>
            </div>
          </div>
        </div>
      )}

      {/* Other Information */}
      {section.otherInformation && (
        <div className="bg-gradient-to-r from-gray-50 to-slate-50 rounded-lg p-5 border-l-4 border-gray-400 shadow-sm">
          <h5 className="text-sm font-bold text-gray-800 mb-3 uppercase tracking-wide flex items-center gap-2">
            <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Other Information
          </h5>
          <p className="text-sm text-gray-800 leading-relaxed">{section.otherInformation}</p>
        </div>
      )}
    </div>
  );

  // Calculate stats dynamically from sdsRecords
  const stats = useMemo(() => {
    const totalCount = sdsRecords.length;
    const approvedCount = sdsRecords.filter(record => record.status === 'Approved').length;
    const rejectedCount = sdsRecords.filter(record => record.status === 'Rejected').length;
    const pendingCount = sdsRecords.filter(record => record.status === 'Pending Review').length;

    return [
      { 
        title: 'Total Extenders/Sub-Phases', 
        value: totalCount.toLocaleString(), 
        change: '+12%', 
        icon: (
          <svg className="w-10 h-10 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
        ),
        // icon: '📊', 
        changeColor: 'text-green-600' 
      },
      { 
        title: 'Pending Reviews', 
        value: pendingCount.toLocaleString(), 
        change: '+3%', 
        icon: (
          <svg className="w-10 h-10 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        ),
        // icon: '⏳', 
        changeColor: 'text-yellow-600' 
      },
      { 
        title: 'Approved', 
        value: approvedCount.toLocaleString(), 
        change: '+8%', 
        icon: (
          <svg className="w-10 h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        ),
        // icon: '✅', 
        changeColor: 'text-green-600' 
      },
      { 
        title: 'Rejected', 
        value: rejectedCount.toLocaleString(), 
        change: '+5%', 
        icon: (
          <svg className="w-10 h-10 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        ),
        // icon: '❌', 
        changeColor: 'text-red-600' 
      }
    ];
  }, [sdsRecords]);

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

  // Filter records based on search term, status, and DG class
  const filteredRecords = useMemo(() => {
    return sdsRecords.filter(record => {
      // Search filter (searches in SDS ID, Material ID, Material Name, and DG Code)
      if (searchTerm) {
        const searchLower = searchTerm.toLowerCase();
        const matchesSearch = 
          record.id.toString().includes(searchLower) ||
          record.materialId.toLowerCase().includes(searchLower) ||
          record.materialName.toLowerCase().includes(searchLower) ||
          record.aiRecommendedDGCode.toLowerCase().includes(searchLower);
        
        if (!matchesSearch) {
          return false;
        }
      }
      
      // Status filter
      if (statusFilter !== 'All' && record.status !== statusFilter) {
        return false;
      }
      
      // DG Class filter
      if (dgClassFilter !== 'All') {
        const recordClass = record.aiRecommendedDGCode.match(/Class\s+[\d.]+/)?.[0];
        if (recordClass !== dgClassFilter) {
          return false;
        }
      }
      
      // GHS filter
      // if (ghsFilter !== 'All') {
      //   if (!record.ghsPictograms.includes(ghsFilter)) {
      //     return false;
      //   }
      // }
      
      return true;
    });
  }, [sdsRecords, searchTerm, statusFilter, dgClassFilter]);

  // Paginate filtered records
  const paginatedRecords = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return filteredRecords.slice(startIndex, endIndex);
  }, [filteredRecords, currentPage, itemsPerPage]);

  // Calculate total pages
  const totalPages = Math.ceil(filteredRecords.length / itemsPerPage);

  // Reset to page 1 when filters or search change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter, dgClassFilter, itemsPerPage]);

  // Update select all checkbox when page changes or selections change
  useEffect(() => {
    const allSelected = paginatedRecords.length > 0 && 
      paginatedRecords.every(record => selectedRecords.has(record.id));
    setSelectAll(allSelected);
  }, [paginatedRecords, selectedRecords]);

  return (
    <div className="space-y-6">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat) => (
          <div
            key={stat.title}
            className="bg-white rounded-lg shadow p-6 hover:shadow-md transition-shadow"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">{stat.value}</p>
                {/* <p className={`text-sm ${stat.changeColor || 'text-green-600'} mt-1`}>{stat.change}</p> */}
              </div>
              <div className="flex items-center justify-center">{stat.icon}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Material Search
      <MaterialSearch
        onSelect={handleSelectMaterial}
        onClassify={handleClassify}
        existingRecords={sdsRecords.map((record) => ({
          id: record.id,
          materialId: record.materialId,
          materialName: record.materialName,
          source: record.source,
        }))}
      /> */}

      {/* SDS Records Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex flex-col gap-4">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between">
              <div>
                <h2 className="text-lg text-left font-semibold text-gray-900">Extenders/Sub-Phases - DG</h2>
                <p className="text-sm text-left text-gray-600 mt-1">
                  Manage and classify Safety Data Sheets.
                </p>
              </div>
              
              {/* Create Raw Material Button */}
              <button
                onClick={() => setIsCreateModalOpen(true)}
                className="flex items-center gap-2 px-4 py-2 bg-gray-900 text-white rounded-md text-sm font-medium hover:bg-gray-700 transition-colors shadow-sm"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Manual Extender/Sub-Phase (?)
              </button>
            </div>

            {/* Search and Filters */}
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
              {/* Search Input - Left Side */}
              <div className="w-full lg:w-96">
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Search..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full px-4 py-2 pl-10 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <svg
                    className="absolute left-3 top-2.5 h-5 w-5 text-gray-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                    />
                  </svg>
                  {searchTerm && (
                    <button
                      onClick={() => setSearchTerm('')}
                      className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600"
                    >
                      <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  )}
                </div>
              </div>

              {/* Filters - Right Side */}
              <div className="flex flex-wrap items-center gap-3">
                {/* Status Filter */}
                <div className="flex items-center gap-2">
                  <label className="text-sm font-medium text-gray-700">Status:</label>
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="px-3 py-1.5 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="All">All</option>
                    <option value="Pending Review">Pending Review - DG</option>
                    <option value="Approved">Approved - DG</option>
                    <option value="Rejected">Rejected - DG</option>
                  </select>
                </div>

                {/* DG Class Filter */}
                {/* <div className="flex items-center gap-2">
                  <label className="text-sm font-medium text-gray-700">DG Class:</label>
                  <select
                    value={dgClassFilter}
                    onChange={(e) => setDgClassFilter(e.target.value)}
                    className="px-3 py-1.5 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {dgClasses.map((dgClass) => (
                      <option key={dgClass} value={dgClass}>
                        {dgClass}
                      </option>
                    ))}
                  </select>
                </div> */}

                {/* GHS Filter */}
                {/* <div className="flex items-center gap-2">
                  <label className="text-sm font-medium text-gray-700">GHS:</label>
                  <select
                    value={ghsFilter}
                    onChange={(e) => setGhsFilter(e.target.value)}
                    className="px-3 py-1.5 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {ghsCodes.map((ghsCode) => (
                      <option key={ghsCode} value={ghsCode}>
                        {ghsCode}
                      </option>
                    ))}
                  </select>
                </div> */}
              </div>
            </div>
          </div>

          {/* Results Summary */}
          <div className="text-sm text-gray-600 text-right mt-2">
            Showing {filteredRecords.length === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1} to{' '}
            {Math.min(currentPage * itemsPerPage, filteredRecords.length)} of {filteredRecords.length} results
          </div>
        </div>

        <Table
          data={paginatedRecords}
          columns={tableColumns}
          onRowClick={handleRowClick}
        />

        {/* Bulk Actions and Pagination Controls */}
        <div className="px-6 py-4 border-t border-gray-200">
          {/* Bulk Actions */}
          {selectedRecords.size > 0 && (
            <div className="flex items-center justify-center gap-3 mb-4 pb-4 border-b border-gray-200">
              <span className="text-sm font-medium text-gray-700">
                {selectedRecords.size} record(s) selected
              </span>
              <button
                onClick={handleBulkApprove}
                className="flex items-center gap-2 px-5 py-2 bg-green-600 text-white rounded-md text-sm font-medium hover:bg-green-700 transition-colors shadow-sm"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                </svg>
                Approve Selected
              </button>
              <button
                onClick={handleBulkReject}
                className="flex items-center gap-2 px-5 py-2 bg-red-600 text-white rounded-md text-sm font-medium hover:bg-red-700 transition-colors shadow-sm"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
                </svg>
                Reject Selected
              </button>
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between">
            <button
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              className={`px-4 py-2 text-sm font-medium rounded-md ${
                currentPage === 1
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-300'
              }`}
            >
              Previous
            </button>

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
                    <button
                      key={page}
                      onClick={() => setCurrentPage(page)}
                      className={`px-3 py-1 text-sm font-medium rounded-md ${
                        currentPage === page
                          ? 'bg-blue-600 text-white'
                          : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-300'
                      }`}
                    >
                      {page}
                    </button>
                  );
                } else if (page === currentPage - 2 || page === currentPage + 2) {
                  return <span key={page} className="text-gray-500">...</span>;
                }
                return null;
              })}
            </div>

            <div className="flex items-center gap-4">
              {/* Items Per Page */}
              <div className="flex items-center gap-2">
                <label className="text-sm font-medium text-gray-700">Per Page:</label>
                <select
                  value={itemsPerPage}
                  onChange={(e) => setItemsPerPage(Number(e.target.value))}
                  className="px-3 py-1.5 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value={10}>10</option>
                  <option value={20}>20</option>
                  <option value={50}>50</option>
                </select>
              </div>

              <button
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
                className={`px-4 py-2 text-sm font-medium rounded-md ${
                  currentPage === totalPages
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-300'
                }`}
              >
                Next
              </button>
            </div>
            </div>
          )}

          {/* Clear Filters */}
          {hasActiveFilters && (
            <div className="flex items-center justify-end mt-4 pt-4 border-t border-gray-200">
              <button
                onClick={handleClearFilters}
                className="flex items-center gap-2 px-4 py-1.5 bg-gray-100 text-gray-700 rounded-md text-sm font-medium hover:bg-gray-200 transition-colors border border-gray-300"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
                Clear Filters
              </button>
            </div>
          )}
        </div>
        
      </div>

      {/* SDS Details Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={selectedRecord ? `SDS Details - ${selectedRecord.materialName}` : 'SDS Details'}
        size="xl"
      >
        {selectedRecord && (
          <div className="space-y-4">
            {/* Basic Information */}
            <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-6 mb-6 shadow-sm border border-gray-200">
              <div className="flex items-center gap-2 mb-5">
                <div className="w-1 h-6 bg-blue-600 rounded-full"></div>
                <h3 className="text-base font-bold text-gray-800">Basic Information</h3>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">SDS ID</p>
                  <p className="text-base font-semibold text-gray-900">#{selectedRecord.id}</p>
                </div>
                <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">Material ID</p>
                  <p className="text-base font-semibold text-gray-900 font-mono">{selectedRecord.materialId}</p>
                </div>
                <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">Source</p>
                  <p className="text-base font-semibold text-gray-900">{selectedRecord.source}</p>
                </div>
                <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">Uploaded Date</p>
                  <p className="text-base font-semibold text-gray-900">
                    {new Date(selectedRecord.uploadedDate).toLocaleDateString('en-US', { 
                      year: 'numeric', 
                      month: 'short', 
                      day: 'numeric' 
                    })}
                  </p>
                </div>
                {selectedRecord.partNumber && (
                  <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                    <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">Part Number</p>
                    <p className="text-base font-semibold text-gray-900">{selectedRecord.partNumber}</p>
                  </div>
                )}
                {selectedRecord.internalCode && (
                  <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                    <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">Internal Code</p>
                    <p className="text-base font-semibold text-gray-900 font-mono">{selectedRecord.internalCode}</p>
                  </div>
                )}
                {selectedRecord.sdsNumber && (
                  <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                    <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">SDS Number</p>
                    <p className="text-base font-semibold text-gray-900 font-mono">{selectedRecord.sdsNumber}</p>
                  </div>
                )}
                <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">Hazardous Waste</p>
                  <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${
                    selectedRecord.hazardousWaste 
                      ? 'bg-green-100 text-green-800 border border-green-200' 
                      : 'bg-red-100 text-red-800 border border-red-200'
                  }`}>
                    {selectedRecord.hazardousWaste ? 'Yes' : 'No'}
                  </span>
                </div>
                {selectedRecord.status && (
                  <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                    <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">Status</p>
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${
                      selectedRecord.status === 'Approved' ? 'bg-green-100 text-green-800 border border-green-200' :
                      selectedRecord.status === 'Rejected' ? 'bg-red-100 text-red-800 border border-red-200' :
                      'bg-yellow-100 text-yellow-800 border border-yellow-200'
                    }`}>
                      {selectedRecord.status}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Material Details */}
            {(selectedRecord.synonyms || selectedRecord.casNumber || selectedRecord.productType || 
              selectedRecord.intendedUse || selectedRecord.manufacturer) && (
              <div className="bg-gradient-to-br from-slate-50 to-slate-100 rounded-xl p-6 mb-6 shadow-sm border border-slate-200">
                <div className="flex items-center gap-2 mb-5">
                  <div className="w-1 h-6 bg-indigo-600 rounded-full"></div>
                  <h3 className="text-base font-bold text-gray-800">Material Details</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  {selectedRecord.synonyms && selectedRecord.synonyms.length > 0 && (
                    <div className="md:col-span-2 bg-white rounded-lg p-4 shadow-sm border border-gray-100">
                      <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">Synonyms</p>
                      <div className="flex flex-wrap gap-2">
                        {selectedRecord.synonyms.map((synonym, idx) => (
                          <span key={idx} className="inline-flex items-center px-3 py-1 bg-indigo-50 text-indigo-700 rounded-md text-sm font-medium border border-indigo-200">
                            {synonym}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                  {selectedRecord.casNumber && (
                    <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-100">
                      <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">CAS Number</p>
                      <p className="text-base font-semibold text-gray-900 font-mono">{selectedRecord.casNumber}</p>
                    </div>
                  )}
                  {selectedRecord.ecNumber && (
                    <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-100">
                      <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">EC Number</p>
                      <p className="text-base font-semibold text-gray-900 font-mono">{selectedRecord.ecNumber}</p>
                    </div>
                  )}
                  {selectedRecord.indexNumber && (
                    <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-100">
                      <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">Index Number</p>
                      <p className="text-base font-semibold text-gray-900 font-mono">{selectedRecord.indexNumber}</p>
                    </div>
                  )}
                  {selectedRecord.productType && (
                    <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-100">
                      <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">Product Type</p>
                      <p className="text-base font-semibold text-gray-900">{selectedRecord.productType}</p>
                    </div>
                  )}
                  {selectedRecord.intendedUse && (
                    <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-100">
                      <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">Intended Use</p>
                      <p className="text-base font-semibold text-gray-900">{selectedRecord.intendedUse}</p>
                    </div>
                  )}
                  {selectedRecord.manufacturer && (
                    <div className="md:col-span-2 bg-white rounded-lg p-4 shadow-sm border border-gray-100">
                      <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">Manufacturer</p>
                      <p className="text-base font-semibold text-gray-900 mb-1">{selectedRecord.manufacturer}</p>
                      {selectedRecord.manufacturerLocation && (
                        <p className="text-sm text-gray-600 inline-flex items-center gap-1">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                          </svg>
                          {selectedRecord.manufacturerLocation}
                        </p>
                      )}
                    </div>
                  )}
                  {selectedRecord.emergencyContact && (
                    <div className="md:col-span-2 bg-white rounded-lg p-4 shadow-sm border border-gray-100">
                      <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">Emergency Contact</p>
                      <p className="text-base font-semibold text-gray-900 inline-flex items-center gap-2">
                        <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                        </svg>
                        {selectedRecord.emergencyContact}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* AI Classification & Rationale */}
            <div className="bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 rounded-xl p-6 mb-6 shadow-sm border border-blue-200">
              <div className="flex items-center gap-2 mb-5">
                <div className="w-1 h-6 bg-gradient-to-b from-blue-600 to-indigo-600 rounded-full"></div>
                <h3 className="text-base font-bold text-gray-800">AI Classification & Rationale</h3>
              </div>
              <div className="space-y-5">
                <div className="bg-white rounded-lg p-5 shadow-sm border border-blue-100">
                  <p className="text-xs font-medium text-blue-600 uppercase tracking-wide mb-2">AI-Recommended DG Code</p>
                  <p className="text-lg font-bold text-gray-900 font-mono">{selectedRecord.aiRecommendedDGCode}</p>
                </div>
                <div className="bg-white rounded-lg p-5 shadow-sm border border-blue-100">
                  <p className="text-xs font-medium text-blue-600 uppercase tracking-wide mb-2">Rationale Summary</p>
                  <p className="text-sm leading-relaxed text-gray-800">{selectedRecord.rationaleSummary}</p>
                </div>
                {selectedRecord.ghsRationale && (
                  <div className="bg-white rounded-lg p-5 shadow-sm border border-blue-100">
                    <p className="text-xs font-medium text-blue-600 uppercase tracking-wide mb-3 flex items-center gap-2">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      GHS Rationale
                    </p>
                    <p className="text-sm leading-relaxed text-gray-800">{selectedRecord.ghsRationale}</p>
                  </div>
                )}
                {selectedRecord.dgRationale && (
                  <div className="bg-white rounded-lg p-5 shadow-sm border border-blue-100">
                    <p className="text-xs font-medium text-blue-600 uppercase tracking-wide mb-3 flex items-center gap-2">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                      </svg>
                      DG Rationale
                    </p>
                    <p className="text-sm leading-relaxed text-gray-800">{selectedRecord.dgRationale}</p>
                  </div>
                )}
                {selectedRecord.ghsPictograms && selectedRecord.ghsPictograms.length > 0 && (
                  <div className="bg-white rounded-lg p-5 shadow-sm border border-blue-100">
                    <p className="text-xs font-medium text-blue-600 uppercase tracking-wide mb-3">GHS Pictograms</p>
                    <div className="flex items-center flex-wrap gap-3">
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
                              className="w-12 h-12 rounded-lg flex items-center justify-center text-white text-sm shadow-md border-2 border-white hover:scale-110 transition-transform cursor-help"
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
            </div>

            {/* Feedback (if rejected) */}
            {selectedRecord.feedback && (
              <div className="bg-gradient-to-br from-red-50 to-rose-50 rounded-xl p-6 mb-6 shadow-sm border border-red-200">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-1 h-6 bg-red-600 rounded-full"></div>
                  <h3 className="text-base font-bold text-red-800 flex items-center gap-2">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                    Rejection Feedback
                  </h3>
                </div>
                <div className="bg-white rounded-lg p-5 shadow-sm border border-red-100">
                  <p className="text-sm leading-relaxed text-gray-800">{selectedRecord.feedback}</p>
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
          </div>
        )}
      </Modal>

      {/* PDF Viewer Modal */}
      <Modal
        isOpen={isPdfModalOpen}
        onClose={() => setIsPdfModalOpen(false)}
        title="SDS Sheet - PDF Viewer"
        size="xl"
      >
        <div className="w-full h-[calc(100vh-200px)]">
          <iframe
            src={currentPdfUrl}
            className="w-full h-full border-0"
            title="SDS PDF Viewer"
          />
        </div>
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

      {/* Create Raw Material Modal */}
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
                setCreateError(''); // Clear error on input change
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

          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
            <button
              onClick={handleCloseCreateModal}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleCreateMaterial}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 transition-colors"
            >
              Pull from RDS or WERCS
            </button>
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
        <div className="space-y-4">
          <div>
            <label htmlFor="rejectFeedback" className="block text-sm text-left font-medium text-gray-700 mb-2">
              Feedback <span className="text-red-500">*</span>
            </label>
            <textarea
              id="rejectFeedback"
              value={rejectFeedback}
              onChange={(e) => setRejectFeedback(e.target.value)}
              placeholder="Enter feedback for rejection..."
              rows={5}
              className="w-full px-4 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              autoFocus
            />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
            <button
              onClick={handleCloseRejectFeedbackModal}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleConfirmReject}
              disabled={!rejectFeedback.trim()}
              className={`px-4 py-2 text-sm font-medium text-white rounded-md transition-colors ${
                !rejectFeedback.trim()
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-red-600 hover:bg-red-700'
              }`}
            >
              Reject
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default Extenders;

