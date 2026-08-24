import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "../contexts/AuthContext";
import { ToastProvider } from "../components/Toast";

const inter = Inter({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "AI Finance Tracker - Modern Personal Expense & Wealth Management",
  description: "Track your personal expenses, receipts, and cashflow with AI-powered insights and automated receipt OCR.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "AI Finance Tracker",
  },
  formatDetection: {
    telephone: false,
  },
};

// WCAG 1.4.4 (Resize Text): no maximumScale/userScalable restrictions —
// pinch-to-zoom must remain available.
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#09090b",
};

// Applies the persisted theme (or prefers-color-scheme) before first paint
// to avoid a flash of the wrong theme.
const themeInitScript = `(function(){try{var t=localStorage.getItem("ft-theme");if(t!=="light"&&t!=="dark"){t=window.matchMedia&&window.matchMedia("(prefers-color-scheme: light)").matches?"light":"dark";}var el=document.documentElement;el.classList.remove("light","dark");el.classList.add(t);}catch(e){}})();`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
        <meta name="theme-color" content="#09090b" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="AI Finance Tracker" />
        <meta name="mobile-web-app-capable" content="yes" />
      </head>
      <body className={`${inter.className} min-h-screen antialiased selection:bg-indigo-500/30 selection:text-indigo-200`}>
        <a href="#main-content" className="skip-link">
          Skip to main content
        </a>
        <AuthProvider>
          <ToastProvider>
            <div id="main-content" tabIndex={-1}>
              {children}
            </div>
          </ToastProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
