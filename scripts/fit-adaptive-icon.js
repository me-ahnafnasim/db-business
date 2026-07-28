#!/usr/bin/env node
// Derives the Android adaptive-icon and monochrome layers from assets/icon.png.
//
// WHY THIS EXISTS
//
// Android maps an adaptive icon's full canvas to 108dp but only guarantees the centre 66dp
// is visible — everything outside that circle can be cropped by the launcher's mask. The
// shoe-sole mark in icon.png spans 767px of a 1024px canvas, so its furthest pixel sits
// 421px from centre against a 313px safe radius: it overflowed by 108px and the top of the
// sole and the heel chevrons were being cut off on every circular-mask launcher.
//
// This rescales the ARTWORK rather than redrawing it. icon.png is untouched and stays the
// source of truth — the legacy launcher icon has no safe zone, so filling the canvas there
// is correct.
//
// Run:  node scripts/fit-adaptive-icon.js
//
// No image dependency: PNG decode is zlib inflate plus the five standard scanline filters,
// and downsampling is a box filter, which is the right choice for shrinking flat vector-style
// art — it averages exactly the source pixels each output pixel covers, with no ringing.

const fs = require("fs");
const path = require("path");
const zlib = require("zlib");

const ASSETS = path.join(__dirname, "..", "assets");
const SOURCE = path.join(ASSETS, "icon.png");

// 66/108 is Android's guaranteed-visible fraction of the canvas.
const SAFE_FRACTION = 66 / 108;
// How much of the safe radius the mark is allowed to occupy. Below 1.0 so it never grazes
// the mask edge on an aggressive launcher shape — but not much below, or the icon reads as
// a small mark floating in a large field.
const FILL = 0.92;

// ---------------------------------------------------------------------------------------
// PNG decode
// ---------------------------------------------------------------------------------------

function decodePng(file) {
  const buf = fs.readFileSync(file);
  let pos = 8;
  let width = 0;
  let height = 0;
  let bitDepth = 0;
  let colorType = 0;
  const idat = [];

  while (pos < buf.length) {
    const length = buf.readUInt32BE(pos);
    const type = buf.toString("ascii", pos + 4, pos + 8);
    const data = buf.subarray(pos + 8, pos + 8 + length);
    if (type === "IHDR") {
      width = data.readUInt32BE(0);
      height = data.readUInt32BE(4);
      bitDepth = data[8];
      colorType = data[9];
    } else if (type === "IDAT") {
      idat.push(data);
    } else if (type === "IEND") {
      break;
    }
    pos += 12 + length;
  }

  if (bitDepth !== 8) throw new Error(`${file}: only 8-bit PNGs are supported (got ${bitDepth})`);
  const channels = { 0: 1, 2: 3, 4: 2, 6: 4 }[colorType];
  if (!channels) throw new Error(`${file}: unsupported colour type ${colorType}`);

  const raw = zlib.inflateSync(Buffer.concat(idat));
  const stride = width * channels;
  const out = Buffer.alloc(stride * height);
  let read = 0;

  for (let y = 0; y < height; y++) {
    const filter = raw[read++];
    const line = raw.subarray(read, read + stride);
    read += stride;
    const cur = out.subarray(y * stride, (y + 1) * stride);
    const prev = y ? out.subarray((y - 1) * stride, y * stride) : Buffer.alloc(stride);

    for (let x = 0; x < stride; x++) {
      const left = x >= channels ? cur[x - channels] : 0;
      const up = prev[x];
      const upLeft = x >= channels ? prev[x - channels] : 0;
      let value = line[x];
      if (filter === 1) value += left;
      else if (filter === 2) value += up;
      else if (filter === 3) value += (left + up) >> 1;
      else if (filter === 4) {
        // Paeth
        const p = left + up - upLeft;
        const pa = Math.abs(p - left);
        const pb = Math.abs(p - up);
        const pc = Math.abs(p - upLeft);
        value += pa <= pb && pa <= pc ? left : pb <= pc ? up : upLeft;
      }
      cur[x] = value & 0xff;
    }
  }

  return { width, height, channels, pixels: out };
}

// ---------------------------------------------------------------------------------------
// PNG encode (RGBA)
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
  const body = Buffer.concat([Buffer.from(type, "ascii"), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(body), 0);
  return Buffer.concat([length, body, crc]);
}

function encodePng(width, height, rgba) {
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8;
  ihdr[9] = 6;
  const stride = width * 4;
  const raw = Buffer.alloc((stride + 1) * height);
  for (let y = 0; y < height; y++) {
    raw[y * (stride + 1)] = 0;
    rgba.copy(raw, y * (stride + 1) + 1, y * stride, (y + 1) * stride);
  }
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk("IHDR", ihdr),
    chunk("IDAT", zlib.deflateSync(raw, { level: 9 })),
    chunk("IEND", Buffer.alloc(0)),
  ]);
}

// ---------------------------------------------------------------------------------------

// Box filter. Each destination pixel averages exactly the source pixels it covers, so a
// 1024 -> 562 shrink of flat art stays clean with no resampling artefacts.
function downsample(source, size) {
  const { width, height, channels, pixels } = source;
  const out = Buffer.alloc(size * size * 4);
  const scaleX = width / size;
  const scaleY = height / size;

  for (let y = 0; y < size; y++) {
    const y0 = Math.floor(y * scaleY);
    const y1 = Math.max(y0 + 1, Math.floor((y + 1) * scaleY));
    for (let x = 0; x < size; x++) {
      const x0 = Math.floor(x * scaleX);
      const x1 = Math.max(x0 + 1, Math.floor((x + 1) * scaleX));
      let r = 0, g = 0, b = 0, a = 0, count = 0;
      for (let sy = y0; sy < y1 && sy < height; sy++) {
        for (let sx = x0; sx < x1 && sx < width; sx++) {
          const o = (sy * width + sx) * channels;
          r += pixels[o];
          g += pixels[o + 1];
          b += pixels[o + 2];
          a += channels === 4 ? pixels[o + 3] : 255;
          count += 1;
        }
      }
      const d = (y * size + x) * 4;
      out[d] = Math.round(r / count);
      out[d + 1] = Math.round(g / count);
      out[d + 2] = Math.round(b / count);
      out[d + 3] = Math.round(a / count);
    }
  }
  return out;
}

// Replaces every pixel with white, and sets alpha from how far the pixel is from the
// background colour. Android tints this layer itself, so only the alpha silhouette matters.
function toMonochrome(source) {
  const { width, height, channels, pixels } = source;
  const bg = [pixels[0], pixels[1], pixels[2]];
  const out = Buffer.alloc(width * height * 4);
  for (let i = 0, p = 0; i < width * height; i++, p += channels) {
    const distance =
      Math.abs(pixels[p] - bg[0]) + Math.abs(pixels[p + 1] - bg[1]) + Math.abs(pixels[p + 2] - bg[2]);
    const d = i * 4;
    out[d] = 255;
    out[d + 1] = 255;
    out[d + 2] = 255;
    // Ramps over a narrow band so anti-aliased edges survive instead of hard-clipping.
    out[d + 3] = Math.max(0, Math.min(255, Math.round((distance - 20) * 6)));
  }
  return { width, height, channels: 4, pixels: out };
}

function centred(scaled, size, canvas, background) {
  const out = Buffer.alloc(canvas * canvas * 4);
  for (let i = 0; i < canvas * canvas; i++) {
    const d = i * 4;
    out[d] = background[0];
    out[d + 1] = background[1];
    out[d + 2] = background[2];
    out[d + 3] = background[3];
  }
  const offset = Math.round((canvas - size) / 2);
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const s = (y * size + x) * 4;
      const d = ((y + offset) * canvas + (x + offset)) * 4;
      // Source-over, so a transparent monochrome layer composites onto transparency rather
      // than picking up a black fringe.
      const alpha = scaled[s + 3] / 255;
      out[d] = Math.round(scaled[s] * alpha + out[d] * (1 - alpha));
      out[d + 1] = Math.round(scaled[s + 1] * alpha + out[d + 1] * (1 - alpha));
      out[d + 2] = Math.round(scaled[s + 2] * alpha + out[d + 2] * (1 - alpha));
      out[d + 3] = Math.max(out[d + 3], scaled[s + 3]);
    }
  }
  return out;
}

// Measures how far the artwork actually reaches from centre, so the scale is derived from
// this mark rather than assumed. A fixed fraction either crops a tall mark or leaves a
// compact one swimming in empty canvas; replace icon.png and this still lands correctly.
function markRadius({ width, height, channels, pixels }) {
  const bg = [pixels[0], pixels[1], pixels[2]];
  const cx = width / 2;
  const cy = height / 2;
  let furthest = 0;
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const o = (y * width + x) * channels;
      const distance =
        Math.abs(pixels[o] - bg[0]) + Math.abs(pixels[o + 1] - bg[1]) + Math.abs(pixels[o + 2] - bg[2]);
      if (distance <= 24) continue;
      furthest = Math.max(furthest, Math.hypot(x - cx, y - cy));
    }
  }
  return furthest;
}

const source = decodePng(SOURCE);
const canvas = source.width;
const bg = [source.pixels[0], source.pixels[1], source.pixels[2], 255];

const safeRadius = (canvas * SAFE_FRACTION) / 2;
const reach = markRadius(source);
// Never scale UP — if the art already fits, leave it at its own size.
const scale = Math.min(1, (safeRadius * FILL) / reach);
const inner = Math.round(canvas * scale);

// Foreground: the artwork shrunk into the safe zone, on its own background colour so the
// added border is seamless.
const foreground = centred(downsample(source, inner), inner, canvas, bg);
fs.writeFileSync(path.join(ASSETS, "adaptive-icon.png"), encodePng(canvas, canvas, foreground));

// Monochrome: the same silhouette, transparent, for Android 13 themed icons. Previously an
// unrelated placeholder, so themed launchers showed a different mark from the real one.
const mono = centred(downsample(toMonochrome(source), inner), inner, canvas, [255, 255, 255, 0]);
fs.writeFileSync(path.join(ASSETS, "monochrome-icon.png"), encodePng(canvas, canvas, mono));

const hex = `#${bg.slice(0, 3).map((v) => v.toString(16).padStart(2, "0")).join("")}`;
console.log(`Source        assets/icon.png  ${canvas}x${canvas}  background ${hex}`);
console.log(`Safe radius   ${safeRadius.toFixed(0)}px (66/108 of ${canvas}); mark reaches ${reach.toFixed(0)}px`);
console.log(`adaptive-icon ${canvas}x${canvas}, artwork scaled to ${(scale * 100).toFixed(1)}% and centred`);
console.log(`monochrome    ${canvas}x${canvas}, alpha silhouette of the same mark`);
console.log(`\nSet android.adaptiveIcon.backgroundColor to ${hex} so the mask edge is seamless.`);
