# Stock-Hub Sync Extension — Design Spec

## Intent

Eliminate manual copy-paste workflow between Shopee/Tokopedia Seller Center and Stock-Hub. Currently the user must: download order files from each marketplace → upload to Stock-Hub → download updated stock files → upload back to each marketplace. This extension automates all 4 steps into a single click.

## Why Now

The user operates 1 Shopee store and 1 Tokopedia store. The manual sync workflow is repetitive and error-prone. API integration is not viable (requires developer registration, approval process, ongoing maintenance). The user's PC is not always on, ruling out server-side browser automation.

## Goals

- **1-click sync**: entire flow runs from a single button press
- **Cross-browser**: works on Chrome and Firefox
- **Zero marketplace login**: leverages the user's existing browser sessions
- **Persistent Stock-Hub auth**: stores credentials so user doesn't re-enter them
- **Clear progress feedback**: user sees step-by-step progress and errors
- **Graceful partial failure**: if one marketplace fails, the other still syncs

## Non-Goals

- Mobile support (iPhone/Android) — browser extensions don't work on mobile
- Scheduled/automatic sync without user trigger
- Shopee/TikTok API integration
- Cloud-based sync (requires always-on server)

## Anti-Goals

- Storing marketplace credentials (username/password) — extension must NOT handle marketplace login
- Modifying Stock-Hub backend — extension works with existing API endpoints

## Current State

- Stock-Hub is a Vercel-hosted app using Google Sheets as database
- Web API accepts order file uploads via `POST /api/web?route=upload` with `x-access-key` + `x-user` headers
- Web API serves stock export files via `GET /api/web?route=export&name=shopee|tiktok`
- Stock-Hub has built-in order deduplication (14-day window)
- Telegram bot already handles file upload/export but can't interact with marketplaces

## Architecture

```
┌─────────────────────────────────────┐
│          Browser Extension          │
├──────────┬──────────┬───────────────┤
│  Popup   │Background│Content Scripts│
│  (UI)    │(orchestr)│(DOM automate) │
└──────────┴──────────┴───────────────┘
     │           │            │
     │    ┌──────┴──────┐     │
     │    │ Stock-Hub   │     │
     │    │ API (Vercel)│     │
     │    └─────────────┘     │
     │                        │
     │    ┌───────────────────┤
     │    │ Shopee Seller     │
     │    │ Center (tab)      │
     │    ├───────────────────┤
     │    │ Tokopedia Seller  │
     │    │ Center (tab)      │
     │    └───────────────────┘
```

## Approaches Considered

### A. Chrome Extension + Content Scripts (Chosen)
- Runs in user's browser with active marketplace sessions
- Content scripts automate DOM interactions on Seller Center pages
- Background service worker orchestrates flow and talks to Stock-Hub API
- **Tradeoff**: requires PC with browser open; marketplace DOM changes can break selectors
- **Why chosen**: only approach that works without API access and without always-on server

### B. Cloud VPS + Playwright
- Headless browser on always-on server
- **Rejected**: user has no always-on device; marketplace anti-bot detection blocks data center IPs; OTP/CAPTCHA requires manual intervention

### C. Telegram Bot
- **Rejected**: bot runs on Vercel (serverless), cannot access marketplace Seller Center; same IP/session problems as VPS

## Stock-Hub Auth

Extension stores in `browser.storage.local`:
- `stockhubUrl`: Stock-Hub Vercel URL
- `stockhubUser`: username (sent as `x-user` header)
- `stockhubKey`: access key / password (sent as `x-access-key` header)

No backend changes needed — these are the same credentials the web dashboard uses.

## Sync Flow Detail

1. **Shopee order export**: open `seller.shopee.co.id/portal/sale/order` → click Export → set date range (7 days) → download XLSX
2. **Tokopedia order export**: open `seller-id.tokopedia.com/order` → click Export → set date range (7 days) → download XLSX
3. **Upload to Stock-Hub**: POST each file to `/api/web?route=upload` with `action=order`
4. **Download stock exports**: GET `/api/web?route=export&name=shopee` and `&name=tiktok`
5. **Shopee stock upload**: open mass update page → upload Shopee XLSX
6. **Tokopedia stock upload**: open batch edit page → upload Tokopedia XLSX

## Error Handling

- **Not logged in**: content script detects login/redirect page → clear error message
- **Element not found**: selector missing → "Tampilan Seller Center mungkin telah berubah"
- **Download timeout**: 60s max wait → timeout error
- **Stock-Hub auth fail**: 401 response → "Kredensial Stock-Hub tidak valid"
- **Partial failure**: if one marketplace fails, continue with the other; report both results
