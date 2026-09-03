import React from 'react';
import { useRates } from '../context/RatesContext';
import { 
  Plane, 
  Calculator, 
  Share2, 
  Sparkles, 
  Settings2, 
  Activity, 
  Clock, 
  DollarSign,
  TrendingUp,
  RefreshCw,
  Layers,
  Leaf,
  FolderLock,
  User,
  LogOut
} from 'lucide-react';

export const Navbar = () => {
  const { 
    lastUpdated, 
    currencyMode, 
    setCurrencyMode, 
    exchangeRate, 
    activeTab, 
    setActiveTab, 
    isAdminOpen, 
    setIsAdminOpen,
    currentUser,
    setIsAuthModalOpen,
    logout,
    profitMarginPerKg
  } = useRates();

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-xl transition-all">
      {/* Top Banner with live timestamp ticker */}
      <div className="bg-gradient-to-r from-emerald-950 via-slate-900 to-sky-950 border-b border-emerald-900/30 px-4 py-1.5 text-xs text-slate-300">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span className="font-semibold text-emerald-400 uppercase tracking-wider text-[10px]">
              JKIA Fresh Produce Export Desk
            </span>
            <span className="text-slate-500">•</span>
            <span className="text-slate-400 flex items-center gap-1 font-mono text-[11px]">
              <Clock className="w-3 h-3 text-emerald-400" />
              Verified Rates Valid: <span className="text-emerald-300 font-medium">{lastUpdated}</span>
            </span>
          </div>

          <div className="flex items-center gap-4 text-[11px]">
            <div className="hidden sm:flex items-center gap-1.5 text-emerald-400/90 font-medium">
              <span>🥑 Avocados • 🫘 Soya Beans • 🌶️ Chillies</span>
            </div>
            <div className="text-slate-400">
              <span>USD/KES: </span>
              <span className="font-mono text-emerald-400 font-medium">1 USD ≈ {exchangeRate} KES</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Navigation Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-4">
          {/* Logo */}
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => setActiveTab('rates')}>
            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-emerald-500 via-teal-600 to-sky-700 flex items-center justify-center shadow-lg shadow-emerald-500/20 border border-emerald-400/30">
              <Plane className="w-5 h-5 text-white -rotate-45" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-lg sm:text-xl tracking-tight text-white bg-clip-text">
                  Aero<span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-300">Produce</span> Kenya
                </span>
                <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 tracking-wider">
                  USD/KG
                </span>
              </div>
              <p className="text-[11px] text-slate-400 font-normal">Daily Fresh Produce Air Freight & Export Documents</p>
            </div>
          </div>

          {/* Navigation Tabs */}
          <nav className="hidden md:flex items-center gap-1 bg-slate-900/90 p-1 rounded-xl border border-slate-800">
            <button
              onClick={() => setActiveTab('rates')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'rates'
                  ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <Layers className="w-4 h-4" />
              Produce Rates Board
            </button>

            <button
              onClick={() => setActiveTab('calculator')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'calculator'
                  ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <Calculator className="w-4 h-4" />
              Produce Cost Calculator
            </button>

            <button
              onClick={() => setActiveTab('portal')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold transition-all relative ${
                activeTab === 'portal'
                  ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30'
                  : 'text-emerald-400 hover:text-emerald-300 hover:bg-emerald-950/40 border border-emerald-500/20'
              }`}
            >
              <FolderLock className="w-4 h-4" />
              <span>Documents (BL & KEPHIS)</span>
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            </button>

            <button
              onClick={() => setActiveTab('broadcast')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'broadcast'
                  ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <Share2 className="w-4 h-4" />
              WhatsApp & PDF Rate Card
            </button>

            <button
              onClick={() => setActiveTab('insights')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'insights'
                  ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <Sparkles className="w-4 h-4 text-amber-400" />
              Market News
            </button>
          </nav>

          {/* Right Action Controls */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Exporter Account Button */}
            {currentUser ? (
              <div className="hidden sm:flex items-center gap-2 bg-slate-900 border border-slate-800 rounded-xl p-1 pr-2">
                <button
                  onClick={() => setActiveTab('portal')}
                  className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold text-emerald-300 hover:text-white"
                  title="Open Exporter Document Hub"
                >
                  <User className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="max-w-[110px] truncate">{currentUser.name.split(' ')[0]}</span>
                </button>
                <button
                  onClick={logout}
                  className="text-slate-500 hover:text-rose-400 p-1"
                  title="Sign Out"
                >
                  <LogOut className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <button
                onClick={() => setIsAuthModalOpen(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/40 rounded-xl text-xs font-bold transition-all"
              >
                <User className="w-3.5 h-3.5" />
                <span>Create Account</span>
              </button>
            )}

            {/* Currency toggle */}
            <div className="flex items-center bg-slate-900 border border-slate-800 rounded-lg p-0.5 text-xs font-mono">
              <button
                onClick={() => setCurrencyMode('USD')}
                className={`px-2.5 py-1 rounded-md transition-all font-semibold ${
                  currencyMode === 'USD'
                    ? 'bg-emerald-500 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
                title="Rates in US Dollars per Kilogram"
              >
                USD ($)
              </button>
              <button
                onClick={() => setCurrencyMode('KES')}
                className={`px-2.5 py-1 rounded-md transition-all font-semibold ${
                  currencyMode === 'KES'
                    ? 'bg-emerald-500 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
                title="Preview in Kenya Shillings per Kilogram"
              >
                KES (KSh)
              </button>
            </div>

            {/* Admin Management Button */}
            <button
              onClick={() => setIsAdminOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-slate-800 to-slate-900 hover:from-slate-700 hover:to-slate-800 text-emerald-400 border border-emerald-500/30 hover:border-emerald-400 rounded-lg text-xs font-semibold shadow-md transition-all active:scale-95"
            >
              <Settings2 className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Admin</span>
            </button>
          </div>
        </div>

        {/* Mobile Navigation Tabs */}
        <div className="flex md:hidden overflow-x-auto py-2 gap-1 border-t border-slate-800/50 no-scrollbar">
          <button
            onClick={() => setActiveTab('rates')}
            className={`whitespace-nowrap px-3 py-1.5 rounded-lg text-xs font-medium ${
              activeTab === 'rates' ? 'bg-emerald-600 text-white' : 'text-slate-400'
            }`}
          >
            Produce Rates
          </button>
          <button
            onClick={() => setActiveTab('calculator')}
            className={`whitespace-nowrap px-3 py-1.5 rounded-lg text-xs font-medium ${
              activeTab === 'calculator' ? 'bg-emerald-600 text-white' : 'text-slate-400'
            }`}
          >
            Cost Calculator
          </button>
          <button
            onClick={() => setActiveTab('portal')}
            className={`whitespace-nowrap px-3 py-1.5 rounded-lg text-xs font-semibold ${
              activeTab === 'portal' ? 'bg-emerald-600 text-white' : 'text-emerald-400'
            }`}
          >
            BL & KEPHIS Docs
          </button>
          <button
            onClick={() => setActiveTab('broadcast')}
            className={`whitespace-nowrap px-3 py-1.5 rounded-lg text-xs font-medium ${
              activeTab === 'broadcast' ? 'bg-emerald-600 text-white' : 'text-slate-400'
            }`}
          >
            WhatsApp
          </button>
        </div>
      </div>
    </header>
  );
};
