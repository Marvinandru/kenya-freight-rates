import React from 'react';
import { useRates } from '../context/RatesContext';
import { X, TrendingDown, TrendingUp, Minus, Calendar, Plane, ShieldCheck, Clock } from 'lucide-react';

export const RateHistoryModal = () => {
  const { selectedRouteForHistory, setSelectedRouteForHistory, airlines, airports, commodities, currencyMode, exchangeRate } = useRates();

  if (!selectedRouteForHistory) return null;

  const item = selectedRouteForHistory;
  const airline = airlines.find(a => a.id === item.airlineId);
  const dest = airports[item.destination];
  const orig = airports[item.origin];
  const comm = commodities.find(c => c.id === item.commodity);

  const history = item.history7d || [item.rate1000kg];
  const minRate = Math.min(...history);
  const maxRate = Math.max(...history);
  const range = maxRate - minRate || 1;

  const formatPrice = (usdVal) => {
    if (currencyMode === 'KES') {
      return `KSh ${(usdVal * exchangeRate).toFixed(0)}`;
    }
    return `$${Number(usdVal).toFixed(2)}`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div className="glass-panel w-full max-w-lg rounded-3xl border border-slate-700 shadow-2xl overflow-hidden bg-slate-950">
        {/* Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-slate-900/90">
          <div className="flex items-center gap-3">
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-xs font-mono border ${airline?.logoBg}`}>
              {item.airlineId}
            </div>
            <div>
              <h3 className="font-bold text-white text-sm sm:text-base">
                {airline?.name} • {orig?.code} ➔ {dest?.code}
              </h3>
              <p className="text-xs text-slate-400">
                {comm?.name} ({dest?.city}, {dest?.country})
              </p>
            </div>
          </div>
          <button
            onClick={() => setSelectedRouteForHistory(null)}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-5">
          {/* Current Rate Highlights */}
          <div className="grid grid-cols-2 gap-3 bg-slate-900/80 p-3.5 rounded-2xl border border-slate-800">
            <div>
              <span className="text-[11px] text-slate-400 block">Today's +1000kg Rate</span>
              <span className="text-2xl font-mono font-extrabold text-sky-400">
                {formatPrice(item.rate1000kg)}
              </span>
              <span className="text-xs text-slate-500 ml-1">/ KG</span>
            </div>

            <div>
              <span className="text-[11px] text-slate-400 block">7-Day Trend</span>
              <div className="flex items-center gap-1.5 mt-1">
                {item.changeDirection === 'down' ? (
                  <span className="flex items-center gap-1 text-emerald-400 font-bold text-sm bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20 font-mono">
                    <TrendingDown className="w-4 h-4" /> -${Math.abs(item.changeAmount || 0).toFixed(2)}
                  </span>
                ) : item.changeDirection === 'up' ? (
                  <span className="flex items-center gap-1 text-rose-400 font-bold text-sm bg-rose-500/10 px-2 py-0.5 rounded border border-rose-500/20 font-mono">
                    <TrendingUp className="w-4 h-4" /> +${(item.changeAmount || 0).toFixed(2)}
                  </span>
                ) : (
                  <span className="flex items-center gap-1 text-slate-300 font-bold text-sm bg-slate-800 px-2 py-0.5 rounded border border-slate-700">
                    <Minus className="w-4 h-4" /> Stable
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Sparkline / Bar Chart */}
          <div>
            <div className="flex justify-between items-center text-xs text-slate-400 mb-2">
              <span className="font-semibold text-slate-300">7-Day Daily Rate Movement (USD/kg)</span>
              <span className="font-mono text-[11px]">Last 7 Daily Updates</span>
            </div>

            <div className="h-32 bg-slate-900/50 p-4 rounded-2xl border border-slate-800 flex items-end justify-between gap-2">
              {history.map((val, idx) => {
                const heightPct = Math.max(25, Math.min(100, ((val - minRate) / range) * 75 + 25));
                const isLatest = idx === history.length - 1;

                return (
                  <div key={idx} className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end group">
                    <span className="text-[10px] font-mono text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity">
                      ${val.toFixed(2)}
                    </span>
                    <div
                      style={{ height: `${heightPct}%` }}
                      className={`w-full rounded-t-lg transition-all duration-300 ${
                        isLatest 
                          ? 'bg-gradient-to-t from-sky-600 to-sky-400 shadow-md shadow-sky-500/30' 
                          : 'bg-slate-700 hover:bg-slate-600'
                      }`}
                    />
                    <span className="text-[10px] font-mono text-slate-500">
                      {isLatest ? 'Today' : `D-${history.length - 1 - idx}`}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Surcharge details */}
          <div className="p-3.5 rounded-xl bg-slate-900/50 border border-slate-800 text-xs space-y-1.5 font-mono">
            <div className="flex justify-between text-slate-400">
              <span>Fuel Surcharge (FSC):</span>
              <span className="text-white">${item.fuelSurcharge?.toFixed(2)}/kg</span>
            </div>
            <div className="flex justify-between text-slate-400">
              <span>Security Surcharge (SSC):</span>
              <span className="text-white">${item.secSurcharge?.toFixed(2)}/kg</span>
            </div>
            <div className="flex justify-between text-slate-400">
              <span>Ground / KAA Handling:</span>
              <span className="text-white">${item.handlingFee?.toFixed(2)}/kg</span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-900/80 flex justify-end">
          <button
            onClick={() => setSelectedRouteForHistory(null)}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-semibold"
          >
            Close History
          </button>
        </div>
      </div>
    </div>
  );
};
