# Stock-Hub Sync Extension — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a cross-browser extension (Chrome + Firefox) that syncs stock between Shopee/Tokopedia Seller Center and Stock-Hub with one click — downloading order files, uploading to Stock-Hub, downloading updated stock files, and uploading them back to marketplaces.

**Architecture:** A WebExtension (Manifest V3 for Chrome, Manifest V2 for Firefox via polyfill) with a popup UI showing a "Sync Stock" button and progress log. A background service worker orchestrates the full flow by opening marketplace tabs, injecting content scripts to automate export/download/upload actions, and communicating with Stock-Hub API via fetch. The extension stores Stock-Hub credentials (`user` + `accessKey`) and Stock-Hub URL in `browser.storage.local`.

**Tech Stack:** WebExtension API (cross-browser via `webextension-polyfill`), Manifest V3, vanilla JS, CSS

**Spec:** `docs/superpowers/specs/2026-11-21-stock-hub-sync-extension-design.md`

## Global Constraints

- Must work on both Chrome (Manifest V3) and Firefox (using `browser` namespace / polyfill)
- No external dependencies beyond `webextension-polyfill` for Firefox compat
- All marketplace automation via content scripts injected into Seller Center tabs
- Stock-Hub auth uses existing `x-access-key` + `x-user` headers (no new backend changes needed for auth)
- Extension does NOT store marketplace credentials — it relies on the user's active browser sessions
- Indonesian language for all user-facing text in the popup
- Order export filter: 7 hari terakhir (last 7 days)

## Review Focus

1. **Marketplace not logged in** — If user isn't logged in to Shopee/Tokopedia, content script should detect the login page and report a clear error ("Silakan login ke Shopee terlebih dahulu") instead of hanging or crashing. → Test in Task 3 and Task 4.
2. **Stock-Hub credentials invalid/expired** — If `x-access-key` or `x-user` are wrong, the upload/export call returns 401. Extension should show "Kredensial Stock-Hub tidak valid" and stop. → Test in Task 5.
3. **Marketplace UI changes** — Shopee/Tokopedia may change their DOM selectors. Content scripts should use resilient selectors and throw descriptive errors when elements are missing ("Tombol Export tidak ditemukan — mungkin tampilan Seller Center telah berubah"). → Test in Task 3 and Task 4.
4. **File download timeout** — Marketplace export can take time to generate. Content scripts need polling with timeout (max 60s) and clear timeout error. → Test in Task 3 and Task 4.
5. **Concurrent sync** — User clicks Sync while a sync is already running. Popup should disable the button and show "Sync sedang berjalan..." → Test in Task 6.

---

### Task 1: Extension Scaffold & Settings

**Files:**
- Create: `extension/manifest.json` (Manifest V3)
- Create: `extension/manifest.v2.json` (Firefox Manifest V2 fallback)
- Create: `extension/lib/browser-polyfill.min.js` (webextension-polyfill)
- Create: `extension/background/service-worker.js`
- Create: `extension/popup/popup.html`
- Create: `extension/popup/popup.css`
- Create: `extension/popup/popup.js`
- Create: `extension/icons/icon-16.png`
- Create: `extension/icons/icon-48.png`
- Create: `extension/icons/icon-128.png`

**Interfaces:**
- Consumes: nothing
- Produces:
  - `browser.storage.local` keys: `stockhubUrl` (string), `stockhubUser` (string), `stockhubKey` (string)
  - Message protocol: popup sends `{ action: "START_SYNC" }` to background, background sends `{ action: "SYNC_PROGRESS", step, status, message }` and `{ action: "SYNC_COMPLETE", success, summary }` back

- [ ] **Step 1: Create `extension/manifest.json` (Manifest V3)**

```json
{
  "manifest_version": 3,
  "name": "Stock-Hub Sync",
  "version": "1.0.0",
  "description": "Sinkronisasi stok otomatis antara Shopee, Tokopedia, dan Stock-Hub",
  "permissions": ["storage", "downloads", "activeTab", "tabs"],
  "host_permissions": [
    "https://seller.shopee.co.id/*",
    "https://seller-id.tokopedia.com/*"
  ],
  "action": { "default_popup": "popup/popup.html", "default_icon": "icons/icon-48.png" },
  "background": { "service_worker": "background/service-worker.js" },
  "content_scripts": [
    {
      "matches": ["https://seller.shopee.co.id/*"],
      "js": ["content/shopee.js"],
      "run_at": "document_idle"
    },
    {
      "matches": ["https://seller-id.tokopedia.com/*"],
      "js": ["content/tokopedia.js"],
      "run_at": "document_idle"
    }
  ],
  "icons": { "16": "icons/icon-16.png", "48": "icons/icon-48.png", "128": "icons/icon-128.png" }
}
```

- [ ] **Step 2: Create popup HTML with settings form and sync button**

`extension/popup/popup.html` — Two views:
1. **Settings view**: inputs for Stock-Hub URL, Username, Access Key, with "Simpan" button.
2. **Sync view** (shown after settings saved): "🔄 Sync Stock" button, progress log area (scrollable div with step-by-step status lines).

- [ ] **Step 3: Create `extension/popup/popup.js`**

On load: read settings from `browser.storage.local`. If all 3 fields present, show sync view; otherwise show settings view.
- "Simpan" button: validate fields not empty, save to `browser.storage.local`, switch to sync view.
- "Sync" button: send `{ action: "START_SYNC" }` to background via `browser.runtime.sendMessage()`.
- Listen for `{ action: "SYNC_PROGRESS" }` messages — append status line to progress log.
- Listen for `{ action: "SYNC_COMPLETE" }` — show summary, re-enable button.
- "⚙️" icon button to go back to settings view.

- [ ] **Step 4: Create `extension/popup/popup.css`**

Popup width: 360px. Clean, compact UI. Color-coded status lines: blue=in progress, green=success, red=error, gray=skipped.

- [ ] **Step 5: Create `extension/background/service-worker.js` with message handler stub**

Listen for `{ action: "START_SYNC" }`. For now, reply with `{ action: "SYNC_COMPLETE", success: true, summary: "Stub" }`. The real orchestration is Task 5.

- [ ] **Step 6: Create placeholder icons**

Simple colored squares (blue background, white "S" letter) at 16x16, 48x48, 128x128.

- [ ] **Step 7: Create `extension/manifest.v2.json` for Firefox**

Same as manifest.json but `manifest_version: 2`, `browser_action` instead of `action`, `background.scripts` instead of `service_worker`.

- [ ] **Step 8: Manual smoke test**

Load extension in Chrome via `chrome://extensions` → Load unpacked → `extension/` folder.
Verify: popup opens, settings can be saved, sync button sends message, stub response received.

- [ ] **Step 9: Commit**

```bash
git add extension/
git commit -m "feat(extension): scaffold with popup, settings, and message protocol"
```

---

### Task 2: Stock-Hub API Client Module

**Files:**
- Create: `extension/lib/stockhub-api.js`

**Interfaces:**
- Consumes: `browser.storage.local` keys `stockhubUrl`, `stockhubUser`, `stockhubKey`
- Produces:
  - `uploadOrderFile(file: File) → Promise<{ ok, result? , error? }>` — POST multipart to `/api/web?route=upload` with `action=order`
  - `downloadExport(marketplace: "shopee"|"tiktok") → Promise<Blob>` — GET `/api/web?route=export&name={marketplace}`, returns XLSX blob
  - `testConnection() → Promise<{ ok, error? }>` — lightweight check that credentials work

- [ ] **Step 1: Create `extension/lib/stockhub-api.js`**

```js
// Module exports:
// getSettings() → Promise<{ url, user, key }>
// testConnection() → Promise<{ ok, error? }>
// uploadOrderFile(file: File) → Promise<{ ok, result?, error? }>
// downloadExport(marketplace: "shopee"|"tiktok") → Promise<Blob>
```

`getSettings()`: reads from `browser.storage.local`, throws if any field missing.

`testConnection()`: calls `GET {url}/api/web?route=dashboard` with headers `x-access-key` and `x-user`. Returns `{ ok: true }` on 200, `{ ok: false, error }` otherwise.

`uploadOrderFile(file)`: builds `FormData` with field `action=order` and the file, POSTs to `{url}/api/web?route=upload` with auth headers. Returns parsed JSON response.

`downloadExport(marketplace)`: GETs `{url}/api/web?route=export&name={marketplace}` with auth headers. Returns response as `Blob`.

- [ ] **Step 2: Add connection test to settings save flow in `popup.js`**

After saving settings, call `testConnection()`. Show "✅ Terhubung ke Stock-Hub" or "❌ Gagal: {error}".

- [ ] **Step 3: Commit**

```bash
git add extension/lib/stockhub-api.js extension/popup/popup.js
git commit -m "feat(extension): Stock-Hub API client with upload, export, and connection test"
```

---

### Task 3: Shopee Content Script — Export & Download Orders

**Files:**
- Create: `extension/content/shopee.js`

**Interfaces:**
- Consumes: messages from background `{ action: "SHOPEE_EXPORT_ORDERS" }`
- Produces: responds with `{ success: true, file: { name, data (base64), type } }` or `{ success: false, error }`

- [ ] **Step 1: Research Shopee Seller Center DOM**

Manually inspect `https://seller.shopee.co.id/portal/sale/order` in DevTools:
- Identify the Export button selector
- Identify the date range filter inputs
- Identify the download trigger / confirmation button
- Identify how to detect "not logged in" (redirect to login page)
- Document selectors and flow

- [ ] **Step 2: Create `extension/content/shopee.js`**

Script listens for message `{ action: "SHOPEE_EXPORT_ORDERS" }` from background.

Flow:
1. Check if current page is login page → respond error "Silakan login ke Shopee terlebih dahulu"
2. Navigate to order page if not already there
3. Click export button
4. Set date filter to 7 days ago → today
5. Click confirm/download
6. Intercept the file download (via `fetch` override or `downloads` API)
7. Convert file to base64
8. Respond with `{ success: true, file: { name, data, type } }`

Handle timeouts: poll for elements with max 60s wait, respond error if not found.

- [ ] **Step 3: Add helper `waitForElement(selector, timeoutMs)` → `Promise<Element>`**

Polls every 500ms, rejects after timeout with descriptive error including the selector context (e.g., "Tombol Export tidak ditemukan").

- [ ] **Step 4: Add helper `waitForDownload(timeoutMs)` → `Promise<{ name, data, type }>`**

Intercepts network response for the XLSX file download. Uses `fetch` interception or monitors `chrome.downloads` API events from background.

- [ ] **Step 5: Commit**

```bash
git add extension/content/shopee.js
git commit -m "feat(extension): Shopee content script for order export automation"
```

---

### Task 4: Tokopedia Content Script — Export & Download Orders

**Files:**
- Create: `extension/content/tokopedia.js`

**Interfaces:**
- Consumes: messages from background `{ action: "TOKOPEDIA_EXPORT_ORDERS" }`
- Produces: responds with `{ success: true, file: { name, data (base64), type } }` or `{ success: false, error }`

- [ ] **Step 1: Research Tokopedia Seller Center DOM**

Manually inspect `https://seller-id.tokopedia.com/order?selected_sort=6&tab=all` in DevTools:
- Identify export button, date filter, download confirmation
- Identify login detection
- Document selectors and flow

- [ ] **Step 2: Create `extension/content/tokopedia.js`**

Same pattern as Shopee content script but for Tokopedia DOM:
1. Detect login page → error
2. Navigate to order page
3. Click export
4. Set date filter 7 days
5. Click download
6. Intercept file, convert to base64
7. Respond with file data

Same timeout/error handling pattern as Task 3.

- [ ] **Step 3: Commit**

```bash
git add extension/content/tokopedia.js
git commit -m "feat(extension): Tokopedia content script for order export automation"
```

---

### Task 5: Shopee & Tokopedia Content Scripts — Upload Stock Files

**Files:**
- Create: `extension/content/shopee-upload.js`
- Create: `extension/content/tokopedia-upload.js`

**Interfaces:**
- Consumes: messages from background `{ action: "SHOPEE_UPLOAD_STOCK", file: { name, data (base64), type } }` and `{ action: "TOKOPEDIA_UPLOAD_STOCK", file: { name, data, type } }`
- Produces: responds with `{ success: true }` or `{ success: false, error }`

- [ ] **Step 1: Research Shopee Mass Update page DOM**

Inspect `https://seller.shopee.co.id/portal/product-mass/mass-update/upload`:
- Identify file input element
- Identify upload/submit button
- Identify success/error indicators
- Document selectors

- [ ] **Step 2: Create `extension/content/shopee-upload.js`**

Listens for `{ action: "SHOPEE_UPLOAD_STOCK" }`:
1. Detect login page → error
2. Convert base64 back to File object
3. Set file on the `<input type="file">` element (using DataTransfer)
4. Click upload/submit button
5. Wait for success indicator
6. Respond `{ success: true }`

- [ ] **Step 3: Research Tokopedia Batch Edit page DOM**

Inspect `https://seller-id.tokopedia.com/product/batch/edit-prods?entry-from=manage&shop_region=ID`:
- Same analysis as Shopee

- [ ] **Step 4: Create `extension/content/tokopedia-upload.js`**

Same pattern for Tokopedia upload page.

- [ ] **Step 5: Commit**

```bash
git add extension/content/shopee-upload.js extension/content/tokopedia-upload.js
git commit -m "feat(extension): marketplace stock upload content scripts"
```

---

### Task 6: Background Orchestrator — Full Sync Flow

**Files:**
- Modify: `extension/background/service-worker.js`
- Modify: `extension/manifest.json` (add upload content scripts to manifest)

**Interfaces:**
- Consumes:
  - `{ action: "START_SYNC" }` from popup
  - `stockhub-api.js`: `uploadOrderFile()`, `downloadExport()`
  - Content script responses from Tasks 3, 4, 5
- Produces:
  - `{ action: "SYNC_PROGRESS", step, status, message }` to popup
  - `{ action: "SYNC_COMPLETE", success, summary }` to popup

- [ ] **Step 1: Implement sync orchestrator in `service-worker.js`**

```js
// Sync flow:
// 1. Open Shopee order tab → inject content script → export orders → get file
// 2. Open Tokopedia order tab → inject content script → export orders → get file
// 3. Upload Shopee order file to Stock-Hub API
// 4. Upload Tokopedia order file to Stock-Hub API
// 5. Download Shopee stock export from Stock-Hub API
// 6. Download Tokopedia stock export from Stock-Hub API
// 7. Open Shopee mass update tab → inject content script → upload stock file
// 8. Open Tokopedia batch edit tab → inject content script → upload stock file
// 9. Close opened tabs, report summary
```

Each step sends `SYNC_PROGRESS` message to popup.
On any step failure: log error, continue to next step if possible (e.g., if Shopee fails, still try Tokopedia), report partial results.

Guard against concurrent sync: track `isSyncing` flag, reject duplicate START_SYNC.

- [ ] **Step 2: Implement tab management helpers**

```js
// openTab(url) → Promise<tab> — opens tab, waits for load
// closeTab(tabId) → Promise<void>
// sendToTab(tabId, message) → Promise<response> — sends message to content script in tab
// injectAndSend(url, scriptFile, message) → Promise<response> — open tab, inject script, send message, return response
```

- [ ] **Step 3: Implement file conversion helpers**

```js
// base64ToBlob(base64, type) → Blob
// blobToBase64(blob) → Promise<string>
// base64ToFile(base64, name, type) → File
```

- [ ] **Step 4: Wire up content scripts in manifest.json**

Add `shopee-upload.js` and `tokopedia-upload.js` to content_scripts, or use `scripting.executeScript()` for on-demand injection.

- [ ] **Step 5: Manual integration test**

Full flow: click Sync → watch all 8 steps execute → verify stock updated on both marketplaces.

- [ ] **Step 6: Commit**

```bash
git add extension/
git commit -m "feat(extension): full sync orchestrator with progress tracking"
```

---

### Task 7: Polish, Error Handling & Firefox Compat

**Files:**
- Modify: `extension/popup/popup.html`
- Modify: `extension/popup/popup.css`
- Modify: `extension/popup/popup.js`
- Modify: `extension/background/service-worker.js`
- Create: `extension/README.md`

**Interfaces:**
- Consumes: all previous tasks
- Produces: production-ready extension for Chrome and Firefox

- [ ] **Step 1: Add sync history to popup**

Store last 5 sync results in `browser.storage.local` with timestamps. Show in popup below the sync button.

- [ ] **Step 2: Add individual marketplace toggles**

Checkboxes in popup: ☑ Shopee ☑ Tokopedia. User can uncheck one to sync only the other.

- [ ] **Step 3: Add retry logic for transient failures**

If a content script step fails with timeout, retry once before marking as failed.

- [ ] **Step 4: Test Firefox compatibility**

Load via `about:debugging` → Load Temporary Add-on → `manifest.v2.json`.
Verify all flows work. Fix any `chrome.*` → `browser.*` API differences using polyfill.

- [ ] **Step 5: Create `extension/README.md`**

Installation instructions for Chrome and Firefox, configuration guide, troubleshooting (login detection, selector changes).

- [ ] **Step 6: Commit**

```bash
git add extension/
git commit -m "feat(extension): polish, Firefox compat, and documentation"
```

---
