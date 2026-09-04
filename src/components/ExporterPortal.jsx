import React, { useState } from 'react';
import { useRates } from '../context/RatesContext';
import { 
  Building2, 
  FileText, 
  ShieldCheck, 
  Box, 
  Award, 
  Upload, 
  Download, 
  Share2, 
  Plus, 
  CheckCircle2, 
  Clock, 
  Plane, 
  Trash2, 
  ExternalLink, 
  Copy, 
  Search, 
  Calendar, 
  Check, 
  ThermometerSnowflake,
  User,
  LogOut,
  Sparkles,
  Leaf,
  CreditCard
} from 'lucide-react';

export const ExporterPortal = () => {
  const { 
    currentUser, 
    setIsAuthModalOpen, 
    logout, 
    shipments, 
    uploadDocument, 
    deleteDocument, 
    createShipment,
    triggerApprovalNotice,
    rates, 
    profitMarginPerKg,
    currencyMode,
    exchangeRate,
    showNotification 
  } = useRates();

  const [activeShipmentId, setActiveShipmentId] = useState(shipments[0]?.id || null);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Document Upload State
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [docType, setDocType] = useState('kephis'); // 'awb' | 'kephis' | 'packing_list' | 'coo' | 'other'
  const [docName, setDocName] = useState('');
  const [docIssuer, setDocIssuer] = useState('');
  const [uploadedFile, setUploadedFile] = useState(null);

  // New Shipment Booking State
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
  const [newOrigin, setNewOrigin] = useState('NBO');
  const [newDest, setNewDest] = useState('AMS');
  const [newCommodity, setNewCommodity] = useState('avocados');
  const [newWeight, setNewWeight] = useState(1800);
  const [newCarrier, setNewCarrier] = useState('KQ');

  const [copiedLink, setCopiedLink] = useState(false);
  const [selectedDocPreview, setSelectedDocPreview] = useState(null);

  // Filter shipments for current user or all if admin
  const userShipments = shipments.filter(shp => {
    if (!currentUser) return true;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        shp.awbNumber.toLowerCase().includes(q) ||
        shp.destination.toLowerCase().includes(q) ||
        shp.commodityName.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const activeShipment = shipments.find(s => s.id === activeShipmentId) || shipments[0];

  const formatPrice = (usdVal) => {
    if (!usdVal && usdVal !== 0) return '-';
    if (currencyMode === 'KES') {
      return `KSh ${(usdVal * exchangeRate).toLocaleString('en-US', { maximumFractionDigits: 0 })}`;
    }
    return `$${Number(usdVal).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const handleUploadSubmit = (e) => {
    e.preventDefault();
    if (!activeShipment) return;

    let defaultName = docName;
    if (!defaultName) {
      if (docType === 'awb') defaultName = `Air Waybill (BL) - ${activeShipment.awbNumber}`;
      else if (docType === 'kephis') defaultName = `KEPHIS Phyto Certificate (#KE-2026-${Math.floor(1000 + Math.random() * 9000)})`;
      else if (docType === 'packing_list') defaultName = `Commercial Packing List (${activeShipment.grossWeight} KG)`;
      else if (docType === 'coo') defaultName = 'Certificate of Origin (EUR.1 / KNCCI)';
      else defaultName = 'Export Supporting Document';
    }

    uploadDocument(activeShipment.id, {
      type: docType,
      name: defaultName,
      fileName: uploadedFile ? uploadedFile.name : `${defaultName.replace(/\s+/g, '_')}.pdf`,
      fileSize: uploadedFile ? `${(uploadedFile.size / 1024).toFixed(0)} KB` : '420 KB',
      issuer: docIssuer || (currentUser?.companyName || 'Packhouse Operations')
    });

    setIsUploadModalOpen(false);
    setDocName('');
    setDocIssuer('');
    setUploadedFile(null);
  };

  const handleBookingSubmit = (e) => {
    e.preventDefault();
    const rateItem = rates.find(r => r.origin === newOrigin && r.destination === newDest && r.commodity === newCommodity) || rates[0];
    
    const newShp = createShipment({
      origin: newOrigin,
      destination: newDest,
      commodity: newCommodity,
      commodityName: newCommodity === 'avocados' ? 'Hass Avocados (Size 14-20)' : newCommodity === 'soya_beans' ? 'Fresh Soya & French Beans' : 'Fresh Chillies',
      airlineId: newCarrier,
      airlineName: newCarrier === 'KQ' ? 'Kenya Airways Cargo' : newCarrier === '8V' ? 'Astral Aviation' : 'Emirates SkyCargo',
      airlineCode: newCarrier,
      grossWeight: Number(newWeight),
      chargeableWeight: Number(newWeight),
      baseRatePerKg: rateItem.rate1000kg || 1.70,
      flightDate: '3 Days Ahead (Space Confirmed)'
    }, true);

    setIsBookingModalOpen(false);
    if (newShp?.id) {
      setActiveShipmentId(newShp.id);
    }
  };

  const handleShareBundle = (shp) => {
    const text = `📋 *AEROPRODUCE KENYA | EXPORT SHIPMENT DOCUMENTS* 📦\n` +
      `━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
      `✈️ *AWB / BL:* ${shp.awbNumber}\n` +
      `🏢 *Exporter:* ${shp.clientCompany}\n` +
      `📍 *Route:* ${shp.origin} ➔ ${shp.destination} (${shp.commodityName})\n` +
      `⚖️ *Weight:* ${shp.chargeableWeight} KG | *Carrier:* ${shp.airlineName}\n` +
      `━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
      `📂 *Attached Export Documents (${shp.documents.length}):*\n` +
      shp.documents.map((d, i) => ` ${i+1}. ${d.name} [Verified: ${d.issuer}]`).join('\n') +
      `\n\n🔗 *Live Document & Tracking Link:* http://localhost:5173/?awb=${shp.awbNumber}`;

    navigator.clipboard.writeText(text);
    setCopiedLink(shp.id);
    showNotification(`Documents for AWB ${shp.awbNumber} copied to clipboard!`);
    setTimeout(() => setCopiedLink(false), 3000);
  };

  const handleDownloadDoc = (doc) => {
    // Generate a downloadable text/mock PDF file
    const docContent = `AEROPRODUCE KENYA - OFFICIAL EXPORT DOCUMENT
=====================================================
Document Name: ${doc.name}
Document Type: ${doc.type.toUpperCase()}
Shipment AWB / BL: ${activeShipment?.awbNumber}
Exporter Company: ${activeShipment?.clientCompany}
Route: ${activeShipment?.origin} to ${activeShipment?.destination}
Commodity: ${activeShipment?.commodityName}
Weight: ${activeShipment?.grossWeight} KG
Issuer: ${doc.issuer}
Issued Date: ${doc.uploadedAt}
Status: VERIFIED & CLEARED FOR EXPORT
=====================================================
Kenya Plant Health Inspectorate Service (KEPHIS) & IATA Cargo Tariffs Compliant.`;

    const blob = new Blob([docContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = doc.fileName || `${doc.name}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showNotification(`Downloaded ${doc.name}!`);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Exporter Account Banner */}
      <div className="glass-panel p-6 rounded-3xl border border-emerald-500/30 mb-8 bg-gradient-to-r from-emerald-950/40 via-slate-900/90 to-slate-900/90 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none -z-10" />

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white text-2xl font-bold shadow-lg shadow-emerald-500/25 border border-emerald-400/40 shrink-0">
              <Building2 className="w-7 h-7" />
            </div>

            <div>
              <div className="flex flex-wrap items-center gap-2 mb-1">
                <h2 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight">
                  {currentUser?.companyName || 'Naivasha Fresh Green Ltd'}
                </h2>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3 text-emerald-400" />
                  Verified Exporter
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-y-1 gap-x-4 text-xs text-slate-300">
                <span>👤 Contact: <strong className="text-white">{currentUser?.name}</strong></span>
                <span>•</span>
                <span>📧 {currentUser?.email}</span>
                <span>•</span>
                <span className="font-mono text-emerald-400">HCDA: {currentUser?.hcdLicense}</span>
                <span>•</span>
                <span className="font-mono text-emerald-400">KEPHIS: {currentUser?.kephisReg}</span>
              </div>
            </div>
          </div>

          {/* Right Action Buttons */}
          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => setIsBookingModalOpen(true)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white text-xs sm:text-sm font-bold shadow-lg shadow-emerald-500/20 transition-all active:scale-95"
            >
              <Plus className="w-4 h-4" />
              Book New Shipment
            </button>

            <button
              onClick={() => setIsAuthModalOpen(true)}
              className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold border border-slate-700 transition-all flex items-center gap-1.5"
            >
              <User className="w-3.5 h-3.5" />
              Switch Account
            </button>
          </div>
        </div>
      </div>

      {/* Main Grid: Shipments List & Document Hub */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Shipment Selector */}
        <div className="lg:col-span-4 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Box className="w-4 h-4 text-emerald-400" />
              My Shipments ({userShipments.length})
            </h3>
            <span className="text-[11px] text-slate-400 font-mono">
              Live Air Waybills (BL)
            </span>
          </div>

          <div className="space-y-3 max-h-[700px] overflow-y-auto pr-1">
            {userShipments.map(shp => {
              const isSelected = activeShipment?.id === shp.id;
              return (
                <div
                  key={shp.id}
                  onClick={() => setActiveShipmentId(shp.id)}
                  className={`p-4 rounded-2xl border transition-all cursor-pointer relative overflow-hidden ${
                    isSelected
                      ? 'bg-slate-900 border-emerald-500 shadow-lg shadow-emerald-500/10'
                      : 'glass-panel border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="font-mono font-bold text-xs text-emerald-400">
                      AWB: {shp.awbNumber}
                    </span>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold bg-${shp.statusColor}-500/10 text-${shp.statusColor}-400 border border-${shp.statusColor}-500/20`}>
                      {shp.status}
                    </span>
                  </div>

                  <div className="text-sm font-bold text-white mb-1">
                    {shp.commodityName}
                  </div>

                  <div className="flex items-center justify-between text-xs text-slate-400">
                    <span className="font-mono">{shp.origin} ➔ {shp.destination} ({shp.airlineId})</span>
                    <span className="font-mono font-bold text-slate-200">{shp.chargeableWeight} KG</span>
                  </div>

                  <div className="mt-3 pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
                    <span>📄 {shp.documents.length} Documents Attached</span>
                    <span className="text-emerald-400 font-semibold">{formatPrice(shp.grandTotalUSD)}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column: Active Shipment Document Vault */}
        <div className="lg:col-span-8 space-y-6">
          {activeShipment ? (
            <div className="glass-panel p-6 rounded-3xl border border-slate-800 shadow-2xl space-y-6">
              {/* Shipment Header Details */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-800">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-extrabold text-white">
                      AWB #{activeShipment.awbNumber}
                    </h3>
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                      {activeShipment.status}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {activeShipment.commodityName} • Flight {activeShipment.flightNumber} ({activeShipment.airlineName})
                  </p>
                </div>

                {/* Actions */}
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    onClick={() => triggerApprovalNotice(activeShipment)}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs font-semibold transition-all shadow-sm"
                    title="View advance USD bank wire instructions and 3-day booking policy"
                  >
                    <CreditCard className="w-3.5 h-3.5 text-amber-400" />
                    <span>USD Bank Wire & Policy</span>
                  </button>

                  <button
                    onClick={() => setIsUploadModalOpen(true)}
                    className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-md transition-all active:scale-95"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    Upload Document
                  </button>

                  <button
                    onClick={() => handleShareBundle(activeShipment)}
                    className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold transition-all"
                  >
                    {copiedLink === activeShipment.id ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Share2 className="w-3.5 h-3.5 text-emerald-400" />}
                    {copiedLink === activeShipment.id ? 'Copied Bundle!' : 'Share Vault'}
                  </button>
                </div>
              </div>

              {/* Shipment KPI Badges */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs bg-slate-950/60 p-3.5 rounded-2xl border border-slate-800 font-mono">
                <div>
                  <span className="text-slate-500 block text-[10px]">Actual Weight:</span>
                  <span className="text-white font-bold text-sm">{activeShipment.grossWeight} KG</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px]">Quoted Selling Rate:</span>
                  <span className="text-emerald-400 font-bold text-sm">{formatPrice(activeShipment.quotedRatePerKg)} / kg</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px]">Total Landed Freight:</span>
                  <span className="text-white font-bold text-sm">{formatPrice(activeShipment.grandTotalUSD)}</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px]">Flight Date:</span>
                  <span className="text-sky-300 font-bold text-sm">{activeShipment.flightDate}</span>
                </div>
              </div>

              {/* Document Vault Grid */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-sm font-bold text-white flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-emerald-400" />
                    Verified Export Documents & Certificates ({activeShipment.documents.length})
                  </h4>
                  <span className="text-[11px] text-slate-400">
                    Click any document to preview or download
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {activeShipment.documents.map(doc => {
                    return (
                      <div
                        key={doc.id}
                        className="glass-card p-4 rounded-2xl border border-slate-800 hover:border-emerald-500/40 transition-all flex flex-col justify-between group"
                      >
                        <div className="flex items-start gap-3 mb-3">
                          <div className="p-2.5 rounded-xl bg-slate-800 text-emerald-400 border border-slate-700 shrink-0 group-hover:bg-emerald-500/20 transition-colors">
                            {doc.type === 'kephis' ? (
                              <ShieldCheck className="w-5 h-5 text-emerald-400" />
                            ) : doc.type === 'awb' ? (
                              <FileText className="w-5 h-5 text-sky-400" />
                            ) : doc.type === 'coo' ? (
                              <Award className="w-5 h-5 text-amber-400" />
                            ) : (
                              <Box className="w-5 h-5 text-teal-400" />
                            )}
                          </div>

                          <div className="min-w-0 flex-1">
                            <div className="flex items-center justify-between">
                              <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400">
                                {doc.type.toUpperCase()}
                              </span>
                              {doc.verified && (
                                <span className="text-[10px] text-emerald-400 font-semibold flex items-center gap-0.5">
                                  <CheckCircle2 className="w-3 h-3" /> Verified
                                </span>
                              )}
                            </div>
                            <h5 className="font-bold text-sm text-white truncate mt-0.5">{doc.name}</h5>
                            <p className="text-[11px] text-slate-400 truncate mt-0.5">
                              Issued by: {doc.issuer}
                            </p>
                          </div>
                        </div>

                        {/* File Details & Download */}
                        <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs">
                          <span className="text-[10px] font-mono text-slate-500">
                            {doc.fileSize} • {doc.uploadedAt}
                          </span>

                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleDownloadDoc(doc)}
                              className="flex items-center gap-1 text-emerald-400 hover:text-emerald-300 font-semibold text-[11px] bg-emerald-500/10 hover:bg-emerald-500/20 px-2.5 py-1 rounded-lg border border-emerald-500/20 transition-all"
                            >
                              <Download className="w-3 h-3" /> Download
                            </button>

                            <button
                              onClick={() => deleteDocument(activeShipment.id, doc.id)}
                              className="p-1 text-slate-500 hover:text-rose-400"
                              title="Delete document"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          ) : (
            <div className="glass-panel p-12 rounded-3xl border border-slate-800 text-center">
              <Box className="w-12 h-12 text-slate-600 mx-auto mb-3" />
              <h4 className="text-base font-bold text-white">No Shipments Found</h4>
              <p className="text-xs text-slate-400 mt-1">
                Book your first air cargo produce shipment to generate Air Waybills, KEPHIS certificates, and packing lists.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* MODAL 1: Upload Document Modal */}
      {isUploadModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
          <div className="glass-panel w-full max-w-lg rounded-3xl border border-slate-700 shadow-2xl overflow-hidden bg-slate-950">
            <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-slate-900/90">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  <Upload className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-white text-base">Upload Export Document</h3>
                  <p className="text-[11px] text-slate-400">
                    Attach BL, KEPHIS, Packing List, or Phytosanitary records to AWB #{activeShipment?.awbNumber}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsUploadModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
              >
                <Trash2 className="w-4 h-4 hidden" />
                ✕
              </button>
            </div>

            <form onSubmit={handleUploadSubmit} className="p-6 space-y-4 text-xs">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Document Category *</label>
                <select
                  value={docType}
                  onChange={(e) => setDocType(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-white focus:border-emerald-500"
                >
                  <option value="awb">📄 Air Waybill / Bill of Lading (BL)</option>
                  <option value="kephis">🌿 KEPHIS Phytosanitary Certificate</option>
                  <option value="packing_list">📦 Commercial Packing List & Weight Certificate</option>
                  <option value="coo">🌍 Certificate of Origin (EUR.1 / COMESA)</option>
                  <option value="cooling">❄️ Temperature Pre-Cooling Log Sheet</option>
                  <option value="other">📎 Other Export Compliance Document</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Custom Document Title (Optional)</label>
                <input
                  type="text"
                  value={docName}
                  onChange={(e) => setDocName(e.target.value)}
                  placeholder="e.g. KEPHIS Avocado Phytosanitary #KE-9912"
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-white focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Issuing Authority / Agency</label>
                <input
                  type="text"
                  value={docIssuer}
                  onChange={(e) => setDocIssuer(e.target.value)}
                  placeholder="e.g. KEPHIS JKIA / Kenya Airways Cargo"
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-white focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Select File (PDF, JPEG, PNG)</label>
                <input
                  type="file"
                  onChange={(e) => setUploadedFile(e.target.files[0])}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2 text-slate-300 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-emerald-600 file:text-white hover:file:bg-emerald-500 cursor-pointer"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsUploadModalOpen(false)}
                  className="px-4 py-2 bg-slate-800 text-slate-300 rounded-xl font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl shadow-lg"
                >
                  Save & Attach Document
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: Book New Produce Shipment */}
      {isBookingModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
          <div className="glass-panel w-full max-w-lg rounded-3xl border border-slate-700 shadow-2xl overflow-hidden bg-slate-950">
            <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-slate-900/90">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  <Plane className="w-5 h-5 -rotate-45" />
                </div>
                <div>
                  <h3 className="font-bold text-white text-base">Book Produce Air Cargo Space</h3>
                  <p className="text-[11px] text-slate-400">
                    Instantly generates Air Waybill (BL) draft and packing list record
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsBookingModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleBookingSubmit} className="p-6 space-y-4 text-xs">
              {/* 3 Days Advance Quote Notice Banner */}
              <div className="p-3 rounded-xl bg-sky-950/40 border border-sky-500/30 flex items-start gap-2.5 text-[11px] text-sky-200">
                <Calendar className="w-4 h-4 text-sky-400 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold text-white block">3-Day Advance Quoting Policy:</span>
                  Please request quotes and confirm bookings at least 3 days in advance to be assured of flight space. All payments must be completed in advance via USD bank wire prior to cold-store intake.
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Departure</label>
                  <select
                    value={newOrigin}
                    onChange={(e) => setNewOrigin(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-white"
                  >
                    <option value="NBO">Nairobi (JKIA - NBO)</option>
                    <option value="MBA">Mombasa (MBA)</option>
                    <option value="EDL">Eldoret (EDL)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Destination</label>
                  <select
                    value={newDest}
                    onChange={(e) => setNewDest(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-white"
                  >
                    <option value="AMS">Amsterdam, Netherlands (AMS)</option>
                    <option value="LHR">London Heathrow, UK (LHR)</option>
                    <option value="FRA">Frankfurt, Germany (FRA)</option>
                    <option value="BRU">Brussels, Belgium (BRU)</option>
                    <option value="DXB">Dubai, UAE (DXB)</option>
                    <option value="JED">Jeddah, Saudi Arabia (JED)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Produce Commodity</label>
                  <select
                    value={newCommodity}
                    onChange={(e) => setNewCommodity(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-white"
                  >
                    <option value="avocados">🥑 Fresh Avocados</option>
                    <option value="soya_beans">🫘 Soya Beans & Legumes</option>
                    <option value="chillies">🌶️ Fresh Chillies</option>
                    <option value="herbs_veg">🌿 Fresh Herbs & Vegetables</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Preferred Carrier</label>
                  <select
                    value={newCarrier}
                    onChange={(e) => setNewCarrier(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-white"
                  >
                    <option value="KQ">Kenya Airways Cargo (KQ)</option>
                    <option value="8V">Astral Aviation (8V)</option>
                    <option value="EK">Emirates SkyCargo (EK)</option>
                    <option value="ET">Ethiopian Cargo (ET)</option>
                    <option value="QR">Qatar Airways Cargo (QR)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Total Cargo Weight (KG)</label>
                <input
                  type="number"
                  min="100"
                  step="50"
                  value={newWeight}
                  onChange={(e) => setNewWeight(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-white font-mono text-sm focus:border-emerald-500"
                />
              </div>

              <div className="p-3 bg-slate-900/80 rounded-xl border border-slate-800 text-slate-300 space-y-1 text-[11px]">
                <div className="flex justify-between">
                  <span>Base Airline Rate:</span>
                  <span className="font-mono text-white">$1.70 / kg</span>
                </div>
                <div className="flex justify-between">
                  <span>Service & Freight Margin:</span>
                  <span className="font-mono text-emerald-400 font-bold">+${profitMarginPerKg.toFixed(2)} / kg</span>
                </div>
                <div className="flex justify-between pt-1 border-t border-slate-800 font-bold text-emerald-400">
                  <span>Quoted Selling Rate:</span>
                  <span className="font-mono">${(1.70 + profitMarginPerKg).toFixed(2)} / kg</span>
                </div>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsBookingModalOpen(false)}
                  className="px-4 py-2 bg-slate-800 text-slate-300 rounded-xl font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl shadow-lg"
                >
                  Confirm Booking & Issue AWB Draft
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
