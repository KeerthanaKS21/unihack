'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useApp } from '@/context/AppContext';
import { PageHeader } from '@/components/layout/PageHeader';
import { MetricCard } from '@/components/common/MetricCard';
import { api } from '@/lib/api';
import {
  Layers,
  FileText,
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
  Cpu,
  Loader2,
  FolderPlus,
  FileCheck,
  Building2,
  Search
} from 'lucide-react';
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
  Cell
} from 'recharts';

export default function DashboardPage() {
  const { showToast } = useApp();
  const [summary, setSummary] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const loadDashboardSummary = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.getDashboardSummary();
      setSummary(data);
    } catch (err: any) {
      console.error('Failed to load live dashboard summary:', err);
      setError('Unable to load compliance & catalog metrics from server.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardSummary();
  }, []);

  if (loading) {
    return (
      <div className="p-16 text-center space-y-3">
        <Loader2 className="w-8 h-8 animate-spin mx-auto text-blue-600" />
        <p className="text-xs font-semibold text-slate-600">Loading live executive product intelligence dashboard...</p>
      </div>
    );
  }

  const isDatabaseEmpty = !summary || (summary.total_products === 0 && summary.total_documents === 0);

  return (
    <div className="space-y-6">
      {/* Top Page Header */}
      <PageHeader
        title="Industrial Product Intelligence Hub"
        subtitle="Live executive control center monitoring master catalog health, compliance audits, change impacts, e-commerce sync, and supplier procurement activity."
        breadcrumbs={[{ label: 'Dashboard' }]}
        badge={isDatabaseEmpty ? 'Database Empty' : 'Live Data Stream'}
        badgeVariant={isDatabaseEmpty ? 'warning' : 'success'}
        action={
          <div className="flex items-center gap-2.5">
            <button
              onClick={loadDashboardSummary}
              className="p-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 rounded-lg shadow-2xs transition-colors"
              title="Refresh Live Data"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
            <Link
              href="/upload"
              className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg shadow-2xs transition-colors inline-flex items-center gap-1.5"
            >
              <UploadCloud className="w-4 h-4" />
              <span>Ingest Document</span>
            </Link>
            <Link
              href="/ask-catalog"
              className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-lg shadow-2xs transition-colors inline-flex items-center gap-1.5"
            >
              <Search className="w-4 h-4 text-cyan-400" />
              <span>Ask Catalog AI</span>
            </Link>
          </div>
        }
      />

      {/* Error Notice Banner */}
      {error && (
        <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl flex items-center justify-between text-xs text-amber-900">
          <div className="flex items-center gap-2 font-semibold">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
            <span>{error}</span>
          </div>
          <button onClick={loadDashboardSummary} className="underline font-bold text-amber-950">Retry</button>
        </div>
      )}

      {/* Empty Database Banner */}
      {isDatabaseEmpty ? (
        <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 rounded-2xl p-8 text-white shadow-xl border border-blue-800 relative overflow-hidden text-center space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-blue-500/20 border border-blue-400/30 flex items-center justify-center text-blue-300 mx-auto">
            <FolderPlus className="w-7 h-7 text-cyan-400" />
          </div>
          <div className="space-y-1 max-w-lg mx-auto">
            <h3 className="text-lg font-bold text-white">No Products or Documents Uploaded Yet</h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              Upload product technical datasheets, CAD drawings, CSV specifications, or compliance certificates through <strong>Upload & Ingest</strong> to activate live product intelligence monitoring.
            </p>
          </div>
          <Link
            href="/upload"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-xl shadow-lg transition-all"
          >
            <UploadCloud className="w-4 h-4" />
            <span>Go to Upload & Ingest</span>
          </Link>
        </div>
      ) : (
        <>
          {/* Top Summary KPI Cards Grid (8 Live Cards) */}
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
            <MetricCard
              title="Total Products"
              value={summary?.total_products?.toLocaleString() || '0'}
              subtitle="Master catalog SKUs"
              icon={Layers}
              iconBgColor="bg-blue-50"
              iconColor="text-blue-600"
              badgeText="Live DB"
              badgeColor="blue"
              href="/catalog-health"
            />

            <MetricCard
              title="Documents"
              value={summary?.total_documents?.toLocaleString() || '0'}
              subtitle="Ingested datasheets"
              icon={FileText}
              iconBgColor="bg-slate-100"
              iconColor="text-slate-700"
              badgeText="Vault"
              badgeColor="blue"
              href="/upload"
            />

            <MetricCard
              title="Needs Review"
              value={summary?.products_needing_review || '0'}
              subtitle="Catalog issues flagged"
              icon={AlertCircle}
              iconBgColor="bg-amber-50"
              iconColor="text-amber-600"
              badgeText="Action"
              badgeColor="amber"
              href="/catalog-issues"
            />

            <MetricCard
              title="Catalog Health"
              value={`${summary?.catalog_health_score || 100}%`}
              subtitle="Attribute accuracy"
              icon={CheckCircle2}
              iconBgColor="bg-emerald-50"
              iconColor="text-emerald-600"
              badgeText="Score"
              badgeColor="emerald"
              href="/catalog-health"
            />

            <MetricCard
              title="Compliance"
              value={summary?.compliance_issues || '0'}
              subtitle="Certs missing/expired"
              icon={ShieldAlert}
              iconBgColor="bg-rose-50"
              iconColor="text-rose-600"
              badgeText="Auditing"
              badgeColor="rose"
              href="/compliance?status=needs_review"
            />

            <MetricCard
              title="Pending Sync"
              value={summary?.pending_sync || '0'}
              subtitle="ERP approvals"
              icon={RefreshCw}
              iconBgColor="bg-purple-50"
              iconColor="text-purple-600"
              badgeText="ERP"
              badgeColor="purple"
              href="/synchronization"
            />

            <MetricCard
              title="E-Commerce"
              value={summary?.pending_ecommerce || '0'}
              subtitle="Pending storefront sync"
              icon={Zap}
              iconBgColor="bg-indigo-50"
              iconColor="text-indigo-600"
              badgeText="Storefront"
              badgeColor="purple"
              href="/ecommerce"
            />

            <MetricCard
              title="Impact Items"
              value={summary?.unreviewed_impacts || '0'}
              subtitle="Unreviewed spec diffs"
              icon={Activity}
              iconBgColor="bg-cyan-50"
              iconColor="text-cyan-600"
              badgeText="Impacts"
              badgeColor="blue"
              href="/change-impact"
            />
          </div>

          {/* Main Content Grid: Catalog Health Overview & Pending Actions */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Catalog Health Breakdown (2 Cols) */}
            <div className="lg:col-span-2 bg-white rounded-2xl p-6 border border-slate-200 shadow-2xs space-y-5">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold text-slate-900 tracking-tight flex items-center gap-2">
                    <Activity className="w-5 h-5 text-blue-600" />
                    <span>Catalog Quality & Health Overview</span>
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Live breakdown of complete records, missing attributes, discrepancies, and compliance statuses.
                  </p>
                </div>
                <Link
                  href="/catalog-health"
                  className="text-xs font-bold text-blue-600 hover:text-blue-800 inline-flex items-center gap-1"
                >
                  <span>Detailed Report</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </Link>
              </div>

              {/* Health Metrics Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <Link
                  href="/catalog-health"
                  className="p-3.5 bg-emerald-50/60 border border-emerald-200 rounded-xl hover:bg-emerald-100/60 transition-all block space-y-1"
                >
                  <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800 block">Complete Records</span>
                  <span className="text-lg font-extrabold text-emerald-950 font-mono">
                    {summary?.catalog_health?.complete_products || 0}
                  </span>
                  <span className="text-[10px] text-emerald-700 block">Fully verified attributes</span>
                </Link>

                <Link
                  href="/catalog-issues?filter=missing"
                  className="p-3.5 bg-amber-50/60 border border-amber-200 rounded-xl hover:bg-amber-100/60 transition-all block space-y-1"
                >
                  <span className="text-[10px] font-bold uppercase tracking-wider text-amber-800 block">Missing Data</span>
                  <span className="text-lg font-extrabold text-amber-950 font-mono">
                    {summary?.catalog_health?.missing_data || 0}
                  </span>
                  <span className="text-[10px] text-amber-700 block">Unspecified parameters</span>
                </Link>

                <Link
                  href="/catalog-issues?filter=conflict"
                  className="p-3.5 bg-purple-50/60 border border-purple-200 rounded-xl hover:bg-purple-100/60 transition-all block space-y-1"
                >
                  <span className="text-[10px] font-bold uppercase tracking-wider text-purple-800 block">Conflicts</span>
                  <span className="text-lg font-extrabold text-purple-950 font-mono">
                    {summary?.catalog_health?.conflicts || 0}
                  </span>
                  <span className="text-[10px] text-purple-700 block">Spec discrepancies</span>
                </Link>

                <Link
                  href="/catalog-issues?filter=duplicate"
                  className="p-3.5 bg-sky-50/60 border border-sky-200 rounded-xl hover:bg-sky-100/60 transition-all block space-y-1"
                >
                  <span className="text-[10px] font-bold uppercase tracking-wider text-sky-800 block">Duplicates</span>
                  <span className="text-lg font-extrabold text-sky-950 font-mono">
                    {summary?.catalog_health?.duplicates || 0}
                  </span>
                  <span className="text-[10px] text-sky-700 block">Duplicate SKU candidates</span>
                </Link>

                <Link
                  href="/catalog-issues?filter=outdated"
                  className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl hover:bg-slate-100 transition-all block space-y-1"
                >
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-700 block">Outdated Data</span>
                  <span className="text-lg font-extrabold text-slate-900 font-mono">
                    {summary?.catalog_health?.outdated || 0}
                  </span>
                  <span className="text-[10px] text-slate-500 block">Superceded versions</span>
                </Link>

                <Link
                  href="/compliance?status=needs_review"
                  className="p-3.5 bg-rose-50/60 border border-rose-200 rounded-xl hover:bg-rose-100/60 transition-all block space-y-1"
                >
                  <span className="text-[10px] font-bold uppercase tracking-wider text-rose-800 block">Compliance Issues</span>
                  <span className="text-lg font-extrabold text-rose-950 font-mono">
                    {summary?.compliance_issues || 0}
                  </span>
                  <span className="text-[10px] text-rose-700 block">Unverified or expired certs</span>
                </Link>
              </div>
            </div>

            {/* Aggregated Pending Actions Box (1 Col) */}
            <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-2xs flex flex-col justify-between space-y-4">
              <div>
                <h3 className="text-base font-bold text-slate-900 tracking-tight flex items-center gap-2">
                  <Clock className="w-5 h-5 text-amber-600" />
                  <span>Pending Actions & Approvals</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Live task queue requiring engineer review or authorization across all modules.
                </p>
              </div>

              {summary?.pending_actions && summary.pending_actions.length > 0 ? (
                <div className="space-y-2">
                  {summary.pending_actions.map((act: any, idx: number) => (
                    <Link
                      key={idx}
                      href={act.href}
                      className="group flex items-center justify-between p-3 rounded-xl border border-slate-200 hover:border-blue-400 hover:bg-blue-50/50 transition-all text-xs"
                    >
                      <div className="space-y-0.5">
                        <span className="font-bold text-slate-900 group-hover:text-blue-900 transition-colors block">
                          {act.title}
                        </span>
                        <span className="text-[10px] text-slate-500 font-semibold">{act.module}</span>
                      </div>
                      <ChevronRight className="w-4 h-4 text-slate-400 group-hover:translate-x-0.5 transition-transform shrink-0" />
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="p-6 text-center bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-500 space-y-1 my-auto">
                  <CheckCircle2 className="w-6 h-6 text-emerald-600 mx-auto" />
                  <p className="font-bold text-slate-800">All Approvals Clear</p>
                  <p className="text-[11px] text-slate-500">No pending synchronization, compliance, or quotation items.</p>
                </div>
              )}

              <Link
                href="/catalog-issues"
                className="w-full py-2.5 text-center text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-xl transition-colors shadow-2xs"
              >
                Open Issue Resolution Center →
              </Link>
            </div>
          </div>

          {/* Activity Stream & Specification Changes */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Recent Product Data Activity Stream */}
            <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-2xs space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <Activity className="w-4 h-4 text-blue-600" />
                  <span>Recent Product Data Activity</span>
                </h3>
                <span className="text-[10px] font-mono text-slate-400">Live Audit Log</span>
              </div>

              {summary?.recent_activity && summary.recent_activity.length > 0 ? (
                <div className="divide-y divide-slate-100 text-xs">
                  {summary.recent_activity.map((item: any, idx: number) => (
                    <Link
                      key={idx}
                      href={item.target_url || '/catalog-health'}
                      className="py-3 flex items-start justify-between gap-3 group hover:bg-slate-50 px-2 rounded-lg transition-colors"
                    >
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-900 group-hover:text-blue-600 transition-colors">
                            {item.title}
                          </span>
                          <span className="text-[9px] font-mono font-bold bg-slate-100 text-slate-700 px-1.5 py-0.2 rounded border border-slate-200">
                            {item.badge_text}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500 leading-relaxed font-mono">{item.description}</p>
                      </div>
                      <span className="text-[10px] font-mono text-slate-400 shrink-0">{item.timestamp}</span>
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="p-6 text-center bg-slate-50 rounded-xl text-xs text-slate-500">
                  No recent product activity recorded yet.
                </div>
              )}
            </div>

            {/* Procurement & Quotation Overview */}
            <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-2xs space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-emerald-600" />
                  <span>Procurement & Quotation Activity</span>
                </h3>
                <Link href="/quotes" className="text-xs font-bold text-blue-600 hover:text-blue-800">
                  View Quotes →
                </Link>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">Registered Suppliers</span>
                  <span className="text-lg font-bold text-slate-900 font-mono">
                    {summary?.procurement_overview?.total_suppliers || 0}
                  </span>
                  <span className="text-[10px] text-slate-500 block">Active vendor relationships</span>
                </div>

                <div className="p-3.5 bg-emerald-50/60 rounded-xl border border-emerald-200 space-y-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800 block">Generated Quotes</span>
                  <span className="text-lg font-bold text-emerald-950 font-mono">
                    {summary?.quote_overview?.quotes_count || 0}
                  </span>
                  <span className="text-[10px] text-emerald-700 block">
                    {summary?.quote_overview?.quotes_pending || 0} Pending Approval
                  </span>
                </div>
              </div>

              {summary?.quote_overview?.quotes_count === 0 ? (
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-500 text-center">
                  No quotation activity yet. Create RFQs in Quote Automation.
                </div>
              ) : (
                <div className="p-3 bg-slate-50 rounded-xl border text-xs font-mono flex items-center justify-between">
                  <span>Approved Quotes: <strong>{summary?.quote_overview?.quotes_approved || 0}</strong></span>
                  <span>Revision Requested: <strong>{summary?.quote_overview?.quotes_revision || 0}</strong></span>
                </div>
              )}
            </div>
          </div>

          {/* Trend Analytics Section (Rendered ONLY if real historical data exists) */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-2xs space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-blue-600" />
                  <span>Historical Quality & Score Trends</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Longitudinal quality score evolution tracked across uploaded document ingestion dates.
                </p>
              </div>
            </div>

            {summary?.has_trend_data && summary.trend_history.length >= 2 ? (
              <div className="h-56 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={summary.trend_history} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#0284c7" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#0284c7" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
                    <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
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
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="p-6 text-center bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-500 space-y-1">
                <Clock className="w-5 h-5 text-slate-400 mx-auto" />
                <p className="font-bold text-slate-700">{summary?.trend_message || 'Not enough historical data for trend analysis.'}</p>
                <p className="text-[11px] text-slate-400">Trends will populate dynamically as more datasheets and revisions are uploaded over time.</p>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
