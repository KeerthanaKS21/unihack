'use client';

import React, { useState } from 'react';
import { useApp } from '@/context/AppContext';
import { PageHeader } from '@/components/layout/PageHeader';
import { StatusBadge } from '@/components/common/StatusBadge';
import {
  Cpu,
  Zap,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  ArrowRight,
  Layers,
  Sparkles,
  ExternalLink,
  ChevronRight,
  GitBranch,
  ShieldAlert,
  Sliders
} from 'lucide-react';
import Link from 'next/link';

export default function CompatibilityPage() {
  const { compatibilityChecks, activeProduct } = useApp();

  const [selectedPairId, setSelectedPairId] = useState<string>(compatibilityChecks[0]?.id || '1');

  const activeCheck = compatibilityChecks.find(c => c.id === selectedPairId) || compatibilityChecks[0] || null;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Technical Compatibility & System Graph"
        subtitle="Automated parametric matching engine verifying electrical, thermal, and mechanical coupling between motors, drives, pumps, and gearboxes."
        breadcrumbs={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Compatibility' }
        ]}
        badge="Multi-Node Graph Inspector"
        badgeVariant="ai"
      />

      {/* Product Change Compatibility Alert Banner */}
      <div className="bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-transparent border border-amber-300/80 rounded-2xl p-5 text-amber-950 flex items-start gap-4">
        <div className="p-2.5 bg-amber-100 rounded-xl text-amber-700 shrink-0">
          <AlertTriangle className="w-6 h-6" />
        </div>
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-amber-900 uppercase tracking-wider">
              Change Impact Alert (XYZ-450 v2.0 Upgrade)
            </span>
            <span className="text-[10px] font-mono px-2 py-0.2 rounded bg-amber-200 text-amber-900 font-bold">
              Power Shift: 5.5 → 7.5 kW
            </span>
          </div>
          <h4 className="text-sm font-bold text-slate-900">
            Controller ABC-100 Capacity Exceeded & Coupling CP-40 Bore Mismatch Flagged
          </h4>
          <p className="text-xs text-slate-600 leading-relaxed max-w-4xl">
            Because XYZ-450 was upgraded to 7.5 kW (Frame 132M), drive controller ABC-100 (5.5 kW max) is now undersized by 26.7%. Coupling CP-40 (28mm bore) also fails against the new 38mm shaft diameter.
          </p>
        </div>
      </div>

      {/* System Topology Graph Visualization (Requirement #15) */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-slate-900 tracking-tight">
              Industrial Drive Train Topology Graph
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Interactive node chain representing power transmission and control telemetry.
            </p>
          </div>
          <span className="text-xs font-mono text-blue-600 bg-blue-50 px-2.5 py-1 rounded-lg border border-blue-200">
            System Topology: 4 Connected Nodes
          </span>
        </div>

        {/* Visual Graph Node Chain */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3 py-4">
          {/* Node 1: VFD Drive Controller */}
          <div className="p-4 rounded-xl border-2 border-rose-300 bg-rose-50/40 relative group">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-rose-700 bg-rose-100 px-2 py-0.5 rounded">
                Drive Inverter
              </span>
              <span className="text-rose-600 font-bold text-xs">⚠️ Warning</span>
            </div>
            <h4 className="text-xs font-bold text-slate-900">
              Schneider ABC-100
            </h4>
            <p className="text-[11px] text-slate-500 font-mono mt-1">
              5.5 kW Max • 12.5A
            </p>
            <div className="mt-2 text-[10px] text-rose-700 font-semibold">
              Undersized for 7.5 kW motor load
            </div>
          </div>

          {/* Node 2: Primary Motor */}
          <div className="p-4 rounded-xl border-2 border-blue-600 bg-blue-50/50 relative shadow-sm ring-2 ring-blue-100">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-blue-700 bg-blue-100 px-2 py-0.5 rounded">
                Prime Mover (Master)
              </span>
              <span className="text-blue-700 font-bold text-xs">⚡ v2.0 Active</span>
            </div>
            <h4 className="text-xs font-bold text-slate-900">
              Siemens XYZ-450
            </h4>
            <p className="text-[11px] text-slate-600 font-mono mt-1">
              7.5 kW • 415V • 1460 RPM
            </p>
            <div className="mt-2 text-[10px] text-blue-800 font-semibold">
              Frame 132M (38mm Shaft)
            </div>
          </div>

          {/* Node 3: Flexible Coupling */}
          <div className="p-4 rounded-xl border-2 border-emerald-300 bg-emerald-50/40 relative">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded">
                Power Transmission
              </span>
              <span className="text-emerald-700 font-bold text-xs">✓ Matched</span>
            </div>
            <h4 className="text-xs font-bold text-slate-900">
              Lovejoy CP-50
            </h4>
            <p className="text-[11px] text-slate-500 font-mono mt-1">
              38mm Bore • 110 Nm
            </p>
            <div className="mt-2 text-[10px] text-emerald-700 font-semibold">
              Direct slide fit with 132M shaft
            </div>
          </div>

          {/* Node 4: Centrifugal Pump */}
          <div className="p-4 rounded-xl border-2 border-emerald-300 bg-emerald-50/40 relative">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded">
                Driven Mechanical Load
              </span>
              <span className="text-emerald-700 font-bold text-xs">✓ Optimal</span>
            </div>
            <h4 className="text-xs font-bold text-slate-900">
              Kirloskar P-200
            </h4>
            <p className="text-[11px] text-slate-500 font-mono mt-1">
              7.2 kW Absorbed • 1450 RPM
            </p>
            <div className="mt-2 text-[10px] text-emerald-700 font-semibold">
              4.1% motor torque reserve
            </div>
          </div>
        </div>
      </div>

      {/* Selected Pair Technical Parameter Matrix Checker */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Selectable Product Pairs List */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs space-y-3">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block">
            Target Pairings for XYZ-450:
          </span>

          <div className="space-y-2">
            {compatibilityChecks.map(check => {
              const isSelected = check.id === selectedPairId;

              return (
                <div
                  key={check.id}
                  onClick={() => setSelectedPairId(check.id)}
                  className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                    isSelected
                      ? 'bg-blue-50/60 border-blue-500 ring-2 ring-blue-100'
                      : 'bg-white border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold uppercase text-slate-500">
                      {check.targetCategory}
                    </span>
                    <StatusBadge status={check.status} size="sm" />
                  </div>
                  <h4 className="text-xs font-bold text-slate-900 mt-1">
                    {check.targetName}
                  </h4>
                  <div className="mt-2 flex items-center justify-between text-[11px] text-slate-500">
                    <span>Score: {Math.round(check.compatibilityScore * 100)}%</span>
                    <span className="text-blue-600 font-semibold">Inspect checks →</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right: Detailed 5-Point Parameter Verification Matrix (2 Cols) */}
        <div className="lg:col-span-2 bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-slate-900">
                  {activeCheck.primaryName} ⟷ {activeCheck.targetName}
                </h3>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Technical rule validation computed from engineering spec sheets.
              </p>
            </div>
            <StatusBadge status={activeCheck.status} size="lg" />
          </div>

          {/* Explanation Alert Box */}
          <div className={`p-4 rounded-xl border text-xs leading-relaxed font-mono ${
            activeCheck.status === 'Incompatible'
              ? 'bg-rose-50 border-rose-200 text-rose-950'
              : 'bg-emerald-50 border-emerald-200 text-emerald-950'
          }`}>
            {activeCheck.explanation}
          </div>

          {/* Parameter Checks Table */}
          <div className="border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Parameter Check</th>
                  <th className="py-3 px-4 text-blue-900 bg-blue-50/50">XYZ-450 (7.5 kW)</th>
                  <th className="py-3 px-4 text-slate-700">Target Spec</th>
                  <th className="py-3 px-4 text-right">Result</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {activeCheck.checks.map((chk, idx) => (
                  <tr key={idx} className={chk.passed ? 'hover:bg-slate-50' : 'bg-rose-50/30'}>
                    <td className="py-3 px-4">
                      <span className="font-bold text-slate-900 block">{chk.parameter}</span>
                      <span className="text-[11px] text-slate-500 font-normal">{chk.notes}</span>
                    </td>
                    <td className="py-3 px-4 font-mono font-semibold text-blue-900 bg-blue-50/20">
                      {chk.primaryValue}
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-700">
                      {chk.targetValue}
                    </td>
                    <td className="py-3 px-4 text-right">
                      {chk.passed ? (
                        <span className="inline-flex items-center text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 gap-1">
                          <CheckCircle2 className="w-3 h-3" />
                          Passed
                        </span>
                      ) : (
                        <span className="inline-flex items-center text-xs font-bold text-rose-700 bg-rose-100 px-2 py-0.5 rounded border border-rose-300 gap-1">
                          <XCircle className="w-3 h-3" />
                          Failed
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
