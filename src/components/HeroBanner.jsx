import React from 'react';
import { useRates } from '../context/RatesContext';
import { 
  TrendingDown, 
  TrendingUp, 
  Plane, 
  ShieldCheck, 
  Sparkles, 
  Layers, 
  ArrowRight, 
  Download, 
  Calendar, 
  CheckCircle2, 
  Share2,
  Leaf,
  Clock,
  RefreshCw
} from 'lucide-react';

export const HeroBanner = () => {
  const { 
    rates, 
    lastUpdated, 
    refreshToToday,
    isRefreshing,
    setActiveTab, 
    setIsAdminOpen, 
    currencyMode, 
    exchangeRate,
    getSellingRate,
    profitMarginPerKg
  } = useRates();

  // Find lowest avocado quoted rate
  const avocadoRates = rates
    .filter(r => r.commodity === 'avocados')
    .map(r => getSellingRate(r.rate1000kg))
    .filter(Boolean);
  const minAvocadoRate = avocadoRates.length > 0 ? Math.min(...avocadoRates) : 1.85;

  // Find lowest soya beans / legumes quoted rate
  const soyaRates = rates
    .filter(r => r.commodity === 'soya_beans')
    .map(r => getSellingRate(r.rate1000kg))
    .filter(Boolean);
  const minSoyaRate = soyaRates.length > 0 ? Math.min(...soyaRates) : 1.88;

  // Find lowest chillies quoted rate
  const chilliRates = rates
    .filter(r => r.commodity === 'chillies')
    .map(r => getSellingRate(r.rate1000kg))
    .filter(Boolean);
  const minChilliRate = chilliRates.length > 0 ? Math.min(...chilliRates) : 1.32;

  const formatPrice = (usdVal) => {
    if (currencyMode === 'KES') {
      return `KSh ${(usdVal * exchangeRate).toFixed(0)}`;
    }
    return `$${usdVal.toFixed(2)}`;
  };

  return (
    <div className="relative overflow-hidden pt-6 pb-8 border-b border-slate-800/60 bg-gradient-to-b from-slate-900/60 via-slate-950 to-slate-950">
      {/* Glow Effects */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none -z-10" />
      <div className="absolute top-10 right-1/4 w-96 h-96 bg-teal-500/10 rounded-full blur-3xl pointer-events-none -z-10" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
          {/* Main Headline */}
          <div className="max-w-2xl">
            <div className="inline-flex flex-wrap items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs font-semibold mb-3">
              <div className="flex items-center gap-1.5">
                <Leaf className="w-3.5 h-3.5 text-emerald-400" />
                <span>Kenya Fresh Produce Air Cargo Desk</span>
              </div>
              <span className="text-emerald-500 hidden sm:inline">•</span>
              <div className="flex items-center gap-1 font-mono text-[11px] text-slate-300">
                <Clock className="w-3 h-3 text-emerald-400" />
                <span>Valid:</span>
                <span className="text-emerald-300 font-semibold">{lastUpdated}</span>
                <button
                  onClick={() => refreshToToday(true)}
                  title="Click to refresh to today's date & live rates"
                  aria-label="Refresh to today's date"
                  className="inline-flex items-center justify-center p-0.5 rounded text-emerald-400 hover:text-white hover:bg-emerald-500/20 active:scale-90 transition-all ml-0.5 group focus:outline-none focus:ring-1 focus:ring-emerald-400"
                >
                  <RefreshCw className={`w-3 h-3 transition-transform duration-500 ${isRefreshing ? 'animate-spin text-emerald-300' : 'group-hover:rotate-180'}`} />
                </button>
              </div>
            </div>
            
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white tracking-tight leading-tight">
              Fresh Produce Air Freight Rates <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-teal-300 to-sky-400">
                Avocados, Soya Beans & Chillies (USD/KG & USD/MT)
              </span>
            </h1>

            <p className="mt-3 text-sm sm:text-base text-slate-300 leading-relaxed">
              Compare verified daily air cargo spot rates from <strong className="text-white font-medium">Nairobi (JKIA - NBO)</strong> across international airlines to Kuwait, Kazakhstan, Italy, Europe, Middle East & Asia. All quoted rates include the $0.20/kg ($200.00/MT) markup.
            </p>

            {/* Quick Action Badges */}
            <div className="mt-5 flex flex-wrap items-center gap-3">
              <button
                onClick={() => setActiveTab('calculator')}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white text-xs sm:text-sm font-semibold shadow-lg shadow-emerald-500/25 transition-all transform active:scale-95"
              >
                Calculate Produce Cargo Cost
                <ArrowRight className="w-4 h-4" />
              </button>

              <button
                onClick={() => setActiveTab('broadcast')}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900/90 hover:bg-slate-800 text-slate-200 border border-slate-700 text-xs sm:text-sm font-semibold transition-all"
              >
                <Share2 className="w-4 h-4 text-emerald-400" />
                WhatsApp Produce Digest
              </button>

              <button
                onClick={() => refreshToToday(true)}
                className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-slate-900/40 hover:bg-slate-800/80 text-emerald-400 border border-emerald-500/20 text-xs font-semibold transition-all group"
                title="Refresh rates to today's date"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-emerald-300' : 'group-hover:rotate-180 transition-transform duration-500'}`} />
                <span>Sync Today's Rates</span>
              </button>
            </div>
          </div>

          {/* Key Produce KPI Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-2 gap-3 w-full lg:w-auto min-w-[320px]">
            {/* KPI 1: Avocados */}
            <div className="glass-card p-4 rounded-2xl border border-emerald-500/20 relative overflow-hidden group hover:border-emerald-500/40 transition-all">
              <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
                <span>🥑 Fresh Avocados</span>
                <span className="flex items-center text-emerald-400 text-[10px] font-bold bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20">
                  <TrendingDown className="w-3 h-3 mr-0.5" /> Quoted
                </span>
              </div>
              <div className="text-xl sm:text-2xl font-mono font-extrabold text-white">
                {formatPrice(minAvocadoRate * 1000)}
                <span className="text-xs font-normal text-slate-400 font-sans ml-1">/ MT</span>
              </div>
              <p className="text-[11px] text-emerald-400/90 mt-1 font-mono font-medium">{formatPrice(minAvocadoRate)}/kg (+$200/MT incl.)</p>
            </div>

            {/* KPI 2: Soya Beans & Legumes */}
            <div className="glass-card p-4 rounded-2xl border border-teal-500/20 relative overflow-hidden group hover:border-teal-500/40 transition-all">
              <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
                <span>🫘 Soya Beans & Legumes</span>
                <span className="flex items-center text-teal-400 text-[10px] font-bold bg-teal-500/10 px-1.5 py-0.5 rounded border border-teal-500/20">
                  Daily
                </span>
              </div>
              <div className="text-xl sm:text-2xl font-mono font-extrabold text-white">
                {formatPrice(minSoyaRate * 1000)}
                <span className="text-xs font-normal text-slate-400 font-sans ml-1">/ MT</span>
              </div>
              <p className="text-[11px] text-teal-400/90 mt-1 font-mono font-medium">{formatPrice(minSoyaRate)}/kg (+$200/MT incl.)</p>
            </div>

            {/* KPI 3: Fresh Chillies */}
            <div className="glass-card p-4 rounded-2xl border border-rose-500/20 relative overflow-hidden group hover:border-rose-500/40 transition-all">
              <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
                <span>🌶️ Fresh Chillies</span>
                <span className="flex items-center text-rose-400 text-[10px] font-bold bg-rose-500/10 px-1.5 py-0.5 rounded border border-rose-500/20">
                  Spot
                </span>
              </div>
              <div className="text-xl sm:text-2xl font-mono font-extrabold text-white">
                {formatPrice(minChilliRate * 1000)}
                <span className="text-xs font-normal text-slate-400 font-sans ml-1">/ MT</span>
              </div>
              <p className="text-[11px] text-rose-400/90 mt-1 font-mono font-medium">{formatPrice(minChilliRate)}/kg (+$200/MT incl.)</p>
            </div>

            {/* KPI 4: Produce Lanes */}
            <div className="glass-card p-4 rounded-2xl border border-slate-800 relative overflow-hidden">
              <div className="text-xs text-slate-400 mb-1">Reefer Air Lanes</div>
              <div className="text-2xl font-mono font-extrabold text-white flex items-center gap-2">
                {rates.length} Routes
                <span className="text-[10px] font-sans font-bold text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20">
                  Live
                </span>
              </div>
              <p className="text-[11px] text-slate-400 mt-1">Kuwait, Kazakhstan, Italy, EU, Gulf</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
