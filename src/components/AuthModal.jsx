import React, { useState } from 'react';
import { useRates } from '../context/RatesContext';
import { 
  X, 
  UserPlus, 
  LogIn, 
  Building2, 
  Mail, 
  Phone, 
  ShieldCheck, 
  FileText, 
  CheckCircle2,
  Sparkles,
  Leaf
} from 'lucide-react';

export const AuthModal = () => {
  const { 
    isAuthModalOpen, 
    setIsAuthModalOpen, 
    authMode, 
    setAuthMode, 
    login, 
    signup, 
    clients, 
    setCurrentUser 
  } = useRates();

  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [phone, setPhone] = useState('+254 7');
  const [hcdLicense, setHcdLicense] = useState('');
  const [kephisReg, setKephisReg] = useState('');
  const [location, setLocation] = useState('Nairobi, Kenya');

  if (!isAuthModalOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (authMode === 'login') {
      if (!email.trim()) {
        alert('Please enter your email address');
        return;
      }
      login(email);
    } else {
      if (!email.trim() || !companyName.trim()) {
        alert('Please fill in required fields (Company Name and Email)');
        return;
      }
      signup({ name, companyName, email, phone, hcdLicense, kephisReg, location });
    }
  };

  const handleQuickLogin = (client) => {
    setCurrentUser(client);
    setIsAuthModalOpen(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div className="glass-panel w-full max-w-md rounded-3xl border border-slate-700 shadow-2xl overflow-hidden bg-slate-950">
        {/* Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-slate-900/90">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
              <Leaf className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-white text-base">
                {authMode === 'login' ? 'Exporter Sign In' : 'Create Exporter Account'}
              </h3>
              <p className="text-[11px] text-slate-400">
                Access your Air Waybills (BL), KEPHIS certificates & Packing lists
              </p>
            </div>
          </div>
          <button
            onClick={() => setIsAuthModalOpen(false)}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Toggle */}
        <div className="grid grid-cols-2 p-1.5 bg-slate-900 border-b border-slate-800 text-xs font-semibold">
          <button
            onClick={() => setAuthMode('login')}
            className={`py-2 rounded-xl transition-all ${
              authMode === 'login'
                ? 'bg-emerald-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Sign In to Portal
          </button>
          <button
            onClick={() => setAuthMode('signup')}
            className={`py-2 rounded-xl transition-all ${
              authMode === 'signup'
                ? 'bg-emerald-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            New Exporter Register
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
          {authMode === 'signup' && (
            <>
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Company / Farm Packhouse Name *</label>
                <div className="relative">
                  <Building2 className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    placeholder="e.g. Naivasha Green Valley Exporters Ltd"
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl pl-9 pr-3 py-2 text-white placeholder-slate-500 focus:border-emerald-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Contact Person Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Marvin Andrew"
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white placeholder-slate-500 focus:border-emerald-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-400 text-[11px] mb-1">HCDA License No.</label>
                  <input
                    type="text"
                    value={hcdLicense}
                    onChange={(e) => setHcdLicense(e.target.value)}
                    placeholder="HCDA-EXP-2026"
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-1.5 text-white font-mono text-[11px] focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 text-[11px] mb-1">KEPHIS Reg No.</label>
                  <input
                    type="text"
                    value={kephisReg}
                    onChange={(e) => setKephisReg(e.target.value)}
                    placeholder="KEPHIS-EX-8890"
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-1.5 text-white font-mono text-[11px] focus:border-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Phone / WhatsApp Number</label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl pl-9 pr-3 py-2 text-white focus:border-emerald-500 focus:outline-none"
                  />
                </div>
              </div>
            </>
          )}

          <div>
            <label className="block text-slate-300 font-semibold mb-1">Exporter Email Address *</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="export@freshproduce.co.ke"
                className="w-full bg-slate-900 border border-slate-700 rounded-xl pl-9 pr-3 py-2 text-white placeholder-slate-500 focus:border-emerald-500 focus:outline-none"
              />
            </div>
          </div>

          <button
            type="submit"
            className="w-full py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold rounded-xl shadow-lg shadow-emerald-600/25 transition-all text-xs"
          >
            {authMode === 'login' ? 'Sign In & Access Export Vault' : 'Register & Create Account'}
          </button>
        </form>

        {/* Demo Fast Login Profiles */}
        <div className="p-4 bg-slate-900/60 border-t border-slate-800 text-xs">
          <span className="text-[10px] text-slate-400 block mb-2 font-semibold uppercase tracking-wider">
            Quick Demo Exporter Profiles:
          </span>
          <div className="space-y-1.5">
            {clients.map(c => (
              <button
                key={c.id}
                onClick={() => handleQuickLogin(c)}
                className="w-full text-left p-2 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 flex items-center justify-between text-[11px] text-slate-300 transition-colors"
              >
                <div>
                  <span className="font-bold text-white block">{c.companyName}</span>
                  <span className="text-slate-500">{c.email}</span>
                </div>
                <span className="text-emerald-400 font-medium">Switch ➔</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
