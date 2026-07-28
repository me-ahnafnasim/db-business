#!/usr/bin/env node
// Generates the app's launcher, adaptive, monochrome and splash icons.
//
// The repository had no `assets/` directory and not one image file, so every build shipped
// the default green Expo icon. This writes real, valid PNGs with nothing but `zlib` — adding
// an image library to produce four placeholder files would not have been a fair trade.
//
// The mark is a gold "N" on brand navy. It is a PLACEHOLDER: drop real artwork over these
// filenames and this script becomes unnecessary. Re-run with:
//
//   node scripts/make-placeholder-icons.js
//
// Sizes follow the Android spec: a 1024x1024 source, and for the adaptive icon the visible
// area is only the centre 66/108 of the canvas, so the mark is kept well inside that circle.

const fs = require("fs");
const path = require("path");
const zlib = require("zlib");

const OUT_DIR = path.join(__dirname, "..", "assets");
const SIZE = 1024;

// Straight from src/theme/colors.js — the icon should not drift from the app's palette.
const NAVY = [0x0a, 0x0e, 0x27];
const GOLD = [0xd4, 0xaf, 0x37];
const WHITE = [0xff, 0xff, 0xff];

// ---------------------------------------------------------------------------------------
// PNG encoding
// ---------------------------------------------------------------------------------------

const CRC_TABLE = (() => {
  const table = new Int32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    table[n] = c;
  }
  return table;
})();

function crc32(buffer) {
  let c = -1;
  for (let i = 0; i < buffer.length; i++) c = CRC_TABLE[(c ^ buffer[i]) & 0xff] ^ (c >>> 8);
  return (c ^ -1) >>> 0;
}

function chunk(type, data) {
  const length = Buffer.alloc(4);
  length.writeUInt32BE(data.length, 0);
  const typeAndData = Buffer.concat([Buffer.from(type, "ascii"), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(typeAndData), 0);
  return Buffer.concat([length, typeAndData, crc]);
}

// 8-bit RGBA, no interlacing. `pixels` is width * height * 4 bytes.
function encodePng(width, height, pixels) {
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 6; // colour type: truecolour with alpha
  ihdr[10] = 0; // deflate
  ihdr[11] = 0; // adaptive filtering
  ihdr[12] = 0; // no interlace

  // Every scanline gets a leading filter byte. Filter 0 (None) keeps this readable; the
  // shapes are flat colour, so deflate compresses them to a few KB regardless.
  const stride = width * 4;
  const raw = Buffer.alloc((stride + 1) * height);
  for (let y = 0; y < height; y++) {
    raw[y * (stride + 1)] = 0;
    pixels.copy(raw, y * (stride + 1) + 1, y * stride, (y + 1) * stride);
  }

  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk("IHDR", ihdr),
    chunk("IDAT", zlib.deflateSync(raw, { level: 9 })),
    chunk("IEND", Buffer.alloc(0)),
  ]);
}

// ---------------------------------------------------------------------------------------
// The mark
// ---------------------------------------------------------------------------------------

// A bold "N" inside the unit square: left stem, right stem, and a diagonal whose thickness
// is measured horizontally, which is what makes a steep stroke look even.
const STROKE = 0.15;

function insideN(u, v) {
  if (u < 0 || u > 1 || v < 0 || v > 1) return false;
  if (u <= STROKE * 2) return true;
  if (u >= 1 - STROKE * 2) return true;
  const centre = STROKE + (1 - STROKE * 2) * v;
  return Math.abs(u - centre) <= STROKE;
}

// 3x3 supersampling. A hard pixel test leaves visibly stepped diagonals at launcher sizes;
// nine samples per pixel is enough to read as smooth and costs ~9M evaluations at 1024².
const SUB = 3;

function render({ background, mark, markScale }) {
  const pixels = Buffer.alloc(SIZE * SIZE * 4);
  const boxSize = SIZE * markScale;
  const origin = (SIZE - boxSize) / 2;

  for (let y = 0; y < SIZE; y++) {
    for (let x = 0; x < SIZE; x++) {
      let hits = 0;
      for (let sy = 0; sy < SUB; sy++) {
        for (let sx = 0; sx < SUB; sx++) {
          const px = x + (sx + 0.5) / SUB;
          const py = y + (sy + 0.5) / SUB;
          if (insideN((px - origin) / boxSize, (py - origin) / boxSize)) hits++;
        }
      }
      const coverage = hits / (SUB * SUB);
      const offset = (y * SIZE + x) * 4;

      if (background) {
        // Opaque: composite the mark over the background colour.
        for (let c = 0; c < 3; c++) {
          pixels[offset + c] = Math.round(background[c] * (1 - coverage) + mark[c] * coverage);
        }
        pixels[offset + 3] = 255;
      } else {
        // Transparent: the mark carries its own alpha, which is what an adaptive icon
        // foreground and a splash image both need.
        for (let c = 0; c < 3; c++) pixels[offset + c] = mark[c];
        pixels[offset + 3] = Math.round(coverage * 255);
      }
    }
  }
  return encodePng(SIZE, SIZE, pixels);
}

// ---------------------------------------------------------------------------------------

// Android maps the full adaptive-icon canvas to 108dp but only guarantees the centre 66dp is
// visible — 61% — so anything outside that circle can be masked away by the launcher. 0.40
// keeps the whole mark inside it with room to spare on a circular mask.
const ADAPTIVE_SAFE_SCALE = 0.4;

const TARGETS = [
  // The square launcher icon, and the Play Console's 512x512 source.
  { file: "icon.png", background: NAVY, mark: GOLD, markScale: 0.52 },
  // Composited by the launcher over `adaptiveIcon.backgroundColor`.
  { file: "adaptive-icon.png", background: null, mark: GOLD, markScale: ADAPTIVE_SAFE_SCALE },
  // Android 13 themed icons: the system recolours this, so only the alpha matters.
  { file: "monochrome-icon.png", background: null, mark: WHITE, markScale: ADAPTIVE_SAFE_SCALE },
  // Sits on `splash.backgroundColor`, so it stays transparent.
  { file: "splash-icon.png", background: null, mark: GOLD, markScale: 0.42 },
];

fs.mkdirSync(OUT_DIR, { recursive: true });

for (const target of TARGETS) {
  const png = render(target);
  const destination = path.join(OUT_DIR, target.file);
  fs.writeFileSync(destination, png);
  console.log(`  ${target.file.padEnd(22)} ${SIZE}x${SIZE}  ${(png.length / 1024).toFixed(1)} KB`);
}

console.log(`\nWrote ${TARGETS.length} placeholder icons to assets/.`);
console.log("Replace them with real artwork when it exists — the filenames are what app.json references.");
