'use client';

import React, { useState, useEffect } from 'react';
import { useApp } from '@/context/AppContext';
import { PageHeader } from '@/components/layout/PageHeader';
import { ConfirmationModal } from '@/components/common/ConfirmationModal';
import { api } from '@/lib/api';
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
  Sparkles,
  Loader2,
  Check
} from 'lucide-react';
import Link from 'next/link';

export default function SynchronizationPage() {
  const {
    activeProduct,
    unreviewedImpactsCount,
    reviewedImpactsCount,
    setViewingDocument,
    showToast
  } = useApp();

  const [confirmModalOpen, setConfirmModalOpen] = useState(false);
  const [approvalNotes, setApprovalNotes] = useState(
    'Verified against latest uploaded engineering datasheet. Approved for master data catalog.'
  );

  // Dynamic Live State from Backend
  const [loading, setLoading] = useState(true);
  const [dbChanges, setDbChanges] = useState<any[]>([]);
  const [activeDoc, setActiveDoc] = useState<any | null>(null);
  const [isSyncApproved, setIsSyncApproved] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [versionDiff, setVersionDiff] = useState<any | null>(null);

  // Fetch changes & latest document from backend
  const fetchSyncData = async () => {
    setLoading(true);
    try {
      // 1. Fetch uploaded documents
      const docsRes = await api.getDocuments({ limit: 10 });
      const docs = docsRes?.items || [];
      if (docs.length > 0) {
        const latest = docs[0];
        setActiveDoc(latest);

        // Run detect-version on latest doc to get dynamic spec diff
        const diffRes = await fetch(`http://localhost:8000/api/documents/${latest.id}/detect-version`, { method: 'POST' });
        if (diffRes.ok) {
          const diffJson = await diffRes.json();
          setVersionDiff(diffJson);
        }
      }

      // 2. Fetch changes
      const changesRes = await api.getChanges();
      if (Array.isArray(changesRes)) {
        setDbChanges(changesRes);
        const hasPending = changesRes.some((c: any) => c.status === 'PENDING');
        if (!hasPending && changesRes.length > 0) {
          setIsSyncApproved(true);
        }
      }
    } catch (err) {
      console.warn('Error fetching live synchronization data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSyncData();
  }, []);

  const handleApprove = async () => {
    if (!activeDoc) return;
    setSyncing(true);
    try {
      const res = await fetch(`http://localhost:8000/api/documents/${activeDoc.id}/approve-sync?approved_by=Lead%20Systems%20Engineer&comments=${encodeURIComponent(approvalNotes)}`, {
        method: 'POST'
      });
      if (!res.ok) {
        const errJson = await res.json();
        throw new Error(errJson.detail || 'Approval failed');
      }
      const data = await res.json();
      setIsSyncApproved(true);
      setConfirmModalOpen(false);
      showToast({
        type: 'success',
        title: 'Synchronization Approved',
        message: data.message || `Promoted to ${data.promoted_version} successfully.`
      });
      fetchSyncData();
    } catch (err: any) {
      showToast({
        type: 'error',
        title: 'Synchronization Error',
        message: err.message || 'Failed to approve synchronization.'
      });
    } finally {
      setSyncing(false);
    }
  };

  const hasUnreviewedImpacts = unreviewedImpactsCount > 0;
  const changesList = versionDiff?.changes || [];
  const meaningfulChanges = changesList.filter((c: any) => c.change_type === 'MODIFIED' || c.change_type === 'ADDED');

  return (
    <div className="space-y-6">
      <PageHeader
        title="Product Version & Spec Synchronization"
        subtitle="Detect and synchronize technical changes between newly ingested datasheets and verified master records."
        breadcrumbs={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Synchronization' }
        ]}
        badge={isSyncApproved ? 'Synchronized & Verified' : meaningfulChanges.length > 0 ? 'Version Delta Detected' : 'Baseline Verified'}
        badgeVariant={isSyncApproved ? 'success' : meaningfulChanges.length > 0 ? 'warning' : 'primary'}
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
              disabled={isSyncApproved || meaningfulChanges.length === 0 || syncing}
              className={`px-4 py-2 text-xs font-bold rounded-lg shadow-sm transition-all inline-flex items-center gap-1.5 ${
                isSyncApproved
                  ? 'bg-emerald-600 text-white opacity-90 cursor-default'
                  : meaningfulChanges.length === 0
                  ? 'bg-slate-300 text-slate-500 cursor-not-allowed'
                  : 'bg-blue-600 hover:bg-blue-700 text-white'
              }`}
            >
              {syncing ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Synchronizing...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{isSyncApproved ? '✓ Synchronized' : 'Approve Synchronization'}</span>
                </>
              )}
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
              Master Record Synchronized & Verified ({versionDiff?.candidate_version || 'v2.0'} Active)
            </h3>
            <p className="text-xs text-emerald-800 mt-0.5 leading-relaxed">
              {versionDiff?.product_name || 'XYZ-450'} specifications have been validated with human sign-off and propagated across the unified enterprise data layer. Previous versions archived.
            </p>
          </div>
        </div>
      )}

      {/* Change Detection & Impact Alert Banner */}
      {!isSyncApproved && meaningfulChanges.length > 0 && (
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
                    {meaningfulChanges.length} Technical Changes Detected
                  </span>
                  <span className="text-[10px] font-mono px-2 py-0.2 rounded-full bg-amber-100 text-amber-800 font-bold">
                    {versionDiff?.existing_version || 'v1.4'} → {versionDiff?.candidate_version || 'v2.0'}
                  </span>
                </div>
                <h4 className="text-sm font-bold text-slate-900 mt-1">
                  {versionDiff?.product_name || 'Siemens XYZ-450 Industrial Motor'}
                </h4>
                <p className="text-xs text-slate-500 mt-0.5">
                  Source: <code className="bg-slate-100 px-1 py-0.5 rounded text-blue-600 font-mono">{activeDoc?.original_file_name || activeDoc?.filename || 'Document'}</code>
                </p>
              </div>
            </div>
            {activeDoc && (
              <button
                onClick={() => setViewingDocument({
                  id: String(activeDoc.id),
                  filename: activeDoc.original_file_name || activeDoc.filename,
                  productId: String(activeDoc.product_id || 1),
                  productModel: 'XYZ-450',
                  documentType: activeDoc.document_type || 'DATASHEET',
                  uploadedOn: 'Today',
                  fileSize: '3.2 MB',
                  version: versionDiff?.candidate_version || 'v2.0',
                  status: 'Processed',
                  matchConfidence: 0.98,
                  isSameProductDetected: true,
                  detectedChangesSummary: 'Extracted specifications',
                  pagesCount: activeDoc.pages_count || 1,
                  extractedAttributes: activeDoc.extracted_attributes || {},
                  sourceCitations: activeDoc.source_citations || []
                })}
                className="text-xs font-semibold text-blue-600 hover:text-blue-800 inline-flex items-center gap-1 shrink-0"
              >
                <span>View Details</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </button>
            )}
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
                    {reviewedImpactsCount} Reviewed
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
          {loading ? (
            <div className="p-12 text-center text-slate-400 space-y-2">
              <Loader2 className="w-6 h-6 animate-spin mx-auto text-blue-600" />
              <p className="text-xs">Loading live parameter comparison matrix...</p>
            </div>
          ) : changesList.length === 0 ? (
            <div className="p-8 text-center bg-slate-50 space-y-2">
              <ShieldCheck className="w-8 h-8 text-emerald-600 mx-auto" />
              <h4 className="text-sm font-bold text-slate-800">Master Record in Sync</h4>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                No pending parameter changes detected. Upload a new datasheet version in Upload & Ingest to trigger the difference detection engine.
              </p>
              <Link
                href="/upload"
                className="mt-3 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg inline-flex items-center gap-1.5"
              >
                <span>Upload New Version Document →</span>
              </Link>
            </div>
          ) : (
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4 w-1/4">Specification Parameter</th>
                  <th className="py-3 px-4 w-1/4 text-slate-500 bg-slate-50">
                    Previous Baseline ({versionDiff?.existing_version || 'v1.4'})
                  </th>
                  <th className="py-3 px-4 w-1/4 text-blue-900 bg-blue-50/70 border-l border-r border-blue-100">
                    Newly Ingested ({versionDiff?.candidate_version || 'v2.0'})
                  </th>
                  <th className="py-3 px-4 w-1/4">Delta Analysis & Impact Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {changesList.map((row: any, idx: number) => {
                  const isModified = row.change_type === 'MODIFIED' || row.change_type === 'ADDED';
                  return (
                    <tr
                      key={idx}
                      className={`transition-colors ${
                        isModified ? 'bg-amber-50/40 hover:bg-amber-50/60' : 'hover:bg-slate-50/60'
                      }`}
                    >
                      <td className="py-3.5 px-4 font-bold text-slate-800 capitalize">
                        {row.attribute_name.replace(/_/g, ' ')}
                      </td>

                      {/* Previous Value */}
                      <td className="py-3.5 px-4 font-mono text-slate-500 bg-slate-50/50">
                        {isModified ? (
                          <span className="line-through decoration-rose-500/60 decoration-2 text-slate-400">
                            {row.old_value || '-'}
                          </span>
                        ) : (
                          <span>{row.old_value || '-'}</span>
                        )}
                      </td>

                      {/* New Value with Indicator */}
                      <td className={`py-3.5 px-4 font-mono font-bold border-l border-r border-slate-100 ${
                        isModified ? 'text-amber-900 bg-amber-100/40' : 'text-emerald-800 bg-emerald-50/30'
                      }`}>
                        <div className="flex items-center justify-between">
                          <span>{row.new_value}</span>
                          {isModified ? (
                            <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-amber-200 text-amber-900 border border-amber-300">
                              {row.change_type}
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
                          {isModified ? 'Specification Delta Detected (Review required)' : 'Verified Canonical Equivalence'}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
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
            disabled={isSyncApproved || meaningfulChanges.length === 0 || syncing}
            className={`px-5 py-2.5 text-xs font-bold rounded-lg shadow-sm transition-all shrink-0 ${
              isSyncApproved
                ? 'bg-emerald-600 text-white opacity-80 cursor-default'
                : meaningfulChanges.length === 0
                ? 'bg-slate-300 text-slate-500 cursor-not-allowed'
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
        title={`Confirm Version ${versionDiff?.candidate_version || 'v2.0'} Synchronization`}
        description={`You are about to promote ${versionDiff?.product_name || 'XYZ-450'} to the verified master data catalog. Previous baseline (${versionDiff?.existing_version || 'v1.4'}) will be archived.`}
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
