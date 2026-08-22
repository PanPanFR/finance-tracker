# AI Finance Tracker

Personal finance tracker with AI-powered transaction parsing, OCR receipt scanning, and intelligent reports.

## Tech Stack

- **Frontend**: Next.js 15 + React 19 + TypeScript + Tailwind CSS
- **Database**: Cloudflare D1 (SQLite)
- **Hosting**: Cloudflare Pages
- **AI**: Google Gemini 2.0 Flash
- **OCR**: Tesseract.js (client-side)
- **Auth**: Dynamic Master password (stored in D1, HMAC-SHA256 session token)

## Features

- 🤖 **AI Transaction Parsing** — Type natural language statements and AI extracts structured transactions
- 📷 **OCR Receipt Scanning** — Upload receipt photos to extract transactions automatically
- 📊 **AI Reports** — Ask questions about your spending in natural language
- ✏️ **CRUD Transactions** — Add, edit, and delete transactions with categories and types
- 🔒 **Dynamic Master Password** — Changeable master password stored securely in SQLite database
- 📱 **Mobile-First & PWA** — Responsive layout and touch-optimized components

## Getting Started

### Prerequisites

- Node.js 20+
- Cloudflare account (free tier)
- Google Gemini API key (optional for basic usage, required for AI parsing & reports)

### 1. Clone & Install

```bash
git clone <repo-url>
cd finance-tracker
npm install
```

### 2. Create D1 Database

```bash
npx wrangler d1 create finance-tracker-db
```

Copy the `database_id` from the output and paste it into `wrangler.toml`.

### 3. Apply Schema

```bash
npx wrangler d1 execute finance-tracker-db --local --file=schema.sql
```

### 4. Configure Environment Variables

Create `.env.local`:

```env
SESSION_SECRET=your-random-secret-key-at-least-32-chars
GOOGLE_API_KEY=your-gemini-api-key
```

### 5. Run Locally

```bash
npm run dev
```

Open `http://localhost:3000`. On first launch, the app will prompt you to set your Master Password.

## Deployment to Cloudflare Pages

### Manual Deploy

```bash
npm run build
npm run pages:deploy
```

### CI/CD (GitHub Actions)

Set these secrets in your GitHub repository:

| Secret | Description |
|--------|-------------|
| `CLOUDFLARE_API_TOKEN` | Cloudflare API token with Pages edit permission |
| `CLOUDFLARE_ACCOUNT_ID` | Your Cloudflare account ID |
| `GOOGLE_API_KEY` | Google Gemini API key |

Push to `main` branch to trigger automatic deployment.

### Cloudflare Pages Environment Variables

Set these in the Cloudflare Pages dashboard (**Settings → Environment Variables**):

| Variable | Description |
|----------|-------------|
| `SESSION_SECRET` | Random 32+ char string for signing session tokens |
| `GOOGLE_API_KEY` | Google Gemini API key |

### D1 Database Binding

In Cloudflare Pages dashboard, go to **Settings → Functions → D1 database bindings** and add:

- Variable name: `DB`
- D1 database: `finance-tracker-db`

## License

MIT
