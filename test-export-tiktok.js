import {
  exportTikTok
}
from "./services/export-tiktok.js";

console.time(
  "exportTikTok"
);

const file =
  await exportTikTok();

console.timeEnd(
  "exportTikTok"
);

console.log(
  file
);