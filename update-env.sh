#!/bin/bash

# Bash Script untuk Update Environment Variables
# Jalankan script ini untuk mengamankan API key OpenRouter

echo "🔒 Security Fix: Hiding OpenRouter API Key"
echo "============================================="

# Check if .env.local exists
if [ -f ".env.local" ]; then
    echo "📁 File .env.local ditemukan"
    
    # Check if NEXT_PUBLIC_OPENROUTER_KEY exists
    if grep -q "NEXT_PUBLIC_OPENROUTER_KEY" ".env.local"; then
        echo "⚠️  NEXT_PUBLIC_OPENROUTER_KEY ditemukan (TIDAK AMAN!)"
        
        # Extract the API key
        API_KEY=$(grep "NEXT_PUBLIC_OPENROUTER_KEY" ".env.local" | cut -d'=' -f2)
        echo "🔑 API Key: $API_KEY"
        
        # Create backup
        cp ".env.local" ".env.local.backup"
        echo "💾 Backup dibuat: .env.local.backup"
        
        # Replace the line
        sed -i "s/NEXT_PUBLIC_OPENROUTER_KEY=.*/OPENROUTER_KEY=$API_KEY/" ".env.local"
        echo "✅ NEXT_PUBLIC_OPENROUTER_KEY diganti dengan OPENROUTER_KEY"
    else
        echo "✅ NEXT_PUBLIC_OPENROUTER_KEY tidak ditemukan"
    fi
    
    # Check if OPENROUTER_KEY exists
    if grep -q "OPENROUTER_KEY" ".env.local"; then
        echo "✅ OPENROUTER_KEY sudah ada"
    else
        echo "❌ OPENROUTER_KEY belum ada"
        echo "   Tambahkan: OPENROUTER_KEY=your_api_key_here"
    fi
else
    echo "❌ File .env.local tidak ditemukan"
    echo "   Buat file .env.local dengan konfigurasi berikut:"
    echo ""
    echo "   OPENROUTER_KEY=your_openrouter_api_key_here"
    echo "   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url"
    echo "   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key"
    echo "   SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key"
fi

echo ""
echo "📋 Langkah selanjutnya:"
echo "1. Restart development server: npm run dev"
echo "2. Test AI features berfungsi normal"
echo "3. Update Vercel environment variables jika deploy"
echo "4. Hapus NEXT_PUBLIC_OPENROUTER_KEY dari Vercel"
echo "5. Tambahkan OPENROUTER_KEY ke Vercel"

echo ""
echo "🔍 Verifikasi keamanan:"
echo "- Buka Developer Tools → Network tab"
echo "- Lakukan transaksi atau tanya AI"
echo "- TIDAK ADA LAGI request ke openrouter.ai yang terlihat"
echo "- Yang terlihat hanya request ke /api/ai/parse dan /api/ai/report"

echo ""
echo "✅ Security fix selesai!"
