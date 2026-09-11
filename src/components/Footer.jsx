import React from 'react';
import spedireLogo from '../assets/spedire-logo.jpg';
import { Plane, ShieldCheck, HelpCircle, Mail, Phone, ExternalLink, Leaf } from 'lucide-react';

export const Footer = () => {
  return (
    <footer className="border-t border-slate-800/80 bg-slate-950 pt-12 pb-8 text-xs text-slate-400">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          {/* Col 1 */}
          <div className="space-y-3">
            <a href="/" className="flex items-center gap-2.5 group">
              <img 
                src={spedireLogo} 
                alt="Spedire Logo" 
                className="h-8 w-8 rounded-lg object-cover border border-emerald-500/30 group-hover:border-emerald-400 transition-all" 
              />
              <span className="font-extrabold text-white text-base">
                Spedire <span className="text-emerald-400">Kenya</span>
              </span>
            </a>
            <p className="text-slate-400 leading-relaxed text-[11px]">
              Kenya's premier fresh produce and meat air cargo booking & intelligence platform. Tracking daily freight rates (USD/kg) for Passion Fruit, Avocados, Mangoes, Chillies, Herbs, Pineapples, and Meat Exports connecting Nairobi (JKIA) to global destinations.
            </p>
          </div>

          {/* Col 2: Key Produce & Meat Routes */}
          <div>
            <h5 className="font-bold text-white mb-3 uppercase tracking-wider text-[11px]">Key Export Corridors</h5>
            <ul className="space-y-1.5 text-[11px]">
              <li>NBO ➔ KWI (Kuwait) - Solit Air Direct Fresh Cargo</li>
              <li>NBO ➔ MCT (Muscat, Oman) - Fresh Produce & Meat</li>
              <li>NBO ➔ DXB (Dubai) - Avocados & Chillies</li>
              <li>NBO ➔ AMS (Amsterdam) - Passion Fruit & Herbs</li>
              <li>NBO ➔ JED/RUH (Saudi) - Chilled Halal Meat & Produce</li>
            </ul>
          </div>

          {/* Col 3: Monitored 12 Airlines */}
          <div>
            <h5 className="font-bold text-white mb-3 uppercase tracking-wider text-[11px]">Supported 12 Airlines</h5>
            <div className="grid grid-cols-2 gap-1.5 text-[11px]">
              <span>• Qatar Airways Cargo</span>
              <span>• Kenya Airways Cargo</span>
              <span>• Emirates SkyCargo</span>
              <span>• Saudia Cargo</span>
              <span>• KLM Cargo</span>
              <span>• Air France Cargo</span>
              <span>• Air India Cargo</span>
              <span>• Ethiopian Cargo</span>
              <span>• Brussels Airlines</span>
              <span>• Solit Air Cargo</span>
              <span>• FedEx Express</span>
              <span>• DHL Aviation</span>
            </div>
          </div>

          {/* Col 4: Contact & Verification info */}
          <div>
            <h5 className="font-bold text-white mb-3 uppercase tracking-wider text-[11px]">Spedire Cargo Desk</h5>
            <p className="text-[11px] text-slate-400 mb-2">
              Rates verified daily. Pre-cooling certification, KEPHIS inspection & veterinary clearance ready at JKIA cargo terminal.
            </p>
            <div className="text-[11px] space-y-1 text-slate-300">
              <div className="flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 text-emerald-400" /> cargo@spedire.co.ke
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
            © {new Date().getFullYear()} Spedire Kenya. Fresh produce & meat air freight logistics and space booking platform.
          </div>
          <div className="flex items-center gap-4">
            <span className="text-emerald-400 flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5" /> KEPHIS, HCDA & IATA Perishables Standards
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
};
