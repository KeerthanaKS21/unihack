'use client';

import React, { useState, useEffect } from 'react';
import {
  ShoppingBag,
  CheckCircle2,
  Download,
  Filter,
  Search,
  ArrowRight,
  RefreshCw,
  Globe,
  SlidersHorizontal,
  ExternalLink,
  Shield,
  Truck,
  Zap,
  ArrowLeft
} from 'lucide-react';
import Link from 'next/link';
import { api } from '@/lib/api';

export default function StorefrontCatalogPage() {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const data = await api.getProducts({ limit: 50 });
      if (data) {
        const items = Array.isArray(data) ? data : (data?.items || []);
        setProducts(items);
      }
    } catch (e) {
      console.warn('Could not fetch catalog products:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const categories = ['ALL', 'Electric Motors & Drives', 'Industrial Pumps & Valves', 'Automation & Controllers'];

  const filteredProducts = products.filter(p => {
    const matchesSearch =
      (p.name && p.name.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (p.product_code && p.product_code.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (p.manufacturer && p.manufacturer.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesCat =
      selectedCategory === 'ALL' ||
      (p.category && p.category.toLowerCase().includes(selectedCategory.toLowerCase())) ||
      (selectedCategory.includes('Motors') && p.category?.toLowerCase().includes('motor')) ||
      (selectedCategory.includes('Pumps') && p.category?.toLowerCase().includes('pump')) ||
      (selectedCategory.includes('Automation') && (p.category?.toLowerCase().includes('automation') || p.category?.toLowerCase().includes('controller')));

    return matchesSearch && matchesCat;
  });

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
                NOVA & INDUCORE INDUSTRIAL STORE
              </span>
              <span className="text-[10px] text-slate-400 block -mt-1 font-mono">
                B2B Direct Supply • Online Catalog
              </span>
            </div>
          </div>

          <div className="flex items-center gap-4 text-xs">
            <span className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-mono">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              {products.length} Products Active in Catalog
            </span>
            <Link
              href="/ecommerce"
              className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg transition-colors inline-flex items-center gap-1.5"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Admin Sync Hub</span>
            </Link>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 space-y-8">
        {/* Hero Section */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 sm:p-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
          <div className="space-y-1">
            <span className="text-xs font-bold uppercase tracking-wider text-blue-600 font-mono">
              Verified Industrial Equipment Storefront
            </span>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              All Equipment & Component Products
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 max-w-2xl">
              Live B2B industrial catalog synchronized with AI-verified technical datasheets. Browse specifications, filter by power ratings, and download engineering documentation.
            </p>
          </div>

          <button
            onClick={fetchProducts}
            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl border border-slate-200 transition-colors inline-flex items-center gap-2 shrink-0 shadow-2xs"
          >
            <RefreshCw className={`w-4 h-4 text-slate-500 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh Storefront Catalog</span>
          </button>
        </div>

        {/* Filter & Search Bar */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-4 sm:p-6 space-y-4">
          <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
            {/* Search Input */}
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search products by model code, name, or manufacturer (e.g. VTX-550, XYZ-450, M-101)..."
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Category Filter Tabs */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1 md:pb-0">
              {categories.map(cat => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                    selectedCategory === cat
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200'
                  }`}
                >
                  {cat === 'ALL' ? 'All Products' : cat}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Products Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProducts.map(product => {
            const specs = product.specs || {};
            const power = specs['Power'] || specs['Rated Power'] || specs['Rated Output'] || '5.5 kW';
            const speed = specs['Speed'] || specs['Rated Speed'] || specs['Synchronous Speed'] || '1440 RPM';
            const voltage = specs['Voltage'] || specs['Rated Voltage'] || specs['Operating Voltage'] || '415 V';
            const isV2 = product.current_version?.includes('v2') || product.current_version_id > 5;

            return (
              <div
                key={product.id}
                className="bg-white rounded-2xl border border-slate-200 shadow-xs hover:shadow-md transition-all flex flex-col justify-between overflow-hidden group"
              >
                {/* Card Header & Badge */}
                <div className="p-6 space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono font-bold px-2.5 py-1 rounded-md bg-blue-50 text-blue-700 border border-blue-200">
                      SKU: {product.product_code}
                    </span>
                    <span className={`text-[10px] font-mono font-bold px-2.5 py-1 rounded-md border flex items-center gap-1 ${
                      isV2
                        ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                        : 'bg-slate-100 text-slate-700 border-slate-200'
                    }`}>
                      <CheckCircle2 className="w-3 h-3" />
                      <span>{product.current_version || 'v1.0'}</span>
                    </span>
                  </div>

                  {/* Icon & Title */}
                  <div className="flex items-start gap-3.5">
                    <div className="w-12 h-12 rounded-xl bg-slate-100 group-hover:bg-blue-50 border border-slate-200 group-hover:border-blue-200 flex items-center justify-center text-xl text-blue-600 shrink-0 transition-colors">
                      ⚡
                    </div>
                    <div>
                      <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 font-mono block">
                        {product.manufacturer || 'Industrial Supply'}
                      </span>
                      <h3 className="text-sm font-extrabold text-slate-900 tracking-tight leading-snug group-hover:text-blue-600 transition-colors">
                        {product.name}
                      </h3>
                    </div>
                  </div>

                  {/* Specifications Pills */}
                  <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100 text-xs">
                    <div className="p-2 rounded-lg bg-slate-50 border border-slate-100">
                      <span className="text-[10px] text-slate-400 block font-medium">Power Rating</span>
                      <span className="font-mono font-bold text-slate-800">{power}</span>
                    </div>
                    <div className="p-2 rounded-lg bg-slate-50 border border-slate-100">
                      <span className="text-[10px] text-slate-400 block font-medium">Rated Speed</span>
                      <span className="font-mono font-bold text-slate-800">{speed}</span>
                    </div>
                  </div>
                </div>

                {/* Card Footer Action */}
                <div className="p-4 bg-slate-50/80 border-t border-slate-100 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] text-slate-400 block font-medium">B2B Base Price</span>
                    <span className="text-sm font-black text-slate-900">$1,450.00 <span className="text-[10px] font-normal text-slate-500">USD</span></span>
                  </div>

                  <Link
                    href={`/storefront/${product.product_code.toLowerCase()}`}
                    className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl transition-all shadow-2xs inline-flex items-center gap-1.5 group-hover:gap-2"
                  >
                    <span>View Product</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>

        {filteredProducts.length === 0 && !loading && (
          <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 mx-auto">
              <ShoppingBag className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-slate-900">No products found</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              Try adjusting your search query or category filter above.
            </p>
          </div>
        )}
      </main>
    </div>
  );
}
