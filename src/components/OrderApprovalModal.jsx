import React, { useState } from 'react';
import { useRates } from '../context/RatesContext';
import { 
  CheckCircle2, 
  AlertTriangle, 
  Calendar, 
  Building2, 
  CreditCard, 
  Copy, 
  Check, 
  X, 
  Plane, 
  Clock, 
  ShieldCheck, 
  ExternalLink,
  ChevronRight,
  Info
} from 'lucide-react';

export const OrderApprovalModal = () => {
  const { 
    approvalPromptShipment, 
    isApprovalModalOpen, 
    closeApprovalNotice, 
    recordBankPayment, 
    currencyMode,
    exchangeRate,
    showNotification 
  } = useRates();

  const [paymentChoice, setPaymentChoice] = useState('pay_now'); // 'pay_now' | 'pay_later'
  const [bankRefInput, setBankRefInput] = useState('');
  const [copiedField, setCopiedField] = useState(null);
  const [isSubmittingPayment, setIsSubmittingPayment] = useState(false);

  if (!isApprovalModalOpen || !approvalPromptShipment) {
    return null;
  }

  const shp = approvalPromptShipment;

  const formatPrice = (usdAmount) => {
    if (currencyMode === 'KES') {
      const kes = Math.round(usdAmount * exchangeRate);
      return `KES ${kes.toLocaleString()}`;
    }
    return `$${Number(usdAmount).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USD`;
  };

  const handleCopy = (text, fieldName) => {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldName);
    showNotification(`Copied ${fieldName} to clipboard!`);
    setTimeout(() => setCopiedField(null), 2500);
  };

  const handleConfirmBankPayment = (e) => {
    e.preventDefault();
    setIsSubmittingPayment(true);
    setTimeout(() => {
      recordBankPayment(shp.id, bankRefInput.trim() || `BANK-WIRE-${shp.awbNumber}`);
      setIsSubmittingPayment(false);
      closeApprovalNotice();
    }, 400);
  };

  const handleConfirmPayLater = () => {
    showNotification(`Booking confirmed! Remember: Advance payment must be completed before flight departure.`, 'info');
    closeApprovalNotice();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md overflow-y-auto animate-fade-in">
      <div className="relative w-full max-w-2xl bg-slate-900 border border-emerald-500/40 rounded-3xl shadow-2xl shadow-emerald-950/50 overflow-hidden my-6">
        
        {/* Top Header Glow Bar */}
        <div className="h-2 bg-gradient-to-r from-emerald-500 via-teal-400 to-sky-500 w-full" />

        {/* Modal Header */}
        <div className="p-6 pb-4 border-b border-slate-800/80 flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
              <CheckCircle2 className="w-7 h-7" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded text-[10px] font-extrabold uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  Booking Approved
                </span>
                <span className="text-xs font-mono text-slate-400">AWB: {shp.awbNumber}</span>
              </div>
              <h3 className="text-xl font-extrabold text-white mt-0.5">
                Produce Air Cargo Order Approved
              </h3>
              <p className="text-xs text-slate-400">
                {shp.commodityName} • {shp.origin} ➔ {shp.destination} via {shp.airlineName}
              </p>
            </div>
          </div>

          <button
            onClick={closeApprovalNotice}
            className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-all"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-5 max-h-[75vh] overflow-y-auto text-xs">

          {/* Quick Shipment Summary Strip */}
          <div className="bg-slate-950/70 p-4 rounded-2xl border border-slate-800 grid grid-cols-2 sm:grid-cols-4 gap-3 font-mono">
            <div>
              <span className="text-slate-500 block text-[10px]">Chargeable Weight</span>
              <span className="text-white font-bold text-sm">{shp.chargeableWeight?.toLocaleString()} KG</span>
            </div>
            <div>
              <span className="text-slate-500 block text-[10px]">All-In Rate</span>
              <span className="text-emerald-400 font-bold text-sm">{formatPrice(shp.quotedRatePerKg)}/KG</span>
            </div>
            <div>
              <span className="text-slate-500 block text-[10px]">Flight Departure</span>
              <span className="text-teal-300 font-bold text-sm">{shp.flightDate}</span>
            </div>
            <div>
              <span className="text-slate-500 block text-[10px]">Total Order Due</span>
              <span className="text-emerald-300 font-bold text-sm">{formatPrice(shp.grandTotalUSD)}</span>
            </div>
          </div>

          {/* CRITICAL POLICY 1: 3 DAYS ADVANCE QUOTE SPACE ASSURANCE */}
          <div className="p-4 rounded-2xl bg-gradient-to-r from-sky-950/50 via-slate-900 to-indigo-950/40 border border-sky-500/30 text-slate-300">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-xl bg-sky-500/20 border border-sky-400/30 flex items-center justify-center text-sky-400 shrink-0 mt-0.5">
                <Calendar className="w-4 h-4" />
              </div>
              <div>
                <div className="flex items-center gap-1.5 text-sky-300 font-bold text-xs uppercase tracking-wider mb-1">
                  <span>Crucial Booking Notice: 3 Days Advance Quoting</span>
                </div>
                <p className="text-[11px] leading-relaxed text-slate-300">
                  Please note that fresh produce cargo space out of <strong>JKIA Nairobi (NBO)</strong> is allocated on a strictly scheduled basis with partner airlines. Exporters must <strong className="text-sky-300">request quotes and confirm bookings at least 3 days in advance</strong> to guarantee aircraft space allocations and cold-chain intake during peak export seasons.
                </p>
              </div>
            </div>
          </div>

          {/* CRITICAL POLICY 2: ADVANCE PAYMENT REQUIRED */}
          <div className="p-4 rounded-2xl bg-gradient-to-r from-amber-950/50 via-slate-900 to-orange-950/40 border border-amber-500/30 text-slate-300">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-xl bg-amber-500/20 border border-amber-400/30 flex items-center justify-center text-amber-400 shrink-0 mt-0.5">
                <AlertTriangle className="w-4 h-4" />
              </div>
              <div>
                <div className="flex items-center gap-1.5 text-amber-300 font-bold text-xs uppercase tracking-wider mb-1">
                  <span>Mandatory Policy: 100% Advance Payment Required</span>
                </div>
                <p className="text-[11px] leading-relaxed text-slate-300">
                  Please note that <strong className="text-amber-300">payments should be done in advance</strong>. Freight charges and terminal handling fees must be cleared prior to cargo acceptance at the JKIA perishable cold-store and before original Air Waybills (BL) are released for export customs.
                </p>
              </div>
            </div>
          </div>

          {/* QUESTION: WILL YOU PAY NOW VIA A BANK? */}
          <div className="bg-slate-950/90 p-5 rounded-2xl border border-slate-800 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
              <div>
                <div className="text-sm font-bold text-white flex items-center gap-2">
                  <CreditCard className="w-4 h-4 text-emerald-400" />
                  <span>Will you pay now via a bank transfer?</span>
                </div>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Select your preferred settlement arrangement for this produce shipment.
                </p>
              </div>

              {/* Toggle Buttons */}
              <div className="inline-flex rounded-xl bg-slate-900 p-1 border border-slate-800 shrink-0">
                <button
                  type="button"
                  onClick={() => setPaymentChoice('pay_now')}
                  className={`px-3 py-1.5 rounded-lg font-semibold text-xs transition-all ${
                    paymentChoice === 'pay_now'
                      ? 'bg-emerald-600 text-white shadow-md'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Pay Now via Bank
                </button>
                <button
                  type="button"
                  onClick={() => setPaymentChoice('pay_later')}
                  className={`px-3 py-1.5 rounded-lg font-semibold text-xs transition-all ${
                    paymentChoice === 'pay_later'
                      ? 'bg-slate-800 text-amber-300 shadow-md'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Pay Later
                </button>
              </div>
            </div>

            {/* CHOICE A: PAY NOW VIA BANK (DETAILS DISPLAY) */}
            {paymentChoice === 'pay_now' && (
              <div className="space-y-4 pt-1 animate-fade-in">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-semibold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                    <Building2 className="w-3.5 h-3.5" />
                    Official JKIA Freight Bank Accounts
                  </span>
                  <span className="text-[10px] text-slate-500 font-mono">
                    Ref Code: <strong className="text-emerald-300">{shp.awbNumber}</strong>
                  </span>
                </div>

                {/* Bank Account Details Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  
                  {/* Account 1: USD Wire Account */}
                  <div className="bg-slate-900/90 p-3.5 rounded-xl border border-slate-800 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-white text-xs">KCB Bank Kenya Ltd</span>
                      <span className="px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] font-mono">
                        USD Account
                      </span>
                    </div>
                    <div className="space-y-1 font-mono text-[11px]">
                      <div className="text-slate-400 flex justify-between">
                        <span>Account Name:</span>
                        <span className="text-slate-200">AeroProduce Kenya Cargo</span>
                      </div>
                      <div className="text-slate-400 flex justify-between">
                        <span>Account No:</span>
                        <span className="text-white font-bold">1294 8839 2011</span>
                      </div>
                      <div className="text-slate-400 flex justify-between">
                        <span>SWIFT Code:</span>
                        <span className="text-slate-200">KCBLKENX</span>
                      </div>
                      <div className="text-slate-400 flex justify-between">
                        <span>Branch:</span>
                        <span className="text-slate-200">JKIA Cargo Terminal</span>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleCopy('KCB Bank Kenya | Acc: 1294 8839 2011 (USD) | SWIFT: KCBLKENX | Ref: ' + shp.awbNumber, 'KCB USD Wire Details')}
                      className="w-full mt-2 py-1 px-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white flex items-center justify-center gap-1 text-[11px] transition-all"
                    >
                      {copiedField === 'KCB USD Wire Details' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                      <span>{copiedField === 'KCB USD Wire Details' ? 'Copied Details!' : 'Copy USD Details'}</span>
                    </button>
                  </div>

                  {/* Account 2: KES Local / Paybill Account */}
                  <div className="bg-slate-900/90 p-3.5 rounded-xl border border-slate-800 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-white text-xs">Equity Bank Kenya</span>
                      <span className="px-1.5 py-0.5 rounded bg-sky-500/10 text-sky-400 border border-sky-500/20 text-[10px] font-mono">
                        KES / MPESA
                      </span>
                    </div>
                    <div className="space-y-1 font-mono text-[11px]">
                      <div className="text-slate-400 flex justify-between">
                        <span>Account Name:</span>
                        <span className="text-slate-200">AeroProduce Kenya Ltd</span>
                      </div>
                      <div className="text-slate-400 flex justify-between">
                        <span>Account No:</span>
                        <span className="text-white font-bold">0180 2938 4920 11</span>
                      </div>
                      <div className="text-slate-400 flex justify-between">
                        <span>MPESA Paybill:</span>
                        <span className="text-emerald-400 font-bold">247247</span>
                      </div>
                      <div className="text-slate-400 flex justify-between">
                        <span>Account Ref:</span>
                        <span className="text-white font-bold">{shp.awbNumber}</span>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleCopy('Equity Bank Kenya | Acc: 0180 2938 4920 11 (KES) | Paybill: 247247 | Ref: ' + shp.awbNumber, 'Equity KES / Paybill Details')}
                      className="w-full mt-2 py-1 px-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white flex items-center justify-center gap-1 text-[11px] transition-all"
                    >
                      {copiedField === 'Equity KES / Paybill Details' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                      <span>{copiedField === 'Equity KES / Paybill Details' ? 'Copied Details!' : 'Copy KES / Paybill'}</span>
                    </button>
                  </div>

                </div>

                {/* Form to submit confirmation */}
                <form onSubmit={handleConfirmBankPayment} className="pt-2 space-y-3">
                  <div>
                    <label className="block text-slate-300 font-medium mb-1">
                      Bank Transfer Reference / Transaction Code (Optional):
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. FT2609048821 or MPESA Code QHB87261"
                      value={bankRefInput}
                      onChange={(e) => setBankRefInput(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2 text-white font-mono placeholder:text-slate-600 focus:outline-none focus:border-emerald-500"
                    />
                  </div>

                  <div className="flex items-center justify-between gap-3 pt-1">
                    <button
                      type="button"
                      onClick={closeApprovalNotice}
                      className="px-4 py-2.5 rounded-xl border border-slate-700 hover:bg-slate-800 text-slate-300 text-xs font-semibold transition-all"
                    >
                      Dismiss & Pay Later
                    </button>
                    <button
                      type="submit"
                      disabled={isSubmittingPayment}
                      className="flex-1 px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs shadow-lg shadow-emerald-600/30 flex items-center justify-center gap-2 transition-all active:scale-98"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span>{isSubmittingPayment ? 'Recording Payment...' : 'I Have Paid via Bank Transfer'}</span>
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* CHOICE B: PAY LATER (BEFORE LOADING) */}
            {paymentChoice === 'pay_later' && (
              <div className="space-y-4 pt-1 animate-fade-in text-slate-300">
                <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 text-xs space-y-2">
                  <div className="flex items-center gap-2 text-amber-300 font-semibold">
                    <Clock className="w-4 h-4" />
                    <span>Advance Payment Commitment Timeline</span>
                  </div>
                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    You have chosen to pay later. Please ensure your bank transfer is executed and proof of payment sent to <strong>marvoodi@gmail.com</strong> at least <strong>24 hours prior to scheduled flight loading ({shp.flightDate})</strong>. Unfunded bookings cannot be accepted at the JKIA cold chain terminal.
                  </p>
                </div>

                <div className="flex items-center justify-between gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setPaymentChoice('pay_now')}
                    className="px-4 py-2.5 rounded-xl border border-slate-700 hover:bg-slate-800 text-slate-300 text-xs font-semibold transition-all"
                  >
                    Switch to Pay Now via Bank
                  </button>
                  <button
                    type="button"
                    onClick={handleConfirmPayLater}
                    className="flex-1 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-emerald-400 border border-emerald-500/30 font-bold text-xs transition-all text-center"
                  >
                    Acknowledge & Confirm Booking
                  </button>
                </div>
              </div>
            )}

          </div>

        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3 border-t border-slate-800/80 bg-slate-950/80 flex items-center justify-between text-[11px] text-slate-400">
          <div className="flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>JKIA Fresh Produce Cold Chain Hub • Guaranteed Space Policy</span>
          </div>
          <button
            onClick={closeApprovalNotice}
            className="text-slate-400 hover:text-white underline text-[11px]"
          >
            Close
          </button>
        </div>

      </div>
    </div>
  );
};
