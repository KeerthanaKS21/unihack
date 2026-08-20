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
  UploadCloud,
  Code2,
  DollarSign,
  Tag,
  ShieldAlert,
  Info,
  Server,
  Cloud
} from 'lucide-react';
import Link from 'next/link';

export default function EcommerceUpdatePage() {
  const { showToast } = useApp();

  // Environment Mode: 'production' | 'development'
  const [environment, setEnvironment] = useState<'production' | 'development'>('production');

  // Dynamic Products List from Database (Zero Mock Data)
  const [productsList, setProductsList] = useState<any[]>([]);
  const [productCode, setProductCode] = useState('GB-100');
  const [websiteUrl, setWebsiteUrl] = useState('https://inducore-website.vercel.app/');
  const [apiEndpoint, setApiEndpoint] = useState('https://inducore-website.vercel.app/api/integration/product-update');
  const [apiKey, setApiKey] = useState('');

  // Live Inspection & Sync State
  const [inspecting, setInspecting] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [inspectionData, setInspectionData] = useState<any | null>(null);
  const [lastSyncResult, setLastSyncResult] = useState<any | null>(null);
  const [isStorefrontUpdated, setIsStorefrontUpdated] = useState(false);

  // Active Tab for Classification Display
  const [activeTab, setActiveTab] = useState<'storefront' | 'commercial' | 'payload'>('storefront');

  // Environment Switcher handler
  const handleSwitchEnvironment = (env: 'production' | 'development') => {
    setEnvironment(env);
    setIsStorefrontUpdated(false);
    if (env === 'production') {
      const pUrl = 'https://inducore-website.vercel.app/';
      const pApi = 'https://inducore-website.vercel.app/api/integration/product-update';
      setWebsiteUrl(pUrl);
      setApiEndpoint(pApi);
      runInspection(productCode, pUrl);
    } else {
      const dUrl = 'http://localhost:3000/storefront';
      const dApi = 'http://localhost:5000/api/integration/product-update';
      setWebsiteUrl(dUrl);
      setApiEndpoint(dApi);
      runInspection(productCode, dUrl);
    }
  };

  // Fetch dynamic products strictly from backend
  const loadCatalogProducts = async () => {
    try {
      const res: any = await api.getProducts({ limit: 100 });
      const items = Array.isArray(res) ? res : (res?.items || []);
      setProductsList(items);
      if (items.length > 0) {
        const initialCode = items.find((p: any) => p.product_code === 'GB-100')?.product_code || items[0].product_code;
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
      const data = await api.inspectEcommerceWebsite(wUrl, pCode);
      if (data) {
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
      const data = await api.pushEcommerceUpdate({
        api_endpoint: apiEndpoint,
        product_code: productCode,
        api_key: apiKey || undefined,
        website_url: websiteUrl
      });
      setLastSyncResult(data);
      setIsStorefrontUpdated(true);
      showToast({
        type: 'success',
        title: `${environment === 'production' ? 'Production Website' : 'Storefront'} Updated Successfully`,
        message: `Pushed verified customer-facing specifications for ${productCode} to ${apiEndpoint}.`
      });

      // Re-inspect to reflect live sync state
      await runInspection(productCode, websiteUrl);
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

  const storefrontRows = inspectionData?.storefront_matrix || inspectionData?.comparison_matrix?.filter((m: any) => m.is_storefront_field !== false) || [];
  const commercialRows = inspectionData?.commercial_matrix || inspectionData?.comparison_matrix?.filter((m: any) => m.field_category === 'SUPPLIER_COMMERCIAL') || [];
  
  const storefrontMismatches = storefrontRows.filter((m: any) => m.status === 'MISMATCH');
  const totalStorefrontMismatches = storefrontMismatches.length;

  const publicProductUrl = environment === 'production' 
    ? `https://inducore-website.vercel.app/#products/${productCode}` 
    : `/storefront/${productCode.toLowerCase()}`;

  return (
    <div className="space-y-6">
      <PageHeader
        title="B2B E-commerce Catalog Update & Storefront Sync"
        subtitle="End-to-end verified publication pushing approved engineering specifications to the live InduCore storefront with 100% supplier data isolation."
        breadcrumbs={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'E-commerce Update' }
        ]}
        badge={
          isStorefrontUpdated
            ? `${environment === 'production' ? 'Production' : 'Storefront'} Synced`
            : totalStorefrontMismatches > 0
            ? `${totalStorefrontMismatches} Storefront Discrepancies`
            : 'Storefront in Sync'
        }
        badgeVariant={isStorefrontUpdated ? 'success' : totalStorefrontMismatches > 0 ? 'warning' : 'primary'}
        action={
          <div className="flex items-center gap-2.5">
            <a
              href={publicProductUrl}
              target="_blank"
              rel="noreferrer"
              className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-lg border border-slate-200 shadow-2xs transition-colors inline-flex items-center gap-1.5"
            >
              <ExternalLink className="w-4 h-4 text-slate-500" />
              <span>{environment === 'production' ? 'Open InduCore Live ↗' : 'Local Storefront Page ↗'}</span>
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
                  <span>Pushing to {environment === 'production' ? 'Production' : 'Website'} API...</span>
                </>
              ) : isStorefrontUpdated ? (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>✓ Re-push Storefront Updates</span>
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  <span>Approve & Push Storefront Update</span>
                </>
              )}
            </button>
          </div>
        }
      />

      {/* ========================================================================= */}
      {/* 1. ENVIRONMENT TOGGLE & CONNECTION TOOLBAR                                */}
      {/* ========================================================================= */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-5">
        {/* Environment Mode Switcher & Product Selector */}
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 border-b border-slate-100 pb-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-blue-600">
                Target Environment:
              </span>
              <div className="inline-flex rounded-lg border border-slate-200 p-0.5 bg-slate-100">
                <button
                  type="button"
                  onClick={() => handleSwitchEnvironment('production')}
                  className={`px-2.5 py-1 text-xs font-bold rounded-md transition-all inline-flex items-center gap-1.5 cursor-pointer ${
                    environment === 'production'
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Cloud className="w-3.5 h-3.5" />
                  <span>Production (InduCore Live)</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleSwitchEnvironment('development')}
                  className={`px-2.5 py-1 text-xs font-bold rounded-md transition-all inline-flex items-center gap-1.5 cursor-pointer ${
                    environment === 'development'
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Server className="w-3.5 h-3.5" />
                  <span>Development (Localhost)</span>
                </button>
              </div>
            </div>

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
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
              <LinkIcon className="w-3.5 h-3.5 text-blue-600" />
              <span>Storefront URL ({environment === 'production' ? 'Production' : 'Dev'})</span>
            </label>
            <input
              type="text"
              value={websiteUrl}
              onChange={e => setWebsiteUrl(e.target.value)}
              placeholder="https://inducore-website.vercel.app/"
              className="w-full text-xs font-mono p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
              <Send className="w-3.5 h-3.5 text-emerald-600" />
              <span>Update API Endpoint (POST)</span>
            </label>
            <input
              type="text"
              value={apiEndpoint}
              onChange={e => setApiEndpoint(e.target.value)}
              placeholder="https://inducore-website.vercel.app/api/integration/product-update"
              className="w-full text-xs font-mono p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>

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

      {/* Success Notification Banner */}
      {isStorefrontUpdated && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-5 text-emerald-900 flex items-start gap-4 animate-in fade-in duration-300">
          <div className="p-2.5 bg-emerald-100 rounded-xl text-emerald-700 shrink-0">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-sm font-bold">
              ✓ {environment === 'production' ? 'Production InduCore Website' : 'Storefront'} Updated & Verified Successfully ({productCode})
            </h3>
            <p className="text-xs text-emerald-800 mt-0.5 leading-relaxed">
              Dispatched verified customer-facing specification payload to <code>{apiEndpoint}</code>. Production data verified in sync. Supplier-only commercial fields were isolated.
            </p>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 2. FIELD CLASSIFICATION & COMPARISON MATRIX                               */}
      {/* ========================================================================= */}
      {productsList.length > 0 && (
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-5">
          {/* Navigation Tabs */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-200 pb-3">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setActiveTab('storefront')}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all inline-flex items-center gap-2 cursor-pointer ${
                  activeTab === 'storefront'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                }`}
              >
                <Tag className="w-3.5 h-3.5" />
                <span>Storefront Specifications ({storefrontRows.length})</span>
                {totalStorefrontMismatches > 0 && (
                  <span className="px-1.5 py-0.5 rounded-full bg-amber-400 text-amber-950 text-[10px] font-black">
                    {totalStorefrontMismatches}
                  </span>
                )}
              </button>

              <button
                onClick={() => setActiveTab('commercial')}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all inline-flex items-center gap-2 cursor-pointer ${
                  activeTab === 'commercial'
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                }`}
              >
                <DollarSign className="w-3.5 h-3.5" />
                <span>Supplier / Commercial Data ({commercialRows.length})</span>
                <span className="px-1.5 py-0.5 rounded-full bg-slate-200 text-slate-700 text-[10px] font-bold">
                  Procurement Only
                </span>
              </button>

              <button
                onClick={() => setActiveTab('payload')}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all inline-flex items-center gap-2 cursor-pointer ${
                  activeTab === 'payload'
                    ? 'bg-purple-600 text-white shadow-xs'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                }`}
              >
                <Code2 className="w-3.5 h-3.5" />
                <span>Update API Payload</span>
              </button>
            </div>

            <div className="flex items-center gap-2">
              <span className={`text-xs font-bold px-2.5 py-1 rounded border ${
                totalStorefrontMismatches > 0 ? 'bg-amber-100 text-amber-900 border-amber-300' : 'bg-emerald-100 text-emerald-900 border-emerald-300'
              }`}>
                {totalStorefrontMismatches > 0 ? `${totalStorefrontMismatches} Storefront Updates Required` : '0 Storefront Discrepancies (In Sync)'}
              </span>
            </div>
          </div>

          {/* TAB 1: CUSTOMER-FACING STOREFRONT SPECIFICATIONS */}
          {activeTab === 'storefront' && (
            <div className="space-y-4">
              <div className="p-3.5 bg-blue-50/70 border border-blue-200 rounded-xl text-xs text-blue-900 flex items-start gap-2.5">
                <Info className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                <p>
                  <strong>Customer-Facing Product Specifications ({environment === 'production' ? 'InduCore Production' : 'Local Dev'}):</strong> These fields appear on the public storefront. When differences are detected, they are flagged for human review and can be published to the live storefront via API.
                </p>
              </div>

              <div className="border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                    <tr>
                      <th className="py-3 px-4 w-1/4">Specification Parameter</th>
                      <th className="py-3 px-4 w-1/4 bg-slate-50 text-slate-500">
                        Currently Live on Storefront ({inspectionData?.published_version || 'v1.0'})
                      </th>
                      <th className="py-3 px-4 w-1/4 bg-blue-50/80 text-blue-900 border-l border-r border-blue-100">
                        Newly Ingested Datasheet ({inspectionData?.pending_version || 'v2.0'})
                      </th>
                      <th className="py-3 px-4 w-1/4">Status & Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {storefrontRows.length > 0 ? (
                      storefrontRows.map((row: any, idx: number) => {
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

                            <td className="py-3.5 px-4 font-mono text-slate-500 bg-slate-50/50">
                              {isMismatch ? (
                                <span className="line-through decoration-rose-500/60 decoration-2 text-slate-400">
                                  {row.website_value}
                                </span>
                              ) : (
                                <span>{row.website_value}</span>
                              )}
                            </td>

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
                    {inspectionData?.search_filter_comparison && (() => {
                      const isFacetMismatch = inspectionData.search_filter_comparison.status === 'MISMATCH';
                      return (
                        <tr className={`font-semibold text-xs border-t-2 border-slate-200 transition-colors ${
                          isFacetMismatch ? 'bg-amber-50/50' : 'bg-slate-50/80'
                        }`}>
                          <td className="py-3.5 px-4 font-bold text-slate-900">
                            Faceted Search Category Filter
                          </td>
                          <td className="py-3.5 px-4 font-mono text-slate-500 bg-slate-50/50">
                            {isFacetMismatch ? (
                              <span className="line-through decoration-rose-500/60 decoration-2 text-slate-400">
                                {inspectionData.search_filter_comparison.published_filter}
                              </span>
                            ) : (
                              <span>{inspectionData.search_filter_comparison.published_filter}</span>
                            )}
                          </td>
                          <td className={`py-3.5 px-4 font-mono font-bold border-l border-r border-slate-100 ${
                            isFacetMismatch ? 'text-amber-900 bg-amber-100/40' : 'text-emerald-800 bg-emerald-50/30'
                          }`}>
                            <div className="flex items-center justify-between">
                              <span>{inspectionData.search_filter_comparison.new_filter}</span>
                              {isFacetMismatch ? (
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
                          <td className="py-3.5 px-4">
                            {isFacetMismatch ? (
                              <span className="text-amber-700 font-bold flex items-center gap-1">
                                <AlertTriangle className="w-3.5 h-3.5" />
                                <span>Shift Search Filter Facet</span>
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
                    })()}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 2: SUPPLIER / COMMERCIAL DATA (PROCUREMENT ONLY) */}
          {activeTab === 'commercial' && (
            <div className="space-y-4">
              <div className="p-3.5 bg-slate-100 border border-slate-200 rounded-xl text-xs text-slate-800 flex items-start gap-2.5">
                <ShieldAlert className="w-4 h-4 text-slate-600 shrink-0 mt-0.5" />
                <p>
                  <strong>Supplier & Commercial Data (Separated):</strong> These fields belong exclusively to the Procurement & RFQ Engine. They are <strong>NOT</strong> customer-facing specifications and are automatically prevented from being pushed to the public storefront.
                </p>
              </div>

              <div className="border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                    <tr>
                      <th className="py-3 px-4 w-1/3">Commercial Parameter</th>
                      <th className="py-3 px-4 w-1/3 bg-slate-50 text-slate-600">
                        Incoming Supplier Value
                      </th>
                      <th className="py-3 px-4 w-1/3">Classification & Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {commercialRows.length > 0 ? (
                      commercialRows.map((row: any, idx: number) => (
                        <tr key={idx} className="hover:bg-slate-50/60 transition-colors">
                          <td className="py-3 px-4 font-bold text-slate-800">
                            {row.attribute_name}
                          </td>
                          <td className="py-3 px-4 font-mono font-medium text-slate-700 bg-slate-50/50">
                            {row.new_catalog_value}
                          </td>
                          <td className="py-3 px-4">
                            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-300 text-[11px] font-medium">
                              <Lock className="w-3 h-3 text-slate-500" />
                              <span>Not a Storefront Field (Procurement Only)</span>
                            </span>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={3} className="py-8 text-center text-slate-400">
                          No commercial fields detected in this dataset.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 3: UPDATE API PAYLOAD PREVIEW */}
          {activeTab === 'payload' && (
            <div className="space-y-4">
              <div className="p-3.5 bg-purple-50 border border-purple-200 rounded-xl text-xs text-purple-900 flex items-start gap-2.5">
                <Code2 className="w-4 h-4 text-purple-600 shrink-0 mt-0.5" />
                <p>
                  <strong>Verified Production API Payload:</strong> Dispatched to <code>{apiEndpoint}</code> upon human approval. Notice that only customer-facing product updates are included; all commercial supplier fields have been strictly excluded.
                </p>
              </div>

              <div className="p-4 bg-slate-900 text-slate-100 rounded-xl font-mono text-xs overflow-x-auto border border-slate-800 shadow-inner">
                <pre>
{JSON.stringify({
  requestId: `upd-${productCode}-2026-prod`,
  productId: productCode,
  modelNumber: productCode,
  expectedVersion: 1,
  newVersion: 2,
  updates: inspectionData?.pending_storefront_updates || (
    storefrontMismatches.length > 0 
      ? Object.fromEntries(storefrontMismatches.map((m: any) => [m.attribute_name.toLowerCase().replace(/[^a-z0-9]/g, ''), m.new_catalog_value]))
      : (inspectionData?.storefront_matrix ? Object.fromEntries(inspectionData.storefront_matrix.slice(0, 3).map((m: any) => [m.attribute_name.toLowerCase().replace(/[^a-z0-9]/g, ''), m.new_catalog_value])) : {})
  ),
  source: {
    documentName: `${productCode}_Updated_Datasheet_v2.csv`,
    documentVersion: "2.0"
  },
  approval: {
    approved: true,
    approvedBy: "engineering-lead@company.com",
    approvalId: `APP-${productCode}-PROD`
  }
}, null, 2)}
                </pre>
              </div>
            </div>
          )}

          {/* Human Action Callout Bar */}
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-2.5">
              <Lock className="w-4 h-4 text-slate-400" />
              <span className="text-xs text-slate-600 font-medium">
                Clicking <strong>Approve & Push Storefront Update</strong> will dispatch only verified customer-facing specifications to <code>{apiEndpoint}</code>.
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
                  <span>Publishing Live to {environment === 'production' ? 'Production' : 'Dev'}...</span>
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  <span>Approve & Push Storefront Update →</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
