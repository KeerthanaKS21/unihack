'use client';

import React from 'react';
import { useApp } from '@/context/AppContext';
import { PageHeader } from '@/components/layout/PageHeader';
import { MetricCard } from '@/components/common/MetricCard';
import { StatusBadge } from '@/components/common/StatusBadge';
import {
  Layers,
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  FileQuestion,
  Clock,
  ShieldAlert,
  Truck,
  UploadCloud,
  ArrowRight,
  TrendingUp,
  Activity,
  Zap,
  Bot,
  Sparkles,
  ExternalLink,
  ChevronRight,
  RefreshCw,
  Cpu
} from 'lucide-react';
import Link from 'next/link';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell,
  PieChart,
  Pie
} from 'recharts';

export default function DashboardPage() {
  const {
    catalogHealth,
    unreviewedImpactsCount,
    openIssuesCount,
    openComplianceCount,
    syncStatus,
    documents,
    setViewingProduct,
    products,
    setViewingDocument
  } = useApp();

  const primaryProduct = products[0]; // XYZ-450

  const issueCategoriesData = [
    { name: 'Missing Data', count: catalogHealth.missingDataCount, color: '#f59e0b', href: '/catalog-issues?filter=missing' },
    { name: 'Conflicts', count: catalogHealth.conflictsCount, color: '#8b5cf6', href: '/catalog-issues?filter=conflict' },
    { name: 'Duplicates', count: catalogHealth.duplicatesCount, color: '#0ea5e9', href: '/catalog-issues?filter=duplicate' },
    { name: 'Outdated', count: catalogHealth.outdatedProductsCount, color: '#64748b', href: '/catalog-issues?filter=outdated' },
    { name: 'Invalid Units', count: catalogHealth.invalidUnitsCount, color: '#ec4899', href: '/catalog-issues?filter=invalid_unit' },
    { name: 'Compliance', count: catalogHealth.complianceIssuesCount, color: '#f43f5e', href: '/compliance' },
  ];

  return (
    <div className="space-y-6">
      {/* Top Page Header */}
      <PageHeader
        title="Industrial Product Intelligence Hub"
        subtitle="Unified AI verification engine tracking fragmented datasheets, version updates, compliance, and multi-supplier catalogs."
        breadcrumbs={[{ label: 'Dashboard' }]}
        badge="Enterprise Live"
        badgeVariant="success"
        action={
          <div className="flex items-center gap-2.5">
            <Link
              href="/upload"
              className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg shadow-xs transition-colors inline-flex items-center gap-1.5"
            >
              <UploadCloud className="w-4 h-4" />
              <span>Ingest Document</span>
            </Link>
            <Link
              href="/sales-assistant"
              className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-lg shadow-xs transition-colors inline-flex items-center gap-1.5"
            >
              <Bot className="w-4 h-4 text-cyan-400" />
              <span>AI Sales Assistant</span>
            </Link>
          </div>
        }
      />

      {/* Featured Star Product Alert Banner: XYZ-450 Version Ingestion Alert */}
      <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 rounded-2xl p-5 text-white shadow-md border border-blue-800/80 relative overflow-hidden">
        <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-radial-gradient from-blue-500/10 to-transparent pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-blue-500/20 border border-blue-400/30 flex items-center justify-center text-blue-300 shrink-0 shadow-inner">
              <Zap className="w-6 h-6 text-amber-400 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[11px] font-bold uppercase tracking-wider bg-amber-400/20 text-amber-300 border border-amber-400/30 px-2 py-0.5 rounded-full">
                  Action Required: Version 2.0 Ingested
                </span>
                <span className="text-xs text-blue-200 font-mono">
                  Primary SKU: XYZ-450 Industrial Motor
                </span>
              </div>
              <h3 className="text-base font-bold text-white mt-1">
                New Datasheet Detected 3 Critical Spec Changes (Power: 5.5 kW → 7.5 kW)
              </h3>
              <p className="text-xs text-slate-300 mt-0.5 max-w-2xl leading-relaxed">
                4 cross-domain operational impacts flagged (Drive Controller ABC-100 overload warning, E-commerce filter sync, quote templates).
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <Link
              href="/change-impact"
              className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold rounded-lg shadow-sm transition-colors inline-flex items-center gap-1.5"
            >
              <span>Review 4 Impacts</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
            <Link
              href="/synchronization"
              className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white text-xs font-semibold rounded-lg border border-white/20 transition-colors"
            >
              Inspect Spec Diff
            </Link>
          </div>
        </div>
      </div>

      {/* KPI Metrics Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        <MetricCard
          title="Total Products"
          value={catalogHealth.totalProducts.toLocaleString()}
          subtitle="Managed in master catalog"
          icon={Layers}
          iconBgColor="bg-blue-50"
          iconColor="text-blue-600"
          badgeText="100% Indexed"
          badgeColor="blue"
          href="/catalog-health"
        />

        <MetricCard
          title="Complete Records"
          value={catalogHealth.completeProducts.toLocaleString()}
          subtitle="82% fully verified attributes"
          icon={CheckCircle2}
          iconBgColor="bg-emerald-50"
          iconColor="text-emerald-600"
          trend={{ value: '+4.2% MoM', isPositive: true }}
          badgeText="High Quality"
          badgeColor="emerald"
          href="/catalog-health"
        />

        <MetricCard
          title="Catalog Conflicts"
          value={catalogHealth.conflictsCount}
          subtitle="Cross-system data discrepancies"
          icon={AlertCircle}
          iconBgColor="bg-purple-50"
          iconColor="text-purple-600"
          badgeText={`${openIssuesCount} Open Issues`}
          badgeColor="purple"
          href="/catalog-issues?filter=conflict"
        />

        <MetricCard
          title="Missing Attributes"
          value={catalogHealth.missingDataCount}
          subtitle="Pending extraction or upload"
          icon={FileQuestion}
          iconBgColor="bg-amber-50"
          iconColor="text-amber-600"
          badgeText="AI Auto-suggest ready"
          badgeColor="amber"
          href="/catalog-issues?filter=missing"
        />

        <MetricCard
          title="Compliance Audits"
          value={openComplianceCount}
          subtitle="Certificates missing or expired"
          icon={ShieldAlert}
          iconBgColor="bg-rose-50"
          iconColor="text-rose-600"
          badgeText="Audit Required"
          badgeColor="rose"
          href="/compliance"
        />
      </div>

      {/* Main Charts & Catalog Health Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Catalog Health Trend & Radial Gauge (2 Cols) */}
        <div className="lg:col-span-2 bg-white rounded-xl p-6 border border-slate-200 shadow-xs space-y-5">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-slate-900 tracking-tight">
                  Catalog Health & Verification Trend
                </h3>
                <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                  {catalogHealth.overallHealthScore}% Target Met
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Historic score evolution based on attribute completeness, OCR evidence confidence, and conflict resolutions.
              </p>
            </div>
            <Link
              href="/catalog-health"
              className="text-xs font-semibold text-blue-600 hover:text-blue-800 inline-flex items-center gap-1"
            >
              Deep Dive <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={catalogHealth.healthTrend} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0284c7" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#0284c7" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorComplete" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
                <YAxis domain={[60, 100]} tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0f172a',
                    borderColor: '#334155',
                    borderRadius: '8px',
                    color: '#fff',
                    fontSize: '12px'
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="score"
                  name="Health Score %"
                  stroke="#0284c7"
                  strokeWidth={3}
                  fillOpacity={1}
                  fill="url(#colorScore)"
                />
                <Area
                  type="monotone"
                  dataKey="completeRate"
                  name="Complete %"
                  stroke="#10b981"
                  strokeWidth={2}
                  strokeDasharray="4 4"
                  fillOpacity={1}
                  fill="url(#colorComplete)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          <div className="grid grid-cols-3 gap-3 pt-4 border-t border-slate-100 text-center">
            <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-100">
              <span className="text-[11px] text-slate-500 block">Active Verified SKUs</span>
              <span className="text-base font-bold text-slate-900 font-mono">8,200</span>
            </div>
            <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-100">
              <span className="text-[11px] text-slate-500 block">Avg AI Extraction Confidence</span>
              <span className="text-base font-bold text-emerald-600 font-mono">97.4%</span>
            </div>
            <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-100">
              <span className="text-[11px] text-slate-500 block">Avg Resolution Time</span>
              <span className="text-base font-bold text-blue-600 font-mono">&lt; 1.5 mins</span>
            </div>
          </div>
        </div>

        {/* Issues by Category Breakdown (1 Col) */}
        <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-xs flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-900 tracking-tight">
                Issues by Category
              </h3>
              <span className="text-xs font-semibold text-purple-700 bg-purple-50 px-2 py-0.5 rounded border border-purple-200">
                1,840 Total Flagged
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Click any category to jump directly into the 1-click issue resolver.
            </p>
          </div>

          <div className="space-y-2.5 my-2">
            {issueCategoriesData.map(item => (
              <Link
                key={item.name}
                href={item.href}
                className="group flex items-center justify-between p-2.5 rounded-lg border border-slate-100 hover:border-slate-300 hover:bg-slate-50/80 transition-all"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                  <span className="text-xs font-semibold text-slate-700 group-hover:text-slate-900">
                    {item.name}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold font-mono text-slate-900">
                    {item.count}
                  </span>
                  <ChevronRight className="w-3.5 h-3.5 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
                </div>
              </Link>
            ))}
          </div>

          <Link
            href="/catalog-issues"
            className="w-full py-2.5 text-center text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors shadow-xs"
          >
            Launch Issue Resolver Workspace →
          </Link>
        </div>
      </div>

      {/* Lower Row: Recent Activity Stream & Master Product Quick View */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Activity Intelligence Stream (2 Cols) */}
        <div className="lg:col-span-2 bg-white rounded-xl p-6 border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-slate-900 tracking-tight">
                Live Product Intelligence Activity Stream
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Real-time log of ingested datasheets, version updates, compliance renewals, and ERP syncs.
              </p>
            </div>
            <span className="text-[11px] font-mono text-slate-400 bg-slate-100 px-2 py-0.5 rounded">
              Auto-refresh: Active
            </span>
          </div>

          <div className="divide-y divide-slate-100">
            {catalogHealth.recentActivities.map(act => (
              <Link
                key={act.id}
                href={act.targetUrl}
                className="py-3 flex items-start justify-between gap-4 group hover:bg-slate-50/80 px-2 rounded-lg transition-colors"
              >
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-lg bg-slate-100 text-slate-600 shrink-0 mt-0.5 group-hover:bg-blue-100 group-hover:text-blue-700 transition-colors">
                    {act.type === 'upload' && <UploadCloud className="w-4 h-4" />}
                    {act.type === 'version_detected' && <Zap className="w-4 h-4" />}
                    {act.type === 'compliance' && <ShieldAlert className="w-4 h-4" />}
                    {act.type === 'conflict' && <AlertCircle className="w-4 h-4" />}
                    {act.type === 'supplier' && <Truck className="w-4 h-4" />}
                    {act.type === 'quote' && <Sparkles className="w-4 h-4" />}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-slate-900 group-hover:text-blue-600 transition-colors">
                        {act.title}
                      </span>
                      <span className={`text-[10px] font-semibold px-2 py-0.2 rounded-full border ${
                        act.badgeColor === 'amber'
                          ? 'bg-amber-50 text-amber-700 border-amber-200'
                          : act.badgeColor === 'rose'
                          ? 'bg-rose-50 text-rose-700 border-rose-200'
                          : act.badgeColor === 'purple'
                          ? 'bg-purple-50 text-purple-700 border-purple-200'
                          : 'bg-blue-50 text-blue-700 border-blue-200'
                      }`}>
                        {act.badgeText}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">
                      {act.description}
                    </p>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <span className="text-[11px] text-slate-400 font-mono block">
                    {act.timestamp}
                  </span>
                  <span className="text-xs font-semibold text-blue-600 opacity-0 group-hover:opacity-100 transition-opacity">
                    Inspect →
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* Master Demo Product Card (1 Col) */}
        <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-xs flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-blue-600 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                Active Benchmark Product
              </span>
              <StatusBadge status={primaryProduct.status} />
            </div>

            <div className="mt-3 flex items-start gap-3">
              <div className="w-14 h-14 rounded-xl bg-slate-100 border border-slate-200 overflow-hidden shrink-0">
                <img
                  src={primaryProduct.imageUrl}
                  alt={primaryProduct.name}
                  className="w-full h-full object-cover"
                />
              </div>
              <div>
                <h4 className="text-sm font-bold text-slate-900">
                  {primaryProduct.name}
                </h4>
                <p className="text-xs text-slate-500 font-mono mt-0.5">
                  {primaryProduct.manufacturer}
                </p>
              </div>
            </div>

            <div className="mt-4 p-3 bg-slate-50 rounded-lg border border-slate-200/80 space-y-1.5 text-xs font-mono">
              <div className="flex justify-between">
                <span className="text-slate-500 font-sans">Power:</span>
                <span className="font-bold text-blue-700">7.5 kW (was 5.5 kW)</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 font-sans">Voltage:</span>
                <span className="font-bold text-slate-800">415 V (Verified)</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 font-sans">Speed:</span>
                <span className="font-bold text-blue-700">1460 RPM (was 1440)</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 font-sans">Enclosure:</span>
                <span className="font-bold text-emerald-700">IP55 TEFC</span>
              </div>
            </div>
          </div>

          <div className="space-y-2 pt-2">
            <button
              onClick={() => setViewingProduct(primaryProduct)}
              className="w-full py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-bold rounded-lg border border-blue-200 transition-colors flex items-center justify-center gap-1.5"
            >
              <Cpu className="w-4 h-4" />
              <span>Open 360° Product View</span>
            </button>
            <Link
              href="/synchronization"
              className="w-full py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-lg transition-colors flex items-center justify-center gap-1.5"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Sync Version 2.0 Spec</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
