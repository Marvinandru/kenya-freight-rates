import React, { useState, useMemo } from 'react';
import { useRates } from '../context/RatesContext';
import { 
  Search, 
  Filter, 
  ArrowUpDown, 
  TrendingDown, 
  TrendingUp, 
  Minus, 
  Plane, 
  Calculator, 
  Info, 
  ExternalLink, 
  Clock, 
  Sparkles,
  ChevronDown,
  ChevronUp,
  AlertCircle,
  BarChart2,
  Leaf,
  ThermometerSnowflake,
  ShieldCheck,
  FolderLock,
  RefreshCw,
  Calendar,
  Layers
} from 'lucide-react';
import { DESTINATION_REGIONS, getAvailableFlightSpaceMT } from '../data/initialRates';

export const RatesTable = () => {
  const { 
    rates, 
    lastUpdated,
    refreshToToday,
    isRefreshing,
    airlines, 
    airports, 
    commodities, 
    currencyMode, 
    exchangeRate, 
    profitMarginPerKg,
    getSellingRate,
    openBookingModal,
    calculateProduceCostBreakdown,
    setSelectedRouteForCalc,
    setSelectedRouteForHistory,
    setActiveTab,
    setIsAdminOpen 
  } = useRates();

  // Filters State
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRegion, setSelectedRegion] = useState('all');
  const [selectedDestination, setSelectedDestination] = useState('all');
  const [selectedCommodity, setSelectedCommodity] = useState('all');
  const [selectedAirline, setSelectedAirline] = useState('all');
  const [selectedWeightTier, setSelectedWeightTier] = useState('rate1000kg');
  const [sortBy, setSortBy] = useState('rate');
  const [sortOrder, setSortOrder] = useState('asc');
  const [expandedRowId, setExpandedRowId] = useState(null);

  const formatPrice = (usdVal) => {
    if (!usdVal && usdVal !== 0) return '-';
    if (currencyMode === 'KES') {
      return `KSh ${(usdVal * exchangeRate).toFixed(0)}`;
    }
    return `$${Number(usdVal).toFixed(2)}`;
  };

  // Clean, dedicated display labels for each category
  const COMMODITY_LABELS = {
    'flowers': 'Flowers',
    'avocado': 'Avocados',
    'chillies': 'Chillies',
    'herbs': 'Herbs',
    'mangoes': 'Mangoes',
    'meat': 'Regular Meat',
    'meat_regular': 'Regular Meat',
    'meat_exports': 'Regular Meat',
    'seafood': 'Sea Food',
    'passion': 'Passion Fruit',
    'passion_fruit': 'Passion Fruit',
    'pineapple': 'Pineapples'
  };

  // Commodity Priority Mapping:
  // 1. Fresh Cut Flowers, 2. Avocado, 3. Chillies, 4. Herbs, 5. Mangoes, 6. Meat (Regular Meat), 7. Sea Food (Especially UAE), 8. Passion Fruit
  const COMMODITY_PRIORITY = {
    'flowers': 1,
    'avocado': 2,
    'chillies': 3,
    'herbs': 4,
    'mangoes': 5,
    'meat': 6,
    'meat_regular': 6,
    'meat_exports': 6,
    'seafood': 7,
    'passion': 8,
    'passion_fruit': 8,
    'pineapple': 9
  };

  // Filtered & Sorted Rates
  const filteredRates = useMemo(() => {
    return rates.filter(item => {
      const airport = airports[item.destination] || { city: '', name: '', country: '', region: '' };
      const airline = airlines.find(a => a.id === item.airlineId) || { name: '', code: '' };
      const comm = commodities.find(c => c.id === item.commodity) || { name: '' };

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesCommoditySynonyms = 
          ((q.includes('flower') || q.includes('rose') || q.includes('carnation') || q.includes('flora')) && item.commodity === 'flowers') ||
          ((q.includes('seafood') || q.includes('sea food') || q.includes('fish') || q.includes('lobster') || q.includes('crab') || q.includes('snapper')) && item.commodity === 'seafood') ||
          ((q.includes('meat') || q.includes('carcass') || q.includes('halal') || q.includes('goat') || q.includes('lamb') || q.includes('beef')) && (item.commodity === 'meat' || item.commodity === 'meat_regular' || item.commodity === 'meat_exports')) ||
          (q.includes('passion') && (item.commodity === 'passion' || item.commodity === 'passion_fruit')) ||
          (q.includes('avocado') && item.commodity === 'avocado') ||
          ((q.includes('chilli') || q.includes('pepper')) && item.commodity === 'chillies');

        const matchesSearch = 
          matchesCommoditySynonyms ||
          item.destination.toLowerCase().includes(q) ||
          airport.city.toLowerCase().includes(q) ||
          airport.country.toLowerCase().includes(q) ||
          airline.name.toLowerCase().includes(q) ||
          airline.code.toLowerCase().includes(q) ||
          comm.name.toLowerCase().includes(q);
        if (!matchesSearch) return false;
      }

      if (selectedRegion !== 'all' && airport.region !== selectedRegion) {
        return false;
      }

      if (selectedDestination !== 'all' && item.destination !== selectedDestination) {
        return false;
      }

      if (selectedCommodity !== 'all') {
        if (selectedCommodity === 'meat' || selectedCommodity === 'meat_regular') {
          if (item.commodity !== 'meat' && item.commodity !== 'meat_regular' && item.commodity !== 'meat_exports') return false;
        } else if (selectedCommodity === 'passion' || selectedCommodity === 'passion_fruit') {
          if (item.commodity !== 'passion' && item.commodity !== 'passion_fruit') return false;
        } else if (item.commodity !== selectedCommodity) {
          return false;
        }
      }

      if (selectedAirline !== 'all' && item.airlineId !== selectedAirline) {
        return false;
      }

      return true;
    }).sort((a, b) => {
      const prioA = COMMODITY_PRIORITY[a.commodity] || 99;
      const prioB = COMMODITY_PRIORITY[b.commodity] || 99;

      // 1. If viewing all commodities, prioritize flights shipping items in order:
      // flowers -> avocado -> chillies -> herbs -> mangoes -> meat -> seafood -> passion.
      if (selectedCommodity === 'all') {
        if (sortBy === 'rate') {
          if (prioA !== prioB) {
            return sortOrder === 'asc' ? prioA - prioB : prioB - prioA;
          }
          const rateA = getSellingRate(a[selectedWeightTier]);
          const rateB = getSellingRate(b[selectedWeightTier]);
          return rateA - rateB;
        }
      }

      // 2. On the airlines category / sorting by airline:
      // Prioritize flights shipping items in this order (avocado -> chillies -> herbs -> mangoes -> meat -> seafood -> passion)
      // so a flight shipping passion is never amongst the top for that airline.
      if (sortBy === 'airline') {
        const airlineComp = a.airlineId.localeCompare(b.airlineId);
        if (airlineComp !== 0) {
          return sortOrder === 'asc' ? airlineComp : -airlineComp;
        }
        if (prioA !== prioB) {
          return prioA - prioB;
        }
        return getSellingRate(a[selectedWeightTier]) - getSellingRate(b[selectedWeightTier]);
      }

      if (sortBy === 'destination') {
        const destComp = a.destination.localeCompare(b.destination);
        if (destComp !== 0) {
          return sortOrder === 'asc' ? destComp : -destComp;
        }
        if (prioA !== prioB) {
          return prioA - prioB;
        }
        return getSellingRate(a[selectedWeightTier]) - getSellingRate(b[selectedWeightTier]);
      }

      // Standard rate sorting when a single commodity is selected
      const rateA = getSellingRate(a[selectedWeightTier]);
      const rateB = getSellingRate(b[selectedWeightTier]);
      const rateComp = rateA - rateB;
      return sortOrder === 'asc' ? rateComp : -rateComp;
    });
  }, [rates, searchQuery, selectedRegion, selectedDestination, selectedCommodity, selectedAirline, selectedWeightTier, sortBy, sortOrder, airports, airlines, commodities, profitMarginPerKg]);

  const toggleRowExpand = (id) => {
    setExpandedRowId(expandedRowId === id ? null : id);
  };

  const handleOpenCalculator = (route) => {
    setSelectedRouteForCalc(route);
    setActiveTab('calculator');
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Top Banner & Search */}
      <div className="glass-panel p-5 rounded-2xl mb-6 shadow-xl border border-slate-800">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 pb-4 border-b border-slate-800/80">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <Leaf className="w-5 h-5 text-emerald-400" />
                Fresh Produce, Flowers & Meat Air Freight Rates Matrix
              </h2>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 font-mono shadow-sm flex items-center gap-1">
                <ShieldCheck className="w-3 h-3 text-emerald-400" />
                Verified Airline Cargo Hold Space
              </span>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-slate-900/90 border border-slate-700/80 text-[11px] font-mono text-slate-300">
                <Clock className="w-3 h-3 text-emerald-400" />
                <span>Rates Valid: <strong className="text-emerald-300 font-semibold">{lastUpdated}</strong></span>
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
            <p className="text-xs text-slate-400 mt-0.5">
              Verified daily export spot rates and live aircraft hold capacity for Fresh Cut Flowers (Roses, Carnations), Avocados, Chillies, Herbs, Mangoes, Regular Meat, Sea Food & Passion to worldwide hubs & Congo Brazzaville (BZV).
            </p>
          </div>

          {/* Quick Search */}
          <div className="relative w-full lg:w-80">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search flowers, roses, Brazzaville, BZV, AMS, airline..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-900/90 border border-slate-700/80 rounded-xl pl-9 pr-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all font-sans"
            />
            {searchQuery && (
              <button 
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white text-xs"
              >
                ✕
              </button>
            )}
          </div>
        </div>

        {/* Commodity Selector Tabs */}
        <div className="mt-4 flex items-center gap-2 overflow-x-auto pb-2 no-scrollbar">
          <span className="text-xs font-semibold text-slate-300 whitespace-nowrap flex items-center gap-1.5 mr-1">
            <Layers className="w-3.5 h-3.5 text-emerald-400" /> Export Categories:
          </span>
          <button
            onClick={() => setSelectedCommodity('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${
              selectedCommodity === 'all'
                ? 'bg-emerald-500 text-white shadow-md shadow-emerald-500/20 font-semibold'
                : 'bg-slate-900/80 text-slate-300 hover:bg-slate-800 border border-slate-800'
            }`}
          >
            All Export Items
          </button>
          {commodities.map(c => {
            const isFlowers = c.id === 'flowers';
            const isSelected = selectedCommodity === c.id;
            const label = COMMODITY_LABELS[c.id] || c.name.split(' (')[0];
            return (
              <button
                key={c.id}
                onClick={() => setSelectedCommodity(c.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all flex items-center gap-1.5 ${
                  isSelected
                    ? isFlowers 
                      ? 'bg-rose-600 text-white shadow-md shadow-rose-600/30 font-bold ring-1 ring-rose-400' 
                      : 'bg-emerald-500 text-white shadow-md shadow-emerald-500/20 font-semibold'
                    : isFlowers
                      ? 'bg-rose-950/50 text-rose-300 hover:bg-rose-900/50 border border-rose-500/40 font-semibold'
                      : 'bg-slate-900/80 text-slate-300 hover:bg-slate-800 border border-slate-800'
                }`}
              >
                <span>{c.icon}</span>
                <span>{label}</span>
                {isFlowers && (
                  <span className="text-[9px] px-1.5 py-0.2 rounded bg-rose-500/20 text-rose-300 border border-rose-500/30 font-mono">
                    Roses
                  </span>
                )}
                {c.id === 'seafood' && (
                  <span className="text-[9px] px-1.5 py-0.5 rounded bg-sky-500/30 text-sky-200 border border-sky-400/40 uppercase font-bold tracking-tight ml-0.5">
                    UAE Express
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Secondary Filters */}
        <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {/* Destination Region */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-400 mb-1">Destination Region</label>
            <select
              value={selectedRegion}
              onChange={(e) => setSelectedRegion(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700/80 rounded-lg px-3 py-1.5 text-xs text-slate-200 focus:border-emerald-500 focus:outline-none"
            >
              {DESTINATION_REGIONS.map(reg => (
                <option key={reg.id} value={reg.id}>{reg.name}</option>
              ))}
            </select>
          </div>

          {/* Destination Airport Hub */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-400 mb-1">Destination Airport</label>
            <select
              value={selectedDestination}
              onChange={(e) => setSelectedDestination(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700/80 rounded-lg px-3 py-1.5 text-xs text-slate-200 focus:border-emerald-500 focus:outline-none"
            >
              <option value="all">All Destination Hubs (20 Airports)</option>
              <optgroup label="Congo & Intra-Africa">
                <option value="BZV">BZV - Brazzaville, Congo (Maya-Maya)</option>
                <option value="JNB">JNB - Johannesburg, South Africa</option>
                <option value="EBB">EBB - Entebbe, Uganda</option>
              </optgroup>
              <optgroup label="Europe (Flower Auction & Fresh Gateways)">
                <option value="AMS">AMS - Amsterdam Schiphol (FloraHolland)</option>
                <option value="LHR">LHR - London Heathrow, UK</option>
                <option value="CDG">CDG - Paris Charles de Gaulle</option>
                <option value="BRU">BRU - Brussels National</option>
                <option value="FRA">FRA - Frankfurt Main</option>
                <option value="MXP">MXP - Milan Malpensa</option>
                <option value="FCO">FCO - Rome Fiumicino</option>
              </optgroup>
              <optgroup label="Middle East & Gulf (GCC Hubs)">
                <option value="KWI">KWI - Kuwait International</option>
                <option value="DXB">DXB - Dubai International</option>
                <option value="SHJ">SHJ - Sharjah International</option>
                <option value="MCT">MCT - Muscat International</option>
                <option value="DOH">DOH - Hamad International (Doha)</option>
                <option value="RUH">RUH - King Khalid Intl (Riyadh)</option>
                <option value="JED">JED - King Abdulaziz Intl (Jeddah)</option>
              </optgroup>
              <optgroup label="Asia & Americas">
                <option value="BOM">BOM - Mumbai, India</option>
                <option value="CAN">CAN - Guangzhou Baiyun, China</option>
                <option value="JFK">JFK - New York JFK, USA</option>
              </optgroup>
            </select>
          </div>

          {/* Carrier */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-400 mb-1">Airline Carrier</label>
            <select
              value={selectedAirline}
              onChange={(e) => setSelectedAirline(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700/80 rounded-lg px-3 py-1.5 text-xs text-slate-200 focus:border-emerald-500 focus:outline-none"
            >
              <option value="all">All Airlines (KQ, Astral, ET, EK...)</option>
              {airlines.map(a => (
                <option key={a.id} value={a.id}>{a.code} - {a.name}</option>
              ))}
            </select>
          </div>

          {/* Weight Tier */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-400 mb-1">Primary Weight Tier</label>
            <select
              value={selectedWeightTier}
              onChange={(e) => setSelectedWeightTier(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700/80 rounded-lg px-3 py-1.5 text-xs font-mono text-emerald-400 focus:border-emerald-500 focus:outline-none"
            >
              <option value="rate1000kg">+1,000 KG (Bulk Rate)</option>
              <option value="rate500kg">+500 KG Tier</option>
              <option value="rate300kg">+300 KG Tier</option>
              <option value="rate100kg">+100 KG Tier</option>
              <option value="rate45kg">+45 KG Tier</option>
            </select>
          </div>

          {/* Sort By */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-400 mb-1">Sort Results</label>
            <div className="flex gap-1.5">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="flex-1 bg-slate-900 border border-slate-700/80 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:border-emerald-500 focus:outline-none"
              >
                <option value="rate">Lowest Rate</option>
                <option value="airline">Airline Name</option>
                <option value="destination">Destination</option>
              </select>
              <button
                onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                className="p-1.5 bg-slate-900 border border-slate-700 rounded-lg text-slate-400 hover:text-white"
                title={`Order: ${sortOrder.toUpperCase()}`}
              >
                <ArrowUpDown className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Quick Route & Corridor Chips */}
        <div className="mt-3 pt-3 border-t border-slate-800/60 flex flex-wrap items-center gap-1.5 text-xs">
          <span className="text-[11px] font-semibold text-slate-400 mr-1 flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-emerald-400" /> Quick Hubs:
          </span>
          <button
            onClick={() => { setSelectedCommodity('flowers'); setSelectedDestination('all'); setSelectedRegion('all'); }}
            className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-all flex items-center gap-1 ${
              selectedCommodity === 'flowers' && selectedDestination === 'all'
                ? 'bg-rose-600 text-white font-semibold shadow-sm'
                : 'bg-slate-900 text-rose-300 hover:bg-slate-800 border border-rose-500/30'
            }`}
          >
            <span>🌹 All Flower Routes</span>
          </button>
          <button
            onClick={() => { setSelectedDestination('BZV'); setSelectedRegion('all'); }}
            className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-all flex items-center gap-1 ${
              selectedDestination === 'BZV' && selectedCommodity === 'all'
                ? 'bg-emerald-500 text-white font-semibold'
                : 'bg-slate-900 text-slate-200 hover:bg-slate-800 border border-slate-700'
            }`}
          >
            <span>🇨🇬 Congo Brazzaville (BZV)</span>
          </button>
          <button
            onClick={() => { setSelectedCommodity('flowers'); setSelectedDestination('BZV'); setSelectedRegion('all'); }}
            className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-all flex items-center gap-1 ${
              selectedCommodity === 'flowers' && selectedDestination === 'BZV'
                ? 'bg-rose-600 text-white font-semibold'
                : 'bg-slate-900 text-rose-300 hover:bg-slate-800 border border-slate-700'
            }`}
          >
            <span>🌹 Flowers ➔ Congo (BZV)</span>
          </button>
          <button
            onClick={() => { setSelectedCommodity('flowers'); setSelectedDestination('AMS'); setSelectedRegion('all'); }}
            className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-all flex items-center gap-1 ${
              selectedCommodity === 'flowers' && selectedDestination === 'AMS'
                ? 'bg-rose-600 text-white font-semibold'
                : 'bg-slate-900 text-rose-300 hover:bg-slate-800 border border-slate-700'
            }`}
          >
            <span>🌹 Flowers ➔ Amsterdam (AMS)</span>
          </button>
          <button
            onClick={() => { setSelectedCommodity('meat'); setSelectedDestination('KWI'); setSelectedRegion('all'); }}
            className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-all flex items-center gap-1 ${
              selectedCommodity === 'meat' && selectedDestination === 'KWI'
                ? 'bg-amber-500 text-white font-semibold'
                : 'bg-slate-900 text-slate-300 hover:bg-slate-800 border border-slate-700'
            }`}
          >
            <span>🥩 Meat ➔ Kuwait (KWI)</span>
          </button>
          <button
            onClick={() => { setSelectedCommodity('seafood'); setSelectedDestination('DXB'); setSelectedRegion('all'); }}
            className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-all flex items-center gap-1 ${
              selectedCommodity === 'seafood' && selectedDestination === 'DXB'
                ? 'bg-sky-500 text-white font-semibold'
                : 'bg-slate-900 text-slate-300 hover:bg-slate-800 border border-slate-700'
            }`}
          >
            <span>🦞 Sea Food ➔ Dubai (DXB)</span>
          </button>
          {(selectedCommodity !== 'all' || selectedDestination !== 'all' || selectedRegion !== 'all' || selectedAirline !== 'all' || searchQuery) && (
            <button
              onClick={() => {
                setSelectedCommodity('all');
                setSelectedDestination('all');
                setSelectedRegion('all');
                setSelectedAirline('all');
                setSearchQuery('');
              }}
              className="text-[11px] text-emerald-400 hover:text-emerald-300 underline ml-auto font-medium"
            >
              Reset Filters
            </button>
          )}
        </div>
      </div>

      {/* Rates Table Container */}
      <div className="glass-panel rounded-2xl overflow-hidden shadow-2xl border border-slate-800">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-900/90 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                <th className="py-3.5 px-4">Carrier</th>
                <th className="py-3.5 px-4">Route</th>
                <th className="py-3.5 px-3">Produce Item</th>
                <th className="py-3.5 px-3 text-right hidden sm:table-cell">+100kg</th>
                <th className="py-3.5 px-3 text-right hidden md:table-cell">+300kg</th>
                <th className="py-3.5 px-3 text-right hidden lg:table-cell">+500kg</th>
                <th className="py-3.5 px-4 text-right">
                  <div className="flex flex-col items-end text-emerald-400">
                    <span className="font-extrabold text-xs">Quoted Price / MT</span>
                    <span className="text-[9px] font-mono text-emerald-300/80 normal-case">(+1,000kg • Bulk Rate)</span>
                  </div>
                </th>
                <th className="py-3.5 px-3 text-center">
                  <div className="flex flex-col items-center text-sky-400">
                    <span className="font-bold text-xs">Flight Space Left</span>
                    <span className="text-[9px] font-mono text-sky-300/80 normal-case">(Avail. Cargo)</span>
                  </div>
                </th>
                <th className="py-3.5 px-3 text-right hidden sm:table-cell">All-In Rate</th>
                <th className="py-3.5 px-3 text-center">Daily Trend</th>
                <th className="py-3.5 px-4 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-xs">
              {filteredRates.length === 0 ? (
                <tr>
                  <td colSpan="11" className="py-12 text-center text-slate-400">
                    <AlertCircle className="w-8 h-8 text-slate-500 mx-auto mb-2" />
                    <p className="text-sm font-medium">No fresh produce rates match your selected filters.</p>
                  </td>
                </tr>
              ) : (
                filteredRates.map((item) => {
                  const airline = airlines.find(a => a.id === item.airlineId) || { name: item.airlineId, code: item.airlineId, logoBg: 'bg-slate-800', fleet: 'Widebody Cargo Hold' };
                  const destAirport = airports[item.destination] || { code: item.destination, city: item.destination, country: '' };
                  const origAirport = airports[item.origin] || { code: item.origin, city: item.origin };
                  const comm = commodities.find(c => c.id === item.commodity) || { name: item.commodity, icon: '🥑' };
                  
                  const quotedRate1000 = getSellingRate(item.rate1000kg);
                  const quotedRate500 = getSellingRate(item.rate500kg);
                  const quotedRate300 = getSellingRate(item.rate300kg);
                  const quotedRate100 = getSellingRate(item.rate100kg);

                  const allInPerKg = quotedRate1000 + (item.fuelSurcharge || 0) + (item.secSurcharge || 0) + (item.handlingFee || 0);
                  const spaceMT = getAvailableFlightSpaceMT(item);
                  const isExpanded = expandedRowId === item.id;

                  return (
                    <React.Fragment key={item.id}>
                      <tr 
                        className={`hover:bg-slate-800/40 transition-colors group cursor-pointer ${
                          isExpanded ? 'bg-slate-800/60' : ''
                        }`}
                        onClick={() => toggleRowExpand(item.id)}
                      >
                        {/* Airline */}
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2.5">
                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs font-mono border ${airline.logoBg}`}>
                              {airline.code}
                            </div>
                            <div>
                              <div className="font-bold text-slate-100 group-hover:text-emerald-300 transition-colors">
                                {airline.name}
                              </div>
                              <div className="text-[10px] text-slate-400 hidden sm:block">
                                {airline.badge}
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* Route */}
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-1.5 font-mono font-bold text-slate-100">
                            <span className="text-slate-300">{origAirport.code}</span>
                            <span className="text-emerald-400">➔</span>
                            <span className="text-white bg-slate-800 px-1.5 py-0.5 rounded border border-slate-700">
                              {destAirport.code}
                            </span>
                          </div>
                          <div className="text-[11px] text-slate-400">
                            {destAirport.city}, {destAirport.country}
                          </div>
                        </td>

                        {/* Commodity */}
                        <td className="py-3 px-3">
                          <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[11px] ${
                            item.commodity === 'flowers'
                              ? 'bg-rose-950/60 border-rose-500/40 text-rose-300 font-semibold shadow-sm'
                              : item.commodity === 'seafood'
                              ? 'bg-sky-950/60 border-sky-500/40 text-sky-300 font-semibold'
                              : item.commodity === 'meat' || item.commodity === 'meat_regular' || item.commodity === 'meat_exports'
                              ? 'bg-amber-950/40 border-amber-500/30 text-amber-300 font-medium'
                              : 'bg-emerald-950/40 border-emerald-500/20 text-emerald-300 font-medium'
                          }`}>
                            <span>{comm.icon || '📦'}</span>
                            <span>{COMMODITY_LABELS[item.commodity] || (comm.name ? comm.name.split(' (')[0] : item.commodity)}</span>
                            {item.commodity === 'flowers' && (
                              <span className="text-[9px] px-1 py-0.2 rounded bg-rose-500/20 text-rose-300 border border-rose-500/30 uppercase font-mono tracking-tight">
                                Flora
                              </span>
                            )}
                            {item.commodity === 'seafood' && (
                              <span className="text-[9px] px-1 py-0.2 rounded bg-sky-500/30 text-sky-200 border border-sky-400/40 uppercase font-bold tracking-tight">
                                UAE
                              </span>
                            )}
                          </div>
                        </td>

                        {/* Rate +100kg */}
                        <td className="py-3 px-3 text-right font-mono text-slate-300 hidden sm:table-cell">
                          {formatPrice(quotedRate100)}
                        </td>

                        {/* Rate +300kg */}
                        <td className="py-3 px-3 text-right font-mono text-slate-300 hidden md:table-cell">
                          {formatPrice(quotedRate300)}
                        </td>

                        {/* Rate +500kg */}
                        <td className="py-3 px-3 text-right font-mono text-slate-200 hidden lg:table-cell">
                          {formatPrice(quotedRate500)}
                        </td>

                        {/* Rate +1000kg (Quoted Rate per MT and per KG) */}
                        <td className="py-3 px-4 text-right font-mono font-extrabold bg-emerald-950/25 border-l border-r border-emerald-900/30">
                          <div className="text-sm sm:text-base text-emerald-400 leading-tight">
                            {formatPrice(quotedRate1000 * 1000)}
                            <span className="text-[10px] font-sans font-normal text-slate-300 ml-1">/ MT</span>
                          </div>
                          <div className="text-[11px] text-emerald-300 font-medium mt-0.5">
                            {formatPrice(quotedRate1000)}/kg
                          </div>
                        </td>

                        {/* Available Flight Space Left - Clickable */}
                        <td className="py-3 px-3 text-center" onClick={(e) => { e.stopPropagation(); openBookingModal(item); }}>
                          <div className="inline-flex flex-col items-center group/space cursor-pointer hover:scale-105 transition-transform" title="Click to book verified aircraft hold space">
                            <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold font-mono border ${
                              spaceMT <= 8 
                                ? 'bg-amber-500/15 text-amber-300 border-amber-500/30 group-hover/space:bg-amber-500/25' 
                                : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20 group-hover/space:bg-emerald-500/20'
                            }`}>
                              📦 {spaceMT} MT Left
                            </span>
                            <span className="text-[9px] text-emerald-400 font-semibold mt-0.5 group-hover/space:underline">
                              Book Space ➔
                            </span>
                          </div>
                        </td>

                        {/* All-In Estimate */}
                        <td className="py-3 px-3 text-right font-mono text-teal-300 font-bold hidden sm:table-cell">
                          {formatPrice(allInPerKg)}
                        </td>

                        {/* Daily Trend Badge */}
                        <td className="py-3 px-3 text-center">
                          {item.changeDirection === 'down' ? (
                            <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 text-[10px] font-bold border border-emerald-500/20 font-mono">
                              <TrendingDown className="w-3 h-3" />
                              {item.changeAmount ? `${item.changeAmount.toFixed(2)}` : 'Lower'}
                            </span>
                          ) : item.changeDirection === 'up' ? (
                            <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full bg-rose-500/10 text-rose-400 text-[10px] font-bold border border-rose-500/20 font-mono">
                              <TrendingUp className="w-3 h-3" />
                              +{item.changeAmount?.toFixed(2)}
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 text-[10px] border border-slate-700">
                              <Minus className="w-3 h-3" /> Stable
                            </span>
                          )}
                        </td>

                        {/* Actions */}
                        <td className="py-3 px-4 text-center" onClick={(e) => e.stopPropagation()}>
                          <div className="flex items-center justify-center gap-1.5">
                            <button
                              onClick={() => openBookingModal(item)}
                              className="px-2.5 py-1 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-lg text-xs font-bold shadow-md shadow-emerald-600/20 transition-all flex items-center gap-1 active:scale-95 whitespace-nowrap"
                              title="Book space and place order"
                            >
                              <Plane className="w-3 h-3" />
                              <span>Book Space</span>
                            </button>

                            <button
                              onClick={() => handleOpenCalculator(item)}
                              className="p-1 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-lg text-xs transition-all"
                              title="Open Calculator with this lane"
                            >
                              <Calculator className="w-3.5 h-3.5 text-emerald-400" />
                            </button>

                            <button
                              onClick={() => toggleRowExpand(item.id)}
                              className="p-1 text-slate-500 hover:text-slate-300"
                            >
                              {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                            </button>
                          </div>
                        </td>
                      </tr>

                      {/* Expandable Breakdown Drawer */}
                      {isExpanded && (
                        <tr className="bg-slate-900/90 border-b border-slate-800">
                          <td colSpan="11" className="p-4 sm:p-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
                              {/* Surcharges & Rate Composition Breakdown */}
                              <div className="bg-slate-950/80 p-3.5 rounded-xl border border-slate-800">
                                <div className="font-bold text-slate-200 mb-2 flex items-center justify-between">
                                  <span>Produce Rate & Terminal Breakdown</span>
                                  <span className="text-[10px] text-emerald-400 font-semibold px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20">Verified Spot Rate</span>
                                </div>
                                <div className="space-y-1.5 font-mono text-[11px]">
                                  <div className="flex justify-between text-slate-400">
                                    <span>Base Rate (+1000kg):</span>
                                    <span className="text-white font-semibold">{formatPrice(quotedRate1000)}/kg • {formatPrice(quotedRate1000 * 1000)}/MT</span>
                                  </div>
                                  <div className="flex justify-between text-slate-400">
                                    <span>Fuel Surcharge (FSC):</span>
                                    <span className="text-sky-300">{formatPrice(item.fuelSurcharge)}/kg • {formatPrice(item.fuelSurcharge * 1000)}/MT</span>
                                  </div>
                                  <div className="pt-1.5 border-t border-slate-800/80 text-[10px] text-emerald-300/80 font-bold uppercase">
                                    Produce Cost (4 Local Categories):
                                  </div>
                                  {(() => {
                                    const fee = calculateProduceCostBreakdown(quotedRate1000, 1000);
                                    return (
                                      <>
                                        <div className="flex justify-between text-slate-400 pl-1">
                                          <span>1. KAA Handling (0.08$ × price/kg):</span>
                                          <span className="text-slate-200">{formatPrice(fee.kaaHandling)}</span>
                                        </div>
                                        <div className="flex justify-between text-slate-400 pl-1">
                                          <span>2. Board Fee (Fixed):</span>
                                          <span className="text-slate-200">{formatPrice(fee.boardFee)}</span>
                                        </div>
                                        <div className="flex justify-between text-slate-400 pl-1">
                                          <span>3. Security SCC (0.07$ × price/kg):</span>
                                          <span className="text-slate-200">{formatPrice(fee.securityScc)}</span>
                                        </div>
                                        <div className="flex justify-between text-slate-400 pl-1">
                                          <span>4. VAT (16% on Total Fees):</span>
                                          <span className="text-sky-300">{formatPrice(fee.vat16)}</span>
                                        </div>
                                        <div className="pt-1.5 border-t border-slate-800 flex justify-between font-bold text-emerald-400">
                                          <span>Total Landed (Freight + Local):</span>
                                          <span>{formatPrice((quotedRate1000 + (item.fuelSurcharge || 0.38)) * 1000 + fee.total)} / MT</span>
                                        </div>
                                      </>
                                    );
                                  })()}
                                </div>
                              </div>

                              {/* Airline Cargo Hold & Space Verification Card */}
                              <div className="bg-slate-950/80 p-3.5 rounded-xl border border-slate-800">
                                <div className="font-bold text-slate-200 mb-2 flex items-center justify-between">
                                  <span className="flex items-center gap-1.5 text-sky-400">
                                    <Plane className="w-4 h-4" />
                                    <span>Space Verification</span>
                                  </span>
                                  <span className={`text-[10px] font-bold font-mono px-2 py-0.5 rounded border ${
                                    spaceMT <= 8 ? 'bg-amber-500/15 text-amber-300 border-amber-500/30' : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                                  }`}>
                                    {spaceMT} MT Available
                                  </span>
                                </div>
                                <div className="space-y-1.5 text-slate-300">
                                  <div>
                                    <span className="text-slate-500">Aircraft:</span> <span className="text-white font-semibold">{airline.fleet || 'Widebody Cargo Hold'}</span>
                                  </div>
                                  <div>
                                    <span className="text-slate-500">Hold Space Left:</span> <span className="text-emerald-300 font-bold font-mono">{spaceMT} Metric Tons</span>
                                  </div>
                                  <div>
                                    <span className="text-slate-500">Status:</span> <span className={spaceMT <= 8 ? 'text-amber-400 font-semibold' : 'text-emerald-400 font-semibold'}>{spaceMT <= 8 ? 'Hold Filling Fast • Reserve Now' : 'Verified Available'}</span>
                                  </div>
                                  <div>
                                    <span className="text-slate-500">Advance Notice:</span> <span className="text-sky-300">Quote 3 Days Ahead</span>
                                  </div>
                                </div>
                              </div>

                              {/* Cold Chain Specs */}
                              <div className="bg-slate-950/80 p-3.5 rounded-xl border border-slate-800">
                                <div className="font-bold text-slate-200 mb-2 flex items-center gap-1.5 text-emerald-400">
                                  <ThermometerSnowflake className="w-4 h-4" />
                                  <span>Cold Chain & Hold Temp</span>
                                </div>
                                <div className="space-y-1.5 text-slate-300">
                                  <div>
                                    <span className="text-slate-500">Holding Temp:</span> <span className="text-white font-semibold">{comm.tempRange || '+4°C'}</span>
                                  </div>
                                  <div>
                                    <span className="text-slate-500">Packaging:</span> {comm.packaging}
                                  </div>
                                  <div>
                                    <span className="text-slate-500">Transit Time:</span> {item.transitTime}
                                  </div>
                                  <div>
                                    <span className="text-slate-500">Minimum Charge:</span> <span className="font-mono text-amber-400">{formatPrice(item.minCharge)}</span>
                                  </div>
                                </div>
                              </div>

                              {/* Documents & Actions */}
                              <div className="bg-slate-950/80 p-3.5 rounded-xl border border-slate-800 flex flex-col justify-between">
                                <div>
                                  <div className="font-bold text-slate-200 mb-1 flex items-center gap-1">
                                    <ShieldCheck className="w-4 h-4 text-emerald-400" />
                                    <span>Origin Documents Vault</span>
                                  </div>
                                  <p className="text-slate-400 text-[11px] leading-relaxed">
                                    Upload <strong>Commercial Invoice</strong>, <strong>Packing List</strong> & <strong>KEPHIS Certificate</strong> to generate the official Air Waybill (AWB).
                                  </p>
                                </div>
                                <div className="mt-3 flex gap-2">
                                  <button
                                    onClick={() => openBookingModal(item)}
                                    className="flex-1 py-1.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold rounded-lg text-xs shadow-md transition-all text-center flex items-center justify-center gap-1 active:scale-95"
                                  >
                                    <Plane className="w-3.5 h-3.5" />
                                    <span>Book Space</span>
                                  </button>
                                  <button
                                    onClick={() => handleOpenCalculator(item)}
                                    className="py-1.5 px-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold rounded-lg text-xs border border-slate-700 transition-all text-center"
                                  >
                                    Calculator
                                  </button>
                                  <button
                                    onClick={() => setActiveTab('portal')}
                                    className="py-1.5 px-2.5 bg-slate-800 hover:bg-slate-700 text-emerald-400 font-medium rounded-lg text-xs border border-emerald-500/20 transition-all flex items-center gap-1"
                                  >
                                    <FolderLock className="w-3.5 h-3.5" />
                                    <span>Docs</span>
                                  </button>
                                </div>
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
