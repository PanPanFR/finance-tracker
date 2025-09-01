import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// Get site URL dynamically to support different IP addresses
const getSiteUrl = () => {
  // Check if we're in browser environment
  if (typeof window !== 'undefined') {
    // Use current origin (supports localhost, IP addresses, and domains)
    return window.location.origin;
  }
  // Fallback to environment variable or default
  return process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
};

if (!supabaseUrl || !supabaseKey) {
  console.warn(
    "Missing Supabase environment variables. Please check your .env.local file."
  );
}

// Create Supabase client with fallback
export const supabase = createClient(
  supabaseUrl || "https://placeholder.supabase.co",
  supabaseKey || "placeholder-key",
  {
    auth: {
      flowType: 'pkce',
      autoRefreshToken: true,
      detectSessionInUrl: true
    }
  }
);

// Helper function to check if Supabase is properly configured
export const isSupabaseConfigured = () => {
  return !!(supabaseUrl && supabaseKey);
};

// Export site URL getter for use in components
export const getCurrentSiteUrl = getSiteUrl;
