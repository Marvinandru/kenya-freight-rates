import React, { useState, useEffect, useMemo } from 'react';
import { useRates } from '../context/RatesContext';
import { 
  Calculator, 
  Box, 
  Scale, 
  Plane, 
  ArrowRight, 
  Sparkles, 
  Check, 
  Copy, 
  Info, 
  ShieldCheck, 
  Clock, 
  Award,
  Download,
  Leaf,
  ThermometerSnowflake
} from 'lucide-react';

export const RateCalculator = () => {
  const { 
    rates, 
    airlines, 
    airports, 
    commodities, 
    currencyMode, 
    exchangeRate,
    selectedRouteForCalc,
    setSelectedRouteForCalc,
    showNotification 
  } = useRates();

  // Calculator Form State
  const [origin, setOrigin] = useState(selectedRouteForCalc?.origin || 'NBO');
  const [destination, setDestination] = useState(selectedRouteForCalc?.destination || 'AMS');
  const [commodity, setCommodity] = useState(selectedRouteForCalc?.commodity || 'avocados');
  const [grossWeight, setGrossWeight] = useState(1200);
  
  // Dimensions mode
  const [dimensionMode, setDimensionMode] = useState('dimensions');
  const [length, setLength] = useState(120); // cm
  const [width, setWidth] = useState(100);  // cm (Euro/Standard produce pallet)
  const [height, setHeight] = useState(160); // cm
  const [pieces, setPieces] = useState(2);   // 2 complete pallets
  const [customCbm, setCustomCbm] = useState(7.6);

  const [copiedQuote, setCopiedQuote] = useState(false);

  // Apply produce preset
  const applyProducePreset = (type) => {
    if (type === 'avocados') {
      setCommodity('avocados');
      setGrossWeight(1800);
      setLength(120);
      setWidth(100);
      setHeight(160);
      setPieces(2);
      setDestination('AMS');
    } else if (type === 'soya_beans') {
      setCommodity('soya_beans');
      setGrossWeight(1200);
      setLength(120);
      setWidth(80);
      setHeight(150);
      setPieces(2);
      setDestination('LHR');
    } else if (type === 'chillies') {
      setCommodity('chillies');
      setGrossWeight(600);
      setLength(120);
      setWidth(80);
      setHeight(140);
      setPieces(1);
      setDestination('DXB');
    }
    showNotification(`Applied ${type.replace('_', ' ').toUpperCase()} produce shipping preset!`);
  };

  useEffect(() => {
    if (selectedRouteForCalc) {
      setOrigin(selectedRouteForCalc.origin);
      setDestination(selectedRouteForCalc.destination);
      setCommodity(selectedRouteForCalc.commodity);
    }
  }, [selectedRouteForCalc]);

  // Volume & Chargeable Weight Math
  const { volumeCbm, volumetricWeight, chargeableWeight, densityRatio } = useMemo(() => {
    let cbm = 0;
    if (dimensionMode === 'dimensions') {
      const singleVolM3 = (Number(length) * Number(width) * Number(height)) / 1000000;
      cbm = singleVolM3 * Number(pieces);
    } else {
      cbm = Number(customCbm) || 0;
    }

    const volWeight = Number((cbm * 166.67).toFixed(1));
    const gross = Number(grossWeight) || 0;
    const chargeable = Math.max(gross, volWeight);
    const density = cbm > 0 ? (gross / cbm).toFixed(1) : 0;

    return {
      volumeCbm: Number(cbm.toFixed(2)),
      volumetricWeight: volWeight,
      chargeableWeight: Number(chargeable.toFixed(1)),
      densityRatio: density
    };
  }, [dimensionMode, length, width, height, pieces, customCbm, grossWeight]);

  // Find all airlines operating this route & commodity
  const matchedCarriers = useMemo(() => {
    const matching = rates.filter(r => 
      r.origin === origin && 
      r.destination === destination && 
      r.commodity === commodity
    );

    return matching.map(item => {
      const airline = airlines.find(a => a.id === item.airlineId) || { name: item.airlineId, code: item.airlineId };
      
      let baseRatePerKg = item.rate1000kg;
      let tierApplied = '+1000kg';

      if (chargeableWeight < 100) {
        baseRatePerKg = item.rate45kg || item.rate100kg;
        tierApplied = '+45kg';
      } else if (chargeableWeight < 300) {
        baseRatePerKg = item.rate100kg;
        tierApplied = '+100kg';
      } else if (chargeableWeight < 500) {
        baseRatePerKg = item.rate300kg;
        tierApplied = '+300kg';
      } else if (chargeableWeight < 1000) {
        baseRatePerKg = item.rate500kg;
        tierApplied = '+500kg';
      } else {
        baseRatePerKg = item.rate1000kg;
        tierApplied = '+1000kg';
      }

      const totalBaseFreight = Math.max(item.minCharge || 0, baseRatePerKg * chargeableWeight);
      const totalFuel = (item.fuelSurcharge || 0) * chargeableWeight;
      const totalSecurity = (item.secSurcharge || 0) * chargeableWeight;
      const totalHandling = (item.handlingFee || 0) * chargeableWeight;
      const grandTotalUSD = totalBaseFreight + totalFuel + totalSecurity + totalHandling;
      const effectiveAllInPerKg = grandTotalUSD / (chargeableWeight || 1);

      return {
        ...item,
        airlineName: airline.name,
        airlineCode: airline.code,
        airlineLogoBg: airline.logoBg,
        tierApplied,
        baseRatePerKg,
        totalBaseFreight,
        totalFuel,
        totalSecurity,
        totalHandling,
        grandTotalUSD,
        effectiveAllInPerKg
      };
    }).sort((a, b) => a.grandTotalUSD - b.grandTotalUSD);
  }, [rates, origin, destination, commodity, chargeableWeight, airlines]);

  const formatPrice = (usdVal) => {
    if (!usdVal && usdVal !== 0) return '-';
    if (currencyMode === 'KES') {
      return `KSh ${(usdVal * exchangeRate).toLocaleString('en-US', { maximumFractionDigits: 0 })}`;
    }
    return `$${Number(usdVal).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const handleCopyQuote = (carrier) => {
    const dest = airports[destination]?.name || destination;
    const commObj = commodities.find(c => c.id === commodity);
    const text = `🥑 *KENYA FRESH PRODUCE AIR FREIGHT QUOTE* ✈️
━━━━━━━━━━━━━━━━━━━━━━━━━━━
📍 *Route:* ${origin} (JKIA Nairobi) ➔ ${destination} (${dest})
🌱 *Produce Item:* ${commObj?.name} (${commObj?.tempRange})
⚖️ *Actual Gross Weight:* ${grossWeight} KG
📐 *Dimensions/Volume:* ${volumeCbm} CBM (${volumetricWeight} Vol. KG)
🎯 *Chargeable Weight:* ${chargeableWeight} KG
━━━━━━━━━━━━━━━━━━━━━━━━━━━
✈️ *Airline Carrier:* ${carrier.airlineName} (${carrier.airlineCode})
💰 *Base Produce Rate (${carrier.tierApplied}):* $${carrier.baseRatePerKg.toFixed(2)} / KG
⛽ *FSC Fuel + SSC Security:* $${((carrier.fuelSurcharge || 0) + (carrier.secSurcharge || 0)).toFixed(2)} / KG
💵 *Total Landed Air Freight:* $${carrier.grandTotalUSD.toFixed(2)} USD (All-In: $${carrier.effectiveAllInPerKg.toFixed(2)} / KG)
⏱️ *Transit Duration:* ${carrier.transitTime} | ${carrier.frequency}
━━━━━━━━━━━━━━━━━━━━━━━━━━━
🌿 *Pre-Cooling & KEPHIS Phytosanitary Clearance Ready*
📅 *Rates Verified for Today via AeroProduce Kenya*`;

    navigator.clipboard.writeText(text);
    setCopiedQuote(carrier.id);
    showNotification(`Quotation for ${carrier.airlineName} copied!`);
    setTimeout(() => setCopiedQuote(false), 3000);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Title */}
      <div className="mb-6">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold mb-2">
          <Calculator className="w-3.5 h-3.5" />
          <span>IATA Volumetric Fresh Produce Cargo Estimator</span>
        </div>
        <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
          Fresh Produce Air Cargo Cost Calculator
        </h2>
        <p className="text-sm text-slate-300 mt-1">
          Estimate total landed air freight for Avocados, Soya Beans & Legumes, Chillies, Herbs, and compare all airline quotes instantly.
        </p>

        {/* Produce Quick Presets */}
        <div className="mt-4 flex flex-wrap items-center gap-2">
          <span className="text-xs font-semibold text-slate-400">Quick Presets:</span>
          <button
            onClick={() => applyProducePreset('avocados')}
            className="px-3 py-1 bg-emerald-950/80 hover:bg-emerald-900 border border-emerald-500/30 text-emerald-300 rounded-lg text-xs font-medium transition-all"
          >
            🥑 2x Pallet Avocados (1,800 KG)
          </button>
          <button
            onClick={() => applyProducePreset('soya_beans')}
            className="px-3 py-1 bg-teal-950/80 hover:bg-teal-900 border border-teal-500/30 text-teal-300 rounded-lg text-xs font-medium transition-all"
          >
            🫘 2x Skid Soya/French Beans (1,200 KG)
          </button>
          <button
            onClick={() => applyProducePreset('chillies')}
            className="px-3 py-1 bg-rose-950/80 hover:bg-rose-900 border border-rose-500/30 text-rose-300 rounded-lg text-xs font-medium transition-all"
          >
            🌶️ 1x Skid Fresh Chillies (600 KG)
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Shipment Parameters Form */}
        <div className="lg:col-span-5 space-y-6">
          <div className="glass-panel p-6 rounded-2xl border border-slate-800 shadow-xl">
            <h3 className="text-base font-bold text-white mb-4 flex items-center gap-2">
              <Box className="w-4 h-4 text-emerald-400" />
              1. Produce Shipment Specifications
            </h3>

            <div className="space-y-4 text-xs">
              {/* Departure */}
              <div>
                <label className="block font-semibold text-slate-300 mb-1">Departure Airport (Kenya)</label>
                <select
                  value={origin}
                  onChange={(e) => setOrigin(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-white font-medium focus:border-emerald-500 focus:outline-none"
                >
                  <option value="NBO">Nairobi - Jomo Kenyatta International (NBO / JKIA)</option>
                  <option value="MBA">Mombasa - Moi International Airport (MBA)</option>
                  <option value="EDL">Eldoret - Eldoret International Airport (EDL)</option>
                </select>
              </div>

              {/* Destination */}
              <div>
                <label className="block font-semibold text-slate-300 mb-1">Destination Airport</label>
                <select
                  value={destination}
                  onChange={(e) => setDestination(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-white font-medium focus:border-emerald-500 focus:outline-none"
                >
                  <optgroup label="Europe (Direct & Hubs)">
                    <option value="AMS">Amsterdam, Netherlands (AMS - Schiphol)</option>
                    <option value="LHR">London Heathrow, UK (LHR)</option>
                    <option value="FRA">Frankfurt, Germany (FRA)</option>
                    <option value="BRU">Brussels, Belgium (BRU)</option>
                    <option value="CDG">Paris, France (CDG)</option>
                  </optgroup>
                  <optgroup label="Middle East">
                    <option value="DXB">Dubai, UAE (DXB)</option>
                    <option value="DOH">Doha, Qatar (DOH)</option>
                    <option value="JED">Jeddah, Saudi Arabia (JED)</option>
                    <option value="RUH">Riyadh, Saudi Arabia (RUH)</option>
                    <option value="SHJ">Sharjah, UAE (SHJ)</option>
                  </optgroup>
                  <optgroup label="Asia & Far East">
                    <option value="CAN">Guangzhou, China (CAN)</option>
                    <option value="BOM">Mumbai, India (BOM)</option>
                  </optgroup>
                  <optgroup label="Americas & Africa">
                    <option value="JFK">New York, USA (JFK)</option>
                    <option value="JNB">Johannesburg, South Africa (JNB)</option>
                  </optgroup>
                </select>
              </div>

              {/* Commodity */}
              <div>
                <label className="block font-semibold text-slate-300 mb-1">Fresh Produce Commodity</label>
                <select
                  value={commodity}
                  onChange={(e) => setCommodity(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-white font-medium focus:border-emerald-500 focus:outline-none"
                >
                  {commodities.map(c => (
                    <option key={c.id} value={c.id}>{c.icon} {c.name}</option>
                  ))}
                </select>
              </div>

              {/* Gross Weight */}
              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="font-semibold text-slate-300">Actual Gross Weight (Produce + Packaging)</label>
                  <span className="font-mono text-emerald-400 font-bold">{grossWeight} KG</span>
                </div>
                <div className="relative">
                  <input
                    type="number"
                    min="1"
                    step="10"
                    value={grossWeight}
                    onChange={(e) => setGrossWeight(Number(e.target.value))}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-white font-mono text-sm focus:border-emerald-500 focus:outline-none"
                    placeholder="e.g. 1200"
                  />
                  <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-mono text-xs">KG</span>
                </div>
              </div>
            </div>
          </div>

          {/* Dimensions & Pallet Math */}
          <div className="glass-panel p-6 rounded-2xl border border-slate-800 shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Scale className="w-4 h-4 text-teal-400" />
                2. Pallet / Carton Dimensions
              </h3>

              <div className="flex bg-slate-900 border border-slate-700 rounded-lg p-0.5 text-[10px] font-semibold">
                <button
                  onClick={() => setDimensionMode('dimensions')}
                  className={`px-2 py-1 rounded-md transition-all ${
                    dimensionMode === 'dimensions' ? 'bg-emerald-500 text-white' : 'text-slate-400'
                  }`}
                >
                  LxWxH (cm)
                </button>
                <button
                  onClick={() => setDimensionMode('cbm')}
                  className={`px-2 py-1 rounded-md transition-all ${
                    dimensionMode === 'cbm' ? 'bg-emerald-500 text-white' : 'text-slate-400'
                  }`}
                >
                  Direct CBM
                </button>
              </div>
            </div>

            {dimensionMode === 'dimensions' ? (
              <div className="space-y-3 text-xs">
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="block text-slate-400 mb-1">Length (cm)</label>
                    <input
                      type="number"
                      value={length}
                      onChange={(e) => setLength(Number(e.target.value))}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-2 text-white font-mono text-xs focus:border-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-400 mb-1">Width (cm)</label>
                    <input
                      type="number"
                      value={width}
                      onChange={(e) => setWidth(Number(e.target.value))}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-2 text-white font-mono text-xs focus:border-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-400 mb-1">Height (cm)</label>
                    <input
                      type="number"
                      value={height}
                      onChange={(e) => setHeight(Number(e.target.value))}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-2 text-white font-mono text-xs focus:border-emerald-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-slate-400 mb-1">Number of Produce Pallets / Skids / Boxes</label>
                  <input
                    type="number"
                    min="1"
                    value={pieces}
                    onChange={(e) => setPieces(Number(e.target.value))}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white font-mono text-xs focus:border-emerald-500"
                  />
                </div>
              </div>
            ) : (
              <div>
                <label className="block text-xs text-slate-400 mb-1">Total Volume in Cubic Meters (CBM)</label>
                <div className="relative">
                  <input
                    type="number"
                    step="0.1"
                    value={customCbm}
                    onChange={(e) => setCustomCbm(Number(e.target.value))}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-white font-mono text-sm focus:border-emerald-500"
                  />
                  <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-mono text-xs">CBM (m³)</span>
                </div>
              </div>
            )}

            {/* Diagnostic */}
            <div className="mt-4 p-4 rounded-xl bg-slate-950/80 border border-slate-800 space-y-2 text-xs">
              <div className="flex justify-between items-center text-slate-400">
                <span>Total Volume:</span>
                <span className="font-mono text-white font-semibold">{volumeCbm} CBM</span>
              </div>
              <div className="flex justify-between items-center text-slate-400">
                <span>Volumetric Weight (1:167):</span>
                <span className="font-mono text-amber-400 font-semibold">{volumetricWeight} KG</span>
              </div>
              <div className="flex justify-between items-center text-slate-400">
                <span>Actual Gross Weight:</span>
                <span className="font-mono text-emerald-400 font-semibold">{grossWeight} KG</span>
              </div>
              <div className="pt-2 border-t border-slate-800 flex justify-between items-center">
                <span className="font-bold text-white">Billable Chargeable Weight:</span>
                <span className="font-mono text-sm font-extrabold text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded border border-emerald-500/20">
                  {chargeableWeight} KG
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Multi-Airline Quote Comparison */}
        <div className="lg:col-span-7 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <Plane className="w-5 h-5 text-emerald-400" />
              Available Produce Carrier Quotes ({matchedCarriers.length})
            </h3>
            <span className="text-xs text-slate-400">
              Ranked by Lowest Landed Freight
            </span>
          </div>

          {matchedCarriers.length === 0 ? (
            <div className="glass-panel p-8 rounded-2xl border border-slate-800 text-center">
              <Leaf className="w-12 h-12 text-slate-600 mx-auto mb-3" />
              <h4 className="text-base font-bold text-white">No Direct Rates for this Produce Lane</h4>
              <p className="text-xs text-slate-400 mt-1 max-w-md mx-auto">
                No direct rates found for {origin} ➔ {destination} ({commodity}). Try Amsterdam (AMS), London (LHR), Dubai (DXB), or Jeddah (JED).
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {matchedCarriers.map((carrier, index) => {
                const isBestValue = index === 0;
                const isCopied = copiedQuote === carrier.id;

                return (
                  <div
                    key={carrier.id}
                    className={`glass-panel p-5 rounded-2xl border transition-all hover:border-emerald-500/40 relative overflow-hidden ${
                      isBestValue 
                        ? 'border-emerald-500/50 bg-gradient-to-r from-emerald-950/20 via-slate-900/90 to-slate-900/90' 
                        : 'border-slate-800'
                    }`}
                  >
                    {isBestValue && (
                      <div className="absolute top-0 right-0 bg-gradient-to-l from-emerald-500 to-teal-600 text-white text-[10px] font-bold px-3 py-1 rounded-bl-xl shadow-md flex items-center gap-1">
                        <Award className="w-3 h-3" /> BEST VALUE PRODUCE SPOT
                      </div>
                    )}

                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      {/* Carrier Details */}
                      <div className="flex items-start gap-3">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm font-mono border ${carrier.airlineLogoBg}`}>
                          {carrier.airlineCode}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="font-extrabold text-base text-white">{carrier.airlineName}</h4>
                            <span className="text-[10px] font-mono font-bold bg-slate-800 text-slate-300 px-1.5 py-0.5 rounded">
                              {carrier.tierApplied}
                            </span>
                          </div>
                          <div className="text-xs text-slate-400 mt-0.5 flex flex-wrap items-center gap-2">
                            <span className="flex items-center gap-1">
                              <Clock className="w-3 h-3 text-emerald-400" /> {carrier.transitTime}
                            </span>
                            <span>•</span>
                            <span>{carrier.frequency}</span>
                          </div>
                        </div>
                      </div>

                      {/* Total Cost */}
                      <div className="text-left sm:text-right">
                        <div className="text-xs text-slate-400">Total Landed Freight</div>
                        <div className="text-2xl font-mono font-extrabold text-emerald-400">
                          {formatPrice(carrier.grandTotalUSD)}
                        </div>
                        <div className="text-[11px] font-mono text-slate-400">
                          All-In: <span className="text-teal-300 font-semibold">{formatPrice(carrier.effectiveAllInPerKg)} / KG</span>
                        </div>
                      </div>
                    </div>

                    {/* Breakdown */}
                    <div className="mt-4 pt-3 border-t border-slate-800/80 grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px] font-mono bg-slate-950/60 p-2.5 rounded-xl">
                      <div>
                        <span className="text-slate-500 block text-[10px]">Base Freight:</span>
                        <span className="text-slate-200">{formatPrice(carrier.totalBaseFreight)}</span>
                      </div>
                      <div>
                        <span className="text-slate-500 block text-[10px]">Fuel (FSC):</span>
                        <span className="text-slate-200">{formatPrice(carrier.totalFuel)}</span>
                      </div>
                      <div>
                        <span className="text-slate-500 block text-[10px]">Security (SSC):</span>
                        <span className="text-slate-200">{formatPrice(carrier.totalSecurity)}</span>
                      </div>
                      <div>
                        <span className="text-slate-500 block text-[10px]">KAA Handling:</span>
                        <span className="text-slate-200">{formatPrice(carrier.totalHandling)}</span>
                      </div>
                    </div>

                    {/* Action Bar */}
                    <div className="mt-3 flex items-center justify-between gap-3 text-xs">
                      <div className="text-[11px] text-slate-400 flex items-center gap-1">
                        <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Valid for Today’s Produce Booking</span>
                      </div>

                      <button
                        onClick={() => handleCopyQuote(carrier)}
                        className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg font-semibold text-xs transition-all ${
                          isCopied
                            ? 'bg-emerald-600 text-white'
                            : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-md shadow-emerald-600/20'
                        }`}
                      >
                        {isCopied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                        {isCopied ? 'Copied Produce Quote!' : 'Copy Produce Quotation'}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
