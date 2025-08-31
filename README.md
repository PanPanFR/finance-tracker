# Finance Tracker Webapp

A modern web application for tracking personal finances built with Next.js, React, and Supabase.

## Features

- 📊 **Transaction Management**: Add, edit, and delete financial transactions
- 📱 **OCR Integration**: Scan receipts using Tesseract.js for automatic data extraction
- 🤖 **AI-Powered Analysis**: Intelligent parsing and reporting of financial data
- 🎨 **Modern UI**: Beautiful and responsive design with Tailwind CSS
- 🔐 **Secure Backend**: Powered by Supabase for data storage and authentication

## Tech Stack

- **Frontend**: Next.js 15, React 19, TypeScript
- **Styling**: Tailwind CSS
- **Backend**: Supabase
- **OCR**: Tesseract.js
- **AI**: Custom AI parser and reporting system

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn
- Supabase account

### Installation

1. Clone the repository:
```bash
git clone https://github.com/PanPanFR/finance-tracker-webapp.git
cd finance-tracker-webapp
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
Create a `.env.local` file and add your Supabase credentials:
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

4. Run the development server:
```bash
npm run dev
```

5. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Deployment

This project is configured for deployment on Vercel. Simply connect your GitHub repository to Vercel for automatic deployments.

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## License

This project is licensed under the MIT License.
