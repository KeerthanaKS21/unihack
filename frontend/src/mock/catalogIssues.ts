import { CatalogIssue } from '@/types';

export const initialCatalogIssues: CatalogIssue[] = [
  {
    id: 'iss-001',
    productId: 'prod-xyz-450',
    productModel: 'XYZ-450',
    issueType: 'conflict',
    field: 'Rated Voltage',
    title: 'Cross-System Voltage Conflict for XYZ-450',
    description: 'Three internal source records report diverging electrical supply ratings for XYZ-450.',
    sources: [
      { sourceName: 'Verified OEM Datasheet (PDF v2.0)', value: '415 V', priority: 'high', confidence: 0.99 },
      { sourceName: 'SAP ERP Material Master Record', value: '415 V', priority: 'high', confidence: 0.96 },
      { sourceName: 'B2B Web Storefront Catalog', value: '440 V', priority: 'medium', confidence: 0.82 }
    ],
    aiRecommendation: {
      suggestedValue: '415 V',
      reasoning: '2 high-priority verified systems (OEM Engineering Datasheet & SAP ERP Master) concordantly specify 415 V 3-Phase 50Hz standard grid rating. Storefront 440 V is a legacy regional typo.',
      confidence: 0.96,
      standardReference: 'IS 12615 / IEC 60034-1 Standard Supply Grid'
    },
    status: 'open'
  },
  {
    id: 'iss-002',
    productId: 'prod-xyz-450',
    productModel: 'XYZ-450',
    issueType: 'missing',
    field: 'Full Load Efficiency',
    title: 'Missing Efficiency Metric for XYZ-450',
    description: 'Efficiency rating field is blank in catalog database, preventing mandatory green energy categorization.',
    sources: [
      { sourceName: 'Database Attribute Store', value: '<NULL / Empty>', priority: 'high', confidence: 1.0 },
      { sourceName: 'technical_spec_2026.pdf (Page 2)', value: '91.2% at full load', priority: 'high', confidence: 0.98 }
    ],
    aiRecommendation: {
      suggestedValue: '91.2% (IE3)',
      reasoning: 'Extracted with 98% confidence from newly ingested technical_spec_2026.pdf Section 3.2. Conforms to IEC 60034-30 standard curve for 7.5 kW 4-pole induction motors.',
      confidence: 0.98,
      standardReference: 'IEC 60034-30-1 Premium Efficiency Standards'
    },
    status: 'open'
  },
  {
    id: 'iss-003',
    productId: 'prod-xyz-450',
    productModel: 'XYZ-450 vs SIEM-XYZ-450-IND',
    issueType: 'duplicate',
    field: 'Product Record Entity',
    title: '96% Duplicate Product Entity Detected',
    description: 'Legacy SAP material entry "SIEM-XYZ-450-IND" duplicates master record "XYZ-450".',
    sources: [
      { sourceName: 'Master Catalog Record (XYZ-450)', value: 'Active Master', priority: 'high', confidence: 1.0 },
      { sourceName: 'Imported Vendor Catalog (SIEM-XYZ-450-IND)', value: 'Duplicate Candidate', priority: 'medium', confidence: 0.96 }
    ],
    aiRecommendation: {
      suggestedValue: 'Merge into Master Record (XYZ-450)',
      reasoning: 'Same frame size (132M), manufacturer (Siemens), power rating (7.5 kW), and terminal mount. Sourcing aliases can be preserved in alternate SKU index.',
      confidence: 0.96
    },
    status: 'open'
  },
  {
    id: 'iss-004',
    productId: 'prod-xyz-520',
    productModel: 'XYZ-520',
    issueType: 'invalid_unit',
    field: 'Nominal Speed',
    title: 'Invalid Unit of Measurement ("Hz" instead of "RPM")',
    description: 'Speed attribute value is recorded as "1500 Hz" instead of rotational speed in "RPM".',
    sources: [
      { sourceName: 'Legacy ERP Migration Batch', value: '1500 Hz', priority: 'medium', confidence: 0.90 }
    ],
    aiRecommendation: {
      suggestedValue: '1500 RPM',
      reasoning: 'Speed unit syntax normalized from frequency unit "Hz" to rotational velocity "RPM" based on 4-pole synchronous standard.',
      confidence: 0.99,
      standardReference: 'SI Metric & ISO 80000-3'
    },
    status: 'open'
  },
  {
    id: 'iss-005',
    productId: 'prod-abc-100',
    productModel: 'ABC-100',
    issueType: 'wrong_category',
    field: 'Primary Taxonomy Category',
    title: 'Misclassified Product Taxonomy',
    description: 'VFD Speed Controller ABC-100 is classified under "Mechanical Couplings & Belts".',
    sources: [
      { sourceName: 'Current Store Taxonomy', value: 'Mechanical Couplings', priority: 'medium', confidence: 0.85 }
    ],
    aiRecommendation: {
      suggestedValue: 'Electrical Drives & Inverters > Variable Frequency Drives',
      reasoning: 'Natural language analysis of product title "Variable Frequency Drive" and electrical specs indicates 99.8% affinity with VFD category.',
      confidence: 0.99
    },
    status: 'open'
  },
  {
    id: 'iss-006',
    productId: 'prod-xyz-300',
    productModel: 'XYZ-300',
    issueType: 'outdated',
    field: 'Lifecycle Status',
    title: 'Superseded / End-of-Life SKU Listed as Active',
    description: 'XYZ-300 motor series was superseded by XYZ-350 in 2025 OEM catalog release.',
    sources: [
      { sourceName: 'Siemens 2025 Lifecycle Notice', value: 'Phase-out End-of-Life', priority: 'high', confidence: 0.98 }
    ],
    aiRecommendation: {
      suggestedValue: 'Mark Superseded & Redirect to XYZ-350',
      reasoning: 'OEM discontinued manufacturing. Retain technical specs for legacy replacements but remove from primary public search and route to XYZ-350.',
      confidence: 0.97
    },
    status: 'open'
  },
  {
    id: 'iss-007',
    productId: 'prod-xyz-450',
    productModel: 'XYZ-450',
    issueType: 'compliance',
    field: 'Safety & Environmental Certification',
    title: 'Missing CE & RoHS Compliance Linkage',
    description: 'Product lacks verified certificate attachment for export compliance.',
    sources: [
      { sourceName: 'Compliance Registry', value: 'Unlinked / Missing Doc', priority: 'high', confidence: 1.0 }
    ],
    aiRecommendation: {
      suggestedValue: 'Attach Certificate TUV-IND-2026-8841',
      reasoning: 'Newly matched certificate.pdf (ID: TUV-IND-2026-8841) validates CE and RoHS compliance with 98% confidence.',
      confidence: 0.98
    },
    status: 'open'
  },
  {
    id: 'iss-008',
    productId: 'prod-pump-200',
    productModel: 'P-200-CENTRI',
    issueType: 'broken_relationship',
    field: 'Accessory Relationship',
    title: 'Broken Accessory Link to Retired Coupling SKU',
    description: 'Pump specifies accessory coupling SKU CP-30 which is no longer in active catalog.',
    sources: [
      { sourceName: 'BOM Relationship Index', value: 'SKU CP-30 (Deleted)', priority: 'high', confidence: 1.0 }
    ],
    aiRecommendation: {
      suggestedValue: 'Link to Upgraded Coupling SKU CP-50',
      reasoning: 'CP-50 is the direct form-fit-function successor supporting 38mm shaft diameter and 7.5 kW torque rating.',
      confidence: 0.95
    },
    status: 'open'
  },
  {
    id: 'iss-009',
    productId: 'prod-xyz-800',
    productModel: 'XYZ-800',
    issueType: 'image_mismatch',
    field: 'Product Gallery Image',
    title: 'Visual Mismatch: 3-Phase Terminal Box on Single-Phase SKU',
    description: 'Image classifier detected a 6-terminal 3-phase junction box in the hero image for single-phase motor XYZ-800.',
    sources: [
      { sourceName: 'Computer Vision Attribute Inspector', value: '3-Phase Terminal Detected', priority: 'medium', confidence: 0.92 }
    ],
    aiRecommendation: {
      suggestedValue: 'Replace with Verified 1-Phase Motor CAD Render img-xyz800-single.png',
      reasoning: 'Image mismatch can mislead industrial buyers. CAD render from OEM library matches verified single-phase dual-capacitor casing.',
      confidence: 0.94
    },
    status: 'open'
  }
];
