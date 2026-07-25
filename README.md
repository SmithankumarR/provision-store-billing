# Provision Store Billing App

A complete, production-ready enterprise Mobile POS (Point of Sale) & Billing Application built for provision and grocery stores.

![GitHub Repository](https://img.shields.io/badge/GitHub-SmithankumarR%2Fprovision--store--billing-blue?logo=github)
![Tech Stack](https://img.shields.io/badge/Stack-React%20Native%20%7C%20Expo%20%7C%20Node.js%20%7C%20Express%20%7C%20MongoDB-emerald)

---

## 🌟 Key Features

- **🔐 Multi-Tenant Authentication & Role-Based Access Control (RBAC):**
  - **Owner**: Full access to store setup, sales reports, profit analytics, item/category management, staff registrations, and bill cancellations.
  - **Biller**: Fast POS billing interface, item search, customer assignment, barcode lookups, and daily sales summary.
- **⚡ Fast POS Billing Engine:**
  - Debounced search & barcode scanner support.
  - Category pill filters & inventory stock badges.
  - Item-level & bill-level discounts (flat ₹ or % percentage).
  - GST tax calculations and automatic round-off.
  - Multi-payment support (`CASH`, `UPI`, `CARD`, `SPLIT`).
  - Auto-generated sequential invoice numbers (`INV-YYYYMMDD-XXXX`).
- **🖨️ ESC/POS Bluetooth Thermal Printing & PDF Exporter:**
  - Native ESC/POS byte builder supporting both **58 mm** (32 cols) and **80 mm** (48 cols) Bluetooth thermal receipt printers.
  - HTML PDF receipt renderer for instant sharing via WhatsApp or Email.
- **📊 Financial Analytics & Executive Dashboard:**
  - Real-time KPI Cards: Today's Revenue, Monthly Sales, Estimated Net Profit (`Revenue - COGS`), Total Store Inventory Valuation, and Low Stock Alerts.
  - Time-series sales trend charts & top/low selling item aggregations.
- **📦 Inventory & Stock Movement Ledger:**
  - Automated stock deduction on billing checkout.
  - Audit logging for `STOCK_IN`, `STOCK_OUT`, and `ADJUSTMENT`.
  - Bulk CSV Import & Export for inventory catalog.

---

## 🏗️ Architecture Overview

```
provision-store-billing/
├── backend/                  # Enterprise Node.js / Express REST API (TypeScript)
│   ├── src/
│   │   ├── config/           # Database & environment configurations
│   │   ├── controllers/      # HTTP Request Handlers
│   │   ├── middlewares/      # JWT Protect, Role Authorize, Helmet, Rate Limiters
│   │   ├── models/           # Mongoose Schemas (Store, User, Category, Item, Bill, Customer, InventoryLog, Settings)
│   │   ├── routes/           # API Endpoints
│   │   ├── services/         # Business Logic & Database Transactions
│   │   ├── swagger/          # OpenAPI 3.0 Documentation (served at /api-docs)
│   │   ├── validators/       # Express Validator Schemas
│   │   ├── utils/            # Winston Logger & Standardized JSON Response Formatter
│   │   └── server.ts         # Express Listener Entry Point
│   ├── package.json
│   ├── render.yaml           # Render Web Service Deployment Configuration
│   └── tsconfig.json
└── mobile/                   # React Native / Expo Mobile Application (TypeScript)
    ├── src/
    │   ├── components/       # Reusable UI Components
    │   ├── navigation/       # Role-Based React Navigation (Owner vs Biller Tabs)
    │   ├── screens/          # Screens (Billing, Dashboard, Items, AddItem, Categories, Reports, Settings, ReceiptModal)
    │   ├── services/         # Axios API Client with JWT Rotation & Bluetooth BLE ESC/POS Printer Service
    │   ├── store/            # Zustand Stores (useAuthStore, useCartStore, useSettingsStore)
    │   ├── theme/            # Material Design 3 Palette (Deep Emerald & Slate Dark/Light)
    │   └── types/            # TypeScript Interface Declarations
    ├── App.tsx
    ├── app.json              # Expo App Configuration & Bluetooth Android Permissions
    ├── eas.json              # Expo EAS Build Profile (APK & AAB)
    └── tsconfig.json
```

---

## 🚀 Quick Start & Local Setup

### Prerequisites
- Node.js (v18 or higher)
- npm or yarn
- MongoDB (Local instance or MongoDB Atlas connection string)
- Expo Go App on Android/iOS (for mobile testing)

---

### 1. Backend Setup

```bash
cd backend

# Install dependencies
npm install

# Create local environment file
cp .env.example .env

# Start development server with hot-reloading
npm run dev
```

The API server will run at `http://localhost:5001`.
View interactive API Documentation at: `http://localhost:5001/api-docs`

---

### 2. Mobile App Setup

```bash
cd mobile

# Install dependencies
npm install

# Launch Expo development server
npx expo start
```

Scan the QR code with **Expo Go** on your physical mobile device or launch Android/iOS Simulators.

---

## 🔑 Environment Variables Reference (`backend/.env`)

| Variable | Default Value | Description |
| :--- | :--- | :--- |
| `PORT` | `5001` | Express server port |
| `NODE_ENV` | `development` | Runtime environment (`development` / `production`) |
| `MONGODB_URI` | `mongodb://localhost:27017/provision_store` | MongoDB Atlas or Local connection string |
| `JWT_SECRET` | `development_secret_access_key` | Secret key for signing Access Tokens (15m expiry) |
| `JWT_EXPIRE` | `15m` | Access token lifespan |
| `JWT_REFRESH_SECRET` | `development_secret_refresh_key` | Secret key for Refresh Tokens (7d expiry) |
| `JWT_REFRESH_EXPIRE` | `7d` | Refresh token lifespan |

---

## 🌐 API Endpoint Reference

### Authentication & Users (`/api/auth`)
- `POST /api/auth/register-store` — Register store and primary Owner user account.
- `POST /api/auth/login` — Sign in with email or phone number.
- `POST /api/auth/refresh-token` — Rotate expired access tokens.
- `GET /api/auth/me` — Retrieve logged-in user profile.
- `POST /api/auth/register-biller` — Register Biller account under store (Owner only).

### Categories (`/api/categories`)
- `GET /api/categories` — List store categories (with search & pagination).
- `POST /api/categories` — Create category (Owner only).
- `PUT /api/categories/:id` — Update category details (Owner only).
- `PATCH /api/categories/:id/status` — Toggle active/inactive state (Owner only).

### Items & Inventory (`/api/items` & `/api/inventory`)
- `GET /api/items` — Search item catalog by name, SKU, barcode, category, and stock levels.
- `GET /api/items/barcode/:barcode` — Fast scanner lookup by barcode.
- `POST /api/items` — Create new inventory item (Owner only).
- `POST /api/items/import-csv` — Bulk import items via CSV (Owner only).
- `GET /api/items/export/csv` — Export item inventory to CSV file (Owner only).
- `POST /api/inventory/adjust` — Perform Stock In, Stock Out, or Stock Adjustment (Owner only).
- `GET /api/inventory/low-stock` — List items below minimum stock threshold.

### POS Billing (`/api/bills`)
- `POST /api/bills` — Process checkout, generate invoice, deduct stock, log audit entries, update customer loyalty.
- `GET /api/bills` — Filter bills by date range, payment method, or invoice number.
- `GET /api/bills/today` — Instant daily sales summary for current store/cashier.
- `POST /api/bills/:id/cancel` — Cancel invoice, restore item stock levels (Owner only).

### Analytics & Reports (`/api/dashboard` & `/api/reports`)
- `GET /api/dashboard/summary` — Executive KPI summary cards (Owner only).
- `GET /api/dashboard/charts` — Time-series sales trends and category distributions (Owner only).
- `GET /api/reports/sales` — Financial report (Revenue, COGS, Net Profit, Taxes, Discounts).

---

## 🛠️ Production Deployment Guide

### Deploying Backend to Render / Railway
1. Push repository to GitHub.
2. Link repository in **Render** and create a new **Web Service**.
3. Set Build Command: `npm install && npm run build`
4. Set Start Command: `npm start`
5. Configure Environment Variables (`MONGODB_URI`, `JWT_SECRET`, `JWT_REFRESH_SECRET`).

### Building Mobile App APK / AAB with Expo EAS
1. Install EAS CLI: `npm install -g eas-cli`
2. Authenticate: `eas login`
3. Configure project: `eas build:configure`
4. Generate Android APK for testing:
   ```bash
   cd mobile
   eas build -p android --profile preview
   ```
5. Generate Android App Bundle (AAB) for Google Play Store release:
   ```bash
   cd mobile
   eas build -p android --profile production
   ```

---

## 📄 License
This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
