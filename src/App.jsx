import React from 'react';
import { RatesProvider, useRates } from './context/RatesContext';
import { Navbar } from './components/Navbar';
import { HeroBanner } from './components/HeroBanner';
import { RatesTable } from './components/RatesTable';
import { RateCalculator } from './components/RateCalculator';
import { ExporterPortal } from './components/ExporterPortal';
import { DailyBroadcast } from './components/DailyBroadcast';
import { MarketInsights } from './components/MarketInsights';
import { AdminManager } from './components/AdminManager';
import { AuthModal } from './components/AuthModal';
import { RateHistoryModal } from './components/RateHistoryModal';
import { OrderApprovalModal } from './components/OrderApprovalModal';
import { Footer } from './components/Footer';
import { CheckCircle, AlertCircle, Info, X } from 'lucide-react';

const AppContent = () => {
  const { activeTab, notification } = useRates();

  return (
    <div className="min-h-screen flex flex-col bg-slate-950 text-slate-100 font-sans selection:bg-emerald-500 selection:text-white">
      {/* Toast Notification */}
      {notification && (
        <div className="fixed bottom-6 right-6 z-50 animate-bounce-short">
          <div className="glass-panel px-4 py-3 rounded-2xl shadow-2xl border border-emerald-500/30 flex items-center gap-3 bg-slate-900/95 text-xs text-white">
            {notification.type === 'success' ? (
              <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
            ) : notification.type === 'error' ? (
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            ) : (
              <Info className="w-4 h-4 text-sky-400 shrink-0" />
            )}
            <span className="font-medium">{notification.msg}</span>
          </div>
        </div>
      )}

      {/* Main Navbar */}
      <Navbar />

      {/* Hero KPIs & Value Prop */}
      <HeroBanner />

      {/* Active Tab View */}
      <main className="flex-1 pb-12">
        {activeTab === 'rates' && <RatesTable />}
        {activeTab === 'calculator' && <RateCalculator />}
        {activeTab === 'portal' && <ExporterPortal />}
        {activeTab === 'broadcast' && <DailyBroadcast />}
        {activeTab === 'insights' && <MarketInsights />}
      </main>

      {/* Exporter Account & Auth Modal */}
      <AuthModal />

      {/* Admin Management Modal */}
      <AdminManager />

      {/* Rate History Sparkline Modal */}
      <RateHistoryModal />

      {/* Order Booking Approval & Advance Bank Payment Prompt Modal */}
      <OrderApprovalModal />

      {/* Footer */}
      <Footer />
    </div>
  );
};

export function App() {
  return (
    <RatesProvider>
      <AppContent />
    </RatesProvider>
  );
}

export default App;
