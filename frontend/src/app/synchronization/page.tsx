'use client';

import React, { useState } from 'react';
import { useApp } from '@/context/AppContext';
import { PageHeader } from '@/components/layout/PageHeader';
import { StatusBadge } from '@/components/common/StatusBadge';
import { ConfirmationModal } from '@/components/common/ConfirmationModal';
import {
  RefreshCw,
  Zap,
  ArrowRight,
  CheckCircle2,
  AlertTriangle,
  FileText,
  ShieldCheck,
  Cpu,
  Layers,
  ArrowUpRight,
  ExternalLink,
  Lock,
  Sparkles
} from 'lucide-react';
import Link from 'next/link';

export default function SynchronizationPage() {
  const {
    activeProduct,
    productChanges,
    syncStatus,
    unreviewedImpactsCount,
    reviewedImpactsCount,
    approveSynchronization,
    setViewingDocument,
    documents
  } = useApp();

  const [confirmModalOpen, setConfirmModalOpen] = useState(false);
  const [approvalNotes, setApprovalNotes] = useState(
    'Verified against Siemens technical_spec_2026.pdf engineering release. Approved for production data layer.'
  );

  const isSyncApproved = syncStatus === 'synchronized';
  const hasUnreviewedImpacts = unreviewedImpactsCount > 0;

  const specRows = [
    { label: 'Rated Power', key: 'power', current: '7.5 kW', previous: '5.5 kW', isChanged: true, changeNote: '+36.4% upgrade (10 HP)' },
    { label: 'Operating Voltage', key: 'voltage', current: '415 V', previous: '415 V', isChanged: false, changeNote: 'Standard 3-Phase Grid' },
    { label: 'Full Load Speed', key: 'speed', current: '1460 RPM', previous: '1440 RPM', isChanged: true, changeNote: '+20 RPM efficiency tune' },
    { label: 'Rated Frequency', key: 'frequency', current: '50 Hz', previous: '50 Hz', isChanged: false, changeNote: 'Standard 50 Hz' },
    { label: 'Ingress Protection', key: 'ipRating', current: 'IP55', previous: 'IP55', isChanged: false, changeNote: 'Dust & Water Jet TEFC' },
    { label: 'Gross Weight', key: 'weight', current: '45 kg', previous: '42 kg', isChanged: true, changeNote: '+3 kg (Frame 132S → 132M)' },
    { label: 'Full Load Efficiency', key: 'efficiency', current: '91.2% (IE3)', previous: '89.6% (IE2)', isChanged: true, changeNote: 'Upgraded to IE3 Premium' }
  ];

  const handleApprove = () => {
    approveSynchronization(approvalNotes);
    setConfirmModalOpen(false);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Product Version & Spec Synchronization"
        subtitle="Detect and synchronize technical changes between newly ingested datasheets and verified master records."
        breadcrumbs={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Synchronization' }
        ]}
        badge={isSyncApproved ? 'Synchronized & Verified' : 'Version Delta Detected'}
        badgeVariant={isSyncApproved ? 'success' : 'warning'}
        action={
          <div className="flex items-center gap-2.5">
            <Link
              href="/change-impact"
              className="px-4 py-2 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 text-xs font-bold rounded-lg shadow-2xs transition-colors inline-flex items-center gap-1.5"
            >
              <Zap className="w-4 h-4 text-amber-600" />
              <span>Review Impacts ({unreviewedImpactsCount} pending)</span>
            </Link>

            <button
              onClick={() => setConfirmModalOpen(true)}
              disabled={isSyncApproved}
              className={`px-4 py-2 text-xs font-bold rounded-lg shadow-sm transition-all inline-flex items-center gap-1.5 ${
                isSyncApproved
                  ? 'bg-emerald-600 text-white opacity-90 cursor-default'
                  : 'bg-blue-600 hover:bg-blue-700 text-white'
              }`}
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{isSyncApproved ? '✓ Synchronized' : 'Approve Synchronization'}</span>
            </button>
          </div>
        }
      />

      {/* Synchronized Success Status Banner */}
      {isSyncApproved && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-5 text-emerald-900 flex items-start gap-4 animate-in fade-in duration-300">
          <div className="p-2.5 bg-emerald-100 rounded-xl text-emerald-700 shrink-0">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-sm font-bold">
              Master Record Synchronized & Verified (v2.0 Active)
            </h3>
            <p className="text-xs text-emerald-800 mt-0.5 leading-relaxed">
              XYZ-450 specifications (7.5 kW, 1460 RPM, 45 kg) have been validated with human sign-off and propagated across the unified enterprise data layer.
            </p>
          </div>
        </div>
      )}

      {/* Change Detection & Impact Alert Banner */}
      {!isSyncApproved && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Changes Detected Card */}
          <div className="bg-white rounded-2xl p-5 border border-amber-200 bg-amber-50/20 shadow-xs flex items-start justify-between gap-4">
            <div className="flex items-start gap-3.5">
              <div className="p-2.5 rounded-xl bg-amber-100 text-amber-700 shrink-0">
                <RefreshCw className="w-5 h-5 animate-spin" style={{ animationDuration: '10s' }} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-amber-900 uppercase tracking-wider">
                    3 Technical Changes Detected
                  </span>
                  <span className="text-[10px] font-mono px-2 py-0.2 rounded-full bg-amber-100 text-amber-800 font-bold">
                    v1.4 → v2.0
                  </span>
                </div>
                <h4 className="text-sm font-bold text-slate-900 mt-1">
                  Siemens XYZ-450 Industrial Motor
                </h4>
                <p className="text-xs text-slate-500 mt-0.5">
                  Source: <code className="bg-slate-100 px-1 py-0.5 rounded text-blue-600 font-mono">technical_spec_2026.pdf</code>
                </p>
              </div>
            </div>
            <button
              onClick={() => setViewingDocument(documents[0])}
              className="text-xs font-semibold text-blue-600 hover:text-blue-800 inline-flex items-center gap-1 shrink-0"
            >
              <span>View PDF</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Change Impact Pending Review Card */}
          <div className={`rounded-2xl p-5 border shadow-xs flex items-start justify-between gap-4 ${
            hasUnreviewedImpacts
              ? 'bg-rose-50/40 border-rose-200 text-rose-950'
              : 'bg-emerald-50/40 border-emerald-200 text-emerald-950'
          }`}>
            <div className="flex items-start gap-3.5">
              <div className={`p-2.5 rounded-xl shrink-0 ${
                hasUnreviewedImpacts ? 'bg-rose-100 text-rose-600' : 'bg-emerald-100 text-emerald-600'
              }`}>
                <Zap className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold uppercase tracking-wider">
                    {hasUnreviewedImpacts ? 'Change Impact Pending Review' : 'All Impacts Acknowledged'}
                  </span>
                  <span className={`text-[10px] font-bold px-2 py-0.2 rounded-full ${
                    hasUnreviewedImpacts ? 'bg-rose-100 text-rose-800' : 'bg-emerald-100 text-emerald-800'
                  }`}>
                    {reviewedImpactsCount} of 6 Reviewed
                  </span>
                </div>
                <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                  {hasUnreviewedImpacts
                    ? `${unreviewedImpactsCount} operational domain impacts require engineering acknowledgement before final synchronization.`
                    : 'All operational impacts have been reviewed. Safe to sign off on synchronization.'}
                </p>
              </div>
            </div>
            <Link
              href="/change-impact"
              className="px-3.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-lg shadow-xs transition-colors shrink-0 inline-flex items-center gap-1"
            >
              <span>Review</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      )}

      {/* Main Spec Comparison Diff Table */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-slate-900 tracking-tight">
              Specification Parameter Comparison Matrix
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Visual delta indicators highlight modified parameters (amber) and verified unchanged parameters (green).
            </p>
          </div>

          <div className="flex items-center gap-4 text-xs">
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded bg-amber-100 border border-amber-300" />
              <span className="text-slate-600 font-medium">Changed Attribute</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded bg-emerald-100 border border-emerald-300" />
              <span className="text-slate-600 font-medium">Verified Unchanged</span>
            </div>
          </div>
        </div>

        {/* Diff Table */}
        <div className="border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
              <tr>
                <th className="py-3 px-4 w-1/4">Specification Parameter</th>
                <th className="py-3 px-4 w-1/4 text-slate-500 bg-slate-50">
                  Previous Baseline (v1.4 - 2024)
                </th>
                <th className="py-3 px-4 w-1/4 text-blue-900 bg-blue-50/70 border-l border-r border-blue-100">
                  Newly Ingested (v2.0 - 2026)
                </th>
                <th className="py-3 px-4 w-1/4">Delta Analysis & Impact Notes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {specRows.map(row => (
                <tr
                  key={row.key}
                  className={`transition-colors ${
                    row.isChanged ? 'bg-amber-50/40 hover:bg-amber-50/60' : 'hover:bg-slate-50/60'
                  }`}
                >
                  <td className="py-3.5 px-4 font-bold text-slate-800">
                    {row.label}
                  </td>

                  {/* Previous Value */}
                  <td className="py-3.5 px-4 font-mono text-slate-500 bg-slate-50/50">
                    {row.isChanged ? (
                      <span className="line-through decoration-rose-500/60 decoration-2 text-slate-400">
                        {row.previous}
                      </span>
                    ) : (
                      <span>{row.previous}</span>
                    )}
                  </td>

                  {/* New Value with Indicator */}
                  <td className={`py-3.5 px-4 font-mono font-bold border-l border-r border-slate-100 ${
                    row.isChanged ? 'text-amber-900 bg-amber-100/40' : 'text-emerald-800 bg-emerald-50/30'
                  }`}>
                    <div className="flex items-center justify-between">
                      <span>{row.current}</span>
                      {row.isChanged ? (
                        <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-amber-200 text-amber-900 border border-amber-300">
                          MODIFIED
                        </span>
                      ) : (
                        <span className="text-[10px] font-medium px-1.5 py-0.2 rounded bg-emerald-100 text-emerald-800 border border-emerald-200">
                          UNCHANGED
                        </span>
                      )}
                    </div>
                  </td>

                  {/* Note */}
                  <td className="py-3.5 px-4">
                    <span className="text-slate-600 font-medium">
                      {row.changeNote}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Human Sign-off Action Callout */}
        <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <Lock className="w-4 h-4 text-slate-400" />
            <span className="text-xs text-slate-600 font-medium">
              Human approval required. Changes will not be committed to public storefronts or quotation engines without engineer sign-off.
            </span>
          </div>

          <button
            onClick={() => setConfirmModalOpen(true)}
            disabled={isSyncApproved}
            className={`px-5 py-2.5 text-xs font-bold rounded-lg shadow-sm transition-all shrink-0 ${
              isSyncApproved
                ? 'bg-emerald-600 text-white opacity-80 cursor-default'
                : 'bg-blue-600 hover:bg-blue-700 text-white'
            }`}
          >
            {isSyncApproved ? '✓ Synchronized' : 'Approve Synchronization →'}
          </button>
        </div>
      </div>

      {/* Confirmation Dialog Modal */}
      <ConfirmationModal
        isOpen={confirmModalOpen}
        title="Confirm Version 2.0 Synchronization"
        description="You are about to promote XYZ-450 v2.0 (7.5 kW, 1460 RPM, 45 kg) to the verified master data catalog. This update will unlock B2B e-commerce synchronization, procurement re-indexing, and quote template updates."
        confirmLabel="Confirm & Publish to Master"
        cancelLabel="Cancel"
        variant="primary"
        onConfirm={handleApprove}
        onCancel={() => setConfirmModalOpen(false)}
      >
        <div className="space-y-3">
          <label className="block text-xs font-bold text-slate-700">
            Audit Trail Verification Notes
          </label>
          <textarea
            value={approvalNotes}
            onChange={e => setApprovalNotes(e.target.value)}
            rows={3}
            className="w-full text-xs p-3 border border-slate-200 rounded-lg bg-slate-50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 font-mono"
          />
          <div className="flex items-center gap-2 text-[11px] text-slate-500">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            <span>Digital signature recorded under active engineer session.</span>
          </div>
        </div>
      </ConfirmationModal>
    </div>
  );
}
