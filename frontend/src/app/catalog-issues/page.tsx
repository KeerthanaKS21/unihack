'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { useApp } from '@/context/AppContext';
import { PageHeader } from '@/components/layout/PageHeader';
import { StatusBadge } from '@/components/common/StatusBadge';
import { ConfidenceBadge } from '@/components/common/ConfidenceBadge';
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
  Image as ImageIcon,
  Check,
  Edit3,
  ArrowRight,
  Filter,
  ExternalLink,
  ShieldCheck
} from 'lucide-react';
import Link from 'next/link';

function CatalogIssuesContent() {
  const searchParams = useSearchParams();
  const initialFilter = searchParams.get('filter') || 'all';

  const {
    catalogIssues,
    openIssuesCount,
    resolveCatalogIssue,
    setViewingDocument,
    documents
  } = useApp();

  const [activeTab, setActiveTab] = useState<string>(initialFilter);
  const [customInputs, setCustomInputs] = useState<Record<string, string>>({});
  const [editingIssueId, setEditingIssueId] = useState<string | null>(null);

  useEffect(() => {
    const f = searchParams.get('filter');
    if (f) setActiveTab(f);
  }, [searchParams]);

  const tabs = [
    { id: 'all', label: 'All Open Issues', count: catalogIssues.filter(i => i.status === 'open').length },
    { id: 'conflict', label: 'Conflicts', count: catalogIssues.filter(i => i.issueType === 'conflict' && i.status === 'open').length },
    { id: 'missing', label: 'Missing Data', count: catalogIssues.filter(i => i.issueType === 'missing' && i.status === 'open').length },
    { id: 'duplicate', label: 'Duplicates', count: catalogIssues.filter(i => i.issueType === 'duplicate' && i.status === 'open').length },
    { id: 'invalid_unit', label: 'Invalid Units', count: catalogIssues.filter(i => i.issueType === 'invalid_unit' && i.status === 'open').length },
    { id: 'wrong_category', label: 'Wrong Category', count: catalogIssues.filter(i => i.issueType === 'wrong_category' && i.status === 'open').length },
    { id: 'outdated', label: 'Outdated', count: catalogIssues.filter(i => i.issueType === 'outdated' && i.status === 'open').length },
    { id: 'compliance', label: 'Compliance', count: catalogIssues.filter(i => i.issueType === 'compliance' && i.status === 'open').length },
    { id: 'broken_relationship', label: 'Relationships', count: catalogIssues.filter(i => i.issueType === 'broken_relationship' && i.status === 'open').length },
    { id: 'image_mismatch', label: 'Image Mismatch', count: catalogIssues.filter(i => i.issueType === 'image_mismatch' && i.status === 'open').length }
  ];

  const filteredIssues = catalogIssues.filter(issue => {
    if (activeTab === 'all') return true;
    return issue.issueType.toLowerCase() === activeTab.toLowerCase();
  });

  const handleResolve = (issueId: string, value: string) => {
    resolveCatalogIssue(issueId, value);
    setEditingIssueId(null);
  };

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
        badge={`${openIssuesCount} Unresolved`}
        badgeVariant={openIssuesCount > 0 ? 'warning' : 'success'}
      />

      {/* Navigation Tabs Filter Bar */}
      <div className="bg-white rounded-2xl p-2 border border-slate-200 shadow-xs flex items-center gap-1.5 overflow-x-auto text-xs font-semibold">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-3 py-2 rounded-xl transition-all flex items-center gap-2 whitespace-nowrap ${
              activeTab === tab.id
                ? 'bg-slate-900 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
            }`}
          >
            <span>{tab.label}</span>
            {tab.count > 0 && (
              <span
                className={`text-[10px] font-bold px-1.5 py-0.2 rounded-full ${
                  activeTab === tab.id
                    ? 'bg-white/20 text-white'
                    : 'bg-slate-200 text-slate-700'
                }`}
              >
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Issues List Container */}
      <div className="space-y-6">
        {filteredIssues.length === 0 ? (
          <div className="p-12 text-center bg-white rounded-2xl border border-slate-200 shadow-xs">
            <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto mb-3">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <h4 className="text-base font-bold text-slate-800">
              No Open Issues in this Category
            </h4>
            <p className="text-xs text-slate-500 mt-1">
              All flagged items have been validated and resolved with human sign-off.
            </p>
          </div>
        ) : (
          filteredIssues.map(issue => {
            const isResolved = issue.status === 'resolved';

            return (
              <div
                key={issue.id}
                className={`rounded-2xl p-6 border transition-all shadow-xs ${
                  isResolved
                    ? 'bg-slate-50/70 border-emerald-300 opacity-90'
                    : 'bg-white border-slate-200'
                }`}
              >
                {/* Issue Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
                  <div className="flex items-center gap-2.5 flex-wrap">
                    <span className="text-xs font-bold px-2.5 py-0.5 rounded-lg bg-blue-100 text-blue-800 font-mono">
                      {issue.productModel}
                    </span>
                    <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                      Field: <strong className="text-slate-800">{issue.field}</strong>
                    </span>
                    <StatusBadge status={isResolved ? 'Resolved' : issue.issueType} size="sm" />
                  </div>

                  {isResolved ? (
                    <div className="flex items-center gap-1.5 text-xs text-emerald-700 font-bold bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200">
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Resolved: {issue.resolvedValue} ({issue.resolvedAt})</span>
                    </div>
                  ) : (
                    <ConfidenceBadge score={issue.aiRecommendation.confidence} />
                  )}
                </div>

                {/* Main Issue Content Grid */}
                <div className="mt-4 grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Left Column: Discrepancy Evidence & Multi-System Sources */}
                  <div className="space-y-3">
                    <div>
                      <h4 className="text-sm font-bold text-slate-900">
                        {issue.title}
                      </h4>
                      <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                        {issue.description}
                      </p>
                    </div>

                    <div className="space-y-2">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
                        Conflicting Internal Sources:
                      </span>
                      <div className="space-y-1.5">
                        {issue.sources.map((src, idx) => (
                          <div
                            key={idx}
                            className="p-2.5 rounded-xl border border-slate-200/80 bg-slate-50 flex items-center justify-between text-xs"
                          >
                            <div className="flex items-center gap-2">
                              <span className={`w-2 h-2 rounded-full ${
                                src.priority === 'high' ? 'bg-blue-600' : 'bg-slate-400'
                              }`} />
                              <span className="font-semibold text-slate-700">{src.sourceName}</span>
                            </div>
                            <span className="font-mono font-bold text-slate-900 bg-white px-2 py-0.5 rounded border border-slate-200">
                              {src.value}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Right Column: AI Suggestion & Human Decision Actions */}
                  <div className="bg-blue-50/40 rounded-xl p-5 border border-blue-200/80 flex flex-col justify-between space-y-4">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-blue-900 font-bold text-xs">
                        <Sparkles className="w-4 h-4 text-blue-600" />
                        <span>AI Recommendation & Standard Justification</span>
                      </div>

                      <div className="p-3 bg-white rounded-lg border border-blue-100 text-xs space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="text-slate-500 font-sans">Suggested Value:</span>
                          <span className="font-bold font-mono text-blue-700 text-sm">
                            {issue.aiRecommendation.suggestedValue}
                          </span>
                        </div>
                        <p className="text-slate-600 mt-1 leading-relaxed text-[11px]">
                          {issue.aiRecommendation.reasoning}
                        </p>
                        {issue.aiRecommendation.standardReference && (
                          <div className="pt-1.5 border-t border-slate-100 text-[10px] text-slate-400 font-mono">
                            Ref: {issue.aiRecommendation.standardReference}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Decision Action Buttons (Requirement #13) */}
                    {!isResolved ? (
                      <div className="space-y-2 pt-2">
                        {editingIssueId === issue.id ? (
                          <div className="flex items-center gap-2">
                            <input
                              type="text"
                              value={customInputs[issue.id] || ''}
                              onChange={e => setCustomInputs({ ...customInputs, [issue.id]: e.target.value })}
                              placeholder="Enter custom corrected value..."
                              className="flex-1 px-3 py-1.5 text-xs border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 font-mono"
                            />
                            <button
                              onClick={() => handleResolve(issue.id, customInputs[issue.id] || issue.aiRecommendation.suggestedValue)}
                              className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg transition-colors"
                            >
                              Apply
                            </button>
                            <button
                              onClick={() => setEditingIssueId(null)}
                              className="px-2 py-1.5 text-xs text-slate-500 hover:text-slate-700"
                            >
                              Cancel
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2 flex-wrap">
                            {/* Option 1: Accept AI Recommendation */}
                            <button
                              onClick={() => handleResolve(issue.id, issue.aiRecommendation.suggestedValue)}
                              className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg shadow-xs transition-colors inline-flex items-center gap-1.5"
                            >
                              <Check className="w-3.5 h-3.5" />
                              <span>Accept {issue.aiRecommendation.suggestedValue}</span>
                            </button>

                            {/* Option 2: Alternate sources if conflict */}
                            {issue.issueType === 'conflict' && issue.sources.length > 2 && (
                              <button
                                onClick={() => handleResolve(issue.id, issue.sources[2].value)}
                                className="px-3 py-2 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 text-xs font-semibold rounded-lg transition-colors"
                              >
                                Choose {issue.sources[2].value}
                              </button>
                            )}

                            {/* Option 3: Merge / Keep both if duplicate */}
                            {issue.issueType === 'duplicate' && (
                              <button
                                onClick={() => handleResolve(issue.id, 'Keep Both as Separate SKUs')}
                                className="px-3 py-2 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 text-xs font-semibold rounded-lg transition-colors"
                              >
                                Keep Both
                              </button>
                            )}

                            {/* Option 4: Manual Edit */}
                            <button
                              onClick={() => setEditingIssueId(issue.id)}
                              className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg transition-colors inline-flex items-center gap-1"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                              <span>Edit Value</span>
                            </button>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="text-right">
                        <span className="text-[11px] text-slate-400 font-mono">
                          Verified & Locked in Master Schema
                        </span>
                      </div>
                    )}
                  </div>
                </div>
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
    <Suspense fallback={<div className="p-12 text-center text-xs text-slate-400">Loading catalog issues workspace...</div>}>
      <CatalogIssuesContent />
    </Suspense>
  );
}
