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
  DollarSign
} from 'lucide-react';

export const OrderApprovalModal = () => {
  const { 
    approvalPromptShipment, 
    isApprovalModalOpen, 
    closeApprovalNotice, 
    recordBankPayment, 
    showNotification 
  } = useRates();

  const [bankRefInput, setBankRefInput] = useState('');
  const [copiedField, setCopiedField] = useState(null);
  const [isSubmittingPayment, setIsSubmittingPayment] = useState(false);

  if (!isApprovalModalOpen || !approvalPromptShipment) {
    return null;
  }

  const shp = approvalPromptShipment;

  const formatUSD = (amount) => {
    return `$${Number(amount || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USD`;
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
      recordBankPayment(shp.id, bankRefInput.trim() || `USD-WIRE-${shp.awbNumber}`);
      setIsSubmittingPayment(false);
      closeApprovalNotice();
    }, 400);
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

        <div className="p-6 space-y-5 max-h-[78vh] overflow-y-auto text-xs pr-2">

          {/* Quick Shipment Summary Strip in USD */}
          <div className="bg-slate-950/70 p-4 rounded-2xl border border-slate-800 grid grid-cols-2 sm:grid-cols-4 gap-3 font-mono">
            <div>
              <span className="text-slate-500 block text-[10px]">Chargeable Weight</span>
              <span className="text-white font-bold text-sm">{shp.chargeableWeight?.toLocaleString()} KG</span>
              <span className="text-[10px] text-slate-400 block font-normal">({(shp.chargeableWeight / 1000).toFixed(2)} Metric Tons)</span>
            </div>
            <div>
              <span className="text-slate-500 block text-[10px]">Quoted Rate / MT</span>
              <span className="text-emerald-400 font-bold text-sm">{formatUSD(shp.quotedRatePerKg * 1000)}/MT</span>
              <span className="text-[10px] text-emerald-300/80 block font-normal">{formatUSD(shp.quotedRatePerKg)}/KG • Bulk Rate</span>
            </div>
            <div>
              <span className="text-slate-500 block text-[10px]">Flight Departure</span>
              <span className="text-teal-300 font-bold text-sm">{shp.flightDate}</span>
              <span className="text-[10px] text-sky-400 block font-normal">Space Pre-Reserved</span>
            </div>
            <div>
              <span className="text-slate-500 block text-[10px]">Total Due (USD)</span>
              <span className="text-emerald-300 font-bold text-sm">{formatUSD(shp.grandTotalUSD)}</span>
              <span className="text-[10px] text-slate-400 block font-normal">Advance Wire Required</span>
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
                  Please note that fresh produce cargo space out of <strong>JKIA Nairobi (NBO)</strong> is allocated on a strictly scheduled basis with partner airlines. Exporters must <strong className="text-sky-300">request quotes and confirm bookings at least 3 days in advance</strong> to be assured of booking space and cold-chain intake during peak export seasons.
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
                  Please note that <strong className="text-amber-300">payments should be done in advance</strong>. All freight charges must be cleared via bank transfer prior to cargo acceptance at the JKIA perishable cold-store and before original Air Waybills (BL) are released for export customs.
                </p>
              </div>
            </div>
          </div>

          {/* USD BANK TRANSFER PAYMENT SECTION */}
          <div className="bg-slate-950/90 p-5 rounded-2xl border border-slate-800 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
              <div>
                <div className="text-sm font-bold text-white flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-emerald-400" />
                  <span>Advance Payment via Bank (USD Only)</span>
                </div>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Payments are accepted strictly in USD via bank wire transfer to our JKIA freight account.
                </p>
              </div>

              <span className="px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-300 border border-emerald-500/30 text-[10px] font-mono font-bold shrink-0 self-start sm:self-center">
                USD BANK WIRE ONLY
              </span>
            </div>

            {/* Official USD Bank Wire Account Card */}
            <div className="bg-slate-900/95 p-4 rounded-2xl border border-emerald-500/30 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-emerald-400" />
                  <span className="font-bold text-white text-sm">KCB Bank Kenya Ltd</span>
                </div>
                <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] font-mono font-bold">
                  Official USD Account
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 font-mono text-[11px] bg-slate-950/80 p-3.5 rounded-xl border border-slate-800">
                <div>
                  <span className="text-slate-500 block text-[10px]">Beneficiary Name:</span>
                  <span className="text-white font-bold">AeroProduce Kenya Cargo</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px]">USD Account Number:</span>
                  <span className="text-emerald-400 font-extrabold text-sm">1294 8839 2011</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px]">SWIFT / BIC Code:</span>
                  <span className="text-teal-300 font-bold">KCBLKENX</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px]">Branch:</span>
                  <span className="text-slate-300">JKIA Cargo Terminal, Nairobi</span>
                </div>
                <div className="sm:col-span-2 pt-2 border-t border-slate-800/80 flex flex-wrap justify-between items-center gap-1">
                  <div>
                    <span className="text-slate-500 block text-[10px]">Payment Reference / Remittance Code:</span>
                    <span className="text-amber-300 font-bold text-xs">{shp.awbNumber}</span>
                  </div>
                  <span className="text-[10px] text-slate-400 italic">Mandatory for wire matching</span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => handleCopy('KCB Bank Kenya Ltd | USD Account: 1294 8839 2011 | SWIFT: KCBLKENX | Branch: JKIA Cargo Terminal | Reference: ' + shp.awbNumber, 'KCB USD Wire Details')}
                className="w-full py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white flex items-center justify-center gap-1.5 text-xs font-semibold transition-all border border-slate-700 active:scale-98"
              >
                {copiedField === 'KCB USD Wire Details' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedField === 'KCB USD Wire Details' ? 'Copied USD Wire Details!' : 'Copy USD Bank Wire Details'}</span>
              </button>
            </div>

            {/* Form to submit USD wire confirmation */}
            <form onSubmit={handleConfirmBankPayment} className="pt-1 space-y-3">
              <div>
                <label className="block text-slate-300 font-medium mb-1">
                  USD Bank Wire Reference / Swift MT103 Code (Optional):
                </label>
                <input
                  type="text"
                  placeholder="e.g. FT2609048821 or Bank Wire Swift Ref"
                  value={bankRefInput}
                  onChange={(e) => setBankRefInput(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-white font-mono placeholder:text-slate-600 focus:outline-none focus:border-emerald-500 text-xs"
                />
              </div>

              <div className="flex items-center justify-between gap-3 pt-1">
                <button
                  type="button"
                  onClick={closeApprovalNotice}
                  className="px-4 py-2.5 rounded-xl border border-slate-700 hover:bg-slate-800 text-slate-400 hover:text-white text-xs font-semibold transition-all"
                >
                  Close
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingPayment}
                  className="flex-1 px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs shadow-lg shadow-emerald-600/30 flex items-center justify-center gap-2 transition-all active:scale-98"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{isSubmittingPayment ? 'Recording Wire...' : 'Confirm USD Bank Transfer Sent'}</span>
                </button>
              </div>
            </form>

          </div>

        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3 border-t border-slate-800/80 bg-slate-950/80 flex items-center justify-between text-[11px] text-slate-400">
          <div className="flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>JKIA Fresh Produce Cold Chain Hub • 3 Days Advance Quote Policy</span>
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
