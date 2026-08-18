import { ChangeImpact } from '@/types';

export const initialChangeImpacts: ChangeImpact[] = [
  {
    id: 'imp-001',
    productId: 'prod-xyz-450',
    productName: 'XYZ-450 Industrial Motor',
    changeDescription: 'Rated Power upgraded from 5.5 kW to 7.5 kW',
    domain: 'Compatibility',
    title: 'Drive Controller Capacity Exceeded',
    explanation: 'Controller ABC-100 is rated for 5.5 kW max continuous load. Connecting the updated 7.5 kW motor will trigger thermal overload tripping unless derated or upgraded to ABC-200.',
    contextEvidence: 'Paired in 14 active plant BOM configurations; ABC-100 max current is 12.5A whereas XYZ-450 7.5kW draws 15.2A full load.',
    severity: 'critical',
    reviewed: false,
    targetModuleUrl: '/compatibility'
  },
  {
    id: 'imp-002',
    productId: 'prod-xyz-450',
    productName: 'XYZ-450 Industrial Motor',
    changeDescription: 'Power, Speed & Weight specifications modified in v2.0',
    domain: 'E-commerce',
    title: 'Product Catalog Spec & Faceted Filter Mismatch',
    explanation: 'B2B storefront currently lists XYZ-450 under the "5.0 - 5.5 kW" search filter facet. The product page hero spec table and downloadable legacy datasheet link require immediate synchronization.',
    contextEvidence: 'Current live website SKU SKU-MOT-XYZ450 has 1,420 monthly visits; filter bucket "5.5 kW Motors" returns this SKU.',
    severity: 'high',
    reviewed: false,
    targetModuleUrl: '/ecommerce'
  },
  {
    id: 'imp-003',
    productId: 'prod-xyz-450',
    productName: 'XYZ-450 Industrial Motor',
    changeDescription: 'Rated Power upgraded from 5.5 kW to 7.5 kW',
    domain: 'Procurement',
    title: 'Supplier Comparison & Price Baseline Invalidation',
    explanation: 'Existing supplier matrix compares XYZ-450 against WEG 5.5 kW and ABB 5.5 kW models. Sourcing comparisons must be re-anchored to 7.5 kW tier price points (₹40,000 - ₹48,000).',
    contextEvidence: '3 preferred vendor rate contracts reference the old 5.5 kW model pricing baseline at ₹34,500.',
    severity: 'medium',
    reviewed: false,
    targetModuleUrl: '/procurement'
  },
  {
    id: 'imp-004',
    productId: 'prod-xyz-450',
    productName: 'XYZ-450 Industrial Motor',
    changeDescription: 'Power upgraded (7.5 kW) & Speed changed (1460 RPM)',
    domain: 'Quote',
    title: 'Open Quotation Templates Contain Obsolete Specs',
    explanation: '3 open customer quotation drafts reference XYZ-450 at 5.5 kW with unit price ₹36,000. Quotes sent without updating to 7.5 kW / ₹41,200 may cause legal specification warranty disputes.',
    contextEvidence: 'Quotation Q-2026-8890 for Apex Heavy Engineering contains 20 units of XYZ-450 with 5.5 kW delivery schedule.',
    severity: 'high',
    reviewed: false,
    targetModuleUrl: '/quotes'
  },
  {
    id: 'imp-005',
    productId: 'prod-xyz-450',
    productName: 'XYZ-450 Industrial Motor',
    changeDescription: 'Frame size shift from 132S to 132M (42kg → 45kg)',
    domain: 'Recommendations',
    title: 'Cross-Sell & Pump Coupling Recommendation Recheck',
    explanation: 'Recommendation engine pairs XYZ-450 with baseplate B-132S and flexible coupling CP-40. The updated 132M frame requires coupling CP-50 to match the 38mm shaft diameter.',
    contextEvidence: 'AI recommendation model rule #881: Induction Motor Frame matching coupling bore tolerance.',
    severity: 'low',
    reviewed: true,
    reviewedAt: '2026-08-18 11:30 AM',
    reviewedBy: 'Priya Sharma (Catalog QA)',
    targetModuleUrl: '/compatibility'
  },
  {
    id: 'imp-006',
    productId: 'prod-xyz-450',
    productName: 'XYZ-450 Industrial Motor',
    changeDescription: 'IE3 Premium Efficiency 91.2% certified',
    domain: 'Recommendations',
    title: 'Green Energy Subsidy Tag Eligibility',
    explanation: 'Upgrading efficiency to 91.2% (IE3) qualifies the SKU for the National Energy Efficiency Scheme subsidy listing on the catalog.',
    contextEvidence: 'Bureau of Energy Efficiency (BEE) 3-star rating standard table 2026.',
    severity: 'low',
    reviewed: true,
    reviewedAt: '2026-08-18 11:35 AM',
    reviewedBy: 'Priya Sharma (Catalog QA)',
    targetModuleUrl: '/catalog-issues'
  }
];
