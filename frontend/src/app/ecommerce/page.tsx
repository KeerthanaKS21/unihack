'use client';

import React from 'react';
import { useApp } from '@/context/AppContext';
import { PageHeader } from '@/components/layout/PageHeader';
import { StatusBadge } from '@/components/common/StatusBadge';
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
  RefreshCw
} from 'lucide-react';
import Link from 'next/link';

export default function EcommerceUpdatePage() {
  const {
    ecommerceStatus,
    ecommerceLastSyncTime,
    approveEcommerceUpdate,
    unreviewedImpactsCount,
    activeProduct,
    products,
    setActiveProduct
  } = useApp();

  const isPublished = ecommerceStatus === 'published';
  const isSyncing = ecommerceStatus === 'syncing';

  // Extract keys dynamically from activeProduct specifications
  const specKeys = Array.from(new Set([
    ...Object.keys(activeProduct?.previousSpecs || {}),
    ...Object.keys(activeProduct?.specs || {})
  ]));

  return (
    <div className="space-y-6">
      <PageHeader
        title="B2B E-commerce Catalog Update Preview"
        subtitle="Automated API push synchronization for online industrial catalogs, search facet filters, and downloadable technical datasheets."
        breadcrumbs={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'E-commerce Update' }
        ]}
        badge={isPublished ? 'Live on Storefront' : 'Staged for API Push'}
        badgeVariant={isPublished ? 'success' : 'primary'}
        action={
          <div className="flex items-center gap-2.5">
            <Link
              href="/change-impact"
              className="px-3.5 py-2 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 text-xs font-bold rounded-lg shadow-2xs transition-colors inline-flex items-center gap-1.5"
            >
              <Zap className="w-4 h-4 text-amber-600" />
              <span>Review Impacts ({unreviewedImpactsCount})</span>
            </Link>

            <button
              onClick={approveEcommerceUpdate}
              disabled={isSyncing}
              className={`px-5 py-2 text-xs font-bold rounded-lg shadow-sm transition-all inline-flex items-center gap-2 ${
                isPublished
                  ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                  : 'bg-blue-600 hover:bg-blue-700 text-white'
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
                  <span>✓ Re-sync Storefront</span>
                </>
              ) : (
                <>
                  <Globe className="w-4 h-4" />
                  <span>Approve Website Update</span>
                </>
              )}
            </button>
          </div>
        }
      />

      {/* Product Selector Dropdown (Requirement #13) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div className="space-y-0.5">
          <h3 className="text-sm font-bold text-slate-900">Select Catalog Component</h3>
          <p className="text-xs text-slate-500 leading-relaxed">
            Choose a catalog component to preview version differences and push approved specifications to the storefront.
          </p>
        </div>
        <div className="flex items-center gap-2.5 shrink-0">
          <select
            value={activeProduct?.id}
            onChange={(e) => {
              const selected = products.find(p => p.id === e.target.value);
              if (selected) setActiveProduct(selected);
            }}
            className="px-3.5 py-2 bg-slate-50 hover:bg-slate-100/80 text-slate-800 text-xs font-bold rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer w-72"
          >
            {products.map(p => (
              <option key={p.id} value={p.id}>
                {p.manufacturer} {p.model} ({p.name})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Architecture Disclaimer: API Driven Sync (Requirement #11) */}
      <div className="bg-slate-900 text-white rounded-2xl p-5 border border-slate-800 shadow-md flex items-start gap-4">
        <div className="p-2.5 bg-blue-500/20 text-blue-400 border border-blue-400/30 rounded-xl shrink-0">
          <Globe className="w-6 h-6" />
        </div>
        <div className="space-y-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-bold text-blue-400 uppercase tracking-wider">
              Zero-Code Headless Architecture
            </span>
            <span className="text-[10px] font-mono px-2 py-0.2 rounded bg-slate-800 text-slate-300 border border-slate-700">
              REST / GraphQL Product API v2
            </span>
          </div>
          <h4 className="text-sm font-bold text-white">
            Automated Product Catalog Data Synchronization via REST / Webhook Endpoints
          </h4>
          <p className="text-xs text-slate-300 leading-relaxed max-w-4xl">
            This platform automatically transforms verified engineering intelligence into structured e-commerce payloads (Shopify Plus, SAP Commerce Cloud, Magento Enterprise, Adobe Commerce) without manual code modification.
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
                Storefront Published & Live at {ecommerceLastSyncTime || 'Just now'}
              </h4>
              <p className="text-[11px] text-emerald-800">
                Faceted search indexes rebuilt. SKU <code className="font-mono font-bold">SKU-MOT-{activeProduct.model}</code> now serves current specs.
              </p>
            </div>
          </div>
          <span className="text-xs font-mono font-bold text-emerald-700 bg-white px-2.5 py-1 rounded-md border border-emerald-200">
            HTTP 200 OK
          </span>
        </div>
      )}

      {/* Side-by-Side Before & After Storefront Comparison (Requirement #11) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: BEFORE PREVIEW (Legacy / Outdated) */}
        <div className="bg-white rounded-2xl border border-slate-300 shadow-xs overflow-hidden flex flex-col justify-between">
          <div className="p-4 bg-slate-100 border-b border-slate-200 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
              <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                Current Live Storefront (Outdated {activeProduct.previousVersion || 'v1.4'})
              </span>
            </div>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-rose-100 text-rose-800 font-bold border border-rose-200">
              Superseded
            </span>
          </div>

          <div className="p-6 space-y-4 flex-1">
            <div className="flex items-start gap-4">
              <div className="w-20 h-20 rounded-xl bg-slate-100 border border-slate-200 overflow-hidden shrink-0 opacity-80">
                <img
                  src={activeProduct.imageUrl}
                  alt={activeProduct.model}
                  className="w-full h-full object-cover grayscale-30"
                />
              </div>
              <div>
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  {activeProduct.manufacturer}
                </span>
                <h3 className="text-base font-bold text-slate-700">
                  {activeProduct.model} - {activeProduct.name}
                </h3>
                <p className="text-xs text-slate-500 font-mono mt-0.5">
                  SKU: SKU-{activeProduct.model}-LEGACY
                </p>
              </div>
            </div>

            {/* Spec Table */}
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2 text-xs font-mono">
              {specKeys.length > 0 ? (
                specKeys.map(key => {
                  const prevValue = activeProduct.previousSpecs?.[key as keyof typeof activeProduct.previousSpecs] || 'N/A';
                  const currValue = activeProduct.specs?.[key as keyof typeof activeProduct.specs] || 'N/A';
                  const isChanged = prevValue !== currValue;
                  const label = key.charAt(0).toUpperCase() + key.slice(1).replace(/([A-Z])/g, ' $1');
                  return (
                    <div key={key} className="flex justify-between py-1 border-b border-slate-200/60 last:border-0">
                      <span className="text-slate-500 font-sans">{label}:</span>
                      <span className={`font-bold ${isChanged ? 'text-rose-750 line-through' : 'text-slate-700'}`}>
                        {prevValue}
                      </span>
                    </div>
                  );
                })
              ) : (
                <div className="text-center py-4 text-slate-400 font-sans">No specifications found.</div>
              )}
            </div>
          </div>

          <div className="p-3 bg-slate-50 border-t border-slate-200 text-center text-xs text-slate-500 font-medium">
            Contains stale specification data risking warranty mismatch
          </div>
        </div>

        {/* Right: AFTER PREVIEW (Verified v2.0 Staged) */}
        <div className="bg-white rounded-2xl border-2 border-blue-500 shadow-md overflow-hidden flex flex-col justify-between">
          <div className="p-4 bg-blue-50/80 border-b border-blue-200 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-xs font-bold text-blue-950 uppercase tracking-wider">
                Updated Storefront Payload Preview ({activeProduct.currentVersion || 'v2.0'})
              </span>
            </div>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-bold border border-emerald-300">
              Verified Target
            </span>
          </div>

          <div className="p-6 space-y-4 flex-1">
            <div className="flex items-start gap-4">
              <div className="w-20 h-20 rounded-xl bg-slate-100 border border-slate-200 overflow-hidden shrink-0 ring-2 ring-blue-400">
                <img
                  src={activeProduct.imageUrl}
                  alt={activeProduct.model}
                  className="w-full h-full object-cover"
                />
              </div>
              <div>
                <span className="text-xs font-bold text-blue-600 uppercase tracking-wider">
                  {activeProduct.manufacturer}
                </span>
                <h3 className="text-base font-bold text-slate-900">
                  {activeProduct.model} - {activeProduct.name}
                </h3>
                <p className="text-xs text-slate-500 font-mono mt-0.5">
                  SKU: SKU-{activeProduct.model}-UPDATED
                </p>
              </div>
            </div>

            {/* Spec Table with highlighted changes */}
            <div className="p-3 bg-blue-50/40 rounded-xl border border-blue-200 space-y-2 text-xs font-mono">
              {specKeys.length > 0 ? (
                specKeys.map(key => {
                  const prevValue = activeProduct.previousSpecs?.[key as keyof typeof activeProduct.previousSpecs] || 'N/A';
                  const currValue = activeProduct.specs?.[key as keyof typeof activeProduct.specs] || 'N/A';
                  const isChanged = prevValue !== currValue;
                  const label = key.charAt(0).toUpperCase() + key.slice(1).replace(/([A-Z])/g, ' $1');
                  return (
                    <div key={key} className="flex justify-between py-1 border-b border-blue-100 last:border-0">
                      <span className="text-slate-600 font-sans">{label}:</span>
                      {isChanged ? (
                        <span className="font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                          {currValue} ✨
                        </span>
                      ) : (
                        <span className="font-bold text-slate-800">
                          {currValue}
                        </span>
                      )}
                    </div>
                  );
                })
              ) : (
                <div className="text-center py-4 text-slate-400 font-sans">No specifications found.</div>
              )}
            </div>
          </div>

          <div className="p-3 bg-blue-50/50 border-t border-blue-200 flex items-center justify-between text-xs text-blue-900 font-semibold px-6">
            <span>Payload ready for JSON-LD & GraphQL Sync</span>
            <button
              onClick={approveEcommerceUpdate}
              disabled={isSyncing}
              className="text-xs font-bold text-blue-700 hover:text-blue-900 underline disabled:opacity-50"
            >
              Push Update Now →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

