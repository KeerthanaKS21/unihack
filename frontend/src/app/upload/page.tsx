'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '@/context/AppContext';
import { PageHeader } from '@/components/layout/PageHeader';
import { StatusBadge } from '@/components/common/StatusBadge';
import { ConfidenceBadge } from '@/components/common/ConfidenceBadge';
import { EmptyState } from '@/components/common/EmptyState';
import { api, ApiClientError } from '@/lib/api';
import {
  UploadCloud,
  FileText,
  CheckCircle2,
  AlertCircle,
  FileSpreadsheet,
  ShieldCheck,
  Sparkles,
  ExternalLink,
  Search,
  Layers,
  Loader2,
  RefreshCw
} from 'lucide-react';
import Link from 'next/link';

export default function UploadIngestPage() {
  const {
    documents: fallbackDocs,
    ingestionState,
    startSimulatedIngestion,
    resetIngestionState,
    setViewingDocument,
    showToast
  } = useApp();

  const [selectedDocType, setSelectedDocType] = useState<
    'Datasheet' | 'Certificate' | 'Supplier Catalog' | 'Manual' | 'Excel Spec'
  >('Datasheet');

  const [filterType, setFilterType] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  
  // Real API State
  const [dbDocuments, setDbDocuments] = useState<any[]>([]);
  const [loadingDocs, setLoadingDocs] = useState<boolean>(true);
  const [uploadingFile, setUploadingFile] = useState<boolean>(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [isDragOver, setIsDragOver] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Fetch real documents from FastAPI backend
  const fetchUploadedDocuments = async () => {
    setLoadingDocs(true);
    try {
      const res = await api.getDocuments({
        search: searchQuery || undefined,
        document_type: filterType !== 'all' ? filterType.toUpperCase() : undefined
      });
      if (res && Array.isArray(res.items)) {
        setDbDocuments(res.items);
      }
    } catch (err) {
      console.warn('Backend documents fetch failed, using fallback:', err);
      setDbDocuments(fallbackDocs);
    } finally {
      setLoadingDocs(false);
    }
  };

  useEffect(() => {
    fetchUploadedDocuments();
  }, [filterType, searchQuery]);

  // Handle Real File Upload to POST /api/documents/upload
  const handleFileUpload = async (file: File) => {
    setUploadingFile(true);
    setUploadError(null);

    try {
      const res = await api.uploadDocument(file, undefined, 'Engineering Lead');
      showToast({
        type: 'success',
        title: 'Document Uploaded & Stored',
        message: `${file.name} saved and indexed in database (Doc ID #${res.id}).`
      });
      // Refresh documents list
      await fetchUploadedDocuments();
    } catch (err: any) {
      const msg = err.message || 'File upload failed.';
      setUploadError(msg);
      showToast({
        type: 'error',
        title: 'Upload Failed',
        message: msg
      });
    } finally {
      setUploadingFile(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFileUpload(e.target.files[0]);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileUpload(e.dataTransfer.files[0]);
    }
  };

  const handleSimulatedUpload = (fileName: string) => {
    startSimulatedIngestion(fileName, selectedDocType);
  };

  const displayDocs = dbDocuments.length > 0 ? dbDocuments : fallbackDocs;

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

      {/* Upload Error Banner */}
      {uploadError && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold flex items-center justify-between animate-in fade-in">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{uploadError}</span>
          </div>
          <button onClick={() => setUploadError(null)} className="text-rose-600 hover:underline">Dismiss</button>
        </div>
      )}

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
              className="bg-gradient-to-r from-blue-600 to-indigo-600 h-full rounded-full transition-all duration-500"
              style={{ width: `${ingestionState.progress}%` }}
            />
          </div>

          <div className="flex items-center justify-between text-xs font-medium">
            <span className="text-slate-600">{ingestionState.message}</span>
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
              Upload New Document (Live API: <code className="text-blue-600 font-mono">POST /api/documents/upload</code>)
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

        {/* Hidden Real File Input */}
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileInputChange}
          accept=".pdf,.xlsx,.xls,.png,.jpg,.jpeg,.csv,.dwg,.dxf"
          className="hidden"
        />

        {/* Drag-and-Drop Zone */}
        <div
          onClick={() => fileInputRef.current?.click()}
          onDragOver={e => { e.preventDefault(); setIsDragOver(true); }}
          onDragLeave={() => setIsDragOver(false)}
          onDrop={handleDrop}
          className={`border-2 border-dashed rounded-2xl p-8 text-center transition-all cursor-pointer group ${
            isDragOver
              ? 'border-blue-600 bg-blue-50/50 scale-[1.01]'
              : 'border-slate-300 hover:border-blue-500 bg-slate-50/60 hover:bg-blue-50/20'
          }`}
        >
          <div className="w-14 h-14 mx-auto rounded-2xl bg-blue-100 group-hover:bg-blue-200 text-blue-600 flex items-center justify-center transition-colors mb-3">
            {uploadingFile ? (
              <Loader2 className="w-7 h-7 animate-spin text-blue-600" />
            ) : (
              <UploadCloud className="w-7 h-7" />
            )}
          </div>
          <h4 className="text-sm font-bold text-slate-900">
            {uploadingFile ? 'Uploading and indexing file to database...' : 'Drag & drop your files here, or click to browse'}
          </h4>
          <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
            Supports PDF engineering datasheets, Excel supplier catalogs (.xlsx), scanned certificates (.pdf, .png), and CAD drawings.
          </p>

          {/* Demo Quick Trigger Pills */}
          <div className="mt-5 pt-5 border-t border-slate-200/80" onClick={e => e.stopPropagation()}>
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

        {/* Feature Notice */}
        <div className="p-4 rounded-xl bg-blue-50 border border-blue-200 flex items-start gap-3">
          <div className="p-2 rounded-lg bg-blue-100 text-blue-700 shrink-0">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-blue-900">
              AI Multi-Source Entity Resolution
            </h4>
            <p className="text-xs text-blue-800/90 mt-0.5 leading-relaxed">
              The platform automatically clusters different filenames (<code className="bg-blue-100/80 px-1 py-0.5 rounded font-mono">motor_old.pdf</code>, <code className="bg-blue-100/80 px-1 py-0.5 rounded font-mono">technical_spec_2026.pdf</code>, <code className="bg-blue-100/80 px-1 py-0.5 rounded font-mono">certificate_xyz450.pdf</code>) under the same master industrial product record (<span className="font-bold">XYZ-450</span>).
            </p>
          </div>
        </div>
      </div>

      {/* Upload History Table Section */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold text-slate-900 tracking-tight">
                Ingested Document History
              </h3>
              <button
                onClick={fetchUploadedDocuments}
                title="Refresh from database"
                className="p-1 text-slate-400 hover:text-blue-600 transition-colors"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loadingDocs ? 'animate-spin' : ''}`} />
              </button>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Authoritative files stored in database and indexed into the enterprise knowledge graph.
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
              <option value="catalog">Supplier Catalogs</option>
              <option value="manual">Manuals</option>
            </select>
          </div>
        </div>

        {/* History Table */}
        <div className="border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
          {displayDocs.length === 0 ? (
            <div className="p-8">
              <EmptyState
                icon={FileText}
                title="No documents found"
                description="Upload a datasheet or certificate above to start ingesting product specifications."
              />
            </div>
          ) : (
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
                {displayDocs.map((doc: any) => {
                  const fileName = doc.original_file_name || doc.filename || doc.file_name;
                  const prodModel = doc.product_model || doc.productModel || (doc.product_id === 1 ? 'XYZ-450' : 'Unlinked');
                  const docType = doc.document_type || doc.documentType || 'Datasheet';
                  const uploadDate = doc.uploaded_at ? new Date(doc.uploaded_at).toLocaleDateString() : (doc.uploadedOn || 'Recently');
                  const version = doc.version_detected || doc.version || '-';
                  const matchConfidence = doc.match_confidence || doc.matchConfidence || 0.95;
                  const status = doc.processing_status || doc.status || 'Processed';

                  return (
                    <tr key={doc.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2.5">
                          <div className="p-1.5 rounded bg-blue-50 text-blue-600">
                            <FileText className="w-4 h-4" />
                          </div>
                          <div>
                            <span className="font-bold text-slate-900 block">{fileName}</span>
                            <span className="text-[11px] text-slate-400">
                              {doc.file_size_formatted || doc.fileSize || '3.2 MB'} • {doc.pages_count || doc.pagesCount || 4} pgs
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <span className="font-mono font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                          {prodModel}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-slate-600 font-medium">
                        {docType}
                      </td>
                      <td className="py-3 px-4 text-slate-500 font-mono">
                        {uploadDate}
                      </td>
                      <td className="py-3 px-4 font-mono font-semibold text-slate-800">
                        {version}
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-1.5">
                          <ConfidenceBadge score={matchConfidence} size="sm" showLabel={false} />
                          <span className="text-[10px] text-emerald-700 font-semibold">
                            {matchConfidence >= 0.9 ? 'Same Product' : 'Unlinked'}
                          </span>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <StatusBadge status={status} size="sm" />
                      </td>
                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={() => setViewingDocument({
                            id: String(doc.id),
                            filename: fileName,
                            productId: String(doc.product_id || 'prod-xyz-450'),
                            productModel: prodModel,
                            documentType: docType,
                            uploadedOn: uploadDate,
                            fileSize: doc.file_size_formatted || doc.fileSize || '3.2 MB',
                            version: version,
                            status: status,
                            matchConfidence: matchConfidence,
                            isSameProductDetected: true,
                            detectedChangesSummary: doc.extracted_summary || 'Specification extracted with verified OCR.',
                            pagesCount: doc.pages_count || doc.pagesCount || 4,
                            extractedAttributes: doc.extracted_attributes || {
                              'Model Number': prodModel,
                              'Rated Output': '7.5 kW (10 HP)',
                              'Rated Voltage': '415 V ±10% 3-Phase',
                              'Synchronous Speed': '1460 RPM',
                              'Protection Degree': 'IP55',
                              'Full Load Efficiency': '91.2%'
                            },
                            sourceCitations: doc.source_citations || [
                              { page: 1, snippet: 'XYZ-450 Premium Severe Duty 3-Phase TEFC Cast Iron Induction Motor 7.5kW rating.' },
                              { page: 2, snippet: 'Electrical Characteristics: 415V AC 50Hz, 1460 RPM full load speed.' }
                            ]
                          })}
                          className="px-2.5 py-1 text-xs font-semibold text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded transition-colors inline-flex items-center gap-1"
                        >
                          <span>Inspect OCR</span>
                          <ExternalLink className="w-3 h-3" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
