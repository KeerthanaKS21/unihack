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
  ShieldCheck,
  RefreshCw,
  Search,
  Send,
  Lock,
  Check,
  AlertTriangle,
  FileText,
  Loader2,
  Link as LinkIcon,
  KeyRound,
  PackageCheck,
  Edit3,
  UploadCloud
} from 'lucide-react';
import Link from 'next/link';

export default function EcommerceUpdatePage() {
  const { showToast } = useApp();

  // Dynamic Products List from Database (Zero Mock Data)
  const [productsList, setProductsList] = useState<any[]>([]);
  const [productCode, setProductCode] = useState('');
  const [websiteUrl, setWebsiteUrl] = useState('https://inducore-website.vercel.app/');
  const [apiEndpoint, setApiEndpoint] = useState('https://inducore-website.vercel.app/api/integration/product-update');
  const [apiKey, setApiKey] = useState('');

  // Live Inspection & Sync State
  const [inspecting, setInspecting] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [inspectionData, setInspectionData] = useState<any | null>(null);
  const [lastSyncResult, setLastSyncResult] = useState<any | null>(null);
  const [isStorefrontUpdated, setIsStorefrontUpdated] = useState(false);

  // Fetch dynamic products strictly from backend
  const loadCatalogProducts = async () => {
    try {
      const res: any = await api.getProducts({ limit: 100 });
      const items = Array.isArray(res) ? res : (res?.items || []);
      setProductsList(items);
      if (items.length > 0) {
        const initialCode = items[0].product_code;
        setProductCode(initialCode);
        runInspection(initialCode, websiteUrl);
      } else {
        setProductCode('');
        setInspectionData(null);
      }
    } catch (err) {
      console.warn('Could not fetch products list from API:', err);
      setProductsList([]);
    }
  };

  useEffect(() => {
    loadCatalogProducts();
  }, []);

  // Run live inspection against backend crawler
  const runInspection = async (pCode = productCode, wUrl = websiteUrl) => {
    if (!pCode) return;
    setInspecting(true);
    try {
      const res = await fetch('http://localhost:8000/api/ecommerce/inspect-website', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          website_url: wUrl,
          product_code: pCode
        })
      });
      if (res.ok) {
        const data = await res.json();
        setInspectionData(data);
      }
    } catch (err) {
      console.warn('Inspection error:', err);
    } finally {
      setInspecting(false);
    }
  };

  // Switch active product
  const handleSelectProduct = (code: string) => {
    if (!code) return;
    const cleanCode = code.trim().toUpperCase();
    setProductCode(cleanCode);
    setIsStorefrontUpdated(false);
    runInspection(cleanCode, websiteUrl);
  };

  // Push verified update to website API endpoint
  const handlePushUpdate = async () => {
    if (!productCode) return;
    setSyncing(true);
    try {
      const res = await fetch('http://localhost:8000/api/ecommerce/push-update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          api_endpoint: apiEndpoint,
          product_code: productCode,
          api_key: apiKey || undefined
        })
      });
      if (!res.ok) {
        throw new Error(`Push failed (HTTP ${res.status})`);
      }
      const data = await res.json();
      setLastSyncResult(data);
      setIsStorefrontUpdated(true);
      showToast({
        type: 'success',
        title: 'Website Updated Successfully',
        message: `Pushed ${productCode} verified specifications to storefront API endpoint.`
      });

      // Re-inspect to reflect live sync state
      await runInspection();
    } catch (err: any) {
      showToast({
        type: 'error',
        title: 'Push Failed',
        message: err.message || 'Could not reach storefront update endpoint.'
      });
    } finally {
      setSyncing(false);
    }
  };

  const mismatches = inspectionData?.comparison_matrix?.filter((m: any) => m.status === 'MISMATCH') || [];
  const totalMismatches = mismatches.length;

  return (
    <div className="space-y-6">
      <PageHeader
        title="B2B E-commerce Catalog Update & Storefront Sync"
        subtitle="Automated intelligence inspecting live website listings, identifying specification discrepancies, and publishing verified updates via API."
        breadcrumbs={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'E-commerce Update' }
        ]}
        badge={isStorefrontUpdated ? 'Live on Storefront' : totalMismatches > 0 ? `${totalMismatches} Discrepancies Detected` : 'Storefront in Sync'}
        badgeVariant={isStorefrontUpdated ? 'success' : totalMismatches > 0 ? 'warning' : 'primary'}
        action={
          <div className="flex items-center gap-2.5">
            <a
              href={websiteUrl}
              target="_blank"
              rel="noreferrer"
              className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-lg border border-slate-200 shadow-2xs transition-colors inline-flex items-center gap-1.5"
            >
              <ExternalLink className="w-4 h-4 text-slate-500" />
              <span>Open Live Website ↗</span>
            </a>

            <Link
              href="/change-impact"
              className="px-3.5 py-2 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 text-xs font-bold rounded-lg shadow-2xs transition-colors inline-flex items-center gap-1.5"
            >
              <Zap className="w-4 h-4 text-amber-600" />
              <span>Review Change Impacts</span>
            </Link>

            <button
              onClick={handlePushUpdate}
              disabled={syncing || !productCode}
              className={`px-5 py-2 text-xs font-bold rounded-lg shadow-sm transition-all inline-flex items-center gap-2 ${
                isStorefrontUpdated
                  ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                  : 'bg-blue-600 hover:bg-blue-700 text-white disabled:bg-slate-300'
              }`}
            >
              {syncing ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Pushing to Website API...</span>
                </>
              ) : isStorefrontUpdated ? (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>✓ Re-push to Website</span>
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  <span>Push Update to Website</span>
                </>
              )}
            </button>
          </div>
        }
      />

      {/* ========================================================================= */}
      {/* 1. PRODUCT SELECTOR & CONNECTION TOOLBAR                                  */}
      {/* ========================================================================= */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-5">
        {/* Product Selection Bar */}
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 border-b border-slate-100 pb-4">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-blue-600 block">
              Active Catalog Target
            </span>
            <h3 className="text-base font-extrabold text-slate-900 tracking-tight flex items-center gap-2 mt-0.5">
              <span>{inspectionData?.product_name || (productCode ? `${productCode} Industrial Equipment` : 'No Catalog Products Loaded')}</span>
              {productCode && (
                <span className="text-xs font-mono font-bold px-2 py-0.5 bg-blue-100 text-blue-800 rounded border border-blue-200">
                  {productCode}
                </span>
              )}
            </h3>
          </div>

          {/* Clickable Product Tabs & Dropdown */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-bold text-slate-500 mr-1">Switch Product:</span>
            
            {/* Quick-Switch Pill Buttons */}
            {productsList.slice(0, 8).map(p => (
              <button
                key={p.id || p.product_code}
                type="button"
                onClick={() => handleSelectProduct(p.product_code)}
                className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all shadow-2xs cursor-pointer ${
                  productCode === p.product_code
                    ? 'bg-blue-600 text-white ring-2 ring-blue-600/30'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200'
                }`}
              >
                {p.product_code}
              </button>
            ))}

            {/* Select Dropdown for all items */}
            {productsList.length > 0 && (
              <select
                value={productCode}
                onChange={e => handleSelectProduct(e.target.value)}
                className="text-xs font-bold px-3 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
              >
                {productsList.map((p, idx) => (
                  <option key={p.id || idx} value={p.product_code}>
                    {p.product_code} — {p.name || p.product_code}
                  </option>
                ))}
              </select>
            )}

            <button
              onClick={loadCatalogProducts}
              className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 transition-colors"
              title="Refresh product list"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* URL Inputs Matrix */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Input 1: Website Link */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
              <LinkIcon className="w-3.5 h-3.5 text-blue-600" />
              <span>Website Product URL (To Read)</span>
            </label>
            <input
              type="text"
              value={websiteUrl}
              onChange={e => setWebsiteUrl(e.target.value)}
              placeholder="https://inducore-website.vercel.app/"
              className="w-full text-xs font-mono p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>

          {/* Input 2: Update API Endpoint */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
              <Send className="w-3.5 h-3.5 text-emerald-600" />
              <span>Update API Endpoint (To Write)</span>
            </label>
            <input
              type="text"
              value={apiEndpoint}
              onChange={e => setApiEndpoint(e.target.value)}
              placeholder="https://inducore-website.vercel.app/api/integration/product-update"
              className="w-full text-xs font-mono p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>

          {/* Input 3: API Key & Action */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
              <KeyRound className="w-3.5 h-3.5 text-purple-600" />
              <span>API Secret Key (Optional)</span>
            </label>
            <div className="flex items-center gap-2">
              <input
                type="password"
                value={apiKey}
                onChange={e => setApiKey(e.target.value)}
                placeholder="Optional Bearer token"
                className="w-full text-xs font-mono p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
              <button
                onClick={() => runInspection()}
                disabled={inspecting || !productCode}
                className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 disabled:bg-slate-300 text-white text-xs font-bold rounded-lg shadow-xs transition-colors shrink-0 inline-flex items-center gap-1.5 cursor-pointer"
              >
                {inspecting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Search className="w-3.5 h-3.5" />}
                <span>Inspect</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Zero Products Empty State */}
      {productsList.length === 0 && (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto">
            <UploadCloud className="w-7 h-7" />
          </div>
          <div className="space-y-1 max-w-md mx-auto">
            <h3 className="text-base font-bold text-slate-900">No Products in Master Catalog Yet</h3>
            <p className="text-xs text-slate-500">
              Upload your catalog spreadsheet (CSV or Excel) on the Document Upload page to ingest products and begin automated synchronization.
            </p>
          </div>
          <Link
            href="/upload"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-xs transition-colors"
          >
            <UploadCloud className="w-4 h-4" />
            <span>Go to Document Upload →</span>
          </Link>
        </div>
      )}

      {/* Success Notification Banner */}
      {isStorefrontUpdated && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-5 text-emerald-900 flex items-start gap-4 animate-in fade-in duration-300">
          <div className="p-2.5 bg-emerald-100 rounded-xl text-emerald-700 shrink-0">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-sm font-bold">
              ✓ Storefront Successfully Synchronized with Verified Master Data ({productCode})
            </h3>
            <p className="text-xs text-emerald-800 mt-0.5 leading-relaxed">
              Payload dispatched to <code>{apiEndpoint}</code>. Live specifications and search filter facets have been updated.
            </p>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 2. SIDE-BY-SIDE COMPARISON: LIVE WEBSITE vs NEW DATASHEET                 */}
      {/* ========================================================================= */}
      {productsList.length > 0 && (
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-slate-900 tracking-tight">
                Live Website Discrepancy Matrix: {productCode}
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Comparison between what is currently published on the website vs verified technical values from the uploaded datasheet.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <span className={`text-xs font-bold px-2.5 py-1 rounded border ${
                totalMismatches > 0 ? 'bg-amber-100 text-amber-900 border-amber-300' : 'bg-emerald-100 text-emerald-900 border-emerald-300'
              }`}>
                {totalMismatches > 0 ? `${totalMismatches} Discrepancies Requiring Update` : '0 Discrepancies (Storefront In Sync)'}
              </span>
            </div>
          </div>

          {/* Comparison Table */}
          <div className="border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4 w-1/4">Specification Parameter</th>
                  <th className="py-3 px-4 w-1/4 bg-slate-50 text-slate-500">
                    Currently Live on Website ({inspectionData?.published_version || 'v1.0'})
                  </th>
                  <th className="py-3 px-4 w-1/4 bg-blue-50/80 text-blue-900 border-l border-r border-blue-100">
                    Newly Ingested Datasheet ({inspectionData?.pending_version || 'v2.0'})
                  </th>
                  <th className="py-3 px-4 w-1/4">Status & Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {inspectionData?.comparison_matrix && inspectionData.comparison_matrix.length > 0 ? (
                  inspectionData.comparison_matrix.map((row: any, idx: number) => {
                    const isMismatch = row.status === 'MISMATCH';
                    return (
                      <tr
                        key={idx}
                        className={`transition-colors ${
                          isMismatch ? 'bg-amber-50/40 hover:bg-amber-50/60' : 'hover:bg-slate-50/60'
                        }`}
                      >
                        <td className="py-3.5 px-4 font-bold text-slate-800">
                          {row.attribute_name}
                        </td>

                        {/* Published on Website */}
                        <td className="py-3.5 px-4 font-mono text-slate-500 bg-slate-50/50">
                          {isMismatch ? (
                            <span className="line-through decoration-rose-500/60 decoration-2 text-slate-400">
                              {row.website_value}
                            </span>
                          ) : (
                            <span>{row.website_value}</span>
                          )}
                        </td>

                        {/* New AI Datasheet Value */}
                        <td className={`py-3.5 px-4 font-mono font-bold border-l border-r border-slate-100 ${
                          isMismatch ? 'text-amber-900 bg-amber-100/40' : 'text-emerald-800 bg-emerald-50/30'
                        }`}>
                          <div className="flex items-center justify-between">
                            <span>{row.new_catalog_value}</span>
                            {isMismatch ? (
                              <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-amber-200 text-amber-900 border border-amber-300">
                                MISMATCH
                              </span>
                            ) : (
                              <span className="text-[10px] font-medium px-1.5 py-0.2 rounded bg-emerald-100 text-emerald-800 border border-emerald-200">
                                MATCH
                              </span>
                            )}
                          </div>
                        </td>

                        {/* Action */}
                        <td className="py-3.5 px-4">
                          {isMismatch ? (
                            <span className="text-amber-700 font-bold flex items-center gap-1">
                              <AlertTriangle className="w-3.5 h-3.5" />
                              <span>Update Storefront</span>
                            </span>
                          ) : (
                            <span className="text-emerald-700 font-semibold flex items-center gap-1">
                              <Check className="w-3.5 h-3.5" />
                              <span>In Sync</span>
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={4} className="py-8 text-center text-slate-400">
                      No specifications to compare. Inspect a live URL above.
                    </td>
                  </tr>
                )}

                {/* Faceted Filter Row */}
                {inspectionData?.search_filter_comparison && (
                  <tr className="bg-slate-50/80 font-semibold text-xs border-t-2 border-slate-200">
                    <td className="py-3.5 px-4 font-bold text-slate-900">
                      Faceted Search Category Filter
                    </td>
                    <td className="py-3.5 px-4 font-mono text-slate-500 line-through">
                      {inspectionData.search_filter_comparison.published_filter}
                    </td>
                    <td className="py-3.5 px-4 font-mono font-bold text-blue-900 bg-blue-50/70 border-l border-r border-blue-100">
                      {inspectionData.search_filter_comparison.new_filter}
                    </td>
                    <td className="py-3.5 px-4 text-amber-700 font-bold">
                      Shift Search Filter Facet
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Human Action Callout Bar */}
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-2.5">
              <Lock className="w-4 h-4 text-slate-400" />
              <span className="text-xs text-slate-600 font-medium">
                Clicking <strong>Push Update to Website</strong> will send the verified JSON payload to your API endpoint and revalidate the live storefront cache.
              </span>
            </div>

            <button
              onClick={handlePushUpdate}
              disabled={syncing || !productCode}
              className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white text-xs font-bold rounded-lg shadow-sm transition-all shrink-0 inline-flex items-center gap-2 cursor-pointer"
            >
              {syncing ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Publishing Live...</span>
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  <span>Push Update to Website →</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
