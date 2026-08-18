'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useApp } from '@/context/AppContext';
import { PageHeader } from '@/components/layout/PageHeader';
import { ConfidenceBadge } from '@/components/common/ConfidenceBadge';
import { MarkdownRenderer } from '@/components/common/MarkdownRenderer';
import {
  Bot,
  Send,
  Sparkles,
  Layers,
  Search,
  Truck,
  FileText,
  Cpu,
  ShieldCheck,
  Zap,
  HelpCircle,
  ExternalLink,
  ShieldAlert,
  ArrowRight,
  RotateCcw,
  CheckCircle2,
  AlertTriangle,
  FileSpreadsheet,
  FileBox,
  Copy,
  Check,
  Clock,
  Building2,
  DollarSign,
  Boxes,
  Gauge,
  Activity,
  Maximize2
} from 'lucide-react';
import Link from 'next/link';

export default function SalesAssistantPage() {
  const {
    salesMessages,
    sendSalesMessage,
    clearSalesMessages,
    setViewingDocument,
    documents,
    showToast
  } = useApp();

  const [inputText, setInputText] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom of conversation
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [salesMessages]);

  // Determine active routed module from the most recent assistant message
  const latestAssistantMsg = [...salesMessages].reverse().find(m => m.sender === 'assistant' && m.routedModule);
  const activeModule = latestAssistantMsg?.routedModule;

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;
    sendSalesMessage(inputText);
    setInputText('');
  };

  const handleCopyText = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    showToast({
      type: 'info',
      title: 'Copied to Clipboard',
      message: 'Response text copied to clipboard.'
    });
    setTimeout(() => setCopiedId(null), 2000);
  };

  const samplePrompts = [
    {
      label: '⚡ Tell me about XYZ-450 specs',
      text: 'Tell me about the XYZ-450 motor specifications and its recent version update.',
      category: 'Product'
    },
    {
      label: '🚚 Find equivalent 7.5 kW motors',
      text: 'Find equivalent 7.5 kW 415V IP55 motors across all suppliers.',
      category: 'Procurement'
    },
    {
      label: '📄 Prepare quote for 20 units',
      text: 'Prepare an automated quotation for 20 units of XYZ-450.',
      category: 'Quotation'
    },
    {
      label: '⚙️ Check Pump P-200 compatibility',
      text: 'Which motors and couplings are compatible with Pump P-200?',
      category: 'Compatibility'
    },
    {
      label: '🛡️ Audit CE & ATEX compliance',
      text: 'Does XYZ-450 have valid CE and ATEX compliance certificates?',
      category: 'Compliance'
    },
    {
      label: '🔄 What changed in latest datasheet?',
      text: 'What changed in the latest datasheet for XYZ-450?',
      category: 'Change Delta'
    },
    {
      label: '⚠️ Test Missing Data (Zero-Hallucination)',
      text: 'What is the acoustic noise level in dBA for XYZ-450?',
      category: 'Guardrails'
    }
  ];

  const modulesList = [
    { name: 'Product Search', icon: Search, color: 'text-blue-400', border: 'border-blue-500/50', activeBg: 'bg-blue-600/30 ring-2 ring-blue-400' },
    { name: 'Procurement', icon: Truck, color: 'text-emerald-400', border: 'border-emerald-500/50', activeBg: 'bg-emerald-600/30 ring-2 ring-emerald-400' },
    { name: 'Quotation', icon: FileText, color: 'text-purple-400', border: 'border-purple-500/50', activeBg: 'bg-purple-600/30 ring-2 ring-purple-400' },
    { name: 'Compatibility', icon: Cpu, color: 'text-amber-400', border: 'border-amber-500/50', activeBg: 'bg-amber-600/30 ring-2 ring-amber-400' },
    { name: 'Compliance', icon: ShieldCheck, color: 'text-rose-400', border: 'border-rose-500/50', activeBg: 'bg-rose-600/30 ring-2 ring-rose-400' },
    { name: 'Change Impact', icon: Zap, color: 'text-cyan-400', border: 'border-cyan-500/50', activeBg: 'bg-cyan-600/30 ring-2 ring-cyan-400' }
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <PageHeader
          title="AI Industrial Sales Assistant"
          subtitle="Grounded conversational intelligence dynamically orchestrating queries across product search, supplier procurement, instant quotations, drivetrain compatibility, and safety compliance."
          breadcrumbs={[
            { label: 'Dashboard', href: '/dashboard' },
            { label: 'AI Sales Assistant' }
          ]}
          badge="100% Zero-Hallucination Grounded"
          badgeVariant="ai"
        />

        <div className="flex items-center gap-2 self-start sm:self-center shrink-0">
          <button
            type="button"
            onClick={clearSalesMessages}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 bg-white hover:bg-slate-100 border border-slate-200 rounded-xl transition-colors shadow-2xs"
            title="Clear conversation history"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Chat</span>
          </button>
        </div>
      </div>

      {/* Visual Intent Routing Architecture Banner */}
      <div className="bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 text-white rounded-2xl p-5 sm:p-6 border border-slate-800 shadow-lg space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center">
              <Layers className="w-4 h-4 text-cyan-400" />
            </div>
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300">
                Agentic Multi-Module Intent Routing Architecture
              </h3>
              <p className="text-[11px] text-slate-400">
                Autonomous intent classifier routes natural language to verified domain sub-engines
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {activeModule && (
              <span className="text-[11px] font-mono font-bold text-emerald-400 bg-emerald-950/80 px-2.5 py-1 rounded-lg border border-emerald-800 animate-pulse flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                Active Route: {activeModule}
              </span>
            )}
            <span className="text-[11px] font-mono text-cyan-400 bg-cyan-950/60 px-2.5 py-1 rounded-lg border border-cyan-800">
              Federated Knowledge Graph
            </span>
          </div>
        </div>

        {/* Visual Architecture Nodes */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5 text-center text-xs">
          {modulesList.map(mod => {
            const Icon = mod.icon;
            const isActive = activeModule === mod.name;

            return (
              <div
                key={mod.name}
                className={`p-3 rounded-xl border transition-all duration-300 flex flex-col items-center justify-center gap-1.5 shadow-sm ${
                  isActive
                    ? `${mod.activeBg} border-cyan-400 scale-102 shadow-cyan-900/40`
                    : `bg-slate-900/80 ${mod.border} hover:bg-slate-800/80`
                }`}
              >
                <div className="flex items-center gap-1.5">
                  <Icon className={`w-4 h-4 ${mod.color}`} />
                  {isActive && <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />}
                </div>
                <span className={`font-semibold text-[11px] ${isActive ? 'text-white font-bold' : 'text-slate-300'}`}>
                  {mod.name}
                </span>
                <span className="text-[9px] font-mono text-slate-400">
                  {isActive ? '● Processing Node' : 'Ready'}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Main Conversation Container */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm flex flex-col h-[700px] overflow-hidden">
        {/* Chat Header Info Bar */}
        <div className="px-6 py-3 bg-slate-50/80 border-b border-slate-200 flex items-center justify-between text-xs text-slate-600">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <span className="font-semibold text-slate-800">VeriSpec AI Engine v2.4</span>
            <span className="text-slate-400">|</span>
            <span className="text-slate-500">Sub-100ms SQLite Grounding</span>
          </div>
          <div className="flex items-center gap-3 text-[11px] text-slate-500">
            <span className="flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" /> Zero Hallucination Mode: ON
            </span>
          </div>
        </div>

        {/* Chat Messages Log */}
        <div className="flex-1 p-6 overflow-y-auto space-y-6 bg-slate-50/30">
          {salesMessages.map(msg => {
            const isUser = msg.sender === 'user';

            return (
              <div
                key={msg.id}
                className={`flex gap-3 max-w-4xl ${isUser ? 'ml-auto flex-row-reverse' : ''}`}
              >
                {/* Avatar */}
                <div
                  className={`w-9 h-9 rounded-xl flex items-center justify-center text-xs font-bold shrink-0 shadow-xs ${
                    isUser
                      ? 'bg-slate-900 text-white'
                      : 'bg-gradient-to-tr from-blue-600 via-indigo-600 to-cyan-600 text-white shadow-blue-500/20 shadow-md'
                  }`}
                >
                  {isUser ? 'You' : <Bot className="w-5 h-5" />}
                </div>

                {/* Message Bubble */}
                <div
                  className={`space-y-3.5 p-4 sm:p-5 rounded-2xl text-xs leading-relaxed max-w-2xl ${
                    isUser
                      ? 'bg-blue-600 text-white rounded-tr-none font-medium shadow-sm'
                      : 'bg-white border border-slate-200/90 text-slate-800 rounded-tl-none shadow-sm'
                  }`}
                >
                  {/* Routed Module Pill & Confidence if Assistant */}
                  {!isUser && (
                    <div className="flex items-center justify-between gap-2 pb-2.5 border-b border-slate-100">
                      <div className="flex items-center gap-2 flex-wrap">
                        {msg.routedModule && (
                          <span className="text-[10px] font-bold uppercase tracking-wider text-blue-700 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded-md font-mono flex items-center gap-1">
                            <Sparkles className="w-3 h-3 text-blue-600" />
                            Routed → {msg.routedModule}
                          </span>
                        )}
                        {msg.confidence !== undefined && (
                          <ConfidenceBadge score={msg.confidence} size="sm" />
                        )}
                        {msg.isMissingDataDemonstration && (
                          <span className="text-[10px] font-bold uppercase tracking-wider text-rose-700 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded-md font-mono flex items-center gap-1">
                            <ShieldAlert className="w-3 h-3 text-rose-600" />
                            Zero-Hallucination Safe
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-1.5 text-slate-400">
                        <button
                          type="button"
                          onClick={() => handleCopyText(msg.text, msg.id)}
                          className="p-1 hover:text-slate-700 hover:bg-slate-100 rounded transition-colors"
                          title="Copy response"
                        >
                          {copiedId === msg.id ? (
                            <Check className="w-3.5 h-3.5 text-emerald-600" />
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )}
                        </button>
                        <span className="text-[10px] font-mono text-slate-400">{msg.timestamp}</span>
                      </div>
                    </div>
                  )}

                  {/* Text Content / Loading / Error State */}
                  {msg.id.startsWith('loading-') ? (
                    <div className="flex items-center gap-3 py-1 text-slate-600">
                      <div className="flex gap-1.5 items-center">
                        <span className="w-2 h-2 rounded-full bg-blue-600 animate-bounce" style={{ animationDelay: '0ms' }} />
                        <span className="w-2 h-2 rounded-full bg-indigo-600 animate-bounce" style={{ animationDelay: '150ms' }} />
                        <span className="w-2 h-2 rounded-full bg-cyan-600 animate-bounce" style={{ animationDelay: '300ms' }} />
                      </div>
                      <span className="font-medium text-slate-500 animate-pulse">{msg.text}</span>
                    </div>
                  ) : msg.id.startsWith('msg-err-') ? (
                    <div className="space-y-2 p-2 rounded-lg bg-rose-50 border border-rose-200 text-rose-800">
                      <div className="flex items-center gap-2">
                        <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                        <span className="font-medium">{msg.text}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          const lastUser = [...salesMessages].reverse().find(m => m.sender === 'user');
                          if (lastUser) sendSalesMessage(lastUser.text);
                        }}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-bold text-rose-700 bg-white border border-rose-300 hover:bg-rose-100 rounded-md transition-colors"
                      >
                        <RotateCcw className="w-3 h-3" />
                        <span>Retry Query</span>
                      </button>
                    </div>
                  ) : isUser ? (
                    <div className="whitespace-pre-line text-white font-medium space-y-1">
                      {msg.text}
                    </div>
                  ) : (
                    <MarkdownRenderer content={msg.text} className="text-slate-700" />
                  )}

                  {/* ========================================================================= */}
                  {/* RICH INTERACTIVE EMBEDDED CARDS */}
                  {/* ========================================================================= */}

                  {/* 1. Product Specifications Card */}
                  {msg.cardType === 'product_specs' && msg.cardData && (
                    <div className="mt-3 p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
                      <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                        <div className="flex items-center gap-2">
                          <FileBox className="w-4 h-4 text-blue-600" />
                          <span className="font-bold text-slate-900 text-[11px]">
                            {msg.cardData.name} ({msg.cardData.product_code})
                          </span>
                        </div>
                        <span className="text-[10px] font-mono font-bold text-blue-700 bg-blue-100 px-2 py-0.5 rounded">
                          {msg.cardData.version} Verified
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-[11px]">
                        {msg.cardData.attributes?.map((attr: any, idx: number) => (
                          <div key={idx} className="p-2 rounded-lg bg-white border border-slate-200">
                            <span className="text-slate-500 block text-[10px] font-semibold">{attr.name}</span>
                            <span className="font-bold text-slate-800">{attr.value}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* 2. Sourcing & Supplier Comparison Card */}
                  {msg.cardType === 'supplier_comparison' && msg.cardData && (
                    <div className="mt-3 p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
                      <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                        <div className="flex items-center gap-2">
                          <Truck className="w-4 h-4 text-emerald-600" />
                          <span className="font-bold text-slate-900 text-[11px]">
                            Multi-Supplier Rate & Sourcing Matrix
                          </span>
                        </div>
                        <span className="text-[10px] font-mono text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded font-bold">
                          {msg.cardData.target_spec}
                        </span>
                      </div>

                      <div className="overflow-x-auto">
                        <table className="w-full text-left text-[11px]">
                          <thead>
                            <tr className="border-b border-slate-200 text-slate-500">
                              <th className="pb-1.5 font-semibold">Supplier</th>
                              <th className="pb-1.5 font-semibold">Contract Price</th>
                              <th className="pb-1.5 font-semibold">Lead Time</th>
                              <th className="pb-1.5 font-semibold">Stock</th>
                              <th className="pb-1.5 font-semibold">Rating</th>
                              <th className="pb-1.5 font-semibold text-right">Action</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                            {msg.cardData.suppliers?.map((s: any, idx: number) => (
                              <tr key={idx} className="hover:bg-white/80 transition-colors">
                                <td className="py-2 pr-2">
                                  <strong className="text-slate-900 block">{s.supplier_name}</strong>
                                  <span className="text-[10px] text-slate-500">{s.product_code}</span>
                                </td>
                                <td className="py-2 font-bold text-slate-800">
                                  ₹{s.price_inr?.toLocaleString('en-IN')}
                                </td>
                                <td className="py-2">
                                  <span className="inline-flex items-center gap-1 text-slate-700 font-medium">
                                    <Clock className="w-3 h-3 text-slate-400" /> {s.lead_days} Days
                                  </span>
                                </td>
                                <td className="py-2">
                                  <span className="text-emerald-700 font-bold bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                                    {s.stock_qty} in stock
                                  </span>
                                </td>
                                <td className="py-2 font-medium text-amber-600">
                                  ★ {s.rating}
                                </td>
                                <td className="py-2 text-right">
                                  <button
                                    type="button"
                                    onClick={() => {
                                      sendSalesMessage(`Prepare an automated quotation for 20 units with ${s.supplier_name}`);
                                    }}
                                    className="px-2 py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[10px] rounded transition-colors"
                                  >
                                    Quote
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                  {/* 3. Quotation Breakdown Card */}
                  {msg.cardType === 'quotation_breakdown' && msg.cardData && (
                    <div className="mt-3 p-3.5 rounded-xl bg-gradient-to-br from-purple-50 to-slate-50 border border-purple-200 space-y-3">
                      <div className="flex items-center justify-between pb-2 border-b border-purple-200">
                        <div className="flex items-center gap-2">
                          <FileText className="w-4 h-4 text-purple-700" />
                          <span className="font-bold text-slate-900 text-[11px]">
                            Draft Commercial Quotation #{msg.cardData.quote_number}
                          </span>
                        </div>
                        <span className="text-[10px] font-bold text-purple-700 bg-purple-100 px-2 py-0.5 rounded border border-purple-200">
                          Automated RFQ
                        </span>
                      </div>

                      <div className="space-y-1.5 text-[11px] bg-white p-3 rounded-lg border border-purple-100">
                        <div className="flex justify-between text-slate-600">
                          <span>Item:</span>
                          <strong className="text-slate-800">{msg.cardData.product_name} ({msg.cardData.product_code})</strong>
                        </div>
                        <div className="flex justify-between text-slate-600">
                          <span>Quantity & Unit Rate:</span>
                          <span className="text-slate-800 font-mono">{msg.cardData.quantity} Units × ₹{msg.cardData.unit_price?.toLocaleString('en-IN')}</span>
                        </div>
                        <div className="flex justify-between text-slate-600">
                          <span>Subtotal:</span>
                          <span className="font-mono font-medium text-slate-800">₹{msg.cardData.subtotal?.toLocaleString('en-IN')}</span>
                        </div>
                        <div className="flex justify-between text-slate-600">
                          <span>GST (18%):</span>
                          <span className="font-mono font-medium text-slate-800">₹{msg.cardData.tax_gst?.toLocaleString('en-IN')}</span>
                        </div>
                        <div className="flex justify-between text-slate-600">
                          <span>Insured Freight Logistics:</span>
                          <span className="font-mono font-medium text-slate-800">₹{msg.cardData.freight?.toLocaleString('en-IN')}</span>
                        </div>
                        <div className="pt-2 border-t border-slate-200 flex justify-between text-xs font-bold text-purple-950">
                          <span>Grand Total (INR):</span>
                          <span className="font-mono text-purple-700 text-sm">₹{msg.cardData.total?.toLocaleString('en-IN')}</span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between text-[10px] text-slate-500 pt-1">
                        <span className="text-emerald-700 font-bold flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> {msg.cardData.stock_status}
                        </span>
                        <span>Est. Lead Time: <strong>{msg.cardData.lead_days} Days</strong></span>
                      </div>
                    </div>
                  )}

                  {/* 4. Compatibility Matrix Card */}
                  {msg.cardType === 'compatibility_matrix' && msg.cardData && (
                    <div className="mt-3 p-3.5 rounded-xl bg-amber-50/70 border border-amber-200 space-y-3">
                      <div className="flex items-center justify-between pb-2 border-b border-amber-200">
                        <div className="flex items-center gap-2">
                          <Cpu className="w-4 h-4 text-amber-700" />
                          <span className="font-bold text-slate-900 text-[11px]">
                            Technical Mating Audit: {msg.cardData.primary_product} ↔ {msg.cardData.target_product}
                          </span>
                        </div>
                        <span className="text-[10px] font-bold text-amber-800 bg-amber-200/80 px-2 py-0.5 rounded">
                          {msg.cardData.score}% Score ({msg.cardData.status})
                        </span>
                      </div>

                      <div className="space-y-1.5">
                        {msg.cardData.checks?.map((chk: any, idx: number) => (
                          <div key={idx} className="flex items-center justify-between p-2 rounded-lg bg-white border border-amber-100 text-[11px]">
                            <div className="flex items-center gap-2">
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                              <span className="font-semibold text-slate-800">{chk.parameter}:</span>
                              <span className="text-slate-600 font-mono">{chk.primary} ↔ {chk.target}</span>
                            </div>
                            <span className="text-[10px] text-slate-500 font-medium">{chk.notes}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* 5. Compliance & Safety Audit Card */}
                  {msg.cardType === 'compliance_audit' && msg.cardData && (
                    <div className="mt-3 p-3.5 rounded-xl bg-rose-50/70 border border-rose-200 space-y-3">
                      <div className="flex items-center justify-between pb-2 border-b border-rose-200">
                        <div className="flex items-center gap-2">
                          <ShieldCheck className="w-4 h-4 text-rose-700" />
                          <span className="font-bold text-slate-900 text-[11px]">
                            Conformity Declarations & Standard Certificates
                          </span>
                        </div>
                        <span className="text-[10px] font-bold text-rose-700 bg-rose-100 px-2 py-0.5 rounded">
                          Audited
                        </span>
                      </div>

                      <div className="space-y-2">
                        {msg.cardData.certificates?.map((cert: any, idx: number) => {
                          const isValid = cert.status === 'VALID';
                          return (
                            <div key={idx} className="p-2.5 rounded-lg bg-white border border-rose-100 text-[11px] space-y-1">
                              <div className="flex items-center justify-between">
                                <strong className="text-slate-800">{cert.standard}</strong>
                                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                                  isValid ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                                }`}>
                                  {cert.status} (Expires {cert.expiry})
                                </span>
                              </div>
                              <div className="text-[10px] text-slate-500 font-mono">
                                Certificate No: {cert.cert_no}
                              </div>
                              <div className="text-[10px] text-slate-600 italic">
                                {cert.recommendation}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* 6. Change Delta Card */}
                  {msg.cardType === 'change_delta' && msg.cardData && (
                    <div className="mt-3 p-3.5 rounded-xl bg-cyan-50/70 border border-cyan-200 space-y-3">
                      <div className="flex items-center justify-between pb-2 border-b border-cyan-200">
                        <div className="flex items-center gap-2">
                          <Zap className="w-4 h-4 text-cyan-700" />
                          <span className="font-bold text-slate-900 text-[11px]">
                            Specification Delta: {msg.cardData.product_code} ({msg.cardData.from_version} → {msg.cardData.to_version})
                          </span>
                        </div>
                        <span className="text-[10px] font-bold text-cyan-800 bg-cyan-100 px-2 py-0.5 rounded">
                          3 Deltas Detected
                        </span>
                      </div>

                      <div className="space-y-1.5">
                        {msg.cardData.changes?.map((chg: any, idx: number) => (
                          <div key={idx} className="p-2 rounded-lg bg-white border border-cyan-100 text-[11px] flex items-center justify-between">
                            <div>
                              <strong className="text-slate-800 block">{chg.attribute}</strong>
                              <span className="text-slate-500 font-mono text-[10px]">
                                {chg.old_val} → <span className="text-blue-700 font-bold">{chg.new_val}</span>
                              </span>
                            </div>
                            <span className="text-[10px] text-slate-600 max-w-[200px] text-right font-medium">
                              {chg.impact}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* 7. Zero-Hallucination Missing Data Alert Card */}
                  {msg.cardType === 'missing_data_alert' && msg.cardData && (
                    <div className="mt-3 p-4 rounded-xl bg-amber-50 border-2 border-amber-300 space-y-2.5 shadow-2xs">
                      <div className="flex items-center gap-2 text-amber-900 font-bold text-xs">
                        <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                        <span>Zero-Hallucination Guardrail Triggered</span>
                      </div>
                      <p className="text-[11px] text-amber-800 leading-relaxed">
                        The requested specification (<strong>{msg.cardData.field_queried}</strong>) for model <strong>{msg.cardData.product_code}</strong> does not exist in any verified OEM engineering datasheet or SAP ERP record.
                      </p>
                      <div className="p-2.5 rounded-lg bg-white/80 border border-amber-200 text-[10px] space-y-1 text-slate-700">
                        <div><strong>Policy:</strong> Refusing to speculate or hallucinate ungrounded specifications.</div>
                        <div><strong>Standard:</strong> {msg.cardData.standard_reference}</div>
                        <div><strong>Recommendation:</strong> {msg.cardData.recommendation}</div>
                      </div>
                    </div>
                  )}

                  {/* Grounded Source Citations */}
                  {msg.sourceCitations && msg.sourceCitations.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-slate-200/70 space-y-1.5">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                        Verified Evidence Grounding:
                      </span>
                      {msg.sourceCitations.map((cite, idx) => (
                        <div
                          key={idx}
                          onClick={() => {
                            const found = documents.find(d => d.filename === cite.docName);
                            if (found) {
                              setViewingDocument(found);
                            } else {
                              // Fallback sample document object for viewer
                              setViewingDocument({
                                id: 'doc-source-' + idx,
                                filename: cite.docName,
                                documentType: cite.docName.includes('cert') ? 'Certificate' : 'Datasheet',
                                uploadedOn: 'Verified Archive',
                                fileSize: '4.2 MB',
                                status: 'Processed',
                                matchConfidence: 0.98,
                                isSameProductDetected: true,
                                pagesCount: 4,
                                extractedAttributes: { 'Verified Spec': cite.snippet },
                                sourceCitations: [{ page: cite.page, snippet: cite.snippet }]
                              });
                            }
                          }}
                          className="p-2 rounded-lg bg-slate-50 hover:bg-blue-50/60 border border-slate-200 hover:border-blue-300 text-[11px] font-mono text-slate-700 cursor-pointer flex items-center justify-between transition-colors shadow-2xs group"
                          title="Click to view full engineering document"
                        >
                          <div className="truncate">
                            <strong className="text-blue-700 group-hover:underline">{cite.docName}</strong> (Page {cite.page})
                            <span className="text-slate-500 block truncate font-sans text-[10px]">{cite.snippet}</span>
                          </div>
                          <div className="flex items-center gap-1 text-slate-400 group-hover:text-blue-600 shrink-0 ml-2">
                            <span className="text-[10px] font-sans">View</span>
                            <ExternalLink className="w-3 h-3" />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Interactive Action Cards */}
                  {((msg.actions && msg.actions.length > 0) || msg.actionCard) && (
                    <div className="mt-3 pt-2.5 border-t border-slate-100 space-y-2">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                        Recommended Actions:
                      </span>
                      <div className="flex flex-wrap gap-2">
                        {(msg.actions && msg.actions.length > 0 ? msg.actions : msg.actionCard ? [msg.actionCard] : []).map((act, actIdx) => (
                          <Link
                            key={actIdx}
                            href={act.url}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-[11px] rounded-lg transition-colors shadow-2xs"
                            title={act.title}
                          >
                            <span>{act.label}</span>
                            <ArrowRight className="w-3 h-3" />
                          </Link>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
          <div ref={messagesEndRef} />
        </div>

        {/* Suggested Quick Prompt Chips */}
        <div className="p-3 bg-slate-50 border-t border-slate-200 flex items-center gap-2 overflow-x-auto text-xs no-scrollbar">
          <span className="text-[10px] font-bold uppercase text-slate-400 shrink-0 flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-blue-500" />
            Suggested:
          </span>
          {samplePrompts.map(prompt => (
            <button
              key={prompt.label}
              type="button"
              onClick={() => {
                sendSalesMessage(prompt.text);
              }}
              className="px-2.5 py-1 bg-white hover:bg-blue-50 text-slate-700 hover:text-blue-700 border border-slate-200 hover:border-blue-300 rounded-lg whitespace-nowrap transition-colors shadow-2xs font-medium text-[11px] shrink-0"
            >
              {prompt.label}
            </button>
          ))}
        </div>

        {/* Input Bar */}
        <form onSubmit={handleSend} className="p-4 bg-white border-t border-slate-200 flex items-center gap-3">
          <input
            type="text"
            value={inputText}
            onChange={e => setInputText(e.target.value)}
            placeholder="Ask anything about products, supplier comparisons, quotes, compatibility, or missing specs..."
            className="flex-1 px-4 py-3 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium placeholder:text-slate-400 transition-all"
          />
          <button
            type="submit"
            disabled={!inputText.trim()}
            className="px-4 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 disabled:opacity-50 text-white font-bold rounded-xl shadow-sm transition-all flex items-center gap-1.5 text-xs shrink-0 cursor-pointer disabled:cursor-not-allowed"
          >
            <span>Send</span>
            <Send className="w-3.5 h-3.5" />
          </button>
        </form>
      </div>
    </div>
  );
}
