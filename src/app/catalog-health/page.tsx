'use client';

import React from 'react';
import { useApp } from '@/context/AppContext';
import { PageHeader } from '@/components/layout/PageHeader';
import { MetricCard } from '@/components/common/MetricCard';
import {
  Activity,
  CheckCircle2,
  AlertCircle,
  FileQuestion,
  Copy,
  Clock,
  Ruler,
  ShieldAlert,
  Image as ImageIcon,
  Unlink,
  Sparkles,
  ArrowRight,
  TrendingUp,
  Layers,
  ChevronRight
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
  Cell
} from 'recharts';

export default function CatalogHealthPage() {
  const { catalogHealth } = useApp();

  const metrics = [
    {
      title: 'Complete Products',
      value: catalogHealth.completeProducts.toLocaleString(),
      subtitle: '82% of catalog fully verified',
      icon: CheckCircle2,
      color: 'emerald',
      bgColor: 'bg-emerald-50',
      iconColor: 'text-emerald-600',
      badgeText: 'Verified Quality',
      href: '/catalog-issues'
    },
    {
      title: 'Missing Attributes',
      value: catalogHealth.missingDataCount,
      subtitle: 'Blank technical parameters',
      icon: FileQuestion,
      color: 'amber',
      bgColor: 'bg-amber-50',
      iconColor: 'text-amber-600',
      badgeText: 'AI Suggest Ready',
      href: '/catalog-issues?filter=missing'
    },
    {
      title: 'Cross-System Conflicts',
      value: catalogHealth.conflictsCount,
      subtitle: 'Datasheet vs ERP vs Web',
      icon: AlertCircle,
      color: 'purple',
      bgColor: 'bg-purple-50',
      iconColor: 'text-purple-600',
      badgeText: 'Action Required',
      href: '/catalog-issues?filter=conflict'
    },
    {
      title: 'Duplicate Entities',
      value: catalogHealth.duplicatesCount,
      subtitle: 'Candidate aliases & SKUs',
      icon: Copy,
      color: 'blue',
      bgColor: 'bg-blue-50',
      iconColor: 'text-blue-600',
      badgeText: 'Merge Candidates',
      href: '/catalog-issues?filter=duplicate'
    },
    {
      title: 'Outdated / EOL SKUs',
      value: catalogHealth.outdatedProductsCount,
      subtitle: 'Superseded by newer releases',
      icon: Clock,
      color: 'slate',
      bgColor: 'bg-slate-100',
      iconColor: 'text-slate-600',
      badgeText: 'Lifecycle Phaseout',
      href: '/catalog-issues?filter=outdated'
    },
    {
      title: 'Invalid Units (SI/ISO)',
      value: catalogHealth.invalidUnitsCount,
      subtitle: 'Unit syntax normalization',
      icon: Ruler,
      color: 'rose',
      bgColor: 'bg-pink-50',
      iconColor: 'text-pink-600',
      badgeText: 'Syntax Fixed',
      href: '/catalog-issues?filter=invalid_unit'
    },
    {
      title: 'Compliance & Expiry',
      value: catalogHealth.complianceIssuesCount,
      subtitle: 'Missing certificates & standard gaps',
      icon: ShieldAlert,
      color: 'rose',
      bgColor: 'bg-rose-50',
      iconColor: 'text-rose-600',
      badgeText: 'Audit Needed',
      href: '/compliance'
    },
    {
      title: 'Image / Data Mismatches',
      value: catalogHealth.imageMismatchCount,
      subtitle: 'CV vision verified discrepancies',
      icon: ImageIcon,
      color: 'blue',
      bgColor: 'bg-indigo-50',
      iconColor: 'text-indigo-600',
      badgeText: 'Vision Flagged',
      href: '/catalog-issues?filter=image_mismatch'
    },
    {
      title: 'Broken Relationships',
      value: catalogHealth.brokenRelationshipsCount,
      subtitle: 'Unlinked accessories & couplings',
      icon: Unlink,
      color: 'amber',
      bgColor: 'bg-orange-50',
      iconColor: 'text-orange-600',
      badgeText: 'Graph Repaired',
      href: '/catalog-issues?filter=broken_relationship'
    }
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Enterprise Catalog Health & Governance"
        subtitle="Continuous automated data hygiene scanner monitoring 10,000 product models across 9 industrial quality dimensions."
        breadcrumbs={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Catalog Health' }
        ]}
        badge={`${catalogHealth.overallHealthScore}% Overall Health`}
        badgeVariant="success"
      />

      {/* Main Score & Quality Breakdown Card */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
          {/* Health Score Gauge Display */}
          <div className="flex items-center gap-6">
            <div className="relative w-28 h-28 rounded-full border-8 border-slate-100 flex items-center justify-center bg-blue-50/40">
              <div
                className="absolute inset-0 rounded-full border-8 border-blue-600 border-t-emerald-500"
                style={{ clipPath: 'polygon(0 0, 100% 0, 100% 100%, 0 100%)' }}
              />
              <div className="text-center z-10">
                <span className="text-3xl font-extrabold text-slate-900 font-mono tracking-tight">
                  {catalogHealth.overallHealthScore}%
                </span>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                  Catalog Health
                </span>
              </div>
            </div>

            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold text-slate-900">
                  Global Catalog Completeness & Governance Score
                </h3>
                <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                  Enterprise Benchmark: 90%+
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-1 max-w-xl leading-relaxed">
                Calculated in real-time from 10,000 SKUs. Click on any problem dimension below to launch the human-in-the-loop issue resolver.
              </p>
            </div>
          </div>

          <Link
            href="/catalog-issues"
            className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-xs transition-colors inline-flex items-center gap-2 shrink-0"
          >
            <span>Resolve All Flagged Issues</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>

      {/* Clickable Problem Dimension Cards (Requirement #12) */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
            Quality Breakdown & Issue Drilldown (Click to Resolve)
          </h3>
          <span className="text-xs text-slate-500">
            9 Monitored Quality Vectors
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {metrics.map(item => (
            <MetricCard
              key={item.title}
              title={item.title}
              value={item.value}
              subtitle={item.subtitle}
              icon={item.icon}
              iconBgColor={item.bgColor}
              iconColor={item.iconColor}
              badgeText={item.badgeText}
              badgeColor={item.color as any}
              href={item.href}
            />
          ))}
        </div>
      </div>

      {/* Category Health Breakdown Chart */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-slate-900 tracking-tight">
              Quality Score by Industrial Product Taxonomy
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Comparison of SKU volume and health performance across primary product families.
            </p>
          </div>
          <span className="text-xs font-semibold text-blue-600 bg-blue-50 px-2.5 py-1 rounded-lg border border-blue-200">
            5 Categories Monitored
          </span>
        </div>

        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={catalogHealth.categoryBreakdown} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="category" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
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
              <Bar dataKey="healthScore" name="Health Score %" radius={[6, 6, 0, 0]}>
                {catalogHealth.categoryBreakdown.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={entry.healthScore >= 92 ? '#0284c7' : entry.healthScore >= 90 ? '#38a9f6' : '#f59e0b'}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
