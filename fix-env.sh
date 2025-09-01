#!/bin/bash

# Bash Script untuk Fix Environment Variables Error
# Jalankan script ini untuk mengatasi error 500

echo "🔧 Fix Environment Variables Error"
echo "==================================="

# Check if .env.local exists
if [ -f ".env.local" ]; then
    echo "📁 File .env.local ditemukan"
    
    # Check current environment variables
    echo "🔍 Environment Variables saat ini:"
    
    if grep -q "NEXT_PUBLIC_OPENROUTER_KEY" ".env.local"; then
        API_KEY=$(grep "NEXT_PUBLIC_OPENROUTER_KEY" ".env.local" | cut -d'=' -f2)
        echo "❌ NEXT_PUBLIC_OPENROUTER_KEY: ${API_KEY:0:10}..."
        echo "   ⚠️  Ini TIDAK AMAN dan menyebabkan error!"
    else
        echo "✅ NEXT_PUBLIC_OPENROUTER_KEY: Tidak ada"
    fi
    
    if grep -q "OPENROUTER_KEY" ".env.local"; then
        API_KEY=$(grep "OPENROUTER_KEY" ".env.local" | cut -d'=' -f2)
        echo "✅ OPENROUTER_KEY: ${API_KEY:0:10}..."
    else
        echo "❌ OPENROUTER_KEY: Tidak ada"
        echo "   ⚠️  Ini yang menyebabkan error 500!"
    fi
    
    # Auto-fix if possible
    if grep -q "NEXT_PUBLIC_OPENROUTER_KEY" ".env.local" && ! grep -q "OPENROUTER_KEY" ".env.local"; then
        echo ""
        echo "🔄 Auto-fix tersedia!"
        
        read -p "Apakah Anda ingin otomatis mengganti NEXT_PUBLIC_OPENROUTER_KEY dengan OPENROUTER_KEY? (y/n): " choice
        
        if [ "$choice" = "y" ] || [ "$choice" = "Y" ]; then
            # Extract the API key
            API_KEY=$(grep "NEXT_PUBLIC_OPENROUTER_KEY" ".env.local" | cut -d'=' -f2)
            
            # Create backup
            cp ".env.local" ".env.local.backup"
            echo "💾 Backup dibuat: .env.local.backup"
            
            # Replace the line
            sed -i "s/NEXT_PUBLIC_OPENROUTER_KEY=.*/OPENROUTER_KEY=$API_KEY/" ".env.local"
            echo "✅ NEXT_PUBLIC_OPENROUTER_KEY berhasil diganti dengan OPENROUTER_KEY"
            echo "🔑 API Key: ${API_KEY:0:10}..."
        fi
    elif ! grep -q "OPENROUTER_KEY" ".env.local"; then
        echo ""
        echo "❌ Tidak ada API key yang tersedia!"
        echo "   Anda perlu menambahkan OPENROUTER_KEY secara manual"
    fi
    
else
    echo "❌ File .env.local tidak ditemukan!"
    echo ""
    echo "📝 Buat file .env.local dengan konfigurasi berikut:"
    echo ""
    echo "   # HAPUS prefix NEXT_PUBLIC_ untuk API key!"
    echo "   OPENROUTER_KEY=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"
    echo "   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url"
    echo "   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key"
    echo "   SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key"
fi

echo ""
echo "📋 Langkah selanjutnya:"
echo "1. Pastikan OPENROUTER_KEY sudah ada (TANPA prefix NEXT_PUBLIC_)"
echo "2. Restart development server: npm run dev"
echo "3. Test AI features"
echo "4. Check console untuk error messages yang lebih detail"

echo ""
echo "🔍 Debugging:"
echo "- API route sekarang memiliki logging yang lebih detail"
echo "- Check terminal/server console untuk log messages"
echo "- Error 500 seharusnya memberikan detail yang lebih jelas"

echo ""
echo "⚠️  PENTING:"
echo "- JANGAN gunakan NEXT_PUBLIC_OPENROUTER_KEY"
echo "- Gunakan OPENROUTER_KEY (tanpa prefix)"
echo "- Restart server setelah mengubah environment variables"

echo ""
echo "✅ Script selesai!"
