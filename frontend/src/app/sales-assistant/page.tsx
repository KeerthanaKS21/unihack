'use client';

import React, { useState } from 'react';
import { useApp } from '@/context/AppContext';
import { PageHeader } from '@/components/layout/PageHeader';
import { ConfidenceBadge } from '@/components/common/ConfidenceBadge';
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
  RotateCcw
} from 'lucide-react';
import Link from 'next/link';

export default function SalesAssistantPage() {
  const { salesMessages, sendSalesMessage, setViewingDocument, documents } = useApp();
  const [inputText, setInputText] = useState('');

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;
    sendSalesMessage(inputText);
    setInputText('');
  };

  const samplePrompts = [
    { label: 'Tell me about XYZ-450 specs', text: 'Tell me about the XYZ-450 motor specifications and its recent version update.' },
    { label: 'Find equivalent 7.5 kW motors', text: 'Find equivalent 7.5 kW 415V IP55 motors across all suppliers.' },
    { label: 'Prepare quote for 20 units', text: 'Prepare an automated quotation for 20 units of XYZ-450.' },
    { label: 'Check Pump P-200 compatibility', text: 'Which motors and couplings are compatible with Pump P-200?' },
    { label: 'What changed in latest datasheet?', text: 'What changed in the latest datasheet for XYZ-450?' },
    { label: 'Test Missing Data (Zero-Hallucination Demo)', text: 'What is the acoustic noise level in dBA for XYZ-450?' }
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="AI Industrial Sales Assistant"
        subtitle="Conversational intelligence agent dynamically routing queries across specialized product search, procurement, quotation, compatibility, and compliance modules."
        breadcrumbs={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'AI Sales Assistant' }
        ]}
        badge="Zero-Hallucination Grounded"
        badgeVariant="ai"
      />

      {/* Visual Intent Routing Architecture Banner (Requirement #18) */}
      <div className="bg-slate-900 text-white rounded-2xl p-6 border border-slate-800 shadow-md space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-cyan-400" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Agentic Multi-Module Intent Routing Architecture
            </h3>
          </div>
          <span className="text-[11px] font-mono text-cyan-400 bg-cyan-950/60 px-2 py-0.5 rounded border border-cyan-800">
            Federated Knowledge Graph
          </span>
        </div>

        {/* Visual Architecture Diagram */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 text-center text-xs">
          {[
            { name: 'Product Search', icon: Search, color: 'text-blue-400', bg: 'bg-blue-950/60 border-blue-800' },
            { name: 'Procurement', icon: Truck, color: 'text-emerald-400', bg: 'bg-emerald-950/60 border-emerald-800' },
            { name: 'Quotation', icon: FileText, color: 'text-purple-400', bg: 'bg-purple-950/60 border-purple-800' },
            { name: 'Compatibility', icon: Cpu, color: 'text-amber-400', bg: 'bg-amber-950/60 border-amber-800' },
            { name: 'Compliance', icon: ShieldCheck, color: 'text-rose-400', bg: 'bg-rose-950/60 border-rose-800' },
            { name: 'Change Impact', icon: Zap, color: 'text-cyan-400', bg: 'bg-indigo-950/60 border-indigo-800' }
          ].map(mod => {
            const Icon = mod.icon;
            return (
              <div
                key={mod.name}
                className={`p-2.5 rounded-xl border ${mod.bg} flex flex-col items-center justify-center gap-1 shadow-inner`}
              >
                <Icon className={`w-4 h-4 ${mod.color}`} />
                <span className="font-semibold text-slate-200 text-[11px]">{mod.name}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Main Conversation Container */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs flex flex-col h-[650px] overflow-hidden">
        {/* Chat Messages Log */}
        <div className="flex-1 p-6 overflow-y-auto space-y-6">
          {salesMessages.map(msg => {
            const isUser = msg.sender === 'user';

            return (
              <div
                key={msg.id}
                className={`flex gap-3 max-w-3xl ${isUser ? 'ml-auto flex-row-reverse' : ''}`}
              >
                {/* Avatar */}
                <div
                  className={`w-8 h-8 rounded-xl flex items-center justify-center text-xs font-bold shrink-0 shadow-xs ${
                    isUser
                      ? 'bg-slate-900 text-white'
                      : 'bg-gradient-to-tr from-blue-600 to-indigo-600 text-white'
                  }`}
                >
                  {isUser ? 'You' : <Bot className="w-4 h-4" />}
                </div>

                {/* Message Bubble */}
                <div
                  className={`space-y-3 p-4 rounded-2xl text-xs leading-relaxed ${
                    isUser
                      ? 'bg-blue-600 text-white rounded-tr-none font-medium'
                      : 'bg-slate-50 border border-slate-200/90 text-slate-800 rounded-tl-none shadow-2xs'
                  }`}
                >
                  {/* Routed Module Pill & Confidence if Assistant */}
                  {!isUser && msg.routedModule && (
                    <div className="flex items-center gap-2 pb-2 border-b border-slate-200/60">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-blue-700 bg-blue-100/70 px-2 py-0.5 rounded font-mono">
                        Routed → {msg.routedModule}
                      </span>
                      {msg.confidence !== undefined && (
                        <ConfidenceBadge score={msg.confidence} size="sm" />
                      )}
                    </div>
                  )}

                  {/* Text Content */}
                  <div className="whitespace-pre-line">
                    {msg.text}
                  </div>

                  {/* Grounded Source Citations */}
                  {msg.sourceCitations && msg.sourceCitations.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-slate-200/70 space-y-1.5">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
                        Verified Evidence Grounding:
                      </span>
                      {msg.sourceCitations.map((cite, idx) => (
                        <div
                          key={idx}
                          onClick={() => {
                            const found = documents.find(d => d.filename === cite.docName);
                            if (found) setViewingDocument(found);
                          }}
                          className="p-2 rounded-lg bg-white border border-slate-200 text-[11px] font-mono text-slate-700 hover:border-blue-300 hover:bg-blue-50/40 cursor-pointer flex items-center justify-between transition-colors"
                        >
                          <div className="truncate">
                            <strong className="text-blue-700">{cite.docName}</strong> (Page {cite.page})
                            <span className="text-slate-500 block truncate font-sans text-[10px]">{cite.snippet}</span>
                          </div>
                          <ExternalLink className="w-3 h-3 text-slate-400 shrink-0 ml-2" />
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Interactive Action Card */}
                  {msg.actionCard && (
                    <div className="mt-2 pt-2 border-t border-slate-200/70">
                      <Link
                        href={msg.actionCard.url}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-[11px] rounded-lg transition-colors shadow-2xs"
                      >
                        <span>{msg.actionCard.label}</span>
                        <ArrowRight className="w-3 h-3" />
                      </Link>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Suggested Quick Prompt Chips (Requirement #18) */}
        <div className="p-3 bg-slate-50 border-t border-slate-200 flex items-center gap-2 overflow-x-auto text-xs">
          <span className="text-[10px] font-bold uppercase text-slate-400 shrink-0">
            Suggested Queries:
          </span>
          {samplePrompts.map(prompt => (
            <button
              key={prompt.label}
              type="button"
              onClick={() => {
                sendSalesMessage(prompt.text);
              }}
              className="px-2.5 py-1 bg-white hover:bg-blue-50 text-slate-700 hover:text-blue-700 border border-slate-200 rounded-lg whitespace-nowrap transition-colors shadow-2xs font-medium"
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
            placeholder="Ask anything about products, equivalencies, quotes, or compatibility (never hallucinates)..."
            className="flex-1 px-4 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
          />
          <button
            type="submit"
            className="p-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-xs transition-colors"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
}
