'use client';

import React, { useState } from 'react';
import { useApp } from '@/context/AppContext';
import { PageHeader } from '@/components/layout/PageHeader';
import {
  HelpCircle,
  Search,
  FileText,
  ShieldCheck,
  ExternalLink,
  Sparkles,
  Info,
  Layers,
  Send,
  BookOpen
} from 'lucide-react';
import Link from 'next/link';

export default function AskCatalogPage() {
  const { askCatalogMessages, sendAskCatalogMessage, setViewingDocument, documents } = useApp();
  const [query, setQuery] = useState('');

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    sendAskCatalogMessage(query);
    setQuery('');
  };

  const explorationPrompts = [
    { label: 'Voltage of Motor X500?', text: 'What is the voltage of Motor X500?' },
    { label: 'Find 7.5 kW Outdoor Motors', text: 'Find all 7.5 kW motors suitable for outdoor use.' },
    { label: 'Compare X500 and A750', text: 'Compare Motor X500 and Motor A750.' },
    { label: 'Compatible Controllers for X500', text: 'Which controllers are compatible with Motor X500?' },
    { label: 'What changed in Motor X500?', text: 'What changed in Motor X500 from V1 to V2?' },
    { label: 'Find Voltage Conflicts', text: 'Show me products where voltage information conflicts.' }
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Ask Catalog AI (Information & Source Provenance)"
        subtitle="Zero-hallucination exploratory retrieval engine providing rigorous document citations, page numbers, and audited revision histories."
        breadcrumbs={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Ask Catalog AI' }
        ]}
        badge="Strict Provenance Mode"
        badgeVariant="purple"
      />

      {/* Scope Disclaimer Banner (Requirement #19) */}
      <div className="p-4 rounded-2xl bg-indigo-50 border border-indigo-200 text-xs text-indigo-950 flex items-start gap-3">
        <div className="p-2 bg-indigo-100 rounded-lg text-indigo-700 shrink-0">
          <BookOpen className="w-5 h-5" />
        </div>
        <div>
          <h4 className="font-bold text-indigo-900">
            Read-Only Grounded Knowledge Retrieval
          </h4>
          <p className="mt-0.5 text-indigo-800/90 leading-relaxed">
            This module is dedicated exclusively to verifiable catalog exploration. It answers technical queries, traces attribute provenance, and verifies standards without modifying master data, issuing quotations, or pushing e-commerce updates.
          </p>
        </div>
      </div>

      {/* Main Exploration Workbench */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs flex flex-col h-[650px] overflow-hidden">
        {/* Messages Stream */}
        <div className="flex-1 p-6 overflow-y-auto space-y-6">
          {askCatalogMessages.map(msg => {
            const isUser = msg.sender === 'user';

            return (
              <div
                key={msg.id}
                className={`flex gap-3 max-w-3xl ${isUser ? 'ml-auto flex-row-reverse' : ''}`}
              >
                <div
                  className={`w-8 h-8 rounded-xl flex items-center justify-center text-xs font-bold shrink-0 shadow-xs ${isUser ? 'bg-slate-900 text-white' : 'bg-indigo-600 text-white'
                    }`}
                >
                  {isUser ? 'You' : <HelpCircle className="w-4 h-4" />}
                </div>

                <div
                  className={`space-y-3 p-4 rounded-2xl text-xs leading-relaxed ${isUser
                    ? 'bg-indigo-600 text-white rounded-tr-none font-medium'
                    : 'bg-slate-50 border border-slate-200 text-slate-800 rounded-tl-none shadow-2xs'
                    }`}
                >
                  {!isUser && (
                    <div className="flex items-center justify-between pb-2 border-b border-slate-200/60">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-700 bg-indigo-100/70 px-2 py-0.5 rounded font-mono">
                        Audited Retrieval
                      </span>
                    </div>
                  )}

                  <div className="whitespace-pre-line">
                    {msg.text}
                  </div>

                  {/* Comparison Table */}
                  {msg.comparisonTable && (
                    <div className="mt-4 border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                          <tr>
                            {msg.comparisonTable.headers.map((header, idx) => (
                              <th key={idx} className="py-2.5 px-3">{header}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {msg.comparisonTable.rows.map((row, rowIdx) => (
                            <tr key={rowIdx} className="hover:bg-slate-50">
                              {row.map((cell, cellIdx) => (
                                <td key={cellIdx} className={`py-2.5 px-3 ${cellIdx === 0 ? 'font-bold text-slate-800' : 'text-slate-600'}`}>
                                  {cell}
                                </td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}

                  {/* Grounded Source Citations */}
                  {msg.sourceCitations && msg.sourceCitations.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-slate-200/70 space-y-1.5">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
                        Verified Primary Evidence Documents:
                      </span>
                      {msg.sourceCitations.map((cite, idx) => (
                        <div
                          key={idx}
                          onClick={() => {
                            const found = documents.find(d => d.filename === cite.docName);
                            if (found) setViewingDocument(found);
                          }}
                          className="p-2.5 rounded-lg bg-white border border-slate-200 text-xs font-mono text-slate-700 hover:border-indigo-300 hover:bg-indigo-50/40 cursor-pointer flex items-center justify-between transition-colors shadow-2xs"
                        >
                          <div className="truncate">
                            <strong className="text-indigo-700">{cite.docName}</strong> (Page {cite.page})
                            <span className="text-slate-500 block truncate font-sans text-[11px] mt-0.5">
                              &ldquo;{cite.snippet}&rdquo;
                            </span>
                          </div>
                          <span className="text-[11px] font-semibold text-indigo-600 shrink-0 ml-2 inline-flex items-center gap-1">
                            <span>Open Source</span>
                            <ExternalLink className="w-3 h-3" />
                          </span>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Action Card */}
                  {msg.actionCard && (
                    <div className="mt-3 pt-3 border-t border-slate-200/70">
                      <Link href={msg.actionCard.url}>
                        <div className="p-3 rounded-xl bg-indigo-50 border border-indigo-200 hover:bg-indigo-100 transition-colors cursor-pointer flex items-center justify-between">
                          <div>
                            <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-700 block mb-0.5">
                              Suggested Action
                            </span>
                            <strong className="text-xs text-indigo-900">{msg.actionCard.title}</strong>
                          </div>
                          <span className="text-xs font-bold text-indigo-600 flex items-center gap-1">
                            {msg.actionCard.label}
                            <ExternalLink className="w-3 h-3" />
                          </span>
                        </div>
                      </Link>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Suggested Queries */}
        <div className="p-3 bg-slate-50 border-t border-slate-200 flex items-center gap-2 overflow-x-auto text-xs">
          <span className="text-[10px] font-bold uppercase text-slate-400 shrink-0">
            Suggested Topics:
          </span>
          {explorationPrompts.map(prompt => (
            <button
              key={prompt.label}
              type="button"
              onClick={() => sendAskCatalogMessage(prompt.text)}
              className="px-2.5 py-1 bg-white hover:bg-indigo-50 text-slate-700 hover:text-indigo-700 border border-slate-200 rounded-lg whitespace-nowrap transition-colors shadow-2xs font-medium"
            >
              {prompt.label}
            </button>
          ))}
        </div>

        {/* Input Bar */}
        <form onSubmit={handleSearch} className="p-4 bg-white border-t border-slate-200 flex items-center gap-3">
          <input
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Ask where a value came from, compare revisions, or verify certificates..."
            className="flex-1 px-4 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
          />
          <button
            type="submit"
            className="p-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-xs transition-colors"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
}
