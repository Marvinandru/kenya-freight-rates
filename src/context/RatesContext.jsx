import React, { createContext, useContext, useState, useEffect } from 'react';
import { INITIAL_RATES, AIRLINES, AIRPORTS, COMMODITY_TYPES } from '../data/initialRates';
import { INITIAL_SHIPMENTS, INITIAL_CLIENTS } from '../data/initialShipments';
import confetti from 'canvas-confetti';

const RatesContext = createContext();

const STORAGE_KEY = 'aero_produce_rates_v3';
const SHIPMENTS_KEY = 'aero_produce_shipments_v1';
const CLIENTS_KEY = 'aero_produce_clients_v1';
const AUTH_KEY = 'aero_produce_auth_user_v1';
const PROFIT_KEY = 'aero_produce_profit_margin_v1';
const LAST_UPDATED_KEY = 'aero_produce_last_updated_v3';
const EXCHANGE_RATE_USD_KES = 129.50;

export const RatesProvider = ({ children }) => {
  // Profit Margin per KG (Default $0.20 USD for business owner)
  const [profitMarginPerKg, setProfitMarginPerKg] = useState(() => {
    try {
      const saved = localStorage.getItem(PROFIT_KEY);
      return saved !== null ? Number(saved) : 0.20;
    } catch (e) {
      return 0.20;
    }
  });

  // Base Airline Rates
  const [rates, setRates] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved ? JSON.parse(saved) : INITIAL_RATES;
    } catch (e) {
      return INITIAL_RATES;
    }
  });

  // Shipments & Export Documents
  const [shipments, setShipments] = useState(() => {
    try {
      const saved = localStorage.getItem(SHIPMENTS_KEY);
      return saved ? JSON.parse(saved) : INITIAL_SHIPMENTS;
    } catch (e) {
      return INITIAL_SHIPMENTS;
    }
  });

  // Client accounts
  const [clients, setClients] = useState(() => {
    try {
      const saved = localStorage.getItem(CLIENTS_KEY);
      return saved ? JSON.parse(saved) : INITIAL_CLIENTS;
    } catch (e) {
      return INITIAL_CLIENTS;
    }
  });

  // Current Logged-in User
  const [currentUser, setCurrentUser] = useState(() => {
    try {
      const saved = localStorage.getItem(AUTH_KEY);
      return saved ? JSON.parse(saved) : INITIAL_CLIENTS[0]; // Default logged in for immediate usability
    } catch (e) {
      return INITIAL_CLIENTS[0];
    }
  });

  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState('login'); // 'login' | 'signup'

  const [lastUpdated, setLastUpdated] = useState(() => {
    try {
      const saved = localStorage.getItem(LAST_UPDATED_KEY);
      if (saved) return saved;
    } catch (e) {}
    const today = new Date();
    return today.toLocaleDateString('en-KE', { 
      day: 'numeric', 
      month: 'short', 
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }) + ' EAT';
  });

  const [currencyMode, setCurrencyMode] = useState('USD');
  const [isAdminOpen, setIsAdminOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('rates'); // 'rates' | 'calculator' | 'portal' | 'broadcast' | 'insights'
  const [selectedRouteForCalc, setSelectedRouteForCalc] = useState(null);
  const [selectedRouteForHistory, setSelectedRouteForHistory] = useState(null);
  const [selectedShipmentForModal, setSelectedShipmentForModal] = useState(null);
  const [notification, setNotification] = useState(null);

  // Persistence
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(rates));
    } catch (e) {}
  }, [rates]);

  useEffect(() => {
    try {
      localStorage.setItem(SHIPMENTS_KEY, JSON.stringify(shipments));
    } catch (e) {}
  }, [shipments]);

  useEffect(() => {
    try {
      localStorage.setItem(CLIENTS_KEY, JSON.stringify(clients));
    } catch (e) {}
  }, [clients]);

  useEffect(() => {
    try {
      localStorage.setItem(AUTH_KEY, JSON.stringify(currentUser));
    } catch (e) {}
  }, [currentUser]);

  useEffect(() => {
    try {
      localStorage.setItem(PROFIT_KEY, profitMarginPerKg.toString());
    } catch (e) {}
  }, [profitMarginPerKg]);

  useEffect(() => {
    try {
      localStorage.setItem(LAST_UPDATED_KEY, lastUpdated);
    } catch (e) {}
  }, [lastUpdated]);

  const showNotification = (msg, type = 'success') => {
    setNotification({ msg, type, id: Date.now() });
    setTimeout(() => setNotification(null), 4000);
  };

  // Helper to calculate quoted rate with profit margin
  const getSellingRate = (baseRate) => {
    if (baseRate === undefined || baseRate === null) return 0;
    return Number((Number(baseRate) + profitMarginPerKg).toFixed(2));
  };

  // Auth Functions
  const login = (email) => {
    const found = clients.find(c => c.email.toLowerCase() === email.toLowerCase());
    if (found) {
      setCurrentUser(found);
      setIsAuthModalOpen(false);
      showNotification(`Welcome back, ${found.name} (${found.companyName})!`);
      return true;
    } else {
      // Auto-create account if not found
      const newAcc = {
        id: `USR-${Date.now().toString().slice(-4)}`,
        name: email.split('@')[0],
        companyName: `${email.split('@')[0].toUpperCase()} Produce Exports`,
        email: email,
        phone: '+254 700 000 000',
        hcdLicense: `HCDA-${Date.now().toString().slice(-4)}`,
        kephisReg: `KEPHIS-${Date.now().toString().slice(-4)}`,
        accountType: 'Produce Exporter',
        location: 'Nairobi / JKIA Hub',
        joinedDate: 'Today'
      };
      setClients(prev => [newAcc, ...prev]);
      setCurrentUser(newAcc);
      setIsAuthModalOpen(false);
      showNotification(`Account created & logged in as ${newAcc.email}!`);
      return true;
    }
  };

  const signup = ({ name, companyName, email, phone, hcdLicense, kephisReg, location }) => {
    const newAcc = {
      id: `USR-${Date.now().toString().slice(-4)}`,
      name: name || 'Produce Exporter',
      companyName: companyName || 'Kenyan Fresh Farm Ltd',
      email: email,
      phone: phone || '+254 700 000 000',
      hcdLicense: hcdLicense || 'HCDA-2026',
      kephisReg: kephisReg || 'KEPHIS-2026',
      accountType: 'Verified Produce Exporter',
      location: location || 'Nairobi, Kenya',
      joinedDate: 'Today'
    };
    setClients(prev => [newAcc, ...prev]);
    setCurrentUser(newAcc);
    setIsAuthModalOpen(false);
    showNotification(`Welcome to AeroProduce Kenya, ${newAcc.companyName}!`);
  };

  const logout = () => {
    setCurrentUser(null);
    localStorage.removeItem(AUTH_KEY);
    showNotification('Logged out of exporter portal.', 'info');
  };

  // Shipment & Document Functions
  const createShipment = (shipmentData) => {
    const awbRand = Math.floor(10000 + Math.random() * 90000);
    const airlineCode = shipmentData.airlineCode || 'KQ';
    const awb = `${airlineCode}-0704-${awbRand}`;
    const weight = Number(shipmentData.chargeableWeight || shipmentData.grossWeight || 1000);
    const profit = Number((weight * profitMarginPerKg).toFixed(2));
    const quotedRate = Number((shipmentData.baseRatePerKg + profitMarginPerKg).toFixed(2));

    const newShipment = {
      id: `SHP-${Date.now().toString().slice(-6)}`,
      awbNumber: awb,
      clientEmail: currentUser?.email || 'guest@export.co.ke',
      clientCompany: currentUser?.companyName || 'Fresh Produce Exporter',
      origin: shipmentData.origin || 'NBO',
      destination: shipmentData.destination || 'AMS',
      commodity: shipmentData.commodity || 'avocados',
      commodityName: shipmentData.commodityName || 'Fresh Avocados',
      airlineId: shipmentData.airlineId || 'KQ',
      airlineName: shipmentData.airlineName || 'Kenya Airways Cargo',
      grossWeight: Number(shipmentData.grossWeight || 1000),
      chargeableWeight: weight,
      baseRatePerKg: shipmentData.baseRatePerKg,
      profitMarginPerKg: profitMarginPerKg,
      quotedRatePerKg: quotedRate,
      totalProfitUSD: profit,
      grandTotalUSD: Number(shipmentData.grandTotalUSD || (quotedRate * weight).toFixed(2)),
      flightNumber: shipmentData.flightNumber || `${airlineCode} ${Math.floor(100 + Math.random() * 900)}`,
      flightDate: shipmentData.flightDate || 'Tomorrow',
      status: 'Booking Confirmed / Documents Pending',
      statusColor: 'sky',
      createdAt: 'Just Now',
      documents: [
        {
          id: `DOC-AWB-${Date.now()}`,
          type: 'awb',
          name: `Air Waybill / BL Draft (${awb})`,
          fileName: `AWB_${awb.replace(/-/g, '_')}_Draft.pdf`,
          fileSize: '380 KB',
          uploadedAt: 'Just Now',
          verified: false,
          issuer: 'AeroProduce Cargo Desk',
          icon: 'FileText'
        },
        {
          id: `DOC-PKL-${Date.now()}`,
          type: 'packing_list',
          name: 'Export Packing List & Weight Certificate',
          fileName: `PackingList_${shipmentData.commodity}_${weight}kg.pdf`,
          fileSize: '240 KB',
          uploadedAt: 'Just Now',
          verified: true,
          issuer: currentUser?.companyName || 'Packhouse Exporter',
          icon: 'Box'
        }
      ]
    };

    setShipments(prev => [newShipment, ...prev]);
    showNotification(`Shipment ${awb} created with $${profit} profit margin!`);
    setActiveTab('portal');
    return newShipment;
  };

  const uploadDocument = (shipmentId, { type, name, fileName, fileSize, issuer }) => {
    setShipments(prev =>
      prev.map(shp => {
        if (shp.id === shipmentId) {
          const newDoc = {
            id: `DOC-${Date.now().toString().slice(-6)}`,
            type: type || 'other',
            name: name || 'Export Document',
            fileName: fileName || `${name.replace(/\s+/g, '_')}.pdf`,
            fileSize: fileSize || `${Math.floor(200 + Math.random() * 500)} KB`,
            uploadedAt: 'Just Now',
            verified: true,
            issuer: issuer || (currentUser?.companyName || 'JKIA Cargo Agency'),
            icon: type === 'kephis' ? 'ShieldCheck' : type === 'awb' ? 'FileText' : 'Box'
          };
          return {
            ...shp,
            documents: [newDoc, ...shp.documents]
          };
        }
        return shp;
      })
    );
    showNotification(`Document "${name}" uploaded & attached to shipment!`);
  };

  const deleteDocument = (shipmentId, docId) => {
    setShipments(prev =>
      prev.map(shp => {
        if (shp.id === shipmentId) {
          return {
            ...shp,
            documents: shp.documents.filter(d => d.id !== docId)
          };
        }
        return shp;
      })
    );
    showNotification('Document removed.', 'info');
  };

  const updateShipmentStatus = (shipmentId, newStatus, newColor = 'emerald') => {
    setShipments(prev =>
      prev.map(shp => {
        if (shp.id === shipmentId) {
          return { ...shp, status: newStatus, statusColor: newColor };
        }
        return shp;
      })
    );
    showNotification(`Shipment status updated to "${newStatus}"!`);
  };

  // Rate Editing
  const updateRate = (id, updatedFields) => {
    setRates(prevRates => 
      prevRates.map(item => {
        if (item.id === id) {
          const oldRate1000 = item.rate1000kg;
          const newRate1000 = updatedFields.rate1000kg !== undefined ? updatedFields.rate1000kg : oldRate1000;
          
          let changeDirection = item.changeDirection;
          let changeAmount = item.changeAmount;
          
          if (newRate1000 !== oldRate1000) {
            const diff = Number((newRate1000 - oldRate1000).toFixed(2));
            changeAmount = diff;
            changeDirection = diff > 0 ? 'up' : diff < 0 ? 'down' : 'stable';
          }

          const history = [...(item.history7d || [oldRate1000])];
          if (newRate1000 !== oldRate1000) {
            history.push(newRate1000);
            if (history.length > 7) history.shift();
          }

          return {
            ...item,
            ...updatedFields,
            changeDirection,
            changeAmount,
            history7d: history
          };
        }
        return item;
      })
    );
  };

  const applyBulkAdjustment = ({ airlineId, destinationRegion, commodity, deltaAmount, percentage }) => {
    setRates(prevRates =>
      prevRates.map(item => {
        const airport = AIRPORTS[item.destination];
        const matchAirline = !airlineId || airlineId === 'all' || item.airlineId === airlineId;
        const matchRegion = !destinationRegion || destinationRegion === 'all' || airport?.region === destinationRegion;
        const matchCommodity = !commodity || commodity === 'all' || item.commodity === commodity;

        if (matchAirline && matchRegion && matchCommodity) {
          const adjust = (val) => {
            if (!val) return val;
            let newVal = val;
            if (deltaAmount) newVal += deltaAmount;
            if (percentage) newVal += val * (percentage / 100);
            return Number(Math.max(0.1, newVal).toFixed(2));
          };

          const oldRate1000 = item.rate1000kg;
          const newRate1000 = adjust(item.rate1000kg);
          const diff = Number((newRate1000 - oldRate1000).toFixed(2));
          
          const history = [...(item.history7d || [oldRate1000])];
          if (diff !== 0) {
            history.push(newRate1000);
            if (history.length > 7) history.shift();
          }

          return {
            ...item,
            rate45kg: adjust(item.rate45kg),
            rate100kg: adjust(item.rate100kg),
            rate300kg: adjust(item.rate300kg),
            rate500kg: adjust(item.rate500kg),
            rate1000kg: newRate1000,
            changeDirection: diff > 0 ? 'up' : diff < 0 ? 'down' : 'stable',
            changeAmount: diff,
            history7d: history
          };
        }
        return item;
      })
    );
    showNotification('Bulk produce rate adjustments applied successfully!');
  };

  const publishDailyRates = () => {
    const now = new Date();
    const formattedDate = now.toLocaleDateString('en-KE', { 
      day: 'numeric', 
      month: 'short', 
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }) + ' EAT';
    setLastUpdated(formattedDate);

    try {
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 }
      });
    } catch (e) {}

    showNotification(`Daily Produce Rates published officially for ${formattedDate}!`);
  };

  const resetToDefaults = () => {
    if (window.confirm('Reset all produce rates to initial daily defaults? Any custom edits will be reverted.')) {
      setRates(INITIAL_RATES);
      localStorage.removeItem(STORAGE_KEY);
      showNotification('Fresh produce rates restored to defaults.', 'info');
    }
  };

  // Profit Metrics
  const totalTonnageKg = shipments.reduce((sum, s) => sum + (Number(s.chargeableWeight) || 0), 0);
  const totalProfitEarnedUSD = shipments.reduce((sum, s) => sum + (Number(s.totalProfitUSD) || (s.chargeableWeight * profitMarginPerKg)), 0);

  return (
    <RatesContext.Provider
      value={{
        rates,
        lastUpdated,
        currencyMode,
        setCurrencyMode,
        exchangeRate: EXCHANGE_RATE_USD_KES,
        profitMarginPerKg,
        setProfitMarginPerKg,
        getSellingRate,
        currentUser,
        setCurrentUser,
        clients,
        isAuthModalOpen,
        setIsAuthModalOpen,
        authMode,
        setAuthMode,
        login,
        signup,
        logout,
        shipments,
        createShipment,
        uploadDocument,
        deleteDocument,
        updateShipmentStatus,
        totalTonnageKg,
        totalProfitEarnedUSD,
        isAdminOpen,
        setIsAdminOpen,
        activeTab,
        setActiveTab,
        selectedRouteForCalc,
        setSelectedRouteForCalc,
        selectedRouteForHistory,
        setSelectedRouteForHistory,
        selectedShipmentForModal,
        setSelectedShipmentForModal,
        notification,
        showNotification,
        updateRate,
        applyBulkAdjustment,
        publishDailyRates,
        resetToDefaults,
        airlines: AIRLINES,
        airports: AIRPORTS,
        commodities: COMMODITY_TYPES
      }}
    >
      {children}
    </RatesContext.Provider>
  );
};

export const useRates = () => {
  const context = useContext(RatesContext);
  if (!context) {
    throw new Error('useRates must be used within a RatesProvider');
  }
  return context;
};
