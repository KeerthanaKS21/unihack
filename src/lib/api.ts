/**
 * VeriSpec AI - REST API Client
 * Centralized API adapter for communicating with the FastAPI backend.
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';

async function fetchJson<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;
  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });

  if (!response.ok) {
    let errorDetail = response.statusText;
    try {
      const err = await response.json();
      errorDetail = err.detail || errorDetail;
    } catch {
      // ignore
    }
    throw new Error(`API Error [${response.status}] ${endpoint}: ${errorDetail}`);
  }

  return response.json();
}

export const api = {
  // Dashboard Summary
  getDashboardSummary: () => fetchJson<any>('/dashboard/summary'),

  // Documents
  getDocuments: (params?: { page?: number; limit?: number; search?: string; document_type?: string; processing_status?: string; product_id?: number }) => {
    const query = new URLSearchParams();
    if (params?.page) query.set('page', String(params.page));
    if (params?.limit) query.set('limit', String(params.limit));
    if (params?.search) query.set('search', params.search);
    if (params?.document_type) query.set('document_type', params.document_type);
    if (params?.processing_status) query.set('processing_status', params.processing_status);
    if (params?.product_id) query.set('product_id', String(params.product_id));
    const qs = query.toString();
    return fetchJson<any>(`/documents${qs ? `?${qs}` : ''}`);
  },

  uploadDocument: async (file: File, productId?: number, uploadedBy?: string) => {
    const formData = new FormData();
    formData.append('file', file);
    if (productId) formData.append('product_id', String(productId));
    if (uploadedBy) formData.append('uploaded_by', uploadedBy);

    const response = await fetch(`${API_BASE_URL}/documents/upload`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err.detail || 'Document upload failed');
    }

    return response.json();
  },

  // Products
  getProducts: (params?: { page?: number; limit?: number; search?: string; category?: string; manufacturer?: string }) => {
    const query = new URLSearchParams();
    if (params?.page) query.set('page', String(params.page));
    if (params?.limit) query.set('limit', String(params.limit));
    if (params?.search) query.set('search', params.search);
    if (params?.category) query.set('category', params.category);
    if (params?.manufacturer) query.set('manufacturer', params.manufacturer);
    const qs = query.toString();
    return fetchJson<any>(`/products${qs ? `?${qs}` : ''}`);
  },

  getProductById: (id: number) => fetchJson<any>(`/products/${id}`),
  getProductVersions: (id: number) => fetchJson<any>(`/products/${id}/versions`),
  getProductChanges: (id: number) => fetchJson<any>(`/products/${id}/changes`),
  getProductAttributes: (id: number) => fetchJson<any>(`/products/${id}/attributes`),
  getProductCompliance: (id: number) => fetchJson<any>(`/products/${id}/compliance`),
  getProductCompatibility: (id: number) => fetchJson<any>(`/products/${id}/compatibility`),

  // Changes & Change Impacts
  getChanges: () => fetchJson<any[]>('/changes'),
  getChangeImpacts: () => fetchJson<any[]>('/change-impacts'),
  getPendingImpactCount: () => fetchJson<{ total_impacts: number; reviewed_impacts: number; unreviewed_impacts: number }>('/change-impacts/pending-count'),
  reviewChangeImpact: (impactId: number, reviewed: boolean = true, comments?: string) =>
    fetchJson<any>(`/change-impacts/${impactId}/review`, {
      method: 'POST',
      body: JSON.stringify({ reviewed, comments, reviewed_by: 'Engineering Lead' }),
    }),

  // Catalog Health & Issues
  getCatalogHealth: () => fetchJson<any>('/catalog-health'),
  getCatalogIssues: (params?: { issue_type?: string; status?: string }) => {
    const query = new URLSearchParams();
    if (params?.issue_type) query.set('issue_type', params.issue_type);
    if (params?.status) query.set('status', params.status);
    const qs = query.toString();
    return fetchJson<any>(`/catalog-issues${qs ? `?${qs}` : ''}`);
  },
  resolveCatalogIssue: (issueId: number, resolutionValue: string, comments?: string) =>
    fetchJson<any>(`/catalog-issues/${issueId}/resolve`, {
      method: 'POST',
      body: JSON.stringify({ resolution_value: resolutionValue, comments, resolved_by: 'Engineering Lead' }),
    }),

  // Suppliers & Procurement
  getSuppliers: () => fetchJson<any[]>('/suppliers'),
  getSupplierProducts: () => fetchJson<any[]>('/supplier-products'),

  // Certificates & Compliance
  getCertificates: () => fetchJson<any[]>('/certificates'),
  getExpiringCertificates: (days: number = 90) => fetchJson<any[]>(`/certificates/expiring?days=${days}`),

  // Compatibility
  getCompatibility: (productId: number = 1) => fetchJson<any[]>(`/compatibility/${productId}`),

  // Quotes
  getQuotes: () => fetchJson<any[]>('/quotes'),
  getQuoteById: (id: number) => fetchJson<any>(`/quotes/${id}`),
  approveQuote: (id: number) => fetchJson<any>(`/quotes/${id}/approve`, { method: 'POST' }),
  requestQuoteRevision: (id: number, quantity?: number, deliveryDays?: number) =>
    fetchJson<any>(`/quotes/${id}/request-revision`, {
      method: 'POST',
      body: JSON.stringify({ quantity, delivery_days: deliveryDays }),
    }),
};
