'use client';

import React, { useState, useEffect } from 'react';
import {
  ShoppingBag,
  CheckCircle2,
  Download,
  Share2,
  Shield,
  Truck,
  ArrowLeft,
  RefreshCw,
  Globe,
  Star,
  ExternalLink
} from 'lucide-react';
import Link from 'next/link';
import { api } from '@/lib/api';

export default function StorefrontProductPage({ params }: { params: { slug: string } }) {
  const [productData, setProductData] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  const productCode = (params.slug || 'vtx-550').toUpperCase();

  const fetchStorefrontData = async () => {
    try {
      const data = await api.getStorefrontData(productCode);
      if (data) {
        setProductData(data);
      }
    } catch (e) {
      console.warn('Could not fetch storefront data:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStorefrontData();
  }, [productCode]);

  const specs = productData?.specifications || {
    'Rated Power': '5.5 kW',
    'Operating Voltage': '415 V AC',
    'Frequency': '50 Hz',
    'Rated Speed': '1440 RPM',
    'Gross Weight': '42 kg',
    'Efficiency': '89.8%',
    'Protection': 'IP55'
  };

  const isV2 = productData?.version?.includes('v2.0') || specs['Rated Power'] === '7.5 kW';

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-16 font-sans">
      {/* Storefront Top Navigation Bar */}
      <header className="bg-slate-900 text-white border-b border-slate-800 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center font-black text-white text-base">
              N
            </div>
            <div>
              <span className="font-extrabold text-sm tracking-tight text-white">
                NOVA INDUSTRIAL STORE
              </span>
              <span className="text-[10px] text-slate-400 block -mt-1 font-mono">
                B2B Direct Supply & Parts
              </span>
            </div>
          </div>

          <div className="flex items-center gap-4 text-xs">
            <span className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-mono">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              Live Storefront Connected
            </span>
            <Link
              href="/ecommerce"
              className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg transition-colors inline-flex items-center gap-1.5"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Admin</span>
            </Link>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 space-y-8">
        {/* Breadcrumb & Version Banner */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <Link href="/ecommerce" className="hover:text-blue-600">Home</Link>
            <span>/</span>
            <span>Motors & Drives</span>
            <span>/</span>
            <span className="text-slate-900 font-bold">{productCode}</span>
          </div>

          <div className="flex items-center gap-2">
            <span className={`px-3 py-1 rounded-full text-xs font-bold font-mono flex items-center gap-1.5 ${
              isV2
                ? 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                : 'bg-amber-100 text-amber-900 border border-amber-300'
            }`}>
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Catalog State: {productData?.version || 'v1.0 (Live)'}</span>
            </span>

            <button
              onClick={fetchStorefrontData}
              className="p-1.5 hover:bg-slate-200 rounded-lg text-slate-600 transition-colors"
              title="Refresh Storefront"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Product Hero Section */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 lg:p-8 grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left Column: Product Image Simulation */}
          <div className="lg:col-span-5 space-y-4">
            <div className="aspect-square bg-slate-100 rounded-2xl border border-slate-200 flex flex-col items-center justify-center p-8 text-center relative overflow-hidden group">
              <div className="w-36 h-36 rounded-full bg-blue-100/60 border border-blue-200 flex items-center justify-center text-blue-600 font-black text-4xl shadow-inner">
                ⚡
              </div>
              <div className="mt-4">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-widest block font-mono">
                  {productData?.manufacturer || 'Nova Industrial Systems'}
                </span>
                <h2 className="text-lg font-black text-slate-900 mt-1">
                  {productCode} Motor
                </h2>
              </div>

              {isV2 && (
                <div className="absolute top-4 right-4 bg-blue-600 text-white text-[10px] font-black px-2.5 py-1 rounded-md uppercase tracking-wider shadow-sm">
                  2026 Revision (IE3)
                </div>
              )}
            </div>

            {/* Quick Guarantees */}
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center gap-2">
                <Truck className="w-4 h-4 text-blue-600 shrink-0" />
                <span className="font-semibold text-slate-700">In Stock • Ships in 24h</span>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center gap-2">
                <Shield className="w-4 h-4 text-emerald-600 shrink-0" />
                <span className="font-semibold text-slate-700">3-Year Factory Warranty</span>
              </div>
            </div>
          </div>

          {/* Right Column: Title & Key Commercial Attributes */}
          <div className="lg:col-span-7 space-y-6">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xs font-bold px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200 font-mono">
                  SKU: {productCode}
                </span>
                <span className="text-xs font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200">
                  {productData?.category || 'Electric Motors & Drives'}
                </span>
              </div>

              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                {productData?.product_name || `${productCode} 3-Phase Industrial Electric Motor`}
              </h1>

              <div className="flex items-center gap-3 mt-3 text-xs text-slate-600">
                <div className="flex text-amber-500">
                  {'★★★★★'}
                </div>
                <span className="font-semibold">4.9 (42 Verified B2B Reviews)</span>
                <span>•</span>
                <span className="text-emerald-700 font-bold">In Stock & Ready to Configure</span>
              </div>
            </div>

            {/* Price & Commercial Action */}
            <div className="p-5 bg-slate-50 rounded-2xl border border-slate-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <span className="text-xs text-slate-500 block font-medium">B2B Direct Pricing (Tier 1)</span>
                <div className="flex items-baseline gap-2 mt-0.5">
                  <span className="text-3xl font-black text-slate-900">$1,450.00</span>
                  <span className="text-xs text-slate-500">USD / unit (MOQ: 1)</span>
                </div>
              </div>

              <div className="flex items-center gap-2.5 w-full sm:w-auto">
                <button className="flex-1 sm:flex-none px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-sm transition-all inline-flex items-center justify-center gap-2">
                  <ShoppingBag className="w-4 h-4" />
                  <span>Request B2B Quote</span>
                </button>
              </div>
            </div>

            {/* Key Live Facets & Filter Category */}
            <div className="space-y-2">
              <span className="text-xs font-bold text-slate-700 block">
                Faceted Search Filter Attributes (Published Live):
              </span>
              <div className="flex flex-wrap gap-2">
                <span className={`text-xs font-bold px-3 py-1.5 rounded-lg border font-mono ${
                  isV2 ? 'bg-blue-50 text-blue-900 border-blue-300' : 'bg-slate-100 text-slate-800 border-slate-200'
                }`}>
                  ⚡ Power Range: {productData?.search_facets?.['Power Range'] || '5.0 - 5.5 kW Motors'}
                </span>
                <span className="text-xs font-bold px-3 py-1.5 rounded-lg bg-slate-100 text-slate-800 border border-slate-200 font-mono">
                  🔄 Speed: {specs['Rated Speed'] || '1440 RPM'}
                </span>
                <span className="text-xs font-bold px-3 py-1.5 rounded-lg bg-slate-100 text-slate-800 border border-slate-200 font-mono">
                  ⚖️ Weight: {specs['Gross Weight'] || '42 kg'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Technical Specifications Table */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 lg:p-8 space-y-6">
          <div className="flex items-center justify-between border-b border-slate-200 pb-4">
            <div>
              <h3 className="text-lg font-bold text-slate-900 tracking-tight">
                Authoritative Technical Specifications
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Published datasheet ratings verified by Engineering Intake.
              </p>
            </div>

            <button className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-lg border border-slate-200 transition-colors inline-flex items-center gap-1.5">
              <Download className="w-3.5 h-3.5 text-slate-500" />
              <span>Download Technical PDF</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {Object.entries(specs).map(([key, value]: [string, any], idx: number) => {
              const isHighlight = key.includes('Power') || key.includes('Speed') || key.includes('Weight') || key.includes('Efficiency');
              return (
                <div
                  key={idx}
                  className={`p-3.5 rounded-xl border flex items-center justify-between text-xs ${
                    isHighlight && isV2
                      ? 'bg-blue-50/40 border-blue-200'
                      : 'bg-slate-50/70 border-slate-200'
                  }`}
                >
                  <span className="font-semibold text-slate-600">{key}</span>
                  <span className="font-mono font-bold text-slate-900">{value}</span>
                </div>
              );
            })}
          </div>
        </div>
      </main>
    </div>
  );
}
