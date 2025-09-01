# PowerShell Script untuk Test AI Response Parsing
# Jalankan script ini untuk debug masalah JSON parsing

Write-Host "🧪 Test AI Response Parsing" -ForegroundColor Green
Write-Host "============================" -ForegroundColor Green

Write-Host "🔍 Masalah yang Ditemukan:" -ForegroundColor Yellow
Write-Host "Error: 'AI response is not valid JSON'" -ForegroundColor Red
Write-Host "Ini berarti AI berhasil merespons, tapi format responsenya tidak valid JSON" -ForegroundColor Cyan

Write-Host ""
Write-Host "🚀 Langkah Debug:" -ForegroundColor Green

Write-Host "1. ✅ Restart Development Server:" -ForegroundColor Cyan
Write-Host "   npm run dev" -ForegroundColor White

Write-Host ""
Write-Host "2. ✅ Test AI Parsing:" -ForegroundColor Cyan
Write-Host "   - Ketik: 'beli bakso 5000'" -ForegroundColor White
Write-Host "   - Klik 'Kirim'" -ForegroundColor White
Write-Host "   - Check terminal untuk log messages detail" -ForegroundColor White

Write-Host ""
Write-Host "3. ✅ Check Terminal Logs:" -ForegroundColor Cyan
Write-Host "   Cari log ini di terminal:" -ForegroundColor White
Write-Host "   'AI Parser - Raw AI response: [content]'" -ForegroundColor White
Write-Host "   'AI Parser - Attempting to extract JSON from response...'" -ForegroundColor White

Write-Host ""
Write-Host "🔧 Solusi yang Sudah Ditambahkan:" -ForegroundColor Green

Write-Host "✅ Enhanced JSON Parsing:" -ForegroundColor Cyan
Write-Host "   - Extract JSON dari code blocks (```json...```)" -ForegroundColor White
Write-Host "   - Extract JSON array dari response" -ForegroundColor White
Write-Host "   - Clean up common AI response issues" -ForegroundColor White

Write-Host ""
Write-Host "✅ Better Error Handling:" -ForegroundColor Cyan
Write-Host "   - Detailed error messages" -ForegroundColor White
Write-Host "   - Suggestions untuk fix" -ForegroundColor White
Write-Host "   - Raw content display" -ForegroundColor White

Write-Host ""
Write-Host "✅ Response Validation:" -ForegroundColor Cyan
Write-Host "   - Check if result is array" -ForegroundColor White
Write-Host "   - Validate required fields" -ForegroundColor White
Write-Host "   - Detailed validation errors" -ForegroundColor White

Write-Host ""
Write-Host "📋 Kemungkinan Penyebab:" -ForegroundColor Green

Write-Host "1. 🔴 AI Model Issue:" -ForegroundColor Red
Write-Host "   - Model tidak mengikuti instruksi JSON" -ForegroundColor Yellow
Write-Host "   - Response dalam format text, bukan JSON" -ForegroundColor Yellow

Write-Host ""
Write-Host "2. 🔴 Prompt Issue:" -ForegroundColor Red
Write-Host "   - System prompt tidak jelas" -ForegroundColor Yellow
Write-Host "   - AI tidak memahami format yang diinginkan" -ForegroundColor Yellow

Write-Host ""
Write-Host "3. 🔴 Model Version:" -ForegroundColor Red
Write-Host "   - Model lama tidak support JSON output" -ForegroundColor Yellow
Write-Host "   - Perlu upgrade ke model yang lebih baru" -ForegroundColor Yellow

Write-Host ""
Write-Host "🔍 Debug Commands:" -ForegroundColor Green

Write-Host "Check terminal untuk log ini:" -ForegroundColor Cyan
Write-Host "AI Parser - Raw AI response: [RAW_CONTENT]" -ForegroundColor White
Write-Host "AI Parser - JSON parse error: [ERROR_DETAILS]" -ForegroundColor White
Write-Host "AI Parser - Attempting to extract JSON from response..." -ForegroundColor White

Write-Host ""
Write-Host "📱 Test Cases:" -ForegroundColor Green

Write-Host "Test 1: Simple transaction" -ForegroundColor Cyan
Write-Host "   Input: 'beli bakso 5000'" -ForegroundColor White
Write-Host "   Expected: JSON array dengan 1 item" -ForegroundColor White

Write-Host ""
Write-Host "Test 2: Multiple items" -ForegroundColor Cyan
Write-Host "   Input: 'beli bakso 5000 dan es teh 3000'" -ForegroundColor White
Write-Host "   Expected: JSON array dengan 2 items" -ForegroundColor White

Write-Host ""
Write-Host "Test 3: With category" -ForegroundColor Cyan
Write-Host "   Input: 'makan siang di warteg 15000'" -ForegroundColor White
Write-Host "   Expected: JSON dengan category 'Makanan & Minuman'" -ForegroundColor White

Write-Host ""
Write-Host "⚠️  PENTING:" -ForegroundColor Red
Write-Host "- Restart server setelah update code" -ForegroundColor Red
Write-Host "- Check terminal untuk log messages detail" -ForegroundColor Red
Write-Host "- AI response sekarang akan di-parse dengan multiple methods" -ForegroundColor Red

Write-Host ""
Write-Host "🎯 Hasil yang Diharapkan:" -ForegroundColor Green
Write-Host "Setelah fix:" -ForegroundColor Cyan
Write-Host "- AI parsing berfungsi normal" -ForegroundColor White
Write-Host "- JSON parsing error hilang" -ForegroundColor White
Write-Host "- Terminal menampilkan log detail" -ForegroundColor White
Write-Host "- Transaksi berhasil disimpan" -ForegroundColor White

Write-Host ""
Write-Host "✅ Script test selesai!" -ForegroundColor Green
Write-Host "Sekarang restart server dan test AI parsing!" -ForegroundColor Cyan
