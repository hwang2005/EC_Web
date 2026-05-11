# D2C Agricultural E-commerce Platform

**Live Demo**: [https://hwang2005.github.io/EC_Web/](https://hwang2005.github.io/EC_Web/)

This is a code bundle for an e-commerce demo website, designed specifically as a Direct-to-Consumer (D2C) marketplace for agricultural produce. The original UI prototype is available at [Figma](https://www.figma.com/design/YZqlkRCUMX54CqxZBl8iSJ/Ecommerce-demo-website).

## Project Overview

This specialized platform connects agricultural producers directly with consumers. It minimizes spoilage and focuses on freshness by offering complex delivery mechanisms, source verification, and specialized buyer-seller workflows.

### Key Features

- **Robust Product Management**: Specialized product sheets encompassing health and quality certifications such as VietGAP and GlobalGAP for vegetables, fruits, and regional specialties.
- **Advanced Delivery Workflows**:
  - **Dynamic Addresses**: Integrates open APIs for interactive location selection.
  - **Time-slotted Shipments**: Restricts deliveries to specific intra-day windows to ensure recipients are available.
  - **Subscription Models**: Flexible recurring delivery schedules that let users build subscription combos.
  - **Dynamic Shipping Realities**: Recalculates delivery costs based on cart dimensions and requested zones.
- **Gamified User Retention**: Includes rank-based systems such as Standard, Premium, VIP, and VVIP with hidden vouchers and personalized price adjustments.
- **Order and Issue Logistics**: Complete lifecycle tracking from `Pending` to `Delivered`, plus support features like `Report Quality Issue`.
- **Modern UI/UX**: Dark mode support, robust state persistence, multi-role dashboards, and fail-safes such as logout confirmation.

## Technology Stack

- **Core**: React 18, TypeScript
- **Routing**: React Router 7
- **Styling and UI**: Tailwind CSS 4, Radix UI Primitives, Material UI, Framer Motion, Embla Carousel
- **Build Tool**: Vite
- **AI Chatbot**: Python, FastAPI, Ollama Llama 3, ChromaDB

## How to Run the Full Project

This project has 2 parts:

1. Frontend: React + Vite in the project root
2. Backend chatbot: FastAPI in `chatbot-server`

To run the whole application locally, open 2 terminals and start both services.

### Prerequisites

Make sure your machine has:

- [Node.js](https://nodejs.org/) `18+`
- `npm`
- Python `3.10+`
- `pip`
- [Ollama](https://ollama.com/) installed locally if you want the AI chatbot to answer with Llama 3

You can verify the installed versions with:

```bash
node -v
npm -v
python --version
pip --version
```

### Step 1: Install Frontend Dependencies

From the project root:

```bash
npm install
```

### Step 2: Install Backend Dependencies

Move to the backend folder and install Python packages:

```bash
cd chatbot-server
pip install -r requirements.txt
```

If `python` is not mapped correctly on Windows, try:

```bash
py -3.10 -m pip install -r requirements.txt
```

### Step 3: Configure Environment Variables

In `chatbot-server`, create the environment file:

```bash
copy .env.example .env
```

Then open `.env` and adjust the Ollama settings if needed for your local setup.

Before starting the backend, make sure Ollama is running and the required model is available:

```bash
ollama serve
ollama pull llama3
```

Notes:

- The backend uses Ollama for both chat generation and vector embeddings.
- By default, `.env.example` is configured with:
  - `OLLAMA_BASE_URL=http://localhost:11434`
  - `OLLAMA_MODEL=llama3`
  - `OLLAMA_EMBED_MODEL=llama3`
- If Ollama is not running, or the configured model does not exist locally, the backend can still start, but `/api/chat` will return an error response instead of an AI-generated answer.

### Step 4: Start the Backend

From `chatbot-server`:

```bash
python main.py
```

The backend runs at:

```text
http://localhost:8000
```

You can check the health endpoint at:

```text
http://localhost:8000/api/health
```

### Step 5: Start the Frontend

Open a second terminal, return to the project root, and run:

```bash
cd ..
npm run dev
```

Vite will print a local URL, usually:

```text
http://localhost:5173
```

Open that URL in your browser.

### Local Run Summary

When the full project is running locally:

- Frontend: `http://localhost:5173`
- Backend chatbot API: `http://localhost:8000`

Recommended startup order:

1. Start the backend in `chatbot-server`
2. Start the frontend in the project root
3. Open the frontend URL shown by Vite

### Run Frontend Only

If you only want to preview the UI:

```bash
npm install
npm run dev
```

The site can still load, but features depending on `/api/chat` will not work fully if the backend is not running.

## AI Chatbot Setup

The chatbot uses a Retrieval-Augmented Generation (RAG) pipeline:

1. Markdown documents in `chatbot-server/knowledge_base` are loaded on startup.
2. The content is chunked and embedded with Ollama, then indexed into ChromaDB.
3. Relevant context is retrieved from ChromaDB using Ollama-generated query embeddings.
4. Ollama Llama 3 generates the final response from the retrieved context.

If the backend is unreachable, the frontend can fall back to its built-in rule-based chatbot behavior.

## Building for Production

Build the frontend for production:

```bash
npm run build
```

The optimized output is generated in the `dist` folder.

## Deployment

The site is automatically deployed to **GitHub Pages** on every push to `main` via the included GitHub Actions workflow at `.github/workflows/deploy.yml`.

### One-time Setup

1. Go to **Settings > Pages** in this repository.
2. Under **Build and deployment**, set **Source** to **GitHub Actions**.
3. Push to `main` and the workflow will build and deploy automatically.

### Deployment Details

- Vite builds the app with `base: '/EC_Web/'` so all asset paths work correctly for the GitHub Pages subdirectory.
- The router uses `import.meta.env.BASE_URL` as its `basename`, so client-side navigation works under `/EC_Web/`.
- `dist/404.html` is deployed alongside the app so GitHub Pages serves the SPA shell for deep links instead of returning a real 404 page.
