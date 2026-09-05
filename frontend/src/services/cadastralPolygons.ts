import { CadastralParcel } from '../types';

/**
 * Cadastral Parcel Geometry Service
 * Notice: These boundary coordinates represent integration-ready geometry templates
 * for land parcel boundary verification and are not legally binding cadastral surveys.
 */
export const MOCK_CADASTRAL_PARCELS: CadastralParcel[] = [
  {
    recordId: 'rec-201',
    displayId: 'LR-PUN-00124',
    ownerName: 'Rajesh Bharat Patil',
    surveyNumber: '124/3',
    village: 'Wagholi',
    taluka: 'Haveli',
    district: 'Pune',
    area: '2.45 Hectares',
    status: 'REVIEW_REQUIRED',
    center: [18.5793, 73.9832],
    isCitizenOwned: true, // Belongs to Rajesh Patil (Citizen)
    coordinates: [
      [18.5815, 73.9810],
      [18.5820, 73.9860],
      [18.5780, 73.9865],
      [18.5770, 73.9820],
      [18.5815, 73.9810]
    ]
  },
  {
    recordId: 'rec-202',
    displayId: 'LR-PUN-00087',
    ownerName: 'Sunil Mahadev Jadhav',
    surveyNumber: '87/1-A',
    village: 'Paud',
    taluka: 'Mulshi',
    district: 'Pune',
    area: '1.82 Hectares',
    status: 'APPROVED',
    center: [18.5292, 73.6125],
    isCitizenOwned: false,
    coordinates: [
      [18.5310, 73.6100],
      [18.5325, 73.6150],
      [18.5280, 73.6160],
      [18.5270, 73.6110],
      [18.5310, 73.6100]
    ]
  },
  {
    recordId: 'rec-203',
    displayId: 'LR-PUN-00094',
    ownerName: 'Kishore Anandrao Pawar',
    surveyNumber: '94/2',
    village: 'Malegaon',
    taluka: 'Baramati',
    district: 'Pune',
    area: '3.10 Hectares',
    status: 'REVIEW_REQUIRED',
    center: [18.1517, 74.5772],
    isCitizenOwned: false,
    coordinates: [
      [18.1540, 74.5740],
      [18.1555, 74.5800],
      [18.1500, 74.5810],
      [18.1485, 74.5750],
      [18.1540, 74.5740]
    ]
  },
  {
    recordId: 'rec-204',
    displayId: 'LR-PUN-00219',
    ownerName: 'M/s Greenfield Logistics Park',
    surveyNumber: '219/1-4',
    village: 'Chakan',
    taluka: 'Khed',
    district: 'Pune',
    area: '6.75 Hectares',
    status: 'APPROVED',
    center: [18.7606, 73.8540],
    isCitizenOwned: false,
    coordinates: [
      [18.7640, 73.8500],
      [18.7655, 73.8590],
      [18.7580, 73.8600],
      [18.7570, 73.8510],
      [18.7640, 73.8500]
    ]
  }
];

export const getParcelsForUser = (isCitizen: boolean, citizenName?: string, scope?: { state?: string; district?: string; taluka?: string; village?: string; }) => {
  if (isCitizen) {
    // Privacy restriction: Citizen sees only their own parcel
    return MOCK_CADASTRAL_PARCELS.filter(p => p.isCitizenOwned || (citizenName && p.ownerName.toLowerCase().includes(citizenName.toLowerCase())));
  }

  // Officer view: filter according to officer's authorized geographic jurisdiction
  return MOCK_CADASTRAL_PARCELS.filter(p => {
    if (scope?.district && p.district.toLowerCase() !== scope.district.toLowerCase()) return false;
    if (scope?.taluka && scope.taluka !== 'ALL' && p.taluka.toLowerCase() !== scope.taluka.toLowerCase()) return false;
    if (scope?.village && scope.village !== 'ALL' && p.village.toLowerCase() !== scope.village.toLowerCase()) return false;
    return true;
  });
};
