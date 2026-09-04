import React, { useState } from 'react';
import { useRates } from '../context/RatesContext';
import { 
  X, 
  Save, 
  Sparkles, 
  Upload, 
  Download, 
  Plus, 
  Trash2, 
  RefreshCcw, 
  Sliders, 
  Edit3, 
  Check, 
  AlertCircle,
  FileSpreadsheet,
  DollarSign,
  TrendingUp,
  FolderLock,
  Building2,
  ShieldCheck,
  CheckCircle2,
  CreditCard,
  Calendar
} from 'lucide-react';

export const AdminManager = () => {
  const { 
    isAdminOpen, 
    setIsAdminOpen, 
    rates, 
    airlines, 
    airports, 
    commodities, 
    profitMarginPerKg, 
    setProfitMarginPerKg,
    shipments,
    approveShipment,
    triggerApprovalNotice,
    clients,
    totalTonnageKg,
    totalProfitEarnedUSD,
    updateRate, 
    applyBulkAdjustment, 
    publishDailyRates, 
    resetToDefaults, 
    currencyMode,
    exchangeRate,
    showNotification 
  } = useRates();

  const [activeSubTab, setActiveSubTab] = useState('inline'); // 'inline' | 'profit' | 'shipments' | 'bulk'
  const [marginInput, setMarginInput] = useState(profitMarginPerKg);

  // Bulk Adjust State
  const [bulkAirline, setBulkAirline] = useState('all');
  const [bulkRegion, setBulkRegion] = useState('all');
  const [bulkCommodity, setBulkCommodity] = useState('all');
  const [bulkDelta, setBulkDelta] = useState(0.05);

  const formatPrice = (usdVal) => {
    if (currencyMode === 'KES') {
      return `KSh ${(usdVal * exchangeRate).toFixed(0)}`;
    }
    return `$${Number(usdVal).toFixed(2)}`;
  };

  if (!isAdminOpen) return null;

  const handleSaveMargin = (e) => {
    e.preventDefault();
    setProfitMarginPerKg(Number(marginInput));
    showNotification(`Profit margin updated to $${Number(marginInput).toFixed(2)} USD per KG!`);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div className="glass-panel w-full max-w-6xl max-h-[92vh] rounded-3xl border border-slate-700 shadow-2xl flex flex-col overflow-hidden bg-slate-950">
        {/* Header */}
        <div className="p-5 sm:px-6 border-b border-slate-800 flex items-center justify-between bg-slate-900/90">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
              <Sliders className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                Produce Freight & Profit Admin Console
                <span className="text-[11px] font-mono font-normal bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded">
                  Margin: +${profitMarginPerKg.toFixed(2)}/kg
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Manage airline rates, adjust profit margins, oversee client shipments, and publish daily updates.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => publishDailyRates()}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white text-xs font-bold shadow-lg shadow-emerald-500/20 transition-all active:scale-95"
            >
              <Sparkles className="w-3.5 h-3.5" />
              Publish Today's Rates
            </button>

            <button
              onClick={() => setIsAdminOpen(false)}
              className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Sub Navigation Tabs */}
        <div className="flex border-b border-slate-800 bg-slate-900/50 px-6 gap-2 pt-2 text-xs font-semibold overflow-x-auto no-scrollbar">
          <button
            onClick={() => setActiveSubTab('inline')}
            className={`pb-3 px-3 border-b-2 flex items-center gap-1.5 transition-all whitespace-nowrap ${
              activeSubTab === 'inline'
                ? 'border-emerald-500 text-emerald-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Edit3 className="w-3.5 h-3.5" />
            Airline Rates Editor ({rates.length})
          </button>

          <button
            onClick={() => setActiveSubTab('profit')}
            className={`pb-3 px-3 border-b-2 flex items-center gap-1.5 transition-all whitespace-nowrap ${
              activeSubTab === 'profit'
                ? 'border-emerald-500 text-emerald-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <DollarSign className="w-3.5 h-3.5" />
            Profit Margin & Revenue Engine
          </button>

          <button
            onClick={() => setActiveSubTab('shipments')}
            className={`pb-3 px-3 border-b-2 flex items-center gap-1.5 transition-all whitespace-nowrap ${
              activeSubTab === 'shipments'
                ? 'border-emerald-500 text-emerald-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <FolderLock className="w-3.5 h-3.5" />
            Client Shipments & Documents ({shipments.length})
          </button>

          <button
            onClick={() => setActiveSubTab('bulk')}
            className={`pb-3 px-3 border-b-2 flex items-center gap-1.5 transition-all whitespace-nowrap ${
              activeSubTab === 'bulk'
                ? 'border-emerald-500 text-emerald-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Sliders className="w-3.5 h-3.5" />
            Bulk Rate Adjuster
          </button>

        </div>

        {/* Tab Body */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* TAB 1: INLINE RATE EDITOR */}
          {activeSubTab === 'inline' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
                <span>Airline Base Rates in USD. The client will see these rates with <strong>+${profitMarginPerKg.toFixed(2)} USD/kg</strong> profit added.</span>
                <span className="font-mono text-emerald-400 font-bold">Active Profit: +${profitMarginPerKg.toFixed(2)}/kg</span>
              </div>

              <div className="overflow-x-auto border border-slate-800 rounded-xl">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-900 border-b border-slate-800 text-[11px] text-slate-400 font-semibold uppercase tracking-wider">
                      <th className="py-2.5 px-3">Carrier</th>
                      <th className="py-2.5 px-3">Route</th>
                      <th className="py-2.5 px-3">Produce Item</th>
                      <th className="py-2.5 px-2 text-right">Airline Base (+1000kg)</th>
                      <th className="py-2.5 px-3 text-right text-emerald-400 font-bold">Client Quoted Rate</th>
                      <th className="py-2.5 px-2 text-right">Fuel FSC</th>
                      <th className="py-2.5 px-2 text-right">Sec SSC</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/80 font-mono">
                    {rates.map(item => {
                      const airline = airlines.find(a => a.id === item.airlineId);
                      const clientRate = (Number(item.rate1000kg) + profitMarginPerKg).toFixed(2);
                      return (
                        <tr key={item.id} className="hover:bg-slate-900/60 transition-colors">
                          <td className="py-2 px-3 font-sans font-bold text-white whitespace-nowrap">
                            <span className="px-1.5 py-0.5 rounded bg-slate-800 text-emerald-300 mr-1.5 text-[10px]">
                              {item.airlineId}
                            </span>
                            {airline?.name.split(' ')[0] || item.airlineId}
                          </td>
                          <td className="py-2 px-3 text-slate-300 whitespace-nowrap font-bold">
                            {item.origin}➔{item.destination}
                          </td>
                          <td className="py-2 px-3 font-sans text-slate-300">
                            {commodities.find(c => c.id === item.commodity)?.name.split(' (')[0] || item.commodity}
                          </td>

                          {/* Base rate input */}
                          <td className="py-1.5 px-2 text-right">
                            <input
                              type="number"
                              step="0.01"
                              value={item.rate1000kg}
                              onChange={(e) => updateRate(item.id, { rate1000kg: Number(e.target.value) })}
                              className="w-20 bg-slate-900 border border-slate-700 rounded px-2 py-1 text-right text-white focus:border-emerald-500 focus:outline-none"
                            />
                          </td>

                          {/* Quoted selling rate preview */}
                          <td className="py-1.5 px-3 text-right font-bold text-emerald-400 bg-emerald-950/20">
                            ${clientRate} / kg
                          </td>

                          {/* FSC input */}
                          <td className="py-1.5 px-2 text-right">
                            <input
                              type="number"
                              step="0.01"
                              value={item.fuelSurcharge}
                              onChange={(e) => updateRate(item.id, { fuelSurcharge: Number(e.target.value) })}
                              className="w-14 bg-slate-900 border border-slate-700 rounded px-1.5 py-1 text-right text-slate-300 focus:border-emerald-500 focus:outline-none"
                            />
                          </td>

                          {/* SSC input */}
                          <td className="py-1.5 px-2 text-right">
                            <input
                              type="number"
                              step="0.01"
                              value={item.secSurcharge}
                              onChange={(e) => updateRate(item.id, { secSurcharge: Number(e.target.value) })}
                              className="w-14 bg-slate-900 border border-slate-700 rounded px-1.5 py-1 text-right text-slate-300 focus:border-emerald-500 focus:outline-none"
                            />
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 2: PROFIT MARGIN ENGINE */}
          {activeSubTab === 'profit' && (
            <div className="max-w-2xl mx-auto space-y-6">
              {/* Revenue KPI Summary */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                <div className="glass-card p-4 rounded-2xl border border-emerald-500/30 bg-emerald-950/20">
                  <span className="text-xs text-slate-400 block">Total Profit Margin</span>
                  <span className="text-2xl font-mono font-extrabold text-emerald-400">
                    +${profitMarginPerKg.toFixed(2)}
                  </span>
                  <span className="text-[11px] text-slate-400 block mt-0.5">Per KG Shipped</span>
                </div>

                <div className="glass-card p-4 rounded-2xl border border-slate-800">
                  <span className="text-xs text-slate-400 block">Total Shipped Volume</span>
                  <span className="text-2xl font-mono font-extrabold text-white">
                    {totalTonnageKg.toLocaleString()} KG
                  </span>
                  <span className="text-[11px] text-slate-400 block mt-0.5">Across Active Bookings</span>
                </div>

                <div className="glass-card p-4 rounded-2xl border border-slate-800">
                  <span className="text-xs text-slate-400 block">Total Profit Earned</span>
                  <span className="text-2xl font-mono font-extrabold text-teal-300">
                    ${totalProfitEarnedUSD.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </span>
                  <span className="text-[11px] text-slate-400 block mt-0.5">USD Revenue</span>
                </div>
              </div>

              {/* Profit Settings Form */}
              <form onSubmit={handleSaveMargin} className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-4 text-xs">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <DollarSign className="w-4 h-4 text-emerald-400" />
                  Configure Service Profit Markup
                </h3>
                <p className="text-slate-400 text-xs leading-relaxed">
                  This dollar amount will be automatically added on top of every base airline freight rate across the website, rate table, cargo calculator, and client invoices.
                </p>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Your Profit Margin in USD per KG</label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 font-mono text-emerald-400 font-bold text-base">$</span>
                    <input
                      type="number"
                      step="0.05"
                      min="0"
                      value={marginInput}
                      onChange={(e) => setMarginInput(e.target.value)}
                      className="w-full bg-slate-900 border border-emerald-500 rounded-xl pl-8 pr-16 py-2.5 font-mono text-lg font-bold text-white focus:outline-none"
                    />
                    <span className="absolute right-3.5 top-1/2 -translate-y-1/2 font-mono text-slate-400 text-xs">USD / KG</span>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 space-y-1 text-[11px]">
                  <div className="flex justify-between text-slate-400">
                    <span>Example: 1,800 KG Avocado Pallet to Amsterdam</span>
                    <span>1,800 KG $\times$ ${Number(marginInput).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between font-bold text-emerald-400 pt-1 border-t border-slate-800">
                    <span>Your Net Profit on this shipment:</span>
                    <span>${(1800 * Number(marginInput)).toFixed(2)} USD</span>
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl shadow-lg transition-all"
                >
                  Save Profit Margin Setting
                </button>
              </form>
            </div>
          )}

          {/* TAB 3: CLIENT SHIPMENTS & DOCUMENTS */}
          {activeSubTab === 'shipments' && (
            <div className="space-y-4 text-xs">
              <div className="flex items-center justify-between text-slate-400">
                <span>Overview of all produce exporter shipments and verified document archives.</span>
                <span className="font-mono text-white">{shipments.length} Active Bookings</span>
              </div>

              <div className="space-y-3">
                {shipments.map(shp => (
                  <div key={shp.id} className="glass-panel p-4 rounded-2xl border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-mono font-bold text-emerald-400">AWB: {shp.awbNumber}</span>
                        <span className="font-bold text-white">({shp.clientCompany})</span>
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold bg-${shp.statusColor}-500/10 text-${shp.statusColor}-400 border border-${shp.statusColor}-500/20`}>
                          {shp.status}
                        </span>
                        <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-amber-500/10 text-amber-300 border border-amber-500/20">
                          {shp.paymentStatus || 'Pending Advance Payment'}
                        </span>
                      </div>
                      <div className="text-slate-400 text-[11px]">
                        {shp.commodityName} • {shp.origin} ➔ {shp.destination} • {shp.chargeableWeight} KG via {shp.airlineName}
                      </div>
                      <div className="text-[11px] text-emerald-400 font-semibold">
                        Attached Docs: {shp.documents.map(d => d.name.split(' (')[0]).join(', ')}
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      <div className="text-right font-mono">
                        <div className="text-[10px] text-slate-500">Your Profit on Booking:</div>
                        <div className="text-base font-bold text-emerald-400">+${shp.totalProfitUSD || (shp.chargeableWeight * profitMarginPerKg).toFixed(2)} USD</div>
                        <div className="text-[10px] text-slate-400">Total: {formatPrice(shp.grandTotalUSD)}</div>
                      </div>

                      <div className="flex flex-col gap-1.5 shrink-0">
                        <button
                          onClick={() => approveShipment(shp.id)}
                          className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-[11px] flex items-center gap-1 shadow-sm transition-all"
                        >
                          <CheckCircle2 className="w-3 h-3" />
                          <span>Approve & Notice</span>
                        </button>
                        <button
                          onClick={() => triggerApprovalNotice(shp)}
                          className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-amber-300 border border-amber-500/30 text-[11px] flex items-center gap-1 transition-all"
                        >
                          <CreditCard className="w-3 h-3" />
                          <span>View Bank Wire</span>
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 4: BULK RATE ADJUSTER */}
          {activeSubTab === 'bulk' && (
            <div className="max-w-xl mx-auto space-y-5 bg-slate-900/60 p-6 rounded-2xl border border-slate-800 text-xs">
              <h3 className="text-base font-bold text-white">Bulk Produce Rate Adjustment</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Target Airline</label>
                  <select
                    value={bulkAirline}
                    onChange={(e) => setBulkAirline(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-white"
                  >
                    <option value="all">All Airlines</option>
                    {airlines.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Produce Commodity</label>
                  <select
                    value={bulkCommodity}
                    onChange={(e) => setBulkCommodity(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-white"
                  >
                    <option value="all">All Commodities</option>
                    {commodities.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Fixed Delta ($/kg)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={bulkDelta}
                    onChange={(e) => setBulkDelta(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-white font-mono"
                  />
                </div>

                <button
                  onClick={() => applyBulkAdjustment({
                    airlineId: bulkAirline,
                    destinationRegion: bulkRegion,
                    commodity: bulkCommodity,
                    deltaAmount: bulkDelta
                  })}
                  className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl shadow-lg"
                >
                  Apply Adjustment
                </button>
              </div>
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-900/90 flex items-center justify-between text-xs">
          <button onClick={resetToDefaults} className="text-slate-500 hover:text-rose-400 flex items-center gap-1">
            <RefreshCcw className="w-3 h-3" /> Reset rates
          </button>
          <button
            onClick={() => setIsAdminOpen(false)}
            className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl"
          >
            Done & Return to Site
          </button>
        </div>
      </div>
    </div>
  );
};
