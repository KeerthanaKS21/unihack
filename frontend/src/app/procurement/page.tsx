'use client';

import React, { useState, useEffect } from 'react';
import { useApp } from '@/context/AppContext';
import { PageHeader } from '@/components/layout/PageHeader';
import { StatusBadge } from '@/components/common/StatusBadge';
import { api } from '@/lib/api';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
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
  Layers,
  Search,
  ChevronRight,
  ShieldAlert,
  Edit2,
  RefreshCw,
  Info
} from 'lucide-react';

interface Constraint {
  attribute: string;
  operator: string;
  value: any;
  unit?: string;
  mandatory: boolean;
}

interface InterpretedReq {
  category: string;
  quantity: number;
  constraints: Constraint[];
}

export default function ProcurementPage() {
  const router = useRouter();
  const { showToast, createQuoteFromSupplierOffer } = useApp();

  // Category Schemas metadata (acts as local fallback)
  const categorySchemas: Record<string, any> = {
    motor: {
      label: "Motor",
      attributes: [
        { name: "power", label: "Power", type: "numeric", units: ["kW", "W", "HP"], default_unit: "kW" },
        { name: "voltage", label: "Voltage", type: "numeric", units: ["V", "kV"], default_unit: "V" },
        { name: "ipRating", label: "IP Rating", type: "string", choices: ["IP54", "IP55", "IP56", "IP65", "IP66"], default_unit: "" },
        { name: "speed", label: "Speed", type: "numeric", units: ["RPM"], default_unit: "RPM" }
      ]
    },
    pump: {
      label: "Pump",
      attributes: [
        { name: "flowRate", label: "Flow Rate", type: "numeric", units: ["L/min", "m3/h"], default_unit: "L/min" },
        { name: "pressure", "label": "Pressure", type: "numeric", units: ["bar", "psi"], default_unit: "bar" },
        { name: "material", label: "Material", type: "string", choices: ["SS304", "SS316", "Cast Iron", "Bronze"], default_unit: "" },
        { name: "temperature", label: "Max Temp", type: "numeric", units: ["C", "F"], default_unit: "C" }
      ]
    },
    valve: {
      label: "Valve",
      attributes: [
        { name: "size", label: "Nominal Size", type: "string", choices: ["DN15", "DN25", "DN40", "DN50", "DN80", "DN100"], default_unit: "" },
        { name: "pressureRating", label: "Pressure Rating", type: "numeric", units: ["bar", "psi"], default_unit: "bar" },
        { name: "material", label: "Material", type: "string", choices: ["SS304", "SS316", "Carbon Steel", "Cast Iron"], default_unit: "" },
        { name: "connection", label: "Connection Type", type: "string", choices: ["Flanged", "Threaded", "Welded"], default_unit: "" }
      ]
    },
    compressor: {
      label: "Compressor",
      attributes: [
        { name: "capacity", label: "Capacity", type: "numeric", units: ["cfm", "m3/min"], default_unit: "cfm" },
        { name: "workingPressure", label: "Working Pressure", type: "numeric", units: ["bar", "psi"], default_unit: "bar" },
        { name: "power", label: "Power", type: "numeric", units: ["kW", "HP"], default_unit: "kW" }
      ]
    },
    gearbox: {
      label: "Gearbox",
      attributes: [
        { name: "ratio", label: "Gear Ratio", type: "string", choices: ["5:1", "10:1", "15:1", "20:1", "30:1", "40:1", "50:1"], default_unit: "" },
        { name: "torque", label: "Output Torque", type: "numeric", units: ["Nm"], default_unit: "Nm" }
      ]
    }
  };

  const [selectedCategory, setSelectedCategory] = useState<string>('motor');
  const [quantity, setQuantity] = useState<number>(50);
  
  // Custom manual form states for dynamic inputs
  const [formInputs, setFormInputs] = useState<Record<string, { value: string; unit: string; mandatory: boolean; operator: string }>>({});

  // Prompt Input state
  const [promptText, setPromptText] = useState<string>(
    'Need 100 motors with 7.5 kW, 415 V, IP55, price below 40000, and delivery under 10 days.'
  );

  const [interpretedReq, setInterpretedReq] = useState<InterpretedReq | null>(null);
  const [isInterpreting, setIsInterpreting] = useState<boolean>(false);
  const [isSearching, setIsSearching] = useState<boolean>(false);
  const [searchResults, setSearchResults] = useState<{ exactMatches: any[]; alternatives: any[] } | null>(null);
  const [activeTab, setActiveTab] = useState<'exact' | 'alternatives' | 'warnings'>('exact');
  const [isEditing, setIsEditing] = useState<boolean>(false);

  // Initialize form fields when category changes
  useEffect(() => {
    const schema = categorySchemas[selectedCategory];
    if (schema) {
      const initialForm: typeof formInputs = {};
      schema.attributes.forEach((attr: any) => {
        // Provide standard defaults to facilitate testing
        let defaultVal = '';
        if (selectedCategory === 'motor') {
          if (attr.name === 'power') defaultVal = '7.5';
          if (attr.name === 'voltage') defaultVal = '415';
          if (attr.name === 'ipRating') defaultVal = 'IP55';
          if (attr.name === 'speed') defaultVal = '1460';
        } else if (selectedCategory === 'pump') {
          if (attr.name === 'flowRate') defaultVal = '120';
          if (attr.name === 'pressure') defaultVal = '8';
          if (attr.name === 'material') defaultVal = 'SS316';
        } else if (selectedCategory === 'valve') {
          if (attr.name === 'size') defaultVal = 'DN50';
          if (attr.name === 'pressureRating') defaultVal = '16';
          if (attr.name === 'material') defaultVal = 'SS304';
        }

        initialForm[attr.name] = {
          value: defaultVal,
          unit: attr.default_unit || '',
          mandatory: true,
          operator: attr.type === 'numeric' ? '>=' : '='
        };
      });

      // Commercial defaults
      initialForm['maxPrice'] = { value: selectedCategory === 'compressor' ? '150000' : '40000', unit: 'INR', mandatory: true, operator: '<=' };
      initialForm['deliveryDays'] = { value: '10', unit: 'days', mandatory: true, operator: '<=' };

      setFormInputs(initialForm);
    }
  }, [selectedCategory]);

  // Interpret plain text using the backend NLP Parser
  const handleInterpretPrompt = async () => {
    if (!promptText.trim()) return;
    setIsInterpreting(true);
    setSearchResults(null);
    try {
      const res = await api.parseProcurementPrompt(promptText);
      setInterpretedReq({
        category: res.category,
        quantity: res.quantity,
        constraints: res.constraints
      });
      setSelectedCategory(res.category);
      setQuantity(res.quantity);
      showToast({
        type: 'success',
        title: 'Requirement Parsed',
        message: `Extracted ${res.constraints.length} constraints for product category: ${res.category}.`
      });
    } catch (err: any) {
      showToast({
        type: 'error',
        title: 'Parsing Failed',
        message: err.message || 'Error processing plain text input'
      });
    } finally {
      setIsInterpreting(false);
    }
  };

  // Convert manual form inputs into structured requirement format
  const handlePrepareManualRequest = () => {
    const constraints: Constraint[] = [];
    Object.entries(formInputs).forEach(([key, f]) => {
      if (f.value.trim() !== '') {
        constraints.push({
          attribute: key,
          operator: f.operator,
          value: f.value,
          unit: f.unit,
          mandatory: f.mandatory
        });
      }
    });

    setInterpretedReq({
      category: selectedCategory,
      quantity: quantity,
      constraints: constraints
    });
  };

  // Execute constraint engine search
  const handleFindSuppliers = async () => {
    if (!interpretedReq) return;
    setIsSearching(true);
    try {
      const res = await api.evaluateProcurement(
        interpretedReq.category,
        interpretedReq.constraints,
        interpretedReq.quantity
      );
      setSearchResults({
        exactMatches: res.exactMatches || [],
        alternatives: res.alternatives || []
      });
      setActiveTab((res.exactMatches && res.exactMatches.length > 0) ? 'exact' : 'alternatives');
      showToast({
        type: 'info',
        title: 'Sourcing Finished',
        message: `Found ${res.exactMatches?.length || 0} exact matches and ${res.alternatives?.length || 0} alternatives.`
      });
    } catch (err: any) {
      showToast({
        type: 'error',
        title: 'Search Failed',
        message: err.message || 'Error searching dynamic supplier catalog.'
      });
    } finally {
      setIsSearching(false);
    }
  };

  const handleEditInterpreted = () => {
    setIsEditing(true);
  };

  const handleSaveInterpreted = () => {
    setIsEditing(false);
    showToast({
      type: 'success',
      title: 'Constraints Saved',
      message: 'Updated specifications and constraint parameters successfully.'
    });
  };

  const handleConstraintChange = (idx: number, field: keyof Constraint, val: any) => {
    if (!interpretedReq) return;
    const updated = [...interpretedReq.constraints];
    updated[idx] = {
      ...updated[idx],
      [field]: val
    };
    setInterpretedReq({
      ...interpretedReq,
      constraints: updated
    });
  };

  // Handoff to RFQ Quote Automation page
  const handleHandoffToRFQ = (offer: any) => {
    createQuoteFromSupplierOffer(offer, interpretedReq?.quantity || quantity);
    router.push('/quotes');
  };

  const schema = categorySchemas[selectedCategory];

  // Count items with warnings (unverified/missing data or data conflicts)
  const warningCount = searchResults
    ? [...searchResults.exactMatches, ...searchResults.alternatives].filter(
        (item: any) => item.warnings && item.warnings.length > 0
      ).length
    : 0;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Procurement & Multi-Supplier Constraint Engine"
        subtitle="Intelligent sourcing matrix validating technical specifications, contractual price ceilings, delivery lead times, and data integrity."
        breadcrumbs={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Procurement & Supplier Comparison' }
        ]}
        badge="Multi-Vendor Sourcing Optimizer"
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

      {/* Inputs Layout: Plain Text Sourcing (Left/Top) & Structured Selector (Right/Bottom) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Natural Language Prompt Assistant */}
        <div className="lg:col-span-7 bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-blue-600 animate-pulse" />
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                AI Sourcing Prompt Assistant
              </h3>
            </div>
            <span className="text-[10px] font-mono font-bold text-blue-700 bg-blue-50 px-2.5 py-0.5 rounded border border-blue-200">
              Semantic Parser Grounded
            </span>
          </div>

          <p className="text-xs text-slate-500 leading-relaxed">
            Enter a natural-language procurement query. The AI model extracts category, quantity, operators, and technical/commercial limits.
          </p>

          <div className="space-y-3">
            <textarea
              value={promptText}
              onChange={(e) => setPromptText(e.target.value)}
              rows={3}
              placeholder="e.g. Need 50 pumps, flow >= 120 L/min, pressure >= 8 bar, SS316, price <= ₹50,000, delivery within 10 days..."
              className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all leading-relaxed"
            />
            <div className="flex justify-between items-center gap-4">
              <div className="flex flex-wrap gap-1.5 text-[10px] font-medium text-slate-400">
                <span className="bg-slate-100 px-2 py-0.5 rounded">Motor</span>
                <span className="bg-slate-100 px-2 py-0.5 rounded">Pump</span>
                <span className="bg-slate-100 px-2 py-0.5 rounded">Valve</span>
                <span className="bg-slate-100 px-2 py-0.5 rounded">Compressor</span>
              </div>
              <button
                onClick={handleInterpretPrompt}
                disabled={isInterpreting}
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white text-xs font-bold rounded-lg shadow-xs transition-colors inline-flex items-center gap-1.5"
              >
                {isInterpreting ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Extracting...</span>
                  </>
                ) : (
                  <>
                    <Search className="w-3.5 h-3.5" />
                    <span>Interpret Sourcing Prompt</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Dynamic Structured Manual Filters */}
        <div className="lg:col-span-5 bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
            <Sliders className="w-4 h-4 text-blue-600" />
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
              Dynamic Sourcing Parameters
            </h3>
          </div>

          <div className="space-y-4 text-xs">
            {/* Category Selector */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-500 font-semibold mb-1">Product Category</label>
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 font-bold focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer"
                >
                  <option value="motor">Motors</option>
                  <option value="pump">Pumps</option>
                  <option value="valve">Valves</option>
                  <option value="compressor">Compressors</option>
                  <option value="gearbox">Gearboxes</option>
                </select>
              </div>
              <div>
                <label className="block text-slate-500 font-semibold mb-1">Quantity Required</label>
                <input
                  type="number"
                  min={1}
                  value={quantity}
                  onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 font-bold focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
            </div>

            {/* Dynamic Attributes Grid (Category-Aware) */}
            <div className="space-y-3 p-3.5 bg-slate-50 rounded-xl border border-slate-200/80">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                Category-Specific Specifications
              </span>
              <div className="grid grid-cols-2 gap-3">
                {schema?.attributes.map((attr: any) => {
                  const inputVal = formInputs[attr.name];
                  if (!inputVal) return null;
                  return (
                    <div key={attr.name} className="space-y-1">
                      <label className="block text-slate-600 font-bold text-[11px]">{attr.label}</label>
                      {attr.choices ? (
                        <select
                          value={inputVal.value}
                          onChange={(e) => setFormInputs(prev => ({
                            ...prev,
                            [attr.name]: { ...prev[attr.name], value: e.target.value }
                          }))}
                          className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-md text-slate-800 font-semibold focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer"
                        >
                          <option value="">Any</option>
                          {attr.choices.map((c: string) => (
                            <option key={c} value={c}>{c}</option>
                          ))}
                        </select>
                      ) : (
                        <div className="flex gap-1">
                          <input
                            type="text"
                            value={inputVal.value}
                            placeholder="Any"
                            onChange={(e) => setFormInputs(prev => ({
                              ...prev,
                              [attr.name]: { ...prev[attr.name], value: e.target.value }
                            }))}
                            className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-md text-slate-800 font-semibold focus:outline-none focus:ring-1 focus:ring-blue-500"
                          />
                          {attr.units && attr.units.length > 0 && (
                            <select
                              value={inputVal.unit}
                              onChange={(e) => setFormInputs(prev => ({
                                ...prev,
                                [attr.name]: { ...prev[attr.name], unit: e.target.value }
                              }))}
                              className="px-1.5 py-1.5 bg-white border border-slate-200 rounded-md text-slate-500 font-bold focus:outline-none cursor-pointer"
                            >
                              {attr.units.map((u: string) => (
                                <option key={u} value={u}>{u}</option>
                              ))}
                            </select>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Structured Commercial Filters */}
            <div className="grid grid-cols-2 gap-3 border-t border-slate-100 pt-3">
              <div>
                <label className="block text-slate-500 font-semibold mb-1">Max Price (INR)</label>
                <input
                  type="text"
                  placeholder="e.g. 50000"
                  value={formInputs['maxPrice']?.value || ''}
                  onChange={(e) => setFormInputs(prev => ({
                    ...prev,
                    maxPrice: { ...prev.maxPrice, value: e.target.value }
                  }))}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 font-bold focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-slate-500 font-semibold mb-1">Max Lead Time (Days)</label>
                <input
                  type="text"
                  placeholder="e.g. 10"
                  value={formInputs['deliveryDays']?.value || ''}
                  onChange={(e) => setFormInputs(prev => ({
                    ...prev,
                    deliveryDays: { ...prev.deliveryDays, value: e.target.value }
                  }))}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 font-bold focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
            </div>

            <button
              onClick={handlePrepareManualRequest}
              className="w-full py-2 bg-slate-100 hover:bg-slate-200/80 text-slate-800 text-xs font-bold rounded-lg border border-slate-200 transition-colors inline-flex items-center justify-center gap-1"
            >
              <span>Build Requirements Model</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* AI Review & Edit Requirement Model Panel (Requirement #15) */}
      {interpretedReq && (
        <div className="bg-slate-50 border border-blue-200 rounded-2xl p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-blue-100 pb-3">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-blue-600" />
              <div>
                <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                  Requirement Model Awaiting Sourcing Review
                </h4>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Confirm constraints below before executing parametric comparison search.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handleEditInterpreted}
                className="px-3 py-1.5 bg-white text-slate-700 hover:bg-slate-50 text-xs font-bold rounded-lg border border-slate-200 shadow-2xs inline-flex items-center gap-1"
              >
                <Edit2 className="w-3 h-3 text-slate-500" />
                <span>Edit Requirements</span>
              </button>
              <button
                onClick={handleFindSuppliers}
                disabled={isSearching}
                className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg shadow-xs inline-flex items-center gap-1"
              >
                {isSearching ? (
                  <>
                    <RefreshCw className="w-3 h-3 animate-spin" />
                    <span>Comparing OEM Catalogs...</span>
                  </>
                ) : (
                  <>
                    <Truck className="w-3.5 h-3.5" />
                    <span>Find Suppliers</span>
                  </>
                )}
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs bg-white p-4 rounded-xl border border-slate-200/60 shadow-2xs">
            <div>
              <span className="text-slate-400 block text-[10px] uppercase font-bold">Category</span>
              <span className="font-bold text-slate-800 uppercase font-mono">{interpretedReq.category}</span>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px] uppercase font-bold">Quantity</span>
              <span className="font-bold text-slate-800 font-mono">{interpretedReq.quantity} units</span>
            </div>
            <div className="col-span-2">
              <span className="text-slate-400 block text-[10px] uppercase font-bold">Evaluated Sourcing Constraints</span>
              <span className="font-bold text-blue-700 font-mono">
                {interpretedReq.constraints.length} total constraints detected
              </span>
            </div>
          </div>

          {/* Constraints Editor or Details View */}
          <div className="space-y-2">
            {isEditing ? (
              <div className="bg-white p-4 rounded-xl border border-slate-200 space-y-3">
                <span className="text-xs font-bold text-slate-800 block">Edit Extracted Constraints</span>
                <div className="space-y-2">
                  {interpretedReq.constraints.map((c, idx) => (
                    <div key={idx} className="flex flex-wrap items-center gap-3 bg-slate-50 p-2.5 rounded-lg border border-slate-150 text-xs">
                      <span className="font-bold text-slate-700 w-28 truncate">{c.attribute}</span>
                      <select
                        value={c.operator}
                        onChange={(e) => handleConstraintChange(idx, 'operator', e.target.value)}
                        className="bg-white border border-slate-200 rounded px-1.5 py-1 font-bold focus:outline-none"
                      >
                        <option value="=">=</option>
                        <option value=">=">&gt;=</option>
                        <option value="<=">&lt;=</option>
                        <option value=">">&gt;</option>
                        <option value="<">&lt;</option>
                      </select>
                      <input
                        type="text"
                        value={c.value}
                        onChange={(e) => handleConstraintChange(idx, 'value', e.target.value)}
                        className="bg-white border border-slate-200 rounded px-2 py-1 font-bold focus:outline-none w-24"
                      />
                      {c.unit && (
                        <input
                          type="text"
                          value={c.unit}
                          onChange={(e) => handleConstraintChange(idx, 'unit', e.target.value)}
                          className="bg-white border border-slate-200 rounded px-2 py-1 font-bold focus:outline-none w-16"
                        />
                      )}
                      <label className="flex items-center gap-1.5 cursor-pointer ml-auto">
                        <input
                          type="checkbox"
                          checked={c.mandatory}
                          onChange={(e) => handleConstraintChange(idx, 'mandatory', e.target.checked)}
                          className="rounded text-blue-600 focus:ring-0 focus:outline-none"
                        />
                        <span className="font-semibold text-slate-600">Mandatory</span>
                      </label>
                    </div>
                  ))}
                </div>
                <div className="flex justify-end">
                  <button
                    onClick={handleSaveInterpreted}
                    className="px-4 py-1.5 bg-slate-900 text-white text-xs font-bold rounded-lg"
                  >
                    Save Changes
                  </button>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                {interpretedReq.constraints.map((c, idx) => (
                  <div key={idx} className="bg-white p-3 rounded-xl border border-slate-200 flex items-center justify-between text-xs font-mono">
                    <div className="space-y-0.5">
                      <span className="text-slate-400 text-[10px] block uppercase font-bold tracking-wider">{c.attribute}</span>
                      <span className="font-bold text-slate-800">
                        {c.operator} {c.value} {c.unit || ''}
                      </span>
                    </div>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      c.mandatory 
                        ? 'bg-blue-50 text-blue-700 border border-blue-200' 
                        : 'bg-amber-50 text-amber-700 border border-amber-200'
                    }`}>
                      {c.mandatory ? 'Mandatory' : 'Preferred'}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Sourcing Results Section */}
      {searchResults && (
        <div className="space-y-4">
          {/* Tabs */}
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
              <span>Exact Valid Matches ({searchResults.exactMatches.length})</span>
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
              <span>Closest Alternatives & Tradeoffs ({searchResults.alternatives.length})</span>
            </button>

            {warningCount > 0 && (
              <button
                onClick={() => setActiveTab('warnings')}
                className={`py-3 px-4 border-b-2 transition-colors flex items-center gap-2 ${
                  activeTab === 'warnings'
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                <ShieldAlert className="w-4 h-4 text-rose-600" />
                <span>Data Integrity Alerts ({warningCount})</span>
              </button>
            )}
          </div>

          {/* EXACT VALID MATCHES TAB */}
          {activeTab === 'exact' && (
            <div className="space-y-4 animate-in fade-in duration-200">
              {searchResults.exactMatches.length === 0 ? (
                <div className="p-12 text-center bg-white rounded-2xl border border-slate-200 shadow-xs space-y-2">
                  <div className="w-12 h-12 rounded-2xl bg-amber-100/70 text-amber-700 flex items-center justify-center mx-auto">
                    <AlertTriangle className="w-6 h-6 animate-pulse" />
                  </div>
                  <h4 className="text-base font-bold text-slate-900">
                    No exact matches found.
                  </h4>
                  <p className="text-xs text-slate-500 max-w-lg mx-auto leading-relaxed">
                    No supplier satisfies 100% of the mandatory technical and commercial constraints. Review closest alternatives to evaluate specs tradeoffs.
                  </p>
                  <button
                    onClick={() => setActiveTab('alternatives')}
                    className="mt-3 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-lg transition-colors"
                  >
                    View Closest Alternatives & Tradeoffs →
                  </button>
                </div>
              ) : (
                <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                      <tr>
                        <th className="py-3 px-4">Authorized Supplier</th>
                        <th className="py-3 px-4">Product Model</th>
                        <th className="py-3 px-4">Specs Summary</th>
                        <th className="py-3 px-4">Unit Price</th>
                        <th className="py-3 px-4">Stock</th>
                        <th className="py-3 px-4">Delivery</th>
                        <th className="py-3 px-4">Sourcing Score</th>
                        <th className="py-3 px-4 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {searchResults.exactMatches.map((supp: any) => (
                        <tr key={supp.id} className="hover:bg-slate-50/50 transition-colors">
                          <td className="py-3.5 px-4">
                            <span className="font-bold text-slate-900 block">{supp.supplierName}</span>
                            <span className="text-[10px] text-slate-400 font-semibold">{supp.tier}</span>
                          </td>
                          <td className="py-3.5 px-4 font-mono font-bold text-blue-700">
                            {supp.productModel}
                          </td>
                          <td className="py-3.5 px-4 font-mono text-[11px] max-w-xs truncate" title={Object.entries(supp.specs).map(([k,v])=>`${k}:${v}`).join(' | ')}>
                            {Object.entries(supp.specs)
                              .filter(([_, v]) => v && v !== 'N/A')
                              .slice(0, 3)
                              .map(([k, v]) => `${k.charAt(0).toUpperCase() + k.slice(1)}: ${v}`)
                              .join(' • ')}
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
                            <button
                              onClick={() => handleHandoffToRFQ(supp)}
                              className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg shadow-xs transition-colors inline-flex items-center gap-1"
                            >
                              <span>Select for RFQ</span>
                              <ArrowRight className="w-3 h-3" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* ALTERNATIVES TAB */}
          {activeTab === 'alternatives' && (
            <div className="space-y-4 animate-in fade-in duration-200">
              <div className="bg-amber-50/50 border border-amber-200 rounded-2xl p-4 text-amber-950 flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <h5 className="text-xs font-bold">Tradeoff & Ingress Protection Inspector</h5>
                  <p className="text-[11px] leading-relaxed text-amber-900 mt-0.5">
                    Closest alternatives satisfy the core technical constraints but violate minor preferred rules. Critical specifications (like safety ratings) are prioritized over unit costs.
                  </p>
                </div>
              </div>

              {/* Explaining exact failure reasons when none exist */}
              {searchResults.exactMatches.length === 0 && (
                <div className="bg-slate-900 text-slate-300 p-5 rounded-2xl border border-slate-800 space-y-3 font-mono text-[11px] leading-relaxed">
                  <span className="text-xs font-bold text-white uppercase block tracking-wider">
                    Sourcing Failure Log: Why 100% Exact Match Failed
                  </span>
                  <div className="space-y-1.5">
                    {searchResults.alternatives.map((alt: any) => (
                      <div key={alt.id} className="flex gap-2">
                        <span className="text-rose-500 font-bold shrink-0">[{alt.supplierName}]</span>
                        <span>{alt.productModel} failed constraints: {alt.violations.join('; ')}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {searchResults.alternatives.map((alt: any) => {
                  const isNotRecommended = alt.status === 'Not Recommended';
                  return (
                    <div
                      key={alt.id}
                      className={`rounded-2xl p-6 border shadow-xs space-y-4 bg-white ${
                        isNotRecommended ? 'border-rose-200 bg-rose-50/10' : 'border-slate-200'
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <span className="text-[10px] font-bold uppercase text-slate-500 block">
                            {alt.supplierName} ({alt.tier})
                          </span>
                          <h4 className="text-sm font-bold text-slate-900 font-mono mt-0.5">
                            {alt.productModel} - {alt.productName}
                          </h4>
                        </div>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                          isNotRecommended 
                            ? 'bg-rose-100 text-rose-800 border border-rose-200' 
                            : 'bg-amber-100 text-amber-800 border border-amber-200'
                        }`}>
                          {alt.status} ({Math.round(alt.technicalMatchScore * 100)}%)
                        </span>
                      </div>

                      {/* Specs Mini Table */}
                      <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs font-mono grid grid-cols-3 gap-2">
                        <div>
                          <span className="text-slate-400 block text-[9px] uppercase tracking-wider">Price</span>
                          <span className="font-bold text-slate-900">₹{alt.priceINR.toLocaleString()}</span>
                        </div>
                        <div>
                          <span className="text-slate-400 block text-[9px] uppercase tracking-wider">Lead Time</span>
                          <span className="font-bold text-slate-900">{alt.deliveryDays} Days</span>
                        </div>
                        <div>
                          <span className="text-slate-400 block text-[9px] uppercase tracking-wider">Category</span>
                          <span className="font-bold text-slate-900 uppercase truncate block">{alt.category.split(' ').pop()}</span>
                        </div>
                      </div>

                      {/* Constraint Violations */}
                      <div className="space-y-1">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-rose-700 block">
                          Failed Sourcing Constraints:
                        </span>
                        {alt.violations.map((v: string, idx: number) => (
                          <div key={idx} className="p-2 rounded bg-rose-50/50 text-rose-900 text-xs font-mono flex items-start gap-1.5 border border-rose-100">
                            <XCircle className="w-3.5 h-3.5 text-rose-600 shrink-0 mt-0.5" />
                            <span>{v}</span>
                          </div>
                        ))}
                      </div>

                      <div className="text-xs text-slate-500 border-t border-slate-100 pt-3 flex items-center justify-between">
                        <span className="italic">Note: {alt.advantageNotes}</span>
                        <button
                          onClick={() => handleHandoffToRFQ(alt)}
                          className="text-xs font-bold text-blue-600 hover:text-blue-800 underline ml-2 cursor-pointer"
                        >
                          Select for RFQ →
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* WARNINGS TAB */}
          {activeTab === 'warnings' && (
            <div className="space-y-4 animate-in fade-in duration-200">
              <div className="bg-rose-50 border border-rose-200 rounded-2xl p-4 text-rose-950 flex items-start gap-3">
                <ShieldAlert className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                <div>
                  <h5 className="text-xs font-bold">Supplier Data Discrepancy Warnings</h5>
                  <p className="text-[11px] leading-relaxed text-rose-900 mt-0.5">
                    Unresolved specification conflicts or incomplete data sheets block product verification. These listings are excluded from Exact Matches.
                  </p>
                </div>
              </div>

              <div className="bg-white rounded-2xl border border-rose-200 overflow-hidden shadow-xs text-xs">
                <table className="w-full text-left">
                  <thead className="bg-rose-50 text-rose-950 font-bold border-b border-rose-200">
                    <tr>
                      <th className="py-3 px-4">Supplier</th>
                      <th className="py-3 px-4">Product Model</th>
                      <th className="py-3 px-4">Integrity Violation</th>
                      <th className="py-3 px-4">Actions Required</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-rose-100">
                    {searchResults.alternatives
                      .filter((alt: any) => alt.warnings && alt.warnings.length > 0)
                      .map((alt: any) => (
                        <tr key={alt.id} className="hover:bg-rose-50/20">
                          <td className="py-3.5 px-4 font-bold text-slate-800">{alt.supplierName}</td>
                          <td className="py-3.5 px-4 font-mono font-bold text-blue-700">{alt.productModel}</td>
                          <td className="py-3.5 px-4 font-mono text-rose-700">
                            {alt.warnings.join('; ')}
                          </td>
                          <td className="py-3.5 px-4 text-slate-500">
                            Request verified engineering spec document to resolve discrepancy.
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
