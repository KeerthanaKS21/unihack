'use client';

import React, { useState, useEffect } from 'react';
import { useApp } from '@/context/AppContext';
import { PageHeader } from '@/components/layout/PageHeader';
import { api } from '@/lib/api';
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
  Filter,
  Loader2
} from 'lucide-react';
import Link from 'next/link';

export default function ChangeImpactPage() {
  const { showToast, refreshBackendData } = useApp();

  const [loading, setLoading] = useState(true);
  const [impacts, setImpacts] = useState<any[]>([]);
  const [selectedDomain, setSelectedDomain] = useState<string>('all');
  const [filterSeverity, setFilterSeverity] = useState<string>('all');

  const fetchImpacts = async () => {
    setLoading(true);
    try {
      const res = await api.getChangeImpacts();
      if (Array.isArray(res)) {
        setImpacts(res);
      }
    } catch (err) {
      console.warn('Failed to load change impacts from API:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchImpacts();
  }, []);

  const toggleReview = async (impactId: number, currentReviewed: boolean) => {
    const nextState = !currentReviewed;
    try {
      await api.reviewChangeImpact(impactId, nextState);
      setImpacts(prev => prev.map(imp => imp.id === impactId ? { ...imp, reviewed: nextState } : imp));
      await refreshBackendData();
      showToast({
        type: 'info',
        title: nextState ? 'Impact Reviewed' : 'Review Reset',
        message: nextState ? 'Marked operational impact as reviewed.' : 'Impact reset to unreviewed.'
      });
    } catch (err: any) {
      showToast({
        type: 'error',
        title: 'Review Update Failed',
        message: err.message || 'Could not update review status.'
      });
    }
  };

  const markAllReviewed = async () => {
    try {
      await Promise.all(impacts.filter(i => !i.reviewed).map(i => api.reviewChangeImpact(i.id, true)));
      setImpacts(prev => prev.map(imp => ({ ...imp, reviewed: true })));
      await refreshBackendData();
      showToast({
        type: 'success',
        title: 'All Impacts Acknowledged',
        message: 'All operational impacts have been reviewed. Safe to approve synchronization.'
      });
    } catch (err: any) {
      showToast({
        type: 'error',
        title: 'Batch Review Failed',
        message: err.message || 'Could not mark all impacts as reviewed.'
      });
    }
  };

  const totalImpacts = impacts.length;
  const reviewedCount = impacts.filter(i => i.reviewed).length;
  const unreviewedCount = totalImpacts - reviewedCount;
  const progressPercent = totalImpacts > 0 ? Math.round((reviewedCount / totalImpacts) * 100) : 100;

  const filteredImpacts = impacts.filter(imp => {
    const domain = imp.domain || imp.impact_type || '';
    const severity = imp.severity || 'medium';
    const domainMatch = selectedDomain === 'all' || domain.toLowerCase() === selectedDomain.toLowerCase();
    const severityMatch = filterSeverity === 'all' || severity.toLowerCase() === filterSeverity.toLowerCase();
    return domainMatch && severityMatch;
  });

  const getDomainIcon = (domain: string) => {
    const d = (domain || '').toLowerCase();
    if (d.includes('compat')) return <Cpu className="w-4 h-4 text-blue-600" />;
    if (d.includes('comm') || d.includes('store')) return <ShoppingBag className="w-4 h-4 text-emerald-600" />;
    if (d.includes('procure') || d.includes('supp')) return <Truck className="w-4 h-4 text-amber-600" />;
    if (d.includes('quote') || d.includes('rfq')) return <FileText className="w-4 h-4 text-purple-600" />;
    return <Sparkles className="w-4 h-4 text-indigo-600" />;
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
        badge={`${unreviewedCount} Unreviewed`}
        badgeVariant={unreviewedCount > 0 ? 'warning' : 'success'}
        action={
          <div className="flex items-center gap-2.5">
            {unreviewedCount > 0 ? (
              <button
                onClick={markAllReviewed}
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
                TRIGGER: XYZ-450 Version Delta
              </span>
              <span className="text-xs text-slate-500 font-medium">
                Downstream Ripple Analysis Generated by AI
              </span>
            </div>
            <h3 className="text-lg font-bold text-slate-900 mt-1">
              Impact Review Completion: {reviewedCount} of {totalImpacts} Acknowledged
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
            <span className={`w-2 h-2 rounded-full ${unreviewedCount > 0 ? 'bg-rose-500 animate-pulse' : 'bg-emerald-500'}`} />
            <span>
              <strong>Navigation Notification Status:</strong>{' '}
              {unreviewedCount > 0
                ? `Showing "Change Impact • ${unreviewedCount}" badge in sidebar navigation until all impacts are reviewed.`
                : 'All operational impacts acknowledged. Notification badge cleared.'}
            </span>
          </div>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-slate-400 font-semibold flex items-center gap-1">
            <Filter className="w-3.5 h-3.5" /> Domain:
          </span>
          {['all', 'compatibility', 'e-commerce', 'procurement', 'quote'].map(d => (
            <button
              key={d}
              onClick={() => setSelectedDomain(d)}
              className={`px-3 py-1.5 rounded-lg font-bold transition-colors capitalize ${
                selectedDomain === d
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
              }`}
            >
              {d}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <span className="text-slate-400 font-semibold">Severity:</span>
          <select
            value={filterSeverity}
            onChange={e => setFilterSeverity(e.target.value)}
            className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 font-medium focus:outline-none"
          >
            <option value="all">All Severities</option>
            <option value="high">High Severity</option>
            <option value="medium">Medium Severity</option>
            <option value="low">Low Severity</option>
          </select>
        </div>
      </div>

      {/* Impact Cards Grid */}
      {loading ? (
        <div className="p-16 text-center text-slate-400 space-y-2 bg-white rounded-2xl border border-slate-200">
          <Loader2 className="w-6 h-6 animate-spin mx-auto text-blue-600" />
          <p className="text-xs">Loading operational impact records...</p>
        </div>
      ) : filteredImpacts.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-2xl border border-slate-200 space-y-2">
          <ShieldAlert className="w-8 h-8 text-slate-300 mx-auto" />
          <h4 className="text-sm font-bold text-slate-700">No Operational Impacts Found</h4>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            No downstream impacts match the current filter criteria or no changes are currently pending review.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredImpacts.map((imp: any) => {
            const domain = imp.domain || imp.impact_type || 'Operations';
            const isReviewed = imp.reviewed;
            const sev = (imp.severity || 'medium').toLowerCase();

            return (
              <div
                key={imp.id}
                className={`bg-white rounded-2xl p-5 border shadow-xs transition-all flex flex-col justify-between gap-4 ${
                  isReviewed
                    ? 'border-emerald-200 bg-emerald-50/10 opacity-80'
                    : sev === 'high' || sev === 'critical'
                    ? 'border-rose-200 bg-rose-50/20'
                    : 'border-amber-200 bg-amber-50/20'
                }`}
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <div className="p-1.5 rounded-lg bg-slate-100">
                        {getDomainIcon(domain)}
                      </div>
                      <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                        {domain}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${
                        sev === 'high' || sev === 'critical'
                          ? 'bg-rose-100 text-rose-800 border border-rose-200'
                          : sev === 'medium'
                          ? 'bg-amber-100 text-amber-800 border border-amber-200'
                          : 'bg-blue-100 text-blue-800 border border-blue-200'
                      }`}>
                        {sev}
                      </span>

                      {isReviewed ? (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 border border-emerald-200 flex items-center gap-1">
                          <Check className="w-3 h-3 text-emerald-600" /> Reviewed
                        </span>
                      ) : (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-rose-100 text-rose-800 border border-rose-200">
                          Pending Review
                        </span>
                      )}
                    </div>
                  </div>

                  <div>
                    <h4 className="text-sm font-bold text-slate-900 leading-snug">
                      {imp.title}
                    </h4>
                    <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                      {imp.description || imp.explanation}
                    </p>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2 text-xs">
                  {imp.target_module_url ? (
                    <Link
                      href={imp.target_module_url}
                      className="text-xs font-semibold text-blue-600 hover:text-blue-800 inline-flex items-center gap-1"
                    >
                      <span>Open {domain} Module</span>
                      <ExternalLink className="w-3 h-3" />
                    </Link>
                  ) : <span />}

                  <button
                    onClick={() => toggleReview(imp.id, isReviewed)}
                    className={`px-3.5 py-1.5 text-xs font-bold rounded-lg transition-colors inline-flex items-center gap-1.5 shadow-2xs ${
                      isReviewed
                        ? 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                        : 'bg-blue-600 hover:bg-blue-700 text-white'
                    }`}
                  >
                    {isReviewed ? (
                      <>
                        <RotateCcw className="w-3.5 h-3.5" />
                        <span>Undo Review</span>
                      </>
                    ) : (
                      <>
                        <Check className="w-3.5 h-3.5" />
                        <span>Mark as Reviewed</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
