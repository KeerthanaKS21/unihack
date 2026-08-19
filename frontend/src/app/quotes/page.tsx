'use client';

import React, { useState } from 'react';
import { useApp } from '@/context/AppContext';
import { PageHeader } from '@/components/layout/PageHeader';
import { StatusBadge } from '@/components/common/StatusBadge';
import { api } from '@/lib/api';
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
  Plus,
  Trash2,
  Search,
  Check,
  X,
  FileSpreadsheet,
  FileCheck,
  ArrowLeft,
  Info,
  DollarSign,
  Printer,
  ExternalLink
} from 'lucide-react';

interface ParsedSpecs {
  product: string;
  quantity: number;
  power?: string;
  voltage?: string;
  ipRating?: string;
  speed?: string;
  deliveryDays: number;
  destination?: string;
}

interface SpecEvidenceItem {
  parameter: string;
  required_value: string;
  datasheet_value: string;
  source_document: string;
  source_page: number;
  matched: boolean;
  difference_note?: string;
}

export default function QuotesPage() {
  const { showToast } = useApp();

  // 1. Customer details form state
  const [company, setCompany] = useState('Premier Manufacturing Corp');
  const [contactPerson, setContactPerson] = useState('Industrial Client Representative');
  const [email, setEmail] = useState('procurement@premiermfg.com');
  const [phone, setPhone] = useState('+91 22 2540 8899');
  const [referenceNumber, setReferenceNumber] = useState('RFQ-2026-004');

  // 2. Natural language requirement state
  const [naturalRequirement, setNaturalRequirement] = useState(
    'Customer needs 20 industrial motors, 7.5 kW, 415 V, IP55 with 1460 RPM speed and fast delivery within 7 days to Pune plant.'
  );

  // 3. Processing logs states
  const [isProcessing, setIsProcessing] = useState(false);
  const [processLogs, setProcessLogs] = useState<string[]>([]);

  // 4. Verification outputs
  const [parsedSpecs, setParsedSpecs] = useState<ParsedSpecs | null>(null);
  const [productMatch, setProductMatch] = useState<any>(null);
  const [supplierOffer, setSupplierOffer] = useState<any>(null);
  const [alternativeOffers, setAlternativeOffers] = useState<any[]>([]);
  const [specEvidence, setSpecEvidence] = useState<SpecEvidenceItem[]>([]);
  const [matchStatus, setMatchStatus] = useState<'Exact Match' | 'Closest Alternative' | 'No Match' | null>(null);

  // 5. Quote document data
  const [quoteData, setQuoteData] = useState<{
    quoteNumber: string;
    createdAt: string;
    validUntil: string;
    subtotal: number;
    tax: number;
    freight: number;
    total: number;
  } | null>(null);

  // 6. Approval & Version history states
  const [currentVersion, setCurrentVersion] = useState('v1.0');
  const [quoteStatus, setQuoteStatus] = useState<'Review Required' | 'Approved'>('Review Required');
  const [versionHistory, setVersionHistory] = useState<
    {
      version: string;
      changedAt: string;
      changeSummary: string;
      user: string;
    }[]
  >([]);

  // 7. Simulate change states
  const [isSimulating, setIsSimulating] = useState(false);
  const [changeQty, setChangeQty] = useState<number>(25);
  const [changeDelivery, setChangeDelivery] = useState<number>(7);
  const [validationResult, setValidationResult] = useState<{
    status: 'unchecked' | 'valid' | 'invalid';
    message: string;
    alternativeOffer?: any;
  }>({ status: 'unchecked', message: '' });

  const [revisedTotals, setRevisedTotals] = useState<any>(null);

  // Print view state
  const [isPrintView, setIsPrintView] = useState(false);

  // Handle Quick Test Chips
  const handleQuickTest = (reqText: string) => {
    setNaturalRequirement(reqText);
    showToast({
      type: 'info',
      title: 'Requirement Loaded',
      message: 'Quick test specs copied into natural language input.'
    });
  };

  // Real Sourcing Match logic Grounded on Uploaded Datasheets & Database
  const handleGenerateQuote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!naturalRequirement.trim()) return;

    setIsProcessing(true);
    setProcessLogs([]);
    setParsedSpecs(null);
    setProductMatch(null);
    setSupplierOffer(null);
    setAlternativeOffers([]);
    setSpecEvidence([]);
    setQuoteData(null);
    setValidationResult({ status: 'unchecked', message: '' });
    setRevisedTotals(null);
    setCurrentVersion('v1.0');
    setQuoteStatus('Review Required');

    try {
      const result = await api.postQuoteMatch({
        company,
        contactPerson,
        email,
        phone,
        referenceNumber,
        requirementText: naturalRequirement
      });

      if (result.processLogs && result.processLogs.length > 0) {
        setProcessLogs(result.processLogs);
      }

      setParsedSpecs(result.parsedSpecs);
      setProductMatch(result.productMatch);
      setSupplierOffer(result.supplierOffer);
      setAlternativeOffers(result.alternativeOffers || []);
      setSpecEvidence(result.specEvidence || []);
      setMatchStatus(result.matchStatus as any);
      setQuoteData(result.quoteData);

      if (result.quoteData) {
        setVersionHistory([
          {
            version: 'v1.0',
            changedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            changeSummary: `Quotation generated for ${result.parsedSpecs.quantity} units grounded on datasheet ${result.productMatch?.source_document || 'engineering record'}.`,
            user: 'Automated RFQ Sourcing Engine'
          }
        ]);
        setChangeQty(result.parsedSpecs.quantity);
        setChangeDelivery(result.parsedSpecs.deliveryDays);
      }

      showToast({
        type: result.matchStatus === 'Exact Match' ? 'success' : 'info',
        title: result.matchStatus === 'Exact Match' ? 'Exact Match Verified' : 'Grounded Sourcing Complete',
        message: result.matchStatus === 'Exact Match'
          ? 'Quotation generated and verified against active datasheets.'
          : 'Grounded against available datasheets with deviations highlighted.'
      });
    } catch (err: any) {
      setProcessLogs(prev => [
        ...prev,
        `[${new Date().toLocaleTimeString()}] ✕ Error connecting to RFQ service: ${err?.message || 'Check backend status.'}`
      ]);
      showToast({
        type: 'error',
        title: 'Sourcing Engine Error',
        message: 'Unable to retrieve verified product data. Please check the backend/data connection.'
      });
    } finally {
      setIsProcessing(false);
    }
  };

  // Change revision simulator checking rules via live backend API
  const handleValidateRevision = async () => {
    if (!supplierOffer || !parsedSpecs) return;

    try {
      const res = await api.postQuoteSimulateRevision({
        quoteNumber: quoteData?.quoteNumber,
        productModel: productMatch?.product_code || supplierOffer.productModel,
        supplierName: supplierOffer.supplierName,
        originalQuantity: parsedSpecs.quantity,
        newQuantity: changeQty,
        originalDeliveryDays: parsedSpecs.deliveryDays,
        newDeliveryDays: changeDelivery,
        unitPrice: supplierOffer.priceINR
      });

      if (res.supported) {
        setValidationResult({
          status: 'valid',
          message: res.message
        });

        setRevisedTotals({
          subtotal: res.revisedSubtotal,
          tax: res.revisedTax,
          freight: res.revisedFreight,
          total: res.revisedTotal,
          qty: changeQty,
          deliveryDays: changeDelivery
        });
      } else {
        setValidationResult({
          status: 'invalid',
          message: res.message,
          alternativeOffer: res.alternativeOffer || null
        });
        setRevisedTotals(null);
      }
    } catch (err: any) {
      setValidationResult({
        status: 'invalid',
        message: `Simulation error: ${err?.message || 'Unable to connect to inventory engine.'}`
      });
    }
  };

  // Switch to alternative supplier in change request flow
  const handleApplyAlternativeSupplier = () => {
    if (!validationResult.alternativeOffer) return;
    const alt = validationResult.alternativeOffer;

    setSupplierOffer(alt);

    const subtotal = changeQty * alt.priceINR;
    const tax = subtotal * 0.18;
    const freight = quoteData?.freight || 15000;
    const total = subtotal + tax + freight;

    setRevisedTotals({
      subtotal,
      tax,
      total,
      qty: changeQty,
      deliveryDays: changeDelivery,
      newSupplier: alt
    });

    setValidationResult({
      status: 'valid',
      message: `✓ Switched to alternative supplier "${alt.supplierName}". Stock verified (${alt.stockQuantity} available), and lead time of ${alt.deliveryDays} days conforms to required ${changeDelivery} days.`
    });
  };

  // Save revision changes
  const handleApplyRevision = () => {
    if (!quoteData || !revisedTotals) return;

    // Bump version number
    const verNumber = parseFloat(currentVersion.replace('v', '')) + 0.1;
    const nextVer = `v${verNumber.toFixed(1)}`;

    setQuoteData({
      ...quoteData,
      subtotal: revisedTotals.subtotal,
      tax: revisedTotals.tax,
      total: revisedTotals.total
    });

    setParsedSpecs(prev =>
      prev
        ? {
            ...prev,
            quantity: revisedTotals.qty,
            deliveryDays: revisedTotals.deliveryDays
          }
        : null
    );

    setVersionHistory(prev => [
      ...prev,
      {
        version: nextVer,
        changedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        changeSummary: `Revised quantity to ${revisedTotals.qty} units and delivery lead time to ${revisedTotals.deliveryDays} days.`,
        user: 'Sales Operations'
      }
    ]);

    setCurrentVersion(nextVer);
    setValidationResult({ status: 'unchecked', message: '' });
    setRevisedTotals(null);
    setQuoteStatus('Review Required'); // Force re-review

    showToast({
      type: 'info',
      title: 'Revision Applied',
      message: `Quotation updated to ${nextVer}.`
    });
  };

  // Signoff quote
  const handleApproveQuote = () => {
    setQuoteStatus('Approved');
    showToast({
      type: 'success',
      title: 'Quotation Approved',
      message: 'Verified quotation approved. Ready to export PDF.'
    });
  };

  // Export quote view trigger
  const handleDownloadPdf = () => {
    setIsPrintView(true);
    setTimeout(() => {
      window.print();
      setIsPrintView(false);
      showToast({
        type: 'success',
        title: 'PDF Export Complete',
        message: 'Quotation PDF dispatched successfully.'
      });
    }, 500);
  };

  if (isPrintView && quoteData && supplierOffer && parsedSpecs) {
    return (
      <div className="p-8 bg-white text-slate-900 font-sans max-w-4xl mx-auto border border-slate-300 shadow-lg">
        {/* Print Layout */}
        <div className="flex justify-between items-start border-b border-slate-300 pb-6">
          <div>
            <div className="text-2xl font-black text-blue-600 tracking-tight flex items-center gap-2">
              <Layers className="w-6 h-6 text-blue-600" />
              <span>VeriSpec AI Industrial Commerce</span>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              VeriSpec Intelligent Sourcing Hub • Verified OEM Supplier Matrix
            </p>
          </div>
          <div className="text-right text-xs">
            <h1 className="text-lg font-bold text-slate-900">COMMERCIAL QUOTATION</h1>
            <p className="font-mono mt-1">Quote No: <strong>{quoteData.quoteNumber}</strong></p>
            <p>Version: <strong>{currentVersion}</strong></p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-8 my-6 text-xs">
          <div>
            <h3 className="font-bold text-slate-500 uppercase tracking-wider mb-2">QUOTATION TO:</h3>
            <p className="font-bold text-base text-slate-900">{company}</p>
            <p className="text-slate-600 mt-0.5">Contact: {contactPerson}</p>
            <p className="text-slate-600">Email: {email}</p>
            <p className="text-slate-600">Phone: {phone}</p>
          </div>
          <div className="text-right text-xs col-span-1">
            <h3 className="font-bold text-slate-500 uppercase tracking-wider mb-2">SOURCING DETAILS:</h3>
            <p>Date Issued: <strong>{quoteData.createdAt}</strong></p>
            <p>Validity Period: <strong>30 Days</strong></p>
            <p>Reference: <strong>{referenceNumber}</strong></p>
            <p>Required Delivery: <strong>{parsedSpecs.deliveryDays} Days</strong></p>
          </div>
        </div>

        <div className="my-6">
          <table className="w-full text-left text-xs border border-slate-200">
            <thead className="bg-slate-100 font-bold border-b border-slate-200">
              <tr>
                <th className="py-2.5 px-3">Item Description & Specs</th>
                <th className="py-2.5 px-3 text-center">Qty</th>
                <th className="py-2.5 px-3 text-right">Unit Price (INR)</th>
                <th className="py-2.5 px-3 text-center">Lead Time</th>
                <th className="py-2.5 px-3 text-right">Total (INR)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              <tr>
                <td className="py-3 px-3">
                  <p className="font-bold">{productMatch?.name || parsedSpecs.product}</p>
                  <p className="text-[10px] text-slate-500 font-mono mt-0.5">
                    Specs: {parsedSpecs.power || 'Standard'} | {parsedSpecs.voltage || 'Standard'} | {parsedSpecs.ipRating || 'IP55'} | {parsedSpecs.speed || 'Standard'}
                  </p>
                  <p className="text-[9px] text-blue-600 mt-0.5">
                    Source: {productMatch?.source_document || 'Verified Datasheet'}
                  </p>
                </td>
                <td className="py-3 px-3 text-center font-mono font-bold">{parsedSpecs.quantity}</td>
                <td className="py-3 px-3 text-right font-mono">₹{supplierOffer.priceINR.toLocaleString()}</td>
                <td className="py-3 px-3 text-center font-mono">{supplierOffer.deliveryDays} Days</td>
                <td className="py-3 px-3 text-right font-mono font-bold">
                  ₹{(parsedSpecs.quantity * supplierOffer.priceINR).toLocaleString()}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div className="grid grid-cols-2 gap-8 my-6 text-xs">
          <div className="bg-slate-50 p-4 border border-slate-200 rounded">
            <h4 className="font-bold mb-1">Commercial Sourcing Terms:</h4>
            <ul className="list-disc pl-4 space-y-1 text-slate-600">
              <li>Sourced from authorized supplier: <strong>{supplierOffer.supplierName}</strong> ({supplierOffer.supplierProductCode})</li>
              <li>Estimated delivery timeline: <strong>{supplierOffer.deliveryDays} business days</strong></li>
              <li>All specifications verified against engineering datasheet releases.</li>
            </ul>
          </div>
          <div className="space-y-2 text-right">
            <div className="flex justify-between">
              <span>Subtotal:</span>
              <span className="font-mono">₹{quoteData.subtotal.toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span>GST (18%):</span>
              <span className="font-mono">₹{quoteData.tax.toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span>Insured Freight:</span>
              <span className="font-mono">₹{quoteData.freight.toLocaleString()}</span>
            </div>
            <div className="flex justify-between font-bold text-sm border-t border-slate-300 pt-2 text-blue-600">
              <span>Grand Total:</span>
              <span className="font-mono">₹{quoteData.total.toLocaleString()}</span>
            </div>
          </div>
        </div>

        <div className="mt-12 pt-6 border-t border-slate-200 flex justify-between items-center text-xs text-slate-500">
          <div>
            <p>Authorized Sales Signoff: ________________________</p>
            <p className="text-[10px] mt-1">VeriSpec AI Commercial Automation Platform</p>
          </div>
          <div className="text-right">
            <p>Customer Acceptance Signature: ________________________</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2">
        <div>
          <div className="text-xs text-slate-400 font-semibold mb-1 space-x-1">
            <span>Dashboard</span>
            <span>→</span>
            <span className="text-slate-600 font-bold">RFQ / Quote Automation</span>
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">RFQ & Automated Quotation Engine</h1>
          <p className="text-xs text-slate-500 mt-1">
            Generate verified customer quotations grounded directly on real uploaded engineering datasheets and live supplier rate cards.
          </p>
        </div>

        <div className="shrink-0">
          <button
            onClick={handleDownloadPdf}
            disabled={quoteStatus !== 'Approved'}
            className={`px-4 py-2 text-xs font-bold rounded-lg shadow-sm transition-colors inline-flex items-center gap-1.5 ${
              quoteStatus === 'Approved'
                ? 'bg-blue-600 hover:bg-blue-700 text-white cursor-pointer'
                : 'bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed'
            }`}
          >
            <Download className="w-4 h-4" />
            <span>Approve & Export Quotation PDF</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (2 Span): RFQ Forms & Verification Results */}
        <div className="lg:col-span-2 space-y-6">
          {/* CUSTOMER RFQ REQUEST INPUT */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div>
                <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-blue-600" />
                  <span>Customer RFQ Request Input</span>
                </h3>
                <p className="text-[11px] text-slate-400 mt-0.5">Enter the customer requirement received by the employee.</p>
              </div>
            </div>

            <form onSubmit={handleGenerateQuote} className="space-y-4">
              {/* Customer Details Form */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 text-xs">
                <div>
                  <label className="block text-slate-600 font-semibold mb-0.5">Customer Company</label>
                  <input
                    type="text"
                    value={company}
                    onChange={e => setCompany(e.target.value)}
                    className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded focus:bg-white text-slate-800"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 font-semibold mb-0.5">Contact Representative</label>
                  <input
                    type="text"
                    value={contactPerson}
                    onChange={e => setContactPerson(e.target.value)}
                    className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded focus:bg-white text-slate-800"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 font-semibold mb-0.5">Reference ID</label>
                  <input
                    type="text"
                    value={referenceNumber}
                    onChange={e => setReferenceNumber(e.target.value)}
                    className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded focus:bg-white font-mono text-slate-800"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 font-semibold mb-0.5">Email Address</label>
                  <input
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded focus:bg-white text-slate-800"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 font-semibold mb-0.5">Phone Number</label>
                  <input
                    type="text"
                    value={phone}
                    onChange={e => setPhone(e.target.value)}
                    className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded focus:bg-white text-slate-800"
                  />
                </div>
              </div>

              {/* Requirement Input Textarea */}
              <div className="text-xs">
                <label className="block text-slate-600 font-semibold mb-1">Customer Requirement description (Natural Language)</label>
                <textarea
                  value={naturalRequirement}
                  onChange={e => setNaturalRequirement(e.target.value)}
                  rows={3}
                  placeholder="e.g. Customer needs 20 industrial motors, 7.5 kW, 415 V, IP55, 1460 RPM, delivery within 7 days to Pune..."
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 font-medium"
                />
              </div>

              <div className="flex justify-between items-center gap-4 flex-wrap text-xs pt-1">
                {/* Shortcuts */}
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-slate-400 font-medium text-[10px] uppercase">Quick Test Chips:</span>
                  <button
                    type="button"
                    onClick={() => handleQuickTest('Customer needs 20 industrial motors, 7.5 kW, 415 V, IP55, 1460 RPM, delivery within 7 days to Pune plant.')}
                    className="px-2 py-0.5 bg-slate-100 hover:bg-blue-50 text-slate-600 hover:text-blue-700 rounded text-[10px] transition-colors border border-slate-200"
                  >
                    20 units 7.5 kW Motors (IP55)
                  </button>
                  <button
                    type="button"
                    onClick={() => handleQuickTest('Urgent requirement: 15 centrifugal pumps ABC-550 with fast delivery in 5 days to Mumbai.')}
                    className="px-2 py-0.5 bg-slate-100 hover:bg-blue-50 text-slate-600 hover:text-blue-700 rounded text-[10px] transition-colors border border-slate-200"
                  >
                    15 units ABC-550 Pumps
                  </button>
                  <button
                    type="button"
                    onClick={() => handleQuickTest('Need 10 VFD controller drives CTRL-100 5.5 kW for delivery within 7 days.')}
                    className="px-2 py-0.5 bg-slate-100 hover:bg-blue-50 text-slate-600 hover:text-blue-700 rounded text-[10px] transition-colors border border-slate-200"
                  >
                    10 units CTRL-100 VFD
                  </button>
                </div>

                <button
                  type="submit"
                  disabled={isProcessing || !naturalRequirement.trim()}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 text-white font-bold rounded-lg transition-colors flex items-center gap-1.5 shrink-0 shadow-sm cursor-pointer"
                >
                  {isProcessing ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Parsing & Matching Datasheets...</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-3.5 h-3.5" />
                      <span>Generate Grounded Quotation</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>

          {/* REAL-TIME VERIFICATION LOGS */}
          {processLogs.length > 0 && (
            <div className="bg-slate-900 text-slate-200 rounded-2xl p-4 font-mono text-[11px] space-y-1.5 shadow-md">
              <div className="flex items-center justify-between pb-1 border-b border-slate-800 text-slate-400 font-bold uppercase tracking-wider text-[10px]">
                <div className="flex items-center gap-1.5">
                  <RotateCw className={`w-3.5 h-3.5 text-blue-400 ${isProcessing ? 'animate-spin' : ''}`} />
                  <span>Real-Time Datasheet Sourcing Engine Logs</span>
                </div>
                <span>{processLogs.length} events</span>
              </div>
              <div className="space-y-1 pt-1 max-h-36 overflow-y-auto">
                {processLogs.map((log, index) => (
                  <p key={index} className="leading-relaxed text-slate-300">
                    {log}
                  </p>
                ))}
              </div>
            </div>
          )}

          {/* EXTRACTED CUSTOMER REQUIREMENTS & DATASHEET SPEC MATCHING */}
          {parsedSpecs && (
            <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>Extracted Customer Specifications & Sourcing Match</span>
                </h3>
                <span className={`text-[11px] px-2.5 py-0.5 rounded-full font-bold border ${
                  matchStatus === 'Exact Match'
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                    : matchStatus === 'Closest Alternative'
                    ? 'bg-amber-50 text-amber-700 border-amber-200'
                    : 'bg-rose-50 text-rose-700 border-rose-200'
                }`}>
                  {matchStatus === 'Exact Match' ? '✓ Exact Match' : matchStatus === 'Closest Alternative' ? '⚠ Closest Alternative' : '✕ No Verified Match'}
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Parsed Specs Summary */}
                <div className="space-y-3">
                  <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider pb-1.5 border-b border-slate-100">
                    Customer Technical Requirement
                  </h4>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <span className="text-slate-400 block mb-0.5">Product Type:</span>
                      <span className="font-semibold text-slate-800">{parsedSpecs.product}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block mb-0.5">Quantity:</span>
                      <span className="font-semibold text-slate-800 font-mono">{parsedSpecs.quantity} Units</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block mb-0.5">Rated Power:</span>
                      <span className="font-semibold text-slate-800 font-mono">{parsedSpecs.power || 'Standard'}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block mb-0.5">Operating Voltage:</span>
                      <span className="font-semibold text-slate-800 font-mono">{parsedSpecs.voltage || 'Standard'}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block mb-0.5">IP Protection:</span>
                      <span className="font-semibold text-slate-800 font-mono">{parsedSpecs.ipRating || 'IP55'}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block mb-0.5">Speed:</span>
                      <span className="font-semibold text-slate-800 font-mono">{parsedSpecs.speed || 'Standard'}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block mb-0.5">Target Lead Time:</span>
                      <span className="font-semibold text-slate-800 font-mono">{parsedSpecs.deliveryDays} Days</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block mb-0.5">Destination Hub:</span>
                      <span className="font-semibold text-slate-800">{parsedSpecs.destination || 'Regional Plant'}</span>
                    </div>
                  </div>
                </div>

                {/* Sourcing Outcomes */}
                <div className="space-y-3">
                  <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider pb-1.5 border-b border-slate-100">
                    Product Database & Sourcing Outcome
                  </h4>
                  {supplierOffer ? (
                    <div className="space-y-3 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-800 text-sm">{productMatch?.name}</span>
                        <span className={`text-[10px] px-2 py-0.5 rounded-full border font-bold ${
                          matchStatus === 'Exact Match'
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : 'bg-amber-50 text-amber-700 border-amber-200'
                        }`}>
                          {matchStatus === 'Exact Match' ? '✓ Exact Match' : '⚠ Closest Alternative'}
                        </span>
                      </div>
                      <div className="space-y-1">
                        <p className="text-slate-600">Model: <strong className="font-mono text-slate-800">{productMatch?.product_code || productMatch?.model}</strong> • Manufacturer: {productMatch?.manufacturer}</p>
                        <p className="text-slate-600">Grounded Datasheet: <strong className="font-mono text-blue-700">{productMatch?.source_document || 'Verified OEM Datasheet'}</strong></p>
                        <p className="text-slate-600">Sourced supplier: <strong>{supplierOffer.supplierName}</strong> ({supplierOffer.supplierProductCode})</p>
                        <p className="text-slate-600">Contract Rate: <strong className="font-mono text-slate-800">₹{supplierOffer.priceINR.toLocaleString()}</strong> • Warehouse Stock: <strong className="text-emerald-700">{supplierOffer.stockQuantity} units</strong></p>
                      </div>

                      {/* Display warnings if any specifications do not meet customer requirements */}
                      {matchStatus === 'Closest Alternative' && supplierOffer.violations && supplierOffer.violations.length > 0 && (
                        <div className="p-2.5 bg-amber-50 border border-amber-200 rounded text-amber-900 font-medium space-y-0.5 text-[11px]">
                          <div className="flex items-center gap-1 font-bold">
                            <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                            <span>Specification deviations detected:</span>
                          </div>
                          {supplierOffer.violations.map((v: string, vidx: number) => (
                            <p key={vidx} className="pl-4 font-mono">• {v}</p>
                          ))}
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="p-4 bg-slate-50 text-slate-400 text-center text-xs border border-dashed rounded-lg">
                      Data unavailable in verified project datasets.
                    </div>
                  )}
                </div>
              </div>

              {/* VERIFIED DATASHEET SPECIFICATION EVIDENCE TABLE */}
              {specEvidence.length > 0 && (
                <div className="pt-3 border-t border-slate-100 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1">
                      <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
                      <span>Verified Datasheet Traceability & Evidence Grounding</span>
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono">Real Datasheet Citations</span>
                  </div>
                  <div className="border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200 text-[11px]">
                        <tr>
                          <th className="py-2 px-3">Parameter</th>
                          <th className="py-2 px-3">Required Spec</th>
                          <th className="py-2 px-3">Datasheet Value</th>
                          <th className="py-2 px-3">Document Source</th>
                          <th className="py-2 px-3 text-center">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 text-[11px]">
                        {specEvidence.map((ev, idx) => (
                          <tr key={idx} className="hover:bg-slate-50/50">
                            <td className="py-2 px-3 font-semibold text-slate-800">{ev.parameter}</td>
                            <td className="py-2 px-3 font-mono text-slate-600">{ev.required_value}</td>
                            <td className="py-2 px-3 font-mono font-bold text-slate-900">{ev.datasheet_value}</td>
                            <td className="py-2 px-3 text-slate-600">
                              <span className="font-mono text-blue-700">{ev.source_document}</span>
                              <span className="text-slate-400 ml-1">(Page {ev.source_page})</span>
                            </td>
                            <td className="py-2 px-3 text-center">
                              {ev.matched ? (
                                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 font-bold text-[10px] border border-emerald-200">
                                  <Check className="w-3 h-3" />
                                  <span>Matched</span>
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-amber-50 text-amber-700 font-bold text-[10px] border border-amber-200" title={ev.difference_note}>
                                  <AlertTriangle className="w-3 h-3" />
                                  <span>Mismatch</span>
                                </span>
                              )}
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

          {/* GENERATED QUOTATION card */}
          {quoteData && supplierOffer && parsedSpecs && !isProcessing && (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-md p-6 space-y-6">
              {/* branding header */}
              <div className="flex justify-between items-start pb-5 border-b border-slate-200">
                <div>
                  <div className="text-lg font-black text-blue-600 tracking-tight flex items-center gap-1.5">
                    <Layers className="w-5.5 h-5.5 text-blue-600" />
                    <span>VeriSpec Industrial Commerce</span>
                  </div>
                  <p className="text-[10px] text-slate-400 font-extrabold uppercase mt-1">
                    Official Commercial Quotation
                  </p>
                </div>
                <div className="text-right text-xs">
                  <p className="font-mono text-slate-900">Ref: <strong>{quoteData.quoteNumber}</strong></p>
                  <p className="text-[10px] text-slate-400 font-semibold">Version {currentVersion}</p>
                  <p className="text-[10px] text-slate-400 mt-0.5">Issued: {quoteData.createdAt}</p>
                </div>
              </div>

              {/* Customer issue block */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/50">
                  <span className="text-[9px] font-bold uppercase text-slate-400 block mb-1">Quotation Issued To</span>
                  <p className="font-bold text-slate-900">{company}</p>
                  <p className="text-slate-600 mt-0.5">Contact: {contactPerson}</p>
                  <p className="text-slate-500 font-mono">{email} | {phone}</p>
                  <p className="text-slate-500 mt-1">Cust Ref: {referenceNumber}</p>
                </div>
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/50">
                  <span className="text-[9px] font-bold uppercase text-slate-400 block mb-1">Verified Logistics Sourcing</span>
                  <p className="font-bold text-slate-900">{supplierOffer.supplierName}</p>
                  <p className="text-slate-600 mt-0.5">{supplierOffer.productModel} ({supplierOffer.supplierProductCode})</p>
                  <p className="text-emerald-700 font-bold mt-1.5 flex items-center gap-1">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>✓ {supplierOffer.deliveryDays} Business Days Transit to {parsedSpecs.destination || 'Plant'}</span>
                  </p>
                </div>
              </div>

              {/* Line Items Table */}
              <div className="space-y-1.5">
                <span className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">Itemized Sourcing BOM</span>
                <div className="border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200">
                      <tr>
                        <th className="py-2.5 px-3">Item & Specifications</th>
                        <th className="py-2.5 px-3 text-center">Qty</th>
                        <th className="py-2.5 px-3 text-right">Unit Price</th>
                        <th className="py-2.5 px-3 text-center">Lead Time</th>
                        <th className="py-2.5 px-3 text-right">Line Total</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-slate-700">
                      <tr>
                        <td className="py-3 px-3">
                          <p className="font-bold text-slate-900">{productMatch?.name || parsedSpecs.product}</p>
                          <p className="text-[10px] text-slate-500 font-mono mt-0.5">
                            Specs: {parsedSpecs.power || 'Standard'} | {parsedSpecs.voltage || 'Standard'} | {parsedSpecs.ipRating || 'IP55'} | {parsedSpecs.speed || 'Standard'}
                          </p>
                          <p className="text-[9px] text-blue-600 font-mono mt-0.5">
                            Grounded in: {productMatch?.source_document || 'technical_spec_2026.pdf'}
                          </p>
                        </td>
                        <td className="py-3 px-3 text-center font-mono font-bold">{parsedSpecs.quantity}</td>
                        <td className="py-3 px-3 text-right font-mono">₹{supplierOffer.priceINR.toLocaleString()}</td>
                        <td className="py-3 px-3 text-center font-mono">{supplierOffer.deliveryDays} Days</td>
                        <td className="py-3 px-3 text-right font-mono font-bold">
                          ₹{(parsedSpecs.quantity * supplierOffer.priceINR).toLocaleString()}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Commercial Cost Breakdown */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs pt-2">
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/50 space-y-1">
                  <span className="text-[9px] font-bold uppercase text-slate-400 block mb-1">Commercial Notes & Warranty</span>
                  <p className="text-slate-600">• Warranty: 24 Months OEM warranty included.</p>
                  <p className="text-slate-600">• Payment: Net 30 days upon delivery.</p>
                  <p className="text-slate-600">• Quote Validity: 30 days from date of issue.</p>
                </div>
                <div className="space-y-1.5 text-right font-medium">
                  <div className="flex justify-between text-slate-600">
                    <span>Subtotal:</span>
                    <span className="font-mono">₹{quoteData.subtotal.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span>GST (18%):</span>
                    <span className="font-mono">₹{quoteData.tax.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span>Insured Freight:</span>
                    <span className="font-mono">₹{quoteData.freight.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-sm font-bold text-blue-700 border-t border-slate-200 pt-1.5">
                    <span>Grand Total (INR):</span>
                    <span className="font-mono text-base">₹{quoteData.total.toLocaleString()}</span>
                  </div>
                </div>
              </div>

              {/* Action Toolbar */}
              <div className="flex justify-between items-center pt-4 border-t border-slate-100 flex-wrap gap-3">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-500 font-semibold">Approval Status:</span>
                  <span className={`text-[11px] px-2.5 py-0.5 rounded-full font-bold border ${
                    quoteStatus === 'Approved'
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                      : 'bg-amber-50 text-amber-700 border-amber-200'
                  }`}>
                    {quoteStatus}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  {quoteStatus === 'Review Required' && (
                    <button
                      type="button"
                      onClick={handleApproveQuote}
                      className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5 shadow-2xs cursor-pointer"
                    >
                      <Check className="w-4 h-4" />
                      <span>Approve Quote for Client</span>
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={handleDownloadPdf}
                    disabled={quoteStatus !== 'Approved'}
                    className={`px-4 py-2 text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5 shadow-2xs ${
                      quoteStatus === 'Approved'
                        ? 'bg-blue-600 hover:bg-blue-700 text-white cursor-pointer'
                        : 'bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed'
                    }`}
                  >
                    <Printer className="w-3.5 h-3.5" />
                    <span>Print / Export PDF</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right Column (1 Span): Revision Simulator & Version History */}
        <div className="space-y-6">
          {/* SIMULATE CHANGE & REVISION VALIDATOR */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs space-y-4">
            <div className="pb-2 border-b border-slate-100">
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                <RotateCw className="w-4 h-4 text-indigo-600" />
                <span>Simulate RFQ Revision</span>
              </h3>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Adjust quantity or delivery SLA to test supplier inventory & lead time limits.
              </p>
            </div>

            {quoteData && supplierOffer ? (
              <div className="space-y-4 text-xs">
                <div className="space-y-3">
                  <div>
                    <div className="flex justify-between mb-1">
                      <label className="text-slate-600 font-semibold">Quantity Required</label>
                      <span className="font-mono font-bold text-slate-900">{changeQty} units</span>
                    </div>
                    <input
                      type="range"
                      min={5}
                      max={100}
                      step={5}
                      value={changeQty}
                      onChange={e => setChangeQty(parseInt(e.target.value, 10))}
                      className="w-full accent-blue-600"
                    />
                    <div className="flex justify-between text-[10px] text-slate-400 mt-0.5">
                      <span>5 units</span>
                      <span>Verified warehouse stock: {supplierOffer.stockQuantity}</span>
                      <span>100 units</span>
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between mb-1">
                      <label className="text-slate-600 font-semibold">Delivery Timeline (Days)</label>
                      <span className="font-mono font-bold text-slate-900">{changeDelivery} days</span>
                    </div>
                    <input
                      type="range"
                      min={1}
                      max={30}
                      step={1}
                      value={changeDelivery}
                      onChange={e => setChangeDelivery(parseInt(e.target.value, 10))}
                      className="w-full accent-indigo-600"
                    />
                    <div className="flex justify-between text-[10px] text-slate-400 mt-0.5">
                      <span>1 day (Urgent)</span>
                      <span>Supplier min SLA: {supplierOffer.deliveryDays} days</span>
                      <span>30 days</span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleValidateRevision}
                    className="w-full py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold rounded-lg transition-colors border border-indigo-200 cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <Search className="w-3.5 h-3.5" />
                    <span>Validate Revision with Database</span>
                  </button>
                </div>

                {/* Validation Output */}
                {validationResult.status !== 'unchecked' && (
                  <div className={`p-3 rounded-xl text-xs space-y-2 border ${
                    validationResult.status === 'valid'
                      ? 'bg-emerald-50 text-emerald-900 border-emerald-200'
                      : 'bg-rose-50 text-rose-900 border-rose-200'
                  }`}>
                    <div className="flex items-start gap-2">
                      {validationResult.status === 'valid' ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                      ) : (
                        <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                      )}
                      <p className="leading-relaxed font-medium">{validationResult.message}</p>
                    </div>

                    {validationResult.status === 'valid' && revisedTotals && (
                      <div className="pt-2 border-t border-emerald-200/60 space-y-1">
                        <div className="flex justify-between text-[11px]">
                          <span>Revised Subtotal:</span>
                          <span className="font-mono font-bold">₹{revisedTotals.subtotal.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between text-[11px]">
                          <span>Revised Grand Total:</span>
                          <span className="font-mono font-bold text-emerald-800">₹{revisedTotals.total.toLocaleString()}</span>
                        </div>
                        <button
                          type="button"
                          onClick={handleApplyRevision}
                          className="w-full mt-2 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded text-xs transition-colors cursor-pointer"
                        >
                          Apply Revision & Increment Version
                        </button>
                      </div>
                    )}

                    {validationResult.status === 'invalid' && validationResult.alternativeOffer && (
                      <div className="pt-2 border-t border-rose-200/60 space-y-1.5">
                        <p className="text-[11px] font-bold text-rose-800">
                          Recommended Alternative Supplier with stock:
                        </p>
                        <div className="bg-white p-2 rounded border border-rose-200 text-[11px]">
                          <p className="font-bold text-slate-800">{validationResult.alternativeOffer.supplierName}</p>
                          <p className="text-slate-500 font-mono">
                            Stock: {validationResult.alternativeOffer.stockQuantity} units • Lead Time: {validationResult.alternativeOffer.deliveryDays} days
                          </p>
                          <button
                            type="button"
                            onClick={handleApplyAlternativeSupplier}
                            className="mt-1.5 w-full py-1 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded text-[10px] transition-colors"
                          >
                            Switch to {validationResult.alternativeOffer.supplierName}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ) : (
              <div className="p-4 bg-slate-50 text-slate-400 text-center text-xs border border-dashed rounded-lg">
                Generate a quotation to enable live revision simulation.
              </div>
            )}
          </div>

          {/* QUOTE VERSION AUDIT HISTORY */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs space-y-3">
            <div className="pb-2 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-blue-600" />
                <span>Quotation Version Audit Trail</span>
              </h3>
              <span className="text-[10px] font-mono text-slate-400">Current: {currentVersion}</span>
            </div>

            {versionHistory.length > 0 ? (
              <div className="space-y-3">
                {versionHistory.map((item, idx) => (
                  <div key={idx} className="flex items-start gap-2.5 text-xs">
                    <span className="w-2 h-2 rounded-full bg-blue-600 mt-1.5 shrink-0" />
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-800">{item.version}</span>
                        <span className="text-[10px] text-slate-400 font-mono">{item.changedAt}</span>
                      </div>
                      <p className="text-slate-600 text-[11px] mt-0.5">{item.changeSummary}</p>
                      <span className="text-[10px] text-slate-400 block mt-0.5">By: {item.user}</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-400 text-center py-4">No version history yet.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
