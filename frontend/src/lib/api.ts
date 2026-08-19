/**
 * VeriSpec AI - Centralized REST API Client
 * Seamlessly bridges the Next.js Frontend with the FastAPI Backend.
 */

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL
    ? `${process.env.NEXT_PUBLIC_API_BASE_URL.replace(/\/+$/, '')}/api`
    : process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';

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
  const url = `${API_BASE_URL}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;
  
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

  resolveCatalogIssue: (issueId: number, resolutionValue: string, comments?: string) =>
    request<any>(`/catalog-issues/${issueId}/resolve`, {
      method: 'POST',
      body: JSON.stringify({ resolution_value: resolutionValue, comments, resolved_by: 'Engineering Lead' }),
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

  postQuoteMatch: (data: {
    company?: string;
    contactPerson?: string;
    email?: string;
    phone?: string;
    referenceNumber?: string;
    requirementText: string;
    document_id?: number;
    documentId?: number;
    product_id?: number;
    productId?: number;
  }) =>
    request<any>('/quotes/match', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  postQuoteSimulateRevision: (data: {
    quoteNumber?: string;
    productModel?: string;
    supplierName?: string;
    originalQuantity: number;
    newQuantity: number;
    originalDeliveryDays: number;
    newDeliveryDays: number;
    unitPrice?: number;
  }) =>
    request<any>('/quotes/simulate-revision', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  // Sales Assistant
  postSalesAssistantChat: (message: string, conversationId?: string) =>
    request<any>('/sales-assistant/chat', {
      method: 'POST',
      body: JSON.stringify({ message, conversationId }),
    }),

  // E-commerce
  syncEcommerceCatalog: (productId: string | number) =>
    request<any>(`/ecommerce/sync/${productId}`, {
      method: 'POST',
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

