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
- npm or yarn
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

3. Set up environment variables:
Create a `.env.local` file and add your credentials:
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
NEXT_PUBLIC_OPENROUTER_KEY=your_openrouter_api_key
```

4. Run the development server:
```bash
npm run dev
```

5. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Authentication Setup

This application uses Supabase for user authentication. Follow these steps to set up authentication:

1. **Enable Authentication in Supabase**: Go to your Supabase dashboard → Authentication → Settings
2. **Configure Email Auth**: Enable email confirmations and set up your email templates
3. **Set up RLS (Row Level Security)**: Enable RLS on your tables and create policies
4. **Configure Redirect URLs**: Add your domain to the redirect URLs in Supabase

For detailed setup instructions, see [SETUP_AUTH.md](./SETUP_AUTH.md) and [SETUP_ENV.md](./SETUP_ENV.md).

## Usage

1. **Register/Login**: Create an account or sign in to access your personal finance dashboard
2. **Add Transactions**: Manually add transactions or use OCR to scan receipts
3. **Categorize**: Organize transactions by categories for better financial tracking
4. **Monitor**: View your spending patterns and financial insights
5. **Manage**: Edit or delete transactions as needed

## Deployment

This project is configured for deployment on Vercel with automatic deployments on every push to the main branch.

### Auto-Deployment Setup

1. **Connect GitHub Repository**:
   - Go to [Vercel Dashboard](https://vercel.com/dashboard)
   - Click "New Project"
   - Import your GitHub repository
   - Select the repository and branch (main/master)

2. **Configure Build Settings**:
   - Framework Preset: Next.js
   - Build Command: `npm run build`
   - Output Directory: `.next`
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

Make sure to set the following environment variables in your Vercel dashboard:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `NEXT_PUBLIC_OPENROUTER_KEY`

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
