import { IngestedDocument } from '@/types';

export const mockDocuments: IngestedDocument[] = [
  {
    id: 'doc-002',
    filename: 'technical_spec_2026.pdf',
    productId: 'prod-xyz-450',
    productModel: 'XYZ-450',
    documentType: 'Datasheet',
    uploadedOn: '2026-08-18 10:45 AM',
    fileSize: '4.8 MB',
    version: 'v2.0',
    status: 'Processed',
    matchConfidence: 0.94,
    isSameProductDetected: true,
    detectedChangesSummary: 'Power upgraded (5.5 kW → 7.5 kW), Speed adjusted (1440 → 1460 RPM), Weight (42 → 45 kg)',
    pagesCount: 6,
    extractedAttributes: {
      'Model Number': 'XYZ-450-IE3',
      'Rated Output': '7.5 kW (10 HP)',
      'Rated Voltage': '415 V ±10% 3-Phase',
      'Synchronous Speed': '1460 RPM at 50Hz',
      'Protection Degree': 'IP55 Dust & Water Jet',
      'Gross Weight': '45.2 kg',
      'Full Load Efficiency': '91.2%',
      'Standard Compliance': 'IEC 60034-1 / IS 12615:2018'
    },
    sourceCitations: [
      { page: 1, snippet: 'XYZ-450 Premium Severe Duty 3-Phase TEFC Cast Iron Induction Motor 7.5kW rating.' },
      { page: 2, snippet: 'Electrical Characteristics: 415V AC 50Hz, 1460 RPM full load synchronous speed.' },
      { page: 4, snippet: 'Mechanical Outline: Frame 132M, Net Weight 45 kg, Enclosure IP55.' }
    ]
  },
  {
    id: 'doc-001',
    filename: 'motor_specs.pdf',
    productId: 'prod-xyz-450',
    productModel: 'XYZ-450',
    documentType: 'Datasheet',
    uploadedOn: '2024-03-15 02:14 PM',
    fileSize: '3.2 MB',
    version: 'v1.4',
    status: 'Processed',
    matchConfidence: 1.0,
    isSameProductDetected: true,
    detectedChangesSummary: 'Baseline product specification v1.4 archive',
    pagesCount: 4,
    extractedAttributes: {
      'Model Number': 'XYZ-450',
      'Rated Output': '5.5 kW (7.5 HP)',
      'Rated Voltage': '415 V 3-Phase',
      'Rated Speed': '1440 RPM',
      'Protection Degree': 'IP55',
      'Weight': '42 kg',
      'Efficiency': '89.6%'
    },
    sourceCitations: [
      { page: 1, snippet: 'Siemens XYZ-450 standard 5.5 kW 4-pole motor datasheet release 2024.' }
    ]
  },
  {
    id: 'doc-003',
    filename: 'certificate.pdf',
    productId: 'prod-xyz-450',
    productModel: 'XYZ-450',
    documentType: 'Certificate',
    uploadedOn: '2026-08-18 11:20 AM',
    fileSize: '1.4 MB',
    version: '-',
    status: 'Matched',
    matchConfidence: 0.98,
    isSameProductDetected: true,
    detectedChangesSummary: 'CE & IEC 60034 Conformity Certificate matched to XYZ-450',
    pagesCount: 2,
    extractedAttributes: {
      'Certificate ID': 'TUV-IND-2026-8841',
      'Standard': 'IEC 60034-1 / EN 60204-1',
      'Issued Date': '2026-01-15',
      'Valid Until': '2029-01-14',
      'Certifying Body': 'TÜV Rheinland Industrial Services'
    },
    sourceCitations: [
      { page: 1, snippet: 'Certificate of Compliance for Siemens XYZ series high efficiency motors.' }
    ]
  },
  {
    id: 'doc-004',
    filename: 'schneider_atv_drives_v3.pdf',
    productId: 'prod-abc-100',
    productModel: 'ABC-100',
    documentType: 'Datasheet',
    uploadedOn: '2026-07-10 09:30 AM',
    fileSize: '5.1 MB',
    version: 'v3.1',
    status: 'Processed',
    matchConfidence: 0.99,
    isSameProductDetected: true,
    pagesCount: 8,
    extractedAttributes: {
      'Model': 'ABC-100 Drive Controller',
      'Max Power Rating': '5.5 kW Continuous',
      'Nominal Current': '12.5 A',
      'Input Voltage': '380 - 460 V'
    },
    sourceCitations: [
      { page: 3, snippet: 'Maximum motor load capacity: 5.5 kW (7.5 HP) at 400/415 V supply.' }
    ]
  },
  {
    id: 'doc-005',
    filename: 'kirloskar_p200_pump_manual.pdf',
    productId: 'prod-pump-200',
    productModel: 'P-200-CENTRI',
    documentType: 'Manual',
    uploadedOn: '2026-06-22 04:15 PM',
    fileSize: '7.3 MB',
    version: 'v1.2',
    status: 'Processed',
    matchConfidence: 0.96,
    isSameProductDetected: true,
    pagesCount: 14,
    extractedAttributes: {
      'Pump Type': 'Centrifugal End-Suction',
      'Drive Power Required': '7.5 kW at 1450 RPM',
      'Operating Head': '32 meters',
      'Flow Rate': '65 m³/hr'
    },
    sourceCitations: [
      { page: 2, snippet: 'Prime mover requirement: 7.5 kW 4-pole motor operating at 1450-1480 RPM.' }
    ]
  },
  {
    id: 'doc-006',
    filename: 'supplier_catalog_abb_motors_2026.xlsx',
    productId: 'prod-abb-m3bp',
    productModel: 'M3BP-132SMA',
    documentType: 'Supplier Catalog',
    uploadedOn: '2026-08-01 11:00 AM',
    fileSize: '2.1 MB',
    version: 'v4.0',
    status: 'Processed',
    matchConfidence: 0.97,
    isSameProductDetected: true,
    pagesCount: 1,
    extractedAttributes: {
      'Supplier Model': 'M3BP 132 SMA 4',
      'Rated Output': '7.5 kW',
      'Price': '₹42,500',
      'Lead Time': '14 Days'
    },
    sourceCitations: [
      { page: 1, snippet: 'Line item 44: ABB M3BP 132 SMA 4-pole 7.5kW 415V IP56.' }
    ]
  }
];
