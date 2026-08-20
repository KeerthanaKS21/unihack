'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '@/context/AppContext';
import { PageHeader } from '@/components/layout/PageHeader';
import { StatusBadge } from '@/components/common/StatusBadge';
import { EmptyState } from '@/components/common/EmptyState';
import { api } from '@/lib/api';
import {
  UploadCloud,
  FileText,
  CheckCircle2,
  AlertCircle,
  FileSpreadsheet,
  Image as ImageIcon,
  ShieldCheck,
  FileCode,
  File as GenericFileIcon,
  Search,
  RefreshCw,
  Download,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  X,
  Layers,
  ArrowRight,
  Loader2,
  Trash2
} from 'lucide-react';
import Link from 'next/link';

// Supported file extensions & MIME types for Step 1
const ALLOWED_EXTENSIONS = ['.pdf', '.xlsx', '.xls', '.csv', '.png', '.jpg', '.jpeg', '.docx'];

const ALLOWED_MIME_TYPES = [
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-excel',
  'text/csv',
  'text/plain',
  'application/csv',
  'image/png',
  'image/jpeg',
  'image/jpg',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/msword',
  'application/octet-stream'
];

const MAX_FILE_SIZE_BYTES = 50 * 1024 * 1024; // 50MB

interface StagedFile {
  file: File;
  name: string;
  sizeFormatted: string;
  typeCategory: string;
}

export default function UploadIngestPage() {
  const {
    documents: fallbackDocs,
    setViewingDocument,
    showToast
  } = useApp();

  // Filter & Search & Pagination State
  const [filterType, setFilterType] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize] = useState<number>(10);
  const [totalDocsCount, setTotalDocsCount] = useState<number>(0);

  // Real Database Documents State
  const [dbDocuments, setDbDocuments] = useState<any[]>([]);
  const [loadingDocs, setLoadingDocs] = useState<boolean>(true);
  const [fetchError, setFetchError] = useState<string | null>(null);

  // Staged File for Upload (Before Submission)
  const [stagedFile, setStagedFile] = useState<StagedFile | null>(null);
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [uploadSuccessMsg, setUploadSuccessMsg] = useState<string | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [isDragOver, setIsDragOver] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Format bytes helper
  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  // Determine file category for badge/icon
  const getFileTypeCategory = (fileName: string): string => {
    const ext = '.' + (fileName.split('.').pop() || '').toLowerCase();
    if (ext === '.pdf') return 'PDF';
    if (['.xlsx', '.xls'].includes(ext)) return 'Excel';
    if (ext === '.csv') return 'CSV';
    if (['.png', '.jpg', '.jpeg'].includes(ext)) return 'Image';
    if (ext === '.docx') return 'DOCX';
    return 'Document';
  };

  // Icon helper based on document type
  const getDocIcon = (typeOrExt: string) => {
    const t = (typeOrExt || '').toUpperCase();
    if (t.includes('PDF') || t.includes('DATASHEET')) {
      return <FileText className="w-4 h-4 text-rose-600" />;
    }
    if (t.includes('EXCEL') || t.includes('XLS') || t.includes('CSV') || t.includes('CATALOG') || t.includes('SUPPLIER')) {
      return <FileSpreadsheet className="w-4 h-4 text-emerald-600" />;
    }
    if (t.includes('IMAGE') || t.includes('PNG') || t.includes('JPG')) {
      return <ImageIcon className="w-4 h-4 text-sky-600" />;
    }
    if (t.includes('DOCX') || t.includes('MANUAL')) {
      return <FileCode className="w-4 h-4 text-blue-600" />;
    }
    if (t.includes('CERTIFICATE')) {
      return <ShieldCheck className="w-4 h-4 text-amber-600" />;
    }
    return <GenericFileIcon className="w-4 h-4 text-slate-500" />;
  };

  // Fetch real documents from FastAPI backend
  const fetchUploadedDocuments = async () => {
    setLoadingDocs(true);
    setFetchError(null);
    try {
      const res = await api.getDocuments({
        page: currentPage,
        limit: pageSize,
        search: searchQuery || undefined,
        document_type: filterType !== 'all' ? filterType.toUpperCase() : undefined,
        processing_status: filterStatus !== 'all' ? filterStatus.toUpperCase() : undefined
      });
      if (res && Array.isArray(res.items)) {
        setDbDocuments(res.items);
        setTotalDocsCount(res.total || res.items.length);
      }
    } catch (err: any) {
      console.warn('Backend documents fetch failed, using fallback:', err);
      setFetchError('Unable to connect to backend repository. Showing local cache.');
      setDbDocuments(fallbackDocs);
      setTotalDocsCount(fallbackDocs.length);
    } finally {
      setLoadingDocs(false);
    }
  };

  const handleDeleteDocument = async (docId: number, docName: string) => {
    if (!window.confirm(`Are you sure you want to delete "${docName}" from upload history?`)) {
      return;
    }
    try {
      await api.deleteDocument(docId);
      showToast({
        type: 'success',
        title: 'Document Deleted',
        message: `"${docName}" removed from repository.`
      });
      fetchUploadedDocuments();
    } catch (err: any) {
      showToast({
        type: 'error',
        title: 'Delete Failed',
        message: err.message || 'Could not delete document'
      });
    }
  };

  useEffect(() => {
    fetchUploadedDocuments();
  }, [filterType, filterStatus, searchQuery, currentPage]);

  // Client-Side File Validation
  const validateSelectedFile = (file: File): string | null => {
    const ext = '.' + (file.name.split('.').pop() || '').toLowerCase();
    
    // 1. Extension check
    if (!ALLOWED_EXTENSIONS.includes(ext)) {
      return `Unsupported file type "${ext}". Please upload PDF, Excel, CSV, image or DOCX files.`;
    }

    // 2. MIME type check if present
    if (file.type && !ALLOWED_MIME_TYPES.includes(file.type.toLowerCase())) {
      const isAllowed = ALLOWED_EXTENSIONS.some(allowedExt => file.name.toLowerCase().endsWith(allowedExt));
      if (!isAllowed) {
        return `Unsupported file format "${file.type}". Please upload PDF, Excel, CSV, image or DOCX files.`;
      }
    }

    // 3. File Size check
    if (file.size > MAX_FILE_SIZE_BYTES) {
      return `File exceeds the maximum allowed size of 50 MB (${formatBytes(file.size)} received).`;
    }

    if (file.size === 0) {
      return 'Selected file is empty (0 bytes). Please upload a valid document.';
    }

    return null;
  };

  // Stage a file when user selects/drops it
  const stageFile = (file: File) => {
    setValidationError(null);
    setUploadSuccessMsg(null);

    const errorMsg = validateSelectedFile(file);
    if (errorMsg) {
      setValidationError(errorMsg);
      showToast({
        type: 'error',
        title: 'Validation Error',
        message: errorMsg
      });
      return;
    }

    setStagedFile({
      file,
      name: file.name,
      sizeFormatted: formatBytes(file.size),
      typeCategory: getFileTypeCategory(file.name)
    });
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      stageFile(e.target.files[0]);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      stageFile(e.dataTransfer.files[0]);
    }
  };

  // Submit Staged File to POST /api/documents/upload
  const handleUploadStagedFile = async () => {
    if (!stagedFile) return;

    setIsUploading(true);
    setValidationError(null);
    setUploadSuccessMsg(null);

    try {
      const res = await api.uploadDocument(stagedFile.file, undefined, 'Engineering Lead');
      
      setUploadSuccessMsg(`✓ Uploaded successfully: "${stagedFile.name}" stored and indexed in database (Doc ID #${res.id}).`);
      showToast({
        type: 'success',
        title: 'Uploaded Successfully',
        message: `${stagedFile.name} added to repository.`
      });

      // Clear staged file
      setStagedFile(null);
      if (fileInputRef.current) fileInputRef.current.value = '';

      // Refresh Upload History
      await fetchUploadedDocuments();

    } catch (err: any) {
      const msg = err.message || 'Upload failed. Please try again.';
      setValidationError(msg);
      showToast({
        type: 'error',
        title: 'Upload Failed',
        message: msg
      });
    } finally {
      setIsUploading(false);
    }
  };

  // Quick Test Trigger Helper for multi-formats
  const handleQuickDemoUpload = (sampleName: string) => {
    const ext = '.' + (sampleName.split('.').pop() || '').toLowerCase();
    let mime = 'application/octet-stream';
    if (ext === '.pdf') mime = 'application/pdf';
    else if (ext === '.xlsx') mime = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
    else if (ext === '.csv') mime = 'text/csv';
    else if (ext === '.png') mime = 'image/png';
    else if (ext === '.jpg') mime = 'image/jpeg';
    else if (ext === '.docx') mime = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';

    const dummyContent = `Industrial Product Intelligence Sample File: ${sampleName}`;
    const blob = new Blob([dummyContent], { type: mime });
    const file = new File([blob], sampleName, { type: mime });
    stageFile(file);
  };

  const totalPages = Math.ceil(totalDocsCount / pageSize) || 1;
  const displayDocs = dbDocuments;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Upload & Ingest Product Documents"
        subtitle="Multi-format industrial document intake supporting datasheets, supplier Excel files, CSVs, nameplate images, and specifications."
        breadcrumbs={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Upload & Ingest' }
        ]}
        badge="Multi-Format Storage"
        badgeVariant="ai"
      />

      {/* Validation or Fetch Error Banner */}
      {(validationError || fetchError) && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold flex items-center justify-between animate-in fade-in">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{validationError || fetchError}</span>
          </div>
          <button
            onClick={() => { setValidationError(null); setFetchError(null); }}
            className="text-rose-600 hover:underline text-xs"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Upload Success Banner */}
      {uploadSuccessMsg && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center justify-between animate-in fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{uploadSuccessMsg}</span>
          </div>
          <button
            onClick={() => setUploadSuccessMsg(null)}
            className="text-emerald-600 hover:underline text-xs"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SECTION 1: UPLOAD NEW DOCUMENT (MULTI-FORMAT DRAG & DROP)                 */}
      {/* ========================================================================= */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-6">
        <div>
          <h3 className="text-base font-bold text-slate-900 tracking-tight">
            Upload Product Document
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Safely upload engineering datasheets, supplier rate sheets, scanned certificates, and drawings.
          </p>
        </div>

        {/* Hidden File Input */}
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileInputChange}
          accept=".pdf,.xlsx,.xls,.csv,.png,.jpg,.jpeg,.docx"
          disabled={isUploading}
          className="hidden"
        />

        {/* Drag-and-Drop Dropzone */}
        <div
          onClick={() => !isUploading && fileInputRef.current?.click()}
          onDragOver={e => { e.preventDefault(); setIsDragOver(true); }}
          onDragLeave={() => setIsDragOver(false)}
          onDrop={handleDrop}
          className={`border-2 border-dashed rounded-2xl p-8 text-center transition-all cursor-pointer group ${
            isDragOver
              ? 'border-blue-600 bg-blue-50/50 scale-[1.01]'
              : 'border-slate-300 hover:border-blue-500 bg-slate-50/60 hover:bg-blue-50/20'
          } ${isUploading ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          <div className="w-14 h-14 mx-auto rounded-2xl bg-blue-100 group-hover:bg-blue-200 text-blue-600 flex items-center justify-center transition-colors mb-3">
            {isUploading ? (
              <Loader2 className="w-7 h-7 animate-spin text-blue-600" />
            ) : (
              <UploadCloud className="w-7 h-7" />
            )}
          </div>
          
          <h4 className="text-sm font-bold text-slate-900">
            {isUploading ? 'Uploading document to secure storage...' : 'Drop your product document here'}
          </h4>
          
          <p className="text-xs text-blue-600 font-semibold mt-1">
            or browse files
          </p>

          <div className="mt-3 flex items-center justify-center gap-3 text-[11px] text-slate-500 font-medium flex-wrap">
            <span>Supported formats: <strong className="text-slate-700">PDF, XLSX, XLS, CSV, PNG, JPG, JPEG, DOCX</strong></span>
            <span>•</span>
            <span>Maximum file size: <strong className="text-slate-700">50 MB</strong></span>
          </div>

          {/* Quick Test Multi-Format Pills */}
          <div className="mt-5 pt-5 border-t border-slate-200/80" onClick={e => e.stopPropagation()}>
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-2">
              ⚡ Quick Multi-Format Test Files (Click to stage for upload)
            </span>
            <div className="flex items-center justify-center gap-2 flex-wrap">
              <button
                type="button"
                onClick={() => handleQuickDemoUpload('technical_spec_2026.pdf')}
                disabled={isUploading}
                className="px-3 py-1.5 bg-white hover:bg-rose-50 text-rose-700 border border-rose-200 text-xs font-semibold rounded-lg shadow-2xs transition-colors inline-flex items-center gap-1.5"
              >
                <FileText className="w-3.5 h-3.5" />
                <span>PDF: technical_spec_2026.pdf</span>
              </button>

              <button
                type="button"
                onClick={() => handleQuickDemoUpload('supplier_catalog_abb.xlsx')}
                disabled={isUploading}
                className="px-3 py-1.5 bg-white hover:bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-semibold rounded-lg shadow-2xs transition-colors inline-flex items-center gap-1.5"
              >
                <FileSpreadsheet className="w-3.5 h-3.5" />
                <span>Excel: supplier_catalog.xlsx</span>
              </button>

              <button
                type="button"
                onClick={() => handleQuickDemoUpload('motor_inventory_rate_sheet.csv')}
                disabled={isUploading}
                className="px-3 py-1.5 bg-white hover:bg-teal-50 text-teal-700 border border-teal-200 text-xs font-semibold rounded-lg shadow-2xs transition-colors inline-flex items-center gap-1.5"
              >
                <FileSpreadsheet className="w-3.5 h-3.5" />
                <span>CSV: motor_inventory.csv</span>
              </button>

              <button
                type="button"
                onClick={() => handleQuickDemoUpload('motor_nameplate_photo.jpg')}
                disabled={isUploading}
                className="px-3 py-1.5 bg-white hover:bg-sky-50 text-sky-700 border border-sky-200 text-xs font-semibold rounded-lg shadow-2xs transition-colors inline-flex items-center gap-1.5"
              >
                <ImageIcon className="w-3.5 h-3.5" />
                <span>JPG: nameplate_photo.jpg</span>
              </button>

              <button
                type="button"
                onClick={() => handleQuickDemoUpload('product_user_manual.docx')}
                disabled={isUploading}
                className="px-3 py-1.5 bg-white hover:bg-blue-50 text-blue-700 border border-blue-200 text-xs font-semibold rounded-lg shadow-2xs transition-colors inline-flex items-center gap-1.5"
              >
                <FileCode className="w-3.5 h-3.5" />
                <span>DOCX: product_manual.docx</span>
              </button>
            </div>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* SECTION 2: STAGED FILE PREVIEW & UPLOAD CONFIRMATION                      */}
        {/* ========================================================================= */}
        {stagedFile && (
          <div className="p-4 rounded-xl bg-blue-50/80 border-2 border-blue-400 flex flex-col sm:flex-row sm:items-center justify-between gap-4 animate-in fade-in">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-white text-blue-700 shadow-xs shrink-0">
                {getDocIcon(stagedFile.typeCategory)}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-slate-900 text-sm">{stagedFile.name}</span>
                  <span className="text-[11px] font-mono font-bold px-2 py-0.5 rounded bg-blue-100 text-blue-800 border border-blue-200 uppercase">
                    {stagedFile.typeCategory}
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  Size: <strong className="text-slate-700">{stagedFile.sizeFormatted}</strong> • Ready for secure ingestion
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => setStagedFile(null)}
                disabled={isUploading}
                className="px-3 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-white/80 rounded-lg border border-slate-200 transition-colors inline-flex items-center gap-1"
              >
                <X className="w-3.5 h-3.5" />
                <span>Remove</span>
              </button>

              <button
                type="button"
                onClick={handleUploadStagedFile}
                disabled={isUploading}
                className="px-4 py-2 text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow-xs transition-colors inline-flex items-center gap-1.5"
              >
                {isUploading ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Uploading...</span>
                  </>
                ) : (
                  <>
                    <UploadCloud className="w-3.5 h-3.5" />
                    <span>Upload Document</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* SECTION 3: UPLOAD HISTORY                                                 */}
      {/* ========================================================================= */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold text-slate-900 tracking-tight">
                Upload History
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
              Authoritative files stored in database and indexed into the enterprise knowledge repository ({totalDocsCount} total files).
            </p>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            {/* Search */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => { setSearchQuery(e.target.value); setCurrentPage(1); }}
                placeholder="Search file or type..."
                className="pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>

            {/* Document Type Filter */}
            <select
              value={filterType}
              onChange={e => { setFilterType(e.target.value); setCurrentPage(1); }}
              className="px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-700 font-medium focus:outline-none"
            >
              <option value="all">All Document Types</option>
              <option value="datasheet">Datasheets</option>
              <option value="supplier_file">Supplier Files</option>
              <option value="catalog">Catalogs</option>
              <option value="certificate">Certificates</option>
              <option value="image">Images</option>
              <option value="manual">Manuals</option>
            </select>

            {/* Status Filter */}
            <select
              value={filterStatus}
              onChange={e => { setFilterStatus(e.target.value); setCurrentPage(1); }}
              className="px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-700 font-medium focus:outline-none"
            >
              <option value="all">All Statuses</option>
              <option value="uploaded">Uploaded</option>
              <option value="processed">Processed</option>
              <option value="matched">Matched</option>
            </select>
          </div>
        </div>

        {/* History Table */}
        <div className="border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
          {loadingDocs ? (
            <div className="p-12 text-center text-slate-400 space-y-3">
              <Loader2 className="w-6 h-6 animate-spin mx-auto text-blue-600" />
              <p className="text-xs">Loading documents from PostgreSQL repository...</p>
            </div>
          ) : displayDocs.length === 0 ? (
            <div className="p-8">
              <EmptyState
                icon={FileText}
                title="No documents found"
                description="Upload a document above to start populating your repository."
              />
            </div>
          ) : (
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">File</th>
                  <th className="py-3 px-4">Type</th>
                  <th className="py-3 px-4">Size</th>
                  <th className="py-3 px-4">Uploaded At</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {displayDocs.map((doc: any) => {
                  const fileName = doc.original_file_name || doc.filename || doc.file_name;
                  const prodModel = doc.product_model || doc.productModel || (doc.product_id === 1 ? 'XYZ-450' : 'Unlinked');
                  const docType = doc.document_type || doc.documentType || 'DATASHEET';
                  const uploadDate = doc.uploaded_at
                    ? new Date(doc.uploaded_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
                    : (doc.uploadedOn || 'Aug 18, 2026');
                  const sizeFormatted = doc.file_size_formatted || doc.fileSize || '1.2 MB';
                  const status = doc.processing_status || doc.status || 'Uploaded';
                  const downloadUrl = `http://localhost:8000/uploads/${doc.file_name || fileName}`;

                  const openDetails = () => setViewingDocument({
                    id: String(doc.id),
                    filename: fileName,
                    productId: String(doc.product_id || 'prod-xyz-450'),
                    productModel: prodModel,
                    documentType: docType,
                    uploadedOn: uploadDate,
                    fileSize: sizeFormatted,
                    version: doc.version_detected || doc.version || '-',
                    status: status,
                    matchConfidence: doc.match_confidence || doc.matchConfidence || 0.95,
                    isSameProductDetected: true,
                    detectedChangesSummary: doc.extracted_summary || 'Document stored in repository with verified SHA-256 checksum.',
                    pagesCount: doc.pages_count || doc.pagesCount || 1,
                    extractedAttributes: (doc.extracted_attributes && Object.keys(doc.extracted_attributes).length > 0)
                      ? doc.extracted_attributes
                      : {
                          'Original File': fileName,
                          'Document Type': docType,
                          'File Size': sizeFormatted,
                          'Storage Status': 'Persisted in Database'
                        },
                    sourceCitations: (doc.source_citations && doc.source_citations.length > 0)
                      ? doc.source_citations
                      : [
                          { page: 1, snippet: `Authoritative ${docType} document retained for traceability.` }
                        ],
                    extractedText: doc.extracted_text
                  });

                  return (
                    <tr key={doc.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2.5">
                          <div className="p-1.5 rounded bg-slate-100">
                            {getDocIcon(docType)}
                          </div>
                          <div>
                            <span className="font-bold text-slate-900 block">{fileName}</span>
                            <span className="text-[11px] text-slate-400 font-mono">
                              Doc ID #{doc.id}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <span className="font-mono font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded border border-slate-200 text-[11px] uppercase">
                          {docType}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-slate-600 font-mono">
                        {sizeFormatted}
                      </td>
                      <td className="py-3 px-4 text-slate-500 font-mono">
                        {uploadDate}
                      </td>
                      <td className="py-3 px-4">
                        <StatusBadge status={status} size="sm" />
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={openDetails}
                            className="px-2.5 py-1 text-xs font-semibold text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded transition-colors inline-flex items-center gap-1"
                          >
                            <span>View</span>
                            <ExternalLink className="w-3 h-3" />
                          </button>
                          
                          <a
                            href={downloadUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            download
                            title="Download document file"
                            className="p-1 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded transition-colors"
                          >
                            <Download className="w-3.5 h-3.5" />
                          </a>

                          <button
                            onClick={() => handleDeleteDocument(doc.id, fileName)}
                            title="Delete document"
                            className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        {/* Pagination Controls */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between pt-2 text-xs text-slate-500">
            <span>
              Showing page <strong className="text-slate-800">{currentPage}</strong> of <strong className="text-slate-800">{totalPages}</strong> ({totalDocsCount} total)
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="px-3 py-1 bg-slate-100 hover:bg-slate-200 disabled:opacity-40 disabled:hover:bg-slate-100 rounded-lg font-semibold text-slate-700 transition-colors inline-flex items-center gap-1"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
                <span>Previous</span>
              </button>
              <button
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="px-3 py-1 bg-slate-100 hover:bg-slate-200 disabled:opacity-40 disabled:hover:bg-slate-100 rounded-lg font-semibold text-slate-700 transition-colors inline-flex items-center gap-1"
              >
                <span>Next</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
