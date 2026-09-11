import React, { useState, useEffect } from 'react';
import { useRates } from '../context/RatesContext';
import { getAvailableFlightSpaceMT } from '../data/initialRates';
import { 
  Plane, 
  X, 
  ShieldCheck, 
  Clock, 
  Calendar, 
  Box, 
  Scale, 
  AlertCircle, 
  CheckCircle2, 
  User, 
  Lock, 
  Building2, 
  Mail, 
  Phone,
  Sparkles,
  CreditCard,
  Check,
  Leaf
} from 'lucide-react';

export const BookSpaceModal = () => {
  const { 
    isBookingModalOpen, 
    closeBookingModal, 
    selectedBookingRoute, 
    airlines, 
    airports, 
    commodities, 
    currentUser, 
    login, 
    signup, 
    createShipment,
    calculateProduceCostBreakdown,
    currencyMode,
    exchangeRate,
    profitMarginPerKg,
    getSellingRate,
    showNotification
  } = useRates();

  const [weightKg, setWeightKg] = useState(1000);
  const [flightDate, setFlightDate] = useState('Tomorrow');
  const [specialInstructions, setSpecialInstructions] = useState('');

  // Inline Auth State for unauthenticated users
  const [authTab, setAuthTab] = useState('login'); // 'login' | 'signup'
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [authName, setAuthName] = useState('');
  const [authCompany, setAuthCompany] = useState('');
  const [authPhone, setAuthPhone] = useState('+254 7');

  useEffect(() => {
    if (selectedBookingRoute) {
      const initialWeight = selectedBookingRoute.chargeableWeight || selectedBookingRoute.grossWeight || 1000;
      setWeightKg(initialWeight);
    }
  }, [selectedBookingRoute]);

  if (!isBookingModalOpen || !selectedBookingRoute) return null;

  const item = selectedBookingRoute;
  const airline = airlines.find(a => a.id === item.airlineId) || {
    name: item.airlineName || item.airlineId,
    code: item.airlineCode || item.airlineId,
    logoBg: 'bg-emerald-950 text-emerald-400 border-emerald-800/40',
    fleet: 'Dedicated Cargo Freighter'
  };

  const origAirport = airports[item.origin] || { code: item.origin, city: 'Nairobi' };
  const destAirport = airports[item.destination] || { code: item.destination, city: item.destination, country: '' };
  const commObj = commodities.find(c => c.id === item.commodity) || {
    id: item.commodity,
    name: item.commodityName || item.commodity,
    icon: '📦',
    tempRange: '+4°C'
  };

  // Base rate and selling rate calculation (Markup is seamlessly included, NEVER indicated to client)
  const baseRate = item.baseRatePerKg || item.rate1000kg || 1.15;
  const quotedRatePerKg = item.quotedRatePerKg || getSellingRate(baseRate);
  const quotedRatePerMT = Number((quotedRatePerKg * 1000).toFixed(2));

  // Flight Space checking
  const maxHoldSpaceMT = item.spaceAvailableMT || getAvailableFlightSpaceMT(item);
  const requestedWeightMT = Number((weightKg / 1000).toFixed(2));
  const isSpaceAvailable = requestedWeightMT <= maxHoldSpaceMT;
  const remainingSpaceAfterMT = Number(Math.max(0, maxHoldSpaceMT - requestedWeightMT).toFixed(2));

  // Produce local handling fees (4 Categories: KAA handling, Board Fee fixed $17, Security SCC, 16% VAT)
  const produceCost = calculateProduceCostBreakdown(quotedRatePerKg, weightKg);
  const totalBaseFreight = Math.max(item.minCharge || 0, quotedRatePerKg * weightKg);
  const totalFuel = Number(((item.fuelSurcharge || 0.38) * weightKg).toFixed(2));
  const grandTotalUSD = Number((totalBaseFreight + totalFuel + produceCost.total).toFixed(2));

  const formatPrice = (usdVal) => {
    if (!usdVal && usdVal !== 0) return '-';
    if (currencyMode === 'KES') {
      return `KSh ${(usdVal * exchangeRate).toLocaleString('en-US', { maximumFractionDigits: 0 })}`;
    }
    return `$${Number(usdVal).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const handleInlineAuth = (e) => {
    e.preventDefault();
    if (authTab === 'login') {
      if (!authEmail.trim()) {
        showNotification('Please enter your email address', 'error');
        return;
      }
      login(authEmail, authPassword);
    } else {
      if (!authEmail.trim() || !authCompany.trim()) {
        showNotification('Please enter company name and email', 'error');
        return;
      }
      signup({
        name: authName,
        companyName: authCompany,
        email: authEmail,
        password: authPassword,
        phone: authPhone
      });
    }
  };

  const handleConfirmOrder = () => {
    if (!currentUser) {
      showNotification('Please sign in or register below before confirming your booking.', 'error');
      return;
    }

    if (!isSpaceAvailable) {
      showNotification(`Requested tonnage (${requestedWeightMT} MT) exceeds available flight space (${maxHoldSpaceMT} MT). Please reduce weight.`, 'error');
      return;
    }

    createShipment({
      origin: item.origin,
      destination: item.destination,
      commodity: commObj.id,
      commodityName: commObj.name,
      airlineId: airline.code || item.airlineId,
      airlineName: airline.name,
      airlineCode: airline.code || item.airlineId,
      grossWeight: weightKg,
      chargeableWeight: weightKg,
      baseRatePerKg: baseRate,
      quotedRatePerKg: quotedRatePerKg,
      grandTotalUSD: grandTotalUSD,
      flightDate: flightDate || 'Tomorrow',
      notes: specialInstructions
    }, true);

    closeBookingModal();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md overflow-y-auto animate-fade-in">
      <div className="relative w-full max-w-2xl bg-slate-900 border border-emerald-500/30 rounded-3xl shadow-2xl overflow-hidden my-6">
        
        {/* Top Accent Strip */}
        <div className="h-2 bg-gradient-to-r from-emerald-500 via-teal-400 to-sky-500 w-full" />

        {/* Modal Header */}
        <div className="p-5 border-b border-slate-800 flex items-start justify-between gap-4 bg-slate-950/70">
          <div className="flex items-center gap-3">
            <div className={`w-11 h-11 rounded-2xl flex items-center justify-center font-mono font-bold text-base border shrink-0 ${airline.logoBg}`}>
              {airline.code}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded text-[10px] font-extrabold uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  Confirmed Hold Space
                </span>
                <span className="text-xs font-mono text-slate-400">
                  {origAirport.code} ➔ {destAirport.code} ({destAirport.city})
                </span>
              </div>
              <h3 className="text-lg sm:text-xl font-extrabold text-white mt-0.5">
                Book Airline Cargo Space • {airline.name}
              </h3>
            </div>
          </div>

          <button
            onClick={closeBookingModal}
            className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-all"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 space-y-4 max-h-[75vh] overflow-y-auto text-xs">
          
          {/* Flight Capacity Verification Meter */}
          <div className={`p-4 rounded-2xl border ${
            isSpaceAvailable 
              ? 'bg-emerald-950/20 border-emerald-500/30' 
              : 'bg-rose-950/20 border-rose-500/30'
          }`}>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Plane className="w-4 h-4 text-emerald-400" />
                <span className="font-bold text-white text-sm">Aircraft Hold Capacity Check</span>
              </div>
              <span className={`px-2.5 py-0.5 rounded-full font-mono text-xs font-bold border ${
                isSpaceAvailable
                  ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                  : 'bg-rose-500/20 text-rose-300 border-rose-500/40'
              }`}>
                {isSpaceAvailable ? '✅ Space Available' : '⚠️ Exceeds Capacity'}
              </span>
            </div>

            <div className="grid grid-cols-3 gap-2 text-center font-mono my-2 text-[11px]">
              <div className="bg-slate-900/80 p-2 rounded-xl border border-slate-800">
                <span className="text-slate-400 block text-[10px]">Verified Aircraft Space:</span>
                <span className="text-emerald-300 font-extrabold text-sm">{maxHoldSpaceMT} MT</span>
              </div>
              <div className="bg-slate-900/80 p-2 rounded-xl border border-slate-800">
                <span className="text-slate-400 block text-[10px]">Your Requested Load:</span>
                <span className={`font-extrabold text-sm ${isSpaceAvailable ? 'text-white' : 'text-rose-400'}`}>
                  {requestedWeightMT} MT
                </span>
              </div>
              <div className="bg-slate-900/80 p-2 rounded-xl border border-slate-800">
                <span className="text-slate-400 block text-[10px]">Space Left on Flight:</span>
                <span className="text-sky-300 font-extrabold text-sm">{remainingSpaceAfterMT} MT</span>
              </div>
            </div>

            <div className="text-[11px] text-slate-400 flex items-center justify-between mt-2">
              <span>Aircraft Fleet: <strong>{airline.fleet}</strong></span>
              <span>Schedule: <strong>{item.frequency || 'Scheduled Priority'}</strong></span>
            </div>
          </div>

          {/* Commodity & Weight Configuration */}
          <div className="bg-slate-950/70 p-4 rounded-2xl border border-slate-800 space-y-3">
            <h4 className="font-bold text-white text-xs flex items-center gap-1.5">
              <Box className="w-4 h-4 text-emerald-400" />
              Consignment Specifications
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-400 mb-1">Export Commodity</label>
                <div className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white font-medium flex items-center gap-2">
                  <span className="text-base">{commObj.icon}</span>
                  <span className="truncate">{commObj.name}</span>
                </div>
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Chargeable Weight (KG)</label>
                <div className="relative">
                  <input
                    type="number"
                    min="50"
                    step="50"
                    value={weightKg}
                    onChange={(e) => setWeightKg(Number(e.target.value) || 100)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono focus:border-emerald-500 focus:outline-none"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 font-mono">
                    KG ({(weightKg / 1000).toFixed(2)} MT)
                  </span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-400 mb-1">Preferred Flight Departure</label>
                <select
                  value={flightDate}
                  onChange={(e) => setFlightDate(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white focus:border-emerald-500 focus:outline-none"
                >
                  <option value="Tomorrow">Tomorrow (Priority Hold)</option>
                  <option value="2 Days Ahead">2 Days Ahead (Optimal Pre-Cooling)</option>
                  <option value="3 Days Ahead">3 Days Ahead (Guaranteed Space Reservation)</option>
                  <option value="This Weekend">This Weekend Regular Scheduled</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Special Handling Instructions</label>
                <input
                  type="text"
                  placeholder="e.g. Pre-cooled at +4°C, pallets strapped"
                  value={specialInstructions}
                  onChange={(e) => setSpecialInstructions(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white placeholder-slate-500 focus:border-emerald-500 focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Pricing & Produce Cost 4 Categories Breakdown */}
          <div className="bg-slate-950/70 p-4 rounded-2xl border border-slate-800 space-y-2.5">
            <h4 className="font-bold text-white text-xs flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <CreditCard className="w-4 h-4 text-emerald-400" />
                Produce Cost & Landed Air Freight Breakdown
              </span>
              <span className="font-mono text-emerald-400 font-bold">
                Quoted: {formatPrice(quotedRatePerMT)} / MT ({formatPrice(quotedRatePerKg)}/kg)
              </span>
            </h4>

            <div className="p-3 bg-slate-900/90 rounded-xl border border-slate-800/80 space-y-1.5 font-mono text-[11px]">
              <div className="flex justify-between text-slate-300">
                <span>1. KAA Handling Fees ($0.08 × price/kg):</span>
                <span className="text-white font-semibold">{formatPrice(produceCost.kaaHandling)}</span>
              </div>
              <div className="flex justify-between text-slate-300">
                <span>2. Board Fee (HCDA/Board fixed fee):</span>
                <span className="text-white font-semibold">{formatPrice(produceCost.boardFee)}</span>
              </div>
              <div className="flex justify-between text-slate-300">
                <span>3. Security SCC ($0.07 × price/kg):</span>
                <span className="text-white font-semibold">{formatPrice(produceCost.securityScc)}</span>
              </div>
              <div className="flex justify-between text-slate-300">
                <span>4. Value Added Tax (16% VAT on local fees):</span>
                <span className="text-sky-300 font-semibold">{formatPrice(produceCost.vat16)}</span>
              </div>
              <div className="pt-1.5 border-t border-slate-800 flex justify-between text-slate-400">
                <span>Total Terminal / Produce Handling Cost:</span>
                <span className="text-teal-300 font-bold">{formatPrice(produceCost.total)}</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Base Air Freight ({weightKg} KG) + FSC Fuel:</span>
                <span className="text-slate-200">{formatPrice(totalBaseFreight + totalFuel)}</span>
              </div>
              <div className="pt-2 border-t border-slate-700 flex justify-between items-center text-sm font-bold text-emerald-400">
                <span>Grand Landed Air Freight Total:</span>
                <span className="text-base font-extrabold text-emerald-300">
                  {formatPrice(grandTotalUSD)}
                </span>
              </div>
            </div>
          </div>

          {/* Customer Account Verification or Inline Sign-In / Register */}
          {currentUser ? (
            <div className="p-3.5 rounded-2xl bg-emerald-950/20 border border-emerald-500/30 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold">
                  <User className="w-4 h-4" />
                </div>
                <div>
                  <div className="font-bold text-white text-xs">{currentUser.companyName}</div>
                  <div className="text-[10px] text-slate-400 font-mono">
                    {currentUser.email} • {currentUser.hcdLicense || 'HCDA Verified'}
                  </div>
                </div>
              </div>
              <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                Authenticated Exporter
              </span>
            </div>
          ) : (
            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-700 space-y-3">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <span className="font-bold text-white text-xs">Exporter Sign-In Required to Book</span>
                <div className="flex bg-slate-900 border border-slate-800 rounded-lg p-0.5 text-[10px] font-semibold">
                  <button
                    onClick={() => setAuthTab('login')}
                    className={`px-2.5 py-1 rounded-md transition-all ${
                      authTab === 'login' ? 'bg-emerald-500 text-white' : 'text-slate-400'
                    }`}
                  >
                    Sign In
                  </button>
                  <button
                    onClick={() => setAuthTab('signup')}
                    className={`px-2.5 py-1 rounded-md transition-all ${
                      authTab === 'signup' ? 'bg-emerald-500 text-white' : 'text-slate-400'
                    }`}
                  >
                    New Exporter Register
                  </button>
                </div>
              </div>

              <form onSubmit={handleInlineAuth} className="space-y-2.5">
                {authTab === 'signup' && (
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-slate-400 text-[10px] mb-0.5">Company / Farm Name *</label>
                      <input
                        type="text"
                        required
                        value={authCompany}
                        onChange={(e) => setAuthCompany(e.target.value)}
                        placeholder="Naivasha Produce Ltd"
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-white text-xs focus:border-emerald-500 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-400 text-[10px] mb-0.5">Contact Person Name</label>
                      <input
                        type="text"
                        value={authName}
                        onChange={(e) => setAuthName(e.target.value)}
                        placeholder="John Doe"
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-white text-xs focus:border-emerald-500 focus:outline-none"
                      />
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-slate-400 text-[10px] mb-0.5">Email Address *</label>
                    <input
                      type="email"
                      required
                      value={authEmail}
                      onChange={(e) => setAuthEmail(e.target.value)}
                      placeholder="export@domain.co.ke"
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-white text-xs focus:border-emerald-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-400 text-[10px] mb-0.5">Password</label>
                    <input
                      type="password"
                      value={authPassword}
                      onChange={(e) => setAuthPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-white text-xs focus:border-emerald-500 focus:outline-none"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-emerald-300 font-bold border border-emerald-500/30 text-xs transition-all"
                >
                  {authTab === 'login' ? 'Sign In to Account' : 'Register & Continue'}
                </button>
              </form>
            </div>
          )}

          {/* Action Buttons */}
          <div className="pt-2 flex items-center justify-between gap-3">
            <button
              onClick={closeBookingModal}
              className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs transition-all"
            >
              Cancel
            </button>

            <button
              onClick={handleConfirmOrder}
              disabled={!isSpaceAvailable}
              className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-xs shadow-lg transition-all ${
                isSpaceAvailable
                  ? 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white shadow-emerald-600/30 active:scale-95'
                  : 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
              }`}
            >
              <Plane className="w-4 h-4" />
              <span>Confirm Space Reservation & Place Order</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
