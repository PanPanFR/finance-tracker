# PowerShell Script untuk Update Environment Variables
# Jalankan script ini untuk mengamankan API key OpenRouter

Write-Host "🔒 Security Fix: Hiding OpenRouter API Key" -ForegroundColor Green
Write-Host "=============================================" -ForegroundColor Green

# Check if .env.local exists
if (Test-Path ".env.local") {
    Write-Host "📁 File .env.local ditemukan" -ForegroundColor Yellow
    
    # Read current content
    $content = Get-Content ".env.local" -Raw
    
    # Check if NEXT_PUBLIC_OPENROUTER_KEY exists
    if ($content -match "NEXT_PUBLIC_OPENROUTER_KEY") {
        Write-Host "⚠️  NEXT_PUBLIC_OPENROUTER_KEY ditemukan (TIDAK AMAN!)" -ForegroundColor Red
        
        # Extract the API key
        $match = [regex]::Match($content, "NEXT_PUBLIC_OPENROUTER_KEY=(.+)")
        if ($match.Success) {
            $apiKey = $match.Groups[1].Value.Trim()
            Write-Host "🔑 API Key: $apiKey" -ForegroundColor Yellow
            
            # Create backup
            Copy-Item ".env.local" ".env.local.backup"
            Write-Host "💾 Backup dibuat: .env.local.backup" -ForegroundColor Green
            
            # Replace the line
            $newContent = $content -replace "NEXT_PUBLIC_OPENROUTER_KEY=.+", "OPENROUTER_KEY=$apiKey"
            
            # Write back
            Set-Content ".env.local" $newContent -NoNewline
            Write-Host "✅ NEXT_PUBLIC_OPENROUTER_KEY diganti dengan OPENROUTER_KEY" -ForegroundColor Green
        }
    } else {
        Write-Host "✅ NEXT_PUBLIC_OPENROUTER_KEY tidak ditemukan" -ForegroundColor Green
    }
    
    # Check if OPENROUTER_KEY exists
    if ($content -match "OPENROUTER_KEY") {
        Write-Host "✅ OPENROUTER_KEY sudah ada" -ForegroundColor Green
    } else {
        Write-Host "❌ OPENROUTER_KEY belum ada" -ForegroundColor Red
        Write-Host "   Tambahkan: OPENROUTER_KEY=your_api_key_here" -ForegroundColor Yellow
    }
} else {
    Write-Host "❌ File .env.local tidak ditemukan" -ForegroundColor Red
    Write-Host "   Buat file .env.local dengan konfigurasi berikut:" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "   OPENROUTER_KEY=your_openrouter_api_key_here" -ForegroundColor Cyan
    Write-Host "   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url" -ForegroundColor Cyan
    Write-Host "   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key" -ForegroundColor Cyan
    Write-Host "   SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key" -ForegroundColor Cyan
}

Write-Host ""
Write-Host "📋 Langkah selanjutnya:" -ForegroundColor Green
Write-Host "1. Restart development server: npm run dev" -ForegroundColor Cyan
Write-Host "2. Test AI features berfungsi normal" -ForegroundColor Cyan
Write-Host "3. Update Vercel environment variables jika deploy" -ForegroundColor Cyan
Write-Host "4. Hapus NEXT_PUBLIC_OPENROUTER_KEY dari Vercel" -ForegroundColor Cyan
Write-Host "5. Tambahkan OPENROUTER_KEY ke Vercel" -ForegroundColor Cyan

Write-Host ""
Write-Host "🔍 Verifikasi keamanan:" -ForegroundColor Green
Write-Host "- Buka Developer Tools → Network tab" -ForegroundColor Cyan
Write-Host "- Lakukan transaksi atau tanya AI" -ForegroundColor Cyan
Write-Host "- TIDAK ADA LAGI request ke openrouter.ai yang terlihat" -ForegroundColor Cyan
Write-Host "- Yang terlihat hanya request ke /api/ai/parse dan /api/ai/report" -ForegroundColor Cyan

Write-Host ""
Write-Host "✅ Security fix selesai!" -ForegroundColor Green
