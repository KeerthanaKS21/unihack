'use client';

import React, { useState } from 'react';
import { useApp } from '@/context/AppContext';
import { PageHeader } from '@/components/layout/PageHeader';
import { StatusBadge } from '@/components/common/StatusBadge';
import {
  Truck,
  Filter,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  FileText,
  ShieldCheck,
  Sparkles,
  ArrowRight,
  Sliders,
  DollarSign,
  Calendar,
  Layers
} from 'lucide-react';
import Link from 'next/link';

export default function ProcurementPage() {
  const { supplierOffers } = useApp();

  const [filterPower, setFilterPower] = useState<string>('7.5 kW');
  const [filterVoltage, setFilterVoltage] = useState<string>('415 V');
  const [filterIP, setFilterIP] = useState<string>('IP55');
  const [maxPrice, setMaxPrice] = useState<number>(40000);
  const [maxDeliveryDays, setMaxDeliveryDays] = useState<number>(10);
  const [activeTab, setActiveTab] = useState<'exact' | 'alternatives'>('exact');

  // Exact matches satisfy 100% of technical AND commercial constraints
  const exactMatches = supplierOffers.filter(s => {
    const isPowerMatch = s.power.includes(filterPower);
    const isVoltageMatch = s.voltage.includes(filterVoltage);
    const isIPMatch = s.ipRating.includes(filterIP);
    const isPriceUnder = s.priceINR <= maxPrice;
    const isDeliveryUnder = s.deliveryDays <= maxDeliveryDays;
    return isPowerMatch && isVoltageMatch && isIPMatch && isPriceUnder && isDeliveryUnder;
  });

  const closestAlternatives = supplierOffers.filter(s => {
    return !exactMatches.some(e => e.id === s.id);
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Procurement & Multi-Supplier Constraint Engine"
        subtitle="Intelligent sourcing matrix validating technical specifications, contractual price ceilings, delivery lead times, and warranty terms."
        breadcrumbs={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Procurement & Supplier Comparison' }
        ]}
        badge="Multi-Vendor RFP Optimizer"
        badgeVariant="ai"
        action={
          <Link
            href="/quotes"
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg shadow-xs transition-colors inline-flex items-center gap-1.5"
          >
            <FileText className="w-4 h-4" />
            <span>Create Customer Quotation →</span>
          </Link>
        }
      />

      {/* Sourcing Constraint Filter Bar (Requirement #16) */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sliders className="w-4 h-4 text-blue-600" />
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
              Procurement Constraint Parameters
            </h3>
          </div>
          <span className="text-xs text-slate-500 font-mono">
            Filtering across 6 verified industrial suppliers
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 text-xs">
          {/* Power */}
          <div>
            <label className="block text-slate-500 font-semibold mb-1">Required Power</label>
            <select
              value={filterPower}
              onChange={e => setFilterPower(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 font-bold focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="7.5 kW">7.5 kW (10 HP)</option>
              <option value="5.5 kW">5.5 kW (7.5 HP)</option>
              <option value="11 kW">11 kW (15 HP)</option>
            </select>
          </div>

          {/* Voltage */}
          <div>
            <label className="block text-slate-500 font-semibold mb-1">Grid Voltage</label>
            <select
              value={filterVoltage}
              onChange={e => setFilterVoltage(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 font-bold focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="415 V">415 V (3-Phase 50 Hz)</option>
              <option value="440 V">440 V (3-Phase)</option>
              <option value="230 V">230 V (1-Phase)</option>
            </select>
          </div>

          {/* IP Rating */}
          <div>
            <label className="block text-slate-500 font-semibold mb-1">Protection (IP Rating)</label>
            <select
              value={filterIP}
              onChange={e => setFilterIP(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 font-bold focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="IP55">IP55 (Dust & Water Jet)</option>
              <option value="IP56">IP56 (Severe Duty)</option>
              <option value="IP65">IP65 (Washdown)</option>
            </select>
          </div>

          {/* Max Price */}
          <div>
            <label className="block text-slate-500 font-semibold mb-1">
              Max Unit Price: ₹{maxPrice.toLocaleString()}
            </label>
            <input
              type="range"
              min={35000}
              max={50000}
              step={500}
              value={maxPrice}
              onChange={e => setMaxPrice(Number(e.target.value))}
              className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600 mt-2"
            />
          </div>

          {/* Max Delivery */}
          <div>
            <label className="block text-slate-500 font-semibold mb-1">
              Max Lead Time: {maxDeliveryDays} Days
            </label>
            <input
              type="range"
              min={3}
              max={21}
              step={1}
              value={maxDeliveryDays}
              onChange={e => setMaxDeliveryDays(Number(e.target.value))}
              className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600 mt-2"
            />
          </div>
        </div>
      </div>

      {/* Tabs for Exact Matches vs Closest Alternatives */}
      <div className="flex items-center gap-2 border-b border-slate-200 text-xs font-bold">
        <button
          onClick={() => setActiveTab('exact')}
          className={`py-3 px-4 border-b-2 transition-colors flex items-center gap-2 ${
            activeTab === 'exact'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>Exact Valid Matches ({exactMatches.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('alternatives')}
          className={`py-3 px-4 border-b-2 transition-colors flex items-center gap-2 ${
            activeTab === 'alternatives'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <AlertTriangle className="w-4 h-4 text-amber-600" />
          <span>Closest Alternatives & Tradeoffs ({closestAlternatives.length})</span>
        </button>
      </div>

      {/* Content for EXACT MATCHES */}
      {activeTab === 'exact' && (
        <div className="space-y-4">
          {exactMatches.length === 0 ? (
            <div className="p-12 text-center bg-white rounded-2xl border border-slate-200 shadow-xs space-y-2">
              <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center mx-auto">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <h4 className="text-base font-bold text-slate-900">
                No exact supplier satisfies all constraints.
              </h4>
              <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
                Budget limit ₹{maxPrice.toLocaleString()} or delivery timeline of {maxDeliveryDays} days restricts direct OEM options. Inspect closest alternatives below.
              </p>
              <button
                onClick={() => setActiveTab('alternatives')}
                className="mt-3 px-4 py-2 bg-slate-900 text-white text-xs font-bold rounded-lg"
              >
                View Closest Alternatives →
              </button>
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-4">Authorized Supplier</th>
                    <th className="py-3 px-4">Product Model</th>
                    <th className="py-3 px-4">Power & Voltage</th>
                    <th className="py-3 px-4">IP Rating</th>
                    <th className="py-3 px-4">Unit Price</th>
                    <th className="py-3 px-4">Stock</th>
                    <th className="py-3 px-4">Delivery</th>
                    <th className="py-3 px-4">Technical Match</th>
                    <th className="py-3 px-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {exactMatches.map(supp => (
                    <tr key={supp.id} className="hover:bg-slate-50 transition-colors">
                      <td className="py-3.5 px-4">
                        <span className="font-bold text-slate-900 block">{supp.supplierName}</span>
                        <span className="text-[11px] text-slate-400 font-medium">{supp.tier}</span>
                      </td>
                      <td className="py-3.5 px-4 font-mono font-bold text-blue-700">
                        {supp.productModel}
                      </td>
                      <td className="py-3.5 px-4 font-mono">
                        {supp.power} • {supp.voltage}
                      </td>
                      <td className="py-3.5 px-4 font-mono font-bold text-emerald-700">
                        {supp.ipRating}
                      </td>
                      <td className="py-3.5 px-4 font-mono font-bold text-slate-900">
                        ₹{supp.priceINR.toLocaleString()}
                      </td>
                      <td className="py-3.5 px-4 font-mono text-slate-700">
                        {supp.stockQty} units
                      </td>
                      <td className="py-3.5 px-4 font-mono font-bold text-emerald-700">
                        {supp.deliveryDays} Days
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="inline-flex items-center text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                          100% Match
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <Link
                          href="/quotes"
                          className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg shadow-xs transition-colors inline-flex items-center gap-1"
                        >
                          <span>Select for RFQ</span>
                          <ArrowRight className="w-3 h-3" />
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Content for CLOSEST ALTERNATIVES (Requirement #16) */}
      {activeTab === 'alternatives' && (
        <div className="space-y-4">
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 text-amber-950 flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <p className="text-xs leading-relaxed">
              <strong>Tradeoff & Constraint Violation Inspector:</strong> The AI highlights specific violated requirements (e.g. delivery timeline exceeded or protection rating shortfall) to safeguard critical engineering specifications.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {closestAlternatives.map(alt => (
              <div
                key={alt.id}
                className={`rounded-2xl p-6 border shadow-xs space-y-3 ${
                  alt.status === 'Not Recommended'
                    ? 'bg-rose-50/20 border-rose-200'
                    : 'bg-white border-slate-200'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-[10px] font-bold uppercase text-slate-500 block">
                      {alt.supplierName}
                    </span>
                    <h4 className="text-sm font-bold text-slate-900 font-mono mt-0.5">
                      {alt.productModel}
                    </h4>
                  </div>
                  <StatusBadge status={alt.status} size="sm" />
                </div>

                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs font-mono grid grid-cols-3 gap-2">
                  <div>
                    <span className="text-slate-400 block text-[10px]">Price</span>
                    <span className="font-bold text-slate-900">₹{alt.priceINR.toLocaleString()}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">Lead Time</span>
                    <span className="font-bold text-slate-900">{alt.deliveryDays} Days</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">Protection</span>
                    <span className="font-bold text-slate-900">{alt.ipRating}</span>
                  </div>
                </div>

                {/* Constraint Violations */}
                <div className="space-y-1">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-rose-700 block">
                    Constraint Violations:
                  </span>
                  {alt.violations.map((v, idx) => (
                    <div key={idx} className="p-2 rounded bg-rose-50 text-rose-900 text-xs font-mono flex items-start gap-1.5 border border-rose-200">
                      <XCircle className="w-3.5 h-3.5 text-rose-600 shrink-0 mt-0.5" />
                      <span>{v}</span>
                    </div>
                  ))}
                </div>

                <div className="text-xs text-slate-500 pt-1">
                  <em>Note: {alt.advantageNotes}</em>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
