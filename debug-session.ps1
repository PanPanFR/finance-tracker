# PowerShell Script untuk Debug Session Token
# Jalankan script ini untuk debug masalah 401 Authentication

Write-Host "🔍 Debug Session Token" -ForegroundColor Green
Write-Host "=====================" -ForegroundColor Green

Write-Host ""
Write-Host "🚨 Masalah yang Ditemukan:" -ForegroundColor Red
Write-Host "Error: 401 Unauthorized - Authentication required" -ForegroundColor Yellow
Write-Host "Ini berarti session token tidak valid atau tidak terkirim dengan benar" -ForegroundColor Cyan

Write-Host ""
Write-Host "🔍 Langkah Debug:" -ForegroundColor Green

Write-Host "1. ✅ Check Browser Console:" -ForegroundColor Cyan
Write-Host "   - Buka Developer Tools (F12)" -ForegroundColor White
Write-Host "   - Buka tab Console" -ForegroundColor White
Write-Host "   - Cari log 'AI Parser - Making authenticated API call...'" -ForegroundColor White

Write-Host ""
Write-Host "2. ✅ Check Network Tab:" -ForegroundColor Cyan
Write-Host "   - Buka tab Network" -ForegroundColor White
Write-Host "   - Cari request ke /api/ai/parse" -ForegroundColor White
Write-Host "   - Check Headers > Authorization" -ForegroundColor White

Write-Host ""
Write-Host "3. ✅ Check Session Token:" -ForegroundColor Cyan
Write-Host "   - Buka tab Console" -ForegroundColor White
Write-Host "   - Jalankan command ini:" -ForegroundColor White
Write-Host "   await supabase.auth.getSession()" -ForegroundColor Yellow

Write-Host ""
Write-Host "🔧 Kemungkinan Penyebab:" -ForegroundColor Green

Write-Host "1. 🔴 Session Expired:" -ForegroundColor Red
Write-Host "   - Token sudah expire (1 jam)" -ForegroundColor Yellow
Write-Host "   - User perlu login ulang" -ForegroundColor Yellow

Write-Host ""
Write-Host "2. 🔴 Token Format Salah:" -ForegroundColor Red
Write-Host "   - Token tidak dalam format Bearer" -ForegroundColor Yellow
Write-Host "   - Token kosong atau undefined" -ForegroundColor Yellow

Write-Host ""
Write-Host "3. 🔴 Supabase Client Issue:" -ForegroundColor Red
Write-Host "   - Supabase client tidak terkonfigurasi" -ForegroundColor Yellow
Write-Host "   - Environment variables salah" -ForegroundColor Yellow

Write-Host ""
Write-Host "4. 🔴 CORS Issue:" -ForegroundColor Red
Write-Host "   - Request dari domain yang tidak diizinkan" -ForegroundColor Yellow
Write-Host "   - CORS policy blocking request" -ForegroundColor Yellow

Write-Host ""
Write-Host "🔍 Debug Commands:" -ForegroundColor Green

Write-Host "Check session di browser console:" -ForegroundColor Cyan
Write-Host "await supabase.auth.getSession()" -ForegroundColor Yellow

Write-Host ""
Write-Host "Check user login status:" -ForegroundColor Cyan
Write-Host "await supabase.auth.getUser()" -ForegroundColor Yellow

Write-Host ""
Write-Host "Check environment variables:" -ForegroundColor Cyan
Write-Host "console.log('SUPABASE_URL:', process.env.NEXT_PUBLIC_SUPABASE_URL)" -ForegroundColor Yellow

Write-Host ""
Write-Host "📱 Test Cases:" -ForegroundColor Green

Write-Host "Test 1: Check Session" -ForegroundColor Cyan
Write-Host "   - Login ke aplikasi" -ForegroundColor White
Write-Host "   - Buka console, jalankan: await supabase.auth.getSession()" -ForegroundColor White
Write-Host "   - Expected: { data: { session: { access_token: '...' } } }" -ForegroundColor White

Write-Host ""
Write-Host "Test 2: Check Token Format" -ForegroundColor Cyan
Write-Host "   - Token harus dimulai dengan 'eyJ'" -ForegroundColor White
Write-Host "   - Token harus panjang (minimal 100 karakter)" -ForegroundColor White
Write-Host "   - Token tidak boleh undefined atau null" -ForegroundColor White

Write-Host ""
Write-Host "Test 3: Manual API Call" -ForegroundColor Cyan
Write-Host "   - Copy token dari session" -ForegroundColor White
Write-Host "   - Test dengan curl atau Postman" -ForegroundColor White
Write-Host "   - Expected: 200 OK, bukan 401" -ForegroundColor White

Write-Host ""
Write-Host "⚠️  PENTING:" -ForegroundColor Red
Write-Host "- Pastikan user sudah login" -ForegroundColor Red
Write-Host "- Check session tidak expired" -ForegroundColor Red
Write-Host "- Token format harus benar" -ForegroundColor Red
Write-Host "- CORS policy harus sesuai" -ForegroundColor Red

Write-Host ""
Write-Host "🎯 Hasil yang Diharapkan:" -ForegroundColor Green
Write-Host "Setelah debug:" -ForegroundColor Cyan
Write-Host "- Session token valid dan terkirim" -ForegroundColor White
Write-Host "- API call berhasil (200 OK)" -ForegroundColor White
Write-Host "- AI parsing berfungsi normal" -ForegroundColor White
Write-Host "- Error 401 hilang" -ForegroundColor White

Write-Host ""
Write-Host "✅ Script debug selesai!" -ForegroundColor Green
Write-Host "Sekarang check session token di browser console!" -ForegroundColor Cyan
