'use client';

import React, { useState, useEffect } from 'react';
import { useApp } from '@/context/AppContext';
import {
  Search,
  X,
  FileText,
  Cpu,
  Truck,
  ShieldCheck,
  AlertCircle,
  ArrowRight,
  Sparkles
} from 'lucide-react';
import { useRouter } from 'next/navigation';

export const GlobalSearchModal: React.FC = () => {
  const {
    globalSearchOpen,
    setGlobalSearchOpen,
    products,
    documents,
    catalogIssues,
    supplierOffers,
    setViewingProduct,
    setViewingDocument
  } = useApp();

  const [query, setQuery] = useState('');
  const router = useRouter();

  // Keyboard shortcut ⌘K / Ctrl+K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setGlobalSearchOpen(!globalSearchOpen);
      }
      if (e.key === 'Escape' && globalSearchOpen) {
        setGlobalSearchOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [globalSearchOpen, setGlobalSearchOpen]);

  if (!globalSearchOpen) return null;

  const q = query.toLowerCase().trim();

  const matchedProducts = products.filter(
    p => p.model.toLowerCase().includes(q) || p.name.toLowerCase().includes(q) || p.manufacturer.toLowerCase().includes(q)
  );

  const matchedDocs = documents.filter(
    d => d.filename.toLowerCase().includes(q) || (d.productModel && d.productModel.toLowerCase().includes(q))
  );

  const matchedIssues = catalogIssues.filter(
    i => i.title.toLowerCase().includes(q) || i.productModel.toLowerCase().includes(q) || (i.field && i.field.toLowerCase().includes(q))
  );

  const matchedSuppliers = supplierOffers.filter(
    s => s.supplierName.toLowerCase().includes(q) || s.productModel.toLowerCase().includes(q)
  );

  const totalResults = matchedProducts.length + matchedDocs.length + matchedIssues.length + matchedSuppliers.length;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center p-4 pt-20 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl border border-slate-200 overflow-hidden transform animate-in zoom-in-95 duration-200">
        {/* Search Input */}
        <div className="p-4 border-b border-slate-200 flex items-center gap-3">
          <Search className="w-5 h-5 text-blue-600 shrink-0" />
          <input
            type="text"
            autoFocus
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search products (XYZ-450), datasheets, supplier specs, issues, compliance..."
            className="w-full bg-transparent text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none"
          />
          {query && (
            <button onClick={() => setQuery('')} className="text-slate-400 hover:text-slate-600 p-1">
              <X className="w-4 h-4" />
            </button>
          )}
          <kbd className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-100 text-slate-500 border border-slate-200">
            ESC
          </kbd>
        </div>

        {/* Results List */}
        <div className="max-h-96 overflow-y-auto p-3 space-y-4">
          {/* Quick Suggestions when empty */}
          {!q && (
            <div className="p-2 space-y-3">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                Suggested Quick Jumps
              </span>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => {
                    setGlobalSearchOpen(false);
                    router.push('/synchronization');
                  }}
                  className="flex items-center gap-2 p-2.5 rounded-lg border border-slate-200/80 hover:border-blue-300 hover:bg-blue-50/50 text-left transition-colors"
                >
                  <Cpu className="w-4 h-4 text-blue-600" />
                  <div>
                    <div className="text-xs font-bold text-slate-800">XYZ-450 Version 2.0</div>
                    <div className="text-[11px] text-slate-500">Inspect 3 pending changes</div>
                  </div>
                </button>

                <button
                  onClick={() => {
                    setGlobalSearchOpen(false);
                    router.push('/change-impact');
                  }}
                  className="flex items-center gap-2 p-2.5 rounded-lg border border-slate-200/80 hover:border-blue-300 hover:bg-blue-50/50 text-left transition-colors"
                >
                  <Sparkles className="w-4 h-4 text-rose-600" />
                  <div>
                    <div className="text-xs font-bold text-slate-800">Change Impact Matrix</div>
                    <div className="text-[11px] text-slate-500">4 unreviewed domain impacts</div>
                  </div>
                </button>

                <button
                  onClick={() => {
                    setGlobalSearchOpen(false);
                    router.push('/catalog-issues?filter=conflict');
                  }}
                  className="flex items-center gap-2 p-2.5 rounded-lg border border-slate-200/80 hover:border-blue-300 hover:bg-blue-50/50 text-left transition-colors"
                >
                  <AlertCircle className="w-4 h-4 text-purple-600" />
                  <div>
                    <div className="text-xs font-bold text-slate-800">Voltage Conflict</div>
                    <div className="text-[11px] text-slate-500">Datasheet 415V vs Web 440V</div>
                  </div>
                </button>

                <button
                  onClick={() => {
                    setGlobalSearchOpen(false);
                    router.push('/quotes');
                  }}
                  className="flex items-center gap-2 p-2.5 rounded-lg border border-slate-200/80 hover:border-blue-300 hover:bg-blue-50/50 text-left transition-colors"
                >
                  <FileText className="w-4 h-4 text-emerald-600" />
                  <div>
                    <div className="text-xs font-bold text-slate-800">Quotation Q-2026-9042</div>
                    <div className="text-[11px] text-slate-500">20 Units Apex Heavy Eng</div>
                  </div>
                </button>
              </div>
            </div>
          )}

          {/* Products */}
          {matchedProducts.length > 0 && (
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 px-2 block mb-1">
                Products ({matchedProducts.length})
              </span>
              <div className="space-y-1">
                {matchedProducts.map(prod => (
                  <div
                    key={prod.id}
                    onClick={() => {
                      setViewingProduct(prod);
                      setGlobalSearchOpen(false);
                    }}
                    className="flex items-center justify-between p-2.5 rounded-lg hover:bg-slate-100 cursor-pointer transition-colors"
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="p-1.5 rounded bg-blue-100 text-blue-700">
                        <Cpu className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="text-xs font-bold text-slate-900">{prod.name}</div>
                        <div className="text-[11px] text-slate-500 font-mono">
                          {prod.manufacturer} • {prod.specs.power} • {prod.specs.voltage} • {prod.specs.speed}
                        </div>
                      </div>
                    </div>
                    <span className="text-[11px] font-semibold text-blue-600 hover:underline">
                      View 360° Specs →
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Documents */}
          {matchedDocs.length > 0 && (
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 px-2 block mb-1">
                Documents & Datasheets ({matchedDocs.length})
              </span>
              <div className="space-y-1">
                {matchedDocs.map(doc => (
                  <div
                    key={doc.id}
                    onClick={() => {
                      setViewingDocument(doc);
                      setGlobalSearchOpen(false);
                    }}
                    className="flex items-center justify-between p-2.5 rounded-lg hover:bg-slate-100 cursor-pointer transition-colors"
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="p-1.5 rounded bg-amber-100 text-amber-700">
                        <FileText className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="text-xs font-bold text-slate-900">{doc.filename}</div>
                        <div className="text-[11px] text-slate-500">
                          {doc.documentType} • {doc.productModel || 'Unlinked'} • {doc.fileSize}
                        </div>
                      </div>
                    </div>
                    <span className="text-[11px] font-semibold text-blue-600 hover:underline">
                      Inspect OCR Evidence →
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Issues */}
          {matchedIssues.length > 0 && (
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 px-2 block mb-1">
                Catalog Issues ({matchedIssues.length})
              </span>
              <div className="space-y-1">
                {matchedIssues.map(iss => (
                  <div
                    key={iss.id}
                    onClick={() => {
                      setGlobalSearchOpen(false);
                      router.push(`/catalog-issues?filter=${iss.issueType}`);
                    }}
                    className="flex items-center justify-between p-2.5 rounded-lg hover:bg-slate-100 cursor-pointer transition-colors"
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="p-1.5 rounded bg-purple-100 text-purple-700">
                        <AlertCircle className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="text-xs font-bold text-slate-900">{iss.title}</div>
                        <div className="text-[11px] text-slate-500">{iss.description}</div>
                      </div>
                    </div>
                    <span className="text-[11px] font-semibold text-purple-600 hover:underline">
                      Resolve Issue →
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {q && totalResults === 0 && (
            <div className="text-center py-8 text-slate-500 text-xs">
              No direct records found for &ldquo;{query}&rdquo;. Try searching for &ldquo;XYZ-450&rdquo;, &ldquo;voltage&rdquo;, or &ldquo;datasheet&rdquo;.
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-[11px] text-slate-500">
          <span>Enterprise Cross-Module Federated Index</span>
          <span>Press ESC to close</span>
        </div>
      </div>
    </div>
  );
};
