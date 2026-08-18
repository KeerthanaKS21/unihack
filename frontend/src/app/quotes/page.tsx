'use client';

import React, { useState } from 'react';
import { useApp } from '@/context/AppContext';
import { PageHeader } from '@/components/layout/PageHeader';
import { StatusBadge } from '@/components/common/StatusBadge';
import {
  FileText,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  Download,
  Send,
  RefreshCw,
  Clock,
  Building2,
  Calendar,
  Layers,
  ArrowRight,
  ShieldCheck,
  RotateCw,
  Plus
} from 'lucide-react';

export default function QuotesPage() {
  const {
    activeQuote,
    generateQuoteFromPrompt,
    modifyQuoteValidation,
    approveQuote,
    showToast
  } = useApp();

  const [promptInput, setPromptInput] = useState<string>(
    'We need 20 industrial motors, 7.5 kW, 415 V, IP55 with 1460 RPM speed and fast delivery to Pune plant.'
  );

  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [isValidatingChange, setIsValidatingChange] = useState<boolean>(false);
  const [editQty, setEditQty] = useState<number>(25);
  const [editLeadDays, setEditLeadDays] = useState<number>(7);

  const handleGenerateQuote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!promptInput.trim()) return;

    setIsGenerating(true);
    setTimeout(async () => {
      await generateQuoteFromPrompt(promptInput);
      setIsGenerating(false);
    }, 900);
  };

  const handleSimulateChange = async () => {
    setIsValidatingChange(true);
    setTimeout(async () => {
      await modifyQuoteValidation(activeQuote.id, editQty, editLeadDays);
      setIsValidatingChange(false);
    }, 1200);
  };

  const handleDownload = () => {
    approveQuote(activeQuote.id);
    showToast({
      type: 'success',
      title: 'Quotation PDF Downloaded',
      message: `Generated formal export PDF for Quotation ${activeQuote.quoteNumber} (${activeQuote.version}).`
    });
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="RFQ & Automated Quotation Engine"
        subtitle="Natural language quote generator with real-time supplier inventory verification, margin rules, and tiered lead time validation."
        breadcrumbs={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'RFQ / Quote Automation' }
        ]}
        badge={`Quotation ${activeQuote.quoteNumber} (${activeQuote.version})`}
        badgeVariant="primary"
        action={
          <button
            onClick={handleDownload}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg shadow-xs transition-colors inline-flex items-center gap-1.5"
          >
            <Download className="w-4 h-4" />
            <span>Approve & Export Quotation PDF</span>
          </button>
        }
      />

      {/* Natural Language Customer Request Input Area (Requirement #17) */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-blue-600" />
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
              Customer RFQ Request Input
            </h3>
          </div>
          <span className="text-xs text-slate-400 font-mono">
            Natural Language RFP Parser
          </span>
        </div>

        <form onSubmit={handleGenerateQuote} className="flex flex-col sm:flex-row items-center gap-3">
          <input
            type="text"
            value={promptInput}
            onChange={e => setPromptInput(e.target.value)}
            placeholder="e.g. We need 20 industrial motors, 7.5 kW, 415 V, IP55 with fast delivery..."
            className="flex-1 w-full px-4 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
          />
          <button
            type="submit"
            disabled={isGenerating}
            className="w-full sm:w-auto px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl shadow-xs transition-colors inline-flex items-center justify-center gap-2 shrink-0"
          >
            {isGenerating ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Checking Rules & Stock...</span>
              </>
            ) : (
              <>
                <Send className="w-4 h-4 text-blue-400" />
                <span>Generate Smart Quote</span>
              </>
            )}
          </button>
        </form>

        {/* Quick Demo Pre-set Buttons */}
        <div className="flex items-center gap-2 flex-wrap pt-1 text-xs">
          <span className="text-slate-400 font-medium">Quick Test RFQs:</span>
          <button
            type="button"
            onClick={() => setPromptInput('We need 20 units of XYZ-450 7.5 kW 415V motors + 20 Lovejoy CP-50 couplings.')}
            className="px-2.5 py-1 bg-slate-100 hover:bg-blue-50 text-slate-700 hover:text-blue-700 rounded-md transition-colors"
          >
            &ldquo;20 units XYZ-450 + 20 CP-50 couplings&rdquo;
          </button>
          <button
            type="button"
            onClick={() => setPromptInput('Urgent request: 10 units explosion-proof ATEX motors 7.5 kW delivered in 5 days.')}
            className="px-2.5 py-1 bg-slate-100 hover:bg-blue-50 text-slate-700 hover:text-blue-700 rounded-md transition-colors"
          >
            &ldquo;10 units ATEX motors urgent&rdquo;
          </button>
        </div>
      </div>

      {/* Main Quote Workspace Grid: Left Preview Sheet, Right Modification & History */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Professional Quotation Document Sheet Preview (2 Cols) */}
        <div className="lg:col-span-2 bg-white rounded-2xl p-8 border border-slate-200 shadow-md space-y-6">
          {/* Quote Header */}
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 pb-6 border-b border-slate-200">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-lg font-extrabold text-blue-600 tracking-tight">
                  VeriSpec Industrial Commerce
                </span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-100 text-blue-800 font-mono">
                  {activeQuote.version}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Official Commercial Quotation • Reference: <strong className="text-slate-800 font-mono">{activeQuote.quoteNumber}</strong>
              </p>
            </div>

            <div className="text-right text-xs text-slate-500 font-mono space-y-0.5">
              <div>Issued: <strong>{activeQuote.createdAt}</strong></div>
              <div>Valid Until: <strong className="text-slate-800">{activeQuote.validUntil}</strong></div>
              <StatusBadge status={activeQuote.status} size="sm" />
            </div>
          </div>

          {/* Customer & Billing Row */}
          <div className="grid grid-cols-2 gap-4 text-xs">
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80">
              <span className="text-[10px] font-bold uppercase text-slate-400 block mb-1">
                Quotation Issued To:
              </span>
              <div className="font-bold text-slate-900">{activeQuote.customerName}</div>
              <div className="text-slate-600 mt-0.5">{activeQuote.company}</div>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80">
              <span className="text-[10px] font-bold uppercase text-slate-400 block mb-1">
                Verified Logistics Sourcing:
              </span>
              <div className="font-bold text-slate-900">Siemens Direct Industrial Hub (Kalwa)</div>
              <div className="text-emerald-700 font-semibold mt-0.5">✓ 4 Business Days Transit to Pune</div>
            </div>
          </div>

          {/* Itemized Line Items Table */}
          <div>
            <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-2">
              Itemized Product Bill of Materials
            </h4>
            <div className="border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-4">Item & Specifications</th>
                    <th className="py-3 px-4 text-center">Qty</th>
                    <th className="py-3 px-4 text-right">Unit Price</th>
                    <th className="py-3 px-4 text-center">Lead Time</th>
                    <th className="py-3 px-4 text-right">Line Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {activeQuote.items.map(item => (
                    <tr key={item.productId} className="hover:bg-slate-50/60">
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-900">{item.model}</div>
                        <div className="text-[11px] text-slate-500 font-mono">{item.specSummary}</div>
                      </td>
                      <td className="py-3.5 px-4 text-center font-mono font-bold text-slate-900">
                        {item.quantity}
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono text-slate-700">
                        ₹{item.unitPriceINR.toLocaleString()}
                      </td>
                      <td className="py-3.5 px-4 text-center font-mono text-emerald-700 font-semibold">
                        {item.leadTimeDays} Days
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono font-bold text-slate-900">
                        ₹{item.subtotalINR.toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Pricing Summary Totals */}
          <div className="flex justify-end pt-2">
            <div className="w-72 space-y-2 text-xs font-mono">
              <div className="flex justify-between text-slate-600">
                <span>Subtotal (Ex-Works):</span>
                <span className="font-bold text-slate-900">₹{activeQuote.subtotalINR.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Goods & Service Tax (GST 18%):</span>
                <span>₹{activeQuote.taxGST18.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Insured Freight & Handling:</span>
                <span>₹{activeQuote.freightINR.toLocaleString()}</span>
              </div>
              <div className="flex justify-between pt-2 border-t border-slate-200 text-sm font-bold text-blue-900 font-sans">
                <span>Total Net Payable:</span>
                <span className="font-mono text-base">₹{activeQuote.totalINR.toLocaleString()}</span>
              </div>
            </div>
          </div>

          {/* AI Validation Notes Callout */}
          <div className="p-4 rounded-xl bg-blue-50/50 border border-blue-200 text-xs space-y-1">
            <div className="flex items-center gap-1.5 text-blue-900 font-bold mb-1">
              <ShieldCheck className="w-4 h-4 text-blue-600" />
              <span>Automated Business Rule & Compliance Audit Notes:</span>
            </div>
            {activeQuote.validationNotes.map((note, idx) => (
              <p key={idx} className="text-blue-950/90 font-mono text-[11px]">
                {note}
              </p>
            ))}
          </div>
        </div>

        {/* Right: Interactive Modification & Quote Version History (1 Col) */}
        <div className="space-y-6">
          {/* Interactive Modification Simulator (Requirement #17) */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                Simulate RFQ Changes
              </h3>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-purple-50 text-purple-700 border border-purple-200 font-mono">
                Rule Validator
              </span>
            </div>
            <p className="text-xs text-slate-500 leading-relaxed">
              Test modifying quantities or delivery terms. The engine re-checks supplier warehouse quotas without inventing facts.
            </p>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-700 font-bold mb-1">
                  Adjust Quantity (Units)
                </label>
                <input
                  type="number"
                  value={editQty}
                  onChange={e => setEditQty(Number(e.target.value))}
                  min={1}
                  max={100}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 font-mono font-bold focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">
                  Requested Lead Time (Days)
                </label>
                <input
                  type="number"
                  value={editLeadDays}
                  onChange={e => setEditLeadDays(Number(e.target.value))}
                  min={2}
                  max={30}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 font-mono font-bold focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <button
                onClick={handleSimulateChange}
                disabled={isValidatingChange}
                className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-xs transition-colors inline-flex items-center justify-center gap-2"
              >
                {isValidatingChange ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Checking Supplier Inventory & Margin Rules...</span>
                  </>
                ) : (
                  <>
                    <RotateCw className="w-4 h-4" />
                    <span>Apply Revision & Bump Version</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Quote Version Evolution History (Requirement #17) */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-4">
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
              Quotation Version History
            </h3>

            <div className="relative pl-5 border-l-2 border-slate-200 space-y-4 text-xs">
              {activeQuote.history.map((ver, idx) => (
                <div key={idx} className="relative">
                  <div className="absolute -left-[27px] top-1 w-3.5 h-3.5 rounded-full bg-blue-600 ring-4 ring-blue-100" />
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-900 font-mono">
                      Version {ver.version}
                    </span>
                    <span className="text-[11px] text-slate-400 font-mono">{ver.changedAt}</span>
                  </div>
                  <p className="text-slate-600 mt-1 text-[11px] leading-relaxed">
                    {ver.changeSummary}
                  </p>
                  <span className="text-[10px] text-slate-400 block mt-1">
                    By: {ver.user}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
