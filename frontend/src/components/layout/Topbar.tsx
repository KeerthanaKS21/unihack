'use client';

import React, { useState } from 'react';
import { useApp } from '@/context/AppContext';
import {
  Search,
  Bell,
  Upload,
  Activity,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  ChevronDown,
  Layers
} from 'lucide-react';
import Link from 'next/link';

export const Topbar: React.FC = () => {
  const {
    unreviewedImpactsCount,
    openIssuesCount,
    catalogHealth,
    setGlobalSearchOpen
  } = useApp();

  const [notificationOpen, setNotificationOpen] = useState(false);

  const totalNotifications = unreviewedImpactsCount + (openIssuesCount > 0 ? 1 : 0);

  return (
    <header className="h-16 bg-white border-b border-slate-200 sticky top-0 z-30 flex items-center justify-between px-6">
      {/* Left Search Bar */}
      <div className="flex items-center gap-4 flex-1 max-w-xl">
        <button
          onClick={() => setGlobalSearchOpen(true)}
          className="w-full flex items-center justify-between px-3.5 py-2 text-xs text-slate-400 bg-slate-50 hover:bg-slate-100/80 rounded-lg border border-slate-200 transition-colors shadow-xs group"
        >
          <div className="flex items-center gap-2.5">
            <Search className="w-4 h-4 text-slate-400 group-hover:text-blue-600 transition-colors" />
            <span className="text-slate-600 font-medium">
              Search products (XYZ-450), datasheets, suppliers, compliance...
            </span>
          </div>
          <kbd className="hidden sm:inline-flex items-center gap-0.5 px-1.5 py-0.5 text-[10px] font-mono font-semibold text-slate-500 bg-white rounded border border-slate-200 shadow-2xs">
            ⌘K
          </kbd>
        </button>
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-3">
        {/* Health Score Pill */}
        <Link
          href="/catalog-health"
          className="hidden sm:flex items-center gap-2 px-2.5 py-1 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-medium hover:bg-emerald-100 transition-colors"
        >
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span>Data Health:</span>
          <span className="font-bold font-mono">{catalogHealth.overallHealthScore}%</span>
        </Link>

        {/* Quick Upload Button */}
        <Link
          href="/upload"
          className="hidden md:flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:text-blue-600 bg-slate-50 hover:bg-slate-100 rounded-lg border border-slate-200 transition-colors"
        >
          <Upload className="w-3.5 h-3.5" />
          <span>Upload Ingest</span>
        </Link>

        {/* Notification Bell with Dropdown */}
        <div className="relative">
          <button
            onClick={() => setNotificationOpen(!notificationOpen)}
            className="relative p-2 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors"
          >
            <Bell className="w-4 h-4" />
            {totalNotifications > 0 && (
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-rose-500 ring-2 ring-white animate-pulse" />
            )}
          </button>

          {notificationOpen && (
            <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-2xl border border-slate-200 py-2 z-50 animate-in fade-in zoom-in-95 duration-150">
              <div className="px-4 py-2 border-b border-slate-100 flex items-center justify-between">
                <span className="text-xs font-bold text-slate-900">Notifications & Alerts</span>
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700">
                  {totalNotifications} pending
                </span>
              </div>

              <div className="max-h-72 overflow-y-auto p-2 space-y-1">
                {unreviewedImpactsCount > 0 && (
                  <Link
                    href="/change-impact"
                    onClick={() => setNotificationOpen(false)}
                    className="flex items-start gap-2.5 p-2.5 rounded-lg hover:bg-slate-50 transition-colors"
                  >
                    <div className="p-1.5 rounded bg-rose-100 text-rose-600 shrink-0 mt-0.5">
                      <AlertCircle className="w-3.5 h-3.5" />
                    </div>
                    <div>
                      <div className="text-xs font-semibold text-slate-800">
                        {unreviewedImpactsCount} Unreviewed Change Impacts
                      </div>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        XYZ-450 v2.0 upgrade impacts require engineering sign-off.
                      </p>
                    </div>
                  </Link>
                )}

                {openIssuesCount > 0 && (
                  <Link
                    href="/catalog-issues"
                    onClick={() => setNotificationOpen(false)}
                    className="flex items-start gap-2.5 p-2.5 rounded-lg hover:bg-slate-50 transition-colors"
                  >
                    <div className="p-1.5 rounded bg-purple-100 text-purple-600 shrink-0 mt-0.5">
                      <Activity className="w-3.5 h-3.5" />
                    </div>
                    <div>
                      <div className="text-xs font-semibold text-slate-800">
                        {openIssuesCount} Open Catalog Issues
                      </div>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        Voltage conflicts and missing attributes ready for 1-click AI resolution.
                      </p>
                    </div>
                  </Link>
                )}
              </div>

              <div className="px-4 py-2 border-t border-slate-100 text-center">
                <Link
                  href="/dashboard"
                  onClick={() => setNotificationOpen(false)}
                  className="text-[11px] font-semibold text-blue-600 hover:text-blue-800"
                >
                  View Executive Dashboard →
                </Link>
              </div>
            </div>
          )}
        </div>

        {/* User Avatar */}
        <div className="pl-2 border-l border-slate-200 flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-slate-700 to-slate-900 text-white flex items-center justify-center font-bold text-xs shadow-xs">
            JD
          </div>
          <div className="hidden lg:block text-left">
            <div className="text-xs font-bold text-slate-800 leading-tight">
              Dr. John Doe
            </div>
            <div className="text-[10px] text-slate-400 font-medium">
              Lead Systems Engineer
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
