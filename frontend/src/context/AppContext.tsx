'use client';

import React, { createContext, useContext, useState, useMemo, useEffect } from 'react';
import {
  Product,
  IngestedDocument,
  ProductChange,
  ChangeImpact,
  CatalogIssue,
  ComplianceRecord,
  TechnicalCompatibilityCheck,
  SupplierOffer,
  Quotation,
  AIMessage
} from '@/types';
import { mockProducts } from '@/mock/products';
import { mockDocuments } from '@/mock/documents';
import { mockProductChanges } from '@/mock/changes';
import { initialChangeImpacts } from '@/mock/impacts';
import { initialCatalogHealth, CatalogHealthSummary } from '@/mock/catalogHealth';
import { initialCatalogIssues } from '@/mock/catalogIssues';
import { initialComplianceRecords } from '@/mock/compliance';
import { mockCompatibilityChecks } from '@/mock/compatibility';
import { mockSupplierOffers } from '@/mock/suppliers';
import { initialQuotations } from '@/mock/quotes';
import { initialSalesChatMessages, initialAskCatalogMessages } from '@/mock/aiChat';
import { api } from '@/lib/api';

function adaptProduct(backendProduct: any): Product {
  if (!backendProduct) return backendProduct;

  const bSpecs = backendProduct.specs || {};
  const bPrevSpecs = backendProduct.previous_specs || {};

  const mapSpecs = (s: any) => {
    const getVal = (keys: string[]) => {
      for (const k of keys) {
        if (s[k] !== undefined) return s[k];
        const lowerK = k.toLowerCase();
        for (const sk in s) {
          if (sk.toLowerCase() === lowerK) return s[sk];
        }
      }
      return '';
    };

    return {
      power: getVal(['Rated Output', 'power', 'Power', 'Input Power', 'powerRating', 'power_rating']),
      voltage: getVal(['Rated Voltage', 'voltage', 'Voltage', 'Input Voltage']),
      speed: getVal(['Synchronous Speed', 'speed', 'Speed', 'Input Speed']),
      frequency: getVal(['Frequency', 'frequency']),
      ipRating: getVal(['Protection Degree', 'ipRating', 'IP Rating', 'ip_rating', 'protectionRating']),
      weight: getVal(['Gross Weight', 'weight', 'Weight']),
      efficiency: getVal(['Full Load Efficiency', 'efficiency', 'Efficiency']),
      mountType: getVal(['Mounting', 'mount', 'Mount', 'Mounting Type']),
      frameSize: getVal(['Frame Size', 'frameSize']),
      insulationClass: getVal(['Insulation Class', 'insulationClass']),
      operatingTemp: getVal(['Operating Temp', 'temperature', 'Temp', 'temp']),
      certifications: s.certifications || []
    };
  };

  return {
    id: String(backendProduct.id),
    model: backendProduct.product_code || backendProduct.model || '',
    name: backendProduct.name || '',
    manufacturer: backendProduct.manufacturer || '',
    category: backendProduct.category || '',
    currentVersion: backendProduct.current_version || 'v1.0',
    previousVersion: backendProduct.previous_version || '',
    confidence: backendProduct.confidence || 0.95,
    healthScore: backendProduct.health_score || 90,
    status: (backendProduct.status || 'active').toLowerCase() as any,
    imageUrl: backendProduct.image_url || '',
    description: backendProduct.description || '',
    changesDetected: backendProduct.changes_count || 0,
    impactsPending: backendProduct.pending_impacts_count || 0,
    sourceDocumentIds: backendProduct.source_document_ids || [],
    specs: mapSpecs(bSpecs),
    previousSpecs: mapSpecs(bPrevSpecs),
    versions: (backendProduct.versions || []).map((v: any) => ({
      version: v.version_number || v.version || '',
      releaseDate: v.effective_date || v.releaseDate || '',
      specs: mapSpecs(v.specs || {}),
      sourceDocId: String(v.source_document_id || ''),
      sourceDocName: v.source_document_name || '',
      verifiedBy: v.verified_by || '',
      status: (v.status || 'verified').toLowerCase() as any
    }))
  };
}


export interface ToastNotification {
  id: string;
  type: 'success' | 'warning' | 'error' | 'info';
  title: string;
  message: string;
  durationMs?: number;
}

export interface IngestionStepState {
  step: number; // 0 to 5
  stepName: string;
  progress: number;
  message: string;
  isComplete: boolean;
}

interface AppContextType {
  // Products
  products: Product[];
  activeProduct: Product | null;
  setActiveProduct: (product: Product | null) => void;
  updateProduct: (updated: Product) => void;

  // Documents & Ingestion
  documents: IngestedDocument[];
  ingestionState: IngestionStepState | null;
  startSimulatedIngestion: (fileName: string, docType: IngestedDocument['documentType']) => void;
  resetIngestionState: () => void;

  // Changes & Synchronization
  productChanges: ProductChange[];
  syncStatus: 'pending_impact_review' | 'ready_for_approval' | 'synchronized';
  approveSynchronization: (notes?: string) => void;

  // Change Impacts
  changeImpacts: ChangeImpact[];
  unreviewedImpactsCount: number;
  reviewedImpactsCount: number;
  toggleImpactReviewed: (impactId: string) => void;
  markAllImpactsReviewed: () => void;

  // E-commerce Update
  ecommerceStatus: 'ready_to_publish' | 'published' | 'syncing';
  ecommerceLastSyncTime: string | null;
  approveEcommerceUpdate: () => void;

  // Catalog Health & Issues
  catalogHealth: CatalogHealthSummary;
  catalogIssues: CatalogIssue[];
  openIssuesCount: number;
  resolveCatalogIssue: (issueId: string, resolvedValue: string, note?: string) => void;

  // Compliance
  complianceRecords: ComplianceRecord[];
  openComplianceCount: number;
  resolveComplianceIssue: (recordId: string, actionType: string) => void;
  uploadCertificateAndMatch: (certName: string, standard: string) => void;

  // Compatibility
  compatibilityChecks: TechnicalCompatibilityCheck[];

  // Suppliers & Procurement
  supplierOffers: SupplierOffer[];

  // Quotes
  quotations: Quotation[];
  activeQuote: Quotation | null;
  generateQuoteFromPrompt: (prompt: string) => Promise<Quotation>;
  modifyQuoteValidation: (quoteId: string, quantity: number, leadDays: number) => Promise<{ success: boolean; message: string; quote: Quotation }>;
  approveQuote: (quoteId: string) => void;
  createQuoteFromSupplierOffer: (offer: any, quantity: number) => void;

  // AI Chat Messages
  salesMessages: AIMessage[];
  sendSalesMessage: (userText: string) => void;
  clearSalesMessages: () => void;
  askCatalogMessages: AIMessage[];
  sendAskCatalogMessage: (userText: string) => void;

  // UI Modals & Drawers
  viewingProduct: Product | null;
  setViewingProduct: (prod: Product | null) => void;
  viewingDocument: IngestedDocument | null;
  setViewingDocument: (doc: IngestedDocument | null) => void;
  globalSearchOpen: boolean;
  setGlobalSearchOpen: (open: boolean) => void;

  // Toast System
  toasts: ToastNotification[];
  showToast: (toast: Omit<ToastNotification, 'id'>) => void;
  dismissToast: (id: string) => void;

  // Real-time Sidebar & Metrics Synchronization
  refreshBackendData: () => Promise<void>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [products, setProducts] = useState<Product[]>(mockProducts);
  const [activeProduct, setActiveProduct] = useState<Product | null>(mockProducts[0] || null);
  const [documents, setDocuments] = useState<IngestedDocument[]>([]);
  const [ingestionState, setIngestionState] = useState<IngestionStepState | null>(null);

  const [productChanges, setProductChanges] = useState<ProductChange[]>([]);
  const [changeImpacts, setChangeImpacts] = useState<ChangeImpact[]>([]);
  const [syncStatus, setSyncStatus] = useState<'pending_impact_review' | 'ready_for_approval' | 'synchronized'>('pending_impact_review');
  const [ecommerceStatus, setEcommerceStatus] = useState<'ready_to_publish' | 'published' | 'syncing'>('ready_to_publish');
  const [ecommerceLastSyncTime, setEcommerceLastSyncTime] = useState<string | null>(null);

  const [catalogHealth, setCatalogHealth] = useState<CatalogHealthSummary>(initialCatalogHealth);
  const [catalogIssues, setCatalogIssues] = useState<CatalogIssue[]>([]);
  const [complianceRecords, setComplianceRecords] = useState<ComplianceRecord[]>([]);
  const [compatibilityChecks, setCompatibilityChecks] = useState<TechnicalCompatibilityCheck[]>(mockCompatibilityChecks);
  const [supplierOffers, setSupplierOffers] = useState<SupplierOffer[]>([]);
  const [quotations, setQuotations] = useState<Quotation[]>([]);
  const [activeQuote, setActiveQuote] = useState<Quotation | null>(null);

  const [salesMessages, setSalesMessages] = useState<AIMessage[]>([]);
  const [askCatalogMessages, setAskCatalogMessages] = useState<AIMessage[]>([]);

  const [viewingProduct, setViewingProduct] = useState<Product | null>(null);
  const [viewingDocument, setViewingDocument] = useState<IngestedDocument | null>(null);
  const [globalSearchOpen, setGlobalSearchOpen] = useState<boolean>(false);

  const [toasts, setToasts] = useState<ToastNotification[]>([]);

  // Derived counts
  const unreviewedImpactsCount = useMemo(() => {
    return changeImpacts.filter(i => !i.reviewed).length;
  }, [changeImpacts]);

  const reviewedImpactsCount = useMemo(() => {
    return changeImpacts.filter(i => i.reviewed).length;
  }, [changeImpacts]);

  const openIssuesCount = useMemo(() => {
    return catalogIssues.filter(i => i.status === 'open').length;
  }, [catalogIssues]);

  const openComplianceCount = useMemo(() => {
    return complianceRecords.filter(c => c.status !== 'Compliant').length;
  }, [complianceRecords]);

  // Sync status auto-transitions based on impact reviews
  useEffect(() => {
    if (syncStatus === 'synchronized') return;
    if (unreviewedImpactsCount === 0) {
      setSyncStatus('ready_for_approval');
    } else {
      setSyncStatus('pending_impact_review');
    }
  }, [unreviewedImpactsCount, syncStatus]);

  // Refresh backend data asynchronously to sync sidebar & state metrics
  const refreshBackendData = React.useCallback(async () => {
    try {
      // Load dynamic products from DB
      const productsRes = await api.getProducts({ limit: 100 }).catch(() => null);
      if (productsRes && Array.isArray(productsRes.items)) {
        const adaptedProducts = productsRes.items.map(adaptProduct);
        setProducts(adaptedProducts);
        setActiveProduct(prev => {
          if (!prev) return adaptedProducts.length > 0 ? adaptedProducts[0] : null;
          const found = adaptedProducts.find(p => p.id === prev.id);
          return found || (adaptedProducts.length > 0 ? adaptedProducts[0] : null);
        });
      } else {
        setProducts([]);
        setActiveProduct(null);
      }

      // 1. Catalog Health
      const health = await api.getCatalogHealth().catch(() => null);
      if (health) {
        setCatalogHealth(prev => ({
          ...prev,
          overallHealthScore: health.overall_health || prev.overallHealthScore,
          totalProducts: health.total_products || prev.totalProducts,
          completeProducts: health.complete_products || prev.completeProducts,
          conflictsCount: health.conflicts || prev.conflictsCount,
          missingDataCount: health.missing_data || prev.missingDataCount,
          duplicatesCount: health.duplicates || prev.duplicatesCount,
          outdatedProductsCount: health.outdated || prev.outdatedProductsCount,
          complianceIssuesCount: health.compliance_issues || prev.complianceIssuesCount,
        }));
      }

      // 2. Change Impacts from DB
      const impacts = await api.getChangeImpacts().catch(() => null);
      if (impacts && Array.isArray(impacts)) {
        setChangeImpacts(impacts.map((i: any) => ({
          id: `imp-${i.id}`,
          productId: `prod-${i.product_id || 'vtx-550'}`,
          productName: i.product_name || 'Industrial Equipment',
          changeDescription: i.change_description || '',
          domain: (i.domain || i.impact_type || 'Operations') as any,
          title: i.title,
          explanation: i.description,
          contextEvidence: i.context_evidence || 'Traceable from uploaded engineering revision.',
          severity: (i.severity || 'medium') as any,
          reviewed: Boolean(i.reviewed),
          reviewedAt: i.reviewed_at ? new Date(i.reviewed_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : undefined,
          reviewedBy: i.reviewed_by,
          targetModuleUrl: i.target_module_url || '/compatibility'
        })));
      }

      // 2b. Changes from DB
      const changes = await api.getChanges().catch(() => null);
      if (changes && Array.isArray(changes)) {
        setProductChanges(changes.map((c: any) => ({
          id: `chg-${c.id}`,
          productId: `prod-${c.product_id}`,
          productName: c.product_name,
          attribute: c.attribute_name,
          oldValue: c.old_value || '-',
          newValue: c.new_value,
          detectedAt: c.detected_at || 'Just now',
          sourceDocument: c.source_document || 'Uploaded document',
          confidence: c.confidence || 0.98,
          status: (c.status || 'pending').toLowerCase() as any
        })));
      }

      // 3. Catalog Issues from DB (limit: 1000 for full coverage)
      const issuesRes = await api.getCatalogIssues({ limit: 1000 }).catch(() => null);
      if (issuesRes && Array.isArray(issuesRes.items)) {
        setCatalogIssues(issuesRes.items.map((dbIss: any) => ({
          id: String(dbIss.id),
          productId: String(dbIss.product_id),
          productName: dbIss.product_name || 'Product Record',
          productModel: dbIss.product_model || 'SKU',
          issueType: dbIss.issue_type,
          field: dbIss.field,
          title: dbIss.title,
          description: dbIss.description,
          severity: dbIss.severity || 'medium',
          status: (dbIss.status || 'open').toLowerCase() as any,
          evidence: dbIss.evidence,
          aiRecommendation: dbIss.ai_recommendation,
          resolvedValue: dbIss.resolution_value,
          resolvedAt: dbIss.resolved_at,
          resolvedBy: dbIss.resolved_by
        })));
      }

      // 4. Quotations from DB
      const quotes = await api.getQuotes().catch(() => null);
      if (quotes && Array.isArray(quotes) && quotes.length > 0) {
        const firstDbQuote = quotes[0];
        if (firstDbQuote) {
          setActiveQuote(prev => (prev ? {
            ...prev,
            quoteNumber: firstDbQuote.quote_number || prev.quoteNumber,
            version: firstDbQuote.version || prev.version,
            status: firstDbQuote.status || prev.status,
          } : null));
        }
      }
    } catch (err) {
      console.warn('Backend API hydration warning:', err);
    }
  }, []);

  // Poll backend every 3 seconds so sidebar badges & metrics are always live
  useEffect(() => {
    refreshBackendData();
    const intervalId = setInterval(() => {
      refreshBackendData();
    }, 3000);
    return () => clearInterval(intervalId);
  }, [refreshBackendData]);

  // Load dynamic data dependent on activeProduct
  useEffect(() => {
    if (!activeProduct || !activeProduct.id) return;
    
    // Parse to number for database primary key lookup
    const numMatch = activeProduct.id.match(/\d+/);
    const numId = numMatch ? parseInt(numMatch[0], 10) : null;
    if (!numId) return;

    const loadProductDetails = async () => {
      try {
        // 1. Fetch Compatibility checks
        const compat = await api.getCompatibility(numId).catch(() => null);
        if (compat && Array.isArray(compat)) {
          setCompatibilityChecks(compat.map((r: any) => ({
            id: String(r.id),
            primaryProductId: String(r.product_id),
            targetProductId: String(r.compatible_product_id),
            primaryName: r.primary_name || 'XYZ-450',
            targetName: r.target_name || '',
            targetCategory: r.target_category || '',
            status: r.status as any,
            compatibilityScore: r.compatibility_score || 1.0,
            checks: (r.checks || []).map((c: any) => ({
              parameter: c.parameter,
              primaryValue: c.primaryValue,
              targetValue: c.targetValue,
              passed: c.passed !== undefined ? c.passed : c.status === 'PASS',
              notes: c.explanation || ''
            })),
            explanation: r.explanation || '',
            affectedByRecentChange: r.affected_by_recent_change || false,
            relationshipChain: [r.primary_name || 'XYZ-450', r.target_name || '']
          })));
        }

        // 2. Fetch Supplier Offers
        const offers = await api.getSupplierProducts({ product_id: numId }).catch(() => null);
        if (offers && Array.isArray(offers)) {
          setSupplierOffers(offers.map((sp: any) => ({
            id: String(sp.id),
            supplierName: sp.supplier_name,
            productModel: sp.product_model,
            power: sp.power,
            voltage: sp.voltage,
            ipRating: sp.ip_rating,
            speed: sp.speed,
            priceINR: sp.price,
            priceUSD: Math.round(sp.price / 83.5),
            stockQty: sp.stock_quantity,
            deliveryDays: sp.delivery_days,
            technicalMatchScore: sp.technical_match_score || 1.0,
            isExactMatch: sp.is_exact_match === 'Exact Match',
            status: sp.is_exact_match as any,
            violations: sp.violations || [],
            advantageNotes: sp.advantage_notes || '',
            tier: sp.tier as any,
            rating: sp.rating || 4.5
          })));
        }

        // 3. Fetch Product changes
        const changes = await api.getProductChanges(numId).catch(() => null);
        if (changes && Array.isArray(changes)) {
          setProductChanges(changes.map((c: any) => ({
            id: String(c.id),
            productId: String(c.product_id),
            productName: c.product_name,
            attribute: c.attribute_name,
            oldValue: c.old_value,
            newValue: c.new_value,
            detectedAt: c.detected_at,
            sourceDocument: c.source_document,
            confidence: c.confidence,
            status: c.status.toLowerCase() as any
          })));
        }

        // 4. Fetch Product documents
        const docs = await api.getProductDocuments(numId).catch(() => null);
        if (docs && Array.isArray(docs)) {
          setDocuments(docs.map((d: any) => {
            const mapDocType = (t: string) => {
              if (t === 'DATASHEET') return 'Datasheet';
              if (t === 'CERTIFICATE') return 'Certificate';
              if (t === 'CATALOG') return 'Supplier Catalog';
              if (t === 'MANUAL') return 'Manual';
              return 'Datasheet';
            };
            return {
              id: String(d.id),
              filename: d.original_file_name,
              productId: String(d.product_id),
              productModel: d.product_model || '',
              documentType: mapDocType(d.document_type) as any,
              uploadedOn: new Date(d.uploaded_at).toLocaleDateString(),
              fileSize: d.file_size_formatted || '3.2 MB',
              version: d.version_detected || 'v1.0',
              status: d.processing_status === 'PROCESSED' ? 'Processed' : (d.processing_status === 'REVIEW_REQUIRED' ? 'Action Required' : 'Processing'),
              matchConfidence: d.match_confidence || 1.0,
              isSameProductDetected: d.product_id !== null,
              detectedChangesSummary: d.extracted_summary || '',
              pagesCount: d.pages_count || 1,
              extractedAttributes: d.extracted_attributes || {},
              sourceCitations: d.source_citations || []
            };
          }));
        }
      } catch (err) {
        console.error('Error loading product details:', err);
      }
    };
    loadProductDetails();
  }, [activeProduct?.id]);


  // Toast Helper
  const showToast = (toast: Omit<ToastNotification, 'id'>) => {
    const id = 'toast-' + Math.random().toString(36).substring(2, 9);
    setToasts(prev => [...prev, { ...toast, id }]);
    setTimeout(() => {
      dismissToast(id);
    }, toast.durationMs || 4500);
  };

  const dismissToast = (id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  // Product Updates
  const updateProduct = (updated: Product) => {
    setProducts(prev => prev.map(p => p.id === updated.id ? updated : p));
    if (activeProduct && activeProduct.id === updated.id) {
      setActiveProduct(updated);
    }
  };

  // Simulated Ingestion Pipeline
  const startSimulatedIngestion = (fileName: string, docType: IngestedDocument['documentType']) => {
    setIngestionState({
      step: 1,
      stepName: 'Uploading File',
      progress: 20,
      message: `Uploading ${fileName} to secure enterprise intake bucket...`,
      isComplete: false
    });

    setTimeout(() => {
      setIngestionState({
        step: 2,
        stepName: 'OCR & Data Extraction',
        progress: 45,
        message: 'Running layout-aware OCR and technical table parsing...',
        isComplete: false
      });
    }, 1200);

    setTimeout(() => {
      setIngestionState({
        step: 3,
        stepName: 'Product Identification',
        progress: 70,
        message: 'Cross-matching attributes. Same Product Detected: XYZ-450 (94% confidence match).',
        isComplete: false
      });
    }, 2500);

    setTimeout(() => {
      setIngestionState({
        step: 4,
        stepName: 'Version & Change Detection',
        progress: 90,
        message: 'Version upgrade v2.0 detected! 3 spec changes (Power, Speed, Weight) identified against baseline v1.4.',
        isComplete: false
      });
    }, 3800);

    setTimeout(() => {
      const newDoc: IngestedDocument = {
        id: 'doc-' + Math.random().toString(36).substring(2, 7),
        filename: fileName,
        productId: 'prod-xyz-450',
        productModel: 'XYZ-450',
        documentType: docType,
        uploadedOn: 'Just now',
        fileSize: '3.6 MB',
        version: 'v2.0',
        status: 'Processed',
        matchConfidence: 0.94,
        isSameProductDetected: true,
        detectedChangesSummary: 'Power upgraded (5.5 kW → 7.5 kW), Speed adjusted (1440 → 1460 RPM), Weight (42 → 45 kg)',
        pagesCount: 5,
        extractedAttributes: {
          'Rated Power': '7.5 kW',
          'Rated Voltage': '415 V 3-Phase',
          'Rated Speed': '1460 RPM',
          'Protection': 'IP55',
          'Weight': '45 kg',
          'Efficiency': '91.2%'
        },
        sourceCitations: [
          { page: 1, snippet: 'Siemens XYZ-450 7.5 kW 4-Pole 415V Severe Duty Induction Motor Spec.' }
        ]
      };

      setDocuments(prev => [newDoc, ...prev]);
      setIngestionState({
        step: 5,
        stepName: 'Ready for Review',
        progress: 100,
        message: 'Ingestion complete. Changes queued for Synchronization and Change Impact review.',
        isComplete: true
      });

      showToast({
        type: 'success',
        title: 'Ingestion Succeeded',
        message: `${fileName} matched to XYZ-450 (94% confidence). 3 changes detected.`
      });
    }, 4800);
  };

  const resetIngestionState = () => {
    setIngestionState(null);
  };

  // Change Impact Review
  const toggleImpactReviewed = (impactId: string) => {
    // Extract numerical ID if present (e.g. "imp-001" -> 1)
    const numMatch = impactId.match(/\d+/);
    const numId = numMatch ? parseInt(numMatch[0], 10) : 1;

    setChangeImpacts(prev => prev.map(imp => {
      if (imp.id === impactId) {
        const nextState = !imp.reviewed;
        if (nextState) {
          showToast({
            type: 'info',
            title: 'Impact Reviewed',
            message: `Marked "${imp.title}" as reviewed.`
          });
        }

        // Call backend API
        api.reviewChangeImpact(numId, nextState).catch(() => {});

        return {
          ...imp,
          reviewed: nextState,
          reviewedAt: nextState ? new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : undefined,
          reviewedBy: nextState ? 'Current User (Engineer)' : undefined
        };
      }
      return imp;
    }));
  };

  const markAllImpactsReviewed = () => {
    setChangeImpacts(prev => prev.map((imp, idx) => {
      api.reviewChangeImpact(idx + 1, true).catch(() => {});
      return {
        ...imp,
        reviewed: true,
        reviewedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        reviewedBy: 'Current User (Engineer)'
      };
    }));
    showToast({
      type: 'success',
      title: 'All Impacts Reviewed',
      message: 'All 6 cross-domain impacts have been acknowledged. Synchronization is ready for approval.'
    });
  };

  // Synchronization Approval
  const approveSynchronization = async (notes?: string) => {
    try {
      if (!activeProduct || !activeProduct.id) return;
      const numMatch = activeProduct.id.match(/\d+/);
      const numId = numMatch ? parseInt(numMatch[0], 10) : null;
      if (!numId) return;

      const res = await api.approveProductSync(numId);
      if (res && res.success) {
        setSyncStatus('synchronized');
        
        // Reload products from backend
        const productsRes = await api.getProducts({ limit: 100 }).catch(() => null);
        if (productsRes && Array.isArray(productsRes.items)) {
          const adaptedProducts = productsRes.items.map(adaptProduct);
          setProducts(adaptedProducts);
          const updatedActive = adaptedProducts.find(p => p.id === activeProduct.id);
          if (updatedActive) {
            setActiveProduct(updatedActive);
          }
        }
        
        showToast({
          type: 'success',
          title: 'Synchronization Approved',
          message: res.message || 'Product master record updated successfully in database.'
        });
      }
    } catch (err: any) {
      showToast({
        type: 'error',
        title: 'Approval Failed',
        message: err.message || 'Error communicating with database.'
      });
    }
  };

  // E-commerce Website Update Approval
  const approveEcommerceUpdate = async () => {
    if (!activeProduct) return;
    // Look up unreviewed e-commerce impacts for the active product
    const unreviewedEcomImpacts = changeImpacts.filter(
      i => !i.reviewed && (i.productId === activeProduct.id || i.productId === `prod-${activeProduct.model.toLowerCase()}`) && (i.domain === 'E-commerce' || (i as any).impactType === 'E-commerce')
    );
    if (unreviewedEcomImpacts.length > 0) {
      showToast({
        type: 'error',
        title: 'Website Update Blocked',
        message: 'Review all required change impacts before approving the website update.'
      });
      return;
    }

    setEcommerceStatus('syncing');
    try {
      const res = await api.syncEcommerceCatalog(activeProduct.id);
      if (res && res.success) {
        setEcommerceStatus('published');
        setEcommerceLastSyncTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
        showToast({
          type: 'success',
          title: 'B2B Catalog API Synchronized',
          message: `Product specifications successfully updated in Web Storefront. Changed fields: ${res.changedFields?.join(', ') || 'none'}`
        });
      } else {
        setEcommerceStatus('ready_to_publish');
        showToast({
          type: 'error',
          title: 'Synchronization Failed',
          message: res?.message || 'Unknown response from integration server'
        });
      }
    } catch (err: any) {
      setEcommerceStatus('ready_to_publish');
      showToast({
        type: 'error',
        title: 'Integration Service Error',
        message: err.message || 'The storefront update service failed or is unreachable.'
      });
    }
  };


  // Resolve Catalog Issue
  const resolveCatalogIssue = (issueId: string, resolvedValue: string, note?: string) => {
    const numMatch = issueId.match(/\d+/);
    const numId = numMatch ? parseInt(numMatch[0], 10) : 1;

    // Call backend API
    api.resolveCatalogIssue(numId, resolvedValue, note).catch(() => {});

    setCatalogIssues(prev => prev.map(iss => {
      if (iss.id === issueId) {
        return {
          ...iss,
          status: 'resolved',
          resolvedValue,
          resolvedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };
      }
      return iss;
    }));

    // Update catalog health metrics
    setCatalogHealth(prev => ({
      ...prev,
      conflictsCount: Math.max(0, prev.conflictsCount - 1),
      completeProducts: prev.completeProducts + 1,
      overallHealthScore: Math.min(99, prev.overallHealthScore + 1)
    }));

    showToast({
      type: 'success',
      title: 'Catalog Issue Resolved',
      message: `Accepted "${resolvedValue}" with human sign-off.`
    });
  };

  // Resolve Compliance Issue
  const resolveComplianceIssue = (recordId: string, actionType: string) => {
    setComplianceRecords(prev => prev.map(rec => {
      if (rec.id === recordId) {
        return {
          ...rec,
          status: 'Compliant',
          issueType: 'Valid',
          certificateNumber: 'TUV-IND-2026-8841 (Linked)'
        };
      }
      return rec;
    }));

    showToast({
      type: 'success',
      title: 'Compliance Verified',
      message: `Certificate linked and standard compliance validated.`
    });
  };

  // Upload Certificate & Auto-Match
  const uploadCertificateAndMatch = (certName: string, standard: string) => {
    const newRecord: ComplianceRecord = {
      id: 'comp-' + Math.random().toString(36).substring(2, 7),
      productId: 'prod-xyz-450',
      productModel: 'XYZ-450',
      standard,
      certificateNumber: 'CERT-' + Math.floor(100000 + Math.random() * 900000),
      issueType: 'Valid',
      issueDescription: 'Newly uploaded compliance certificate matched with 98% confidence.',
      issueDate: '2026-08-18',
      expiryDate: '2029-08-17',
      status: 'Compliant',
      aiConfidence: 0.98,
      aiRecommendation: 'Valid certificate matching product model XYZ-450.',
      manufacturer: 'Siemens Industrial Automation'
    };

    setComplianceRecords(prev => [newRecord, ...prev]);
    showToast({
      type: 'success',
      title: 'Certificate Ingested & Matched',
      message: `${certName} automatically linked to XYZ-450 (98% confidence match).`
    });
  };

  // RFQ Quote Generation
  const generateQuoteFromPrompt = async (prompt: string): Promise<Quotation> => {
    const newQuote: Quotation = {
      id: 'quote-' + Math.random().toString(36).substring(2, 7),
      quoteNumber: 'Q-2026-' + Math.floor(9000 + Math.random() * 1000),
      version: 'v1.0',
      customerName: 'Industrial Client Representative',
      company: 'Premier Manufacturing Corp',
      requestPrompt: prompt,
      createdAt: 'Just now',
      validUntil: '30 Days from Issue',
      status: 'Validated',
      items: [
        {
          productId: 'prod-xyz-450',
          model: 'XYZ-450-IE3',
          description: 'Siemens 7.5 kW 4-Pole Induction Motor 415V IP55',
          specSummary: '7.5 kW | 415 V | 1460 RPM | IP55',
          quantity: 20,
          unitPriceINR: 39500,
          leadTimeDays: 4,
          subtotalINR: 790000,
          supplierSource: 'Siemens Direct Channel',
          status: 'available'
        }
      ],
      subtotalINR: 790000,
      taxGST18: 142200,
      freightINR: 15000,
      totalINR: 947200,
      validationNotes: [
        '✓ Supplier stock availability checked: 45 units in stock.',
        '✓ Pricing verified against contract matrix.'
      ],
      history: [
        {
          version: 'v1.0',
          changedAt: 'Just now',
          changeSummary: 'Generated quote based on natural language request.',
          user: 'AI Quote Engine'
        }
      ]
    };

    setQuotations(prev => [newQuote, ...prev]);
    setActiveQuote(newQuote);
    showToast({
      type: 'success',
      title: 'Quotation Generated',
      message: `Quotation ${newQuote.quoteNumber} prepared with verified pricing and inventory.`
    });
    return newQuote;
  };

  // Modify Quote with Validation
  const modifyQuoteValidation = async (quoteId: string, quantity: number, leadDays: number) => {
    if (!activeQuote) {
      return { success: false, message: 'No active quote available.', quote: null as any };
    }
    // Simulate checking business data
    const unitPrice = 39500;
    const subtotal = quantity * unitPrice;
    const tax = subtotal * 0.18;
    const freight = 18500;
    const total = subtotal + tax + freight;

    const updatedQuote: Quotation = {
      ...activeQuote,
      version: 'v2.0',
      items: activeQuote.items.map(item => ({
        ...item,
        quantity,
        subtotalINR: quantity * item.unitPriceINR,
        leadTimeDays: leadDays
      })),
      subtotalINR: subtotal,
      taxGST18: tax,
      freightINR: freight,
      totalINR: total,
      status: 'Validated',
      validationNotes: [
        `✓ Quantity updated to ${quantity} units. Inventory confirmed across primary and regional hubs.`,
        `✓ Delivery timeline set to ${leadDays} days (Expedited road logistics validated).`,
        `✓ Volume tier margin approved by automated business pricing rules.`
      ],
      history: [
        ...activeQuote.history,
        {
          version: 'v2.0',
          changedAt: 'Just now',
          changeSummary: `Adjusted quantity to ${quantity} units and requested delivery in ${leadDays} days.`,
          user: 'Procurement Specialist'
        }
      ]
    };

    // Call backend API for revision
    const numMatch = quoteId.match(/\d+/);
    const numId = numMatch ? parseInt(numMatch[0], 10) : 1;
    api.requestQuoteRevision(numId, quantity, leadDays).catch(() => {});

    setQuotations(prev => prev.map(q => q.id === quoteId ? updatedQuote : q));
    setActiveQuote(updatedQuote);

    showToast({
      type: 'success',
      title: 'Quote Validated & Updated',
      message: `Revised to ${quantity} units, delivery in ${leadDays} days. Version v2.0 generated.`
    });

    return { success: true, message: 'Updated successfully with supplier inventory verification.', quote: updatedQuote };
  };

  const approveQuote = (quoteId: string) => {
    const numMatch = quoteId.match(/\d+/);
    const numId = numMatch ? parseInt(numMatch[0], 10) : 1;
    api.approveQuote(numId, 'Sales Operations').catch(() => {});

    setQuotations(prev => prev.map(q => q.id === quoteId ? { ...q, status: 'Approved' } : q));
    setActiveQuote(prev => (prev ? { ...prev, status: 'Approved' } : null));
    showToast({
      type: 'success',
      title: 'Quotation Approved',
      message: 'Quotation signed off. PDF generated and dispatched to client CRM.'
    });
  };

  // AI Sales Chat Session ID
  const [salesConversationId] = useState<string>(() => 'conv-' + Math.random().toString(36).substring(2, 9));

  const clearSalesMessages = () => {
    setSalesMessages([]);
    showToast({
      type: 'info',
      title: 'Conversation Reset',
      message: 'Sales Assistant session cleared.'
    });
  };

  const createQuoteFromSupplierOffer = (offer: any, quantity: number) => {
    const newQuote: Quotation = {
      id: 'quote-' + Math.random().toString(36).substring(2, 7),
      quoteNumber: 'Q-2026-' + Math.floor(9000 + Math.random() * 1000),
      version: 'v1.0',
      customerName: 'Industrial Client Representative',
      company: 'Premier Manufacturing Corp',
      requestPrompt: `Procured via Multi-Supplier Constraint Engine: ${quantity} x ${offer.productModel || offer.product_model} from ${offer.supplierName || offer.supplier_name}`,
      createdAt: 'Just now',
      validUntil: '30 Days from Issue',
      status: 'Validated',
      items: [
        {
          productId: offer.id,
          model: offer.productModel || offer.product_model,
          description: `${offer.supplierName || offer.supplier_name} - ${offer.productModel || offer.product_model}`,
          specSummary: Object.entries(offer.specs || {})
            .filter(([_, v]) => v && v !== 'N/A')
            .map(([k, v]) => `${k.charAt(0).toUpperCase() + k.slice(1)}: ${v}`)
            .join(' | '),
          quantity: quantity,
          unitPriceINR: offer.priceINR || offer.price,
          leadTimeDays: offer.deliveryDays || offer.delivery_days,
          subtotalINR: (offer.priceINR || offer.price) * quantity,
          supplierSource: offer.supplierName || offer.supplier_name,
          status: 'available'
        }
      ],
      subtotalINR: (offer.priceINR || offer.price) * quantity,
      taxGST18: ((offer.priceINR || offer.price) * quantity) * 0.18,
      freightINR: 15000,
      totalINR: ((offer.priceINR || offer.price) * quantity) * 1.18 + 15000,
      validationNotes: [
        `✓ Supplier stock availability checked: ${offer.stockQty || offer.stock_quantity} units available.`,
        '✓ Pricing verified against contract matrix.'
      ],
      history: [
        {
          version: 'v1.0',
          changedAt: 'Just now',
          changeSummary: 'Generated quote from procurement constraint engine.',
          user: 'Procurement Specialist'
        }
      ]
    };

    setQuotations(prev => [newQuote, ...prev]);
    setActiveQuote(newQuote);
    showToast({
      type: 'success',
      title: 'Quotation Generated from Sourcing',
      message: `Quotation ${newQuote.quoteNumber} prepared with selected supplier offering.`
    });
  };

  // AI Sales Chat
  const sendSalesMessage = (userText: string) => {
    const userMsg: AIMessage = {
      id: 'msg-' + Math.random().toString(36).substring(2, 7),
      sender: 'user',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      text: userText
    };

    setSalesMessages(prev => [...prev, userMsg]);

    const loadingId = 'loading-' + Math.random().toString(36).substring(2, 7);
    const loadingMsg: AIMessage = {
      id: loadingId,
      sender: 'assistant',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      text: 'Checking verified databases and comparing supplier specifications...',
      routedModule: undefined
    };
    setSalesMessages(prev => [...prev, loadingMsg]);

    api.postSalesAssistantChat(userText, salesConversationId)
      .then(res => {
        setSalesMessages(prev => {
          const filtered = prev.filter(m => m.id !== loadingId);
          
          let moduleLabel: AIMessage['routedModule'] = 'Product Search';
          const intentUpper = (res.intent || '').toUpperCase();
          if (intentUpper === 'PRODUCT_SEARCH') moduleLabel = 'Product Search';
          else if (intentUpper === 'PROCUREMENT') moduleLabel = 'Procurement';
          else if (intentUpper === 'QUOTATION') moduleLabel = 'Quotation';
          else if (intentUpper === 'COMPATIBILITY') moduleLabel = 'Compatibility';
          else if (intentUpper === 'COMPLIANCE') moduleLabel = 'Compliance';
          else if (intentUpper === 'CHANGE_IMPACT') moduleLabel = 'Change Impact';
          else if (intentUpper === 'GENERAL') moduleLabel = 'Catalog Exploration';

          // Normalize actions (can be array or single object)
          const actionsArr = Array.isArray(res.actions) ? res.actions : res.actions ? [res.actions] : [];

          const botMsg: AIMessage = {
            id: 'msg-' + Math.random().toString(36).substring(2, 7),
            sender: 'assistant',
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            text: res.answer,
            routedModule: res.intent ? moduleLabel : undefined,
            confidence: res.confidence,
            sourceCitations: res.sources,
            cardType: res.card_type,
            cardData: res.card_data,
            isMissingDataDemonstration: res.is_missing_data_demonstration,
            actions: actionsArr,
            actionCard: actionsArr.length > 0 ? actionsArr[0] : undefined
          };
          return [...filtered, botMsg];
        });
      })
      .catch(err => {
        setSalesMessages(prev => {
          const filtered = prev.filter(m => m.id !== loadingId);
          const errorMsg: AIMessage = {
            id: 'msg-err-' + Math.random().toString(36).substring(2, 7),
            sender: 'assistant',
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            text: `Unable to connect to the Sales Assistant service. Please check your backend connection.`
          };
          return [...filtered, errorMsg];
        });
      });
  };

  // Ask Catalog AI Chat
  const sendAskCatalogMessage = async (userText: string) => {
    const userMsg: AIMessage = {
      id: 'cat-' + Math.random().toString(36).substring(2, 7),
      sender: 'user',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      text: userText
    };

    setAskCatalogMessages(prev => [...prev, userMsg]);

    try {
      const res = await api.askCatalogChat(userText, 'catalog-chat-session');

      const citations = (res.sources || []).map((cite: any) => ({
        docName: cite.docName || cite.documentId || 'Source Document',
        page: cite.page || 1,
        snippet: cite.snippet || '',
        verified: true
      }));

      const isMissingData = res.answer.toLowerCase().includes('unavailable') || 
                            res.answer.toLowerCase().includes('insufficient') ||
                            res.answer.toLowerCase().includes("couldn't find") ||
                            res.answer.toLowerCase().includes("could not find");

      let actionCard = undefined;
      if (res.hasConflict) {
        actionCard = {
          title: 'Resolve Conflicts in Catalog Issues',
          label: 'Open Conflict Resolver',
          url: '/catalog-issues?filter=conflict'
        };
      } else if (isMissingData) {
        actionCard = {
          title: 'Upload Missing Data / Documents',
          label: 'Open Upload & Ingest',
          url: '/upload'
        };
      }

      const botMsg: AIMessage = {
        id: 'cat-' + Math.random().toString(36).substring(2, 7),
        sender: 'assistant',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        text: res.answer,
        routedModule: 'Catalog Exploration',
        confidence: res.confidence,
        sourceCitations: citations,
        isMissingDataDemonstration: isMissingData,
        actionCard: actionCard
      };

      setAskCatalogMessages(prev => [...prev, botMsg]);
    } catch (err: any) {
      console.error('Error fetching Catalog AI response:', err);
      const botMsg: AIMessage = {
        id: 'cat-' + Math.random().toString(36).substring(2, 7),
        sender: 'assistant',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        text: "I couldn't retrieve the catalog information right now. Please try again.",
        routedModule: 'Catalog Exploration',
        confidence: 0.0
      };
      setAskCatalogMessages(prev => [...prev, botMsg]);
    }
  };

  return (
    <AppContext.Provider
      value={{
        products,
        activeProduct,
        setActiveProduct,
        updateProduct,
        documents,
        ingestionState,
        startSimulatedIngestion,
        resetIngestionState,
        productChanges,
        syncStatus,
        approveSynchronization,
        changeImpacts,
        unreviewedImpactsCount,
        reviewedImpactsCount,
        toggleImpactReviewed,
        markAllImpactsReviewed,
        ecommerceStatus,
        ecommerceLastSyncTime,
        approveEcommerceUpdate,
        catalogHealth,
        catalogIssues,
        openIssuesCount,
        resolveCatalogIssue,
        complianceRecords,
        openComplianceCount,
        resolveComplianceIssue,
        uploadCertificateAndMatch,
        compatibilityChecks,
        supplierOffers,
        quotations,
        activeQuote,
        generateQuoteFromPrompt,
        modifyQuoteValidation,
        approveQuote,
        createQuoteFromSupplierOffer,
        salesMessages,
        sendSalesMessage,
        clearSalesMessages,
        askCatalogMessages,
        sendAskCatalogMessage,
        viewingProduct,
        setViewingProduct,
        viewingDocument,
        setViewingDocument,
        globalSearchOpen,
        setGlobalSearchOpen,
        toasts,
        showToast,
        dismissToast,
        refreshBackendData
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
