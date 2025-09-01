# PowerShell Script untuk Fix Error 500 - Environment Variables
# Jalankan script ini untuk mengatasi error 500

Write-Host "🔧 Fix Error 500 - Environment Variables" -ForegroundColor Green
Write-Host "=========================================" -ForegroundColor Green

# Check if .env.local exists
if (Test-Path ".env.local") {
    Write-Host "📁 File .env.local ditemukan" -ForegroundColor Yellow
    
    # Read current content
    $content = Get-Content ".env.local" -Raw
    
    # Check current environment variables
    Write-Host "🔍 Environment Variables saat ini:" -ForegroundColor Cyan
    
    if ($content -match "NEXT_PUBLIC_OPENROUTER_KEY") {
        $match = [regex]::Match($content, "NEXT_PUBLIC_OPENROUTER_KEY=(.+)")
        if ($match.Success) {
            $apiKey = $match.Groups[1].Value.Trim()
            Write-Host "❌ NEXT_PUBLIC_OPENROUTER_KEY: $($apiKey.Substring(0, 10))..." -ForegroundColor Red
            Write-Host "   ⚠️  Ini TIDAK AMAN dan menyebabkan error!" -ForegroundColor Red
        }
    } else {
        Write-Host "✅ NEXT_PUBLIC_OPENROUTER_KEY: Tidak ada" -ForegroundColor Green
    }
    
    if ($content -match "OPENROUTER_KEY") {
        $match = [regex]::Match($content, "OPENROUTER_KEY=(.+)")
        if ($match.Success) {
            $apiKey = $match.Groups[1].Value.Trim()
            Write-Host "✅ OPENROUTER_KEY: $($apiKey.Substring(0, 10))..." -ForegroundColor Green
            Write-Host "   📏 Length: $($apiKey.Length) characters" -ForegroundColor Yellow
            
            # Validate format
            if ($apiKey.StartsWith("sk-or-v1-")) {
                Write-Host "   ✅ Format: Valid (starts with sk-or-v1-)" -ForegroundColor Green
            } else {
                Write-Host "   ❌ Format: Invalid (should start with sk-or-v1-)" -ForegroundColor Red
            }
            
            if ($apiKey.Length -ge 50) {
                Write-Host "   ✅ Length: Valid (>= 50 characters)" -ForegroundColor Green
            } else {
                Write-Host "   ❌ Length: Invalid (< 50 characters)" -ForegroundColor Red
            }
        }
    } else {
        Write-Host "❌ OPENROUTER_KEY: Tidak ada" -ForegroundColor Red
        Write-Host "   ⚠️  Ini yang menyebabkan error 500!" -ForegroundColor Red
    }
    
    # Auto-fix if possible
    if ($content -match "NEXT_PUBLIC_OPENROUTER_KEY" -and -not ($content -match "OPENROUTER_KEY")) {
        Write-Host ""
        Write-Host "🔄 Auto-fix tersedia!" -ForegroundColor Yellow
        
        $choice = Read-Host "Apakah Anda ingin otomatis mengganti NEXT_PUBLIC_OPENROUTER_KEY dengan OPENROUTER_KEY? (y/n)"
        
        if ($choice -eq "y" -or $choice -eq "Y") {
            # Extract the API key
            $match = [regex]::Match($content, "NEXT_PUBLIC_OPENROUTER_KEY=(.+)")
            if ($match.Success) {
                $apiKey = $match.Groups[1].Value.Trim()
                
                # Create backup
                Copy-Item ".env.local" ".env.local.backup"
                Write-Host "💾 Backup dibuat: .env.local.backup" -ForegroundColor Green
                
                # Replace the line
                $newContent = $content -replace "NEXT_PUBLIC_OPENROUTER_KEY=.+", "OPENROUTER_KEY=$apiKey"
                
                # Write back
                Set-Content ".env.local" $newContent -NoNewline
                Write-Host "✅ NEXT_PUBLIC_OPENROUTER_KEY berhasil diganti dengan OPENROUTER_KEY" -ForegroundColor Green
                Write-Host "🔑 API Key: $($apiKey.Substring(0, 10))..." -ForegroundColor Yellow
            }
        }
    } elseif (-not ($content -match "OPENROUTER_KEY")) {
        Write-Host ""
        Write-Host "❌ Tidak ada API key yang tersedia!" -ForegroundColor Red
        Write-Host "   Anda perlu menambahkan OPENROUTER_KEY secara manual" -ForegroundColor Yellow
        
        $choice = Read-Host "Apakah Anda ingin saya buatkan template .env.local yang benar? (y/n)"
        
        if ($choice -eq "y" -or $choice -eq "Y") {
            # Create backup
            Copy-Item ".env.local" ".env.local.backup"
            Write-Host "💾 Backup dibuat: .env.local.backup" -ForegroundColor Green
            
            # Create new .env.local with correct format
            $newContent = @"
# OpenRouter API Key (server-side only, NOT exposed to client)
OPENROUTER_KEY=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

# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url_here
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key_here

# OLD (INSECURE) - Remove this line:
# NEXT_PUBLIC_OPENROUTER_KEY=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
"@
            
            Set-Content ".env.local" $newContent
            Write-Host "✅ File .env.local telah dibuat ulang dengan format yang benar" -ForegroundColor Green
            Write-Host "⚠️  Jangan lupa update Supabase credentials!" -ForegroundColor Yellow
        }
    }
    
} else {
    Write-Host "❌ File .env.local tidak ditemukan!" -ForegroundColor Red
    Write-Host ""
    
    $choice = Read-Host "Apakah Anda ingin saya buatkan file .env.local? (y/n)"
    
    if ($choice -eq "y" -or $choice -eq "Y") {
        $newContent = @"
# OpenRouter API Key (server-side only, NOT exposed to client)
OPENROUTER_KEY=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

# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url_here
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key_here
"@
        
        Set-Content ".env.local" $newContent
        Write-Host "✅ File .env.local telah dibuat" -ForegroundColor Green
        Write-Host "⚠️  Jangan lupa update Supabase credentials!" -ForegroundColor Yellow
    }
}

Write-Host ""
Write-Host "📋 Langkah selanjutnya:" -ForegroundColor Green
Write-Host "1. Pastikan OPENROUTER_KEY sudah ada (TANPA prefix NEXT_PUBLIC_)" -ForegroundColor Cyan
Write-Host "2. Restart development server: npm run dev" -ForegroundColor Cyan
Write-Host "3. Test AI features" -ForegroundColor Cyan
Write-Host "4. Check terminal untuk log messages yang detail" -ForegroundColor Cyan

Write-Host ""
Write-Host "🔍 Debugging yang Sudah Ditambahkan:" -ForegroundColor Green
Write-Host "- API route sekarang memiliki logging yang sangat detail" -ForegroundColor Cyan
Write-Host "- Check terminal untuk melihat environment variable status" -ForegroundColor Cyan
Write-Host "- Error 500 akan memberikan detail yang lebih jelas" -ForegroundColor Cyan

Write-Host ""
Write-Host "⚠️  PENTING:" -ForegroundColor Red
Write-Host "- JANGAN gunakan NEXT_PUBLIC_OPENROUTER_KEY" -ForegroundColor Red
Write-Host "- Gunakan OPENROUTER_KEY (tanpa prefix)" -ForegroundColor Red
Write-Host "- Restart server setelah mengubah environment variables" -ForegroundColor Red
Write-Host "- Check terminal untuk log messages detail" -ForegroundColor Red

Write-Host ""
Write-Host "✅ Script fix selesai!" -ForegroundColor Green
