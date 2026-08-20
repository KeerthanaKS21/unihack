'use client';

import React, { useState, useEffect } from 'react';
import { useApp } from '@/context/AppContext';
import { PageHeader } from '@/components/layout/PageHeader';
import { api } from '@/lib/api';
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
  X,
  Search,
  Filter,
  RefreshCw,
  Loader2,
  Clock,
  Edit3,
  Check,
  Building2,
  AlertCircle,
  FileCheck,
  HelpCircle,
  FolderPlus
} from 'lucide-react';

export default function CompliancePage() {
  const { showToast } = useApp();

  // State management
  const [activeFilter, setActiveFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  const [summary, setSummary] = useState<{
    total_products: number;
    compliant: number;
    needs_review: number;
    missing_certificates: number;
    expired_certificates: number;
    conflicts: number;
    invalid_certificates: number;
  }>({
    total_products: 0,
    compliant: 0,
    needs_review: 0,
    missing_certificates: 0,
    expired_certificates: 0,
    conflicts: 0,
    invalid_certificates: 0
  });

  const [productsList, setProductsList] = useState<any[]>([]);
  const [selectedProductId, setSelectedProductId] = useState<number | null>(null);
  const [productDetail, setProductDetail] = useState<any | null>(null);
  const [detailLoading, setDetailLoading] = useState<boolean>(false);

  // Modals state
  const [uploadModalOpen, setUploadModalOpen] = useState<boolean>(false);
  const [uploadFileName, setUploadFileName] = useState<string>('IEC_Safety_Certificate_2026_XYZ450.pdf');
  const [matchResult, setMatchResult] = useState<any | null>(null);
  const [matchingInProgress, setMatchingInProgress] = useState<boolean>(false);

  const [expiredModalOpen, setExpiredModalOpen] = useState<boolean>(false);
  const [selectedCertForReplacement, setSelectedCertForReplacement] = useState<any | null>(null);

  const [conflictModalOpen, setConflictModalOpen] = useState<boolean>(false);
  const [selectedCertForConflict, setSelectedCertForConflict] = useState<any | null>(null);

  const [manualModalOpen, setManualModalOpen] = useState<boolean>(false);
  const [manualCertNumber, setManualCertNumber] = useState<string>('');
  const [manualCertType, setManualCertType] = useState<string>('');
  const [manualStandard, setManualStandard] = useState<string>('');
  const [manualBody, setManualBody] = useState<string>('');
  const [manualSpecValue, setManualSpecValue] = useState<string>('');
  const [manualTempRange, setManualTempRange] = useState<string>('');
  const [manualSafety, setManualSafety] = useState<string>('');
  const [manualAtex, setManualAtex] = useState<string>('');
  const [manualRohs, setManualRohs] = useState<string>('');
  const [manualIssueDate, setManualIssueDate] = useState<string>('');
  const [manualExpiryDate, setManualExpiryDate] = useState<string>('');
  const [manualScope, setManualScope] = useState<string>('');
  const [manualNotes, setManualNotes] = useState<string>('');

  const [submittingAction, setSubmittingAction] = useState<boolean>(false);

  // Load compliance summary & products list
  const loadComplianceData = async () => {
    setLoading(true);
    try {
      const [sumRes, prodRes] = await Promise.all([
        api.getComplianceSummary().catch(() => null),
        api.getComplianceProducts({ status: activeFilter, search: searchTerm }).catch(() => [])
      ]);

      if (sumRes) {
        setSummary(sumRes);
      }
      setProductsList(prodRes || []);
    } catch (err) {
      console.warn('Failed to load compliance data from backend:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadComplianceData();
  }, [activeFilter, searchTerm]);

  // Load specific product detail
  const inspectProduct = async (productId: number) => {
    setSelectedProductId(productId);
    setDetailLoading(true);
    try {
      const detail = await api.getComplianceProductDetail(productId);
      setProductDetail(detail);
    } catch (err) {
      showToast({
        type: 'error',
        title: 'Inspection Failed',
        message: 'Could not load compliance details for this product.'
      });
    } finally {
      setDetailLoading(false);
    }
  };

  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  // Upload & match certificate handler
  const handleRunUploadMatch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile && !uploadFileName.trim()) return;

    setMatchingInProgress(true);
    try {
      let result;
      if (selectedFile) {
        result = await api.uploadComplianceFile(selectedFile, selectedProductId || undefined);
      } else {
        result = await api.uploadAndMatchCertificate(uploadFileName.trim(), selectedProductId || undefined);
      }
      setMatchResult(result);
      showToast({
        type: 'success',
        title: 'Extraction & Matching Complete',
        message: `Successfully extracted data from ${selectedFile ? selectedFile.name : uploadFileName}`
      });
    } catch (err) {
      showToast({
        type: 'error',
        title: 'Extraction Failed',
        message: 'Failed to parse document and extract compliance data.'
      });
    } finally {
      setMatchingInProgress(false);
    }
  };

  // Execute compliance action (Approve replacement, Manual entry, Conflict resolution)
  const executeResolutionAction = async (payload: {
    certificate_id?: number;
    product_id?: number;
    action_type: string;
    value?: string;
    cert_type?: string;
    standard?: string;
    certification_body?: string;
    issue_date?: string;
    expiry_date?: string;
    scope?: string;
    spec_value?: string;
    temp_range?: string;
    atex_rating?: string;
    rohs_status?: string;
    safety_standard?: string;
    notes?: string;
    replacement_document_id?: number;
  }) => {
    setSubmittingAction(true);
    try {
      const res = await api.resolveComplianceAction(payload);
      showToast({
        type: 'success',
        title: 'Compliance Action Committed',
        message: res.message || 'Product compliance status successfully updated.'
      });

      // Close all modals
      setUploadModalOpen(false);
      setMatchResult(null);
      setExpiredModalOpen(false);
      setConflictModalOpen(false);
      setManualModalOpen(false);

      // Refresh overview data and detail if open
      await loadComplianceData();
      if (selectedProductId) {
        await inspectProduct(selectedProductId);
      }
    } catch (err: any) {
      showToast({
        type: 'error',
        title: 'Action Failed',
        message: err.message || 'Failed to update compliance record.'
      });
    } finally {
      setSubmittingAction(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Compliance Auditing & Regulatory Vault"
        subtitle="Automated regulatory audit scanner verifying international safety declarations, hazardous area ATEX certificates, and environmental RoHS standards."
        breadcrumbs={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Compliance Auditing' }
        ]}
        badge={`${summary.needs_review + summary.expired_certificates + summary.missing_certificates} Action Required`}
        badgeVariant={summary.needs_review > 0 || summary.expired_certificates > 0 ? 'warning' : 'success'}
        action={
          <button
            onClick={() => {
              setMatchResult(null);
              setUploadModalOpen(true);
            }}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg shadow-2xs transition-colors inline-flex items-center gap-1.5"
          >
            <Upload className="w-4 h-4" />
            <span>Upload Certificate</span>
          </button>
        }
      />

      {/* Overview KPI Cards Grid (Clickable Filters) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
        <button
          onClick={() => setActiveFilter('all')}
          className={`p-4 rounded-2xl border transition-all text-left shadow-2xs ${
            activeFilter === 'all'
              ? 'bg-slate-900 text-white border-slate-900 ring-2 ring-slate-900/20'
              : 'bg-white text-slate-800 border-slate-200 hover:border-slate-300'
          }`}
        >
          <span className="text-[10px] font-bold uppercase tracking-wider block opacity-75">
            Total Products
          </span>
          <span className="text-xl font-extrabold font-mono mt-1 block">
            {summary.total_products.toLocaleString()}
          </span>
          <span className="text-[10px] opacity-80 mt-1 block">Catalog Monitored</span>
        </button>

        <button
          onClick={() => setActiveFilter('compliant')}
          className={`p-4 rounded-2xl border transition-all text-left shadow-2xs ${
            activeFilter === 'compliant'
              ? 'bg-emerald-600 text-white border-emerald-600 ring-2 ring-emerald-600/20'
              : 'bg-white text-slate-800 border-slate-200 hover:border-emerald-300'
          }`}
        >
          <span className="text-[10px] font-bold uppercase tracking-wider block text-emerald-600 opacity-90">
            Compliant
          </span>
          <span className="text-xl font-extrabold font-mono text-emerald-700 mt-1 block">
            {summary.compliant.toLocaleString()}
          </span>
          <span className="text-[10px] text-emerald-600 mt-1 block">Verified Safe</span>
        </button>

        <button
          onClick={() => setActiveFilter('needs_review')}
          className={`p-4 rounded-2xl border transition-all text-left shadow-2xs ${
            activeFilter === 'needs_review'
              ? 'bg-amber-500 text-white border-amber-500 ring-2 ring-amber-500/20'
              : 'bg-white text-slate-800 border-slate-200 hover:border-amber-300'
          }`}
        >
          <span className="text-[10px] font-bold uppercase tracking-wider block text-amber-600 opacity-90">
            Needs Review
          </span>
          <span className="text-xl font-extrabold font-mono text-amber-600 mt-1 block">
            {summary.needs_review.toLocaleString()}
          </span>
          <span className="text-[10px] text-amber-600 mt-1 block">Pending Verification</span>
        </button>

        <button
          onClick={() => setActiveFilter('non_compliant')}
          className={`p-4 rounded-2xl border transition-all text-left shadow-2xs ${
            activeFilter === 'non_compliant'
              ? 'bg-rose-600 text-white border-rose-600 ring-2 ring-rose-600/20'
              : 'bg-white text-slate-800 border-slate-200 hover:border-rose-300'
          }`}
        >
          <span className="text-[10px] font-bold uppercase tracking-wider block text-rose-600 opacity-90">
            Missing Certs
          </span>
          <span className="text-xl font-extrabold font-mono text-rose-600 mt-1 block">
            {summary.missing_certificates.toLocaleString()}
          </span>
          <span className="text-[10px] text-rose-600 mt-1 block">Uncertified SKUs</span>
        </button>

        <button
          onClick={() => setActiveFilter('expired')}
          className={`p-4 rounded-2xl border transition-all text-left shadow-2xs ${
            activeFilter === 'expired'
              ? 'bg-rose-700 text-white border-rose-700 ring-2 ring-rose-700/20'
              : 'bg-white text-slate-800 border-slate-200 hover:border-rose-300'
          }`}
        >
          <span className="text-[10px] font-bold uppercase tracking-wider block text-rose-700 opacity-90">
            Expired Certs
          </span>
          <span className="text-xl font-extrabold font-mono text-rose-700 mt-1 block">
            {summary.expired_certificates.toLocaleString()}
          </span>
          <span className="text-[10px] text-rose-700 mt-1 block">Action Required</span>
        </button>

        <button
          onClick={() => setActiveFilter('conflicts')}
          className={`p-4 rounded-2xl border transition-all text-left shadow-2xs ${
            activeFilter === 'conflicts'
              ? 'bg-purple-600 text-white border-purple-600 ring-2 ring-purple-600/20'
              : 'bg-white text-slate-800 border-slate-200 hover:border-purple-300'
          }`}
        >
          <span className="text-[10px] font-bold uppercase tracking-wider block text-purple-600 opacity-90">
            Conflicts
          </span>
          <span className="text-xl font-extrabold font-mono text-purple-600 mt-1 block">
            {summary.conflicts.toLocaleString()}
          </span>
          <span className="text-[10px] text-purple-600 mt-1 block">Spec Discrepancy</span>
        </button>

        <button
          onClick={() => setActiveFilter('invalid')}
          className={`p-4 rounded-2xl border transition-all text-left shadow-2xs ${
            activeFilter === 'invalid'
              ? 'bg-slate-700 text-white border-slate-700 ring-2 ring-slate-700/20'
              : 'bg-white text-slate-800 border-slate-200 hover:border-slate-300'
          }`}
        >
          <span className="text-[10px] font-bold uppercase tracking-wider block text-slate-500 opacity-90">
            Invalid Certs
          </span>
          <span className="text-xl font-extrabold font-mono text-slate-700 mt-1 block">
            {summary.invalid_certificates.toLocaleString()}
          </span>
          <span className="text-[10px] text-slate-500 mt-1 block">Incomplete Records</span>
        </button>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search product model, name, manufacturer..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="pl-9 pr-4 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:bg-white focus:ring-1 focus:ring-blue-500 w-64 sm:w-80 font-medium"
            />
          </div>
          <span className="text-xs font-semibold text-slate-500">
            Showing <strong className="text-slate-800">{productsList.length}</strong> Products
          </span>
        </div>

        <button
          onClick={loadComplianceData}
          disabled={loading}
          className="px-3.5 py-2 bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 text-xs font-bold rounded-xl transition-colors inline-flex items-center gap-1.5"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-blue-600' : 'text-slate-500'}`} />
          <span>Refresh Compliance Audit</span>
        </button>
      </div>

      {/* Product Compliance List Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
        {loading ? (
          <div className="p-16 text-center space-y-3">
            <Loader2 className="w-8 h-8 animate-spin mx-auto text-blue-600" />
            <p className="text-xs font-semibold text-slate-600">Auditing product compliance certificates...</p>
          </div>
        ) : productsList.length === 0 ? (
          <div className="p-16 text-center space-y-4 max-w-md mx-auto">
            <div className="w-12 h-12 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center mx-auto text-blue-600">
              <FolderPlus className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <h4 className="text-sm font-bold text-slate-900">No Product or Compliance Data Available</h4>
              <p className="text-xs text-slate-500 leading-relaxed">
                Upload product documentation or certificates in Upload & Ingest to begin compliance auditing.
              </p>
            </div>
            <a
              href="/upload"
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-2xs transition-colors"
            >
              <Upload className="w-3.5 h-3.5" />
              <span>Go to Upload & Ingest</span>
            </a>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  <th className="py-3.5 px-4">Product / Model</th>
                  <th className="py-3.5 px-4">Compliance Status</th>
                  <th className="py-3.5 px-4">Missing Requirements</th>
                  <th className="py-3.5 px-4">Certificates</th>
                  <th className="py-3.5 px-4">Earliest Expiry</th>
                  <th className="py-3.5 px-4">Last Verified</th>
                  <th className="py-3.5 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {productsList.map(item => {
                  const isCompliant = item.compliance_status === 'Compliant';
                  const isReview = item.compliance_status === 'Needs Review';
                  const isExpired = item.compliance_status === 'Expired';

                  return (
                    <tr key={item.product_id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2.5">
                          <span className="font-mono font-bold text-blue-900 bg-blue-50 px-2 py-0.5 rounded border border-blue-100">
                            {item.product_model}
                          </span>
                          <div>
                            <span className="font-bold text-slate-900 block">{item.product_name}</span>
                            <span className="text-[10px] text-slate-500">{item.manufacturer}</span>
                          </div>
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold border ${
                            isCompliant
                              ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                              : isReview
                              ? 'bg-amber-50 text-amber-900 border-amber-200'
                              : isExpired
                              ? 'bg-rose-100 text-rose-900 border-rose-300 font-extrabold'
                              : 'bg-rose-50 text-rose-800 border-rose-200'
                          }`}
                        >
                          {isCompliant && <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />}
                          {isReview && <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />}
                          {isExpired && <Clock className="w-3.5 h-3.5 text-rose-700" />}
                          {!isCompliant && !isReview && !isExpired && <ShieldAlert className="w-3.5 h-3.5 text-rose-600" />}
                          <span>{item.compliance_status}</span>
                        </span>
                      </td>

                      <td className="py-3.5 px-4">
                        {item.missing_requirements.length > 0 ? (
                          <div className="flex flex-wrap gap-1">
                            {item.missing_requirements.map((req: string, idx: number) => (
                              <span key={idx} className="text-[10px] bg-rose-50 text-rose-700 px-2 py-0.5 rounded border border-rose-100">
                                ❌ {req}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <span className="text-[11px] text-emerald-700 font-semibold">✓ All Requirements Met</span>
                        )}
                      </td>

                      <td className="py-3.5 px-4 font-mono text-slate-700 font-semibold">
                        {item.certificate_status}
                      </td>

                      <td className="py-3.5 px-4 font-mono">
                        <span className={isExpired ? 'text-rose-700 font-bold' : 'text-slate-600'}>
                          {item.expiry_date}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 text-slate-500 font-mono text-[11px]">
                        {item.last_verified}
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        <button
                          onClick={() => inspectProduct(item.product_id)}
                          className="px-3 py-1.5 bg-white hover:bg-slate-100 text-blue-600 border border-blue-200 font-bold text-xs rounded-lg transition-colors inline-flex items-center gap-1 shadow-2xs"
                        >
                          <span>Inspect & Audit</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* PRODUCT COMPLIANCE DETAIL DRAWER / MODAL */}
      {selectedProductId && (
        <div className="fixed inset-0 z-50 flex justify-end bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="w-full max-w-2xl bg-white h-full shadow-2xl overflow-y-auto border-l border-slate-200 p-6 space-y-6 flex flex-col justify-between">
            {detailLoading || !productDetail ? (
              <div className="p-16 text-center my-auto space-y-3">
                <Loader2 className="w-8 h-8 animate-spin mx-auto text-blue-600" />
                <p className="text-xs font-semibold text-slate-600">Loading product compliance dossier...</p>
              </div>
            ) : (
              <>
                <div className="space-y-6">
                  {/* Drawer Header */}
                  <div className="flex items-center justify-between pb-4 border-b border-slate-200">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono font-bold px-2 py-0.5 bg-blue-100 text-blue-900 rounded">
                          {productDetail.product_model}
                        </span>
                        <span className="text-xs font-semibold text-slate-500">
                          {productDetail.manufacturer}
                        </span>
                      </div>
                      <h3 className="text-lg font-bold text-slate-900 mt-1">
                        {productDetail.product_name}
                      </h3>
                    </div>

                    <button
                      onClick={() => {
                        setSelectedProductId(null);
                        setProductDetail(null);
                      }}
                      className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>

                  {/* AI Recommendation Panel (Problem, Evidence, Recommended Action, Confidence) */}
                  <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50/60 rounded-2xl border border-blue-200 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-blue-900 font-bold text-xs">
                        <Sparkles className="w-4 h-4 text-blue-600" />
                        <span>AI Compliance Diagnostic & Recommendation</span>
                      </div>
                      <span className="text-[10px] font-mono font-bold bg-blue-100 text-blue-800 px-2 py-0.5 rounded">
                        Confidence: {Math.round(productDetail.ai_recommendation_panel.confidence * 100)}%
                      </span>
                    </div>

                    <div className="space-y-2 text-xs text-slate-700">
                      <div>
                        <strong className="text-slate-900 block text-[11px] uppercase tracking-wider">Problem Identified:</strong>
                        <p className="mt-0.5 leading-relaxed font-semibold text-rose-900">
                          {productDetail.ai_recommendation_panel.problem}
                        </p>
                      </div>

                      <div>
                        <strong className="text-slate-900 block text-[11px] uppercase tracking-wider">Audit Evidence:</strong>
                        <p className="mt-0.5 leading-relaxed text-slate-600 font-mono text-[11px]">
                          {productDetail.ai_recommendation_panel.evidence}
                        </p>
                      </div>

                      <div>
                        <strong className="text-slate-900 block text-[11px] uppercase tracking-wider">Recommended Human Action:</strong>
                        <p className="mt-0.5 leading-relaxed font-bold text-blue-900 bg-white p-2.5 rounded-xl border border-blue-200">
                          {productDetail.ai_recommendation_panel.recommendation}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Required Compliance Items Checklist */}
                  <div className="space-y-3">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                      Mandatory Regulatory Requirements Checklist
                    </h4>

                    <div className="space-y-2.5">
                      {productDetail.required_items.map((item: any, idx: number) => {
                        const isVerified = item.evidence_status === 'VERIFIED';
                        const isEvidenceMissing = item.evidence_status === 'EVIDENCE_MISSING';
                        const isConflict = item.evidence_status === 'CONFLICT';
                        const isNotApplicable = item.evidence_status === 'NOT_APPLICABLE';

                        return (
                          <div
                            key={idx}
                            className={`p-3.5 rounded-xl border space-y-2 text-xs transition-all ${
                              isVerified
                                ? 'bg-emerald-50/70 border-emerald-200 text-emerald-950'
                                : isEvidenceMissing
                                ? 'bg-amber-50/70 border-amber-200 text-amber-950'
                                : isConflict
                                ? 'bg-purple-50/70 border-purple-200 text-purple-950'
                                : isNotApplicable
                                ? 'bg-slate-50 border-slate-200 text-slate-600'
                                : 'bg-rose-50/70 border-rose-200 text-rose-950'
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                {isVerified && <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />}
                                {isEvidenceMissing && <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />}
                                {isConflict && <AlertCircle className="w-4 h-4 text-purple-600 shrink-0" />}
                                {isNotApplicable && <Check className="w-4 h-4 text-slate-400 shrink-0" />}
                                {!isVerified && !isEvidenceMissing && !isConflict && !isNotApplicable && (
                                  <ShieldAlert className="w-4 h-4 text-rose-600 shrink-0" />
                                )}
                                <span className="font-bold text-slate-900">{item.name}</span>
                              </div>

                              <span
                                className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${
                                  isVerified
                                    ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                                    : isEvidenceMissing
                                    ? 'bg-amber-100 text-amber-900 border-amber-300'
                                    : isConflict
                                    ? 'bg-purple-100 text-purple-900 border-purple-300'
                                    : isNotApplicable
                                    ? 'bg-slate-100 text-slate-600 border-slate-300'
                                    : 'bg-rose-100 text-rose-900 border-rose-300'
                                }`}
                              >
                                {item.status_label || (isVerified ? '✅ Verified' : isEvidenceMissing ? '⚠ Evidence Missing' : '❌ Missing')}
                              </span>
                            </div>

                            <div className="grid grid-cols-2 gap-2 text-[11px] font-mono bg-white p-2.5 rounded-lg border border-slate-200/80">
                              <div>
                                <span className="text-slate-500 block text-[10px] uppercase">Specified Value:</span>
                                <strong className="text-slate-900">{item.specification_value || item.value || 'N/A'}</strong>
                              </div>
                              <div>
                                <span className="text-slate-500 block text-[10px] uppercase">Specification Status:</span>
                                <strong className={item.specification_found ? 'text-emerald-700' : 'text-rose-700'}>
                                  {item.specification_found ? '✅ Found' : '❌ Missing'}
                                </strong>
                              </div>
                              <div>
                                <span className="text-slate-500 block text-[10px] uppercase">Compliance Evidence:</span>
                                <strong className={isVerified ? 'text-emerald-700' : isEvidenceMissing ? 'text-amber-700 font-bold' : 'text-slate-700'}>
                                  {isVerified ? '✅ Verified' : isEvidenceMissing ? '⚠ Missing' : isNotApplicable ? 'N/A' : 'Unverified'}
                                </strong>
                              </div>
                              <div>
                                <span className="text-slate-500 block text-[10px] uppercase">Source Document:</span>
                                <span className="text-slate-800">{item.source_document || 'Product Datasheet'}</span>
                              </div>
                            </div>

                            {item.action_required && !isVerified && (
                              <div className="flex items-center justify-between pt-1">
                                <span className="text-[11px] text-amber-900 font-medium">{item.action_required}</span>
                                <button
                                  onClick={() => setUploadModalOpen(true)}
                                  className="px-2.5 py-1 bg-blue-600 hover:bg-blue-700 text-white font-bold text-[11px] rounded-lg transition-colors inline-flex items-center gap-1 shadow-2xs"
                                >
                                  <Upload className="w-3 h-3" />
                                  <span>Upload Certificate</span>
                                </button>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Available Certificates List */}
                  <div className="space-y-3">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                      Registered Certificates & Vault Documents ({productDetail.certificates.length})
                    </h4>

                    {productDetail.certificates.length === 0 ? (
                      <div className="p-6 text-center bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-500">
                        No verified certificate documents attached to this product record.
                      </div>
                    ) : (
                      productDetail.certificates.map((cert: any) => {
                        const isCertExpired = cert.status === 'EXPIRED';
                        const hasConflict = Boolean(cert.conflict_details);

                        return (
                          <div
                            key={cert.id}
                            className={`p-4 rounded-xl border space-y-3 ${
                              isCertExpired
                                ? 'bg-rose-50/50 border-rose-300'
                                : hasConflict
                                ? 'bg-amber-50/50 border-amber-300'
                                : 'bg-slate-50 border-slate-200'
                            }`}
                          >
                            <div className="flex items-start justify-between">
                              <div>
                                <span className="text-[10px] font-bold font-mono uppercase text-slate-500 block">
                                  {cert.certificate_type} • {cert.certification_body}
                                </span>
                                <h5 className="text-xs font-bold text-slate-900 font-mono mt-0.5">
                                  {cert.certificate_number} ({cert.standard})
                                </h5>
                              </div>

                              <span
                                className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                  isCertExpired
                                    ? 'bg-rose-200 text-rose-900 border border-rose-300'
                                    : hasConflict
                                    ? 'bg-amber-200 text-amber-900 border border-amber-300'
                                    : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                                }`}
                              >
                                {cert.status}
                              </span>
                            </div>

                            <div className="grid grid-cols-2 gap-2 text-[11px] font-mono text-slate-600 bg-white p-2.5 rounded-lg border border-slate-200">
                              <div>Issue Date: <strong className="text-slate-900">{cert.issue_date}</strong></div>
                              <div>Expiry Date: <strong className={isCertExpired ? 'text-rose-700 font-bold' : 'text-slate-900'}>{cert.expiry_date}</strong></div>
                            </div>

                            {/* Expired Replacement Candidate Box */}
                            {isCertExpired && cert.replacement_candidate && (
                              <div className="p-3 bg-amber-100/60 rounded-lg border border-amber-200 text-xs space-y-2">
                                <span className="font-bold text-amber-950 block text-[11px]">
                                  ✨ Found Replacement Document in Vault:
                                </span>
                                <div className="flex items-center justify-between font-mono text-[11px] text-amber-900">
                                  <span>{cert.replacement_candidate.filename}</span>
                                  <button
                                    onClick={() => {
                                      setSelectedCertForReplacement(cert);
                                      setExpiredModalOpen(true);
                                    }}
                                    className="px-2.5 py-1 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded text-[10px]"
                                  >
                                    Review & Approve Replacement
                                  </button>
                                </div>
                              </div>
                            )}

                            {/* Conflict Resolution Box */}
                            {hasConflict && (
                              <div className="p-3 bg-purple-100/60 rounded-lg border border-purple-200 text-xs space-y-2">
                                <span className="font-bold text-purple-950 block text-[11px]">
                                  ⚠️ Compliance Parameter Discrepancy:
                                </span>
                                <p className="text-[11px] text-purple-900 font-mono">
                                  Database lists <strong>{cert.conflict_details.db_value}</strong> while Certificate lists <strong>{cert.conflict_details.certificate_value}</strong>.
                                </p>
                                <button
                                  onClick={() => {
                                    setSelectedCertForConflict(cert);
                                    setConflictModalOpen(true);
                                  }}
                                  className="px-2.5 py-1 bg-purple-700 hover:bg-purple-800 text-white font-bold rounded text-[10px]"
                                >
                                  Resolve Conflict
                                </button>
                              </div>
                            )}
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>

                {/* Bottom Action Footer */}
                <div className="pt-4 border-t border-slate-200 flex items-center justify-between gap-2">
                  <button
                    onClick={() => {
                      setMatchResult(null);
                      setUploadModalOpen(true);
                    }}
                    className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-2xs transition-colors inline-flex items-center gap-1.5"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    <span>Upload Document</span>
                  </button>

                  <button
                    onClick={() => setManualModalOpen(true)}
                    className="px-3.5 py-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 text-xs font-bold rounded-xl shadow-2xs transition-colors inline-flex items-center gap-1.5"
                  >
                    <Edit3 className="w-3.5 h-3.5 text-slate-500" />
                    <span>Enter Details Manually</span>
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* UPLOAD & MATCH CERTIFICATE MODAL */}
      {uploadModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 border border-slate-200 shadow-2xl space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Upload className="w-4 h-4 text-blue-600" />
                <span>Upload & Extract Compliance Document</span>
              </h3>
              <button onClick={() => { setUploadModalOpen(false); setSelectedFile(null); setMatchResult(null); }} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleRunUploadMatch} className="space-y-4 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  Upload Compliance File (PDF, CSV, Excel, Image):
                </label>
                <div className="border-2 border-dashed border-slate-300 hover:border-blue-500 bg-slate-50 hover:bg-blue-50/40 rounded-2xl p-5 text-center transition-all cursor-pointer relative">
                  <input
                    type="file"
                    accept=".pdf,.csv,.xlsx,.xls,.png,.jpg,.jpeg,.txt,.doc,.docx"
                    onChange={e => {
                      if (e.target.files && e.target.files[0]) {
                        setSelectedFile(e.target.files[0]);
                        setUploadFileName(e.target.files[0].name);
                      }
                    }}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  />
                  <div className="space-y-2 pointer-events-none">
                    <FileText className="w-8 h-8 text-blue-600 mx-auto" />
                    {selectedFile ? (
                      <div className="space-y-0.5">
                        <p className="font-bold text-blue-900 text-xs">{selectedFile.name}</p>
                        <p className="text-[11px] text-slate-500 font-mono">{(selectedFile.size / 1024).toFixed(1)} KB • Click to change file</p>
                      </div>
                    ) : (
                      <div>
                        <p className="font-bold text-slate-800 text-xs">Drag & drop your document here, or <span className="text-blue-600 underline">browse</span></p>
                        <p className="text-[10px] text-slate-400 mt-0.5">Supports PDF certificates, test reports, CSV, Excel & Images</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <button
                type="submit"
                disabled={matchingInProgress || (!selectedFile && !uploadFileName.trim())}
                className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-xs font-bold rounded-xl transition-colors flex items-center justify-center gap-2"
              >
                {matchingInProgress ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                <span>Extract & Identify Missing Compliance Data</span>
              </button>
            </form>

            {/* Match & Extraction Result Display */}
            {matchResult && (
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3.5 text-xs">
                {/* Extracted Missing Data Badges */}
                {matchResult.identified_missing_data_resolved && matchResult.identified_missing_data_resolved.length > 0 && (
                  <div className="p-3 bg-blue-50 border border-blue-100 rounded-xl space-y-1.5">
                    <div className="text-[11px] font-bold text-blue-900 flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                      <span>Extracted & Identified Compliance Specifications:</span>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {matchResult.identified_missing_data_resolved.map((item: string, idx: number) => (
                        <span key={idx} className="bg-white text-emerald-700 text-[10px] font-bold px-2 py-0.5 rounded-full border border-emerald-200 inline-flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                          <span>{item}</span>
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {matchResult.match_type === 'HIGH_CONFIDENCE' ? (
                  <div className="space-y-3">
                    <div className="p-3 bg-emerald-100 text-emerald-900 rounded-lg font-semibold flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>Matched to {matchResult.matched_product?.product_model || 'Catalog SKU'} — {(matchResult.match_confidence * 100).toFixed(0)}% Confidence</span>
                    </div>

                    <div className="font-mono text-[11px] text-slate-600 space-y-1 bg-white p-2.5 rounded border">
                      <div>Cert No: <strong>{matchResult.extracted_metadata?.certificate_number}</strong></div>
                      <div>Standard: <strong>{matchResult.extracted_metadata?.standard}</strong></div>
                      <div>Expiry: <strong>{matchResult.extracted_metadata?.expiry_date}</strong></div>
                    </div>

                    <button
                      onClick={() => executeResolutionAction({
                        product_id: matchResult.matched_product?.product_id,
                        action_type: 'ATTACH_DOCUMENT',
                        value: matchResult.extracted_metadata?.certificate_number,
                        notes: matchResult.evidence
                      })}
                      disabled={submittingAction}
                      className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-lg transition-colors flex items-center justify-center gap-1.5"
                    >
                      {submittingAction ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                      <span>Confirm & Attach Evidence to Product</span>
                    </button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="p-3 bg-amber-100 text-amber-900 rounded-lg font-semibold flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                      <span>Possible Candidate Matches — Human Selection Required</span>
                    </div>

                    <div className="space-y-2">
                      {matchResult.candidate_matches.map((cand: any) => (
                        <div key={cand.product_id} className="p-2.5 bg-white rounded border flex items-center justify-between font-mono text-[11px]">
                          <div>
                            <strong className="text-slate-900">{cand.product_model}</strong> ({cand.manufacturer})
                            <span className="text-amber-700 font-bold block text-[10px]">
                              {Math.round(cand.match_confidence * 100)}% Match Score
                            </span>
                          </div>
                          <button
                            onClick={() => executeResolutionAction({
                              product_id: cand.product_id,
                              action_type: 'ATTACH_DOCUMENT',
                              value: matchResult.extracted_metadata.certificate_number,
                              notes: `Human confirmed candidate match ${cand.product_model}`
                            })}
                            className="px-2.5 py-1 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded text-[10px]"
                          >
                            Select & Attach
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* EXPIRED CERTIFICATE REPLACEMENT MODAL */}
      {expiredModalOpen && selectedCertForReplacement && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 border border-slate-200 shadow-2xl space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Clock className="w-4 h-4 text-rose-600" />
                <span>Approve Certificate Replacement</span>
              </h3>
              <button onClick={() => setExpiredModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3 bg-slate-50 rounded-xl border space-y-1">
                <span className="text-[10px] font-bold uppercase text-slate-400">Current Expired Certificate</span>
                <div className="font-mono text-slate-800">
                  #{selectedCertForReplacement.certificate_number} • Standard: {selectedCertForReplacement.standard}
                </div>
                <div className="text-rose-600 font-bold font-mono text-[11px]">
                  Expired on: {selectedCertForReplacement.expiry_date}
                </div>
              </div>

              <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 space-y-1">
                <span className="text-[10px] font-bold uppercase text-emerald-700">New Vault Replacement Candidate</span>
                <div className="font-mono text-emerald-950 font-bold">
                  Document: {selectedCertForReplacement.replacement_candidate.filename}
                </div>
                <div className="text-emerald-700 font-mono text-[11px]">
                  Extracted Renewal: 2 Year Valid Extension (2026 - 2028)
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
              <button
                onClick={() => executeResolutionAction({
                  certificate_id: selectedCertForReplacement.id,
                  action_type: 'APPROVE_REPLACEMENT',
                  replacement_document_id: selectedCertForReplacement.replacement_candidate.document_id,
                  notes: 'Approved replacement of expired certificate document.'
                })}
                disabled={submittingAction}
                className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl transition-colors flex items-center justify-center gap-1.5"
              >
                {submittingAction ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                <span>Approve Replacement</span>
              </button>

              <button
                onClick={() => setExpiredModalOpen(false)}
                className="px-4 py-2.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 font-bold text-xs rounded-xl"
              >
                Reject / Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* COMPLIANCE CONFLICT RESOLUTION MODAL */}
      {conflictModalOpen && selectedCertForConflict && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 border border-slate-200 shadow-2xl space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-600" />
                <span>Resolve Compliance Conflict</span>
              </h3>
              <button onClick={() => setConflictModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 bg-slate-50 rounded-xl border text-xs space-y-2 font-mono">
              <div>Parameter: <strong className="text-slate-900 capitalize">{selectedCertForConflict.conflict_details.field}</strong></div>
              <div>Product DB Value: <strong className="text-rose-700">{selectedCertForConflict.conflict_details.db_value}</strong></div>
              <div>Certificate Value: <strong className="text-emerald-700">{selectedCertForConflict.conflict_details.certificate_value}</strong></div>
            </div>

            <div className="space-y-2 pt-2 text-xs">
              <button
                onClick={() => executeResolutionAction({
                  certificate_id: selectedCertForConflict.id,
                  action_type: 'RESOLVE_CONFLICT',
                  value: selectedCertForConflict.conflict_details.certificate_value,
                  notes: 'Accepted verified certificate value.'
                })}
                disabled={submittingAction}
                className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl transition-colors"
              >
                Choose Certificate Value ({selectedCertForConflict.conflict_details.certificate_value})
              </button>

              <button
                onClick={() => executeResolutionAction({
                  certificate_id: selectedCertForConflict.id,
                  action_type: 'RESOLVE_CONFLICT',
                  value: selectedCertForConflict.conflict_details.db_value,
                  notes: 'Maintained current database value.'
                })}
                disabled={submittingAction}
                className="w-full py-2 bg-slate-800 hover:bg-slate-900 text-white font-bold rounded-xl transition-colors"
              >
                Keep Current Database Value ({selectedCertForConflict.conflict_details.db_value})
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MANUAL ENTRY MODAL */}
      {manualModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 border border-slate-200 shadow-2xl space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Edit3 className="w-4 h-4 text-blue-600" />
                <span>Manual Verification & Detail Input</span>
              </h3>
              <button onClick={() => setManualModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Target Product Association Banner */}
            <div className="p-3 bg-blue-50/80 border border-blue-200 rounded-xl flex items-center justify-between text-xs">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-blue-700 block">Target Product for Compliance Entry:</span>
                <span className="font-bold text-blue-950 font-mono text-xs">
                  {productDetail?.product_name || (selectedProductId ? `Product #${selectedProductId}` : 'Selected Catalog SKU')}
                </span>
                {productDetail?.product_model && (
                  <span className="text-[11px] font-mono text-blue-800 ml-2 font-bold">({productDetail.product_model})</span>
                )}
              </div>
              {productDetail?.manufacturer && (
                <span className="bg-blue-100 text-blue-900 font-bold px-2 py-0.5 rounded text-[10px] border border-blue-200">
                  {productDetail.manufacturer}
                </span>
              )}
            </div>

            {/* Banner highlighting missing requirements for selected product */}
            {productDetail?.required_items && productDetail.required_items.filter((i: any) => i.evidence_status !== 'VERIFIED').length > 0 && (
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl space-y-1.5 text-xs">
                <div className="font-bold text-amber-900 flex items-center gap-1.5">
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                  <span>Missing Details & Requirements Needing Verification:</span>
                </div>
                <div className="flex flex-wrap gap-1">
                  {productDetail.required_items
                    .filter((i: any) => i.evidence_status !== 'VERIFIED')
                    .map((item: any, idx: number) => (
                      <span key={idx} className="bg-white text-amber-900 font-mono text-[10px] font-bold px-2 py-0.5 rounded border border-amber-300">
                        {item.name} ({item.specification_value || 'Missing'})
                      </span>
                    ))}
                </div>
              </div>
            )}

            <form
              onSubmit={(e) => {
                e.preventDefault();
                executeResolutionAction({
                  product_id: selectedProductId || undefined,
                  action_type: 'MANUAL_ENTRY',
                  value: manualCertNumber,
                  cert_type: manualCertType,
                  standard: manualStandard,
                  certification_body: manualBody,
                  issue_date: manualIssueDate,
                  expiry_date: manualExpiryDate,
                  scope: manualScope,
                  spec_value: manualSpecValue,
                  temp_range: manualTempRange,
                  atex_rating: manualAtex,
                  rohs_status: manualRohs,
                  safety_standard: manualSafety,
                  notes: manualNotes
                });
              }}
              className="space-y-4 text-xs max-h-[75vh] overflow-y-auto pr-1"
            >
              {/* Mandatory Checklist Items Section */}
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
                <span className="font-bold text-slate-800 uppercase tracking-wider text-[10px] block border-b border-slate-200 pb-1">
                  1. Mandatory Regulatory Requirements & Specifications
                </span>

                <div className="grid grid-cols-2 gap-2.5">
                  <div>
                    <label className="font-bold text-slate-700 block mb-1 text-[11px]">
                      🛡️ IP Ingress Protection Rating:
                    </label>
                    <input
                      type="text"
                      required
                      value={manualSpecValue}
                      onChange={e => setManualSpecValue(e.target.value)}
                      placeholder="e.g. IP55, IP65, IP68..."
                      className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg focus:outline-none focus:border-blue-500 font-mono text-xs"
                    />
                  </div>

                  <div>
                    <label className="font-bold text-slate-700 block mb-1 text-[11px]">
                      🌡️ Operating Temperature Range:
                    </label>
                    <input
                      type="text"
                      required
                      value={manualTempRange}
                      onChange={e => setManualTempRange(e.target.value)}
                      placeholder="e.g. -20°C to +60°C..."
                      className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg focus:outline-none focus:border-blue-500 font-mono text-xs"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2.5">
                  <div>
                    <label className="font-bold text-slate-700 block mb-1 text-[11px]">
                      ⚡ Safety Standard (IEC 60034-1):
                    </label>
                    <input
                      type="text"
                      required
                      value={manualSafety}
                      onChange={e => setManualSafety(e.target.value)}
                      placeholder="e.g. IEC 60034-1 / EN 60204-1..."
                      className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg focus:outline-none focus:border-blue-500 font-mono text-xs"
                    />
                  </div>

                  <div>
                    <label className="font-bold text-slate-700 block mb-1 text-[11px]">
                      🔥 ATEX Directive (Hazardous Area):
                    </label>
                    <input
                      type="text"
                      required
                      value={manualAtex}
                      onChange={e => setManualAtex(e.target.value)}
                      placeholder="e.g. Zone 1 / Ex II 2G or N/A..."
                      className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg focus:outline-none focus:border-blue-500 font-mono text-xs"
                    />
                  </div>
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1 text-[11px]">
                    🌱 RoHS 3 Environmental Directive:
                  </label>
                  <input
                    type="text"
                    required
                    value={manualRohs}
                    onChange={e => setManualRohs(e.target.value)}
                    placeholder="e.g. RoHS 3 Compliant (Directive 2015/863)..."
                    className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg focus:outline-none focus:border-blue-500 font-mono text-xs"
                  />
                </div>
              </div>

              {/* Certificate Verification Section */}
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
                <span className="font-bold text-slate-800 uppercase tracking-wider text-[10px] block border-b border-slate-200 pb-1">
                  2. Certificate & Verification Metadata
                </span>

                <div className="grid grid-cols-2 gap-2.5">
                  <div>
                    <label className="font-bold text-slate-700 block mb-1 text-[11px]">Certificate / Ref #:</label>
                    <input
                      type="text"
                      required
                      value={manualCertNumber}
                      onChange={e => setManualCertNumber(e.target.value)}
                      placeholder="e.g. NS-2026-45821..."
                      className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg focus:outline-none focus:border-blue-500 font-mono text-xs"
                    />
                  </div>

                  <div>
                    <label className="font-bold text-slate-700 block mb-1 text-[11px]">Certification Body:</label>
                    <input
                      type="text"
                      required
                      value={manualBody}
                      onChange={e => setManualBody(e.target.value)}
                      placeholder="e.g. TÜV Rheinland / Intertek..."
                      className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg focus:outline-none focus:border-blue-500 font-mono text-xs"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2.5">
                  <div>
                    <label className="font-bold text-slate-700 block mb-1 text-[11px]">Issue Date:</label>
                    <input
                      type="date"
                      required
                      value={manualIssueDate}
                      onChange={e => setManualIssueDate(e.target.value)}
                      className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg focus:outline-none focus:border-blue-500 font-mono text-xs"
                    />
                  </div>

                  <div>
                    <label className="font-bold text-slate-700 block mb-1 text-[11px]">Expiry Date:</label>
                    <input
                      type="date"
                      required
                      value={manualExpiryDate}
                      onChange={e => setManualExpiryDate(e.target.value)}
                      className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg focus:outline-none focus:border-blue-500 font-mono text-xs"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Engineer Verification Notes & Justification:</label>
                <textarea
                  rows={2}
                  value={manualNotes}
                  onChange={e => setManualNotes(e.target.value)}
                  placeholder="Verified against physical inspection / manufacturer test report..."
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:bg-white text-xs"
                />
              </div>

              <button
                type="submit"
                disabled={submittingAction}
                className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl transition-colors flex items-center justify-center gap-1.5 shadow-2xs sticky bottom-0 z-10"
              >
                {submittingAction ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                <span>Save All Mandatory Details & Verify Compliance</span>
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
