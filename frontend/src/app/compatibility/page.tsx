'use client';

import React, { useState, useEffect } from 'react';
import { useApp } from '@/context/AppContext';
import { PageHeader } from '@/components/layout/PageHeader';
import { StatusBadge } from '@/components/common/StatusBadge';
import {
  Cpu,
  Zap,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  HelpCircle,
  Search,
  ArrowRight,
  RefreshCw,
  Upload,
  FileText,
  Sparkles,
  Sliders,
  Check,
  ShieldAlert,
  Loader2
} from 'lucide-react';
import Link from 'next/link';

interface AttributeComparison {
  attribute_name: string;
  is_mandatory: boolean;
  product_a_value?: string;
  product_a_source?: string;
  product_b_value?: string;
  product_b_source?: string;
  status: string; // PASS, FAIL, CONFLICT, MISSING, REVIEW
  explanation: string;
}

interface AlternativeRecommendation {
  product_id: number;
  product_code: string;
  name: string;
  manufacturer: string;
  category: string;
  specs_summary: string;
  reason: string;
}

interface EvaluationResult {
  product_a_id: number;
  product_a_code: string;
  product_a_name: string;
  product_a_category: string;
  product_b_id: number;
  product_b_code: string;
  product_b_name: string;
  product_b_category: string;
  result: string; // COMPATIBLE, NOT_COMPATIBLE, NEEDS_REVIEW, INSUFFICIENT_DATA
  overall_status_label: string;
  overall_score: number;
  summary_reason: string;
  attribute_comparisons: AttributeComparison[];
  missing_attributes: string[];
  conflicting_attributes: any[];
  alternative_recommendations: AlternativeRecommendation[];
  evaluated_at: string;
}

export default function CompatibilityPage() {
  const { products } = useApp();

  const [productAId, setProductAId] = useState<string | number | null>(null);
  const [productBId, setProductBId] = useState<string | number | null>(null);

  const [nlQuery, setNlQuery] = useState<string>('');
  const [queryingNl, setQueryingNl] = useState<boolean>(false);
  const [nlResultMsg, setNlResultMsg] = useState<string | null>(null);

  const [evaluating, setEvaluating] = useState<boolean>(false);
  const [evaluation, setEvaluation] = useState<EvaluationResult | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Set default selection when products load
  useEffect(() => {
    if (products && products.length > 0) {
      if (!productAId) setProductAId(products[0].id);
      if (!productBId) setProductBId(products.length > 1 ? products[1].id : products[0].id);
    }
  }, [products]);

  // Run compatibility check API
  const handleCheckCompatibility = async (overrideA?: string | number, overrideB?: string | number) => {
    const idA = overrideA ?? productAId;
    const idB = overrideB ?? productBId;

    if (!idA || !idB) return;

    setEvaluating(true);
    setErrorMsg(null);
    setNlResultMsg(null);

    try {
      const res = await fetch('http://localhost:8000/api/compatibility/evaluate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ product_a_id: idA, product_b_id: idB })
      });

      if (!res.ok) {
        throw new Error(`Failed to evaluate compatibility (${res.status})`);
      }

      const data = await res.json();
      setEvaluation(data);
    } catch (err: any) {
      console.error('Error evaluating compatibility:', err);
      setErrorMsg(err.message || 'An error occurred while evaluating product compatibility.');
    } finally {
      setEvaluating(false);
    }
  };

  // Trigger evaluation on initial load or selection change
  useEffect(() => {
    if (productAId && productBId) {
      handleCheckCompatibility(productAId, productBId);
    }
  }, [productAId, productBId]);

  // Natural Language Query submit
  const handleNlQuerySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nlQuery.trim()) return;

    setQueryingNl(true);
    setNlResultMsg(null);

    try {
      const res = await fetch('http://localhost:8000/api/compatibility/query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: nlQuery })
      });

      const data = await res.json();
      if (data.evaluation) {
        setEvaluation(data.evaluation);
        setProductAId(data.evaluation.product_a_id);
        setProductBId(data.evaluation.product_b_id);
        setNlResultMsg(`Found matching products (${data.evaluation.product_a_code} & ${data.evaluation.product_b_code}) and computed verified result.`);
      } else {
        setNlResultMsg(data.message || 'No matching product pair identified for query.');
      }
    } catch (err: any) {
      setNlResultMsg('Failed to process compatibility query.');
    } finally {
      setQueryingNl(false);
    }
  };

  const getResultBadgeStyle = (resStr: string) => {
    switch (resStr) {
      case 'COMPATIBLE':
        return 'bg-emerald-500/10 border-emerald-300 text-emerald-950 ring-2 ring-emerald-200';
      case 'NOT_COMPATIBLE':
        return 'bg-rose-500/10 border-rose-300 text-rose-950 ring-2 ring-rose-200';
      case 'NEEDS_REVIEW':
        return 'bg-amber-500/10 border-amber-300 text-amber-950 ring-2 ring-amber-200';
      case 'INSUFFICIENT_DATA':
      default:
        return 'bg-slate-500/10 border-slate-300 text-slate-900 ring-2 ring-slate-200';
    }
  };

  const getResultIcon = (resStr: string) => {
    switch (resStr) {
      case 'COMPATIBLE':
        return <CheckCircle2 className="w-8 h-8 text-emerald-600 shrink-0" />;
      case 'NOT_COMPATIBLE':
        return <XCircle className="w-8 h-8 text-rose-600 shrink-0" />;
      case 'NEEDS_REVIEW':
        return <AlertTriangle className="w-8 h-8 text-amber-600 shrink-0" />;
      case 'INSUFFICIENT_DATA':
      default:
        return <HelpCircle className="w-8 h-8 text-slate-500 shrink-0" />;
    }
  };

  if (!products || products.length === 0) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Product Compatibility Checking"
          subtitle="Parametric verification engine evaluating voltage, power, frequency, temperature, and standard compliance from verified product documents."
          breadcrumbs={[
            { label: 'Dashboard', href: '/dashboard' },
            { label: 'Compatibility' }
          ]}
          badge="Parametric Engine"
          badgeVariant="ai"
        />

        <div className="bg-white rounded-2xl p-12 text-center border border-slate-200 shadow-xs space-y-4 max-w-2xl mx-auto">
          <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto">
            <Cpu className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-bold text-slate-900">No Product Data Available</h3>
          <p className="text-sm text-slate-500 leading-relaxed max-w-md mx-auto">
            Upload product specifications and datasheets through the existing product data workflow to perform compatibility checks.
          </p>
          <div className="pt-2">
            <Link
              href="/upload"
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors"
            >
              <Upload className="w-4 h-4" />
              Upload & Ingest Product Data
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const prodA = products.find(p => p.id === productAId) || products[0];
  const prodB = products.find(p => p.id === productBId) || (products.length > 1 ? products[1] : products[0]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Product Compatibility Checking"
        subtitle="Parametric verification engine evaluating voltage, power, frequency, temperature, and standard compliance from verified product documents."
        breadcrumbs={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Compatibility' }
        ]}
        badge="Parametric Engine"
        badgeVariant="ai"
      />

      {/* Change Impact Alert Banner */}
      <div className="bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-transparent border border-amber-300/80 rounded-2xl p-5 text-amber-950 flex items-start gap-4 shadow-2xs">
        <div className="p-2.5 bg-amber-100 rounded-xl text-amber-700 shrink-0">
          <AlertTriangle className="w-6 h-6" />
        </div>
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-amber-900 uppercase tracking-wider">
              Change Impact Alert ({prodA.model || prodA.name} v2.0 Specification Shift)
            </span>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-200 text-amber-900 font-bold">
              Verified Data Check
            </span>
          </div>
          <h4 className="text-sm font-bold text-slate-900">
            Drivetrain Parametric Verification & Real-Time Specification Comparison
          </h4>
          <p className="text-xs text-slate-600 leading-relaxed max-w-4xl">
            This module compares verified technical attributes (Power, Voltage, Frequency, IP Rating, Standards) extracted from authoritative PDF spec sheets and certificates.
          </p>
        </div>
      </div>

      {/* Product Selection Form & Natural Language Search */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-4">
          <div>
            <h3 className="text-base font-bold text-slate-900">Select Industrial Product Pair</h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Choose Product A and Product B from PostgreSQL catalog to evaluate technical compatibility.
            </p>
          </div>

          {/* Natural Language Query Bar */}
          <form onSubmit={handleNlQuerySubmit} className="flex items-center gap-2">
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Ask e.g. Is NX-450 compatible with VTX-550?"
                value={nlQuery}
                onChange={e => setNlQuery(e.target.value)}
                className="pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl w-64 md:w-80 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <button
              type="submit"
              disabled={queryingNl}
              className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 transition-colors disabled:opacity-50"
            >
              {queryingNl ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5 text-amber-300" />}
              Ask AI
            </button>
          </form>
        </div>

        {nlResultMsg && (
          <div className="p-3 rounded-xl bg-blue-50 border border-blue-200 text-blue-900 text-xs flex items-center justify-between">
            <span>{nlResultMsg}</span>
            <button onClick={() => setNlResultMsg(null)} className="text-blue-600 font-bold hover:underline">Dismiss</button>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 items-center">
          {/* Product A Select */}
          <div className="md:col-span-2 space-y-1.5">
            <label className="text-xs font-bold text-slate-700 block">Product A (Primary Component)</label>
            <select
              value={productAId || ''}
              onChange={e => setProductAId(e.target.value)}
              className="w-full px-3 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {products.map(p => (
                <option key={p.id} value={p.id}>
                  {p.model || p.name} — {p.name} ({p.category})
                </option>
              ))}
            </select>
          </div>

          {/* Swap / Vs Indicator */}
          <div className="flex items-center justify-center pt-4 md:pt-6">
            <button
              type="button"
              onClick={() => {
                const temp = productAId;
                setProductAId(productBId);
                setProductBId(temp);
              }}
              title="Swap Products"
              className="p-2.5 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 transition-colors border border-slate-200"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>

          {/* Product B Select */}
          <div className="md:col-span-2 space-y-1.5">
            <label className="text-xs font-bold text-slate-700 block">Product B (Target / Controller / Mover)</label>
            <select
              value={productBId || ''}
              onChange={e => setProductBId(e.target.value)}
              className="w-full px-3 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {products.map(p => (
                <option key={p.id} value={p.id}>
                  {p.model || p.name} — {p.name} ({p.category})
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex justify-end pt-2">
          <button
            onClick={() => handleCheckCompatibility()}
            disabled={evaluating}
            className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-xs flex items-center gap-2 transition-colors disabled:opacity-50"
          >
            {evaluating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Cpu className="w-4 h-4" />}
            Check Technical Compatibility
          </button>
        </div>
      </div>

      {/* Official Compatibility Result Card */}
      {evaluation && (
        <div className="space-y-6">
          <div className={`p-6 rounded-2xl border ${getResultBadgeStyle(evaluation.result)} space-y-4 shadow-xs`}>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                {getResultIcon(evaluation.result)}
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xl font-extrabold tracking-tight">
                      {evaluation.overall_status_label}
                    </span>
                    <span className="text-xs font-mono font-bold px-2.5 py-1 bg-white/80 rounded-lg border border-slate-200 text-slate-800">
                      Score: {Math.round(evaluation.overall_score * 100)}%
                    </span>
                  </div>
                  <p className="text-xs text-slate-700 font-medium mt-1">
                    {evaluation.product_a_code} ({evaluation.product_a_category}) ⟷ {evaluation.product_b_code} ({evaluation.product_b_category})
                  </p>
                </div>
              </div>

              <div className="text-right text-[11px] font-mono text-slate-500">
                Verified at: {evaluation.evaluated_at}
              </div>
            </div>

            <div className="p-4 rounded-xl bg-white/90 border border-slate-200 text-xs leading-relaxed text-slate-800 font-mono">
              <span className="font-bold text-slate-900 block mb-0.5">Engine Summary & Reason:</span>
              {evaluation.summary_reason}
            </div>

            {/* Action buttons based on Result Status */}
            {evaluation.result === 'INSUFFICIENT_DATA' && (
              <div className="flex flex-wrap items-center gap-3 pt-2">
                <span className="text-xs font-bold text-slate-700">Required Action:</span>
                <Link
                  href="/upload"
                  className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-lg inline-flex items-center gap-1.5 shadow-2xs"
                >
                  <Upload className="w-3.5 h-3.5" />
                  Upload Document
                </Link>
                <button
                  onClick={() => handleCheckCompatibility()}
                  className="px-3 py-1.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold text-xs rounded-lg inline-flex items-center gap-1.5"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  Recheck Data
                </button>
              </div>
            )}

            {evaluation.result === 'NEEDS_REVIEW' && (
              <div className="flex flex-wrap items-center gap-3 pt-2">
                <span className="text-xs font-bold text-slate-700">Source Conflict Options:</span>
                <button
                  onClick={() => alert('Reviewing original PDF datasheets and certificates for conflicts...')}
                  className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-lg inline-flex items-center gap-1.5"
                >
                  <FileText className="w-3.5 h-3.5" />
                  Review Source Documents
                </button>
                <button
                  onClick={() => handleCheckCompatibility()}
                  className="px-3 py-1.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold text-xs rounded-lg inline-flex items-center gap-1.5"
                >
                  <Check className="w-3.5 h-3.5" />
                  Use Verified Value
                </button>
              </div>
            )}
          </div>

          {/* Attribute-Level Specification Comparison Table */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-900">Attribute Specification Comparison</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Detailed rule checks comparing mandatory and optional product parameters.
                </p>
              </div>
              <span className="text-xs font-mono text-slate-500 bg-slate-100 px-2.5 py-1 rounded-lg">
                {evaluation.attribute_comparisons.length} Checks Executed
              </span>
            </div>

            <div className="border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-4">Parameter Check</th>
                    <th className="py-3 px-4 text-blue-900 bg-blue-50/50">{evaluation.product_a_code} (Product A)</th>
                    <th className="py-3 px-4 text-slate-800">{evaluation.product_b_code} (Product B)</th>
                    <th className="py-3 px-4">Rule Explanation</th>
                    <th className="py-3 px-4 text-right">Result</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {evaluation.attribute_comparisons.map((chk, idx) => (
                    <tr key={idx} className={chk.status === 'FAIL' ? 'bg-rose-50/30' : chk.status === 'MISSING' ? 'bg-slate-50/50' : 'hover:bg-slate-50'}>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-900 block">{chk.attribute_name}</span>
                          {chk.is_mandatory ? (
                            <span className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.2 bg-rose-100 text-rose-800 rounded">Mandatory</span>
                          ) : (
                            <span className="text-[9px] font-medium text-slate-400">Advisory</span>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-4 font-mono font-semibold text-blue-900 bg-blue-50/20">
                        <div>{chk.product_a_value || 'Unspecified'}</div>
                        <div className="text-[10px] text-slate-400 font-sans">{chk.product_a_source}</div>
                      </td>
                      <td className="py-3 px-4 font-mono text-slate-700">
                        <div>{chk.product_b_value || 'Unspecified'}</div>
                        <div className="text-[10px] text-slate-400 font-sans">{chk.product_b_source}</div>
                      </td>
                      <td className="py-3 px-4 text-slate-600 text-xs">
                        {chk.explanation}
                      </td>
                      <td className="py-3 px-4 text-right">
                        {chk.status === 'PASS' && (
                          <span className="inline-flex items-center text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 gap-1">
                            <CheckCircle2 className="w-3 h-3" />
                            Passed
                          </span>
                        )}
                        {chk.status === 'FAIL' && (
                          <span className="inline-flex items-center text-xs font-bold text-rose-700 bg-rose-100 px-2 py-0.5 rounded border border-rose-300 gap-1">
                            <XCircle className="w-3 h-3" />
                            Failed
                          </span>
                        )}
                        {chk.status === 'MISSING' && (
                          <span className="inline-flex items-center text-xs font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded border border-slate-300 gap-1">
                            <HelpCircle className="w-3 h-3" />
                            Missing
                          </span>
                        )}
                        {chk.status === 'REVIEW' && (
                          <span className="inline-flex items-center text-xs font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200 gap-1">
                            <AlertTriangle className="w-3 h-3" />
                            Review
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Alternative Product Recommendations (If Not Compatible) */}
          {evaluation.result === 'NOT_COMPATIBLE' && evaluation.alternative_recommendations.length > 0 && (
            <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-4">
              <div>
                <h3 className="text-base font-bold text-slate-900">Compatible Alternative Product Recommendations</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Products in the catalog satisfying all mandatory technical requirements for {evaluation.product_a_code}.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {evaluation.alternative_recommendations.map(alt => (
                  <div key={alt.product_id} className="p-4 rounded-xl border border-blue-200 bg-blue-50/30 flex items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-blue-900">{alt.product_code}</span>
                        <span className="text-[10px] text-slate-500">{alt.manufacturer}</span>
                      </div>
                      <h4 className="text-xs font-bold text-slate-900 mt-0.5">{alt.name}</h4>
                      <p className="text-xs text-slate-600 font-mono mt-1">{alt.specs_summary}</p>
                      <p className="text-[11px] text-emerald-700 font-semibold mt-1">✓ {alt.reason}</p>
                    </div>

                    <button
                      onClick={() => {
                        setProductBId(alt.product_id);
                        handleCheckCompatibility(productAId!, alt.product_id);
                      }}
                      className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-lg shrink-0 transition-colors shadow-2xs"
                    >
                      Swap & Recheck
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
