# Provision Store Billing App

A complete, production-ready mobile billing application for a small provision/grocery shop.

## Tech Stack

- **Backend:** Node.js, Express, MongoDB Atlas, TypeScript
- **Frontend:** React Native (Expo), TypeScript, Zustand, React Native Paper, BLE PLX

## Folder Structure

```
├── backend/                  # Node.js/Express Backend API
│   ├── src/                  # Source files
│   │   ├── config/           # App configurations
│   │   ├── controllers/      # Route controllers
│   │   ├── models/           # Mongoose schemas
│   │   ├── middlewares/      # Security, JWT, validations
│   │   ├── services/         # Business logic
│   │   ├── routes/           # API Endpoints
│   │   ├── utils/            # Winston logging, helper utilities
│   │   └── server.ts         # Server entry point
│   ├── package.json
│   └── tsconfig.json
└── mobile/                   # React Native (Expo) Mobile Client
    ├── src/                  # Source files
    │   ├── components/       # UI Components
    │   ├── screens/          # Layout screens
    │   ├── navigation/       # React Navigation setup
    │   ├── store/            # Zustand stores
    │   ├── services/         # API clients, BLE printer service
    │   └── utils/            # Calculations and helper functions
    ├── package.json
    └── tsconfig.json
```

## Setup Instructions

### Backend
1. Navigate to `/backend`
2. Run `npm install`
3. Create a `.env` file based on instructions in Phase 2.
4. Run `npm run dev` for hot reloading.

### Mobile Client
1. Navigate to `/mobile`
2. Run `npm install`
3. Run `npx expo start` to launch the Expo dev server.
