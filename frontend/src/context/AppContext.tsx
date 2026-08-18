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
  activeProduct: Product;
  setActiveProduct: (product: Product) => void;
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
  activeQuote: Quotation;
  generateQuoteFromPrompt: (prompt: string) => Promise<Quotation>;
  modifyQuoteValidation: (quoteId: string, quantity: number, leadDays: number) => Promise<{ success: boolean; message: string; quote: Quotation }>;
  approveQuote: (quoteId: string) => void;

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
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // State
  const [products, setProducts] = useState<Product[]>(mockProducts);
  const [activeProduct, setActiveProduct] = useState<Product>(mockProducts[0]);
  const [documents, setDocuments] = useState<IngestedDocument[]>(mockDocuments);
  const [ingestionState, setIngestionState] = useState<IngestionStepState | null>(null);

  const [productChanges, setProductChanges] = useState<ProductChange[]>(mockProductChanges);
  const [changeImpacts, setChangeImpacts] = useState<ChangeImpact[]>(initialChangeImpacts);
  const [syncStatus, setSyncStatus] = useState<'pending_impact_review' | 'ready_for_approval' | 'synchronized'>('pending_impact_review');
  const [ecommerceStatus, setEcommerceStatus] = useState<'ready_to_publish' | 'published' | 'syncing'>('ready_to_publish');
  const [ecommerceLastSyncTime, setEcommerceLastSyncTime] = useState<string | null>(null);

  const [catalogHealth, setCatalogHealth] = useState<CatalogHealthSummary>(initialCatalogHealth);
  const [catalogIssues, setCatalogIssues] = useState<CatalogIssue[]>(initialCatalogIssues);
  const [complianceRecords, setComplianceRecords] = useState<ComplianceRecord[]>(initialComplianceRecords);
  const [compatibilityChecks] = useState<TechnicalCompatibilityCheck[]>(mockCompatibilityChecks);
  const [supplierOffers] = useState<SupplierOffer[]>(mockSupplierOffers);
  const [quotations, setQuotations] = useState<Quotation[]>(initialQuotations);
  const [activeQuote, setActiveQuote] = useState<Quotation>(initialQuotations[0]);

  const [salesMessages, setSalesMessages] = useState<AIMessage[]>(initialSalesChatMessages);
  const [askCatalogMessages, setAskCatalogMessages] = useState<AIMessage[]>(initialAskCatalogMessages);

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

  // Load initial backend data asynchronously if API is reachable
  useEffect(() => {
    const loadBackendData = async () => {
      try {
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
        if (impacts && Array.isArray(impacts) && impacts.length > 0) {
          setChangeImpacts(prev => prev.map(imp => {
            const numMatch = imp.id.match(/\d+/);
            const numId = numMatch ? parseInt(numMatch[0], 10) : null;
            const dbImp = numId ? impacts.find(i => i.id === numId) : null;
            if (dbImp) {
              return {
                ...imp,
                reviewed: dbImp.reviewed,
                reviewedAt: dbImp.reviewed_at ? new Date(dbImp.reviewed_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : imp.reviewedAt,
                reviewedBy: dbImp.reviewed_by || imp.reviewedBy,
              };
            }
            return imp;
          }));
        }

        // 3. Catalog Issues from DB
        const issuesRes = await api.getCatalogIssues().catch(() => null);
        if (issuesRes && Array.isArray(issuesRes.items) && issuesRes.items.length > 0) {
          setCatalogIssues(prev => prev.map(iss => {
            const numMatch = iss.id.match(/\d+/);
            const numId = numMatch ? parseInt(numMatch[0], 10) : null;
            const dbIss = numId ? issuesRes.items.find((i: any) => i.id === numId) : null;
            if (dbIss) {
              return {
                ...iss,
                status: dbIss.status.toLowerCase() as any,
                resolvedValue: dbIss.resolved_value || iss.resolvedValue,
              };
            }
            return iss;
          }));
        }

        // 4. Quotations from DB
        const quotes = await api.getQuotes().catch(() => null);
        if (quotes && Array.isArray(quotes) && quotes.length > 0) {
          const firstDbQuote = quotes[0];
          if (firstDbQuote) {
            setActiveQuote(prev => ({
              ...prev,
              quoteNumber: firstDbQuote.quote_number || prev.quoteNumber,
              version: firstDbQuote.version || prev.version,
              status: firstDbQuote.status || prev.status,
            }));
          }
        }
      } catch (err) {
        console.warn('Backend API hydration warning (using resilient defaults):', err);
      }
    };
    loadBackendData();
  }, []);

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
    if (activeProduct.id === updated.id) {
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
  const approveSynchronization = (notes?: string) => {
    setSyncStatus('synchronized');
    setProducts(prev => prev.map(p => {
      if (p.id === 'prod-xyz-450') {
        return {
          ...p,
          status: 'synchronized',
          changesDetected: 0,
          impactsPending: 0,
          healthScore: 98
        };
      }
      return p;
    }));

    showToast({
      type: 'success',
      title: 'Synchronization Approved',
      message: 'XYZ-450 v2.0 master product record verified and published to unified data layer.'
    });
  };

  // E-commerce Website Update Approval
  const approveEcommerceUpdate = () => {
    setEcommerceStatus('syncing');
    setTimeout(() => {
      setEcommerceStatus('published');
      setEcommerceLastSyncTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
      showToast({
        type: 'success',
        title: 'B2B Catalog API Synchronized',
        message: 'Product specs, hero copy, and faceted search buckets updated in Web Storefront & SAP Commerce Cloud.'
      });
    }, 1200);
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
    setActiveQuote(prev => ({ ...prev, status: 'Approved' }));
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
  const sendAskCatalogMessage = (userText: string) => {
    const userMsg: AIMessage = {
      id: 'cat-' + Math.random().toString(36).substring(2, 7),
      sender: 'user',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      text: userText
    };

    setAskCatalogMessages(prev => [...prev, userMsg]);

    setTimeout(() => {
      let reply = '';
      let citations: AIMessage['sourceCitations'] = [];
      const lower = userText.toLowerCase();

      if (lower.includes('voltage') || lower.includes('415') || lower.includes('where')) {
        reply = `The **415 V** specification is grounded in:\n\n1. **OEM Engineering Datasheet v2.0** (\`technical_spec_2026.pdf\`, Page 2, Sec 3.1: "Rated Operating Voltage 415V AC ±10% 50Hz 3-Phase").\n2. **SAP ERP Material Master Record** (\`MAT-77092-XYZ450\`, 415V).\n\nThe 440V listing on the web storefront was identified as a legacy template conflict and is pending resolution.`;
        citations = [
          { docName: 'technical_spec_2026.pdf', page: 2, snippet: '415V ±10% 50Hz 3-Phase Delta connection', verified: true },
          { docName: 'motor_specs.pdf', page: 1, snippet: 'Standard 415V 50Hz electrical specification', verified: true }
        ];
      } else if (lower.includes('ip55') || lower.includes('protection') || lower.includes('ingress')) {
        reply = `Products in your catalog certified for **IP55** (Dust & Water Jet protection):\n\n• **XYZ-450** (Siemens 7.5 kW Motor - Cert: TUV-IND-2026-8841)\n• **W22-IE4-7.5** (WEG 7.5 kW Super Premium Motor - Cert: BR-2024-WEG-9912)\n• **CG-Apex 7.5kW** (Crompton Greaves 7.5 kW Motor)`;
        citations = [
          { docName: 'certificate.pdf', page: 1, snippet: 'IP55 Enclosure protection test compliance IEC 60529', verified: true }
        ];
      } else if (lower.includes('version') || lower.includes('v1') || lower.includes('v2')) {
        reply = `**Revisions between v1.4 and v2.0 for XYZ-450**:\n\n• Power: 5.5 kW → 7.5 kW (Source: \`technical_spec_2026.pdf\`, Page 1)\n• Speed: 1440 RPM → 1460 RPM (Source: \`technical_spec_2026.pdf\`, Page 2)\n• Weight: 42 kg → 45 kg (Source: \`technical_spec_2026.pdf\`, Page 4)\n• Voltage: 415 V (Unchanged across versions)`;
        citations = [
          { docName: 'technical_spec_2026.pdf', page: 1, snippet: 'Table 1: Mechanical and Electrical Revision Comparison', verified: true }
        ];
      } else {
        reply = `Retrieved verified catalog information from indexed datasheets and conformity certificates. Zero external hallucinations allowed.`;
        citations = [
          { docName: 'technical_spec_2026.pdf', page: 1, snippet: 'Indexed document reference', verified: true }
        ];
      }

      const botMsg: AIMessage = {
        id: 'cat-' + Math.random().toString(36).substring(2, 7),
        sender: 'assistant',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        text: reply,
        routedModule: 'Catalog Exploration',
        confidence: 0.99,
        sourceCitations: citations
      };

      setAskCatalogMessages(prev => [...prev, botMsg]);
    }, 600);
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
        dismissToast
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
