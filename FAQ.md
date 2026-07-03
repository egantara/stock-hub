# ❓ Frequently Asked Questions (FAQ)

## Apa itu Stock Hub?

Stock Hub adalah Telegram Bot yang membantu mengelola stok multi marketplace menggunakan Google Sheets sebagai database utama.

Semua proses dilakukan langsung melalui Telegram tanpa perlu membuka dashboard khusus.

---

## Marketplace apa saja yang didukung?

Saat ini Stock Hub mendukung:

- Shopee
- TikTok Shop

---

## Apakah saya harus menginput semua produk satu per satu?

Tidak.

Produk dapat diimpor langsung menggunakan file export dari marketplace melalui command:

```
/new
```

---

## Apakah saya harus menginput stok satu per satu?

Tidak.

Stock dapat diperbarui dengan beberapa cara:

- Manual
- Upload Excel
- Import Order Marketplace

---

## Apakah saya perlu menginstal aplikasi?

Tidak.

Bot berjalan melalui Telegram.

Anda hanya perlu memiliki akun Telegram dan Google Account.

---

## Apakah saya perlu server sendiri?

Tidak.

Proses setup dilakukan oleh kami.

Client cukup menggunakan bot yang sudah siap.

---

## Apakah saya perlu memahami coding?

Tidak.

Bot dirancang agar dapat digunakan oleh pengguna tanpa pengetahuan teknis.

---

## Bagaimana database disimpan?

Semua data disimpan di Google Sheets sehingga mudah dipantau, diedit, dan dibackup.

---

## Apakah data saya aman?

Ya.

Data berada di Google Sheets milik Anda.

Bot hanya mengakses spreadsheet yang telah diberikan izin.

---

## Bagaimana jika internet terputus saat proses berjalan?

Command yang sedang diproses akan berhenti.

Anda dapat menjalankan kembali command tersebut setelah koneksi kembali normal.

Untuk import order, sistem memiliki duplicate protection sehingga order yang sudah diproses tidak akan dihitung dua kali.

---

## Bagaimana cara import order?

Cukup upload file order marketplace.

Contoh:

```
orders.xlsx

Caption:
/sales
```

Bot akan:

- membaca file
- mengurangi stock
- mencatat log
- menyimpan order yang telah diproses

---

## Bagaimana cara import produk?

Upload file produk marketplace.

Contoh:

```
products.xlsx

Caption:
/new
```

Bot akan otomatis:

- menambahkan produk baru
- memperbarui informasi produk yang sudah ada
- menggabungkan marketplace apabila SKU digunakan di lebih dari satu marketplace

---

## Bagaimana cara update status produk?

Ada dua cara.

Manual

```
/status

SKU-001 ACTIVE
SKU-002 NON-ACTIVE
```

atau upload file produk marketplace dengan caption:

```
/status
```

---

## Kenapa export hanya berisi produk ACTIVE?

File export marketplace hanya menghasilkan produk dengan status **ACTIVE** agar produk yang sudah tidak dijual tidak ikut diperbarui.

---

## Apakah bot dapat mencegah duplicate order?

Ya.

Order ID yang sudah pernah diproses tidak akan diproses kembali.

---

## Apakah bot bisa digunakan oleh beberapa admin?

Bisa.

Selama seluruh admin menggunakan bot dan Google Sheets yang sama.

---

## Berapa banyak produk yang dapat dikelola?

Stock Hub telah diuji secara internal hingga sekitar **5.000 produk** dalam satu database Google Sheets.

---

## Apakah bisa request fitur khusus?

Bisa.

Bot dapat dikembangkan sesuai kebutuhan bisnis, workflow, maupun marketplace yang digunakan.

---

## Bagaimana proses implementasi?

Client cukup menyediakan:

- Google Account
- SKU produk yang tersinkronisasi
- File produk marketplace (opsional)

Seluruh proses setup dan konfigurasi dilakukan oleh kami.

---

## Bagaimana jika saya membutuhkan bantuan?

Silakan hubungi:
Instagram : @egantarastr
Threads : @egantarastr
Telegram : @egantarastr
WhatsApp : +62 813-3681-7808