import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Rate limiting configuration
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute
const MAX_REQUESTS_PER_WINDOW = 10; // Max 10 requests per minute
const rateLimitMap = new Map();

// Rate limiting function
function checkRateLimit(userId: string): boolean {
  const now = Date.now();
  const userLimit = rateLimitMap.get(userId);
  
  if (!userLimit) {
    rateLimitMap.set(userId, { count: 1, resetTime: now + RATE_LIMIT_WINDOW });
    return true;
  }
  
  if (now > userLimit.resetTime) {
    rateLimitMap.set(userId, { count: 1, resetTime: now + RATE_LIMIT_WINDOW });
    return true;
  }
  
  if (userLimit.count >= MAX_REQUESTS_PER_WINDOW) {
    return false;
  }
  
  userLimit.count++;
  return true;
}

// Validate user authentication
async function validateUser(authHeader: string | null): Promise<{ userId: string; user: any } | null> {
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    console.error("Auth validation - No Bearer token found");
    return null;
  }
  
  try {
    const token = authHeader.substring(7);
    console.log("Auth validation - Token received, length:", token.length);
    
    // Initialize Supabase client with ANON key for JWT validation
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
    
    console.log("Auth validation - Supabase client initialized");
    
    // Verify the token and get user
    const { data: { user }, error } = await supabase.auth.getUser(token);
    
    if (error) {
      console.error("Auth validation - Supabase auth error:", error);
      return null;
    }
    
    if (!user) {
      console.error("Auth validation - No user found in token");
      return null;
    }
    
    console.log("Auth validation - User authenticated successfully:", {
      userId: user.id,
      email: user.email,
      hasEmail: !!user.email
    });
    
    return { userId: user.id, user };
  } catch (error) {
    console.error("Auth validation - Unexpected error:", error);
    return null;
  }
}

export async function POST(request: NextRequest) {
  try {
    // 1. CORS Protection
    const origin = request.headers.get('origin');
    const allowedOrigins = [
      'https://panpan-finance-tracker.vercel.app',
      'http://localhost:3000',
      'https://localhost:3000'
    ];
    
    if (origin && !allowedOrigins.includes(origin)) {
      console.error("AI Parser - CORS violation from origin:", origin);
      return NextResponse.json(
        { error: 'CORS not allowed' },
        { status: 403, headers: { 'Access-Control-Allow-Origin': 'null' } }
      );
    }
    
    // 2. Authentication Check
    const authHeader = request.headers.get('authorization');
    const authResult = await validateUser(authHeader);
    
    if (!authResult) {
      console.error("AI Parser - Authentication failed");
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }
    
    const { userId, user } = authResult;
    console.log("AI Parser - Authenticated user:", userId);
    
    // 3. Rate Limiting
    if (!checkRateLimit(userId)) {
      console.error("AI Parser - Rate limit exceeded for user:", userId);
      return NextResponse.json(
        { 
          error: 'Rate limit exceeded',
          details: `Maximum ${MAX_REQUESTS_PER_WINDOW} requests per minute allowed`
        },
        { status: 429 }
      );
    }
    
    // 4. Input Validation
    const { input, insert, ocrNow } = await request.json();

    if (!input || typeof input !== 'string') {
      console.error("AI Parser - Invalid input:", input);
      return NextResponse.json(
        { error: 'Input text is required' },
        { status: 400 }
      );
    }
    
    // 5. Input Sanitization
    const sanitizedInput = input.trim().substring(0, 500); // Max 500 characters
    
    if (sanitizedInput.length === 0) {
      return NextResponse.json(
        { error: 'Input cannot be empty' },
        { status: 400 }
      );
    }

    console.log("AI Parser - Processing input for user:", userId, "Input:", sanitizedInput, "Insert:", !!insert, "ocrNow:", !!ocrNow);
    
    console.log("AI Parser - Environment check:", {
      hasGoogleKey: !!process.env.GOOGLE_API_KEY,
      googleKeyLength: process.env.GOOGLE_API_KEY?.length || 0,
      googleKeyPrefix: process.env.GOOGLE_API_KEY?.substring(0, 8) || 'N/A'
    });

    if (!process.env.GOOGLE_API_KEY) {
      console.error("AI Parser - Missing GOOGLE_API_KEY environment variable");
      return NextResponse.json(
        {
          error: 'Gemini API key not configured',
          details: 'Please set GOOGLE_API_KEY in your environment (server-side only)'
        },
        { status: 500 }
      );
    }

    console.log("AI Parser - Making request to Google Gemini...");

    const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${encodeURIComponent(process.env.GOOGLE_API_KEY)}`;

    const prompt = `You are a transaction parser API. Reply ONLY with a raw JSON array, no extra text.\nFormat: [{ description: string, amount: number (TOTAL price), created_at?: string (ISO 8601), category?: string, type?: \"income\" | \"expense\" }]\n- description: product/merchant/activity name, e.g. \"KRL\", \"Starbucks\", \"Shopee\", \"Electricity PLN\". Do not put categories here.\n- category: one of 'Makanan & Minuman', 'Transportasi', 'Tagihan', 'Hiburan', 'Belanja', 'Kesehatan', 'Pendidikan', 'Lainnya'.\n- type: 'income' for salary/bonus/refund/incoming transfers/selling; otherwise 'expense'.\n- amount MUST be the total price, NOT unit price.\n- If time words appear (e.g. 'kemarin', '2 hari lalu', 'tadi pagi jam 7'), convert to ISO 8601 using Asia/Jakarta timezone.\n  - pagi: 05:00-10:00, siang: 11:00-14:00, sore: 15:00-18:00, malam: 19:00-23:00\n- If multiple items (e.g. 'A dan B'), output multiple objects in the array.\n- If unsure, use category 'Lainnya' and type 'expense'.\nCurrent time (WIB): ${new Date().toLocaleString('en-US', { timeZone: 'Asia/Jakarta' })}\nUser input: ${sanitizedInput}`;

    const res = await fetch(geminiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [
          { role: 'user', parts: [{ text: prompt }] }
        ],
        generationConfig: {
          temperature: 0.2,
          maxOutputTokens: 512
        }
      })
    });

    if (!res.ok) {
      const errorText = await res.text();
      console.error("AI Parser - OpenRouter API error:", res.status, errorText);
      
      // Enhanced error handling for 401
      if (res.status === 401) {
        console.error("AI Parser - 401 Unauthorized - Possible causes:");
        console.error("1. API key expired or invalid");
        console.error("2. API key format incorrect");
        console.error("3. Account suspended or rate limited");
        console.error("4. Wrong API key copied");
        
        return NextResponse.json(
          { 
            error: 'OpenRouter API authentication failed (401)',
            details: 'Please check your API key. It might be expired, invalid, or incorrectly copied.',
            suggestions: [
              'Verify the API key in your OpenRouter dashboard',
              'Check if the key starts with "sk-or-v1-"',
              'Ensure the key is at least 50 characters long',
              'Try regenerating a new API key'
            ]
          },
          { status: 401 }
        );
      }
      
      return NextResponse.json(
        { 
          error: `OpenRouter API error: ${res.status}`,
          details: errorText,
          status: res.status
        },
        { status: res.status }
      );
    }

    const data = await res.json();
    console.log("AI Parser - Gemini response received");

    const raw = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (typeof raw !== 'string') {
      console.error("AI Parser - Invalid Gemini response format:", data);
      return NextResponse.json(
        { error: 'Invalid API response format from Gemini' },
        { status: 500 }
      );
    }
    console.log("AI Parser - Raw AI response:", raw);
    
    let parsed;
    try {
      parsed = JSON.parse(raw);
      console.log("AI Parser - Parsed JSON successfully:", parsed);
    } catch (parseError) {
      console.error("AI Parser - JSON parse error:", parseError, "Raw content:", raw);
      
      // Try to extract JSON from the response if it's wrapped in text
      console.log("AI Parser - Attempting to extract JSON from response...");
      
      let extractedJson = null;
      
      // Method 1: Look for JSON between ```json and ``` markers
      const jsonBlockMatch = raw.match(/```json\s*([\s\S]*?)\s*```/);
      if (jsonBlockMatch) {
        try {
          extractedJson = JSON.parse(jsonBlockMatch[1].trim());
          console.log("AI Parser - Successfully extracted JSON from code block");
        } catch (e) {
          console.log("AI Parser - Failed to parse JSON from code block");
        }
      }
      
      // Method 2: Look for JSON array starting with [ and ending with ]
      if (!extractedJson) {
        const arrayMatch = raw.match(/\[[\s\S]*\]/);
        if (arrayMatch) {
          try {
            extractedJson = JSON.parse(arrayMatch[0]);
            console.log("AI Parser - Successfully extracted JSON array from response");
          } catch (e) {
            console.log("AI Parser - Failed to parse JSON array from response");
          }
        }
      }
      
      // Method 3: Try to clean up common AI response issues
      if (!extractedJson) {
        let cleanedResponse = raw
          .replace(/^[^[]*/, '') // Remove text before first [
          .replace(/[^]*$/, '') // Remove text after last ]
          .replace(/```/g, '') // Remove markdown code blocks
          .replace(/json/g, '') // Remove "json" text
          .trim();
        
        // Ensure it starts and ends with brackets
        if (!cleanedResponse.startsWith('[')) cleanedResponse = '[' + cleanedResponse;
        if (!cleanedResponse.endsWith(']')) cleanedResponse = cleanedResponse + ']';
        
        try {
          extractedJson = JSON.parse(cleanedResponse);
          console.log("AI Parser - Successfully parsed cleaned response");
        } catch (e) {
          console.log("AI Parser - Failed to parse cleaned response");
        }
      }
      
      if (extractedJson) {
        parsed = extractedJson;
        console.log("AI Parser - Using extracted JSON:", parsed);
      } else {
        // If all parsing attempts fail, return detailed error
        console.error("AI Parser - All JSON parsing attempts failed");
        return NextResponse.json(
          {
            error: 'AI response is not valid JSON',
            details: 'Gemini returned invalid JSON and could not be parsed',
            rawContent: raw,
            suggestions: [
              'The AI might have returned text instead of JSON',
              'Check if the AI model is working correctly',
              'Try regenerating the response',
              'Check the raw AI response for formatting issues'
            ]
          },
          { status: 500 }
        );
      }
    }
    
    // Validate the parsed result structure
    if (!Array.isArray(parsed)) {
      console.error("AI Parser - Parsed result is not an array:", parsed);
      return NextResponse.json(
        { 
          error: 'AI response is not in expected format',
          details: 'Expected JSON array but got: ' + typeof parsed,
          parsedContent: parsed
        },
        { status: 500 }
      );
    }
    
    // Post-processing to fix common Indonesian phrases (kemarin, quantity x price)
    function parseIndoNumber(text: string): number | null {
      const t = text.toLowerCase().trim();
      const simple = t.match(/^(\d+[.,]?\d*)$/);
      if (simple) return Number(simple[1].replace(/\./g, '').replace(',', '.'));
      const m = t.match(/(\d+[.,]?\d*)\s*(ribu|rb|k|juta|jt)/);
      if (!m) return null;
      const base = Number(m[1].replace(/\./g, '').replace(',', '.'));
      const unit = m[2];
      if (isNaN(base)) return null;
      if (unit === 'ribu' || unit === 'rb' || unit === 'k') return base * 1000;
      if (unit === 'juta' || unit === 'jt') return base * 1_000_000;
      return base;
    }

    function getYesterdayIsoJakarta(): string {
      const now = new Date();
      // Convert to Asia/Jakarta date by building from locale parts
      const formatter = new Intl.DateTimeFormat('en-CA', {
        timeZone: 'Asia/Jakarta',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
      });
      const [y, m, d] = formatter.format(now).split('-').map(Number);
      const jakartaNow = new Date(Date.UTC(y, (m - 1), d));
      jakartaNow.setUTCDate(jakartaNow.getUTCDate() - 1);
      // set to 12:00 local time to avoid DST issues
      const y2 = jakartaNow.getUTCFullYear();
      const m2 = jakartaNow.getUTCMonth();
      const d2 = jakartaNow.getUTCDate();
      // 12:00 WIB equals 05:00 UTC (WIB=UTC+7). Use 05:00Z.
      const localNoon = new Date(Date.UTC(y2, m2, d2, 5, 0, 0));
      return localNoon.toISOString();
    }

    function getIsoJakartaDaysAgo(days: number): string {
      const now = new Date();
      const formatter = new Intl.DateTimeFormat('en-CA', {
        timeZone: 'Asia/Jakarta',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
      });
      const [y, m, d] = formatter.format(now).split('-').map(Number);
      const jakartaDate = new Date(Date.UTC(y, m - 1, d));
      jakartaDate.setUTCDate(jakartaDate.getUTCDate() - Math.max(0, days));
      // 12:00 WIB = 05:00 UTC
      return new Date(Date.UTC(jakartaDate.getUTCFullYear(), jakartaDate.getUTCMonth(), jakartaDate.getUTCDate(), 5, 0, 0)).toISOString();
    }

    function postProcess(inputText: string, items: any[]): any[] {
      const lower = inputText.toLowerCase();
      const containsKemarin = /\bkemarin\b/.test(lower);
      const daysAgoMatch = lower.match(/(\d+)\s*hari\s*(?:yang|yg)?\s*lalu/);
      // Detect Indonesian numeric dates written day-first, e.g. 2/9/2025 or 02-09
      const numericDateMatch = lower.match(/(?<!\d)([0-3]?\d)[\/.\-\s]([01]?\d)(?:[\/.\-\s](20\d{2}|19\d{2}))?\b/);
      // Detect Indonesian month name dates like "2 september 2025" or "2 sept"
      const monthNames: Record<string, number> = {
        'januari': 1, 'jan': 1,
        'februari': 2, 'feb': 2,
        'maret': 3, 'mar': 3,
        'april': 4, 'apr': 4,
        'mei': 5,
        'juni': 6, 'jun': 6,
        'juli': 7, 'jul': 7,
        'agustus': 8, 'agu': 8, 'ags': 8,
        'september': 9, 'sept': 9, 'sep': 9,
        'oktober': 10, 'okt': 10,
        'november': 11, 'nov': 11,
        'desember': 12, 'des': 12
      };
      const monthNameMatch = lower.match(/\b([0-3]?\d)\s+([a-zA-Z]+)(?:\s+(20\d{2}|19\d{2}))?\b/);

      function isoFromDayFirst(day: number, month: number, year?: number): string | null {
        if (!day || !month) return null;
        const now = new Date();
        const y = year || new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Jakarta', year: 'numeric' })
          .format(now)
          .slice(0, 4);
        const Y = Number(y);
        if (isNaN(Y)) return null;
        // Build 12:00 WIB -> 05:00Z
        const iso = new Date(Date.UTC(Y, Math.max(0, Math.min(11, month - 1)), Math.max(1, Math.min(31, day)), 5, 0, 0)).toISOString();
        return iso;
      }
      
      // Split input into segments per item using comma / 'dan'
      const segments = lower
        .split(/\s*,\s*|\s+dan\s+/)
        .map(s => s.trim())
        .filter(Boolean);

      function normalizeAmount(value: any): number | null {
        if (typeof value === 'number' && isFinite(value)) return Math.round(value);
        if (typeof value === 'string') {
          const m = value.trim().match(/([\d.,]+)\s*(ribu|rb|k|juta|jt)?/i);
          if (!m) return null;
          const base = Number(m[1].replace(/\./g, '').replace(',', '.'));
          const unit = (m[2] || '').toLowerCase();
          if (!isFinite(base)) return null;
          if (unit === 'ribu' || unit === 'rb' || unit === 'k') return Math.round(base * 1000);
          if (unit === 'juta' || unit === 'jt') return Math.round(base * 1_000_000);
          return Math.round(base);
        }
        return null;
      }

      return items.map((it) => {
        const result = { ...it } as any;
        // If user typed explicit day-first date, prefer it over AI's date
        if (numericDateMatch) {
          const d = parseInt(numericDateMatch[1], 10);
          const m = parseInt(numericDateMatch[2], 10);
          const y = numericDateMatch[3] ? parseInt(numericDateMatch[3], 10) : undefined;
          const iso = isoFromDayFirst(d, m, y);
          if (iso) result.created_at = iso;
        } else if (monthNameMatch) {
          const d = parseInt(monthNameMatch[1], 10);
          const name = monthNameMatch[2].toLowerCase();
          const m = monthNames[name];
          const y = monthNameMatch[3] ? parseInt(monthNameMatch[3], 10) : undefined;
          const iso = m ? isoFromDayFirst(d, m, y) : null;
          if (iso) result.created_at = iso;
        }
        // Fix date for "kemarin"
        if (containsKemarin) {
          result.created_at = getYesterdayIsoJakarta();
        }
        if (daysAgoMatch) {
          const n = parseInt(daysAgoMatch[1], 10);
          if (!isNaN(n) && n > 0) {
            result.created_at = getIsoJakartaDaysAgo(n);
          }
        }
        // Try to find a segment that mentions the item description
        const desc = String(it.description || '').toLowerCase();
        const key = desc.split(/\s+/)[0] || desc; // first keyword
        const segment = segments.find(seg => seg.includes(key)) || lower;
        // Extract numeric tokens in order from the segment
        const tokens = Array.from(segment.matchAll(/(\d+(?:[.,]\d+)?)\s*(ribu|rb|k|juta|jt)?/g))
          .map(m => ({
            raw: m[0],
            num: Number(m[1].replace(/\./g, '').replace(',', '.')),
            unit: (m[2] || '').toLowerCase()
          }));
        // Removed quantity logic; always treat numeric as total amount only
        // If only a single numeric token exists, treat it as the total amount (no qty)
        if ((!result.amount || !isFinite(result.amount)) && tokens.length === 1) {
          const t0 = tokens[0];
          const val = parseIndoNumber(`${t0.num}${t0.unit ? ' ' + t0.unit : ''}`) ?? t0.num;
          if (Number.isFinite(val)) {
            result.amount = Math.round(Number(val));
          }
        }

        // No qty×price inference anymore
        // Normalize amount if it's string or malformed
        if (typeof result.amount !== 'number' || !isFinite(result.amount)) {
          const normalized = normalizeAmount(result.amount);
          if (normalized) result.amount = normalized;
        }

        // Avoid mistakenly picking dates (e.g., 2022) as amounts.
        // Only use a lone plain integer when there is NO currency word and NO thousand separator pattern
        // and we still don't have a valid amount.
        if (!(Number.isFinite(result.amount) && result.amount > 0)) {
          const hasCurrencyWord = /\brp\b/.test(segment);
          const hasThousandsPattern = /\b\d{1,3}(?:\.\d{3})+\b/.test(segment);
          if (!hasCurrencyWord && !hasThousandsPattern) {
            const plainIntMatch = segment.match(/\b(\d{1,7})(?![\d.,]*\s*(ribu|rb|k|juta|jt))\b/);
            if (plainIntMatch) {
              const n = Number(plainIntMatch[1]);
              if (n > 0 && n <= 10000000) {
                result.amount = n;
              }
            }
          }
        }

        // Default type/category if missing
        if (!result.type) result.type = 'expense';
        if (!result.category) result.category = 'Lainnya';
        return result;
      });
    }

    // Validate each item in the array then apply post-processing
    for (let i = 0; i < parsed.length; i++) {
      const item = parsed[i];
      if (!item.description || typeof item.amount !== 'number') {
        console.error(`AI Parser - Invalid item at index ${i}:`, item);
        return NextResponse.json(
          { 
            error: 'AI response contains invalid transaction items',
            details: `Item at index ${i} is missing required fields`,
            invalidItem: item,
            expectedFormat: {
              description: 'string (required)',
              amount: 'number (required)',
              quantity: 'number (optional)',
              category: 'string (optional)',
              type: '"income" or "expense" (optional)'
            }
          },
          { status: 500 }
        );
      }
    }

    const finalized = postProcess(sanitizedInput, parsed);
    console.log("AI Parser - Final validated result for user:", userId, "Result:", finalized);

    // Optional: insert directly to DB if requested
    if (insert) {
      try {
        const supabaseInsert = createClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
        );

        const rows = finalized.map((it: any) => ({
          description: String(it.description || ''),
          amount: Number(it.amount || 0),
          category: String(it.category || 'Lainnya'),
          type: (it.type === 'income' ? 'income' : 'expense') as 'income' | 'expense',
          // Use DB now() for OCR flow if ocrNow=true, otherwise honor AI date if present
          ...(ocrNow ? {} : (it.created_at ? { created_at: it.created_at } : {})),
          user_id: userId,
        }));

        const { error: insertError } = await supabaseInsert
          .from('transactions')
          .insert(rows);

        if (insertError) {
          console.error('AI Parser - Insert error:', insertError);
          return NextResponse.json(
            { error: 'Failed to insert transactions', details: insertError.message, result: finalized },
            { status: 500 }
          );
        }

        return NextResponse.json({ result: finalized, inserted: rows.length });
      } catch (e) {
        console.error('AI Parser - Unexpected insert exception:', e);
        return NextResponse.json(
          { error: 'Unexpected insert failure', details: e instanceof Error ? e.message : String(e), result: finalized },
          { status: 500 }
        );
      }
    }

    return NextResponse.json({ result: finalized });
  } catch (error) {
    console.error("AI Parser - Unexpected error:", error);
    return NextResponse.json(
      { 
        error: 'Failed to parse transaction',
        details: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      },
      { status: 500 }
    );
  }
}
