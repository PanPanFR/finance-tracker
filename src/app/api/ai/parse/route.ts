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
      'https://finance-tracker-mu-five-89.vercel.app',
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
    const { input } = await request.json();

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

    console.log("AI Parser - Processing input for user:", userId, "Input:", sanitizedInput);
    
    console.log("AI Parser - Environment check:", {
      hasOpenRouterKey: !!process.env.OPENROUTER_KEY,
      openRouterKeyLength: process.env.OPENROUTER_KEY?.length || 0,
      openRouterKeyPrefix: process.env.OPENROUTER_KEY?.substring(0, 10) || 'N/A'
    });

    if (!process.env.OPENROUTER_KEY) {
      console.error("AI Parser - Missing OPENROUTER_KEY environment variable");
      return NextResponse.json(
        { 
          error: 'OpenRouter API key not configured',
          details: 'Please set OPENROUTER_KEY environment variable (not NEXT_PUBLIC_OPENROUTER_KEY)'
        },
        { status: 500 }
      );
    }

    console.log("AI Parser - Making request to OpenRouter...");
    
    const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.OPENROUTER_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "meta-llama/llama-3.3-8b-instruct:free",
        messages: [
          {
            role: "system",
            content: `Kamu adalah API parser transaksi.
            Output HANYA dalam format JSON array, bahkan jika hanya 1 item.
            Format: [{ description: string, amount: number (selalu TOTAL harga), quantity?: number, created_at?: string (ISO 8601), category?: string, type?: "income" | "expense" }]
            - description: nama barang/aktivitas/merchant, misal "KRL", "Starbucks", "Shopee", "Listrik PLN", "Grab", "Indomaret", "Bensin", "Netflix", "BPJS", dst. Jangan isi dengan kategori.
            - category: salah satu dari: 'Makanan & Minuman', 'Transportasi', 'Tagihan', 'Hiburan', 'Belanja', 'Kesehatan', 'Pendidikan', 'Lainnya'.
            - type: klasifikasikan 'income' (pemasukan) vs 'expense' (pengeluaran). Contoh income: gaji, bonus, refund, transfer masuk, jual barang. Selain itu anggap 'expense'.
            - 'amount' HARUS total harga. JANGAN harga satuan.
            - Jika ada waktu (misal: 'kemarin', 'tadi pagi jam 7'), konversi ke ISO 8601. Zona waktu: Asia/Jakarta (WIB/GMT+7).
              - pagi: 05:00-10:00
              - siang: 11:00-14:00
              - sore: 15:00-18:00
              - malam: 19:00-23:00
            - Jika ada beberapa barang (misal: 'A dan B'), pisahkan jadi beberapa objek dalam array.
            - Jika tidak yakin, gunakan 'Lainnya' untuk category dan 'expense' untuk type.
            - Waktu sekarang (WIB): ${new Date().toLocaleString('en-US', { timeZone: 'Asia/Jakarta' })}`,
          },
          {
            role: "user",
            content: sanitizedInput,
          },
        ],
      }),
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
    console.log("AI Parser - OpenRouter response received");
    
    if (!data.choices || !data.choices[0] || !data.choices[0].message) {
      console.error("AI Parser - Invalid OpenRouter response format:", data);
      return NextResponse.json(
        { error: 'Invalid API response format from OpenRouter' },
        { status: 500 }
      );
    }
    
    const raw = data.choices[0].message.content;
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
            details: 'The AI returned invalid JSON format and could not be parsed',
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
    
    // Validate each item in the array
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
    
    console.log("AI Parser - Final validated result for user:", userId, "Result:", parsed);
    return NextResponse.json({ result: parsed });
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
