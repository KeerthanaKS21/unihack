import { ComplianceRecord } from '@/types';

export const initialComplianceRecords: ComplianceRecord[] = [
  {
    id: 'comp-001',
    productId: 'prod-xyz-450',
    productModel: 'XYZ-450',
    standard: 'IEC 60034-1 & CE Machinery Directive',
    certificateNumber: 'PENDING_LINKAGE',
    issueType: 'Missing',
    issueDescription: 'Mandatory CE declaration of conformity & low voltage directive certificate missing from active product record.',
    issueDate: '2026-08-18',
    expiryDate: '2029-01-14',
    status: 'Action Required',
    aiConfidence: 0.98,
    aiRecommendation: 'Auto-link matched certificate.pdf (ID: TUV-IND-2026-8841) ingested today. Certificate verifies full compliance with IEC 60034-1 / EN 60204-1 standards with 98% model match confidence.',
    manufacturer: 'Siemens Industrial Automation'
  },
  {
    id: 'comp-002',
    productId: 'prod-xyz-500',
    productModel: 'XYZ-500',
    standard: 'Ingress Protection (IEC 60529)',
    certificateNumber: 'IP-TEST-2025-4190',
    issueType: 'Conflict',
    issueDescription: 'Catalog lists IP55 enclosure protection while NABL third-party test report cert claims IP65 certification.',
    issueDate: '2025-11-10',
    expiryDate: '2028-11-09',
    status: 'Under Review',
    aiConfidence: 0.94,
    aiRecommendation: 'Audit manufacturer seal spec. Lab test verified IP65 with rubber shaft seals. Recommend upgrading catalog spec to IP65 to expand severe-duty sales eligibility.',
    manufacturer: 'Siemens Industrial Automation'
  },
  {
    id: 'comp-003',
    productId: 'prod-xyz-700',
    productModel: 'XYZ-700 Explosion-Proof',
    standard: 'ATEX Directive 2014/34/EU & IECEx',
    certificateNumber: 'INERIS-16-ATEX-0022X',
    issueType: 'Expired',
    issueDescription: 'Hazardous area explosive atmosphere certification expired on 2026-06-30. Product cannot be quoted for Zone 1/21 gas/dust environments.',
    issueDate: '2021-07-01',
    expiryDate: '2026-06-30',
    status: 'Non-Compliant',
    aiConfidence: 0.99,
    aiRecommendation: 'Direct OEM inquiry to Siemens Compliance Portal. Siemens issued replacement certificate INERIS-26-ATEX-0089X on July 15, 2026. Request automated ingestion.',
    manufacturer: 'Siemens Industrial Automation'
  },
  {
    id: 'comp-004',
    productId: 'prod-xyz-850',
    productModel: 'XYZ-850 High-Temp Motor',
    standard: 'Ambient Operating Range (IS 12615)',
    certificateNumber: 'UNSPECIFIED',
    issueType: 'Missing',
    issueDescription: 'Ambient operating temperature certification field is blank for high-ambient foundry model.',
    issueDate: '2026-08-01',
    expiryDate: '2027-08-01',
    status: 'Action Required',
    aiConfidence: 0.91,
    aiRecommendation: 'Extract +60°C de-rating curve from OEM thermal test dossier dossier_xyz850_thermo.pdf page 5.',
    manufacturer: 'Siemens Industrial Automation'
  },
  {
    id: 'comp-005',
    productId: 'prod-weg-w22',
    productModel: 'W22-IE4-7.5',
    standard: 'ISO 9001:2015 & IEC 60034-30-1',
    certificateNumber: 'BR-2024-WEG-9912',
    issueType: 'Valid',
    issueDescription: 'Super Premium Efficiency and Quality management fully validated.',
    issueDate: '2024-04-10',
    expiryDate: '2027-04-09',
    status: 'Compliant',
    aiConfidence: 1.0,
    aiRecommendation: 'All compliance criteria met. Validated for international export and industrial energy rebate claims.',
    manufacturer: 'WEG Industries'
  }
];
