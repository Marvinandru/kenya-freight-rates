import React, { createContext, useContext, useState, useEffect } from 'react';
import { INITIAL_RATES, AIRLINES, AIRPORTS, COMMODITY_TYPES } from '../data/initialRates';
import { INITIAL_SHIPMENTS, INITIAL_CLIENTS } from '../data/initialShipments';
import confetti from 'canvas-confetti';

const RatesContext = createContext();

const STORAGE_KEY = 'aero_produce_rates_v4';
const SHIPMENTS_KEY = 'aero_produce_shipments_v1';
const CLIENTS_KEY = 'aero_produce_clients_v1';
const AUTH_KEY = 'aero_produce_auth_user_v1';
const PROFIT_KEY = 'aero_produce_profit_margin_v1';
const TODAY_KEY = 'aero_produce_today_key_v2';
const LAST_UPDATED_KEY = 'aero_produce_last_updated_v4';

const EXCHANGE_RATE_USD_KES = 129.50;

// Nairobi East Africa Time format: e.g. "4 Sept 2026, 12:45 EAT"
export const formatProduceDate = (date = new Date()) => {
  try {
    return new Intl.DateTimeFormat('en-KE', { 
      timeZone: 'Africa/Nairobi',
      day: 'numeric', 
      month: 'short', 
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date) + ' EAT';
  } catch (e) {
    return date.toLocaleDateString('en-KE', { 
      day: 'numeric', 
      month: 'short', 
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }) + ' EAT';
  }
};

// Nairobi day key format: e.g. "2026-09-04"
export const getTodayKeyNairobi = (date = new Date()) => {
  try {
    return new Intl.DateTimeFormat('en-CA', { timeZone: 'Africa/Nairobi' }).format(date);
  } catch (e) {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }
};

export const isDateToday = (timestampOrDate) => {
  if (!timestampOrDate) return false;
  const target = new Date(Number(timestampOrDate));
  if (isNaN(target.getTime())) return false;
  return getTodayKeyNairobi(target) === getTodayKeyNairobi(new Date());
};

export const RatesProvider = ({ children }) => {
  // Profit Margin per KG (Default $0.20 USD for business owner = $200.00 USD / Metric Ton)
  const [profitMarginPerKg, setProfitMarginPerKg] = useState(() => {
    try {
      const saved = localStorage.getItem(PROFIT_KEY);
      return saved !== null ? Number(saved) : 0.20;
    } catch (e) {
      return 0.20;
    }
  });

  // Base Airline Rates - Always hydrate with INITIAL_RATES to include all routes (Kuwait, Kazakhstan, Italy, etc.)
  const [rates, setRates] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        const parsedMap = new Map(parsed.map(r => [r.id, r]));
        // Merge so any new initial rates are guaranteed to be included
        const merged = INITIAL_RATES.map(initItem => {
          return parsedMap.has(initItem.id) ? parsedMap.get(initItem.id) : initItem;
        });
        const initIds = new Set(INITIAL_RATES.map(r => r.id));
        parsed.forEach(p => {
          if (!initIds.has(p.id)) merged.push(p);
        });
        return merged;
      }
      return INITIAL_RATES;
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
  const [isRefreshing, setIsRefreshing] = useState(false);

  // When refreshing the web page, the time and rates always refresh dynamically to right now!
  const [lastUpdated, setLastUpdated] = useState(() => {
    const fresh = formatProduceDate(new Date());
    try {
      localStorage.setItem(TODAY_KEY, getTodayKeyNairobi());
      localStorage.setItem(LAST_UPDATED_KEY, fresh);
    } catch (e) {}
    return fresh;
  });

  const [currencyMode, setCurrencyMode] = useState('USD');
  const [isAdminOpen, setIsAdminOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('rates'); // 'rates' | 'calculator' | 'portal' | 'broadcast' | 'insights'
  const [selectedRouteForCalc, setSelectedRouteForCalc] = useState(null);
  const [selectedRouteForHistory, setSelectedRouteForHistory] = useState(null);
  const [selectedShipmentForModal, setSelectedShipmentForModal] = useState(null);
  const [notification, setNotification] = useState(null);

  // Manual & automatic refresh to today's date & live rates
  const refreshToToday = (showToast = true) => {
    setIsRefreshing(true);
    const now = new Date();
    const formatted = formatProduceDate(now);
    const currentTodayKey = getTodayKeyNairobi(now);

    setLastUpdated(formatted);
    try {
      localStorage.setItem(TODAY_KEY, currentTodayKey);
      localStorage.setItem(LAST_UPDATED_KEY, formatted);
    } catch (e) {}

    // Refresh rates validity and sync latest routes from INITIAL_RATES
    setRates(prevRates => {
      const prevMap = new Map(prevRates.map(r => [r.id, r]));
      return INITIAL_RATES.map(initItem => {
        const existing = prevMap.get(initItem.id);
        return existing ? { ...existing, validityDate: 'Today + 7 Days' } : initItem;
      });
    });

    setTimeout(() => {
      setIsRefreshing(false);
    }, 600);

    if (showToast) {
      showNotification(`Rates & validity timestamp refreshed to live time: ${formatted}`, 'success');
    }
    return formatted;
  };

  // Day rollover detection & mount refresh (guarantees refreshed rates & live time on every web page reload)
  useEffect(() => {
    const syncLiveProduceRates = () => {
      const now = new Date();
      const formatted = formatProduceDate(now);
      const currentTodayKey = getTodayKeyNairobi(now);
      setLastUpdated(formatted);
      try {
        localStorage.setItem(TODAY_KEY, currentTodayKey);
        localStorage.setItem(LAST_UPDATED_KEY, formatted);
      } catch (e) {}
    };

    // Immediate sync on page reload/refresh
    syncLiveProduceRates();

    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        syncLiveProduceRates();
      }
    };

    window.addEventListener('focus', syncLiveProduceRates);
    document.addEventListener('visibilitychange', handleVisibility);
    const interval = setInterval(syncLiveProduceRates, 30 * 1000);

    return () => {
      window.removeEventListener('focus', syncLiveProduceRates);
      document.removeEventListener('visibilitychange', handleVisibility);
      clearInterval(interval);
    };
  }, []);

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

  const showNotification = (msg, type = 'success') => {
    setNotification({ msg, type, id: Date.now() });
    setTimeout(() => setNotification(null), 4000);
  };

  // Helper to calculate quoted rate with profit margin per KG ($0.20/kg)
  const getSellingRate = (baseRate) => {
    if (baseRate === undefined || baseRate === null) return 0;
    return Number((Number(baseRate) + profitMarginPerKg).toFixed(2));
  };

  // Helper to calculate quoted price per Metric Ton (1 MT = 1000 KG)
  // Quoted price per MT = (baseRate + profitMarginPerKg) * 1000
  // Explicitly includes the $0.20 USD/KG markup = +$200.00 USD / MT
  const getSellingRatePerMT = (baseRate) => {
    if (baseRate === undefined || baseRate === null) return 0;
    return Number(((Number(baseRate) + profitMarginPerKg) * 1000).toFixed(2));
  };

  const markupPerMT = Number((profitMarginPerKg * 1000).toFixed(2)); // $200.00 USD / MT markup

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

  // Booking Approval & Advance Bank Payment Prompt State
  const [approvalPromptShipment, setApprovalPromptShipment] = useState(null);
  const [isApprovalModalOpen, setIsApprovalModalOpen] = useState(false);

  const triggerApprovalNotice = (shipment) => {
    setApprovalPromptShipment(shipment);
    setIsApprovalModalOpen(true);
  };

  const closeApprovalNotice = () => {
    setIsApprovalModalOpen(false);
    setApprovalPromptShipment(null);
  };

  const approveShipment = (shipmentId, paymentMethodChoice = 'USD Bank Wire') => {
    let targetShipment = null;
    setShipments(prev =>
      prev.map(shp => {
        if (shp.id === shipmentId) {
          const updated = {
            ...shp,
            status: 'Approved • Advance Payment Pending',
            statusColor: 'emerald',
            paymentStatus: paymentMethodChoice === 'USD Wire Sent' ? 'USD Bank Wire Initiated' : 'Pending Advance USD Wire',
            paymentMethod: 'USD Bank Wire',
            approvedAt: formatProduceDate(new Date())
          };
          targetShipment = updated;
          return updated;
        }
        return shp;
      })
    );

    if (targetShipment) {
      triggerApprovalNotice(targetShipment);
      try {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 }
        });
      } catch (e) {}
      showNotification(`Order for AWB ${targetShipment.awbNumber} approved! Please complete advance USD bank payment.`);
    }
  };

  const recordBankPayment = (shipmentId, referenceNumber) => {
    setShipments(prev =>
      prev.map(shp => {
        if (shp.id === shipmentId) {
          return {
            ...shp,
            status: 'Advance Payment Initiated / Verifying',
            statusColor: 'emerald',
            paymentStatus: 'USD Bank Wire Initiated',
            paymentMethod: 'USD Bank Wire',
            bankReference: referenceNumber || `USD-WIRE-${Date.now().toString().slice(-6)}`,
            paidAt: formatProduceDate(new Date())
          };
        }
        return shp;
      })
    );
    try {
      confetti({
        particleCount: 100,
        spread: 80,
        origin: { y: 0.6 }
      });
    } catch (e) {}
    showNotification(`USD bank wire recorded! Our JKIA cargo accounts desk is verifying your payment.`, 'success');
  };

  // Shipment & Document Functions
  const createShipment = (shipmentData, triggerNotice = true) => {
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
      status: 'Approved • Advance Payment Pending',
      statusColor: 'emerald',
      paymentStatus: 'Pending Advance USD Wire',
      paymentMethod: 'USD Bank Wire',
      approvedAt: formatProduceDate(new Date()),
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
    showNotification(`Shipment ${awb} booked! Please note advance payment requirements.`);
    
    if (triggerNotice) {
      triggerApprovalNotice(newShipment);
    }

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
    const formattedDate = refreshToToday(false);

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
        refreshToToday,
        isRefreshing,
        formatProduceDate,
        currencyMode,
        setCurrencyMode,
        exchangeRate: EXCHANGE_RATE_USD_KES,
        profitMarginPerKg,
        setProfitMarginPerKg,
        getSellingRate,
        getSellingRatePerMT,
        markupPerMT,
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
        approvalPromptShipment,
        isApprovalModalOpen,
        triggerApprovalNotice,
        closeApprovalNotice,
        approveShipment,
        recordBankPayment,
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
