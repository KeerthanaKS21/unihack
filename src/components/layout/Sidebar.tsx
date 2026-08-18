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
        className={`fixed top-0 bottom-0 left-0 z-40 w-64 bg-slate-900 text-slate-300 border-r border-slate-800 flex flex-col transition-transform duration-300 lg:translate-x-0 ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand Header */}
        <div className="p-4 border-b border-slate-800/90 flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-blue-500/20">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-sm tracking-tight text-white">
                VeriSpec AI
              </span>
              <span className="text-[10px] font-semibold px-1.5 py-0.2 bg-blue-500/20 text-blue-400 border border-blue-500/30 rounded">
                ENTERPRISE
              </span>
            </div>
            <p className="text-[11px] text-slate-400 leading-none mt-1">
              Industrial Product Intelligence
            </p>
          </div>
        </div>

        {/* Navigation List */}
        <div className="flex-1 overflow-y-auto py-3 px-2 space-y-5">
          {sections.map(sectionName => (
            <div key={sectionName}>
              <div className="px-3 pb-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                {sectionName}
              </div>
              <div className="space-y-0.5">
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
                        className={`group flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                          isActive
                            ? 'bg-blue-600 text-white font-semibold shadow-sm'
                            : 'text-slate-300 hover:bg-slate-800 hover:text-white'
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
                            <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
                          )}
                          {item.badge && (
                            <span
                              className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                                isActive
                                  ? 'bg-white/20 text-white'
                                  : item.badgeColor === 'rose'
                                  ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                                  : item.badgeColor === 'purple'
                                  ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                                  : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
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
        <div className="p-3 border-t border-slate-800 bg-slate-950/50">
          <div className="bg-slate-900 rounded-lg p-2.5 border border-slate-800 text-xs">
            <div className="flex items-center justify-between text-slate-400">
              <span className="text-[11px] font-medium">Primary Demo SKU</span>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-mono">
                v2.0
              </span>
            </div>
            <div className="mt-1 font-semibold text-white text-xs truncate">
              XYZ-450 (Siemens)
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
