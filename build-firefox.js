import fs from 'node:fs';
import path from 'node:path';

const srcDir = 'extension';
const targetDir = 'extension-firefox';

function copyRecursive(src, dest) {
  if (!fs.existsSync(dest)) {
    fs.mkdirSync(dest, { recursive: true });
  }
  const entries = fs.readdirSync(src, { withFileTypes: true });
  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    if (entry.isDirectory()) {
      copyRecursive(srcPath, destPath);
    } else if (entry.name !== 'manifest.json' && entry.name !== 'manifest.v2.json' && !entry.name.endsWith('.test.js')) {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

copyRecursive(srcDir, targetDir);

const firefoxManifest = {
  manifest_version: 2,
  name: "Stock-Hub Sync",
  version: "1.0.0",
  description: "Sinkronisasi stok otomatis antara Shopee, Tokopedia, dan Stock-Hub",
  browser_specific_settings: {
    gecko: {
      id: "stock-hub-sync@extension.local",
      strict_min_version: "142.0",
      data_collection_permissions: {
        required: ["none"]
      }
    }
  },
  permissions: [
    "<all_urls>",
    "storage",
    "downloads",
    "nativeMessaging",
    "alarms",
    "tabs",
    "https://seller.shopee.co.id/*",
    "https://seller-id.tokopedia.com/*",
    "http://*/*",
    "https://*/*"
  ],
  browser_action: {
    "default_popup": "popup/popup.html",
    "default_icon": {
      "16": "icons/icon-16.png",
      "48": "icons/icon-48.png",
      "128": "icons/icon-128.png"
    }
  },
  background: {
    scripts: ["background/firefox-background.js"]
  },
  icons: {
    "16": "icons/icon-16.png",
    "48": "icons/icon-48.png",
    "128": "icons/icon-128.png"
  },
  content_scripts: [
    {
      matches: ["https://seller.shopee.co.id/portal/sale/order*"],
      js: ["content/shopee.js"],
      run_at: "document_idle"
    },
    {
      matches: ["https://seller.shopee.co.id/portal/product-mass/mass-update/upload*"],
      js: ["content/shopee-upload.js"],
      run_at: "document_idle"
    },
    {
      matches: ["https://seller-id.tokopedia.com/order*"],
      js: ["content/tokopedia.js"],
      run_at: "document_idle"
    },
    {
      matches: ["https://seller-id.tokopedia.com/product/batch/edit-prods*"],
      js: ["content/tokopedia-upload.js"],
      run_at: "document_idle"
    }
  ]
};

fs.writeFileSync(
  path.join(targetDir, 'manifest.json'),
  JSON.stringify(firefoxManifest, null, 2)
);

console.log('extension-firefox created successfully.');
