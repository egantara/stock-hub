# Stock-Hub Sync Browser Extension

Ekstensi browser (Google Chrome & Mozilla Firefox) untuk sinkronisasi stok 1-klik antara:
- **Shopee Seller Center**
- **Tokopedia / TikTok Shop Seller Center**
- **Stock-Hub Dashboard**

---

## Fitur Utama

- **1-Klik Sync**: Ekspor pesanan marketplace (7 hari terakhir), potong stok otomatis di Stock-Hub, dan unggah balik file stok terbaru ke kedua marketplace.
- **Tanpa API Berbayar/Developer**: Berjalan menggunakan sesi login aktif di browsermu.
- **Kredensial Tersimpan**: Username dan Access Key Stock-Hub disimpan lokal di browser storage, tidak perlu login ulang.
- **Cross-Browser**: Mendukung Chrome (Manifest V3) dan Firefox (Manifest V2).
- **Log Realtime**: Status dan riwayat keberhasilan sinkronisasi langsung terlihat di popup ekstensi.

---

## Cara Instalasi

### 1. Google Chrome (atau Edge / Brave)

1. Buka browser Chrome, ketik `chrome://extensions` di address bar lalu tekan Enter.
2. Aktifkan **Developer mode** (toggle di pojok kanan atas).
3. Klik tombol **Load unpacked** (Muat yang belum dibongkar).
4. Pilih folder: `D:\Projects\stock-hub\extension`.
5. Ekstensi **Stock-Hub Sync** akan muncul di daftar ekstensi. Pin ekstensi ke toolbar agar mudah diakses.

### 2. Mozilla Firefox

1. Buka browser Firefox, ketik `about:debugging#/runtime/this-firefox` di address bar lalu tekan Enter.
2. Klik tombol **Load Temporary Add-on...** (Muat Pengaya Sementara).
3. Pilih file: `D:\Projects\stock-hub\extension-firefox\manifest.json`.
4. Ekstensi aktif untuk sesi Firefox tersebut.

---

## Konfigurasi Pertama Kali

1. Klik ikon **Stock-Hub Sync** di toolbar browser.
2. Menu **Pengaturan** akan muncul secara otomatis jika belum diisi:
   - **URL Stock-Hub**: URL Vercel atau domain Stock-Hub kamu (contoh: `https://stock-hub-kamu.vercel.app`).
   - **Username**: Username akun Stock-Hub kamu (kolom `USER` di sheet akses).
   - **Access Key**: Password / Access Key akun Stock-Hub kamu.
3. Klik **Simpan dan Tes Koneksi**.
4. Jika berhasil, kamu akan langsung diarahkan ke layar **Sync Stock**.

---

## Cara Menggunakan

1. Pastikan kamu sudah login ke:
   - [Shopee Seller Center](https://seller.shopee.co.id)
   - [Tokopedia / TikTok Seller Center](https://seller-id.tokopedia.com)
2. Klik ikon ekstensi **Stock-Hub Sync**.
3. Pilih marketplace yang mau disinkronkan (centang Shopee dan/atau Tokopedia).
4. Klik tombol **🔄 Sync Stock**.
5. Biarkan tab berjalan di background sampai muncul pesan `✅ Sinkronisasi Shopee dan Tokopedia berhasil sepenuhnya!`.

---

## Troubleshooting

- **"Sesi Shopee/Tokopedia belum login"**: Buka tab marketplace terkait, lakukan login dan selesaikan OTP/CAPTCHA secara manual di browser, lalu coba lagi.
- **"Kredensial Stock-Hub tidak valid"**: Buka menu pengaturan (ikon ⚙) di popup ekstensi, periksa kembali Username dan Access Key kamu.
- **"Tombol Ekspor tidak ditemukan"**: Pastikan tampilan Seller Center tidak sedang dalam maintenance atau halaman versi lama. Laporkan ke pengembang jika terdapat perubahan antarmuka oleh marketplace.
