'use client';

import React from 'react';
import { FileText, ExternalLink, CheckCircle2, ShieldCheck } from 'lucide-react';
import { useApp } from '@/context/AppContext';

interface SourceEvidenceCardProps {
  documentName: string;
  pageNumber?: number;
  snippet: string;
  confidence?: number;
  verified?: boolean;
  highlightTerm?: string;
  onOpenDoc?: () => void;
}

export const SourceEvidenceCard: React.FC<SourceEvidenceCardProps> = ({
  documentName,
  pageNumber,
  snippet,
  confidence = 0.98,
  verified = true,
  onOpenDoc
}) => {
  const { documents, setViewingDocument } = useApp();

  const handleOpen = () => {
    if (onOpenDoc) {
      onOpenDoc();
      return;
    }
    const found = documents.find(d => d.filename.toLowerCase() === documentName.toLowerCase());
    if (found) {
      setViewingDocument(found);
    } else {
      // Fallback
      setViewingDocument(documents[0]);
    }
  };

  return (
    <div className="bg-slate-50 border border-slate-200/90 rounded-lg p-3.5 hover:bg-slate-100/70 transition-colors">
      <div className="flex items-center justify-between gap-2 pb-2 border-b border-slate-200/60">
        <div className="flex items-center gap-2 min-w-0">
          <div className="p-1 rounded bg-blue-100 text-blue-700">
            <FileText className="w-3.5 h-3.5" />
          </div>
          <span className="text-xs font-semibold text-slate-800 truncate">
            {documentName}
          </span>
          {pageNumber && (
            <span className="text-[11px] px-1.5 py-0.5 rounded bg-slate-200 text-slate-700 font-mono font-medium">
              Page {pageNumber}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {verified && (
            <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
              <ShieldCheck className="w-3 h-3" />
              Verified
            </span>
          )}
          <button
            onClick={handleOpen}
            className="text-[11px] font-semibold text-blue-600 hover:text-blue-800 inline-flex items-center gap-1 hover:underline"
          >
            <span>View Source</span>
            <ExternalLink className="w-3 h-3" />
          </button>
        </div>
      </div>

      <div className="mt-2.5 bg-white rounded p-2.5 border border-slate-200/70 text-xs text-slate-700 leading-relaxed font-mono">
        <span className="text-slate-400 select-none mr-2 font-sans font-bold text-[10px] uppercase">
          Excerpt:
        </span>
        &ldquo;{snippet}&rdquo;
      </div>
    </div>
  );
};
