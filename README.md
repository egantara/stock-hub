# Stock-Hub Sync

Firefox extension untuk sinkronisasi order dan stok antara Stock-Hub, Shopee, dan TikTok Shop Seller Center.

## Yang dibutuhkan

Komputer Windows 10/11 dengan:

- Firefox 142 atau lebih baru.
- Node.js 20 LTS atau lebih baru jika perlu build Native Host.
- npm, ikut terpasang bersama Node.js.
- PowerShell.
- Akun Stock-Hub aktif.
- Sesi login aktif di Shopee Seller Center dan TikTok Shop Seller Center.
- Firefox tetap terbuka saat jadwal sync berjalan.

## File di folder project

```text
extension/                         Source extension utama
extension-firefox/                 Hasil build Firefox
build-firefox.js                   Script build Firefox
native-host/                       Source dan script Native Messaging helper
native-host/dist/                  Output helper Windows, dibuat lokal
stock-hub-sync-firefox.zip         Paket add-on untuk Mozilla
stock-hub-sync-source.zip          Paket source untuk Mozilla reviewer
SOURCE-BUILD-README.md             Instruksi build source reviewer
package.json                       Daftar dependency
package-lock.json                  Versi dependency yang dikunci
```

Jangan hapus `extension/`, `build-firefox.js`, atau `native-host/`. Folder `extension-firefox/` boleh dibuat ulang.

## Instalasi extension permanen

1. Download `.xpi` signed dari Mozilla Add-ons Developer Hub.
2. Buka Firefox.
3. Buka `about:addons`.
4. Klik ikon gear.
5. Pilih `Install Add-on from file...`.
6. Pilih file `.xpi` signed.
7. Konfirmasi install.

Jangan memakai `Load Temporary Add-on` untuk penggunaan harian. Temporary add-on hilang saat Firefox ditutup.

## Instalasi Native Host Windows

Native Host hanya perlu dibuat dan dipasang satu kali per komputer.

Buka PowerShell dari root project:

```powershell
npm ci
.\native-host\build-native-host.ps1
.\native-host\install-firefox.ps1
```

Script tersebut membuat executable:

```text
native-host/dist/tokopedia-file-helper.exe
```

Lalu mendaftarkan host di:

```text
%APPDATA%\Mozilla\NativeMessagingHosts\com.stockhub.tokopedia.json
```

Native Host dipakai untuk membaca file order yang sudah selesai di-download. Native Host tidak membaca atau mengirim cookie marketplace.

Jika Firefox sudah terbuka saat instalasi Native Host, tutup dan buka ulang Firefox.

## Konfigurasi pertama kali

1. Login ke Shopee Seller Center.
2. Login ke TikTok Shop Seller Center.
3. Klik ikon `Stock-Hub Sync` di toolbar Firefox.
4. Isi URL Stock-Hub:

   ```text
   https://stock-hub-kohl.vercel.app
   ```

5. Isi username dan Access Key Stock-Hub.
6. Klik `Simpan dan Tes Koneksi`.
7. Pilih Shopee dan/atau TikTok.
8. Klik `Sync Stock`.

Username dan Access Key disimpan di Firefox `storage.local`. Extension tidak menyimpan cookie atau session storage marketplace.

## Sync manual

Sebelum klik sync:

- Firefox harus login ke Seller Center marketplace yang dipilih.
- Jangan menutup tab marketplace saat proses berjalan.
- Jangan mengubah file hasil download sebelum proses selesai.

Extension akan:

1. Membuka halaman order marketplace.
2. Mengekspor order.
3. Membaca file export.
4. Mengirim file order ke Stock-Hub.
5. Mengambil file stok terbaru dari Stock-Hub.
6. Mengupload stok ke marketplace.

Status progress menyebut marketplace yang sedang diproses, misalnya `Upload Order Shopee` atau `Upload Order TikTok`.

## Sync terjadwal

Di popup extension, buka bagian `Sync Terjadwal`.

Contoh:

```text
Aktif: ON
Catch-up: ON
Jam mulai: 08:00
Jam selesai: 22:00
Update setiap: 1 jam
```

Jadwal tersebut menjalankan sync pada:

```text
08:00, 09:00, 10:00, ..., 22:00
```

Jam selesai selalu menjadi update terakhir. Contoh 08:00 sampai 22:00 dengan interval 5 jam menjalankan update pada 08:00, 13:00, 18:00, dan 22:00.

`Jalankan jika jadwal terlewat`:

- ON: jika Firefox dibuka setelah jadwal terlewat, extension menjalankan satu sync catch-up lalu mengikuti slot berikutnya.
- OFF: extension tidak mengejar jadwal yang terlewat dan menunggu jadwal normal berikutnya.

Firefox dan komputer harus hidup agar sync berjalan. Extension tidak dapat menjalankan sync ketika laptop mati atau Firefox benar-benar tertutup.

## Build ulang extension

Dari root project:

```powershell
npm ci
node build-firefox.js
```

Hasilnya ada di:

```text
extension-firefox/
```

Untuk membuat ZIP upload Mozilla, gunakan `stock-hub-sync-firefox.zip` yang dibuat dari isi `extension-firefox/`. Source reviewer memakai `stock-hub-sync-source.zip`.

## Troubleshooting

### Extension hilang setelah Firefox ditutup

Kamu masih memakai Temporary Add-on. Install `.xpi` signed dari Mozilla melalui `about:addons`.

### Native Host tidak ditemukan

Jalankan ulang:

```powershell
.\native-host\build-native-host.ps1
.\native-host\install-firefox.ps1
```

Pastikan file ini ada:

```text
native-host/dist/tokopedia-file-helper.exe
```

Lalu restart Firefox.

### Session marketplace belum login

Buka Seller Center secara manual, selesaikan login/OTP/CAPTCHA, lalu jalankan sync lagi.

### Jadwal tidak berjalan

Periksa:

- Firefox tetap terbuka.
- Komputer tidak sleep.
- `Sync Terjadwal` aktif.
- Jam mulai dan selesai valid.
- Marketplace yang diinginkan dicentang.
- Catch-up aktif jika jadwal sebelumnya terlewat.

### Upload gagal

Baca pesan error detail di popup. Jangan menghapus atau mengganti file export yang sedang diproses.

## Privasi

Extension tidak mengirim cookie marketplace atau browser session storage. Kredensial Stock-Hub disimpan lokal di Firefox. Native Host berjalan lokal dan membaca hanya file yang diminta extension.
