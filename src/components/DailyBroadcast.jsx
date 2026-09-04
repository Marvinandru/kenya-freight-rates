import React, { useState } from 'react';
import { useRates } from '../context/RatesContext';
import { 
  Share2, 
  Copy, 
  Check, 
  Printer, 
  Send, 
  Download, 
  Sparkles, 
  Plane, 
  FileText, 
  Calendar, 
  Layers,
  Leaf,
  RefreshCw,
  Clock
} from 'lucide-react';

export const DailyBroadcast = () => {
  const { rates, lastUpdated, refreshToToday, isRefreshing, airlines, airports, commodities, showNotification } = useRates();
  const [copiedWhatsApp, setCopiedWhatsApp] = useState(false);
  const [broadcastCategory, setBroadcastCategory] = useState('avocados'); // 'avocados' | 'soya_beans' | 'chillies' | 'all'

  // Generate WhatsApp / Telegram broadcast text
  const generateBroadcastText = () => {
    let filtered = rates;
    if (broadcastCategory === 'avocados') {
      filtered = rates.filter(r => r.commodity === 'avocados');
    } else if (broadcastCategory === 'soya_beans') {
      filtered = rates.filter(r => r.commodity === 'soya_beans');
    } else if (broadcastCategory === 'chillies') {
      filtered = rates.filter(r => r.commodity === 'chillies');
    }

    let text = `🥑 *AEROPRODUCE KENYA | DAILY FRESH PRODUCE BULLETIN* 🇰🇪\n`;
    text += `📅 *Date:* ${lastUpdated}\n`;
    text += `📍 *Origin:* Nairobi JKIA Cargo Hub (NBO)\n`;
    text += `🌱 *Category:* ${broadcastCategory.toUpperCase().replace('_', ' ')} AIR FREIGHT SPOT RATES\n`;
    text += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n`;

    // Group by destination
    const grouped = {};
    filtered.forEach(r => {
      const dest = airports[r.destination]?.city || r.destination;
      const key = `${r.destination} - ${dest}`;
      if (!grouped[key]) grouped[key] = [];
      grouped[key].push(r);
    });

    Object.entries(grouped).forEach(([destHeader, items]) => {
      text += `📍 *DESTINATION: ${destHeader}*\n`;
      items.forEach(item => {
        const airline = airlines.find(a => a.id === item.airlineId)?.name || item.airlineId;
        const trend = item.changeDirection === 'down' ? '🟢 (Down)' : item.changeDirection === 'up' ? '🔴 (Up)' : '⚪';
        const allIn = ((item.rate1000kg || 0) + (item.fuelSurcharge || 0) + (item.secSurcharge || 0) + (item.handlingFee || 0)).toFixed(2);
        
        text += `• *${airline}* (${item.airlineId})\n`;
        text += `  └ Base (+1000kg): *$${item.rate1000kg.toFixed(2)}/kg* ${trend}\n`;
        text += `  └ All-In Landed: *$${allIn}/kg* | ${item.transitTime}\n`;
      });
      text += `\n`;
    });

    text += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`;
    text += `🌿 *Cold Chain:* Target +4°C (Avocados) | +8°C (Chillies)\n`;
    text += `📑 *KEPHIS & EU FCM:* Pre-clearance ready at JKIA\n`;
    text += `📞 *Produce Export Bookings:* Contact JKIA Fresh Desk\n`;
    text += `🔗 *Live Rate Dashboard:* AeroProduce Kenya`;

    return text;
  };

  const handleCopyWhatsApp = () => {
    const text = generateBroadcastText();
    navigator.clipboard.writeText(text);
    setCopiedWhatsApp(true);
    showNotification('WhatsApp Fresh Produce Rate Sheet copied to clipboard!');
    setTimeout(() => setCopiedWhatsApp(false), 3000);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold mb-2">
            <Share2 className="w-3.5 h-3.5" />
            <span>Produce Exporters Multi-Channel Broadcast</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Daily Produce Broadcast & Printable Rate Card
          </h2>
          <p className="text-xs sm:text-sm text-slate-300 mt-1">
            Share daily avocado, soya beans & chilli spot rates directly to farmer WhatsApp groups or print official rate cards.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleCopyWhatsApp}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs sm:text-sm font-bold shadow-lg shadow-emerald-600/20 transition-all active:scale-95"
          >
            {copiedWhatsApp ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            {copiedWhatsApp ? 'Copied WhatsApp Text!' : 'Copy WhatsApp Digest'}
          </button>

          <button
            onClick={handlePrint}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs sm:text-sm font-bold transition-all"
          >
            <Printer className="w-4 h-4 text-emerald-400" />
            Print / PDF Rate Sheet
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left: WhatsApp Preview & Filter */}
        <div className="lg:col-span-6 space-y-4">
          <div className="glass-panel p-6 rounded-2xl border border-slate-800 shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Send className="w-4 h-4 text-emerald-400" />
                WhatsApp / Telegram Produce Bulletin Preview
              </h3>

              {/* Controls */}
              <div className="flex items-center gap-2">
                <select
                  value={broadcastCategory}
                  onChange={(e) => setBroadcastCategory(e.target.value)}
                  className="bg-slate-900 border border-slate-700 text-xs text-slate-200 rounded-lg px-2.5 py-1.5 focus:outline-none"
                >
                  <option value="avocados">🥑 Fresh Avocados</option>
                  <option value="soya_beans">🫘 Soya Beans & Legumes</option>
                  <option value="chillies">🌶️ Fresh Chillies</option>
                  <option value="all">🌍 All Fresh Produce Lanes</option>
                </select>

                <button
                  onClick={() => refreshToToday(true)}
                  title="Click to refresh to today's date"
                  aria-label="Refresh to today's date"
                  className="flex items-center gap-1.5 bg-slate-900 hover:bg-slate-800 border border-slate-700 text-emerald-400 hover:text-white text-xs rounded-lg px-2.5 py-1.5 transition-all group"
                >
                  <RefreshCw className={`w-3 h-3 transition-transform duration-500 ${isRefreshing ? 'animate-spin text-emerald-300' : 'group-hover:rotate-180'}`} />
                  <span className="hidden sm:inline font-medium">Refresh Date</span>
                </button>
              </div>
            </div>

            {/* Mock WhatsApp Chat Bubble */}
            <div className="bg-slate-950 p-4 rounded-2xl border border-emerald-500/20 font-mono text-xs text-slate-200 whitespace-pre-wrap max-h-[500px] overflow-y-auto leading-relaxed selection:bg-emerald-500 selection:text-white">
              {generateBroadcastText()}
            </div>

            <div className="mt-4 flex items-center justify-between text-xs text-slate-400">
              <span>Ready for Kenya Fresh Produce Outgrower & Exporter groups.</span>
              <button
                onClick={handleCopyWhatsApp}
                className="text-emerald-400 hover:underline font-semibold"
              >
                Copy to Clipboard ➔
              </button>
            </div>
          </div>
        </div>

        {/* Right: Printable Official Rate Sheet View */}
        <div className="lg:col-span-6 space-y-4">
          <div className="glass-panel p-6 rounded-2xl border border-slate-800 shadow-xl" id="printable-rate-sheet">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  <Leaf className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-extrabold text-sm text-white">AeroProduce Kenya Rate Card</h4>
                  <p className="text-[11px] text-slate-400">JKIA Nairobi Fresh Produce Terminal</p>
                </div>
              </div>
              <div className="text-right text-[11px] font-mono text-slate-400">
                <span className="text-emerald-400 font-bold block">VALID TODAY</span>
                <div className="flex items-center justify-end gap-1.5 mt-0.5">
                  <span className="text-slate-200">{lastUpdated}</span>
                  <button
                    onClick={() => refreshToToday(true)}
                    title="Click to refresh to today's date"
                    aria-label="Refresh to today's date"
                    className="inline-flex items-center justify-center p-1 rounded text-emerald-400 hover:text-white hover:bg-emerald-500/20 active:scale-90 transition-all group focus:outline-none focus:ring-1 focus:ring-emerald-400"
                  >
                    <RefreshCw className={`w-3 h-3 transition-transform duration-500 ${isRefreshing ? 'animate-spin text-emerald-300' : 'group-hover:rotate-180'}`} />
                  </button>
                </div>
              </div>
            </div>

            {/* Quick Summary Grid */}
            <div className="mt-4 space-y-3 max-h-[460px] overflow-y-auto pr-1">
              {rates.slice(0, 8).map(item => {
                const airline = airlines.find(a => a.id === item.airlineId);
                const dest = airports[item.destination];
                const comm = commodities.find(c => c.id === item.commodity);
                const allIn = ((item.rate1000kg || 0) + (item.fuelSurcharge || 0) + (item.secSurcharge || 0) + (item.handlingFee || 0)).toFixed(2);

                return (
                  <div key={item.id} className="p-3 rounded-xl bg-slate-900/70 border border-slate-800/80 flex items-center justify-between text-xs">
                    <div>
                      <div className="font-bold text-white flex items-center gap-1.5">
                        <span>{airline?.name}</span>
                        <span className="font-mono text-emerald-400">({item.origin}➔{item.destination})</span>
                      </div>
                      <div className="text-[10px] text-slate-400 mt-0.5">
                        {dest?.city} • {comm?.name.split(' (')[0]} • {item.transitTime}
                      </div>
                    </div>

                    <div className="text-right font-mono">
                      <div className="font-extrabold text-emerald-400">${item.rate1000kg.toFixed(2)}/kg</div>
                      <div className="text-[10px] text-teal-300">All-In: ${allIn}</div>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between text-[11px] text-slate-500">
              <span>Horticulture Surcharges Apply • Subject to Reefer Space</span>
              <button onClick={handlePrint} className="text-emerald-400 hover:underline font-semibold flex items-center gap-1">
                <Printer className="w-3.5 h-3.5" /> Print Full Produce Document
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
