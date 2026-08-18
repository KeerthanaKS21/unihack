'use client';

import React, { useState } from 'react';
import { useApp } from '@/context/AppContext';
import { PageHeader } from '@/components/layout/PageHeader';
import { StatusBadge } from '@/components/common/StatusBadge';
import { ConfidenceBadge } from '@/components/common/ConfidenceBadge';
import {
  ShieldCheck,
  ShieldAlert,
  AlertTriangle,
  Upload,
  Sparkles,
  FileText,
  CheckCircle2,
  Calendar,
  Layers,
  ArrowRight,
  ExternalLink,
  RotateCcw,
  X
} from 'lucide-react';

export default function CompliancePage() {
  const {
    complianceRecords,
    openComplianceCount,
    resolveComplianceIssue,
    uploadCertificateAndMatch
  } = useApp();

  const [selectedRecordId, setSelectedRecordId] = useState<string | null>(null);
  const [uploadModalOpen, setUploadModalOpen] = useState<boolean>(false);
  const [certFileName, setCertFileName] = useState<string>('ce_declaration_xyz450.pdf');
  const [certStandard, setCertStandard] = useState<string>('IEC 60034-1 / EN 60204-1');

  const selectedRecord = complianceRecords.find(r => r.id === selectedRecordId);

  const handleUploadSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    uploadCertificateAndMatch(certFileName, certStandard);
    setUploadModalOpen(false);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Compliance Auditing & Certificate Vault"
        subtitle="Automated regulatory audit scanner verifying international safety declarations, hazardous area ATEX certificates, and environmental RoHS standards."
        breadcrumbs={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Compliance Auditing' }
        ]}
        badge={`${openComplianceCount} Action Items`}
        badgeVariant={openComplianceCount > 0 ? 'warning' : 'success'}
        action={
          <button
            onClick={() => setUploadModalOpen(true)}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg shadow-xs transition-colors inline-flex items-center gap-1.5"
          >
            <Upload className="w-4 h-4" />
            <span>Upload Certificate</span>
          </button>
        }
      />

      {/* Compliance Overview KPI Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs flex items-center gap-4">
          <div className="p-3 bg-emerald-100 text-emerald-700 rounded-xl">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs font-bold uppercase text-slate-500 block">
              Certified Compliant SKUs
            </span>
            <span className="text-2xl font-extrabold text-slate-900 font-mono">
              9,937 / 10,000
            </span>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs flex items-center gap-4">
          <div className="p-3 bg-rose-100 text-rose-700 rounded-xl">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs font-bold uppercase text-slate-500 block">
              Expired / Missing Docs
            </span>
            <span className="text-2xl font-extrabold text-rose-600 font-mono">
              {openComplianceCount}
            </span>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs flex items-center gap-4">
          <div className="p-3 bg-blue-100 text-blue-700 rounded-xl">
            <Sparkles className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs font-bold uppercase text-slate-500 block">
              AI Auto-Match Confidence
            </span>
            <span className="text-2xl font-extrabold text-blue-700 font-mono">
              98.2%
            </span>
          </div>
        </div>
      </div>

      {/* Compliance Audit Table */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-slate-900 tracking-tight">
              Compliance Audit & Standard Ledger
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Click any row to open the AI recommendation and human action drawer.
            </p>
          </div>
          <span className="text-xs font-mono text-slate-400">
            {complianceRecords.length} Audited Records
          </span>
        </div>

        <div className="border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Product Model</th>
                <th className="py-3 px-4">Standard / Directive</th>
                <th className="py-3 px-4">Issue Description</th>
                <th className="py-3 px-4">Certificate ID</th>
                <th className="py-3 px-4">Expiry Date</th>
                <th className="py-3 px-4">Compliance Status</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {complianceRecords.map(rec => {
                const isResolved = rec.status === 'Compliant';

                return (
                  <tr
                    key={rec.id}
                    onClick={() => setSelectedRecordId(rec.id)}
                    className="hover:bg-slate-50/80 cursor-pointer transition-colors"
                  >
                    <td className="py-3.5 px-4 font-mono font-bold text-blue-700">
                      {rec.productModel}
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-slate-900">
                      {rec.standard}
                    </td>
                    <td className="py-3.5 px-4 text-slate-600 max-w-xs truncate">
                      {rec.issueDescription}
                    </td>
                    <td className="py-3.5 px-4 font-mono text-slate-500">
                      {rec.certificateNumber}
                    </td>
                    <td className="py-3.5 px-4 font-mono">
                      <span className={rec.issueType === 'Expired' ? 'text-rose-600 font-bold' : 'text-slate-600'}>
                        {rec.expiryDate}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <StatusBadge status={rec.status} size="sm" />
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={e => {
                          e.stopPropagation();
                          setSelectedRecordId(rec.id);
                        }}
                        className="px-2.5 py-1 text-xs font-semibold text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded transition-colors"
                      >
                        Inspect Audit →
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Selected Compliance Issue Detail Modal / Drawer (Requirement #14) */}
      {selectedRecord && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 space-y-5 animate-in zoom-in-95 duration-200">
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-blue-100 text-blue-800">
                    {selectedRecord.productModel}
                  </span>
                  <StatusBadge status={selectedRecord.status} size="sm" />
                  <ConfidenceBadge score={selectedRecord.aiConfidence} />
                </div>
                <h3 className="text-base font-bold text-slate-900 mt-1">
                  Compliance Audit: {selectedRecord.standard}
                </h3>
              </div>
              <button
                onClick={() => setSelectedRecordId(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Issue Explanation */}
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1 text-xs">
              <span className="font-bold text-slate-700 uppercase tracking-wider text-[11px] block">
                Flagged Non-Compliance Summary:
              </span>
              <p className="text-slate-600 leading-relaxed font-mono">
                {selectedRecord.issueDescription}
              </p>
              <div className="pt-2 flex items-center justify-between text-slate-500 text-[11px]">
                <span>Cert Reference: {selectedRecord.certificateNumber}</span>
                <span>Expiry: {selectedRecord.expiryDate}</span>
              </div>
            </div>

            {/* AI Recommendation */}
            <div className="p-4 rounded-xl bg-blue-50 border border-blue-200 space-y-2">
              <div className="flex items-center gap-2 text-blue-900 font-bold text-xs">
                <Sparkles className="w-4 h-4 text-blue-600" />
                <span>AI Automated Remediation Recommendation</span>
              </div>
              <p className="text-xs text-blue-950 font-medium leading-relaxed">
                {selectedRecord.aiRecommendation}
              </p>
            </div>

            {/* Human Decision Area */}
            <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-3">
              <button
                onClick={() => setSelectedRecordId(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
              >
                Close
              </button>

              {selectedRecord.status !== 'Compliant' && (
                <button
                  onClick={() => {
                    resolveComplianceIssue(selectedRecord.id, 'link_cert');
                    setSelectedRecordId(null);
                  }}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg shadow-xs transition-colors inline-flex items-center gap-1.5"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Approve AI Remediation & Update Status</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Certificate Upload & Auto-Match Modal (Requirement #14) */}
      {uploadModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-5 animate-in zoom-in-95 duration-200">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Upload Compliance Certificate
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  AI will parse certificate number, standard, expiry date, and match product model.
                </p>
              </div>
              <button
                onClick={() => setUploadModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUploadSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Certificate Document File
                </label>
                <input
                  type="text"
                  value={certFileName}
                  onChange={e => setCertFileName(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg bg-slate-50 focus:bg-white font-mono"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Standard / Regulation Directive
                </label>
                <input
                  type="text"
                  value={certStandard}
                  onChange={e => setCertStandard(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg bg-slate-50 focus:bg-white font-mono"
                />
              </div>

              {/* Simulated Auto-match Preview Banner */}
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl space-y-1">
                <span className="text-[11px] font-bold text-emerald-800 uppercase tracking-wider block">
                  ✨ Pre-Scan Prediction:
                </span>
                <p className="text-emerald-950 font-medium">
                  Likely product match: <strong>XYZ-450 Industrial Motor</strong> (98% confidence match)
                </p>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setUploadModalOpen(false)}
                  className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg shadow-xs transition-colors"
                >
                  Confirm Ingestion & Link →
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
