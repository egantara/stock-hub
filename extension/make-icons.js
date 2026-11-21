import sharp from 'sharp';
import fs from 'node:fs';

const svg = (size) => `
<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
  <rect width="${size}" height="${size}" rx="${Math.floor(size * 0.2)}" fill="#4338ca"/>
  <text x="50%" y="60%" font-family="system-ui, sans-serif" font-size="${Math.floor(size * 0.6)}" font-weight="bold" fill="#ffffff" text-anchor="middle" dominant-baseline="middle">S</text>
</svg>
`;

if (!fs.existsSync('extension/icons')) {
  fs.mkdirSync('extension/icons', { recursive: true });
}

for (const size of [16, 48, 128]) {
  await sharp(Buffer.from(svg(size)))
    .png()
    .toFile(`extension/icons/icon-${size}.png`);
  console.log(`Generated icon-${size}.png`);
}
