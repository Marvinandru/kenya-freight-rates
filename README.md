# AeroProduce Kenya | Daily Fresh Produce Air Cargo Rates & Export Document Hub 🥑🫘🌶️

[![Vite](https://img.shields.io/badge/Vite-6.0-646CFF?style=flat&logo=vite&logoColor=white)](https://vitejs.dev/)
[![React](https://img.shields.io/badge/React-18-61DAFB?style=flat&logo=react&logoColor=black)](https://reactjs.org/)
[![TailwindCSS](https://img.shields.io/badge/TailwindCSS-3.4-38B2AC?style=flat&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)

**AeroProduce Kenya** is a web portal designed for Kenyan horticulture exporters, outgrowers, packhouses, and air freight forwarders. It provides verified daily air freight spot rates (USD/kg) from **Nairobi (JKIA - NBO)** to worldwide destinations across major international carriers, featuring an automated profit margin engine and digital export document vault.

---

## 🌟 Key Features

1. **Daily Fresh Produce Rates Matrix (USD/KG)**:
   - Exclusively tailored for **Fresh Avocados (Hass & Fuerte)**, **Fresh Soya Beans & Legumes (French Beans, Snap Peas)**, and **Fresh Chillies (Bird's Eye, Bullet, Habanero)**.
   - Carriers tracked: *Kenya Airways Cargo, Astral Aviation, Ethiopian Airlines Cargo, Emirates SkyCargo, Qatar Airways Cargo, Saudia Cargo, Lufthansa Cargo, Turkish Cargo, Martinair / KLM*.
   - Tiered rates: `+45KG`, `+100KG`, `+300KG`, `+500KG`, and `+1000KG` (Bulk Cargo Rate).
   - Itemized surcharge breakdown: Base Rate + FSC (Fuel) + SSC (Security) + KAA Ground Handling = **All-In Spot Rate**.

2. **Automated Profit Margin Engine**:
   - Automatically adds a customizable **`+$0.20 USD / KG` profit margin** to every rate quoted to clients.
   - Admin Revenue & Profit Dashboard with live tonnage tracking ($KG$) and USD revenue calculation.

3. **Exporter Account & Document Hub (`Documents (BL & KEPHIS)` Tab)**:
   - Client registration and login for produce exporters.
   - Digital shipment archive with **Air Waybill (BL)**, **KEPHIS Phytosanitary Certificates**, **Packing Lists & Invoices**, and **Certificates of Origin (EUR.1)**.
   - Instant document preview, file upload, download, and one-click formatted WhatsApp / Link sharing.

4. **IATA Volumetric Cargo Cost Calculator**:
   - Dimension & $CBM$ volumetric weight calculator ($1:167$ IATA ratio) with one-click produce presets (Avocado pallets, Legume skids, Chilli boxes).
   - Side-by-side carrier comparison ranking by landed cost and transit speed.

5. **Daily WhatsApp & PDF Rate Card**:
   - One-click formatted WhatsApp digest generator for farmer and forwarder groups.
   - Printable / PDF daily rate sheet with official validity timestamps.

6. **Market & KEPHIS Advisories**:
   - Daily bulletins on avocado export peaks, EU False Codling Moth (FCM) compliance, and JKIA cold storage capacity.

---

## 🚀 Getting Started

### Prerequisites
- Node.js (v18+)
- npm or yarn

### Installation
```bash
# Clone the repository
git clone https://github.com/Kibuye24/kenya-freight-rates.git

# Navigate to project directory
cd kenya-freight-rates

# Install dependencies
npm install

# Start local development server
npm run dev
```

### Production Build
```bash
npm run build
npm run preview
```

---

## 🛠️ Tech Stack
- **Frontend**: React 18, Vite
- **Styling**: Tailwind CSS, Vanilla CSS glassmorphism, Lucide React icons
- **State Management**: React Context API with LocalStorage persistence
- **Animations & Effects**: Canvas Confetti

---

## 📄 License
MIT License © AeroProduce Kenya
