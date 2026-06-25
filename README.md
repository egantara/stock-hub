# Stock Hub

Telegram bot untuk sinkronisasi stok marketplace menggunakan Google Sheets.

## Features

- Import Sales
- Import Product
- Sync Product Status
- Manual Stock
- Manual Status
- Export Shopee
- Export TikTok
- Daily Backup
- Telegram Bot

## Install

```bash
npm install
```

## Development

```bash
vercel dev
```

## Deploy

```bash
vercel
```

## Environment

Buat file `.env`:

```
GOOGLE_PROJECT_ID=
GOOGLE_CLIENT_EMAIL=
GOOGLE_PRIVATE_KEY=
GOOGLE_SHEET_ID=

TELEGRAM_BOT_TOKEN=
TELEGRAM_ADMIN_CHAT_ID=
```

## Commands

```
/sales
/new
/syncstatus
/status
/restock
/set
/stock
/exportshopee
/exporttiktok
/exportall
```