'use client';

import React, { useState } from 'react';
import { useApp } from '@/context/AppContext';
import { StatusBadge } from '@/components/common/StatusBadge';
import {
  X,
  FileText,
  Calendar,
  Layers,
  Sparkles,
  ShieldCheck,
  Download,
  Database,
  ExternalLink,
  Code2,
  Copy,
  Check,
  Search,
  BookOpen
} from 'lucide-react';

export const DocumentViewerDrawer: React.FC = () => {
  const { viewingDocument, setViewingDocument } = useApp();
  const [activeTab, setActiveTab] = useState<'attributes' | 'raw_text' | 'citations'>('attributes');
  const [copiedText, setCopiedText] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  if (!viewingDocument) return null;

  const backendDownloadUrl = `http://localhost:8000/uploads/${viewingDocument.filename}`;

  // Helper for raw text extraction
  const rawTextContent = viewingDocument.extractedText || 
    (viewingDocument.sourceCitations && viewingDocument.sourceCitations.length > 0
      ? viewingDocument.sourceCitations.map(c => `[Page ${c.page}] ${c.snippet}`).join('\n\n')
      : `[Document ${viewingDocument.filename}]\nTotal Pages: ${viewingDocument.pagesCount || 1}\nClassification: ${viewingDocument.documentType}\nStatus: ${viewingDocument.status}\n\nKey Attributes Extracted:\n${Object.entries(viewingDocument.extractedAttributes || {}).map(([k, v]) => `• ${k}: ${v}`).join('\n')}`);

  const handleCopyRawText = () => {
    navigator.clipboard.writeText(rawTextContent);
    setCopiedText(true);
    setTimeout(() => setCopiedText(false), 2000);
  };

  const filteredAttributes = Object.entries(viewingDocument.extractedAttributes || {}).filter(([k, v]) => {
    if (!searchTerm) return true;
    return k.toLowerCase().includes(searchTerm.toLowerCase()) || v.toLowerCase().includes(searchTerm.toLowerCase());
  });

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop overlay */}
      <div
        className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity animate-in fade-in"
        onClick={() => setViewingDocument(null)}
      />

      {/* Slide-over Drawer panel */}
      <div className="fixed inset-y-0 right-0 max-w-2xl w-full bg-white shadow-2xl flex flex-col z-50 animate-in slide-in-from-right duration-200">
        
        {/* Drawer Header */}
        <div className="p-6 border-b border-slate-200 flex items-start justify-between bg-slate-50/80">
          <div className="space-y-1 pr-4">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-bold uppercase tracking-wider text-blue-700 bg-blue-100/80 px-2 py-0.5 rounded border border-blue-200 font-mono">
                {viewingDocument.documentType}
              </span>
              <span className="text-xs font-bold text-slate-500 font-mono">
                Doc ID #{viewingDocument.id}
              </span>
              <span className="text-xs font-semibold text-slate-600">
                • {viewingDocument.pagesCount || 1} Page(s)
              </span>
            </div>
            <h2 className="text-lg font-bold text-slate-900 tracking-tight flex items-center gap-2">
              <FileText className="w-5 h-5 text-blue-600 shrink-0" />
              <span>{viewingDocument.filename}</span>
            </h2>
            <p className="text-xs text-slate-500">
              Uploaded on {viewingDocument.uploadedOn} • SHA-256 Verified
            </p>
          </div>

          <button
            onClick={() => setViewingDocument(null)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="px-6 border-b border-slate-200 bg-white flex items-center gap-6 text-xs font-bold">
          <button
            onClick={() => setActiveTab('attributes')}
            className={`py-3 border-b-2 transition-colors flex items-center gap-1.5 ${
              activeTab === 'attributes'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>Extracted Attributes ({Object.keys(viewingDocument.extractedAttributes || {}).length})</span>
          </button>

          <button
            onClick={() => setActiveTab('raw_text')}
            className={`py-3 border-b-2 transition-colors flex items-center gap-1.5 ${
              activeTab === 'raw_text'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Code2 className="w-4 h-4" />
            <span>Raw Extracted Text (OCR & Stream)</span>
          </button>

          <button
            onClick={() => setActiveTab('citations')}
            className={`py-3 border-b-2 transition-colors flex items-center gap-1.5 ${
              activeTab === 'citations'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
            <span>Page Citations ({viewingDocument.sourceCitations?.length || 0})</span>
          </button>
        </div>

        {/* Drawer Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          
          {/* Metadata Card */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 p-3.5 rounded-xl border border-slate-200 text-xs">
            <div>
              <span className="text-slate-400 text-[11px] block">Document ID</span>
              <span className="font-mono font-bold text-slate-800">#{viewingDocument.id}</span>
            </div>
            <div>
              <span className="text-slate-400 text-[11px] block">File Size</span>
              <span className="font-semibold text-slate-800">{viewingDocument.fileSize}</span>
            </div>
            <div>
              <span className="text-slate-400 text-[11px] block">Version Tag</span>
              <span className="font-semibold text-blue-700 font-mono">{viewingDocument.version || '-'}</span>
            </div>
            <div>
              <span className="text-slate-400 text-[11px] block">Status</span>
              <span className="font-semibold text-slate-800">{viewingDocument.status}</span>
            </div>
          </div>

          {/* Traceability Banner */}
          <div className="p-4 rounded-xl bg-slate-100 border border-slate-200 flex items-start gap-3">
            <div className="p-2 rounded-lg bg-white text-slate-700 shadow-2xs shrink-0">
              <Database className="w-4 h-4 text-blue-600" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-slate-900">
                Source Document Retained for Traceability
              </h4>
              <p className="text-xs text-slate-600 mt-0.5 leading-relaxed">
                This authoritative file is stored with SHA-256 cryptographic indexing in the enterprise database. Historical versions remain preserved for compliance.
              </p>
            </div>
          </div>

          {/* TAB 1: EXTRACTED ATTRIBUTES */}
          {activeTab === 'attributes' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                    Extracted Structural Specifications
                  </h4>
                  <p className="text-xs text-slate-500">
                    Discovered {filteredAttributes.length} technical attributes from document
                  </p>
                </div>

                <div className="relative">
                  <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                    placeholder="Filter attributes..."
                    className="pl-8 pr-2.5 py-1 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
              </div>

              {filteredAttributes.length === 0 ? (
                <div className="p-8 text-center bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-500">
                  No attributes matching &ldquo;{searchTerm}&rdquo;
                </div>
              ) : (
                <div className="border border-slate-200 rounded-xl divide-y divide-slate-100 overflow-hidden shadow-2xs">
                  {filteredAttributes.map(([attr, val]) => (
                    <div key={attr} className="flex items-center justify-between p-3 text-xs hover:bg-slate-50 transition-colors">
                      <span className="font-semibold text-slate-700">{attr}</span>
                      <span className="font-mono font-bold text-slate-950 bg-slate-100/80 px-2 py-0.5 rounded border border-slate-200/60">
                        {val}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 2: RAW EXTRACTED TEXT & OCR STREAM */}
          {activeTab === 'raw_text' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                    Extracted Text Stream & OCR Inspection
                  </h4>
                  <p className="text-xs text-slate-500">
                    Full text extracted page-by-page via Python PDF parser
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleCopyRawText}
                  className="px-3 py-1.5 text-xs font-semibold bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-lg transition-colors inline-flex items-center gap-1.5 shadow-2xs"
                >
                  {copiedText ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                      <span className="text-emerald-700 font-bold">Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5 text-slate-500" />
                      <span>Copy Full Text</span>
                    </>
                  )}
                </button>
              </div>

              <div className="bg-slate-900 text-slate-100 rounded-xl p-4 font-mono text-xs overflow-x-auto max-h-96 whitespace-pre-wrap leading-relaxed shadow-inner border border-slate-800">
                {rawTextContent}
              </div>
            </div>
          )}

          {/* TAB 3: PAGE GROUNDING CITATIONS */}
          {activeTab === 'citations' && (
            <div className="space-y-3">
              <div>
                <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                  Page Grounding Citations & Snippets
                </h4>
                <p className="text-xs text-slate-500">
                  Exact text bounding snippets mapped to source document pages
                </p>
              </div>

              {(!viewingDocument.sourceCitations || viewingDocument.sourceCitations.length === 0) ? (
                <div className="p-8 text-center bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-500">
                  No source citations recorded for this document.
                </div>
              ) : (
                <div className="space-y-2.5">
                  {viewingDocument.sourceCitations.map((cite, idx) => (
                    <div key={idx} className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-blue-700 bg-blue-100/80 px-2 py-0.5 rounded font-mono">
                          Page Reference #{cite.page}
                        </span>
                        <span className="text-[11px] font-medium text-emerald-700 inline-flex items-center gap-1">
                          <ShieldCheck className="w-3.5 h-3.5" />
                          Verified Grounding
                        </span>
                      </div>
                      <p className="text-xs text-slate-800 font-mono bg-white p-2.5 rounded border border-slate-200/80 leading-relaxed">
                        &ldquo;{cite.snippet}&rdquo;
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

        </div>

        {/* Drawer Footer */}
        <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between gap-3">
          <a
            href={backendDownloadUrl}
            target="_blank"
            rel="noopener noreferrer"
            download
            className="px-3.5 py-2 text-xs font-semibold bg-white hover:bg-slate-100 text-slate-800 border border-slate-200 rounded-lg transition-colors shadow-2xs inline-flex items-center gap-1.5"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            <span>Download Original File</span>
          </a>

          <button
            onClick={() => setViewingDocument(null)}
            className="px-4 py-2 text-xs font-semibold bg-slate-900 hover:bg-slate-800 text-white rounded-lg transition-colors shadow-xs"
          >
            Close Details
          </button>
        </div>
      </div>
    </div>
  );
};
