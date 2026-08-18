export type SeverityLevel = 'low' | 'medium' | 'high' | 'critical';

export interface ProductSpec {
  power: string;
  voltage: string;
  speed: string;
  frequency: string;
  ipRating: string;
  weight: string;
  efficiency?: string;
  mountType?: string;
  frameSize?: string;
  insulationClass?: string;
  operatingTemp?: string;
  certifications?: string[];
}

export interface ProductVersion {
  version: string;
  releaseDate: string;
  specs: ProductSpec;
  sourceDocId: string;
  sourceDocName: string;
  verifiedBy: string;
  status: 'verified' | 'superseded' | 'draft';
}

export interface ProductChange {
  id: string;
  productId: string;
  productName: string;
  attribute: string;
  oldValue: string;
  newValue: string;
  detectedAt: string;
  sourceDocument: string;
  confidence: number;
  status: 'pending' | 'approved' | 'rejected';
}

export interface ChangeImpact {
  id: string;
  productId: string;
  productName: string;
  changeDescription: string;
  domain: 'Compatibility' | 'E-commerce' | 'Procurement' | 'Quote' | 'Recommendations';
  title: string;
  explanation: string;
  contextEvidence: string;
  severity: SeverityLevel;
  reviewed: boolean;
  reviewedAt?: string;
  reviewedBy?: string;
  targetModuleUrl: string;
}

export interface Product {
  id: string;
  model: string;
  name: string;
  manufacturer: string;
  category: string;
  currentVersion: string;
  previousVersion: string;
  confidence: number;
  healthScore: number;
  status: 'active' | 'review_required' | 'synchronized' | 'conflict';
  specs: ProductSpec;
  previousSpecs: ProductSpec;
  versions: ProductVersion[];
  sourceDocumentIds: string[];
  imageUrl: string;
  description: string;
  changesDetected: number;
  impactsPending: number;
}

export interface IngestedDocument {
  id: string;
  filename: string;
  productId?: string;
  productModel?: string;
  documentType: 'Datasheet' | 'Certificate' | 'Supplier Catalog' | 'Manual' | 'CAD/Drawing' | 'Excel Spec';
  uploadedOn: string;
  fileSize: string;
  version?: string;
  status: 'Uploading' | 'Processing' | 'Matched' | 'Processed' | 'Action Required';
  matchConfidence: number;
  isSameProductDetected: boolean;
  detectedChangesSummary?: string;
  pagesCount: number;
  extractedAttributes: Record<string, string>;
  sourceCitations: { page: number; snippet: string; boundingBox?: string }[];
  extractedText?: string;
}

export interface CatalogIssue {
  id: string;
  productId: string;
  productModel: string;
  issueType: 
    | 'missing' 
    | 'conflict' 
    | 'duplicate' 
    | 'invalid_unit' 
    | 'wrong_category' 
    | 'outdated' 
    | 'compliance' 
    | 'broken_relationship' 
    | 'image_mismatch';
  field: string;
  title: string;
  description: string;
  sources: { sourceName: string; value: string; priority: 'high' | 'medium' | 'low'; confidence: number }[];
  aiRecommendation: {
    suggestedValue: string;
    reasoning: string;
    confidence: number;
    standardReference?: string;
  };
  status: 'open' | 'resolved' | 'ignored';
  resolvedValue?: string;
  resolvedAt?: string;
}

export interface ComplianceRecord {
  id: string;
  productId: string;
  productModel: string;
  standard: string;
  certificateNumber: string;
  issueType: 'Missing' | 'Expired' | 'Conflict' | 'Valid' | 'Renewing';
  issueDescription: string;
  issueDate: string;
  expiryDate: string;
  status: 'Compliant' | 'Non-Compliant' | 'Action Required' | 'Under Review';
  aiConfidence: number;
  aiRecommendation: string;
  certificateDocId?: string;
  manufacturer: string;
}

export interface TechnicalCompatibilityCheck {
  id: string;
  primaryProductId: string;
  targetProductId: string;
  primaryName: string;
  targetName: string;
  targetCategory: string;
  status: 'Compatible' | 'Incompatible' | 'Warning';
  compatibilityScore: number;
  checks: {
    parameter: string;
    primaryValue: string;
    targetValue: string;
    passed: boolean;
    notes: string;
  }[];
  explanation: string;
  affectedByRecentChange: boolean;
  relationshipChain: string[];
}

export interface SupplierOffer {
  id: string;
  supplierName: string;
  productModel: string;
  power: string;
  voltage: string;
  ipRating: string;
  speed: string;
  priceINR: number;
  priceUSD: number;
  stockQty: number;
  deliveryDays: number;
  technicalMatchScore: number;
  isExactMatch: boolean;
  status: 'Exact Match' | 'Closest Alternative' | 'Not Recommended';
  violations: string[];
  advantageNotes: string;
  tier: 'Authorized Partner' | 'Direct OEM' | 'Distributor';
  rating: number;
}

export interface QuoteItem {
  productId: string;
  model: string;
  description: string;
  specSummary: string;
  quantity: number;
  unitPriceINR: number;
  leadTimeDays: number;
  subtotalINR: number;
  supplierSource: string;
  status: 'available' | 'lead_time_extended' | 'price_flagged';
}

export interface Quotation {
  id: string;
  quoteNumber: string;
  version: string;
  customerName: string;
  company: string;
  requestPrompt: string;
  createdAt: string;
  validUntil: string;
  status: 'Draft' | 'Validated' | 'Approved' | 'Revision Requested';
  items: QuoteItem[];
  subtotalINR: number;
  taxGST18: number;
  freightINR: number;
  totalINR: number;
  validationNotes: string[];
  history: {
    version: string;
    changedAt: string;
    changeSummary: string;
    user: string;
  }[];
}

export interface AIMessage {
  id: string;
  sender: 'user' | 'assistant' | 'system';
  timestamp: string;
  text: string;
  routedModule?: 'Product Search' | 'Procurement' | 'Quotation' | 'Compatibility' | 'Compliance' | 'Change Impact' | 'Catalog Exploration';
  confidence?: number;
  sourceCitations?: {
    docName: string;
    page: number;
    snippet: string;
    verified: boolean;
  }[];
  isMissingDataDemonstration?: boolean;
  actionCard?: {
    title: string;
    label: string;
    url: string;
  };
}
