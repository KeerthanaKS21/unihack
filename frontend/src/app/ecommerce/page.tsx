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
    unreviewedImpactsCount
  } = useApp();

  const isPublished = ecommerceStatus === 'published';
  const isSyncing = ecommerceStatus === 'syncing';

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
                Faceted search indexes rebuilt. SKU <code className="font-mono font-bold">SKU-MOT-XYZ450</code> now serves 7.5 kW spec.
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
                Current Live Storefront (Outdated v1.4)
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
                  src="https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=600&q=80"
                  alt="XYZ-450"
                  className="w-full h-full object-cover grayscale-30"
                />
              </div>
              <div>
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  Siemens Industrial
                </span>
                <h3 className="text-base font-bold text-slate-700">
                  XYZ-450 3-Phase Induction Motor (5.5 kW)
                </h3>
                <p className="text-xs text-slate-500 font-mono mt-0.5">
                  SKU: SKU-MOT-XYZ450-LEGACY
                </p>
              </div>
            </div>

            {/* Spec Table */}
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2 text-xs font-mono">
              <div className="flex justify-between py-1 border-b border-slate-200/60">
                <span className="text-slate-500 font-sans">Rated Power:</span>
                <span className="font-bold text-rose-700 line-through">5.5 kW (7.5 HP)</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-200/60">
                <span className="text-slate-500 font-sans">Full Load Speed:</span>
                <span className="font-bold text-rose-700 line-through">1440 RPM</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-200/60">
                <span className="text-slate-500 font-sans">Weight:</span>
                <span className="font-bold text-rose-700 line-through">42 kg</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-200/60">
                <span className="text-slate-500 font-sans">Efficiency:</span>
                <span className="font-bold text-slate-700">89.6% (IE2 High)</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-slate-500 font-sans">Faceted Search Filter:</span>
                <span className="font-bold text-rose-700 bg-rose-50 px-1.5 py-0.5 rounded border border-rose-200">
                  5.0 - 5.5 kW Motors
                </span>
              </div>
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
                Updated Storefront Payload Preview (v2.0 2026)
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
                  src="https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=600&q=80"
                  alt="XYZ-450"
                  className="w-full h-full object-cover"
                />
              </div>
              <div>
                <span className="text-xs font-bold text-blue-600 uppercase tracking-wider">
                  Siemens Industrial Automation
                </span>
                <h3 className="text-base font-bold text-slate-900">
                  XYZ-450 Premium 3-Phase Induction Motor (7.5 kW)
                </h3>
                <p className="text-xs text-slate-500 font-mono mt-0.5">
                  SKU: SKU-MOT-XYZ450-IE3
                </p>
              </div>
            </div>

            {/* Spec Table with highlighted changes */}
            <div className="p-3 bg-blue-50/40 rounded-xl border border-blue-200 space-y-2 text-xs font-mono">
              <div className="flex justify-between py-1 border-b border-blue-100">
                <span className="text-slate-600 font-sans">Rated Power:</span>
                <span className="font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                  7.5 kW (10 HP) ✨
                </span>
              </div>
              <div className="flex justify-between py-1 border-b border-blue-100">
                <span className="text-slate-600 font-sans">Full Load Speed:</span>
                <span className="font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                  1460 RPM ✨
                </span>
              </div>
              <div className="flex justify-between py-1 border-b border-blue-100">
                <span className="text-slate-600 font-sans">Weight:</span>
                <span className="font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                  45 kg (Frame 132M) ✨
                </span>
              </div>
              <div className="flex justify-between py-1 border-b border-blue-100">
                <span className="text-slate-600 font-sans">Efficiency:</span>
                <span className="font-bold text-blue-800">91.2% (IE3 Premium Class)</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-slate-600 font-sans">Faceted Search Filter:</span>
                <span className="font-bold text-blue-800 bg-blue-100/70 px-1.5 py-0.5 rounded border border-blue-200">
                  7.5 - 10 kW Motors
                </span>
              </div>
            </div>
          </div>

          <div className="p-3 bg-blue-50/50 border-t border-blue-200 flex items-center justify-between text-xs text-blue-900 font-semibold px-6">
            <span>Payload ready for JSON-LD & GraphQL Sync</span>
            <button
              onClick={approveEcommerceUpdate}
              className="text-xs font-bold text-blue-700 hover:text-blue-900 underline"
            >
              Push Update Now →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
