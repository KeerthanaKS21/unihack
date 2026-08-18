'use client';

import React, { useState } from 'react';
import { useApp } from '@/context/AppContext';
import { PageHeader } from '@/components/layout/PageHeader';
import { StatusBadge } from '@/components/common/StatusBadge';
import {
  Zap,
  CheckCircle2,
  AlertTriangle,
  ExternalLink,
  ShieldAlert,
  ArrowRight,
  Cpu,
  ShoppingBag,
  Truck,
  FileText,
  Sparkles,
  Check,
  RotateCcw,
  Layers,
  Filter
} from 'lucide-react';
import Link from 'next/link';

export default function ChangeImpactPage() {
  const {
    changeImpacts,
    unreviewedImpactsCount,
    reviewedImpactsCount,
    toggleImpactReviewed,
    markAllImpactsReviewed,
    activeProduct
  } = useApp();

  const [selectedDomain, setSelectedDomain] = useState<string>('all');
  const [filterSeverity, setFilterSeverity] = useState<string>('all');

  const totalImpacts = changeImpacts.length;
  const progressPercent = Math.round((reviewedImpactsCount / totalImpacts) * 100);

  const filteredImpacts = changeImpacts.filter(imp => {
    const domainMatch = selectedDomain === 'all' || imp.domain.toLowerCase() === selectedDomain.toLowerCase();
    const severityMatch = filterSeverity === 'all' || imp.severity.toLowerCase() === filterSeverity.toLowerCase();
    return domainMatch && severityMatch;
  });

  const domainIcons = {
    Compatibility: Cpu,
    'E-commerce': ShoppingBag,
    Procurement: Truck,
    Quote: FileText,
    Recommendations: Sparkles
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Cross-Domain Change Impact Analysis"
        subtitle="Automated intelligence tracing how product changes ripple across downstream systems, active orders, compatibility, and supplier matrices."
        breadcrumbs={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Synchronization', href: '/synchronization' },
          { label: 'Change Impact' }
        ]}
        badge={`${unreviewedImpactsCount} Unreviewed`}
        badgeVariant={unreviewedImpactsCount > 0 ? 'warning' : 'success'}
        action={
          <div className="flex items-center gap-2.5">
            {unreviewedImpactsCount > 0 ? (
              <button
                onClick={markAllImpactsReviewed}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg shadow-xs transition-colors inline-flex items-center gap-1.5"
              >
                <Check className="w-4 h-4" />
                <span>Mark All as Reviewed</span>
              </button>
            ) : (
              <Link
                href="/synchronization"
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg shadow-xs transition-colors inline-flex items-center gap-1.5"
              >
                <span>Return to Synchronization →</span>
              </Link>
            )}
          </div>
        }
      />

      {/* Progress & Operational Overview Header Card */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5">
              <span className="text-xs font-bold text-blue-700 bg-blue-50 px-2.5 py-0.5 rounded border border-blue-200 font-mono">
                TRIGGER: XYZ-450 v2.0
              </span>
              <span className="text-xs text-slate-500 font-medium">
                Power 5.5 kW → 7.5 kW • Speed 1440 → 1460 RPM • Weight 42 → 45 kg
              </span>
            </div>
            <h3 className="text-lg font-bold text-slate-900 mt-1">
              Impact Review Completion: {reviewedImpactsCount} of {totalImpacts} Acknowledged
            </h3>
          </div>

          <div className="text-right shrink-0">
            <span className="text-2xl font-extrabold text-slate-900 font-mono">
              {progressPercent}%
            </span>
            <span className="text-xs text-slate-400 block font-medium">Review Progress</span>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden">
          <div
            className={`h-3 rounded-full transition-all duration-500 ${
              progressPercent === 100 ? 'bg-emerald-500' : 'bg-blue-600'
            }`}
            style={{ width: `${progressPercent}%` }}
          />
        </div>

        {/* Dynamic Badge Notification Explainer */}
        <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 flex items-center justify-between text-xs text-slate-600">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
            <span>
              <strong>Sidebar Notification Status:</strong>{' '}
              {unreviewedImpactsCount > 0 ? (
                <span>
                  Showing active badge count{' '}
                  <code className="bg-rose-100 text-rose-800 px-1.5 py-0.2 rounded font-bold font-mono">
                    Change Impact • {unreviewedImpactsCount}
                  </code>
                </span>
              ) : (
                <span className="text-emerald-700 font-semibold">
                  All impacts acknowledged. Notification badge cleared.
                </span>
              )}
            </span>
          </div>
          <span className="text-[11px] text-slate-400 font-mono">
            Requires Human Sign-off
          </span>
        </div>
      </div>

      {/* Domain Filters & Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-1.5 overflow-x-auto text-xs font-semibold">
          {['all', 'Compatibility', 'E-commerce', 'Procurement', 'Quote', 'Recommendations'].map(dom => (
            <button
              key={dom}
              onClick={() => setSelectedDomain(dom)}
              className={`px-3 py-1.5 rounded-lg transition-all capitalize whitespace-nowrap ${
                selectedDomain.toLowerCase() === dom.toLowerCase()
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
              }`}
            >
              {dom}
            </button>
          ))}
        </div>

        {/* Severity Filter */}
        <div className="flex items-center gap-2 text-xs">
          <span className="text-slate-500 font-medium">Severity:</span>
          <select
            value={filterSeverity}
            onChange={e => setFilterSeverity(e.target.value)}
            className="px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-slate-700 font-medium focus:outline-none"
          >
            <option value="all">All Severities</option>
            <option value="critical">Critical</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>
        </div>
      </div>

      {/* Impact Cards Grid */}
      <div className="space-y-4">
        {filteredImpacts.map(impact => {
          const Icon = domainIcons[impact.domain] || Zap;
          const isReviewed = impact.reviewed;

          const severityBadgeStyles = {
            critical: 'bg-rose-100 text-rose-800 border-rose-200',
            high: 'bg-amber-100 text-amber-800 border-amber-200',
            medium: 'bg-blue-100 text-blue-800 border-blue-200',
            low: 'bg-slate-100 text-slate-700 border-slate-200'
          }[impact.severity];

          return (
            <div
              key={impact.id}
              className={`rounded-2xl p-6 border transition-all duration-200 shadow-xs ${
                isReviewed
                  ? 'bg-white border-slate-200 opacity-90'
                  : impact.severity === 'critical'
                  ? 'bg-rose-50/30 border-rose-300 ring-1 ring-rose-200'
                  : impact.severity === 'high'
                  ? 'bg-amber-50/30 border-amber-300 ring-1 ring-amber-200'
                  : 'bg-blue-50/20 border-blue-200'
              }`}
            >
              <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-6">
                {/* Left Content */}
                <div className="space-y-3 flex-1">
                  <div className="flex items-center gap-2.5 flex-wrap">
                    <span className="inline-flex items-center gap-1.5 text-xs font-bold px-2.5 py-0.5 rounded-lg bg-slate-100 text-slate-800 border border-slate-200">
                      <Icon className="w-3.5 h-3.5 text-slate-600" />
                      <span>{impact.domain}</span>
                    </span>

                    <span className={`text-[11px] font-bold uppercase px-2 py-0.5 rounded border ${severityBadgeStyles}`}>
                      {impact.severity} Severity
                    </span>

                    <span className="text-xs text-slate-400 font-mono">
                      Target: {impact.productName}
                    </span>
                  </div>

                  <div>
                    <h3 className="text-base font-bold text-slate-900">
                      {impact.title}
                    </h3>
                    <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                      {impact.explanation}
                    </p>
                  </div>

                  {/* Operational Context & Evidence */}
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 text-xs font-mono text-slate-700 space-y-1">
                    <div className="flex items-center gap-2 text-slate-500 font-sans font-bold text-[11px] uppercase">
                      <Layers className="w-3.5 h-3.5 text-blue-600" />
                      <span>System Context & Evidence Grounding:</span>
                    </div>
                    <p className="leading-relaxed">
                      {impact.contextEvidence}
                    </p>
                  </div>

                  {isReviewed && (
                    <div className="flex items-center gap-2 text-xs text-emerald-700 font-medium pt-1">
                      <CheckCircle2 className="w-4 h-4" />
                      <span>
                        Acknowledged by {impact.reviewedBy} at {impact.reviewedAt}
                      </span>
                    </div>
                  )}
                </div>

                {/* Right Action Controls */}
                <div className="flex lg:flex-col items-center lg:items-end justify-between gap-3 shrink-0 pt-2 lg:pt-0">
                  <button
                    onClick={() => toggleImpactReviewed(impact.id)}
                    className={`px-5 py-2 text-xs font-bold rounded-xl transition-all shadow-xs inline-flex items-center gap-2 ${
                      isReviewed
                        ? 'bg-emerald-100 hover:bg-emerald-200 text-emerald-800 border border-emerald-300'
                        : 'bg-blue-600 hover:bg-blue-700 text-white'
                    }`}
                  >
                    {isReviewed ? (
                      <>
                        <CheckCircle2 className="w-4 h-4" />
                        <span>✓ Reviewed</span>
                      </>
                    ) : (
                      <>
                        <span>Mark Reviewed</span>
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>

                  <Link
                    href={impact.targetModuleUrl}
                    className="text-xs font-semibold text-blue-600 hover:text-blue-800 inline-flex items-center gap-1 hover:underline"
                  >
                    <span>Open {impact.domain}</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
