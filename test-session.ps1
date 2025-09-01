# PowerShell Script untuk Test Session Token
# Jalankan script ini untuk test session authentication

Write-Host "🧪 Test Session Token" -ForegroundColor Green
Write-Host "====================" -ForegroundColor Green

Write-Host ""
Write-Host "🎯 Tujuan Test:" -ForegroundColor Cyan
Write-Host "Memverifikasi session token berfungsi dengan benar" -ForegroundColor White
Write-Host "Memastikan API call berhasil dengan authentication" -ForegroundColor White

Write-Host ""
Write-Host "🚀 Langkah Test:" -ForegroundColor Green

Write-Host "1. ✅ Login ke Aplikasi:" -ForegroundColor Cyan
Write-Host "   - Buka aplikasi di browser" -ForegroundColor White
Write-Host "   - Login dengan email/password" -ForegroundColor White
Write-Host "   - Pastikan status 'Logged In'" -ForegroundColor White

Write-Host ""
Write-Host "2. ✅ Check Session di Console:" -ForegroundColor Cyan
Write-Host "   - Buka Developer Tools (F12)" -ForegroundColor White
Write-Host "   - Buka tab Console" -ForegroundColor White
Write-Host "   - Jalankan command ini:" -ForegroundColor White
Write-Host "   await supabase.auth.getSession()" -ForegroundColor Yellow

Write-Host ""
Write-Host "3. ✅ Verifikasi Token:" -ForegroundColor Cyan
Write-Host "   - Token harus ada (tidak null)" -ForegroundColor White
Write-Host "   - Token harus dimulai dengan 'eyJ'" -ForegroundColor White
Write-Host "   - Token harus panjang (minimal 100 karakter)" -ForegroundColor White

Write-Host ""
Write-Host "4. ✅ Test AI Parsing:" -ForegroundColor Cyan
Write-Host "   - Ketik: 'beli bakso 5000'" -ForegroundColor White
Write-Host "   - Klik 'Kirim'" -ForegroundColor White
Write-Host "   - Check console untuk log messages" -ForegroundColor White

Write-Host ""
Write-Host "🔍 Expected Console Logs:" -ForegroundColor Green

Write-Host "✅ Session Check:" -ForegroundColor Cyan
Write-Host "   'AI Parser - Getting session token...'" -ForegroundColor White
Write-Host "   'AI Parser - Session found: { hasToken: true, tokenLength: XXX, ... }'" -ForegroundColor White

Write-Host ""
Write-Host "✅ API Call:" -ForegroundColor Cyan
Write-Host "   'AI Parser - Making authenticated API call to backend...'" -ForegroundColor White
Write-Host "   'AI Parser - API response data: { result: [...] }'" -ForegroundColor White

Write-Host ""
Write-Host "✅ Success:" -ForegroundColor Cyan
Write-Host "   'AI Parser - Final result: [...]'" -ForegroundColor White
Write-Host "   'AI parsing result: [...]'" -ForegroundColor White

Write-Host ""
Write-Host "🔴 Error Cases:" -ForegroundColor Red

Write-Host "❌ No Session:" -ForegroundColor Red
Write-Host "   'AI Parser - No session found'" -ForegroundColor Yellow
Write-Host "   'Authentication required. Please login first.'" -ForegroundColor Yellow

Write-Host ""
Write-Host "❌ No Token:" -ForegroundColor Red
Write-Host "   'AI Parser - No access token in session'" -ForegroundColor Yellow
Write-Host "   'Authentication required. Please login first.'" -ForegroundColor Yellow

Write-Host ""
Write-Host "❌ API Error:" -ForegroundColor Red
Write-Host "   'AI Parser - API response not ok: 401'" -ForegroundColor Yellow
Write-Host "   'Authentication failed. Please login again.'" -ForegroundColor Yellow

Write-Host ""
Write-Host "🔧 Troubleshooting:" -ForegroundColor Green

Write-Host "1. 🔴 Jika 'No session found':" -ForegroundColor Red
Write-Host "   - User belum login" -ForegroundColor Yellow
Write-Host "   - Session expired" -ForegroundColor Yellow
Write-Host "   - Supabase client error" -ForegroundColor Yellow

Write-Host ""
Write-Host "2. 🔴 Jika 'No access token':" -ForegroundColor Red
Write-Host "   - Session corrupted" -ForegroundColor Yellow
Write-Host "   - Token expired" -ForegroundColor Yellow
Write-Host "   - Auth state sync issue" -ForegroundColor Yellow

Write-Host ""
Write-Host "3. 🔴 Jika '401 Unauthorized':" -ForegroundColor Red
Write-Host "   - Token format salah" -ForegroundColor Yellow
Write-Host "   - Server-side validation failed" -ForegroundColor Yellow
Write-Host "   - CORS issue" -ForegroundColor Yellow

Write-Host ""
Write-Host "📱 Manual Test Commands:" -ForegroundColor Green

Write-Host "Check session:" -ForegroundColor Cyan
Write-Host "await supabase.auth.getSession()" -ForegroundColor Yellow

Write-Host ""
Write-Host "Check user:" -ForegroundColor Cyan
Write-Host "await supabase.auth.getUser()" -ForegroundColor Yellow

Write-Host ""
Write-Host "Check auth state:" -ForegroundColor Cyan
Write-Host "await supabase.auth.getSession()" -ForegroundColor Yellow

Write-Host ""
Write-Host "⚠️  PENTING:" -ForegroundColor Red
Write-Host "- Pastikan user sudah login" -ForegroundColor Red
Write-Host "- Check console untuk error messages" -ForegroundColor Red
Write-Host "- Verify token format dan length" -ForegroundColor Red
Write-Host "- Test dengan input sederhana dulu" -ForegroundColor Red

Write-Host ""
Write-Host "🎯 Hasil yang Diharapkan:" -ForegroundColor Green
Write-Host "Setelah test:" -ForegroundColor Cyan
Write-Host "- Session token valid dan terkirim" -ForegroundColor White
Write-Host "- API call berhasil (200 OK)" -ForegroundColor White
Write-Host "- AI parsing berfungsi normal" -ForegroundColor White
Write-Host "- Error 401 hilang" -ForegroundColor White

Write-Host ""
Write-Host "✅ Script test selesai!" -ForegroundColor Green
Write-Host "Sekarang test session token di browser!" -ForegroundColor Cyan
