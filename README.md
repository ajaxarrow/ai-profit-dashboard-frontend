# Profit Desk: frontend (Next.js)

The web app for an AI profit dashboard for online stores: a command center where an AI monitors the shop and recommends what to fix, a dashboard with an AI note under every chart, an advertising report with correlation and export, and a chat that answers questions from the shop's calculated numbers.

Backend (Django API): https://github.com/ajaxarrow/ai-profit-dashboard-backend

**Schritt-für-Schritt-Anleitung (Deutsch, mit Screenshots): [docs/ANLEITUNG.md](docs/ANLEITUNG.md)**: eine praktische Führung durch die Oberfläche für Anwender, keine Entwickler-Dokumentation.

## Pages
| Page | What it does |
|---|---|
| Command center | The AI's inbox: health score, morning brief, workflow (monitor → detect → recommend → approve → fixed), signal cards with small diagrams, a budget what-if simulator |
| Dashboard | True profit after every cost, where each sale goes, trends, channels, categories, best and worst products, with an AI read under each chart |
| Products | Profit per product with a cost breakdown |
| Advertising | Platform and campaign efficiency, platform claims versus store sales, spend-versus-sales correlation, Excel and CSV export, an ads-only AI chat |
| Ask AI | Chat with follow-up questions; the same chat is available as a drawer on every page |
| Data sources | Connect Shopify, import ad spend, edit cost assumptions (switched off in the read-only demo) |

The Shopify store is the default selection when the app opens.

## Run locally
```bash
npm install
npm run dev          # http://localhost:3000, expects the backend on http://127.0.0.1:8000
```
`/api/*` is proxied to the backend by Next (`next.config.ts`), so the browser never calls the backend directly and no CORS setup is needed.

## Environment
| Variable | Notes |
|---|---|
| `BACKEND_URL` | The backend's address. Optional in development. **Required in production, at build time as well as at runtime**, because Next resolves rewrites during `next build` (the build fails with a clear message if it is missing). |

No API keys live in the frontend. The AI keys belong to the backend.

## Deploy on Render
1. Deploy the backend first and copy its URL (for example `https://ai-profit-dashboard-backend.onrender.com`).
2. New → Blueprint → pick this repo (`render.yaml`), and set `BACKEND_URL` to that URL when asked.
3. If you change `BACKEND_URL` later, redeploy: it is baked in at build time.

Free instances sleep after about 15 minutes without visitors. The first request afterwards takes 30 to 60 seconds while the backend wakes up and reloads its data.

## Stack
Next.js (App Router), React, TypeScript, Tailwind CSS. Charts are hand-written SVG. Markdown in chat answers uses `react-markdown`.
