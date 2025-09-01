import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { input } = await request.json();

    if (!input || typeof input !== 'string') {
      console.error("AI Parser - Invalid input:", input);
      return NextResponse.json(
        { error: 'Input text is required' },
        { status: 400 }
      );
    }

    console.log("AI Parser - Processing input:", input);
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
            content: input,
          },
        ],
      }),
    });

    if (!res.ok) {
      const errorText = await res.text();
      console.error("AI Parser - OpenRouter API error:", res.status, errorText);
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
    
    console.log("AI Parser - Final validated result:", parsed);
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
