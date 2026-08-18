'use client';

import React from 'react';
import { useApp } from '@/context/AppContext';
import {
  X,
  FileText,
  ShieldCheck,
  Calendar,
  Layers,
  Sparkles,
  ExternalLink,
  Download,
  Info,
  Hash,
  Database,
  CheckCircle2
} from 'lucide-react';
import { StatusBadge } from '@/components/common/StatusBadge';
import { ConfidenceBadge } from '@/components/common/ConfidenceBadge';

export const DocumentViewerDrawer: React.FC = () => {
  const { viewingDocument, setViewingDocument } = useApp();

  if (!viewingDocument) return null;

  const backendDownloadUrl = `http://localhost:8000/uploads/${viewingDocument.filename}`;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="absolute inset-y-0 right-0 max-w-2xl w-full bg-white shadow-2xl border-l border-slate-200 flex flex-col transform animate-in slide-in-from-right duration-300">
        {/* Drawer Header */}
        <div className="p-6 border-b border-slate-200 bg-slate-50 flex items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="p-3 rounded-xl bg-blue-100 text-blue-700 shrink-0">
              <FileText className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-blue-50 text-blue-800 border border-blue-200 font-mono uppercase">
                  {viewingDocument.documentType}
                </span>
                <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200 font-mono">
                  ID: #{viewingDocument.id}
                </span>
                <StatusBadge status={viewingDocument.status} />
                <ConfidenceBadge score={viewingDocument.matchConfidence} />
              </div>
              <h2 className="text-lg font-bold text-slate-900 mt-1.5 break-all">
                {viewingDocument.filename}
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Product Link: <span className="font-bold text-slate-800">{viewingDocument.productModel || 'Unlinked / New Record'}</span> • Ingested: {viewingDocument.uploadedOn}
              </p>
            </div>
          </div>

          <button
            onClick={() => setViewingDocument(null)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors"
          >
            <X className="w-5 h-5" />
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
                This authoritative file is stored with SHA-256 cryptographic indexing in the enterprise database. Historical versions (e.g. v1 legacy vs v2 updated specs) are permanently preserved.
              </p>
            </div>
          </div>

          {/* AI Match & Changes Banner if available */}
          {viewingDocument.detectedChangesSummary && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
              <div className="flex items-center gap-2 text-amber-800 font-bold text-xs">
                <Sparkles className="w-4 h-4 text-amber-600" />
                <span>Document Processing & Attribute Indexing</span>
              </div>
              <p className="mt-1 text-xs text-amber-900 leading-relaxed font-medium">
                {viewingDocument.detectedChangesSummary}
              </p>
            </div>
          )}

          {/* Extracted Specifications Key-Value Pairs */}
          {viewingDocument.extractedAttributes && Object.keys(viewingDocument.extractedAttributes).length > 0 && (
            <div>
              <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-2 flex items-center justify-between">
                <span>Extracted Structural Attributes</span>
                <span className="text-[10px] text-slate-400 font-normal">Parsed via Document Pipeline</span>
              </h4>
              <div className="border border-slate-200 rounded-xl divide-y divide-slate-100 overflow-hidden shadow-2xs">
                {Object.entries(viewingDocument.extractedAttributes).map(([attr, val]) => (
                  <div key={attr} className="flex items-center justify-between p-2.5 text-xs hover:bg-slate-50">
                    <span className="font-semibold text-slate-600">{attr}</span>
                    <span className="font-mono font-bold text-slate-900">{val}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Page-by-Page Source Citations if present */}
          {viewingDocument.sourceCitations && viewingDocument.sourceCitations.length > 0 && (
            <div>
              <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-2">
                Page Grounding Citations & Text Snippets
              </h4>
              <div className="space-y-2.5">
                {viewingDocument.sourceCitations.map((cite, idx) => (
                  <div key={idx} className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-blue-700 bg-blue-100/60 px-2 py-0.5 rounded font-mono">
                        Page Reference #{cite.page}
                      </span>
                      <span className="text-[11px] font-medium text-emerald-700 inline-flex items-center gap-1">
                        <ShieldCheck className="w-3.5 h-3.5" />
                        Verified Grounding
                      </span>
                    </div>
                    <p className="text-xs text-slate-700 font-mono bg-white p-2.5 rounded border border-slate-200/80 leading-relaxed">
                      &ldquo;{cite.snippet}&rdquo;
                    </p>
                  </div>
                ))}
              </div>
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
