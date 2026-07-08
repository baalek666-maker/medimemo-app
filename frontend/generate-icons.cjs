const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const svgPath = path.join(__dirname, 'public', 'icon.svg');
const svg = fs.readFileSync(svgPath);

async function generate() {
  for (const size of [192, 512, 180, 167]) {
    const outPath = path.join(__dirname, 'public', `icon-${size}x${size}.png`);
    await sharp(svg)
      .resize(size, size)
      .png()
      .toFile(outPath);
    console.log(`Generated ${outPath}`);
  }
}

generate().catch(e => { console.error(e); process.exit(1); });
