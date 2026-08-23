'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useApp } from '@/context/AppContext';
import {
  LayoutDashboard,
  UploadCloud,
  RefreshCw,
  ShoppingBag,
  Zap,
  Activity,
  AlertCircle,
  ShieldCheck,
  Cpu,
  Truck,
  FileText,
  Bot,
  HelpCircle,
  Sparkles,
  ChevronRight,
  Layers,
  ChevronDown,
  Menu,
  X
} from 'lucide-react';

export const Sidebar: React.FC = () => {
  const pathname = usePathname();
  const {
    unreviewedImpactsCount,
    openIssuesCount,
    openComplianceCount,
    syncStatus
  } = useApp();

  const [mobileOpen, setMobileOpen] = useState(false);

  const navItems = [
    {
      label: 'Dashboard',
      href: '/dashboard',
      icon: LayoutDashboard,
      section: 'Core Intelligence'
    },
    {
      label: 'Upload & Ingest',
      href: '/upload',
      icon: UploadCloud,
      section: 'Core Intelligence'
    },
    {
      label: 'Synchronization',
      href: '/synchronization',
      icon: RefreshCw,
      badge: syncStatus !== 'synchronized' ? 'Sync' : undefined,
      badgeColor: 'amber',
      section: 'Core Intelligence'
    },
    {
      label: 'Change Impact',
      href: '/change-impact',
      icon: Zap,
      badge: unreviewedImpactsCount > 0 ? `${unreviewedImpactsCount}` : undefined,
      badgeColor: 'rose',
      highlightDot: unreviewedImpactsCount > 0,
      section: 'Core Intelligence'
    },
    {
      label: 'E-commerce Update',
      href: '/ecommerce',
      icon: ShoppingBag,
      section: 'Core Intelligence'
    },
    {
      label: 'Catalog Health',
      href: '/catalog-health',
      icon: Activity,
      section: 'Quality & Governance'
    },
    {
      label: 'Catalog Issues / Resolution',
      href: '/catalog-issues',
      icon: AlertCircle,
      badge: openIssuesCount > 0 ? `${openIssuesCount}` : undefined,
      badgeColor: 'purple',
      section: 'Quality & Governance'
    },
    {
      label: 'Compliance Auditing',
      href: '/compliance',
      icon: ShieldCheck,
      badge: openComplianceCount > 0 ? `${openComplianceCount}` : undefined,
      badgeColor: 'amber',
      section: 'Quality & Governance'
    },
    {
      label: 'Compatibility',
      href: '/compatibility',
      icon: Cpu,
      section: 'Industrial Commerce'
    },
    {
      label: 'Procurement & Suppliers',
      href: '/procurement',
      icon: Truck,
      section: 'Industrial Commerce'
    },
    {
      label: 'RFQ / Quote Automation',
      href: '/quotes',
      icon: FileText,
      section: 'Industrial Commerce'
    },
    {
      label: 'AI Sales Assistant',
      href: '/sales-assistant',
      icon: Bot,
      isAI: true,
      section: 'Conversational AI'
    },
    {
      label: 'Ask Catalog AI',
      href: '/ask-catalog',
      icon: HelpCircle,
      isAI: true,
      section: 'Conversational AI'
    }
  ];

  // Group by section
  const sections = Array.from(new Set(navItems.map(item => item.section)));

  return (
    <>
      {/* Mobile Toggle Button */}
      <div className="lg:hidden fixed top-3 left-3 z-50">
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="p-2 bg-slate-900 text-white rounded-lg shadow-lg border border-slate-700"
        >
          {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Sidebar Overlay */}
      {mobileOpen && (
        <div
          className="lg:hidden fixed inset-0 z-40 bg-slate-900/60 backdrop-blur-xs"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-40 w-64 bg-[#0B0F17] text-slate-300 border-r border-slate-800/80 flex flex-col transition-transform duration-300 lg:translate-x-0 ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand Header */}
        <div className="p-4 border-b border-slate-800/80 flex items-center gap-3 bg-slate-950/40">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-cyan-500 flex items-center justify-center text-white shadow-md shadow-blue-500/25 ring-1 ring-white/20">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-sm tracking-tight text-white font-sans">
                VeriSpec AI
              </span>
              <span className="text-[9px] font-bold px-1.5 py-0.5 bg-blue-500/15 text-blue-400 border border-blue-500/30 rounded-md tracking-wider">
                ENTERPRISE
              </span>
            </div>
            <p className="text-[11px] text-slate-400 leading-none mt-1 font-medium">
              Product Intelligence Platform
            </p>
          </div>
        </div>

        {/* Navigation List */}
        <div className="flex-1 overflow-y-auto py-4 px-3 space-y-6">
          {sections.map(sectionName => (
            <div key={sectionName}>
              <div className="px-2 pb-2 text-[10px] font-bold uppercase tracking-wider text-slate-500 font-mono">
                {sectionName}
              </div>
              <div className="space-y-1">
                {navItems
                  .filter(item => item.section === sectionName)
                  .map(item => {
                    const isActive = pathname === item.href || (item.href === '/dashboard' && pathname === '/');
                    const Icon = item.icon;

                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={() => setMobileOpen(false)}
                        className={`group flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-all duration-150 ${
                          isActive
                            ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white font-semibold shadow-sm border border-blue-500/40'
                            : 'text-slate-300 hover:bg-slate-800/70 hover:text-white'
                        }`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <Icon
                            className={`w-4 h-4 shrink-0 transition-transform group-hover:scale-110 ${
                              isActive
                                ? 'text-white'
                                : item.isAI
                                ? 'text-cyan-400'
                                : 'text-slate-400 group-hover:text-slate-200'
                            }`}
                          />
                          <span className="truncate">{item.label}</span>
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0">
                          {item.highlightDot && (
                            <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse shadow-xs shadow-rose-500/50" />
                          )}
                          {item.badge && (
                            <span
                              className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                                isActive
                                  ? 'bg-white/20 text-white'
                                  : item.badgeColor === 'rose'
                                  ? 'bg-rose-500/15 text-rose-300 border border-rose-500/30'
                                  : item.badgeColor === 'purple'
                                  ? 'bg-purple-500/15 text-purple-300 border border-purple-500/30'
                                  : 'bg-amber-500/15 text-amber-300 border border-amber-500/30'
                              }`}
                            >
                              {item.badge}
                            </span>
                          )}
                          {item.isAI && !item.badge && (
                            <Sparkles className="w-3 h-3 text-cyan-400/80" />
                          )}
                        </div>
                      </Link>
                    );
                  })}
              </div>
            </div>
          ))}
        </div>

        {/* Sidebar Footer */}
        <div className="p-3 border-t border-slate-800/80 bg-[#070A0F]">
          <div className="bg-slate-900/80 rounded-xl p-3 border border-slate-800 text-xs shadow-inner">
            <div className="flex items-center justify-between text-slate-400">
              <span className="text-[11px] font-medium text-slate-300">Live Active SKU</span>
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 font-mono">
                v2.0 LIVE
              </span>
            </div>
            <div className="mt-1.5 font-bold text-white text-xs truncate">
              NIS-NX450-415 (Nova Motor)
            </div>
            <p className="text-[10px] text-slate-400 mt-0.5">
              Power upgraded: 5.5 kW → 7.5 kW
            </p>
          </div>
        </div>
      </aside>
    </>
  );
};
