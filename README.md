# Macrown Hair Atelier

Official web application, luxury e-commerce storefront, and auth-protected inventory management portal for **Macrown Hair** ([macrown.org](https://www.macrown.org/)).

## ✨ Features

- **Haute Coiffure Storefront**:
  - Full-bleed cinematic campaign video hero with ambient sound and playback controls.
  - Symmetrical, responsive luxury header with continuous gold marquee ticker and full-height slide-over drawer.
  - Interactive **Hair Guide** comparing *Lux Hair*, *Virgin Hair*, and *Swiss HD Lace*.
  - Authentic product catalog with photoshoot photography, hair grade filters, and interactive length selectors.
  - Slide-over **Shopping Bag Drawer** with a real-time free shipping progress meter.
  - VIP WhatsApp Concierge direct consultation link (`+49 172 812 3222`).

- **Auth-Protected Admin & Inventory Portal (`#admin` / `/admin`)**:
  - Powered by **Firebase Authentication** (Sign in, New Admin creation, Password reset).
  - Inventory KPI dashboard (Total products, in-stock units, low-stock warnings, out-of-stock items, catalog valuation).
  - Add, edit, and delete catalog products with bilingual descriptions and image URLs.
  - Real-time stock status sync (*Auf Lager*, *Geringer Bestand*, *Ausverkauft*) reflected immediately on the live storefront.

## 🚀 Tech Stack

- **React 19** + **TypeScript**
- **Vite**
- **Tailwind CSS v4**
- **Firebase v12** (Authentication, Analytics, Firestore)
- **Oxlint**

## 🛠️ Development & Build

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Production build
npm run build

# Run linter
npm run lint
```
