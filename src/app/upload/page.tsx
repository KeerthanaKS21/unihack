'use client';

import React, { useState } from 'react';
import { useApp } from '@/context/AppContext';
import { PageHeader } from '@/components/layout/PageHeader';
import { StatusBadge } from '@/components/common/StatusBadge';
import { ConfidenceBadge } from '@/components/common/ConfidenceBadge';
import {
  UploadCloud,
  FileText,
  CheckCircle2,
  AlertCircle,
  FileSpreadsheet,
  FileCode,
  Image as ImageIcon,
  ShieldCheck,
  Sparkles,
  ArrowRight,
  ExternalLink,
  Filter,
  Search,
  Layers,
  Clock,
  RotateCw
} from 'lucide-react';
import Link from 'next/link';

export default function UploadIngestPage() {
  const {
    documents,
    ingestionState,
    startSimulatedIngestion,
    resetIngestionState,
    setViewingDocument
  } = useApp();

  const [selectedDocType, setSelectedDocType] = useState<
    'Datasheet' | 'Certificate' | 'Supplier Catalog' | 'Manual' | 'Excel Spec'
  >('Datasheet');

  const [filterType, setFilterType] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const handleSimulatedUpload = (fileName: string) => {
    startSimulatedIngestion(fileName, selectedDocType);
  };

  const filteredDocs = documents.filter(doc => {
    const matchesFilter = filterType === 'all' || doc.documentType.toLowerCase().includes(filterType.toLowerCase());
    const matchesSearch = doc.filename.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (doc.productModel && doc.productModel.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesFilter && matchesSearch;
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Upload & Ingest Product Documents"
        subtitle="Intelligent ingestion pipeline converting unorganized datasheets, supplier Excel files, PDFs, and certificates into verified catalog intelligence."
        breadcrumbs={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Upload & Ingest' }
        ]}
        badge="Multi-Format OCR Engine"
        badgeVariant="ai"
      />

      {/* Top Ingestion Pipeline Runner (Active State Stepper) */}
      {ingestionState && (
        <div className="bg-white rounded-2xl p-6 border-2 border-blue-500 shadow-xl space-y-4 animate-in zoom-in-95 duration-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-blue-100 text-blue-700">
                <Sparkles className="w-5 h-5 animate-spin" style={{ animationDuration: '4s' }} />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  AI Ingestion Pipeline Active: Step {ingestionState.step} of 5
                </h3>
                <p className="text-xs text-slate-500 font-medium">
                  {ingestionState.stepName}
                </p>
              </div>
            </div>
            {ingestionState.isComplete ? (
              <button
                onClick={resetIngestionState}
                className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg shadow-xs transition-colors"
              >
                Done
              </button>
            ) : (
              <span className="text-xs font-mono font-bold text-blue-600 animate-pulse">
                Processing...
              </span>
            )}
          </div>

          {/* Progress Bar */}
          <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
            <div
              className="bg-blue-600 h-2.5 rounded-full transition-all duration-500 ease-out"
              style={{ width: `${ingestionState.progress}%` }}
            />
          </div>

          {/* Stepper Visualizer */}
          <div className="grid grid-cols-5 gap-2 pt-2 text-center text-xs">
            {[
              { stepNum: 1, label: 'Uploading' },
              { stepNum: 2, label: 'OCR & Parsing' },
              { stepNum: 3, label: 'Product Match' },
              { stepNum: 4, label: 'Change Detect' },
              { stepNum: 5, label: 'Ready for Review' }
            ].map(s => {
              const isPast = ingestionState.step > s.stepNum;
              const isCurrent = ingestionState.step === s.stepNum;

              return (
                <div
                  key={s.stepNum}
                  className={`p-2 rounded-lg border transition-all ${
                    isPast
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200 font-semibold'
                      : isCurrent
                      ? 'bg-blue-50 text-blue-800 border-blue-300 font-bold ring-2 ring-blue-200'
                      : 'bg-slate-50 text-slate-400 border-slate-200'
                  }`}
                >
                  <div className="text-[11px] font-mono mb-0.5">0{s.stepNum}</div>
                  <div className="truncate">{s.label}</div>
                </div>
              );
            })}
          </div>

          {/* Live System Message */}
          <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 text-xs font-mono text-slate-700 flex items-center justify-between">
            <span>&gt; {ingestionState.message}</span>
            {ingestionState.isComplete && (
              <Link
                href="/synchronization"
                className="text-xs font-bold text-blue-600 hover:text-blue-800 underline inline-flex items-center gap-1"
              >
                Proceed to Synchronization →
              </Link>
            )}
          </div>
        </div>
      )}

      {/* Main Drag-and-Drop Upload Section */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-base font-bold text-slate-900 tracking-tight">
              Upload New Document
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Select document classification type and drag files or use one of the industrial test samples.
            </p>
          </div>

          {/* Classification Type Selector */}
          <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs font-semibold overflow-x-auto">
            {(['Datasheet', 'Certificate', 'Supplier Catalog', 'Manual', 'Excel Spec'] as const).map(type => (
              <button
                key={type}
                onClick={() => setSelectedDocType(type)}
                className={`px-3 py-1.5 rounded-lg transition-all whitespace-nowrap ${
                  selectedDocType === type
                    ? 'bg-white text-blue-700 shadow-xs border border-slate-200'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {type}
              </button>
            ))}
          </div>
        </div>

        {/* Drag-and-Drop Zone */}
        <div className="border-2 border-dashed border-slate-300 hover:border-blue-500 rounded-2xl p-8 bg-slate-50/60 hover:bg-blue-50/20 text-center transition-all cursor-pointer group">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-blue-100 group-hover:bg-blue-200 text-blue-600 flex items-center justify-center transition-colors mb-3">
            <UploadCloud className="w-7 h-7" />
          </div>
          <h4 className="text-sm font-bold text-slate-900">
            Drag & drop your files here, or browse local system
          </h4>
          <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
            Supports PDF engineering datasheets, Excel supplier catalogs (.xlsx), scanned certificates (.pdf, .png), and CAD spec drawings.
          </p>

          {/* Demo Quick Trigger Pills */}
          <div className="mt-5 pt-5 border-t border-slate-200/80">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-2">
              ⚡ Quick Ingestion Demo Samples (Click to simulate live upload)
            </span>
            <div className="flex items-center justify-center gap-2 flex-wrap">
              <button
                onClick={() => handleSimulatedUpload('technical_spec_2026.pdf')}
                className="px-3 py-1.5 bg-white hover:bg-blue-50 text-blue-700 border border-blue-200 text-xs font-semibold rounded-lg shadow-2xs transition-colors inline-flex items-center gap-1.5"
              >
                <FileText className="w-3.5 h-3.5" />
                <span>technical_spec_2026.pdf (XYZ-450 v2.0)</span>
              </button>

              <button
                onClick={() => handleSimulatedUpload('certificate.pdf')}
                className="px-3 py-1.5 bg-white hover:bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-semibold rounded-lg shadow-2xs transition-colors inline-flex items-center gap-1.5"
              >
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>certificate.pdf (CE / IEC 60034)</span>
              </button>

              <button
                onClick={() => handleSimulatedUpload('abb_m3bp_pricing_2026.xlsx')}
                className="px-3 py-1.5 bg-white hover:bg-purple-50 text-purple-700 border border-purple-200 text-xs font-semibold rounded-lg shadow-2xs transition-colors inline-flex items-center gap-1.5"
              >
                <FileSpreadsheet className="w-3.5 h-3.5" />
                <span>supplier_catalog_abb.xlsx</span>
              </button>
            </div>
          </div>
        </div>

        {/* Feature Demonstration Notice: Multi-file to Single Product Matching */}
        <div className="p-4 rounded-xl bg-blue-50 border border-blue-200 flex items-start gap-3">
          <div className="p-2 rounded-lg bg-blue-100 text-blue-700 shrink-0">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-blue-900">
              AI Multi-Source Entity Resolution
            </h4>
            <p className="text-xs text-blue-800/90 mt-0.5 leading-relaxed">
              The AI automatically clusters different filenames (<code className="bg-blue-100/80 px-1 py-0.5 rounded font-mono">motor_specs.pdf</code>, <code className="bg-blue-100/80 px-1 py-0.5 rounded font-mono">technical_spec_2026.pdf</code>, <code className="bg-blue-100/80 px-1 py-0.5 rounded font-mono">certificate.pdf</code>) under the same master industrial product record (<span className="font-bold">XYZ-450</span>) with confidence scoring.
            </p>
          </div>
        </div>
      </div>

      {/* Upload History Table Section */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-base font-bold text-slate-900 tracking-tight">
              Ingested Document History
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Authoritative files currently parsed into the enterprise knowledge graph.
            </p>
          </div>

          <div className="flex items-center gap-3">
            {/* Search */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Filter files or models..."
                className="pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>

            {/* Type Filter */}
            <select
              value={filterType}
              onChange={e => setFilterType(e.target.value)}
              className="px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-700 font-medium focus:outline-none"
            >
              <option value="all">All Document Types</option>
              <option value="datasheet">Datasheets</option>
              <option value="certificate">Certificates</option>
              <option value="supplier catalog">Supplier Catalogs</option>
              <option value="manual">Manuals</option>
            </select>
          </div>
        </div>

        {/* History Table */}
        <div className="border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">File Name</th>
                <th className="py-3 px-4">Identified Product</th>
                <th className="py-3 px-4">Document Type</th>
                <th className="py-3 px-4">Uploaded On</th>
                <th className="py-3 px-4">Version Tag</th>
                <th className="py-3 px-4">AI Entity Match</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredDocs.map(doc => (
                <tr key={doc.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2.5">
                      <div className="p-1.5 rounded bg-blue-50 text-blue-600">
                        <FileText className="w-4 h-4" />
                      </div>
                      <div>
                        <span className="font-bold text-slate-900 block">{doc.filename}</span>
                        <span className="text-[11px] text-slate-400">{doc.fileSize} • {doc.pagesCount} pgs</span>
                      </div>
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <span className="font-mono font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                      {doc.productModel || 'Unlinked'}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-slate-600 font-medium">
                    {doc.documentType}
                  </td>
                  <td className="py-3 px-4 text-slate-500 font-mono">
                    {doc.uploadedOn}
                  </td>
                  <td className="py-3 px-4 font-mono font-semibold text-slate-800">
                    {doc.version || '-'}
                  </td>
                  <td className="py-3 px-4">
                    {doc.isSameProductDetected ? (
                      <div className="flex items-center gap-1.5">
                        <ConfidenceBadge score={doc.matchConfidence} size="sm" showLabel={false} />
                        <span className="text-[10px] text-emerald-700 font-semibold">
                          Same Product
                        </span>
                      </div>
                    ) : (
                      <span className="text-[11px] text-slate-400 font-medium">New SKU</span>
                    )}
                  </td>
                  <td className="py-3 px-4">
                    <StatusBadge status={doc.status} size="sm" />
                  </td>
                  <td className="py-3 px-4 text-right">
                    <button
                      onClick={() => setViewingDocument(doc)}
                      className="px-2.5 py-1 text-xs font-semibold text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded transition-colors inline-flex items-center gap-1"
                    >
                      <span>Inspect OCR</span>
                      <ExternalLink className="w-3 h-3" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
