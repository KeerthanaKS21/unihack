'use client';

import React, { useState } from 'react';
import { useApp } from '@/context/AppContext';
import {
  X,
  Cpu,
  Layers,
  FileText,
  ShieldCheck,
  Zap,
  Activity,
  History,
  Truck,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  ExternalLink
} from 'lucide-react';
import { StatusBadge } from '@/components/common/StatusBadge';
import { ConfidenceBadge } from '@/components/common/ConfidenceBadge';
import Link from 'next/link';

export const ProductDetailModal: React.FC = () => {
  const {
    viewingProduct,
    setViewingProduct,
    documents,
    setViewingDocument,
    changeImpacts,
    supplierOffers
  } = useApp();

  const [activeTab, setActiveTab] = useState<'specs' | 'history' | 'impacts' | 'sources' | 'suppliers'>('specs');

  if (!viewingProduct) return null;

  const linkedDocs = documents.filter(d => viewingProduct.sourceDocumentIds.includes(d.id));
  const linkedImpacts = changeImpacts.filter(i => i.productId === viewingProduct.id);
  const linkedSuppliers = supplierOffers.filter(s => s.productModel.includes(viewingProduct.model));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden transform animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="p-6 border-b border-slate-200 bg-slate-50/50 flex items-start justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="w-16 h-16 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center overflow-hidden shrink-0">
              <img
                src={viewingProduct.imageUrl}
                alt={viewingProduct.name}
                className="w-full h-full object-cover"
              />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-blue-100 text-blue-800 border border-blue-200">
                  {viewingProduct.model}
                </span>
                <StatusBadge status={viewingProduct.status} />
                <ConfidenceBadge score={viewingProduct.confidence} />
              </div>
              <h2 className="text-xl font-bold text-slate-900 mt-1">
                {viewingProduct.name}
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                {viewingProduct.manufacturer} • {viewingProduct.category}
              </p>
            </div>
          </div>

          <button
            onClick={() => setViewingProduct(null)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="px-6 border-b border-slate-200 bg-white flex items-center gap-6 overflow-x-auto text-xs font-semibold">
          {[
            { id: 'specs', label: 'Specifications & Delta' },
            { id: 'history', label: 'Version Revisions' },
            { id: 'impacts', label: `Change Impacts (${linkedImpacts.length})` },
            { id: 'sources', label: `Evidence Docs (${linkedDocs.length})` },
            { id: 'suppliers', label: `Suppliers (${linkedSuppliers.length})` }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`py-3.5 border-b-2 transition-colors whitespace-nowrap ${
                activeTab === tab.id
                  ? 'border-blue-600 text-blue-600 font-bold'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          {activeTab === 'specs' && (
            <div className="space-y-6">
              {/* Product Overview Summary */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/80">
                <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Product Overview
                </h4>
                <p className="text-xs text-slate-600 leading-relaxed">
                  {viewingProduct.description}
                </p>
              </div>

              {/* Side-by-side spec comparison table */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                    Specification Comparison (Current v2.0 vs Previous v1.4)
                  </h4>
                  <span className="text-[11px] text-amber-700 font-semibold bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                    3 Delta Fields Detected
                  </span>
                </div>

                <div className="border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                      <tr>
                        <th className="py-2.5 px-3">Parameter</th>
                        <th className="py-2.5 px-3 bg-blue-50/70 text-blue-900 border-l border-r border-blue-100">
                          Current Spec ({viewingProduct.currentVersion})
                        </th>
                        <th className="py-2.5 px-3 text-slate-500">
                          Previous Spec ({viewingProduct.previousVersion})
                        </th>
                        <th className="py-2.5 px-3 text-right">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {Object.entries(viewingProduct.specs).map(([key, val]) => {
                        const prevVal = viewingProduct.previousSpecs[key as keyof typeof viewingProduct.previousSpecs] || '-';
                        const isChanged = prevVal !== '-' && prevVal !== val;

                        return (
                          <tr key={key} className={isChanged ? 'bg-amber-50/30' : 'hover:bg-slate-50/50'}>
                            <td className="py-2.5 px-3 font-semibold text-slate-700 capitalize">
                              {key.replace(/([A-Z])/g, ' $1')}
                            </td>
                            <td className={`py-2.5 px-3 font-mono font-bold border-l border-r border-slate-100 ${
                              isChanged ? 'text-blue-700 bg-blue-50/30' : 'text-slate-900'
                            }`}>
                              {Array.isArray(val) ? val.join(', ') : val}
                            </td>
                            <td className="py-2.5 px-3 font-mono text-slate-500 line-through">
                              {isChanged ? (Array.isArray(prevVal) ? prevVal.join(', ') : prevVal) : '-'}
                            </td>
                            <td className="py-2.5 px-3 text-right">
                              {isChanged ? (
                                <span className="inline-flex items-center text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-100 text-amber-800 border border-amber-200">
                                  Updated
                                </span>
                              ) : (
                                <span className="inline-flex items-center text-[10px] font-medium px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
                                  Verified
                                </span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'history' && (
            <div className="space-y-4">
              <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                Audited Version Evolution
              </h4>
              <div className="relative pl-6 border-l-2 border-slate-200 space-y-6">
                {viewingProduct.versions.map((ver, idx) => (
                  <div key={ver.version} className="relative">
                    <div className="absolute -left-[31px] top-0 w-4 h-4 rounded-full bg-blue-600 ring-4 ring-blue-100" />
                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-sm text-slate-900 font-mono">
                          Release {ver.version}
                        </span>
                        <span className="text-xs text-slate-500">{ver.releaseDate}</span>
                      </div>
                      <p className="text-xs text-slate-600 mt-1">
                        Verified by: <span className="font-medium text-slate-800">{ver.verifiedBy}</span>
                      </p>
                      <div className="mt-2 text-xs font-mono bg-white p-2 rounded border border-slate-200 text-slate-700">
                        Power: {ver.specs.power} • Speed: {ver.specs.speed} • Efficiency: {ver.specs.efficiency || '-'}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'impacts' && (
            <div className="space-y-3">
              <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                Cross-Domain Operational Impacts
              </h4>
              {linkedImpacts.map(imp => (
                <div key={imp.id} className="p-3.5 rounded-xl border border-slate-200 bg-slate-50 flex items-start justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-200 text-slate-800 uppercase">
                        {imp.domain}
                      </span>
                      <span className="text-xs font-bold text-slate-900">{imp.title}</span>
                    </div>
                    <p className="text-xs text-slate-600 mt-1 leading-relaxed">{imp.explanation}</p>
                  </div>
                  <span className={`text-[11px] font-semibold px-2 py-1 rounded shrink-0 ${
                    imp.reviewed ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                  }`}>
                    {imp.reviewed ? '✓ Reviewed' : 'Pending Review'}
                  </span>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'sources' && (
            <div className="space-y-3">
              <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                Ingested Authoritative Evidence Documents
              </h4>
              {linkedDocs.map(doc => (
                <div
                  key={doc.id}
                  onClick={() => {
                    setViewingProduct(null);
                    setViewingDocument(doc);
                  }}
                  className="p-3.5 rounded-xl border border-slate-200 hover:border-blue-300 hover:bg-blue-50/40 cursor-pointer transition-colors flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    <FileText className="w-5 h-5 text-blue-600" />
                    <div>
                      <div className="text-xs font-bold text-slate-900">{doc.filename}</div>
                      <div className="text-[11px] text-slate-500">
                        {doc.documentType} • {doc.pagesCount} pages • Match {Math.round(doc.matchConfidence * 100)}%
                      </div>
                    </div>
                  </div>
                  <span className="text-xs font-semibold text-blue-600 inline-flex items-center gap-1">
                    Open Source Viewer <ExternalLink className="w-3.5 h-3.5" />
                  </span>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'suppliers' && (
            <div className="space-y-3">
              <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                Authorized Sourcing Channels
              </h4>
              {linkedSuppliers.map(supp => (
                <div key={supp.id} className="p-3.5 rounded-xl border border-slate-200 bg-slate-50 flex items-center justify-between">
                  <div>
                    <div className="text-xs font-bold text-slate-900">{supp.supplierName}</div>
                    <div className="text-[11px] text-slate-500 font-mono">
                      ₹{supp.priceINR.toLocaleString()} • Lead Time: {supp.deliveryDays} Days • Stock: {supp.stockQty} Units
                    </div>
                  </div>
                  <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 border border-emerald-200">
                    {supp.status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
          <span className="text-xs text-slate-500">
            Master Data ID: <span className="font-mono font-medium">{viewingProduct.id}</span>
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setViewingProduct(null)}
              className="px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-200/60 rounded-lg transition-colors"
            >
              Close
            </button>
            <Link
              href="/synchronization"
              onClick={() => setViewingProduct(null)}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg shadow-xs transition-colors"
            >
              Manage Synchronization →
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
