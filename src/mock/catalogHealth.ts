export interface CatalogHealthSummary {
  totalProducts: number;
  completeProducts: number;
  missingDataCount: number;
  conflictsCount: number;
  duplicatesCount: number;
  outdatedProductsCount: number;
  invalidUnitsCount: number;
  complianceIssuesCount: number;
  imageMismatchCount: number;
  brokenRelationshipsCount: number;
  lowConfidenceCount: number;
  overallHealthScore: number;
  healthTrend: { month: string; score: number; completeRate: number }[];
  categoryBreakdown: { category: string; count: number; healthScore: number }[];
  recentActivities: {
    id: string;
    type: 'upload' | 'version_detected' | 'conflict' | 'compliance' | 'supplier' | 'quote';
    title: string;
    description: string;
    timestamp: string;
    targetUrl: string;
    badgeText: string;
    badgeColor: string;
  }[];
}

export const initialCatalogHealth: CatalogHealthSummary = {
  totalProducts: 10000,
  completeProducts: 8200,
  missingDataCount: 800,
  conflictsCount: 350,
  duplicatesCount: 250,
  outdatedProductsCount: 300,
  invalidUnitsCount: 85,
  complianceIssuesCount: 63,
  imageMismatchCount: 42,
  brokenRelationshipsCount: 72,
  lowConfidenceCount: 38,
  overallHealthScore: 91,
  healthTrend: [
    { month: 'Mar', score: 78, completeRate: 68 },
    { month: 'Apr', score: 81, completeRate: 72 },
    { month: 'May', score: 84, completeRate: 75 },
    { month: 'Jun', score: 86, completeRate: 79 },
    { month: 'Jul', score: 89, completeRate: 80 },
    { month: 'Aug', score: 91, completeRate: 82 }
  ],
  categoryBreakdown: [
    { category: 'Electric Motors & Drives', count: 3200, healthScore: 94 },
    { category: 'Pumps & Fluid Handling', count: 2400, healthScore: 89 },
    { category: 'Control Valves & Actuators', count: 1800, healthScore: 92 },
    { category: 'Sensors & Instrumentation', count: 1400, healthScore: 88 },
    { category: 'Power Transmission & Couplings', count: 1200, healthScore: 90 }
  ],
  recentActivities: [
    {
      id: 'act-1',
      type: 'upload',
      title: 'New Technical Datasheet Ingested',
      description: 'technical_spec_2026.pdf processed for XYZ-450 (Match 94%)',
      timestamp: '10 mins ago',
      targetUrl: '/upload',
      badgeText: 'New Ingest',
      badgeColor: 'blue'
    },
    {
      id: 'act-2',
      type: 'version_detected',
      title: 'Product Version Upgrade Detected',
      description: 'XYZ-450 upgraded to v2.0 with 3 key electrical & mechanical changes',
      timestamp: '25 mins ago',
      targetUrl: '/synchronization',
      badgeText: 'Version Sync',
      badgeColor: 'amber'
    },
    {
      id: 'act-3',
      type: 'compliance',
      title: 'ATEX Certificate Expired',
      description: 'CE/ATEX certificate for XYZ-700 Explosion-Proof Motor expired',
      timestamp: '1 hour ago',
      targetUrl: '/compliance',
      badgeText: 'Expired',
      badgeColor: 'rose'
    },
    {
      id: 'act-4',
      type: 'conflict',
      title: 'Catalog Data Conflict Detected',
      description: 'Voltage mismatch for XYZ-450 (Datasheet: 415V vs Web: 440V vs ERP: 415V)',
      timestamp: '2 hours ago',
      targetUrl: '/catalog-issues',
      badgeText: 'Conflict',
      badgeColor: 'purple'
    },
    {
      id: 'act-5',
      type: 'supplier',
      title: 'Supplier Price & Lead Times Updated',
      description: 'ABB and WEG rate sheets re-indexed for 7.5 kW motor tier',
      timestamp: '3 hours ago',
      targetUrl: '/procurement',
      badgeText: 'Supplier Sync',
      badgeColor: 'emerald'
    },
    {
      id: 'act-6',
      type: 'quote',
      title: 'Automated RFQ Quote Generated',
      description: 'Quote Q-2026-9042 created for 20 units 5.5 kW / 415 V motors',
      timestamp: '4 hours ago',
      targetUrl: '/quotes',
      badgeText: 'Quotation',
      badgeColor: 'sky'
    }
  ]
};
