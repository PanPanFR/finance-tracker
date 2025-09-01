# 🔒 Security Fix: Menyembunyikan OpenRouter API Key

## 🚨 Masalah Keamanan

Teman Anda menemukan API key OpenRouter melalui:
- **Browser Developer Tools** → **Network tab** → **Fetch/XHR**
- **Authorization header** yang terekspos: `Bearer sk-or-v1-aa...`

## 🎯 Solusi yang Diterapkan

### 1. ✅ API Routes Server-Side
- Membuat `/api/ai/parse` untuk parsing transaksi
- Membuat `/api/ai/report` untuk laporan AI
- API key OpenRouter sekarang hanya ada di server

### 2. ✅ Environment Variables Aman
- Hapus `NEXT_PUBLIC_OPENROUTER_KEY`
- Tambah `OPENROUTER_KEY` (tanpa prefix `NEXT_PUBLIC_`)

### 3. ✅ Client-Side Code Update
- `aiParser.ts` - Sekarang memanggil API route lokal
- `aiReport.ts` - Sekarang memanggil API route lokal

## 🚀 Langkah-Langkah Implementasi

### Langkah 1: Update Environment Variables

**Windows (PowerShell):**
```powershell
.\update-env.ps1
```

**Linux/Mac (Bash):**
```bash
chmod +x update-env.sh
./update-env.sh
```

**Manual:**
1. Buka file `.env.local`
2. Hapus line: `NEXT_PUBLIC_OPENROUTER_KEY=...`
3. Tambah line: `OPENROUTER_KEY=...` (dengan API key yang sama)

### Langkah 2: Restart Development Server
```bash
npm run dev
```

### Langkah 3: Test AI Features
1. Buka aplikasi di browser
2. Coba tambah transaksi dengan AI
3. Coba tanya AI report
4. Pastikan semua berfungsi normal

### Langkah 4: Deploy ke Vercel (Jika Perlu)
1. Buka Vercel dashboard
2. Pilih project finance-tracker
3. Buka **Settings** → **Environment Variables**
4. **Hapus** `NEXT_PUBLIC_OPENROUTER_KEY`
5. **Tambah** `OPENROUTER_KEY` dengan value yang sama
6. Redeploy aplikasi

## 🔍 Verifikasi Keamanan

### Sebelum Fix:
- ❌ API key terlihat di Network tab
- ❌ Request langsung ke `openrouter.ai`
- ❌ Authorization header terekspos

### Sesudah Fix:
- ✅ API key tersembunyi di server
- ✅ Request hanya ke `/api/ai/parse` dan `/api/ai/report`
- ✅ Tidak ada lagi request ke `openrouter.ai` yang terlihat

### Cara Verifikasi:
1. Buka **Developer Tools** → **Network tab**
2. Lakukan transaksi atau tanya AI
3. **TIDAK ADA LAGI** request ke `openrouter.ai`
4. Yang terlihat hanya request ke API routes lokal

## 📁 File yang Diubah

### File Baru:
- `src/app/api/ai/parse/route.ts` - API route untuk parsing
- `src/app/api/ai/report/route.ts` - API route untuk report
- `SECURITY_FIX.md` - Dokumentasi lengkap
- `update-env.ps1` - Script PowerShell
- `update-env.sh` - Script Bash

### File yang Diupdate:
- `src/lib/aiParser.ts` - Sekarang memanggil API route
- `src/lib/aiReport.ts` - Sekarang memanggil API route
- `env.example` - Contoh environment variables yang aman

## 🛠️ Troubleshooting

### AI Tidak Berfungsi Setelah Update:
1. ✅ Pastikan `OPENROUTER_KEY` sudah diset (tanpa `NEXT_PUBLIC_`)
2. ✅ Restart development server
3. ✅ Check console untuk error messages
4. ✅ Pastikan API routes berfungsi

### Error "API key not configured":
1. ✅ Check file `.env.local`
2. ✅ Pastikan ada `OPENROUTER_KEY=...`
3. ✅ Restart server
4. ✅ Check console logs

### Vercel Deploy Error:
1. ✅ Update environment variables di Vercel
2. ✅ Hapus `NEXT_PUBLIC_OPENROUTER_KEY`
3. ✅ Tambah `OPENROUTER_KEY`
4. ✅ Redeploy aplikasi

## 🔐 Best Practices Keamanan

### ✅ Yang Benar:
- Gunakan API routes untuk operasi sensitif
- Environment variables tanpa `NEXT_PUBLIC_` untuk secrets
- API keys hanya ada di server
- Validasi input di server-side

### ❌ Yang Salah:
- Jangan gunakan `NEXT_PUBLIC_` untuk API keys
- Jangan expose API keys ke client-side
- Jangan lakukan API calls sensitif dari browser
- Jangan hardcode secrets di code

## 📞 Support

Jika ada masalah:
1. Check console untuk error messages
2. Pastikan environment variables sudah benar
3. Restart development server
4. Check file `SECURITY_FIX.md` untuk troubleshooting
5. Pastikan semua file sudah diupdate dengan benar

## 🎉 Hasil Akhir

Setelah implementasi fix ini:
- 🔒 **API key OpenRouter tersembunyi** dari client
- 🚀 **AI features tetap berfungsi** normal
- 🛡️ **Keamanan aplikasi meningkat** signifikan
- 📱 **User experience tidak berubah** sama sekali

---

**⚠️ PENTING:** Jangan lupa update environment variables di Vercel jika deploy aplikasi!
