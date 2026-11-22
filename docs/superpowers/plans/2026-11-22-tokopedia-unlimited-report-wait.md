# Tokopedia Unlimited Report Wait Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Tokopedia waits indefinitely for the newest export report action to change from loading to Download.

**Architecture:** Keep the existing filename/timestamp-based report detection. Replace only the report-stage timeout with an unbounded polling loop; the loop resolves only when the newest report action exposes Download/Unduh and is enabled.

**Tech Stack:** Browser content script JavaScript, generated Firefox extension build.

**Spec:** User-approved behavior in conversation: unlimited wait until loading becomes Download.

## Global Constraints

- Tokopedia-only change.
- Do not modify Shopee behavior.
- Preserve the newest report selection by timestamp.
- Preserve the original `.csv` filename for upload.

## Review Focus

- Newest report remains loading: continue polling.
- Older report is already downloadable: do not select it.
- Action changes to Download after an arbitrary delay: resolve and click it.
- Report never completes: intentionally wait indefinitely.
- Generated Firefox content script matches source content script.

---

### Task 1: Remove Tokopedia report wait timeout

**Files:**
- Modify: `extension/content/tokopedia.js`
- Generate: `extension-firefox/content/tokopedia.js`

**Interfaces:**
- Preserve the existing report-action detector and `latestDownload` result.
- The report wait must no longer pass a finite timeout to `waitFor`.

- [ ] **Step 1: Change the report-stage wait to poll indefinitely**

Use the existing condition callback that selects the newest timestamped report and returns its enabled Download/Unduh action. Replace the finite `waitFor(..., 20000, ...)` call with a dedicated loop or an equivalent wait invocation that has no timeout.

- [ ] **Step 2: Run syntax and build verification**

Run:

```powershell
node --check extension/content/tokopedia.js
node build-firefox.js
node --check extension-firefox/content/tokopedia.js
```

Expected: all commands succeed.

- [ ] **Step 3: Verify generated files and commit**

Run:

```powershell
git diff --check
git add extension/content/tokopedia.js extension-firefox/content/tokopedia.js extension-firefox/manifest.json
git commit -m "fix(tokopedia): wait indefinitely for report download"
git push origin main
```

Expected: commit pushed successfully; Shopee files remain unchanged.
