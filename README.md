# Finance Tracker

A modern web application for tracking personal finances built with Next.js, React, and Supabase. Manage your income, expenses, and financial goals with a secure, user-friendly interface.

## 🌐 Live Demo

Check out the live application: **[Finance Tracker](https://finance-tracker-mu-five-89.vercel.app/)**

## Features

- 🔐 **User Authentication**: Secure login and registration system
- 👤 **User Profiles**: Personalized dashboard for each user
- 📊 **Transaction Management**: Add, edit, and delete financial transactions
- 🏷️ **Category Management**: Organize transactions by categories (Food, Transport, Bills, etc.)
- 📱 **OCR Integration**: Scan receipts using Tesseract.js for automatic data extraction
- 🤖 **AI-Powered Analysis**: Intelligent parsing and reporting of financial data
- 📈 **Financial Insights**: Track spending patterns and income trends
- 🎨 **Modern UI**: Beautiful and responsive design with Tailwind CSS
- 🔒 **Secure Backend**: Powered by Supabase for data storage and authentication
- 📱 **Mobile Responsive**: Works seamlessly on all devices

## Tech Stack

- **Frontend**: Next.js 15, React 19, TypeScript
- **Styling**: Tailwind CSS
- **Backend**: Supabase (Database, Authentication, Real-time)
- **OCR**: Tesseract.js
- **AI**: Custom AI parser and reporting system
- **State Management**: React Context API
- **Deployment**: Vercel

## Getting Started

### Prerequisites

- Node.js 18+
- npm (or yarn/pnpm)
- Supabase account

### Installation

1. Clone the repository:
```bash
git clone https://github.com/PanPanFR/finance-tracker.git
cd finance-tracker
```

2. Install dependencies:
```bash
npm install
```

3. Configure environment variables:
- Copy the example file to a local environment file:
```bash
cp env.example .env.local
```
- Fill in values from your Supabase and OpenRouter projects.
  - Set `GOOGLE_API_KEY` for Gemini (server-side secret; no NEXT_PUBLIC_ prefix).
  - Ensure `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` are correct.

4. Run the development server:
```bash
npm run dev
```

5. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Authentication & Database (Supabase)

This project uses Supabase for Authentication and Database.

Quick steps:
1. Enable Authentication in Supabase (Email/Password).
2. Add Redirect URLs for your local/production domains.
3. Enable RLS on tables and create the required policies.
4. Put credentials into `.env.local` following `env.example`.

### Example Schema & RLS Policies (SQL)

Run this in the Supabase SQL Editor to create basic tables and RLS policies.

```sql
-- Profiles: stores basic user info
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  avatar_url text,
  updated_at timestamp with time zone default now()
);

alter table public.profiles enable row level security;

-- Only the owner (auth.uid()) can view/manage their data
create policy if not exists "Profiles are viewable by owner"
on public.profiles for select
using (auth.uid() = id);

create policy if not exists "Profiles are updatable by owner"
on public.profiles for update
using (auth.uid() = id);

create policy if not exists "Profiles are insertable by user"
on public.profiles for insert
with check (auth.uid() = id);

-- Transactions: records user income/expenses
create table if not exists public.transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  amount numeric(14,2) not null,
  category text,
  type text check (type in ('income','expense')) not null,
  occurred_at date not null default current_date,
  created_at timestamp with time zone default now()
);

alter table public.transactions enable row level security;

create index if not exists transactions_user_id_idx on public.transactions(user_id);

-- Owner-only access policies
create policy if not exists "Read own transactions"
on public.transactions for select
using (auth.uid() = user_id);

create policy if not exists "Insert own transactions"
on public.transactions for insert
with check (auth.uid() = user_id);

create policy if not exists "Update own transactions"
on public.transactions for update
using (auth.uid() = user_id);

create policy if not exists "Delete own transactions"
on public.transactions for delete
using (auth.uid() = user_id);
```

Tips:
- Adjust the `category` column or add a `categories` table if needed.
- Ensure Supabase JWT settings work with `auth.uid()` by default.

### Transactions Table (matches your table builder UI)

If you prefer `amount` as `int8` and `uuid_generate_v4()` for IDs (as shown in your UI), use this variant. It includes RLS and helpful indexes:

```sql
-- Enable uuid-ossp if you want uuid_generate_v4()
create extension if not exists "uuid-ossp";

create table if not exists public.transactions (
  id uuid primary key default uuid_generate_v4(),
  created_at timestamptz not null default now(),
  description text,
  amount int8 not null,
  category text,
  type text not null check (type in ('income','expense')),
  user_id uuid not null references auth.users(id) on delete cascade
);

alter table public.transactions enable row level security;

-- Owner-only policies
create policy if not exists "Read own transactions"
on public.transactions for select
using (auth.uid() = user_id);

create policy if not exists "Insert own transactions"
on public.transactions for insert
with check (auth.uid() = user_id);

create policy if not exists "Update own transactions"
on public.transactions for update
using (auth.uid() = user_id);

create policy if not exists "Delete own transactions"
on public.transactions for delete
using (auth.uid() = user_id);

-- Indexes
create index if not exists transactions_user_id_idx on public.transactions(user_id);
create index if not exists transactions_created_at_idx on public.transactions(created_at);
```

## Usage

1. **Register/Login**: Create an account or sign in to access your personal finance dashboard
2. **Add Transactions**: Manually add transactions or use OCR to scan receipts
3. **Categorize**: Organize transactions by categories for better financial tracking
4. **Monitor**: View your spending patterns and financial insights
5. **Manage**: Edit or delete transactions as needed

## Deployment

This project is configured for deployment on Vercel. Auto-deploy is enabled via GitHub integration on every push to the default branch. CI file: `.github/workflows/vercel-deploy.yml`.

### Auto-Deployment Setup

1. **Connect GitHub Repository**:
   - Go to [Vercel Dashboard](https://vercel.com/dashboard)
   - Click "New Project"
   - Import your GitHub repository
   - Select the repository and branch (main/master)

2. **Configure Build Settings** (Vercel's Next.js defaults are usually correct):
   - Framework Preset: Next.js
   - Build Command: `npm run build`
   - Install Command: `npm install`

3. **Set Environment Variables**:
   - Add your environment variables in Vercel dashboard
   - Or use Vercel CLI: `vercel env add`

4. **Enable Auto-Deploy**:
   - In project settings, ensure "Auto Deploy" is enabled
   - Set production branch to `main` or `master`

### Manual Deployment (if needed)

```bash
# Install Vercel CLI
npm i -g vercel

# Login to Vercel
vercel login

# Deploy
vercel --prod
```

### Environment Variables for Production

Make sure the following variables exist in Vercel (Project Settings → Environment Variables):
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `GOOGLE_API_KEY` (no NEXT_PUBLIC_ prefix)

### Troubleshooting Auto-Deployment

If auto-deployment is not working:

1. **Check Vercel Dashboard**:
   - Go to Project Settings → Git
   - Ensure "Auto Deploy" is enabled
   - Verify the correct branch is selected

2. **Check GitHub Integration**:
   - Ensure Vercel has access to your repository
   - Check if webhooks are properly configured

3. **Force Redeploy**:
   ```bash
   # Using Vercel CLI
   vercel --prod
   
   # Or trigger from dashboard
   # Go to Deployments → Redeploy
   ```

4. **Check Build Logs**:
   - Review build logs in Vercel dashboard
   - Ensure all environment variables are set correctly

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## License

This project is licensed under the MIT License.
