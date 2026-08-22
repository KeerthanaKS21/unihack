/**
 * VeriSpec AI - Centralized REST API Client
 * Seamlessly bridges the Next.js Frontend with the FastAPI Backend.
 */

const getBaseUrl = () => {
  if (process.env.NEXT_PUBLIC_API_BASE_URL) {
    const base = process.env.NEXT_PUBLIC_API_BASE_URL.replace(/\/+$/, '');
    return base.endsWith('/api') ? base : `${base}/api`;
  }
  if (process.env.NEXT_PUBLIC_API_URL) {
    const base = process.env.NEXT_PUBLIC_API_URL.replace(/\/+$/, '');
    return base.endsWith('/api') ? base : `${base}/api`;
  }
  // When running on deployed production website (e.g. Vercel domain), default to relative /api
  if (typeof window !== 'undefined' && window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
    return '/api';
  }
  // Local development default
  return 'http://localhost:8000/api';
};

export interface ApiErrorResponse {
  detail: string;
  status: number;
}

export class ApiClientError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.name = 'ApiClientError';
    this.status = status;
  }
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const baseUrl = getBaseUrl();
  const url = `${baseUrl}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;
  
  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        'Accept': 'application/json',
        ...(!(options.body instanceof FormData) && { 'Content-Type': 'application/json' }),
        ...options.headers,
      },
    });

    if (!response.ok) {
      let message = response.statusText;
      try {
        const errorJson = await response.json();
        if (typeof errorJson.detail === 'string') {
          message = errorJson.detail;
        } else if (Array.isArray(errorJson.detail)) {
          message = errorJson.detail.map((d: any) => d.msg || JSON.stringify(d)).join('; ');
        }
      } catch {
        // use status text
      }
      throw new ApiClientError(message || `HTTP ${response.status} error`, response.status);
    }

    return await response.json();
  } catch (error: any) {
    if (error instanceof ApiClientError) {
      throw error;
    }
    // Network or parse error
    throw new ApiClientError(error.message || 'Unable to connect to backend server. Please check your network.', 0);
  }
}

export const api = {
  // Base health
  getHealth: () => request<{ status: string; service: string }>('/health'),

  // Dashboard
  getDashboardSummary: () => request<any>('/dashboard/summary'),

  // Documents
  getDocuments: (params?: {
    page?: number;
    limit?: number;
    search?: string;
    document_type?: string;
    processing_status?: string;
    product_id?: number;
  }) => {
    const query = new URLSearchParams();
    if (params?.page) query.set('page', String(params.page));
    if (params?.limit) query.set('limit', String(params.limit));
    if (params?.search) query.set('search', params.search);
    if (params?.document_type && params.document_type !== 'all') query.set('document_type', params.document_type);
    if (params?.processing_status && params.processing_status !== 'all') query.set('processing_status', params.processing_status);
    if (params?.product_id) query.set('product_id', String(params.product_id));
    const qs = query.toString();
    return request<{ total: number; page: number; limit: number; items: any[] }>(`/documents${qs ? `?${qs}` : ''}`);
  },

  getDocumentById: (id: number) => request<any>(`/documents/${id}`),

  uploadDocument: async (file: File, productId?: number, uploadedBy: string = 'Engineering Lead') => {
    const formData = new FormData();
    formData.append('file', file);
    if (productId) formData.append('product_id', String(productId));
    formData.append('uploaded_by', uploadedBy);

    return request<any>('/documents/upload', {
      method: 'POST',
      body: formData,
    });
  },

  deleteDocument: (id: number) =>
    request<any>(`/documents/${id}`, {
      method: 'DELETE',
    }),

  extractProductFromDocument: (docId: number) =>
    request<any>(`/documents/${docId}/extract`, {
      method: 'POST',
    }),

  identifyProduct: (docId: number) =>
    request<any>(`/documents/${docId}/identify-product`, {
      method: 'POST',
    }),

  detectVersion: (docId: number) =>
    request<any>(`/documents/${docId}/detect-version`, {
      method: 'POST',
    }),

  // Products
  getProducts: (params?: {
    page?: number;
    limit?: number;
    search?: string;
    category?: string;
    manufacturer?: string;
    status?: string;
  }) => {
    const query = new URLSearchParams();
    if (params?.page) query.set('page', String(params.page));
    if (params?.limit) query.set('limit', String(params.limit));
    if (params?.search) query.set('search', params.search);
    if (params?.category && params.category !== 'all') query.set('category', params.category);
    if (params?.manufacturer && params.manufacturer !== 'all') query.set('manufacturer', params.manufacturer);
    if (params?.status && params.status !== 'all') query.set('status', params.status);
    const qs = query.toString();
    return request<{ total: number; page: number; limit: number; items: any[] }>(`/products${qs ? `?${qs}` : ''}`);
  },

  getProductById: (id: number) => request<any>(`/products/${id}`),
  getProductVersions: (id: number) => request<any[]>(`/products/${id}/versions`),
  getProductAttributes: (id: number) => request<any[]>(`/products/${id}/attributes`),
  getProductDocuments: (id: number) => request<any[]>(`/products/${id}/documents`),
  getProductChanges: (id: number) => request<any[]>(`/products/${id}/changes`),
  getProductCompliance: (id: number) => request<any[]>(`/products/${id}/compliance`),
  getProductCompatibility: (id: number) => request<any[]>(`/products/${id}/compatibility`),

  // Changes & Change Impacts
  getChanges: (params?: { product_id?: number; status?: string }) => {
    const query = new URLSearchParams();
    if (params?.product_id) query.set('product_id', String(params.product_id));
    if (params?.status) query.set('status', params.status);
    const qs = query.toString();
    return request<any[]>(`/changes${qs ? `?${qs}` : ''}`);
  },

  getChangeImpacts: (params?: { change_id?: number; reviewed?: boolean; severity?: string }) => {
    const query = new URLSearchParams();
    if (params?.change_id) query.set('change_id', String(params.change_id));
    if (params?.reviewed !== undefined) query.set('reviewed', String(params.reviewed));
    if (params?.severity) query.set('severity', params.severity);
    const qs = query.toString();
    return request<any[]>(`/change-impacts${qs ? `?${qs}` : ''}`);
  },

  getPendingImpactCount: () =>
    request<{ total_impacts: number; reviewed_impacts: number; unreviewed_impacts: number }>('/change-impacts/pending-count'),

  reviewChangeImpact: (impactId: number, reviewed: boolean = true, comments?: string) =>
    request<any>(`/change-impacts/${impactId}/review`, {
      method: 'POST',
      body: JSON.stringify({ reviewed, comments, reviewed_by: 'Engineering Lead' }),
    }),

  // Catalog Health & Issues
  getCatalogHealth: () => request<any>('/catalog-health'),
  scanCatalogHealth: () => request<any>('/catalog-health/scan', { method: 'POST' }),

  getCatalogIssues: (params?: {
    page?: number;
    limit?: number;
    issue_type?: string;
    status?: string;
    severity?: string;
    product_id?: number;
    search?: string;
  }) => {
    const query = new URLSearchParams();
    if (params?.page) query.set('page', String(params.page));
    if (params?.limit) query.set('limit', String(params.limit));
    if (params?.issue_type && params.issue_type !== 'all') query.set('issue_type', params.issue_type);
    if (params?.status && params.status !== 'all') query.set('status', params.status);
    if (params?.severity && params.severity !== 'all') query.set('severity', params.severity);
    if (params?.product_id) query.set('product_id', String(params.product_id));
    if (params?.search) query.set('search', params.search);
    const qs = query.toString();
    return request<{ total: number; page: number; limit: number; items: any[] }>(`/catalog-issues${qs ? `?${qs}` : ''}`);
  },

  getCatalogIssueById: (id: number) => request<any>(`/catalog-issues/${id}`),

  resolveCatalogIssue: (issueId: number, value: string, notes?: string) =>
    request<any>(`/catalog-issues/${issueId}/resolve`, {
      method: 'POST',
      body: JSON.stringify({ value, notes, resolved_by: 'Engineering Lead' }),
    }),

  // Compliance Auditing
  getComplianceSummary: () => request<any>('/compliance/summary'),
  
  getComplianceProducts: (params?: { status?: string; search?: string }) => {
    const query = new URLSearchParams();
    if (params?.status) query.set('status', params.status);
    if (params?.search) query.set('search', params.search);
    const qs = query.toString();
    return request<any[]>(`/compliance/products${qs ? `?${qs}` : ''}`);
  },

  getComplianceProductDetail: (productId: number) =>
    request<any>(`/compliance/products/${productId}`),

  uploadAndMatchCertificate: (fileName: string, productId?: number) => {
    const formData = new FormData();
    formData.append('file_name', fileName);
    if (productId) formData.append('product_id', String(productId));
    return request<any>('/compliance/upload-match', {
      method: 'POST',
      body: formData,
    });
  },

  uploadComplianceFile: (file: File, productId?: number) => {
    const formData = new FormData();
    formData.append('file', file);
    if (productId) formData.append('product_id', String(productId));
    return request<any>('/compliance/upload-file', {
      method: 'POST',
      body: formData,
    });
  },

  resolveComplianceAction: (data: {
    certificate_id?: number;
    product_id?: number;
    action_type: string;
    value?: string;
    standard?: string;
    certification_body?: string;
    issue_date?: string;
    expiry_date?: string;
    scope?: string;
    spec_value?: string;
    temp_range?: string;
    atex_rating?: string;
    rohs_status?: string;
    safety_standard?: string;
    notes?: string;
    replacement_document_id?: number;
  }) =>
    request<any>('/compliance/resolve', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  // Suppliers
  getSuppliers: (status?: string) => {
    const query = new URLSearchParams();
    if (status) query.set('status', status);
    const qs = query.toString();
    return request<any[]>(`/suppliers${qs ? `?${qs}` : ''}`);
  },

  getSupplierById: (id: number) => request<any>(`/suppliers/${id}`),

  getSupplierProducts: (params?: {
    supplier_id?: number;
    product_id?: number;
    max_price?: number;
    max_delivery_days?: number;
    in_stock_only?: boolean;
  }) => {
    const query = new URLSearchParams();
    if (params?.supplier_id) query.set('supplier_id', String(params.supplier_id));
    if (params?.product_id) query.set('product_id', String(params.product_id));
    if (params?.max_price) query.set('max_price', String(params.max_price));
    if (params?.max_delivery_days) query.set('max_delivery_days', String(params.max_delivery_days));
    if (params?.in_stock_only) query.set('in_stock_only', 'true');
    const qs = query.toString();
    return request<any[]>(`/supplier-products${qs ? `?${qs}` : ''}`);
  },

  // Certificates & Compliance
  getCertificates: (params?: { product_id?: number; status?: string }) => {
    const query = new URLSearchParams();
    if (params?.product_id) query.set('product_id', String(params.product_id));
    if (params?.status) query.set('status', params.status);
    const qs = query.toString();
    return request<any[]>(`/certificates${qs ? `?${qs}` : ''}`);
  },

  getExpiringCertificates: (days: number = 90) => request<any[]>(`/certificates/expiring?days=${days}`),
  getExpiredCertificates: () => request<any[]>('/certificates/expired'),

  // Compatibility
  getCompatibility: (productId: number = 1) => request<any[]>(`/compatibility/${productId}`),

  // Quotes
  getQuotes: (status?: string) => {
    const query = new URLSearchParams();
    if (status) query.set('status', status);
    const qs = query.toString();
    return request<any[]>(`/quotes${qs ? `?${qs}` : ''}`);
  },

  getQuoteById: (id: number) => request<any>(`/quotes/${id}`),

  approveQuote: (id: number, approvedBy: string = 'Sales Operations') =>
    request<any>(`/quotes/${id}/approve?approved_by=${encodeURIComponent(approvedBy)}`, {
      method: 'POST',
    }),

  requestQuoteRevision: (id: number, quantity?: number, deliveryDays?: number, comments?: string) =>
    request<any>(`/quotes/${id}/request-revision`, {
      method: 'POST',
      body: JSON.stringify({ quantity, delivery_days: deliveryDays, comments }),
    }),

  postQuoteMatch: (data: any) =>
    request<any>('/quotes/match', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  postQuoteSimulateRevision: (data: any) =>
    request<any>('/quotes/simulate-revision', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  askCatalogChat: (message: string, conversationId?: string) =>
    request<any>('/catalog-ai/chat', {
      method: 'POST',
      body: JSON.stringify({ message, conversationId }),
    }),

  postSalesAssistantChat: (message: string, conversationId?: string) =>
    request<any>('/catalog-ai/chat', {
      method: 'POST',
      body: JSON.stringify({ message, conversationId }),
    }),

  // E-commerce
  getStorefrontData: (productCode: string) =>
    request<any>(`/ecommerce/storefront/${productCode}`),

  syncEcommerceCatalog: (productId: string | number) =>
    request<any>(`/ecommerce/sync/${productId}`, {
      method: 'POST',
    }),

  approveProductSync: (productId: string | number) =>
    request<any>(`/ecommerce/sync/${productId}`, {
      method: 'POST',
    }),

  inspectEcommerceWebsite: (websiteUrl: string, productCode?: string) =>
    request<any>('/ecommerce/inspect-website', {
      method: 'POST',
      body: JSON.stringify({ website_url: websiteUrl, product_code: productCode }),
    }),

  promoteVerifiedVersion: (data: {
    productId: string | number;
    newVersion: string | number;
    updates?: Record<string, any>;
    approvedBy?: string;
  }) =>
    request<any>('/ecommerce/promote-verified-version', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  pushEcommerceUpdate: (data: {
    api_endpoint: string;
    product_code: string;
    api_key?: string;
    website_url?: string;
  }) =>
    request<any>('/ecommerce/push-update', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  // Procurement
  parseProcurementPrompt: (prompt: string) =>
    request<any>('/procurement/parse-prompt', {
      method: 'POST',
      body: JSON.stringify({ prompt }),
    }),

  evaluateProcurement: (category: string, constraints: any[], quantity: number) =>
    request<any>('/procurement/evaluate', {
      method: 'POST',
      body: JSON.stringify({ category, constraints, quantity }),
    }),

  getProcurementSchemas: () => request<any>('/procurement/schemas'),
};
