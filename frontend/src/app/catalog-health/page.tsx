'use client';

import React, { useState, useEffect } from 'react';
import { PageHeader } from '@/components/layout/PageHeader';
import { MetricCard } from '@/components/common/MetricCard';
import { api } from '@/lib/api';
import {
  Activity,
  CheckCircle2,
  AlertCircle,
  FileQuestion,
  Copy,
  Clock,
  Ruler,
  ShieldAlert,
  Unlink,
  Sparkles,
  ArrowRight,
  TrendingUp,
  Layers,
  ChevronRight,
  RefreshCw,
  Loader2,
  FolderPlus,
  ShieldCheck,
  Tag,
  AlertTriangle,
  Eye
} from 'lucide-react';
import Link from 'next/link';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  PieChart,
  Pie
} from 'recharts';

export default function CatalogHealthPage() {
  const [loading, setLoading] = useState(true);
  const [scanning, setScanning] = useState(false);
  const [healthData, setHealthData] = useState<any>(null);

  const fetchHealth = async () => {
    try {
      setLoading(true);
      const res = await api.getCatalogHealth();
      setHealthData(res);
    } catch (err) {
      console.warn('Failed to load catalog health:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleScan = async () => {
    try {
      setScanning(true);
      const res = await api.scanCatalogHealth();
      if (res?.catalog_health) {
        setHealthData(res.catalog_health);
      } else {
        await fetchHealth();
      }
    } catch (err) {
      console.warn('Scan failed:', err);
    } finally {
      setScanning(false);
    }
  };

  useEffect(() => {
    fetchHealth();
  }, []);

  const totalProducts = healthData?.total_products || 0;
  const healthScore = healthData?.overall_health ?? 100;
  const completeProducts = healthData?.complete_products || 0;
  const productsWithIssues = healthData?.products_with_issues || 0;
  const components = healthData?.components || {
    completeness: 100,
    consistency: 100,
    validity: 100,
    freshness: 100,
    compliance: 100,
    confidence: 100
  };

  const issues = healthData?.issues || {
    missing_data: healthData?.missing_data || 0,
    conflicts: healthData?.conflicts || 0,
    duplicates: healthData?.duplicates || 0,
    outdated: healthData?.outdated || 0,
    invalid_units: healthData?.invalid_units || 0,
    invalid_values: healthData?.invalid_values || 0,
    wrong_category: healthData?.wrong_category || 0,
    broken_relationships: healthData?.broken_relationships || 0,
    compliance: healthData?.compliance_issues || 0,
    image_data_mismatch: healthData?.image_mismatch || 0,
    low_confidence: healthData?.low_confidence || 0
  };

  const totalOpenIssues =
    (issues.missing_data || 0) +
    (issues.conflicts || 0) +
    (issues.duplicates || 0) +
    (issues.outdated || 0) +
    (issues.invalid_units || 0) +
    (issues.invalid_values || 0) +
    (issues.wrong_category || 0) +
    (issues.broken_relationships || 0) +
    (issues.compliance || 0) +
    (issues.low_confidence || 0);

  const componentChartData = [
    { name: 'Completeness (30%)', score: components.completeness, color: '#3b82f6' },
    { name: 'Consistency (25%)', score: components.consistency, color: '#8b5cf6' },
    { name: 'Validity (15%)', score: components.validity, color: '#10b981' },
    { name: 'Freshness (10%)', score: components.freshness, color: '#f59e0b' },
    { name: 'Compliance (10%)', score: components.compliance, color: '#ec4899' },
    { name: 'Confidence (10%)', score: components.confidence, color: '#06b6d4' }
  ];

  const issueCards = [
    {
      title: 'Missing Attributes',
      value: issues.missing_data || 0,
      subtitle: 'Required parameters missing in active version',
      icon: FileQuestion,
      color: 'amber',
      bgColor: 'bg-amber-50',
      iconColor: 'text-amber-600',
      badgeText: 'Review Required',
      href: '/catalog-issues?filter=missing'
    },
    {
      title: 'Cross-System Conflicts',
      value: issues.conflicts || 0,
      subtitle: 'Differing values across baseline vs revision',
      icon: AlertCircle,
      color: 'purple',
      bgColor: 'bg-purple-50',
      iconColor: 'text-purple-600',
      badgeText: 'Action Needed',
      href: '/catalog-issues?filter=conflict'
    },
    {
      title: 'Duplicate Entities',
      value: issues.duplicates || 0,
      subtitle: 'Matching product codes or spec models',
      icon: Copy,
      color: 'blue',
      bgColor: 'bg-blue-50',
      iconColor: 'text-blue-600',
      badgeText: 'Merge Candidates',
      href: '/catalog-issues?filter=duplicate'
    },
    {
      title: 'Outdated / Version Deltas',
      value: issues.outdated || 0,
      subtitle: 'Ingested candidates pending sync approval',
      icon: Clock,
      color: 'slate',
      bgColor: 'bg-slate-100',
      iconColor: 'text-slate-600',
      badgeText: 'Pending Sync',
      href: '/catalog-issues?filter=outdated'
    },
    {
      title: 'Invalid Units & Values',
      value: (issues.invalid_units || 0) + (issues.invalid_values || 0),
      subtitle: 'Out-of-range bounds or unit syntax issues',
      icon: Ruler,
      color: 'rose',
      bgColor: 'bg-pink-50',
      iconColor: 'text-pink-600',
      badgeText: 'Validation Failed',
      href: '/catalog-issues?filter=invalid_unit'
    },
    {
      title: 'Wrong Category',
      value: issues.wrong_category || 0,
      subtitle: 'Product name vs category mismatch',
      icon: Tag,
      color: 'amber',
      bgColor: 'bg-amber-50',
      iconColor: 'text-amber-600',
      badgeText: 'Reclassify',
      href: '/catalog-issues?filter=wrong_category'
    },
    {
      title: 'Compliance & Expiry',
      value: issues.compliance || 0,
      subtitle: 'Expired or missing regulatory certificates',
      icon: ShieldAlert,
      color: 'rose',
      bgColor: 'bg-rose-50',
      iconColor: 'text-rose-600',
      badgeText: 'Audit Needed',
      href: '/catalog-issues?filter=compliance'
    },
    {
      title: 'Broken Relationships',
      value: issues.broken_relationships || 0,
      subtitle: 'Compatibility links to missing products',
      icon: Unlink,
      color: 'amber',
      bgColor: 'bg-orange-50',
      iconColor: 'text-orange-600',
      badgeText: 'Graph Defect',
      href: '/catalog-issues?filter=broken_relationship'
    },
    {
      title: 'Low Confidence Extractions',
      value: issues.low_confidence || 0,
      subtitle: 'Extracted attributes with confidence < 70%',
      icon: Eye,
      color: 'blue',
      bgColor: 'bg-cyan-50',
      iconColor: 'text-cyan-600',
      badgeText: 'Verify Source',
      href: '/catalog-issues?filter=low_confidence'
    }
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Enterprise Catalog Health & Governance"
        subtitle="Continuous automated data hygiene scanner monitoring real products in PostgreSQL across 9 industrial quality dimensions."
        breadcrumbs={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Catalog Health' }
        ]}
        badge={totalProducts > 0 ? `${healthScore}% Overall Health` : 'Zero Products'}
        badgeVariant={healthScore >= 90 ? 'success' : 'warning'}
        action={
          <div className="flex items-center gap-2.5">
            <button
              onClick={handleScan}
              disabled={scanning || loading}
              className="px-4 py-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 text-xs font-bold rounded-lg shadow-2xs transition-colors inline-flex items-center gap-1.5"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${scanning ? 'animate-spin text-blue-600' : 'text-slate-500'}`} />
              <span>{scanning ? 'Scanning Catalog...' : 'Trigger Health Scan'}</span>
            </button>
            <Link
              href="/catalog-issues"
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg shadow-sm transition-colors inline-flex items-center gap-1.5"
            >
              <span>View All Issues ({totalOpenIssues})</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        }
      />

      {loading ? (
        <div className="p-16 text-center bg-white rounded-2xl border border-slate-200 shadow-xs space-y-3">
          <Loader2 className="w-8 h-8 animate-spin mx-auto text-blue-600" />
          <p className="text-sm font-semibold text-slate-700">Calculating Catalog Health from PostgreSQL...</p>
        </div>
      ) : totalProducts === 0 ? (
        /* Zero Products Empty State */
        <div className="p-16 text-center bg-white rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto">
            <FolderPlus className="w-8 h-8" />
          </div>
          <div className="space-y-1 max-w-md mx-auto">
            <h3 className="text-base font-bold text-slate-900">No products available for catalog health monitoring</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Upload your engineering datasheets, specification catalogs, or spreadsheets in Upload & Ingest. The system will automatically monitor their data quality, identify missing attributes, and compute real health scores.
            </p>
          </div>
          <Link
            href="/upload"
            className="mt-4 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-xs inline-flex items-center gap-2"
          >
            <FolderPlus className="w-4 h-4" />
            <span>Go to Upload & Ingest →</span>
          </Link>
        </div>
      ) : (
        <>
          {/* Main Health KPI Row */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Overall Score Card */}
            <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 rounded-2xl p-6 text-white shadow-md relative overflow-hidden flex flex-col justify-between">
              <div className="relative z-10">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">Catalog Health Score</span>
                  <Activity className="w-4 h-4 text-emerald-400" />
                </div>
                <div className="mt-3 flex items-baseline gap-2">
                  <span className="text-4xl font-extrabold font-mono text-white">{healthScore}%</span>
                  <span className="text-xs text-emerald-400 font-semibold">
                    {healthScore >= 90 ? 'Optimal Quality' : healthScore >= 75 ? 'Fair Quality' : 'Action Required'}
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 mt-2">
                  Deterministic weighted formula across 6 quality dimensions.
                </p>
              </div>
              <div className="mt-4 pt-3 border-t border-slate-700/60 flex items-center justify-between text-xs text-slate-300 relative z-10">
                <span>Total Monitored:</span>
                <span className="font-bold font-mono text-white">{totalProducts} Products</span>
              </div>
            </div>

            {/* Complete Products */}
            <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs flex flex-col justify-between">
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-xs font-semibold text-slate-500">Complete Products</span>
                  <h3 className="text-2xl font-bold font-mono text-slate-900 mt-1">{completeProducts}</h3>
                  <span className="text-[11px] text-emerald-600 font-medium">
                    {totalProducts > 0 ? `${Math.round((completeProducts / totalProducts) * 100)}%` : '0%'} zero-defect records
                  </span>
                </div>
                <div className="p-2.5 rounded-xl bg-emerald-50 text-emerald-600">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
              </div>
              <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                <span>Verified in PostgreSQL</span>
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              </div>
            </div>

            {/* Products With Issues */}
            <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs flex flex-col justify-between">
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-xs font-semibold text-slate-500">Products With Issues</span>
                  <h3 className="text-2xl font-bold font-mono text-slate-900 mt-1">{productsWithIssues}</h3>
                  <span className="text-[11px] text-amber-600 font-medium">
                    {productsWithIssues > 0 ? `${productsWithIssues} products flagged` : 'All records clean'}
                  </span>
                </div>
                <div className="p-2.5 rounded-xl bg-amber-50 text-amber-600">
                  <AlertTriangle className="w-5 h-5" />
                </div>
              </div>
              <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                <span>Open Defect Records</span>
                <Link href="/catalog-issues" className="text-blue-600 font-bold hover:underline">
                  Inspect →
                </Link>
              </div>
            </div>

            {/* Total Open Issues */}
            <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs flex flex-col justify-between">
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-xs font-semibold text-slate-500">Total Open Issues</span>
                  <h3 className="text-2xl font-bold font-mono text-slate-900 mt-1">{totalOpenIssues}</h3>
                  <span className="text-[11px] text-slate-500">
                    Across 9 quality categories
                  </span>
                </div>
                <div className="p-2.5 rounded-xl bg-blue-50 text-blue-600">
                  <Layers className="w-5 h-5" />
                </div>
              </div>
              <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                <span>Human sign-off console</span>
                <span className="font-mono text-slate-700 font-bold">{totalOpenIssues} items</span>
              </div>
            </div>
          </div>

          {/* Component Breakdown Card */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h3 className="text-base font-bold text-slate-900 tracking-tight">Explainable Component Breakdown</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Component dimension scores computed deterministically from PostgreSQL records.
                </p>
              </div>
              <div className="text-xs font-mono font-bold text-slate-600 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200">
                Weighted Formula: (Comp×30% + Cons×25% + Val×15% + Fresh×10% + Compl×10% + Conf×10%)
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
              {componentChartData.map((item, idx) => (
                <div key={idx} className="p-3.5 rounded-xl bg-slate-50 border border-slate-100 space-y-2">
                  <span className="text-[11px] font-bold text-slate-600 block truncate">{item.name}</span>
                  <div className="flex items-baseline justify-between">
                    <span className="text-xl font-bold font-mono text-slate-900">{item.score}%</span>
                    <span
                      className={`text-[10px] font-bold px-1.5 py-0.2 rounded ${
                        item.score >= 90
                          ? 'bg-emerald-100 text-emerald-800'
                          : item.score >= 70
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-rose-100 text-rose-800'
                      }`}
                    >
                      {item.score >= 90 ? 'High' : item.score >= 70 ? 'Moderate' : 'Low'}
                    </span>
                  </div>
                  <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${item.score}%`,
                        backgroundColor: item.color
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Clickable Issue Breakdown Grid (Section 24) */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-900 tracking-tight">
                  Catalog Quality Issues by Dimension
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Click any metric card below to filter and resolve issues in the decision workspace.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {issueCards.map((card, idx) => {
                const IconComponent = card.icon;
                return (
                  <Link
                    key={idx}
                    href={card.href}
                    className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs hover:shadow-md hover:border-blue-300 transition-all group flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-start justify-between">
                        <div className={`p-2.5 rounded-xl ${card.bgColor} ${card.iconColor}`}>
                          <IconComponent className="w-5 h-5" />
                        </div>
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            card.value > 0
                              ? 'bg-amber-100 text-amber-900 border border-amber-200'
                              : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          }`}
                        >
                          {card.value > 0 ? `${card.value} Open` : 'Clean ✓'}
                        </span>
                      </div>

                      <h4 className="text-sm font-bold text-slate-900 mt-3 group-hover:text-blue-600 transition-colors">
                        {card.title}
                      </h4>
                      <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">{card.subtitle}</p>
                    </div>

                    <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                      <span className="text-slate-400 font-medium">{card.badgeText}</span>
                      <span className="font-bold text-blue-600 group-hover:translate-x-0.5 transition-transform inline-flex items-center gap-1">
                        <span>Resolve</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </span>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
