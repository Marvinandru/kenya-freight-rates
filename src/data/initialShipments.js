// Initial sample shipments & documents for Kenyan Produce Exporters
export const INITIAL_SHIPMENTS = [
  {
    id: 'SHP-NBO-AMS-701',
    awbNumber: 'KQ-0704-88912',
    clientEmail: 'export@freshavocado.co.ke',
    clientCompany: 'Kakuzi / Naivasha Fresh Green Ltd',
    origin: 'NBO',
    destination: 'AMS',
    commodity: 'avocados',
    commodityName: 'Hass Avocados (Size 16/18)',
    airlineId: 'KQ',
    airlineName: 'Kenya Airways Cargo',
    grossWeight: 1800, // KG
    chargeableWeight: 1800,
    baseRatePerKg: 1.70,
    profitMarginPerKg: 0.20, // +$0.20 USD/KG profit
    quotedRatePerKg: 1.90,
    totalProfitUSD: 360.00, // 1800 * 0.20
    grandTotalUSD: 4626.00,
    flightNumber: 'KQ 116',
    flightDate: '2026-09-04',
    status: 'In Cold Store / Cleared',
    statusColor: 'emerald',
    createdAt: '2026-09-03 09:30 EAT',
    documents: [
      {
        id: 'DOC-AWB-701',
        type: 'awb',
        name: 'Air Waybill / BL (KQ-0704-88912)',
        fileName: 'AirWaybill_KQ_0704_88912.pdf',
        fileSize: '420 KB',
        uploadedAt: 'Today, 10:15 EAT',
        verified: true,
        issuer: 'Kenya Airways Cargo Desk',
        icon: 'FileText'
      },
      {
        id: 'DOC-KEPHIS-701',
        type: 'kephis',
        name: 'KEPHIS Phytosanitary Certificate (#KE-2026-8891)',
        fileName: 'KEPHIS_Phytosanitary_KE_2026_8891.pdf',
        fileSize: '680 KB',
        uploadedAt: 'Today, 10:45 EAT',
        verified: true,
        issuer: 'Kenya Plant Health Inspectorate Service',
        icon: 'ShieldCheck'
      },
      {
        id: 'DOC-PKL-701',
        type: 'packing_list',
        name: 'Export Packing List & Commercial Invoice',
        fileName: 'PackingList_Avocados_450ctns.pdf',
        fileSize: '290 KB',
        uploadedAt: 'Today, 09:40 EAT',
        verified: true,
        issuer: 'Naivasha Fresh Green Ltd Packhouse',
        icon: 'Box'
      },
      {
        id: 'DOC-COO-701',
        type: 'coo',
        name: 'Certificate of Origin (EUR.1 Movement Certificate)',
        fileName: 'EUR1_Certificate_Origin_KE7712.pdf',
        fileSize: '340 KB',
        uploadedAt: 'Today, 11:00 EAT',
        verified: true,
        issuer: 'Kenya National Chamber of Commerce & Industry (KNCCI)',
        icon: 'Award'
      }
    ]
  },
  {
    id: 'SHP-NBO-LHR-804',
    awbNumber: '8V-0681-44109',
    clientEmail: 'export@freshavocado.co.ke',
    clientCompany: 'Kakuzi / Naivasha Fresh Green Ltd',
    origin: 'NBO',
    destination: 'LHR',
    commodity: 'soya_beans',
    commodityName: 'Fresh Soya & Fine French Beans',
    airlineId: '8V',
    airlineName: 'Astral Aviation',
    grossWeight: 1200,
    chargeableWeight: 1200,
    baseRatePerKg: 1.82,
    profitMarginPerKg: 0.20,
    quotedRatePerKg: 2.02,
    totalProfitUSD: 240.00,
    grandTotalUSD: 3384.00,
    flightNumber: '8V 402F',
    flightDate: '2026-09-05',
    status: 'KEPHIS Inspection Passed',
    statusColor: 'sky',
    createdAt: '2026-09-02 14:20 EAT',
    documents: [
      {
        id: 'DOC-AWB-804',
        type: 'awb',
        name: 'Air Waybill / BL (8V-0681-44109)',
        fileName: 'AWB_Astral_8V068144109.pdf',
        fileSize: '395 KB',
        uploadedAt: 'Yesterday, 15:00 EAT',
        verified: true,
        issuer: 'Astral Aviation Cargo Operations',
        icon: 'FileText'
      },
      {
        id: 'DOC-KEPHIS-804',
        type: 'kephis',
        name: 'KEPHIS Export Inspection Certificate',
        fileName: 'KEPHIS_Legumes_Clearance_804.pdf',
        fileSize: '510 KB',
        uploadedAt: 'Yesterday, 16:30 EAT',
        verified: true,
        issuer: 'KEPHIS JKIA Export Center',
        icon: 'ShieldCheck'
      },
      {
        id: 'DOC-PKL-804',
        type: 'packing_list',
        name: 'Commercial Packing List (Fine Beans 300 boxes)',
        fileName: 'PackingList_FineBeans_1200kg.pdf',
        fileSize: '210 KB',
        uploadedAt: 'Yesterday, 14:30 EAT',
        verified: true,
        issuer: 'Naivasha Fresh Green Ltd',
        icon: 'Box'
      }
    ]
  },
  {
    id: 'SHP-NBO-DXB-920',
    awbNumber: 'EK-0176-90412',
    clientEmail: 'mombasa@chillexports.co.ke',
    clientCompany: 'Coast & Rift Chillies Ltd',
    origin: 'NBO',
    destination: 'DXB',
    commodity: 'chillies',
    commodityName: 'Bird’s Eye & Bullet Chillies (Fresh)',
    airlineId: 'EK',
    airlineName: 'Emirates SkyCargo',
    grossWeight: 650,
    chargeableWeight: 650,
    baseRatePerKg: 1.18,
    profitMarginPerKg: 0.20,
    quotedRatePerKg: 1.38,
    totalProfitUSD: 130.00,
    grandTotalUSD: 1384.50,
    flightNumber: 'EK 720',
    flightDate: '2026-09-04',
    status: 'Ready for Loading',
    statusColor: 'amber',
    createdAt: '2026-09-03 08:15 EAT',
    documents: [
      {
        id: 'DOC-AWB-920',
        type: 'awb',
        name: 'Air Waybill / BL (EK-0176-90412)',
        fileName: 'Emirates_SkyCargo_AWB_920.pdf',
        fileSize: '410 KB',
        uploadedAt: 'Today, 08:45 EAT',
        verified: true,
        issuer: 'Emirates SkyCargo NBO Station',
        icon: 'FileText'
      },
      {
        id: 'DOC-KEPHIS-920',
        type: 'kephis',
        name: 'KEPHIS Phytosanitary (FCM Free Protocol)',
        fileName: 'KEPHIS_Chillies_FCM_Cert.pdf',
        fileSize: '620 KB',
        uploadedAt: 'Today, 09:10 EAT',
        verified: true,
        issuer: 'KEPHIS JKIA Plant Quarantine',
        icon: 'ShieldCheck'
      },
      {
        id: 'DOC-PKL-920',
        type: 'packing_list',
        name: 'Packing List & Net Weight Tally Sheet',
        fileName: 'PackingList_Chillies_260boxes.pdf',
        fileSize: '195 KB',
        uploadedAt: 'Today, 08:20 EAT',
        verified: true,
        issuer: 'Coast & Rift Chillies Packhouse',
        icon: 'Box'
      }
    ]
  }
];

export const INITIAL_CLIENTS = [
  {
    id: 'USR-001',
    name: 'Marvin Andrew',
    companyName: 'Naivasha Fresh Green & Avocado Exporters Ltd',
    email: 'export@freshavocado.co.ke',
    phone: '+254 712 345 678',
    hcdLicense: 'HCDA-EXP-2026-891',
    kephisReg: 'KEPHIS-EX-4491',
    accountType: 'Produce Exporter & Grower',
    location: 'Nairobi / Naivasha Packhouse',
    joinedDate: 'August 2026'
  },
  {
    id: 'USR-002',
    name: 'Fatuma Hassan',
    companyName: 'Coast & Rift Chillies Ltd',
    email: 'mombasa@chillexports.co.ke',
    phone: '+254 722 987 654',
    hcdLicense: 'HCDA-EXP-2026-302',
    kephisReg: 'KEPHIS-EX-1182',
    accountType: 'Chilli & Spice Specialist',
    location: 'Mombasa / Athi River',
    joinedDate: 'September 2026'
  }
];
