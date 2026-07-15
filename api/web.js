import fs from "fs/promises";
import os from "os";
import path from "path";

import { authorizeWeb } from "../services/license/middleware.js";
import { getRows } from "../services/google/google-sheet.js";
import { exportShopee } from "../services/marketplace/command/shopee.js";
import { exportTikTok } from "../services/marketplace/command/tiktok.js";
import { processOrderFile } from "../services/order/process-order-file.js";
import { processNewFile, processStatusFile } from "../services/product/file.js";
import { processStatusCommand } from "../services/product/command/status.js";
import { loadStore } from "../services/google/store.js";
import { processSalesCommand } from "../services/stock/command/sales.js";
import { processStockFile } from "../services/stock/file.js";
import { processRestockCommand } from "../services/stock/command/restock.js";
import { processSetCommand } from "../services/stock/command/set.js";
import { processStockCommand } from "../services/stock/command/stock.js";
import { runTask } from "../services/utils/queue.js";

const JSON_LIMIT = 1024 * 1024;
const FILE_LIMIT = 12 * 1024 * 1024;

const COMMAND_PROCESSORS = {
  stock: {
    command: "/stock",
    processor: ({ google, text }) => processStockCommand({ google, text })
  },
  set: {
    command: "/set",
    processor: ({ google, text, user }) => processSetCommand({ google, text, user })
  },
  restock: {
    command: "/restock",
    processor: ({ google, text, user }) => processRestockCommand({ google, text, user })
  },
  sales: {
    command: "/sales",
    processor: ({ google, text, user }) => processSalesCommand({ google, text, user })
  },
  status: {
    command: "/status",
    processor: ({ google, text, user }) => processStatusCommand({ google, text, user })
  }
};

const UPLOAD_PROCESSORS = {
  order: ({ google, filePath, user }) => processOrderFile({ google, filePath, user }),
  product: ({ google, filePath, user }) => processNewFile({ google, filePath, user }),
  status: ({ google, filePath, user }) => processStatusFile({ google, filePath, user }),
  set: ({ google, filePath, user }) => processStockFile({ google, filePath, mode: "SET", user }),
  restock: ({ google, filePath, user }) => processStockFile({ google, filePath, mode: "RESTOCK", user })
};

const TEMPLATES = {
  stock: "template-stock.xlsx",
  shopee: "template-shopee.xlsx",
  tiktok: "template-tiktok.xlsx"
};

const EXPORTS = {
  shopee: {
    fileName: "shopee-export.xlsx",
    processor: exportShopee
  },
  tiktok: {
    fileName: "tiktok-export.xlsx",
    processor: exportTikTok
  }
};

function sendJson(res, status, payload) {
  res.status(status).json(payload);
}

function getAccessKey(req) {
  return req.headers["x-access-key"] || req.query?.key || "";
}

function getAccessUser(req) {
  return req.headers["x-user"] || req.query?.user || "";
}

function requireWebPassword(req) {
  const password = String(getAccessKey(req) || "").trim();

  if (!password) {
    const error = new Error("Invalid web access.");
    error.statusCode = 401;
    throw error;
  }

  return password;
}

function requireWebUser(req) {
  const user = String(getAccessUser(req) || "").trim();

  if (!user) {
    const error = new Error("User wajib diisi.");
    error.statusCode = 401;
    throw error;
  }

  return user;
}

async function readBuffer(req, limit) {
  if (Buffer.isBuffer(req.body)) {
    if (req.body.length > limit) {
      const error = new Error("Payload is too large.");
      error.statusCode = 413;
      throw error;
    }

    return req.body;
  }

  if (typeof req.body === "string") {
    const buffer = Buffer.from(req.body, "binary");

    if (buffer.length > limit) {
      const error = new Error("Payload is too large.");
      error.statusCode = 413;
      throw error;
    }

    return buffer;
  }

  const chunks = [];
  let total = 0;

  for await (const chunk of req) {
    total += chunk.length;

    if (total > limit) {
      const error = new Error("Payload is too large.");
      error.statusCode = 413;
      throw error;
    }

    chunks.push(chunk);
  }

  return Buffer.concat(chunks);
}

async function readJson(req) {
  if (req.body && typeof req.body === "object") {
    return req.body;
  }

  const buffer = await readBuffer(req, JSON_LIMIT);

  if (!buffer.length) {
    return {};
  }

  return JSON.parse(buffer.toString("utf8"));
}

function parseContentDisposition(value = "") {
  const result = {};

  for (const part of value.split(";")) {
    const [key, ...rest] = part.trim().split("=");

    if (!rest.length) {
      continue;
    }

    result[key.toLowerCase()] = rest.join("=").trim().replace(/^"|"$/g, "");
  }

  return result;
}

function parseMultipart(buffer, contentType) {
  const boundaryMatch = contentType.match(/boundary=(?:"([^"]+)"|([^;]+))/);
  const boundary = boundaryMatch?.[1] || boundaryMatch?.[2];

  if (!boundary) {
    const error = new Error("Upload boundary was not found.");
    error.statusCode = 400;
    throw error;
  }

  const body = buffer.toString("binary");
  const parts = body.split(`--${boundary}`);
  const fields = {};
  let file = null;

  for (const part of parts) {
    if (!part || part === "--\r\n" || part === "--") {
      continue;
    }

    const headerEnd = part.indexOf("\r\n\r\n");

    if (headerEnd === -1) {
      continue;
    }

    const headerText = part.slice(0, headerEnd);
    let content = part.slice(headerEnd + 4);

    if (content.endsWith("\r\n")) {
      content = content.slice(0, -2);
    }

    const dispositionLine = headerText
      .split("\r\n")
      .find(line => line.toLowerCase().startsWith("content-disposition:"));

    if (!dispositionLine) {
      continue;
    }

    const disposition = parseContentDisposition(
      dispositionLine.split(":").slice(1).join(":")
    );

    if (!disposition.name) {
      continue;
    }

    if (disposition.filename) {
      file = {
        field: disposition.name,
        filename: path.basename(disposition.filename),
        buffer: Buffer.from(content, "binary")
      };
      continue;
    }

    fields[disposition.name] = Buffer.from(content, "binary").toString("utf8");
  }

  return { fields, file };
}

function buildCommandText(command, items = []) {
  const lines = items
    .map(item => `${String(item.sku || "").trim()} ${String(item.qty ?? item.status ?? "").trim()}`)
    .filter(line => line.trim());

  return [command, ...lines].join("\n");
}

function buildStockText(command, skus = []) {
  const lines = skus
    .map(sku => String(sku || "").trim())
    .filter(Boolean);

  return [command, ...lines].join("\n");
}

async function getAuth(req) {
  return authorizeWeb({
    user: requireWebUser(req),
    password: requireWebPassword(req)
  });
}

async function handleSession(req, res) {
  const auth = await getAuth(req);

  sendJson(res, 200, {
    ok: true,
    client: {
      id: auth.context.clientId,
      name: auth.context.clientName,
      user: auth.context.userName,
      plan: auth.context.plan,
      endDate: auth.context.endDate
    }
  });
}

function asNumber(value) {
  const number = Number(value || 0);
  return Number.isFinite(number) ? number : 0;
}

function formatTime(value) {
  return String(value || "").trim();
}

function buildDashboard({ store, logs }) {
  const stockRows = store.stockRows || [];
  const productRows = store.productRows || [];
  const today = new Date().toISOString().slice(0, 10);
  const activeProducts = productRows.filter(row => String(row.STATUS || "").toUpperCase() === "ACTIVE");
  const lowStockRows = stockRows.filter(row => {
    const stock = asNumber(row.STOCK);
    return stock > 0 && stock <= 5;
  });
  const outOfStockRows = stockRows.filter(row => asNumber(row.STOCK) <= 0);
  const ordersToday = (store.processedRows || []).filter(row => {
    const value = Object.values(row).join(" ");
    return value.includes(today);
  }).length;

  return {
    totals: {
      sku: stockRows.length,
      activeSku: activeProducts.length,
      lowStock: lowStockRows.length,
      outOfStock: outOfStockRows.length,
      ordersToday
    },
    lastUpdate: stockRows
      .map(row => row.LAST_UPDATE)
      .filter(Boolean)
      .slice(-1)[0] || "",
    activities: logs.slice(-6).reverse().map(row => ({
      command: row.COMMAND || row.AKSI || row.ACTION || "Activity",
      sku: row.SKU || "",
      qty: row.QTY || "",
      marketplace: row.MARKETPLACE || "",
      user: row.USER || "",
      time: formatTime(row.TIMESTAMP || row.DATE || row.CREATED_AT || row.WAKTU)
    }))
  };
}

async function handleDashboard(req, res) {
  const auth = await getAuth(req);

  const [store, logs] = await Promise.all([
    loadStore({ google: auth.google }),
    getRows({ google: auth.google, sheetName: "LOG" }).catch(() => [])
  ]);

  sendJson(res, 200, {
    ok: true,
    dashboard: buildDashboard({ store, logs })
  });
}

async function handleSearch(req, res) {
  const query = String(req.query?.q || "").trim().toLowerCase();

  if (!query) {
    sendJson(res, 200, { ok: true, results: [] });
    return;
  }

  const auth = await getAuth(req);
  const store = await loadStore({ google: auth.google });
  const results = store.productRows
    .map(product => {
      const stock = store.stockMap.get(product.SKU);

      return {
        sku: product.SKU || "",
        name: product.NAMA || product.NAME || "",
        variation: product.VARIASI || "",
        status: product.STATUS || "",
        marketplace: product.MARKETPLACE || "",
        shopee: product.SHOPEE_PRODUCT_ID ? asNumber(stock?.STOCK) : null,
        tiktok: product.TIKTOK_PRODUCT_ID ? asNumber(stock?.STOCK) : null,
        stock: asNumber(stock?.STOCK),
        lastUpdate: stock?.LAST_UPDATE || ""
      };
    })
    .filter(item => [
      item.sku,
      item.name,
      item.variation,
      item.marketplace
    ].join(" ").toLowerCase().includes(query))
    .slice(0, 10);

  sendJson(res, 200, { ok: true, results });
}

async function handleCommand(req, res) {
  const body = await readJson(req);
  const action = String(body.action || "").trim();
  const route = COMMAND_PROCESSORS[action];

  if (!route) {
    sendJson(res, 400, { ok: false, error: "Unknown action." });
    return;
  }

  const auth = await getAuth(req);
  const text = action === "stock"
    ? buildStockText(route.command, body.skus)
    : buildCommandText(route.command, body.items);

  const result = await runTask(() => route.processor({
    google: auth.google,
    text,
    user: auth.context.userName
  }));

  sendJson(res, 200, { ok: true, result });
}

async function handleUpload(req, res) {
  const contentType = req.headers["content-type"] || "";

  if (!contentType.includes("multipart/form-data")) {
    sendJson(res, 400, { ok: false, error: "Use multipart/form-data for uploads." });
    return;
  }

  const body = await readBuffer(req, FILE_LIMIT);
  const { fields, file } = parseMultipart(body, contentType);
  const action = String(fields.action || "").trim();
  const processor = UPLOAD_PROCESSORS[action];

  if (!processor) {
    sendJson(res, 400, { ok: false, error: "Unknown upload type." });
    return;
  }

  if (!file?.buffer?.length) {
    sendJson(res, 400, { ok: false, error: "No file selected." });
    return;
  }

  const auth = await getAuth(req);
  const suffix = path.extname(file.filename) || ".xlsx";
  const filePath = path.join(os.tmpdir(), `stock-hub-${Date.now()}-${Math.random().toString(36).slice(2)}${suffix}`);

  try {
    await fs.writeFile(filePath, file.buffer);

    const result = await runTask(() => processor({
      google: auth.google,
      filePath,
      user: auth.context.userName
    }));

    sendJson(res, 200, { ok: true, result });
  } finally {
    await fs.unlink(filePath).catch(() => {});
  }
}

async function handleTemplate(req, res) {
  await getAuth(req);

  const name = String(req.query?.name || "stock").trim().toLowerCase();
  const fileName = TEMPLATES[name];

  if (!fileName) {
    sendJson(res, 404, { ok: false, error: "Template was not found." });
    return;
  }

  const filePath = path.join(process.cwd(), "templates", fileName);
  const file = await fs.readFile(filePath);

  res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
  res.setHeader("Content-Disposition", `attachment; filename="${fileName}"`);
  res.status(200).send(file);
}

async function sendFile(res, filePath, fileName) {
  const file = await fs.readFile(filePath);

  res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
  res.setHeader("Content-Disposition", `attachment; filename="${fileName}"`);
  res.status(200).send(file);
}

async function handleExport(req, res) {
  const name = String(req.query?.name || "").trim().toLowerCase();
  const target = EXPORTS[name];

  if (!target) {
    sendJson(res, 404, { ok: false, error: "Export was not found." });
    return;
  }

  const auth = await getAuth(req);
  const filePath = await runTask(() => target.processor({ google: auth.google }));

  try {
    await sendFile(res, filePath, target.fileName);
  } finally {
    await fs.unlink(filePath).catch(() => {});
  }
}

export default async function handler(req, res) {
  try {
    const route = String(req.query?.route || "").trim();

    if (req.method === "GET" && route === "session") {
      await handleSession(req, res);
      return;
    }

    if (req.method === "GET" && route === "dashboard") {
      await handleDashboard(req, res);
      return;
    }

    if (req.method === "GET" && route === "search") {
      await handleSearch(req, res);
      return;
    }

    if (req.method === "GET" && route === "template") {
      await handleTemplate(req, res);
      return;
    }

    if (req.method === "GET" && route === "export") {
      await handleExport(req, res);
      return;
    }

    if (req.method === "POST" && route === "command") {
      await handleCommand(req, res);
      return;
    }

    if (req.method === "POST" && route === "upload") {
      await handleUpload(req, res);
      return;
    }

    sendJson(res, 404, { ok: false, error: "Route was not found." });
  } catch (error) {
    console.error("WEB ERROR:", error);

    sendJson(res, error.statusCode || 500, {
      ok: false,
      error: error.message || "Something went wrong."
    });
  }
}
