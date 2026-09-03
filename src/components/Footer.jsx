import React from 'react';
import { Plane, ShieldCheck, HelpCircle, Mail, Phone, ExternalLink, Leaf } from 'lucide-react';

export const Footer = () => {
  return (
    <footer className="border-t border-slate-800/80 bg-slate-950 pt-12 pb-8 text-xs text-slate-400">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          {/* Col 1 */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <div className="h-7 w-7 rounded-lg bg-emerald-500 flex items-center justify-center text-white">
                <Plane className="w-4 h-4 -rotate-45" />
              </div>
              <span className="font-extrabold text-white text-base">
                AeroProduce <span className="text-emerald-400">Kenya</span>
              </span>
            </div>
            <p className="text-slate-400 leading-relaxed text-[11px]">
              Kenya's dedicated fresh produce air cargo intelligence platform. Tracking daily freight rates (USD/kg) for Avocados, Soya Beans, Chillies, and Horticulture exports connecting Nairobi (JKIA) to global markets.
            </p>
          </div>

          {/* Col 2: Key Produce Routes */}
          <div>
            <h5 className="font-bold text-white mb-3 uppercase tracking-wider text-[11px]">Fresh Produce Export Lanes</h5>
            <ul className="space-y-1.5 text-[11px]">
              <li>NBO ➔ AMS (Amsterdam) - Avocados & Soya Beans</li>
              <li>NBO ➔ LHR (London Heathrow) - Chillies & Beans</li>
              <li>NBO ➔ DXB (Dubai) - Avocados & Hot Chillies</li>
              <li>NBO ➔ FRA (Frankfurt) - French Beans & Legumes</li>
              <li>NBO ➔ JED/RUH (Saudi Arabia) - Produce & Fruits</li>
            </ul>
          </div>

          {/* Col 3: Monitored Airlines */}
          <div>
            <h5 className="font-bold text-white mb-3 uppercase tracking-wider text-[11px]">Produce Reefer Carriers</h5>
            <div className="grid grid-cols-2 gap-1.5 text-[11px]">
              <span>• Kenya Airways Cargo</span>
              <span>• Astral Aviation</span>
              <span>• Ethiopian Cargo</span>
              <span>• Emirates SkyCargo</span>
              <span>• Qatar Cargo</span>
              <span>• Saudia Cargo</span>
              <span>• Lufthansa Cargo</span>
              <span>• Turkish Cargo</span>
            </div>
          </div>

          {/* Col 4: Contact & KEPHIS info */}
          <div>
            <h5 className="font-bold text-white mb-3 uppercase tracking-wider text-[11px]">JKIA Produce Desk</h5>
            <p className="text-[11px] text-slate-400 mb-2">
              Rates updated daily. Pre-cooling certification & KEPHIS phytosanitary clearance required at cargo terminal intake.
            </p>
            <div className="text-[11px] space-y-1 text-slate-300">
              <div className="flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 text-emerald-400" /> produce@aerofreight.co.ke
              </div>
              <div className="flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5 text-emerald-400" /> +254 (0) 20 661 2000
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-6 border-t border-slate-900 flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-slate-500">
          <div>
            © {new Date().getFullYear()} AeroProduce Kenya. Exclusively tracking fresh produce air freight rates in USD per KG.
          </div>
          <div className="flex items-center gap-4">
            <span className="text-emerald-400 flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5" /> KEPHIS & IATA Perishables Standards
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
};
