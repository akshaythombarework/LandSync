import { LandDocument, LandRecord, GisLocation, AuditLog, AnalyticsSummary, User } from '../types';

export const mockUsers: User[] = [
  {
    id: 'USR-001',
    name: 'Shri Vikram Deshmukh',
    email: 'vikram.deshmukh@gov.in',
    role: 'verification_officer',
    designation: 'Senior Revenue Verification Officer',
    scope: { country: 'India', state: 'Maharashtra', district: 'Pune', tehsil: 'Haveli', taluka: 'Haveli' }
  },
  {
    id: 'USR-002',
    name: 'Smt. Anita Sharma',
    email: 'anita.sharma@gov.in',
    role: 'district_officer',
    designation: 'District Revenue Officer / Collector',
    scope: { country: 'India', state: 'Maharashtra', district: 'Pune' }
  },
  {
    id: 'USR-003',
    name: 'Shri Suresh Gaikwad',
    email: 'suresh.gaikwad@gov.in',
    role: 'tehsildar',
    designation: 'Tehsildar & Executive Magistrate',
    scope: { country: 'India', state: 'Maharashtra', district: 'Pune', tehsil: 'Haveli', taluka: 'Haveli' }
  },
  {
    id: 'USR-004',
    name: 'Shri Ramesh More',
    email: 'ramesh.more@gov.in',
    role: 'talathi',
    designation: 'Talathi / Village Revenue Officer',
    scope: { country: 'India', state: 'Maharashtra', district: 'Pune', tehsil: 'Haveli', taluka: 'Haveli', village: 'Wagholi' }
  },
  {
    id: 'USR-005',
    name: 'Shri Arvind Kulkarni',
    email: 'arvind.kulkarni@gov.in',
    role: 'state_officer',
    designation: 'State Commissioner of Land Records',
    scope: { country: 'India', state: 'Maharashtra' }
  },
  {
    id: 'USR-006',
    name: 'Shri Mahesh Shinde',
    email: 'mahesh.shinde@gov.in',
    role: 'survey_officer',
    designation: 'Cadastral Survey & Measurement Officer',
    scope: { country: 'India', state: 'Maharashtra', district: 'Pune' }
  },
  {
    id: 'USR-007',
    name: 'Rajesh Bharat Patil',
    email: 'rajesh.patil@example.com',
    role: 'citizen',
    designation: 'Citizen / Landowner',
    onboardingCompleted: true,
    aadhaarMasked: 'XXXX-XXXX-4892',
    mobile: '+91 98220 12345',
    address: 'Plot 14, Survey 124/3, Wagholi, Haveli, Pune - 412207',
    gender: 'Male',
    scope: { country: 'India', state: 'Maharashtra', district: 'Pune', tehsil: 'Haveli', taluka: 'Haveli', village: 'Wagholi' }
  },
  {
    id: 'USR-008',
    name: 'System Administrator',
    email: 'admin.land@gov.in',
    role: 'admin',
    designation: 'Chief System Administrator',
    scope: { country: 'India', state: 'Maharashtra' }
  }
];

export const initialDocuments: LandDocument[] = [
  {
    id: 'doc-101',
    displayId: 'DOC-2026-001',
    fileName: '7_12_Extract_Haveli_Survey_124_3.pdf',
    fileType: 'pdf',
    fileSize: '2.4 MB',
    pageCount: 3,
    uploadedBy: 'Shri Vikram Deshmukh',
    uploadedAt: '2026-09-04 10:30 AM',
    language: 'Marathi',
    category: 'Land Record',
    status: 'REVIEW_REQUIRED',
    overallConfidence: 74,
  },
  {
    id: 'doc-102',
    displayId: 'DOC-2026-002',
    fileName: 'Khasra_Record_Mulshi_Plot_87.pdf',
    fileType: 'pdf',
    fileSize: '1.8 MB',
    pageCount: 2,
    uploadedBy: 'Smt. Anita Sharma',
    uploadedAt: '2026-09-04 09:15 AM',
    language: 'Hindi',
    category: 'Land Record',
    status: 'APPROVED',
    overallConfidence: 96,
  },
  {
    id: 'doc-103',
    displayId: 'DOC-2026-003',
    fileName: 'Mutation_Entry_Baramati_Register_94.jpg',
    fileType: 'jpg',
    fileSize: '3.1 MB',
    pageCount: 1,
    uploadedBy: 'Shri Vikram Deshmukh',
    uploadedAt: '2026-09-03 04:45 PM',
    language: 'Marathi',
    category: 'Mutation Record',
    status: 'REVIEW_REQUIRED',
    overallConfidence: 62,
  },
  {
    id: 'doc-104',
    displayId: 'DOC-2026-004',
    fileName: 'Sale_Deed_Pune_District_2019.pdf',
    fileType: 'pdf',
    fileSize: '4.7 MB',
    pageCount: 6,
    uploadedBy: 'Rajesh Patil',
    uploadedAt: '2026-09-02 02:20 PM',
    language: 'English',
    category: 'Ownership Record',
    status: 'APPROVED',
    overallConfidence: 94,
  },
  {
    id: 'doc-105',
    displayId: 'DOC-2026-005',
    fileName: 'Cadastral_Village_Map_Sheet_12.png',
    fileType: 'png',
    fileSize: '5.2 MB',
    pageCount: 1,
    uploadedBy: 'Shri Vikram Deshmukh',
    uploadedAt: '2026-09-01 11:10 AM',
    language: 'Auto Detect',
    category: 'Cadastral Map',
    status: 'VALIDATION_PENDING',
    overallConfidence: 81,
  }
];

export const initialRecords: LandRecord[] = [
  {
    id: 'rec-201',
    displayId: 'LR-PUN-00124',
    documentId: 'doc-101',
    ownerName: 'Rajesh Bharat Patil',
    fatherOrHusbandName: 'Bharat Ramchandra Patil',
    surveyNumber: '124/3',
    gatNumber: '124',
    hissaNumber: '3',
    khasraNumber: '124/3 (87-B)',
    khataNumber: '45',
    ulpin: 'MH27-045-89124-003',
    plotArea: 2.54,
    plotAreaUnit: 'hectare',
    potkharabaArea: 0.04,
    cultivableArea: 2.50,
    jirayatArea: 1.50,
    bagayatArea: 1.00,
    assessmentAmount: '₹ 14.80',
    waterSource: 'Well & Khadakwasla Canal Sub-branch',
    soilGrade: 'Medium Black (Class-1 / मध्यम काळी)',
    occupancyClass: 'Class-1 (भोगवटादार वर्ग - १, पूर्ण मालकी हक्क)',
    village: 'Wagholi',
    tehsil: 'Haveli',
    district: 'Pune',
    state: 'Maharashtra',
    revenueCircle: 'Wagholi Circle (सजा क्र. ३)',
    lgdCode: '556421',
    certificateNumber: 'MAHA-REV-2026-PUN-098421',
    digitalSignatureHash: 'SHA256:7f83b1657ff1fc53b92dc18148a1d65dfc2d4b1fa3d677284addd200126d9069',
    landClassification: 'Agricultural',
    ownershipType: 'Individual',
    mutationInfo: 'Mutation No. 4812 approved on 14-Feb-2021',
    registrationDate: '2021-02-14',
    status: 'APPROVED',
    overallConfidence: 96,
    createdAt: '2026-09-04 10:35 AM',
    updatedAt: '2026-09-05 01:17 AM',
    approvedAt: '2026-09-05 01:17 AM',
    approvedBy: 'Shri Vikram Deshmukh (SDO / Tehsildar)',
    latitude: 18.5793,
    longitude: 73.9832,
    coOwners: [
      { name: 'Sunita Rajesh Patil (सुनिता राजेश पाटील)', relation: 'Wife', share: '25%' },
      { name: 'Amit Rajesh Patil (अमित राजेश पाटील)', relation: 'Son', share: '25%' }
    ],
    encumbrances: [
      {
        institution: 'Bank of Maharashtra, Wagholi Branch',
        amount: '₹ 2,50,000',
        purpose: 'Kisan Credit Card (Crop Hypothecation)',
        mutationNo: '5102',
        date: '12-Nov-2023'
      }
    ],
    boundaries: {
      north: 'Gat No. 123 (Suresh Anandrao Kadam)',
      south: 'Gat No. 125 & Grampanchayat Nala Road',
      east: 'Gat No. 124/2 (Ramesh Bharat Patil)',
      west: 'Survey No. 126 (Irrigation Canal Sub-branch)'
    },
    crops: [
      { season: 'Kharif 2025–26', cropName: 'Sugarcane (ऊस)', area: '1.50 Ha', irrigationType: 'Perennial / Canal' },
      { season: 'Rabi 2025–26', cropName: 'Wheat / Gram (गहू व हरभरा)', area: '1.00 Ha', irrigationType: 'Well Irrigation' }
    ],
    mutationEntries: [
      { mutationNo: '4812', date: '14-Feb-2021', description: 'Succession & Title Mutation (वारस नोंद)', status: 'Approved & Certified' },
      { mutationNo: '5102', date: '12-Nov-2023', description: 'Agricultural Loan Hypothecation (बोजा नोंद)', status: 'Active Charge' }
    ],
    fields: {
      ownerName: {
        fieldName: 'ownerName',
        label: 'Landowner Name',
        value: 'Rajesh Bharat Patil',
        originalValue: 'राजेश भारत पाटील',
        confidence: 96,
        sourcePage: 1
      },
      surveyNumber: {
        fieldName: 'surveyNumber',
        label: 'Survey Number',
        value: '124/3',
        originalValue: '१२४/३',
        confidence: 92,
        sourcePage: 1
      },
      gatNumber: {
        fieldName: 'gatNumber',
        label: 'Gat Number',
        value: '124',
        originalValue: '१२४',
        confidence: 94,
        sourcePage: 1
      },
      khasraNumber: {
        fieldName: 'khasraNumber',
        label: 'Khasra Number',
        value: '124/3 (87-B)',
        originalValue: '८७-ब',
        confidence: 85,
        sourcePage: 2
      },
      khataNumber: {
        fieldName: 'khataNumber',
        label: 'Khata Number',
        value: '45',
        originalValue: '४५',
        confidence: 88,
        sourcePage: 1
      },
      plotArea: {
        fieldName: 'plotArea',
        label: 'Plot Area (Hectares)',
        value: 2.54,
        originalValue: '२.५४ हेक्टर',
        confidence: 96,
        sourcePage: 2
      },
      village: {
        fieldName: 'village',
        label: 'Village',
        value: 'Wagholi',
        originalValue: 'वाघोली',
        confidence: 97,
        sourcePage: 1
      },
      tehsil: {
        fieldName: 'tehsil',
        label: 'Tehsil / Taluka',
        value: 'Haveli',
        originalValue: 'हवेली',
        confidence: 98,
        sourcePage: 1
      },
      district: {
        fieldName: 'district',
        label: 'District',
        value: 'Pune',
        originalValue: 'पुणे',
        confidence: 99,
        sourcePage: 1
      },
      landClassification: {
        fieldName: 'landClassification',
        label: 'Land Classification',
        value: 'Agricultural',
        originalValue: 'जिरायत / शेती',
        confidence: 91,
        sourcePage: 2
      },
      ownershipType: {
        fieldName: 'ownershipType',
        label: 'Ownership Type',
        value: 'Individual',
        originalValue: 'एकल मालकी',
        confidence: 89,
        sourcePage: 1
      }
    },
    validationIssues: []
  },
  {
    id: 'rec-202',
    displayId: 'LR-PUN-00087',
    documentId: 'doc-102',
    ownerName: 'Sunil Mahadev Jadhav',
    fatherOrHusbandName: 'Mahadev Tukaram Jadhav',
    surveyNumber: '87/1-A',
    gatNumber: '87',
    hissaNumber: '1-A',
    khasraNumber: '87/1-A (112)',
    khataNumber: '89',
    ulpin: 'MH27-089-61087-001',
    plotArea: 1.82,
    plotAreaUnit: 'hectare',
    potkharabaArea: 0.02,
    cultivableArea: 1.80,
    jirayatArea: 1.20,
    bagayatArea: 0.60,
    assessmentAmount: '₹ 11.20',
    waterSource: 'Borewell & River Lift (मुळा-मुठा खोरे)',
    soilGrade: 'Loamy Medium (Class-2)',
    occupancyClass: 'Class-1 (भोगवटादार वर्ग - १)',
    village: 'Paud',
    tehsil: 'Mulshi',
    district: 'Pune',
    state: 'Maharashtra',
    revenueCircle: 'Paud Circle (सजा क्र. १)',
    lgdCode: '556108',
    certificateNumber: 'MAHA-REV-2026-MUL-041892',
    digitalSignatureHash: 'SHA256:3a91b2c45def6781290fa8bc43190e227189faec09817654bcdef90123456789',
    landClassification: 'Agricultural',
    ownershipType: 'Joint',
    mutationInfo: 'Mutation approved on 11-Jan-2025',
    registrationDate: '2025-01-11',
    status: 'APPROVED',
    overallConfidence: 96,
    createdAt: '2026-09-04 09:20 AM',
    updatedAt: '2026-09-04 09:45 AM',
    approvedAt: '2026-09-04 09:45 AM',
    approvedBy: 'Shri Vikram Deshmukh',
    latitude: 18.5292,
    longitude: 73.6125,
    coOwners: [
      { name: 'Laxmi Sunil Jadhav (लक्ष्मी सुनील जाधव)', relation: 'Wife', share: '50%' }
    ],
    encumbrances: [
      {
        institution: 'Pune District Central Cooperative Bank',
        amount: '₹ 1,20,000',
        purpose: 'Drip Irrigation Facility & Tubewell',
        mutationNo: '3188',
        date: '05-May-2024'
      }
    ],
    boundaries: {
      north: 'Gat No. 86 (Dnyaneshwar Shinde)',
      south: 'Gat No. 88 (Forest Buffer Line)',
      east: 'Paud-Mulshi Public Road (PWD)',
      west: 'Gat No. 87/1-B (Tukaram Jadhav)'
    },
    crops: [
      { season: 'Kharif 2025–26', cropName: 'Paddy / Rice (भात)', area: '1.20 Ha', irrigationType: 'Rainfed' },
      { season: 'Rabi 2025–26', cropName: 'Vegetables & Fodder (भाजीपाला)', area: '0.60 Ha', irrigationType: 'Borewell' }
    ],
    mutationEntries: [
      { mutationNo: '2980', date: '11-Jan-2025', description: 'Family Partition & Title Demarcation (कुटुंब वाटणी)', status: 'Approved & Certified' },
      { mutationNo: '3188', date: '05-May-2024', description: 'Cooperative Bank Loan Entry', status: 'Active Charge' }
    ],
    fields: {
      ownerName: { fieldName: 'ownerName', label: 'Landowner Name', value: 'Sunil Mahadev Jadhav', originalValue: 'सुनील महादेव जाधव', confidence: 98, sourcePage: 1 },
      surveyNumber: { fieldName: 'surveyNumber', label: 'Survey Number', value: '87/1-A', originalValue: '८७/१-अ', confidence: 95, sourcePage: 1 },
      gatNumber: { fieldName: 'gatNumber', label: 'Gat Number', value: '87', originalValue: '८७', confidence: 97, sourcePage: 1 },
      khasraNumber: { fieldName: 'khasraNumber', label: 'Khasra Number', value: '87/1-A (112)', originalValue: '११२', confidence: 92, sourcePage: 1 },
      khataNumber: { fieldName: 'khataNumber', label: 'Khata Number', value: '89', originalValue: '८९', confidence: 94, sourcePage: 1 },
      plotArea: { fieldName: 'plotArea', label: 'Plot Area', value: 1.82, originalValue: '1.82 Hectares', confidence: 96, sourcePage: 1 },
      village: { fieldName: 'village', label: 'Village', value: 'Paud', originalValue: 'पौड', confidence: 99, sourcePage: 1 },
      tehsil: { fieldName: 'tehsil', label: 'Tehsil', value: 'Mulshi', originalValue: 'मुळशी', confidence: 97, sourcePage: 1 },
      district: { fieldName: 'district', label: 'District', value: 'Pune', originalValue: 'पुणे', confidence: 99, sourcePage: 1 },
      landClassification: { fieldName: 'landClassification', label: 'Land Classification', value: 'Agricultural', originalValue: 'शेती', confidence: 95, sourcePage: 1 }
    },
    validationIssues: []
  },
  {
    id: 'rec-203',
    displayId: 'LR-PUN-00094',
    documentId: 'doc-103',
    ownerName: 'Kishore Anandrao Pawar',
    surveyNumber: '94/2',
    khasraNumber: '44',
    khataNumber: '118',
    plotArea: 3.10,
    plotAreaUnit: 'hectare',
    village: 'Malegaon',
    tehsil: 'Baramati',
    district: 'Pune',
    state: 'Maharashtra',
    landClassification: 'Agricultural',
    ownershipType: 'Individual',
    mutationInfo: 'Pending mutation entry',
    status: 'REVIEW_REQUIRED',
    overallConfidence: 62,
    createdAt: '2026-09-03 04:55 PM',
    updatedAt: '2026-09-03 04:55 PM',
    latitude: 18.1517,
    longitude: 74.5772,
    fields: {
      ownerName: { fieldName: 'ownerName', label: 'Landowner Name', value: 'Kishore Anandrao Pawar', originalValue: 'किशोर आनंदराव पवार', confidence: 64, sourcePage: 1 },
      surveyNumber: { fieldName: 'surveyNumber', label: 'Survey Number', value: '94/2', originalValue: '९४/२', confidence: 88, sourcePage: 1 },
      plotArea: { fieldName: 'plotArea', label: 'Plot Area', value: 3.10, originalValue: '३.१० हे.', confidence: 61, sourcePage: 1 },
      village: { fieldName: 'village', label: 'Village', value: 'Malegaon', originalValue: 'माळेगाव', confidence: 95, sourcePage: 1 },
      tehsil: { fieldName: 'tehsil', label: 'Tehsil', value: 'Baramati', originalValue: 'बारामती', confidence: 96, sourcePage: 1 },
      district: { fieldName: 'district', label: 'District', value: 'Pune', originalValue: 'पुणे', confidence: 99, sourcePage: 1 }
    },
    validationIssues: [
      {
        id: 'val-003',
        ruleCode: 'POSSIBLE_DUPLICATE',
        fieldName: 'surveyNumber',
        severity: 'warning',
        status: 'WARNING',
        message: 'Potential duplicate survey record detected in Malegaon village records.'
      }
    ]
  },
  {
    id: 'rec-204',
    displayId: 'LR-PUN-00219',
    documentId: 'doc-104',
    ownerName: 'M/s Greenfield Logistics Park',
    surveyNumber: '219/1-4',
    khasraNumber: '310',
    khataNumber: '502',
    plotArea: 6.75,
    plotAreaUnit: 'hectare',
    village: 'Chakan',
    tehsil: 'Khed',
    district: 'Pune',
    state: 'Maharashtra',
    landClassification: 'Commercial',
    ownershipType: 'Institutional',
    registrationDate: '2019-11-20',
    status: 'APPROVED',
    overallConfidence: 94,
    createdAt: '2026-09-02 02:35 PM',
    updatedAt: '2026-09-02 03:00 PM',
    approvedAt: '2026-09-02 03:00 PM',
    approvedBy: 'Smt. Anita Sharma',
    latitude: 18.7606,
    longitude: 73.8540,
    fields: {
      ownerName: { fieldName: 'ownerName', label: 'Landowner Name', value: 'M/s Greenfield Logistics Park', originalValue: 'M/s Greenfield Logistics Park', confidence: 95, sourcePage: 1 },
      surveyNumber: { fieldName: 'surveyNumber', label: 'Survey Number', value: '219/1-4', originalValue: '219/1-4', confidence: 94, sourcePage: 2 },
      plotArea: { fieldName: 'plotArea', label: 'Plot Area', value: 6.75, originalValue: '6.75 Hectares', confidence: 96, sourcePage: 3 },
      village: { fieldName: 'village', label: 'Village', value: 'Chakan', originalValue: 'Chakan', confidence: 98, sourcePage: 1 },
      tehsil: { fieldName: 'tehsil', label: 'Tehsil', value: 'Khed', originalValue: 'Khed', confidence: 97, sourcePage: 1 },
      district: { fieldName: 'district', label: 'District', value: 'Pune', originalValue: 'Pune', confidence: 99, sourcePage: 1 }
    },
    validationIssues: []
  }
];

export const initialGisLocations: GisLocation[] = [
  {
    recordId: 'rec-201',
    displayId: 'LR-PUN-00124',
    ownerName: 'Rajesh Bharat Patil',
    surveyNumber: '124/3',
    village: 'Wagholi',
    tehsil: 'Haveli',
    district: 'Pune',
    area: '2.45 Hectares',
    status: 'REVIEW_REQUIRED',
    latitude: 18.5793,
    longitude: 73.9832
  },
  {
    recordId: 'rec-202',
    displayId: 'LR-PUN-00087',
    ownerName: 'Sunil Mahadev Jadhav',
    surveyNumber: '87/1-A',
    village: 'Paud',
    tehsil: 'Mulshi',
    district: 'Pune',
    area: '1.82 Hectares',
    status: 'APPROVED',
    latitude: 18.5292,
    longitude: 73.6125
  },
  {
    recordId: 'rec-203',
    displayId: 'LR-PUN-00094',
    ownerName: 'Kishore Anandrao Pawar',
    surveyNumber: '94/2',
    village: 'Malegaon',
    tehsil: 'Baramati',
    district: 'Pune',
    area: '3.10 Hectares',
    status: 'REVIEW_REQUIRED',
    latitude: 18.1517,
    longitude: 74.5772
  },
  {
    recordId: 'rec-204',
    displayId: 'LR-PUN-00219',
    ownerName: 'M/s Greenfield Logistics Park',
    surveyNumber: '219/1-4',
    village: 'Chakan',
    tehsil: 'Khed',
    district: 'Pune',
    area: '6.75 Hectares',
    status: 'APPROVED',
    latitude: 18.7606,
    longitude: 73.8540
  }
];

export const initialAuditLogs: AuditLog[] = [
  {
    id: 'aud-001',
    timestamp: '2026-09-04 10:30 AM',
    userName: 'Shri Vikram Deshmukh',
    userRole: 'verification_officer',
    action: 'DOCUMENT_UPLOADED',
    entityType: 'document',
    entityId: 'DOC-2026-001',
    description: 'Uploaded 7/12 Extract for Wagholi village (Haveli Tehsil).'
  },
  {
    id: 'aud-002',
    timestamp: '2026-09-04 10:32 AM',
    userName: 'System AI Worker',
    userRole: 'admin',
    action: 'OCR_EXTRACTION_COMPLETED',
    entityType: 'document',
    entityId: 'DOC-2026-001',
    description: 'Extracted 10 fields; flagged Plot Area with 58% confidence.'
  },
  {
    id: 'aud-003',
    timestamp: '2026-09-04 10:33 AM',
    userName: 'System Validation Engine',
    userRole: 'admin',
    action: 'VALIDATION_EXECUTED',
    entityType: 'record',
    entityId: 'LR-PUN-00124',
    description: 'Validation failed with 2 warnings. Routed to Verification Queue.'
  },
  {
    id: 'aud-004',
    timestamp: '2026-09-04 09:45 AM',
    userName: 'Shri Vikram Deshmukh',
    userRole: 'verification_officer',
    action: 'RECORD_APPROVED',
    entityType: 'record',
    entityId: 'LR-PUN-00087',
    description: 'Approved record for Paud village after manual review.'
  },
  {
    id: 'aud-005',
    timestamp: '2026-09-02 03:00 PM',
    userName: 'Smt. Anita Sharma',
    userRole: 'district_officer',
    action: 'RECORD_APPROVED',
    entityType: 'record',
    entityId: 'LR-PUN-00219',
    description: 'Verified commercial land classification and approved record.'
  }
];

export const initialAnalytics: AnalyticsSummary = {
  totalDocuments: 1248,
  processed: 1165,
  pendingVerification: 83,
  approved: 1031,
  validationIssues: 134,
  averageConfidence: 91.4
};
