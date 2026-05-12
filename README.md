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
  - `OLLAMA_BASE_URL=http://localhost:11436`
  - `OLLAMA_MODELS=YOUR DIRECTORY FOR OLLAMA MODELS`
  - `OLLAMA_MODEL=llama3`
  - `OLLAMA_EMBED_MODEL=llama3`
- On startup, the backend now tries to start `ollama serve` automatically with `OLLAMA_MODELS` if local manifests are found in that folder.
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

The frontend of this application is fully configured for automatic deployment to **GitHub Pages** using GitHub Actions. Every time you push or merge code to the `main` branch, the workflow defined in `.github/workflows/deploy.yml` will automatically build the production assets and publish them to your GitHub Pages URL.

> **Note on Backend Deployment**: GitHub Pages only hosts static files (HTML, CSS, JS). The Python FastAPI `chatbot-server` is not deployed via this workflow. However, the frontend is designed to gracefully degrade. If the `/api/chat` endpoint is unreachable in the production environment, the chatbot will automatically fall back to its internal, robust rule-based logic without breaking the user experience.

### Step-by-step One-time Setup

To enable the automatic deployment for your own fork or repository, follow these detailed steps:

1. **Navigate to Repository Settings**:
   - Go to your repository on GitHub.
   - Click on the **Settings** tab (the gear icon) located near the top right of the repository page.

2. **Configure Actions Permissions** (Important):
   - In the left sidebar, scroll down to the **Code and automation** section and click on **Actions**, then **General**.
   - Scroll down to the **Workflow permissions** section.
   - Select **Read and write permissions**. (This allows the GitHub Actions bot to deploy the built files).
   - Click **Save**.

3. **Configure GitHub Pages Source**:
   - In the left sidebar, under the **Code and automation** section, click on **Pages**.
   - Under the **Build and deployment** section, look for the **Source** dropdown menu.
   - Change the source from *Deploy from a branch* to **GitHub Actions**.

4. **Trigger the First Deployment**:
   - Make a change, commit, and push to the `main` branch.
   - Alternatively, you can go to the **Actions** tab in your repository, select the deployment workflow, and manually trigger it using the **Run workflow** button (if workflow dispatch is enabled).
   - Wait for the workflow to complete. It will show a green checkmark when finished.
   - Your site will be available at: `https://<your-username>.github.io/<your-repo-name>/` (e.g., `https://hwang2005.github.io/EC_Web/`).

### Deployment Details & Technical Architecture

The deployment setup includes several specific configurations to ensure the React Single Page Application (SPA) works flawlessly on GitHub Pages:

- **Base Path Configuration**: 
  - In `vite.config.ts`, the build is configured with `base: '/EC_Web/'`. This ensures that all generated asset paths (CSS, JS, images) are correctly prefixed with the repository name, which is necessary since GitHub Pages hosts project sites in a subdirectory rather than at the root domain.
  
- **Router Basename**: 
  - The React Router uses `import.meta.env.BASE_URL` as its `basename`. This guarantees that client-side navigation (like navigating to `/products` or `/cart`) works correctly under the `/EC_Web/` path prefix without breaking.

- **SPA Routing Fix (The 404 Hack)**: 
  - GitHub Pages does not natively support SPA routing. If a user directly accesses a deep link (e.g., `https://hwang2005.github.io/EC_Web/cart`), GitHub Pages will normally look for a `cart.html` file, fail to find it, and return a 404 error.
  - To solve this, a `dist/404.html` is generated (usually a copy of `index.html`) and deployed alongside the application. When GitHub Pages encounters a missing route, it serves `404.html`, which loads the React application. The React Router then takes over, reads the URL, and renders the correct view seamlessly.
