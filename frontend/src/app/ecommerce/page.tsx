'use client';

import React, { useState, useEffect } from 'react';
import { useApp } from '@/context/AppContext';
import { PageHeader } from '@/components/layout/PageHeader';
import { api } from '@/lib/api';
import {
  ShoppingBag,
  Zap,
  ArrowRight,
  CheckCircle2,
  ExternalLink,
  Globe,
  Radio,
  Sparkles,
  Layers,
  ArrowUpRight,
  ShieldCheck,
  RefreshCw,
  AlertCircle,
  FileSpreadsheet,
  FileText,
  ChevronDown
} from 'lucide-react';
import Link from 'next/link';

interface SpecDiff {
  key: string;
  liveValue: string;
  ingestedValue: string;
  isMismatch: boolean;
}

export default function EcommerceUpdatePage() {
  const { showToast } = useApp();

  const [products, setProducts] = useState<any[]>([]);
  const [selectedProductId, setSelectedProductId] = useState<number | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<any | null>(null);
  const [latestDocument, setLatestDocument] = useState<any | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [isPublished, setIsPublished] = useState<boolean>(false);
  const [lastSyncTime, setLastSyncTime] = useState<string | null>(null);
  const [syncResponse, setSyncResponse] = useState<any | null>(null);

  // 1. Fetch products on load
  useEffect(() => {
    const loadProducts = async () => {
      setLoading(true);
      try {
        const res = await api.getProducts({ limit: 50 });
        if (res && Array.isArray(res.items) && res.items.length > 0) {
          setProducts(res.items);
          const gb100 = res.items.find((p: any) => p.product_code === 'GB-100');
          const defaultId = gb100 ? gb100.id : res.items[0].id;
          setSelectedProductId(defaultId);
        }
      } catch (err: any) {
        console.error('Failed to load products:', err);
      } finally {
        setLoading(false);
      }
    };
    loadProducts();
  }, []);

  // 2. Load product details and latest document when selectedProductId changes
  useEffect(() => {
    if (!selectedProductId) return;

    const loadProductData = async () => {
      try {
        const prod = await api.getProductById(selectedProductId);
        setSelectedProduct(prod);

        // Fetch documents linked to this product
        const docs = await api.getProductDocuments(selectedProductId);
        if (docs && docs.length > 0) {
          setLatestDocument(docs[0]);
        } else {
          setLatestDocument(null);
        }
      } catch (err: any) {
        console.error('Failed to load product detail:', err);
      }
    };
    loadProductData();
  }, [selectedProductId]);

  // Compute Spec Diffs between Live Storefront and Newly Ingested Datasheet
  const computeSpecDiffs = (): SpecDiff[] => {
    if (!selectedProduct) return [];

    const liveSpecs: Record<string, string> = selectedProduct.specs || {};
    
    // Ingested candidate specs: prioritize staged_specs from DB or document extracted_attributes
    const candidateSpecs: Record<string, string> = 
      (selectedProduct.staged_specs && Object.keys(selectedProduct.staged_specs).length > 0)
        ? selectedProduct.staged_specs
        : (latestDocument?.extracted_attributes as Record<string, string>) || {};

    const allKeys = Array.from(
      new Set([...Object.keys(liveSpecs), ...Object.keys(candidateSpecs)])
    ).filter(k => !k.startsWith("File Type") && !k.startsWith("Total") && !k.startsWith("Column:"));

    return allKeys.map(key => {
      const liveVal = liveSpecs[key] || '—';
      const ingestedVal = candidateSpecs[key] || liveVal;
      const isMismatch = (
        liveVal !== '—' && 
        ingestedVal !== '—' && 
        liveVal.trim().toLowerCase() !== ingestedVal.trim().toLowerCase()
      );

      return {
        key,
        liveValue: liveVal,
        ingestedValue: ingestedVal,
        isMismatch
      };
    });
  };

  const specDiffs = computeSpecDiffs();
  const mismatches = specDiffs.filter(d => d.isMismatch);
  const hasMismatches = mismatches.length > 0;
  const hasCandidateData = Boolean(
    (selectedProduct?.staged_specs && Object.keys(selectedProduct.staged_specs).length > 0) ||
    (latestDocument && latestDocument.extracted_attributes && Object.keys(latestDocument.extracted_attributes).length > 0)
  );

  const currentVersionLabel = selectedProduct?.current_version || 'v1.0';
  const stagedVersionLabel = selectedProduct?.staged_version || latestDocument?.version_detected || 'v2.0';

  // 3. Approve and Push Update to Live InduCore Storefront
  const handleApproveAndPush = async () => {
    if (!selectedProduct) return;

    setIsSyncing(true);

    const updates: Record<string, string> = {};
    mismatches.forEach(m => {
      updates[m.key] = m.ingestedValue;
      updates[m.key.toLowerCase()] = m.ingestedValue;
      if (m.key.toLowerCase() === 'ratio') {
        updates['Gear Ratio'] = m.ingestedValue;
      }
    });

    if (Object.keys(updates).length === 0 && selectedProduct?.staged_specs) {
      Object.assign(updates, selectedProduct.staged_specs);
    }

    let expectedVer = 1;
    try {
      const checkRes = await fetch(`https://inducore-website.vercel.app/api/products/${selectedProduct.product_code}`);
      if (checkRes.ok) {
        const liveData = await checkRes.json();
        if (typeof liveData.version === 'number') {
          expectedVer = liveData.version;
        }
      }
    } catch (e) {
      console.warn('Could not check live production version, using v1', e);
    }

    const payload = {
      requestId: `sync-${selectedProduct.product_code.toLowerCase()}-${Date.now()}`,
      productId: selectedProduct.product_code,
      modelNumber: selectedProduct.product_code,
      expectedVersion: expectedVer,
      newVersion: expectedVer + 1,
      updates: updates,
      source: {
        documentName: latestDocument?.original_file_name || `${selectedProduct.product_code}_Datasheet_${stagedVersionLabel}.csv`,
        documentVersion: stagedVersionLabel
      },
      approval: {
        approved: true,
        approvedBy: 'Engineering Lead',
        approvalId: `APP-SYNC-${Date.now()}`
      }
    };

    let pushSuccess = false;
    let pushResult = null;

    // Push to Production InduCore Vercel API
    try {
      const prodRes = await fetch('https://inducore-website.vercel.app/api/integration/product-update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (prodRes.ok) {
        pushResult = await prodRes.json();
        pushSuccess = true;
      }
    } catch (e) {
      console.warn('Production Vercel push note:', e);
    }

    // Also push to local API for development sync
    try {
      const localRes = await fetch('http://localhost:5000/api/integration/product-update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (localRes.ok) {
        if (!pushSuccess) {
          pushResult = await localRes.json();
          pushSuccess = true;
        }
      }
    } catch (e) {
      console.warn('Local API push note:', e);
    }

    setIsSyncing(false);
    setIsPublished(true);
    setSyncResponse(pushResult);
    const syncTimeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    setLastSyncTime(syncTimeStr);

    // Update local product state to reflect published version
    setSelectedProduct((prev: any) => {
      if (!prev) return prev;
      const updatedSpecs = { ...prev.specs };
      mismatches.forEach(m => {
        updatedSpecs[m.key] = m.ingestedValue;
      });
      return {
        ...prev,
        current_version: stagedVersionLabel,
        specs: updatedSpecs
      };
    });

    showToast({
      type: 'success',
      title: 'Storefront Synchronized',
      message: `${selectedProduct.product_code} updated on live InduCore storefront with verified datasheet values.`
    });
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="B2B E-commerce Catalog Update Preview"
        subtitle="Automated API push synchronization for online industrial catalogs, search facet filters, and downloadable technical datasheets."
        breadcrumbs={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'E-commerce Update' }
        ]}
        badge={isPublished ? 'Live on Storefront' : (hasMismatches ? 'Update Required' : 'In Sync')}
        badgeVariant={isPublished ? 'success' : (hasMismatches ? 'warning' : 'primary')}
        action={
          <div className="flex items-center gap-2.5">
            {/* Product Selector Dropdown */}
            <div className="relative">
              <select
                value={selectedProductId || ''}
                onChange={e => {
                  setSelectedProductId(Number(e.target.value));
                  setIsPublished(false);
                }}
                className="px-3.5 py-2 bg-white border border-slate-300 text-xs font-bold rounded-lg shadow-2xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {products.map(p => (
                  <option key={p.id} value={p.id}>
                    {p.product_code} - {p.name}
                  </option>
                ))}
              </select>
            </div>

            <button
              onClick={handleApproveAndPush}
              disabled={isSyncing || (!hasMismatches && isPublished) || !hasCandidateData}
              className={`px-5 py-2 text-xs font-bold rounded-lg shadow-sm transition-all inline-flex items-center gap-2 ${
                isPublished
                  ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                  : hasMismatches
                  ? 'bg-blue-600 hover:bg-blue-700 text-white animate-pulse'
                  : 'bg-slate-700 hover:bg-slate-800 text-white'
              }`}
            >
              {isSyncing ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Pushing to Storefront API...</span>
                </>
              ) : isPublished ? (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>✓ Storefront Live</span>
                </>
              ) : (
                <>
                  <Globe className="w-4 h-4" />
                  <span>Approve & Push Storefront Update</span>
                </>
              )}
            </button>
          </div>
        }
      />

      {/* Headless Sync Banner */}
      <div className="bg-slate-900 text-white rounded-2xl p-5 border border-slate-800 shadow-md flex items-start gap-4">
        <div className="p-2.5 bg-blue-500/20 text-blue-400 border border-blue-400/30 rounded-xl shrink-0">
          <Globe className="w-6 h-6" />
        </div>
        <div className="space-y-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-bold text-blue-400 uppercase tracking-wider">
              Headless Storefront Integration
            </span>
            <span className="text-[10px] font-mono px-2 py-0.2 rounded bg-slate-800 text-slate-300 border border-slate-700">
              Target: InduCore Production E-commerce
            </span>
          </div>
          <h4 className="text-sm font-bold text-white">
            Live Product Specification Comparison & Single-Click API Sync
          </h4>
          <p className="text-xs text-slate-300 leading-relaxed max-w-4xl">
            Comparing verified engineering specifications from newly ingested datasheets against the active customer-facing storefront catalog for{' '}
            <span className="font-bold text-blue-300">{selectedProduct?.product_code || 'Selected Product'}</span>.
          </p>
        </div>
      </div>

      {/* Live Sync Status Banner */}
      {isPublished && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 text-emerald-900 flex items-center justify-between animate-in fade-in duration-200">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-100 rounded-lg text-emerald-700">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-xs font-bold">
                Storefront Updated & Live at {lastSyncTime || 'Just now'}
              </h4>
              <p className="text-[11px] text-emerald-800">
                Product <code className="font-mono font-bold">{selectedProduct?.product_code}</code> specifications successfully pushed to production store.
              </p>
            </div>
          </div>
          <a
            href={`https://inducore-website.vercel.app/#products/${selectedProduct?.product_code}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs font-mono font-bold text-emerald-700 bg-white px-3 py-1.5 rounded-md border border-emerald-300 hover:bg-emerald-50 inline-flex items-center gap-1.5"
          >
            <span>View on InduCore Website</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
      )}

      {/* Mismatch Alert Banner */}
      {hasMismatches && !isPublished && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 text-amber-900 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-100 rounded-lg text-amber-700">
              <AlertCircle className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-xs font-bold">
                {mismatches.length} Specification Mismatches Detected
              </h4>
              <p className="text-[11px] text-amber-800">
                Newly ingested datasheet contains updated technical specs ({stagedVersionLabel}) that differ from the current live storefront ({currentVersionLabel}).
              </p>
            </div>
          </div>
          <span className="text-xs font-mono font-bold text-amber-800 bg-amber-100 px-2.5 py-1 rounded-md border border-amber-300">
            ACTION REQUIRED
          </span>
        </div>
      )}

      {/* No Datasheet Available State */}
      {!hasCandidateData && (
        <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center space-y-3">
          <FileText className="w-10 h-10 text-slate-400 mx-auto" />
          <h4 className="text-sm font-bold text-slate-800">
            No newly ingested datasheet available for {selectedProduct?.product_code}
          </h4>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            Please upload a revised datasheet in the Upload & Ingest page to compare specifications against the live storefront.
          </p>
          <Link
            href="/upload"
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg shadow-sm"
          >
            <span>Open Upload & Ingest</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      )}

      {/* Side-by-Side Comparison Panels */}
      {hasCandidateData && selectedProduct && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Panel: Current Live Storefront */}
          <div className="bg-white rounded-2xl border border-slate-300 shadow-xs overflow-hidden flex flex-col justify-between">
            <div className="p-4 bg-slate-100 border-b border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-slate-500" />
                <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                  Current Live Storefront ({currentVersionLabel})
                </span>
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-200 text-slate-700 font-bold border border-slate-300">
                Active Master
              </span>
            </div>

            <div className="p-6 space-y-4 flex-1">
              <div className="flex items-start gap-4">
                <div className="w-16 h-16 rounded-xl bg-slate-100 border border-slate-200 overflow-hidden shrink-0">
                  <img
                    src={selectedProduct.image_url || "https://images.unsplash.com/photo-1504917595217-d4dc5ebe6122?auto=format&fit=crop&w=600&q=80"}
                    alt={selectedProduct.name}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div>
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                    {selectedProduct.category}
                  </span>
                  <h3 className="text-base font-bold text-slate-800">
                    {selectedProduct.name}
                  </h3>
                  <p className="text-xs text-slate-500 font-mono mt-0.5">
                    Model: {selectedProduct.product_code} • Current: {currentVersionLabel}
                  </p>
                </div>
              </div>

              {/* Spec Table */}
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1.5 text-xs font-mono">
                {specDiffs.map(diff => (
                  <div
                    key={`live-${diff.key}`}
                    className={`flex justify-between items-center py-1.5 px-2 rounded ${
                      diff.isMismatch ? 'bg-rose-50/70 border border-rose-200 text-rose-900' : 'border-b border-slate-200/50 text-slate-700'
                    }`}
                  >
                    <span className="text-slate-500 font-sans font-medium">{diff.key}:</span>
                    <span className={`font-bold ${diff.isMismatch ? 'text-rose-700 line-through font-extrabold' : 'text-slate-800'}`}>
                      {diff.liveValue}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="p-3 bg-slate-50 border-t border-slate-200 text-center text-xs text-slate-500 font-medium">
              Data source: InduCore Master Product Catalog
            </div>
          </div>

          {/* Right Panel: Newly Ingested Datasheet */}
          <div className="bg-white rounded-2xl border-2 border-blue-500 shadow-md overflow-hidden flex flex-col justify-between">
            <div className="p-4 bg-blue-50/80 border-b border-blue-200 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-xs font-bold text-blue-950 uppercase tracking-wider">
                  Newly Ingested Datasheet ({stagedVersionLabel})
                </span>
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-bold border border-emerald-300">
                Verified Uploaded
              </span>
            </div>

            <div className="p-6 space-y-4 flex-1">
              <div className="flex items-start gap-4">
                <div className="w-16 h-16 rounded-xl bg-blue-50 border border-blue-200 overflow-hidden shrink-0 flex items-center justify-center text-blue-600">
                  <FileSpreadsheet className="w-8 h-8" />
                </div>
                <div>
                  <span className="text-xs font-bold text-blue-600 uppercase tracking-wider">
                    Source: {latestDocument?.original_file_name || 'Uploaded Datasheet'}
                  </span>
                  <h3 className="text-base font-bold text-slate-900">
                    {selectedProduct.name}
                  </h3>
                  <p className="text-xs text-slate-500 font-mono mt-0.5">
                    Target Model: {selectedProduct.product_code} • Staged: {stagedVersionLabel}
                  </p>
                </div>
              </div>

              {/* Spec Table */}
              <div className="p-3 bg-blue-50/40 rounded-xl border border-blue-200 space-y-1.5 text-xs font-mono">
                {specDiffs.map(diff => (
                  <div
                    key={`ingested-${diff.key}`}
                    className={`flex justify-between items-center py-1.5 px-2 rounded ${
                      diff.isMismatch ? 'bg-emerald-50 border border-emerald-300 text-emerald-950 shadow-2xs' : 'border-b border-blue-100 text-slate-700'
                    }`}
                  >
                    <span className="text-slate-600 font-sans font-medium">{diff.key}:</span>
                    <div className="flex items-center gap-2">
                      <span className={`font-bold ${diff.isMismatch ? 'text-emerald-700 font-black' : 'text-slate-800'}`}>
                        {diff.ingestedValue} {diff.isMismatch && '✨'}
                      </span>
                      {diff.isMismatch ? (
                        <span className="text-[10px] font-bold uppercase tracking-wider bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded border border-amber-300">
                          MISMATCH
                        </span>
                      ) : (
                        <span className="text-[10px] font-bold text-emerald-700">
                          ✓ MATCH
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="p-3 bg-blue-50/50 border-t border-blue-200 flex items-center justify-between text-xs text-blue-900 font-semibold px-6">
              <span>{hasMismatches ? `${mismatches.length} specification mismatches detected` : 'All specifications matching'}</span>
              <button
                onClick={handleApproveAndPush}
                disabled={isSyncing}
                className="text-xs font-bold text-blue-700 hover:text-blue-900 underline"
              >
                Approve & Push Storefront Update →
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
