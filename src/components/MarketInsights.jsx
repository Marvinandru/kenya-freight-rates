import React from 'react';
import { useRates } from '../context/RatesContext';
import { MARKET_BULLETINS } from '../data/initialRates';
import { 
  Sparkles, 
  TrendingUp, 
  Fuel, 
  PlaneTakeoff, 
  ShieldCheck, 
  AlertCircle, 
  ThermometerSnowflake, 
  BarChart3, 
  Calendar, 
  Layers, 
  ArrowUpRight,
  Leaf
} from 'lucide-react';

export const MarketInsights = () => {
  const { airlines } = useRates();

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Title */}
      <div className="mb-6">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold mb-2">
          <Leaf className="w-3.5 h-3.5" />
          <span>Fresh Produce Export Regulations & Cold Logistics</span>
        </div>
        <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
          Horticulture Export Market & KEPHIS Intelligence
        </h2>
        <p className="text-sm text-slate-300 mt-1">
          Daily updates on avocado harvesting season, EU False Codling Moth (FCM) inspections for fresh chillies, and JKIA cold storage space.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left: Market Bulletins */}
        <div className="lg:col-span-7 space-y-4">
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <Calendar className="w-4 h-4 text-emerald-400" />
            Today’s Fresh Produce Advisories
          </h3>

          <div className="space-y-4">
            {MARKET_BULLETINS.map(item => (
              <div
                key={item.id}
                className="glass-panel p-5 rounded-2xl border border-slate-800 hover:border-slate-700 transition-all"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                    {item.badge}
                  </span>
                  <span className="text-[11px] font-mono text-slate-400">{item.date}</span>
                </div>

                <h4 className="text-base font-bold text-white mb-2">{item.title}</h4>
                <p className="text-xs text-slate-300 leading-relaxed">{item.content}</p>
              </div>
            ))}

            {/* Produce Guidelines Box */}
            <div className="glass-panel p-5 rounded-2xl border border-emerald-500/20 bg-emerald-950/10">
              <div className="flex items-center gap-2 text-emerald-400 font-bold text-sm mb-2">
                <ThermometerSnowflake className="w-4 h-4" />
                Produce Optimal Holding Temperatures
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs text-slate-300 pt-1">
                <div className="bg-slate-900/80 p-2.5 rounded-lg border border-slate-800">
                  <span className="font-bold text-white block">🥑 Avocados:</span>
                  <span className="font-mono text-emerald-400">+4°C to +6°C</span>
                  <p className="text-[10px] text-slate-400 mt-1">Pre-cooled 24h prior to flight</p>
                </div>
                <div className="bg-slate-900/80 p-2.5 rounded-lg border border-slate-800">
                  <span className="font-bold text-white block">🫘 Soya & Beans:</span>
                  <span className="font-mono text-teal-300">+2°C to +4°C</span>
                  <p className="text-[10px] text-slate-400 mt-1">95% relative humidity</p>
                </div>
                <div className="bg-slate-900/80 p-2.5 rounded-lg border border-slate-800">
                  <span className="font-bold text-white block">🌶️ Fresh Chillies:</span>
                  <span className="font-mono text-rose-300">+7°C to +10°C</span>
                  <p className="text-[10px] text-slate-400 mt-1">Avoid chilling below +7°C</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right: Key Airline Freighter Directory */}
        <div className="lg:col-span-5 space-y-4">
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <PlaneTakeoff className="w-4 h-4 text-emerald-400" />
            Produce Cargo Airlines Monitored
          </h3>

          <div className="space-y-3">
            {airlines.map(carrier => (
              <div
                key={carrier.id}
                className="glass-panel p-4 rounded-xl border border-slate-800 hover:border-slate-700 transition-all flex items-start gap-3"
              >
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm font-mono border ${carrier.logoBg} shrink-0`}>
                  {carrier.code}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <h5 className="font-bold text-sm text-white truncate">{carrier.name}</h5>
                    <span className="text-[10px] font-semibold text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20">
                      {carrier.badge}
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-400 mt-0.5">
                    <span className="text-slate-500">Hub:</span> {carrier.hub}
                  </div>
                  <div className="text-[11px] text-slate-400 truncate">
                    <span className="text-slate-500">Fleet:</span> {carrier.fleet}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
