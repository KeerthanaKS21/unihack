'use client';

import React, { useState, useEffect } from 'react';
import { useApp } from '@/context/AppContext';
import { PageHeader } from '@/components/layout/PageHeader';
import { StatusBadge } from '@/components/common/StatusBadge';
import { api } from '@/lib/api';
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
    Sliders,
    Plus,
    RefreshCw,
    Search,
    History
} from 'lucide-react';
import Link from 'next/link';

export default function CompatibilityPage() {
    const { compatibilityChecks, activeProduct, products, showToast } = useApp();

    // State for System Builder
    const [systemNodes, setSystemNodes] = useState<number[]>([]); // Start empty so user can build
    const [systemResult, setSystemResult] = useState<any>(null);
    const [systemProducts, setSystemProducts] = useState<any>({});
    const [catalogProducts, setCatalogProducts] = useState<any[]>([]);
    const [isChecking, setIsChecking] = useState(false);
    const [showAddModal, setShowAddModal] = useState(false);

    // State for Alternatives & What-If
    const [alternatives, setAlternatives] = useState<any[]>([]);
    const [hasSearchedAlternatives, setHasSearchedAlternatives] = useState(false);
    const [isSimulating, setIsSimulating] = useState(false);
    const [simulationResult, setSimulationResult] = useState<any>(null);

    // State for Explorer
    const [explorerAlternatives, setExplorerAlternatives] = useState<any[]>([]);
    const [selectedExplorerId, setSelectedExplorerId] = useState<number | null>(null);

    const [selectedPairId, setSelectedPairId] = useState<string>('');

    // State for History
    const [checkHistory, setCheckHistory] = useState<any[]>([]);

    // Fetch initial system check
    useEffect(() => {
        fetchCatalogProducts();
    }, []);

    useEffect(() => {
        if (systemNodes.length > 0) {
            checkSystemCompatibility();
            fetchSystemProducts();
        } else {
            setSystemResult(null);
            setSystemProducts({});
        }
    }, [systemNodes]);

    const fetchCatalogProducts = async () => {
        try {
            const res = await api.getProducts({ limit: 100 });
            setCatalogProducts(res.items || []);
        } catch (err) {
            console.error('Failed to fetch catalog products', err);
        }
    };

    const fetchSystemProducts = async () => {
        const productsMap: any = {};
        for (const id of systemNodes) {
            try {
                const p = await api.getProductById(id);
                productsMap[id] = p;
            } catch (e) {
                productsMap[id] = { name: `Product ${id}`, category: 'Unknown' };
            }
        }
        setSystemProducts(productsMap);
    };

    const checkSystemCompatibility = async () => {
        if (systemNodes.length < 2) return;
        setIsChecking(true);
        try {
            const res = await api.checkSystemCompatibility(systemNodes);
            setSystemResult(res);

            // Add to history
            const historyItem = {
                id: Date.now(),
                timestamp: new Date().toLocaleTimeString(),
                nodes: [...systemNodes],
                status: res.system_status,
                score: res.pair_results.length > 0 ? Math.round((res.pair_results.filter((r: any) => r.status === 'COMPATIBLE').length / res.pair_results.length) * 100) : 0
            };
            setCheckHistory(prev => [historyItem, ...prev].slice(0, 10)); // Keep last 10

            if (res.pair_results && res.pair_results.length > 0) {
                setSelectedPairId(`pair-0`);
            }
        } catch (err) {
            console.error(err);
            showToast({ type: 'error', title: 'Error', message: 'Failed to check system compatibility.' });
        } finally {
            setIsChecking(false);
        }
    };

    const findAlternatives = async (targetId: number, sourceId: number) => {
        setHasSearchedAlternatives(true);
        try {
            const res = await api.findAlternatives(targetId, sourceId);
            setAlternatives(res);
        } catch (err) {
            console.error(err);
        }
    };

    const runSimulation = async (replaceId: number, withId: number) => {
        setIsSimulating(true);
        try {
            const res = await api.simulateReplacement(systemNodes, replaceId, withId);
            setSimulationResult(res);
            showToast({ type: 'success', title: 'Simulation Complete', message: 'What-If scenario analyzed successfully.' });
        } catch (err) {
            console.error(err);
        } finally {
            setIsSimulating(false);
        }
    };

    const applySimulation = (replaceId: number, withId: number) => {
        setSystemNodes(prev => prev.map(id => id === replaceId ? withId : id));
        setSimulationResult(null);
        setAlternatives([]);
        setHasSearchedAlternatives(false);
    };

    const getProductDetails = (id: number) => {
        return systemProducts[id] || { name: `Product ${id}`, category: 'Unknown' };
    };

    const removeNode = (index: number) => {
        const newNodes = [...systemNodes];
        newNodes.splice(index, 1);
        setSystemNodes(newNodes);
    };

    const addNode = (id: number) => {
        setSystemNodes([...systemNodes, id]);
        setShowAddModal(false);
    };

    const activeCheck = systemResult?.pair_results?.[parseInt(selectedPairId.replace('pair-', '')) || 0];

    return (
        <div className="space-y-6 relative">
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

            {/* OVERALL RESULT */}
            {systemResult && (
                <div className={`rounded-2xl p-6 border shadow-xs flex items-center justify-between ${systemResult.system_status === 'COMPATIBLE' ? 'bg-emerald-50 border-emerald-200' :
                        systemResult.system_status === 'INCOMPATIBLE' ? 'bg-rose-50 border-rose-200' :
                            'bg-amber-50 border-amber-200'
                    }`}>
                    <div>
                        <h2 className={`text-2xl font-bold ${systemResult.system_status === 'COMPATIBLE' ? 'text-emerald-900' :
                                systemResult.system_status === 'INCOMPATIBLE' ? 'text-rose-900' :
                                    'text-amber-900'
                            }`}>
                            SYSTEM {systemResult.system_status}
                        </h2>
                        <p className="text-sm mt-1 opacity-80">
                            {systemResult.pair_results.filter((r: any) => r.status === 'COMPATIBLE').length} Compatible Relationships •
                            {systemResult.pair_results.filter((r: any) => r.status === 'INCOMPATIBLE').length} Critical Issues
                        </p>
                    </div>
                    <div className="text-right">
                        <div className="text-3xl font-black opacity-90">
                            {systemResult.pair_results.length > 0 ? Math.round((systemResult.pair_results.filter((r: any) => r.status === 'COMPATIBLE').length / systemResult.pair_results.length) * 100) : 0}%
                        </div>
                        <div className="text-xs font-bold uppercase tracking-wider opacity-70">Overall Score</div>
                    </div>
                </div>
            )}

            {/* SYSTEM BUILDER & HISTORY */}
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                <div className="lg:col-span-3 bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <h3 className="text-base font-bold text-slate-900 tracking-tight">
                                System Builder
                            </h3>
                            <p className="text-xs text-slate-500 mt-0.5">
                                Build and verify a multi-component industrial drive train.
                            </p>
                        </div>
                        <button
                            onClick={checkSystemCompatibility}
                            disabled={isChecking || systemNodes.length < 2}
                            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold rounded-lg transition-colors disabled:opacity-50"
                        >
                            {isChecking ? <RefreshCw className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                            Re-Check System
                        </button>
                    </div>

                    <div className="flex items-center gap-4 py-4 overflow-x-auto">
                        {systemNodes.length === 0 && (
                            <div className="p-8 text-center w-full border-2 border-dashed border-slate-200 rounded-xl text-slate-500">
                                <p className="mb-4">No components in the system yet.</p>
                                <button
                                    onClick={() => setShowAddModal(true)}
                                    className="px-4 py-2 bg-slate-900 text-white text-sm font-bold rounded-lg hover:bg-slate-800 inline-flex items-center gap-2"
                                >
                                    <Plus className="w-4 h-4" />
                                    Add First Component
                                </button>
                            </div>
                        )}
                        {systemNodes.map((nodeId, idx) => {
                            const product = getProductDetails(nodeId);
                            return (
                                <React.Fragment key={idx}>
                                    <div className="p-4 rounded-xl border-2 border-slate-200 bg-slate-50 min-w-[200px] relative group">
                                        <button
                                            onClick={() => removeNode(idx)}
                                            className="absolute -top-2 -right-2 bg-rose-100 text-rose-600 rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                                        >
                                            <XCircle className="w-4 h-4" />
                                        </button>
                                        <div className="flex items-center justify-between mb-2">
                                            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 bg-slate-200 px-2 py-0.5 rounded">
                                                {product.category}
                                            </span>
                                        </div>
                                        <h4 className="text-sm font-bold text-slate-900 truncate">
                                            {product.name}
                                        </h4>
                                        <p className="text-[11px] text-slate-500 font-mono mt-1">
                                            ID: {nodeId}
                                        </p>
                                    </div>
                                    {idx < systemNodes.length - 1 && (
                                        <ArrowRight className="w-6 h-6 text-slate-300 shrink-0" />
                                    )}
                                </React.Fragment>
                            );
                        })}
                        {systemNodes.length > 0 && (
                            <button
                                onClick={() => setShowAddModal(true)}
                                className="p-4 rounded-xl border-2 border-dashed border-slate-300 bg-slate-50 hover:bg-slate-100 flex flex-col items-center justify-center min-w-[150px] text-slate-500 transition-colors"
                            >
                                <Plus className="w-6 h-6 mb-1" />
                                <span className="text-xs font-bold">Add Product</span>
                            </button>
                        )}
                    </div>
                </div>

                {/* HISTORY SIDEBAR */}
                <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs flex flex-col h-full max-h-[300px]">
                    <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2 mb-3">
                        <History className="w-4 h-4 text-slate-500" />
                        Check History
                    </h3>
                    <div className="flex-1 overflow-y-auto space-y-2 pr-2">
                        {checkHistory.length === 0 ? (
                            <div className="text-xs text-slate-500 text-center py-4">No history yet.</div>
                        ) : (
                            checkHistory.map((h, i) => (
                                <div key={i} className="p-3 rounded-xl border border-slate-100 bg-slate-50 text-xs cursor-pointer hover:bg-slate-100 transition-colors" onClick={() => setSystemNodes(h.nodes)}>
                                    <div className="flex items-center justify-between mb-1">
                                        <span className="text-slate-500">{h.timestamp}</span>
                                        <StatusBadge status={h.status === 'COMPATIBLE' ? 'Compatible' : h.status === 'INCOMPATIBLE' ? 'Incompatible' : 'Warning'} size="sm" showIcon={false} />
                                    </div>
                                    <div className="font-bold text-slate-700">{h.nodes.length} Components</div>
                                    <div className="text-[10px] text-slate-500 mt-0.5">Score: {h.score}%</div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>

            {/* ADD PRODUCT MODAL */}
            {showAddModal && (
                <div className="fixed inset-0 bg-slate-900/50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden flex flex-col max-h-[80vh]">
                        <div className="p-4 border-b border-slate-200 flex items-center justify-between">
                            <h3 className="font-bold text-slate-900">Add Component to System</h3>
                            <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-slate-600">
                                <XCircle className="w-5 h-5" />
                            </button>
                        </div>
                        <div className="p-4 overflow-y-auto space-y-2 flex-1">
                            {catalogProducts.length === 0 ? (
                                <div className="text-center p-4 text-slate-500">No products found in catalog.</div>
                            ) : (
                                catalogProducts.map(p => (
                                    <div key={p.id} onClick={() => addNode(p.id)} className="p-3 border border-slate-200 rounded-xl hover:bg-slate-50 cursor-pointer flex items-center justify-between">
                                        <div>
                                            <h4 className="text-sm font-bold text-slate-900">{p.name}</h4>
                                            <p className="text-xs text-slate-500">{p.category} • {p.manufacturer}</p>
                                        </div>
                                        <Plus className="w-4 h-4 text-blue-600" />
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* RELATIONSHIP RESULTS */}
            {systemResult && systemResult.pair_results && systemResult.pair_results.length > 0 && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Left: Selectable Product Pairs List */}
                    <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs space-y-3">
                        <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block">
                            Pair-Level Results:
                        </span>

                        <div className="space-y-2">
                            {systemResult.pair_results.map((check: any, idx: number) => {
                                const pairId = `pair-${idx}`;
                                const isSelected = pairId === selectedPairId;

                                return (
                                    <div
                                        key={pairId}
                                        onClick={() => {
                                            setSelectedPairId(pairId);
                                            setAlternatives([]);
                                            setHasSearchedAlternatives(false);
                                            setSimulationResult(null);
                                        }}
                                        className={`p-3.5 rounded-xl border cursor-pointer transition-all ${isSelected
                                                ? 'bg-blue-50/60 border-blue-500 ring-2 ring-blue-100'
                                                : 'bg-white border-slate-200 hover:bg-slate-50'
                                            }`}
                                    >
                                        <div className="flex items-center justify-between mb-1">
                                            <span className="text-[10px] font-bold uppercase text-slate-500">
                                                Relationship
                                            </span>
                                            <StatusBadge status={check.status === 'COMPATIBLE' ? 'Compatible' : check.status === 'INCOMPATIBLE' ? 'Incompatible' : 'Warning'} size="sm" />
                                        </div>
                                        <h4 className="text-xs font-bold text-slate-900">
                                            {check.source_product} ↔ {check.target_product}
                                        </h4>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Right: Detailed Parameter Verification Matrix */}
                    <div className="lg:col-span-2 space-y-6">
                        {activeCheck && (
                            <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-5">
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <h3 className="text-base font-bold text-slate-900">
                                                {activeCheck.source_product} ⟷ {activeCheck.target_product}
                                            </h3>
                                        </div>
                                        <p className="text-xs text-slate-500 mt-0.5">
                                            Technical rule validation computed from engineering spec sheets.
                                        </p>
                                    </div>
                                    <StatusBadge status={activeCheck.status === 'COMPATIBLE' ? 'Compatible' : activeCheck.status === 'INCOMPATIBLE' ? 'Incompatible' : 'Warning'} size="lg" />
                                </div>

                                {/* Explanation Alert Box */}
                                <div className={`p-4 rounded-xl border text-xs leading-relaxed font-mono ${activeCheck.status === 'INCOMPATIBLE'
                                        ? 'bg-rose-50 border-rose-200 text-rose-950'
                                        : activeCheck.status === 'COMPATIBLE' ? 'bg-emerald-50 border-emerald-200 text-emerald-950'
                                            : 'bg-amber-50 border-amber-200 text-amber-950'
                                    }`}>
                                    {activeCheck.explanation}
                                </div>

                                {/* Parameter Checks Table */}
                                <div className="border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
                                    <table className="w-full text-left text-xs">
                                        <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                                            <tr>
                                                <th className="py-3 px-4">Parameter Check</th>
                                                <th className="py-3 px-4 text-blue-900 bg-blue-50/50">{activeCheck.source_product}</th>
                                                <th className="py-3 px-4 text-slate-700">{activeCheck.target_product}</th>
                                                <th className="py-3 px-4 text-right">Result</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100">
                                            {activeCheck.checks?.map((chk: any, idx: number) => (
                                                <tr key={idx} className={chk.status === 'PASS' ? 'hover:bg-slate-50' : 'bg-rose-50/30'}>
                                                    <td className="py-3 px-4">
                                                        <span className="font-bold text-slate-900 block">{chk.parameter}</span>
                                                        <span className="text-[11px] text-slate-500 font-normal mt-1 block">{chk.explanation}</span>
                                                    </td>
                                                    <td className="py-3 px-4 font-mono font-semibold text-blue-900 bg-blue-50/20">
                                                        {chk.primaryValue || 'Unknown'}
                                                    </td>
                                                    <td className="py-3 px-4 font-mono text-slate-700">
                                                        {chk.targetValue || 'Unknown'}
                                                    </td>
                                                    <td className="py-3 px-4 text-right">
                                                        {chk.status === 'PASS' ? (
                                                            <span className="inline-flex items-center text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 gap-1">
                                                                <CheckCircle2 className="w-3 h-3" />
                                                                Passed
                                                            </span>
                                                        ) : chk.status === 'FAIL' ? (
                                                            <span className="inline-flex items-center text-xs font-bold text-rose-700 bg-rose-100 px-2 py-0.5 rounded border border-rose-300 gap-1">
                                                                <XCircle className="w-3 h-3" />
                                                                Failed
                                                            </span>
                                                        ) : (
                                                            <span className="inline-flex items-center text-xs font-bold text-amber-700 bg-amber-100 px-2 py-0.5 rounded border border-amber-300 gap-1">
                                                                <AlertTriangle className="w-3 h-3" />
                                                                Unknown
                                                            </span>
                                                        )}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>

                                {/* ALTERNATIVE RECOMMENDATIONS */}
                                {activeCheck.status === 'INCOMPATIBLE' && (
                                    <div className="pt-4 border-t border-slate-200">
                                        <div className="flex items-center justify-between mb-4">
                                            <h4 className="text-sm font-bold text-slate-900">Find Compatible Alternative</h4>
                                            <button
                                                onClick={() => findAlternatives(activeCheck.target_product_id, activeCheck.source_product_id)}
                                                className="px-3 py-1.5 bg-slate-900 text-white text-xs font-bold rounded-lg hover:bg-slate-800 flex items-center gap-2"
                                            >
                                                <Search className="w-3 h-3" />
                                                Search Catalog
                                            </button>
                                        </div>

                                        {alternatives.length > 0 ? (
                                            <div className="space-y-3">
                                                {alternatives.map((alt, idx) => (
                                                    <div key={idx} className="p-4 rounded-xl border border-emerald-200 bg-emerald-50 flex items-center justify-between">
                                                        <div>
                                                            <div className="flex items-center gap-2">
                                                                <h5 className="text-sm font-bold text-emerald-900">{alt.product_name}</h5>
                                                                <span className="text-[10px] font-bold bg-emerald-200 text-emerald-800 px-2 py-0.5 rounded">
                                                                    {Math.round(alt.compatibility_score * 100)}% Match
                                                                </span>
                                                            </div>
                                                            <p className="text-xs text-emerald-700 mt-1">
                                                                Resolves: {alt.checks.filter((c: any) => c.status === 'PASS').map((c: any) => c.parameter).join(', ')}
                                                            </p>
                                                        </div>
                                                        <button
                                                            onClick={() => runSimulation(activeCheck.target_product_id, alt.product_id)}
                                                            disabled={isSimulating}
                                                            className="px-3 py-1.5 bg-emerald-600 text-white text-xs font-bold rounded-lg hover:bg-emerald-700 flex items-center gap-2 disabled:opacity-50"
                                                        >
                                                            <Sparkles className="w-3 h-3" />
                                                            What If?
                                                        </button>
                                                    </div>
                                                ))}
                                            </div>
                                        ) : hasSearchedAlternatives ? (
                                            <div className="p-4 border-2 border-dashed border-slate-200 rounded-xl text-center text-slate-500 text-sm">
                                                No compatible component found.
                                            </div>
                                        ) : null}
                                    </div>
                                )}

                                {/* WHAT-IF SIMULATION RESULT */}
                                {simulationResult && (
                                    <div className="pt-4 border-t border-slate-200">
                                        <h4 className="text-sm font-bold text-slate-900 mb-4">Simulation Result</h4>
                                        <div className="p-4 rounded-xl border-2 border-blue-200 bg-blue-50">
                                            <div className="flex items-center justify-between mb-3">
                                                <span className="text-xs font-bold text-blue-900">New System Status:</span>
                                                <StatusBadge status={simulationResult.system_status === 'COMPATIBLE' ? 'Compatible' : 'Incompatible'} size="md" />
                                            </div>
                                            <div className="text-xs text-blue-800 mb-4 space-y-2">
                                                <p className="font-bold">
                                                    {simulationResult.system_status === 'COMPATIBLE'
                                                        ? 'Why this alternative works:'
                                                        : 'Why this alternative fails in the broader system:'}
                                                </p>
                                                <ul className="list-disc pl-4 space-y-1">
                                                    {simulationResult.system_status === 'COMPATIBLE'
                                                        ? simulationResult.pair_results
                                                            .flatMap((r: any) => r.checks)
                                                            .filter((c: any) => c.status === 'PASS')
                                                            .map((c: any, idx: number) => (
                                                                <li key={idx}>
                                                                    <span className="font-semibold">{c.parameter}:</span> {c.explanation}
                                                                </li>
                                                            ))
                                                        : simulationResult.pair_results
                                                            .flatMap((r: any) => r.checks)
                                                            .filter((c: any) => c.status === 'FAIL')
                                                            .map((c: any, idx: number) => (
                                                                <li key={idx} className="text-rose-700">
                                                                    <span className="font-semibold">{c.parameter}:</span> {c.explanation}
                                                                </li>
                                                            ))
                                                    }
                                                </ul>
                                            </div>
                                            <button
                                                onClick={() => applySimulation(activeCheck.target_product_id, alternatives[0]?.product_id)}
                                                className="w-full py-2 bg-blue-600 text-white text-sm font-bold rounded-lg hover:bg-blue-700"
                                            >
                                                Apply Replacement to System
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* COMPATIBILITY EXPLORER */}
            <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-4 mt-8">
                <div>
                    <h3 className="text-base font-bold text-slate-900 tracking-tight flex items-center gap-2">
                        <Sparkles className="w-5 h-5 text-blue-600" />
                        Compatibility Explorer
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                        Select a component to see all other components in the catalog that are compatible with it.
                    </p>
                </div>

                <div className="flex flex-col sm:flex-row gap-4">
                    <div className="w-full sm:w-1/3">
                        <label className="block text-xs font-bold text-slate-700 mb-2">Select a Component</label>
                        <select
                            className="w-full p-2.5 border border-slate-300 rounded-lg text-sm bg-slate-50"
                            onChange={async (e) => {
                                const id = parseInt(e.target.value);
                                setSelectedExplorerId(id || null);
                                if (!id) {
                                    setExplorerAlternatives([]);
                                    return;
                                }
                                try {
                                    const res = await api.exploreCompatibleProducts(id);
                                    setExplorerAlternatives(res);
                                } catch (err) {
                                    console.error(err);
                                }
                            }}
                        >
                            <option value="">-- Choose a component --</option>
                            {catalogProducts.map(p => (
                                <option key={p.id} value={p.id}>{p.name} ({p.category})</option>
                            ))}
                        </select>
                    </div>

                    <div className="w-full sm:w-2/3">
                        <label className="block text-xs font-bold text-slate-700 mb-2">Compatible Suggestions</label>
                        {explorerAlternatives.length > 0 ? (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                {explorerAlternatives.map((alt, idx) => (
                                    <div key={idx} className="p-3 rounded-xl border border-emerald-200 bg-emerald-50">
                                        <div className="flex items-center justify-between mb-1">
                                            <span className="text-[10px] font-bold uppercase text-emerald-800 bg-emerald-200 px-2 py-0.5 rounded">
                                                {alt.category}
                                            </span>
                                            <span className="text-[10px] font-bold text-emerald-700">
                                                {Math.round(alt.score * 100)}% Match
                                            </span>
                                        </div>
                                        <h4 className="text-sm font-bold text-emerald-900">{alt.product_name}</h4>
                                        <p className="text-[10px] text-emerald-700 mt-1 truncate">
                                            Matches: {alt.checks.map((c: any) => c.parameter).join(', ')}
                                        </p>
                                    </div>
                                ))}
                            </div>
                        ) : selectedExplorerId ? (
                            <div className="p-6 border-2 border-dashed border-slate-200 rounded-xl text-center text-slate-500 text-sm">
                                No compatible component found.
                            </div>
                        ) : (
                            <div className="p-6 border-2 border-dashed border-slate-200 rounded-xl text-center text-slate-500 text-sm">
                                Select a component to see compatible suggestions.
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
