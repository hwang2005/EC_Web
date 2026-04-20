# D2C Agricultural E-commerce Platform

This is a code bundle for an E-commerce demo website, designed specifically as a Direct-to-Consumer (D2C) marketplace for agricultural produce. The original UI prototype is available at [Figma](https://www.figma.com/design/YZqlkRCUMX54CqxZBl8iSJ/Ecommerce-demo-website).

## 🌾 Project Overview

This specialized platform connects agricultural producers directly with consumers. It minimizes spoilage and focuses on freshness by offering complex delivery mechanisms, source verification, and specialized buyer-seller workflows.

### ✨ Key Features

*   **Robust Product Management**: Specialized product sheets encompassing health/quality certifications (VietGAP, GlobalGAP) for Vegetables, Fruits, and Regional Specialties.
*   **Advanced Delivery Workflows**:
    *   **Dynamic Addresses**: Integrates open APIs for interactive location selection.
    *   **Time-slotted Shipments**: Restricts deliveries to specific intra-day windows (8h-12h, 12h-15h, 15h-18h, 18h-21h) to ensure recipients are available. 
    *   **Subscription Models**: Flexible, recurring delivery schedules letting users build subscription combos effortlessly.
    *   **Dynamic Shipping Realities**: Instantly recalculating delivery costs based on cart dimensions and requested zones.
*   **Gamified User Retention**: Includes Rank-based systems (Standard, Premium, VIP, VVIP) applying hidden vouchers and personalized price adjustments.
*   **Order & Issue Logistics**: Complete lifecycle tracking (`Pending` to `Delivered`). Seamless claim tools like "Report Quality Issue" for prompt D2C resolutions.
*   **Modern UI/UX**: Full Dark Mode support, robust state persistence, multi-role Dashboards (Admin/Seller), and fail-safes (e.g., Logout confirmations).

## 🛠️ Technology Stack

*   **Core**: React (v18), TypeScript
*   **Routing**: React Router (v7)
*   **Styling & UI**: Tailwind CSS (v4), Radix UI Primitives, Material UI (MUI), Framer Motion, Embla Carousel
*   **Build Tool**: Vite

## 🚀 How to Run the Code

### Prerequisites
Make sure you have [Node.js](https://nodejs.org/) installed (v18 or higher is recommended) along with `npm`.

### Installation

Navigate to the root directory where the `package.json` is located and install all project dependencies:

```bash
npm install
```

### Starting the Development Server

Boot up the Vite build tool in development mode with Hot Module Replacement (HMR) enabled:

```bash
npm run dev
```

Vite will provide a local server link in the terminal (typically `http://localhost:5173`). Click the link to view the running application in your browser.

### Building for Production

Compile the strict TypeScript logic and bundle the Single Page Application (SPA) into static files for deployment:

```bash
npm run build
```

The optimized code will be cleanly bundled into the `dist` folder. *(Note: Ensure the host server natively supports SPA routing rewrites to point unresolved endpoints back towards `index.html`)*.