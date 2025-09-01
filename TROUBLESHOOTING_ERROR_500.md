# 🚨 Troubleshooting Error 500: OpenRouter API Key

## 🔍 Error yang Ditemukan

```
AI Parser - API response not ok: 500 {}
```

## 🎯 Penyebab Error

Error 500 terjadi karena **environment variable `OPENROUTER_KEY` belum diset** dengan benar. 

### ❌ Yang SALAH:
```bash
NEXT_PUBLIC_OPENROUTER_KEY=sk-or-v1-aa...
```

### ✅ Yang BENAR:
```bash
OPENROUTER_KEY=sk-or-v1-aa...
```

## 🚀 Solusi Cepat

### Langkah 1: Jalankan Script Auto-Fix

**Windows (PowerShell):**
```powershell
.\fix-env.ps1
```

**Linux/Mac (Bash):**
```bash
chmod +x fix-env.sh
./fix-env.sh
```

### Langkah 2: Manual Fix

1. **Buka file `.env.local`**
2. **Hapus line ini:**
   ```bash
   NEXT_PUBLIC_OPENROUTER_KEY=sk-or-v1-aa...
   ```
3. **Tambah line ini:**
   ```bash
   OPENROUTER_KEY=sk-or-v1-aa...
   ```

### Langkah 3: Restart Server
```bash
npm run dev
```

## 🔍 Debugging Detail

### 1. Check Environment Variables

API route sekarang memiliki logging yang lebih detail. Check terminal/server console untuk melihat:

```
AI Parser - Environment check: {
  hasOpenRouterKey: false,  // ← Ini harus true
  openRouterKeyLength: 0,   // ← Ini harus > 0
  openRouterKeyPrefix: 'N/A' // ← Ini harus 'sk-or-v1-'
}
```

### 2. Check File .env.local

Pastikan file `.env.local` ada dan berisi:

```bash
# ✅ BENAR - Tanpa prefix NEXT_PUBLIC_
OPENROUTER_KEY=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

# ❌ SALAH - Dengan prefix NEXT_PUBLIC_
# NEXT_PUBLIC_OPENROUTER_KEY=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

# Supabase config
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
```

### 3. Check Server Console

Setelah restart server, cari log ini:

```
🔑 Environment Variables loaded:
- OPENROUTER_KEY: ✅ Found (length: 64)
- NEXT_PUBLIC_OPENROUTER_KEY: ❌ Not found (good!)
```

## 🛠️ Troubleshooting Step-by-Step

### Case 1: File .env.local tidak ada
```bash
# Buat file baru
touch .env.local

# Tambahkan konfigurasi
echo "OPENROUTER_KEY=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" >> .env.local
echo "NEXT_PUBLIC_SUPABASE_URL=your_supabase_url" >> .env.local
echo "NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key" >> .env.local
echo "SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key" >> .env.local
```

### Case 2: Masih ada NEXT_PUBLIC_OPENROUTER_KEY
```bash
# Hapus line yang salah
sed -i '/NEXT_PUBLIC_OPENROUTER_KEY/d' .env.local

# Tambahkan line yang benar
echo "OPENROUTER_KEY=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" >> .env.local
```

### Case 3: Environment variables tidak terbaca
```bash
# Restart server
npm run dev

# Check terminal untuk error messages
# Pastikan tidak ada error saat startup
```

## 🔐 Keamanan

### ✅ Yang Aman:
- `OPENROUTER_KEY` - Hanya ada di server
- `SUPABASE_SERVICE_ROLE_KEY` - Hanya ada di server

### ⚠️ Yang Bisa Diexpose:
- `NEXT_PUBLIC_SUPABASE_URL` - Bisa dilihat client
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Bisa dilihat client

### ❌ Yang TIDAK Aman:
- `NEXT_PUBLIC_OPENROUTER_KEY` - JANGAN gunakan ini!

## 📱 Test Setelah Fix

1. **Restart server:**
   ```bash
   npm run dev
   ```

2. **Test AI parsing:**
   - Ketik: "makan bakso 20000"
   - Klik "Kirim"
   - Check console untuk success message

3. **Test AI report:**
   - Ketik pertanyaan: "berapa pengeluaran hari ini?"
   - Klik "Tanya"
   - Check console untuk success message

## 🚨 Error Messages yang Mungkin Muncul

### Error 500 - "OpenRouter API key not configured"
**Solusi:** Pastikan `OPENROUTER_KEY` ada di `.env.local`

### Error 500 - "OpenRouter API error: 401"
**Solusi:** API key tidak valid, check format dan regenerate

### Error 500 - "OpenRouter API error: 429"
**Solusi:** Rate limit exceeded, tunggu beberapa menit

### Error 500 - "Failed to parse transaction"
**Solusi:** Check server console untuk detail error

## 📞 Support

Jika masih error setelah semua langkah di atas:

1. **Check server console** untuk error messages detail
2. **Pastikan file `.env.local`** ada dan benar
3. **Restart server** setelah mengubah environment variables
4. **Check network tab** di browser untuk request ke `/api/ai/parse`
5. **Pastikan tidak ada typo** di environment variable names

## 🎯 Hasil yang Diharapkan

Setelah fix berhasil:
- ✅ Error 500 hilang
- ✅ AI parsing berfungsi normal
- ✅ AI report berfungsi normal
- ✅ Console menampilkan success messages
- ✅ API key tersembunyi dari client

---

**⚠️ PENTING:** Jangan lupa restart server setelah mengubah environment variables!
