'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { useApp } from '@/context/AppContext';
import { PageHeader } from '@/components/layout/PageHeader';
import { StatusBadge } from '@/components/common/StatusBadge';
import { api } from '@/lib/api';
import {
  AlertCircle,
  CheckCircle2,
  Sparkles,
  Layers,
  FileQuestion,
  Copy,
  Clock,
  Ruler,
  ShieldAlert,
  Unlink,
  Check,
  Edit3,
  ArrowRight,
  Filter,
  ExternalLink,
  ShieldCheck,
  Loader2,
  Search,
  RefreshCw,
  FolderPlus,
  Eye,
  Tag,
  AlertTriangle
} from 'lucide-react';
import Link from 'next/link';

function CatalogIssuesContent() {
  const searchParams = useSearchParams();
  const initialFilter = searchParams.get('filter') || 'all';

  const { showToast, refreshBackendData } = useApp();

  const [activeTab, setActiveTab] = useState<string>(initialFilter);
  const [statusFilter, setStatusFilter] = useState<string>('open');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  const [issuesList, setIssuesList] = useState<any[]>([]);
  const [totalCount, setTotalCount] = useState<number>(0);
  const [customInputs, setCustomInputs] = useState<Record<string, string>>({});
  const [editingIssueId, setEditingIssueId] = useState<number | null>(null);
  const [resolvingId, setResolvingId] = useState<number | null>(null);

  const [tabCounts, setTabCounts] = useState<Record<string, number>>({
    all: 0,
    missing: 0,
    conflict: 0,
    duplicate: 0,
    outdated: 0,
    invalid_unit: 0,
    wrong_category: 0,
    compliance: 0,
    broken_relationship: 0,
    low_confidence: 0
  });

  const fetchIssues = async () => {
    setLoading(true);
    try {
      const res = await api.getCatalogIssues({
        issue_type: activeTab === 'all' ? undefined : activeTab,
        status: statusFilter === 'all' ? undefined : statusFilter,
        search: searchTerm.trim() || undefined,
        limit: 100
      });
      setIssuesList(res.items || []);
      setTotalCount(res.total || 0);

      // Fetch health summary and open issues for tab counts
      const health = await api.getCatalogHealth().catch(() => null);
      const allRes = await api.getCatalogIssues({ status: statusFilter === 'all' ? undefined : statusFilter, limit: 500 }).catch(() => null);
      const items = allRes?.items || [];

      const iss = health?.issues || health || {};
      const missingCount = items.filter(i => i.issue_type === 'missing').length || (iss.missing_data || 0);
      const conflictCount = items.filter(i => i.issue_type === 'conflict').length || (iss.conflicts || 0);
      const duplicateCount = items.filter(i => i.issue_type === 'duplicate').length || (iss.duplicates || 0);
      const outdatedCount = items.filter(i => i.issue_type === 'outdated').length || (iss.outdated || 0);
      const invalidUnitCount = items.filter(i => i.issue_type === 'invalid_unit' || i.issue_type === 'invalid_value').length || (iss.invalid_units || 0);
      const wrongCategoryCount = items.filter(i => i.issue_type === 'wrong_category').length || (iss.wrong_category || 0);
      const complianceCount = items.filter(i => i.issue_type === 'compliance').length || (iss.compliance_issues || iss.compliance || 0);
      const brokenRelCount = items.filter(i => i.issue_type === 'broken_relationship').length || (iss.broken_relationships || 0);
      const lowConfCount = items.filter(i => i.issue_type === 'low_confidence').length || (iss.low_confidence || 0);

      setTabCounts({
        all: items.length || (missingCount + conflictCount + duplicateCount + outdatedCount + invalidUnitCount + wrongCategoryCount + complianceCount + brokenRelCount + lowConfCount),
        missing: missingCount,
        conflict: conflictCount,
        duplicate: duplicateCount,
        outdated: outdatedCount,
        invalid_unit: invalidUnitCount,
        wrong_category: wrongCategoryCount,
        compliance: complianceCount,
        broken_relationship: brokenRelCount,
        low_confidence: lowConfCount
      });
    } catch (err) {
      console.warn('Failed to load issues from backend:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const f = searchParams.get('filter');
    if (f) setActiveTab(f);
  }, [searchParams]);

  useEffect(() => {
    fetchIssues();
  }, [activeTab, statusFilter, searchTerm]);

  const handleResolve = async (issueId: number, value: string, notes?: string) => {
    if (!value || !value.trim()) {
      showToast({
        type: 'warning',
        title: 'Input Required',
        message: 'Please provide a valid resolution value.'
      });
      return;
    }

    setResolvingId(issueId);
    try {
      const res = await api.resolveCatalogIssue(issueId, value.trim(), notes);
      showToast({
        type: 'success',
        title: 'Issue Resolved',
        message: res.message || `Issue #${issueId} successfully resolved in master catalog.`
      });
      setEditingIssueId(null);
      await fetchIssues();
      await refreshBackendData();
    } catch (err: any) {
      showToast({
        type: 'error',
        title: 'Resolution Failed',
        message: err.message || 'Failed to apply resolution to catalog.'
      });
    } finally {
      setResolvingId(null);
    }
  };

  const tabs = [
    { id: 'all', label: 'All Issues' },
    { id: 'missing', label: 'Missing Data' },
    { id: 'conflict', label: 'Conflicts' },
    { id: 'duplicate', label: 'Duplicates' },
    { id: 'outdated', label: 'Outdated' },
    { id: 'invalid_unit', label: 'Invalid Units & Values' },
    { id: 'wrong_category', label: 'Wrong Category' },
    { id: 'compliance', label: 'Compliance' },
    { id: 'broken_relationship', label: 'Relationships' },
    { id: 'low_confidence', label: 'Low Confidence' }
  ];

  const openCount = issuesList.filter(i => i.status === 'open').length;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Catalog Issues & Resolution Workspace"
        subtitle="Human-in-the-loop decision console where engineers review AI-suggested corrections for catalog conflicts, missing attributes, and duplicate records."
        breadcrumbs={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Catalog Health', href: '/catalog-health' },
          { label: 'Catalog Issues / Resolution' }
        ]}
        badge={totalCount > 0 ? `${openCount} Open / ${totalCount} Total` : 'Zero Issues'}
        badgeVariant={openCount > 0 ? 'warning' : 'success'}
        action={
          <button
            onClick={fetchIssues}
            disabled={loading}
            className="px-4 py-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 text-xs font-bold rounded-lg shadow-2xs transition-colors inline-flex items-center gap-1.5"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-blue-600' : 'text-slate-500'}`} />
            <span>Refresh Issues</span>
          </button>
        }
      />

      {/* Navigation Tabs Filter Bar */}
      <div className="bg-white rounded-2xl p-2.5 border border-slate-200 shadow-xs flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-1.5 overflow-x-auto text-xs font-semibold">
          {tabs.map(tab => {
            const count = tabCounts[tab.id] ?? 0;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-3 py-1.5 rounded-xl transition-all whitespace-nowrap inline-flex items-center gap-2 text-xs font-semibold ${
                  activeTab === tab.id
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                }`}
              >
                <span>{tab.label}</span>
                <span
                  className={`px-1.5 py-0.5 text-[10px] font-mono font-bold rounded-full transition-colors ${
                    activeTab === tab.id
                      ? 'bg-slate-700 text-slate-100'
                      : count > 0
                      ? 'bg-amber-100 text-amber-900 border border-amber-200'
                      : 'bg-slate-100 text-slate-500'
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Status Filter & Search */}
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search issues..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:bg-white focus:ring-1 focus:ring-blue-500 w-36 sm:w-44"
            />
          </div>

          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="text-xs font-bold px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 focus:outline-none"
          >
            <option value="open">Open Only</option>
            <option value="resolved">Resolved Only</option>
            <option value="all">All Statuses</option>
          </select>
        </div>
      </div>

      {/* Issues List Container */}
      <div className="space-y-4">
        {loading ? (
          <div className="p-16 text-center bg-white rounded-2xl border border-slate-200 shadow-xs space-y-3">
            <Loader2 className="w-8 h-8 animate-spin mx-auto text-blue-600" />
            <p className="text-xs font-semibold text-slate-600">Loading issues from PostgreSQL...</p>
          </div>
        ) : issuesList.length === 0 ? (
          <div className="p-16 text-center bg-white rounded-2xl border border-slate-200 shadow-xs space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto mb-2">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <h4 className="text-base font-bold text-slate-800">
              No Issues Found in this Category
            </h4>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              All records conform to category specifications or have already been verified by an engineer.
            </p>
            <Link
              href="/catalog-health"
              className="mt-2 inline-flex items-center gap-1.5 text-xs font-bold text-blue-600 hover:text-blue-800"
            >
              <span>← Back to Catalog Health Overview</span>
            </Link>
          </div>
        ) : (
          issuesList.map(issue => {
            const isResolved = issue.status === 'resolved';
            const aiRec = issue.ai_recommendation || {};
            const suggestedVal = aiRec.suggestedValue || aiRec.suggestedCategory;
            const currentCustomVal = customInputs[issue.id] ?? '';

            return (
              <div
                key={issue.id}
                className={`rounded-2xl p-6 border transition-all shadow-xs space-y-4 ${
                  isResolved
                    ? 'bg-slate-50/70 border-emerald-300 opacity-90'
                    : 'bg-white border-slate-200 hover:border-slate-300'
                }`}
              >
                {/* Issue Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
                  <div className="flex items-center gap-2.5 flex-wrap">
                    <span className="text-xs font-bold px-2.5 py-0.5 rounded-lg bg-blue-100 text-blue-800 font-mono">
                      {issue.product_model}
                    </span>
                    <span className="text-xs font-semibold text-slate-800">
                      {issue.product_name}
                    </span>
                    {issue.field && (
                      <span className="text-xs text-slate-500">
                        • Field: <strong className="text-slate-800 capitalize">{issue.field}</strong>
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <span
                      className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-md ${
                        issue.severity === 'critical'
                          ? 'bg-rose-100 text-rose-800'
                          : issue.severity === 'high'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-blue-100 text-blue-800'
                      }`}
                    >
                      {issue.severity}
                    </span>
                    <span
                      className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-md ${
                        isResolved
                          ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                          : 'bg-amber-100 text-amber-900 border border-amber-200'
                      }`}
                    >
                      {isResolved ? '✓ Resolved' : 'Open'}
                    </span>
                  </div>
                </div>

                {/* Issue Title & Description */}
                <div>
                  <h4 className="text-sm font-bold text-slate-900">{issue.title}</h4>
                  <p className="text-xs text-slate-600 mt-1 leading-relaxed">{issue.description}</p>
                </div>

                {/* Evidence & Context Box */}
                {issue.evidence && (
                  <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-100 text-xs space-y-1">
                    <span className="font-bold text-slate-700 block text-[11px] uppercase tracking-wider">
                      Audit Trail & Diagnostic Evidence:
                    </span>
                    <p className="font-mono text-slate-600 text-[11px] leading-relaxed">
                      {issue.evidence}
                    </p>
                  </div>
                )}

                {/* AI / System Recommendation */}
                {aiRec && Object.keys(aiRec).length > 0 && (
                  <div className="p-4 bg-blue-50/50 rounded-xl border border-blue-100 text-xs space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5 text-blue-900 font-bold">
                        <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                        <span>System Quality Recommendation</span>
                      </div>
                      {aiRec.reason && (
                        <span className="text-[10px] text-blue-700 bg-blue-100/60 px-2 py-0.2 rounded font-medium">
                          {aiRec.reason}
                        </span>
                      )}
                    </div>
                    {suggestedVal ? (
                      <p className="text-slate-700">
                        Suggested value: <strong className="font-mono text-blue-900 bg-white px-1.5 py-0.5 rounded border border-blue-200">{suggestedVal}</strong>
                      </p>
                    ) : (
                      <p className="text-slate-600 italic">
                        Manual engineering inspection required to confirm parameter.
                      </p>
                    )}
                  </div>
                )}

                {/* Resolution Status / Action Area */}
                {isResolved ? (
                  <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 flex items-center justify-between text-xs text-emerald-900">
                    <div className="flex items-center gap-2">
                      <ShieldCheck className="w-4 h-4 text-emerald-600" />
                      <span>
                        Resolved with: <strong className="font-mono">{issue.resolution_value || 'Verified'}</strong> by {issue.resolved_by || 'Engineering Lead'}
                      </span>
                    </div>
                    {issue.resolved_at && (
                      <span className="text-[11px] text-emerald-700 font-mono">
                        {new Date(issue.resolved_at).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                ) : (
                  <div className="pt-2 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    {/* Action Form */}
                    {editingIssueId === issue.id ? (
                      <div className="flex items-center gap-2 w-full sm:w-auto">
                        <input
                          type="text"
                          placeholder="Enter verified value (e.g. 45 kg, 415 V)..."
                          value={currentCustomVal}
                          onChange={e => setCustomInputs(prev => ({ ...prev, [issue.id]: e.target.value }))}
                          className="px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 font-mono w-full sm:w-64"
                        />
                        <button
                          onClick={() => handleResolve(issue.id, currentCustomVal)}
                          disabled={resolvingId === issue.id}
                          className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg transition-colors inline-flex items-center gap-1 shrink-0"
                        >
                          {resolvingId === issue.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                          <span>Apply</span>
                        </button>
                        <button
                          onClick={() => setEditingIssueId(null)}
                          className="px-2.5 py-1.5 text-xs text-slate-500 hover:text-slate-700"
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 flex-wrap">
                        {suggestedVal && (
                          <button
                            onClick={() => handleResolve(issue.id, String(suggestedVal))}
                            disabled={resolvingId === issue.id}
                            className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg shadow-2xs transition-colors inline-flex items-center gap-1.5"
                          >
                            {resolvingId === issue.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                            <span>Accept Suggestion ({suggestedVal})</span>
                          </button>
                        )}
                        <button
                          onClick={() => {
                            setEditingIssueId(issue.id);
                            setCustomInputs(prev => ({ ...prev, [issue.id]: suggestedVal ? String(suggestedVal) : '' }));
                          }}
                          className="px-3.5 py-1.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 text-xs font-bold rounded-lg shadow-2xs transition-colors inline-flex items-center gap-1.5"
                        >
                          <Edit3 className="w-3.5 h-3.5 text-slate-500" />
                          <span>Manual Correction</span>
                        </button>
                      </div>
                    )}

                    <span className="text-[11px] text-slate-400">
                      Human approval required to commit change to master catalog.
                    </span>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

export default function CatalogIssuesPage() {
  return (
    <Suspense fallback={
      <div className="p-16 text-center">
        <Loader2 className="w-8 h-8 animate-spin mx-auto text-blue-600" />
      </div>
    }>
      <CatalogIssuesContent />
    </Suspense>
  );
}
