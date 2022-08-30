import UPNG from 'upng-js';
import * as fs from 'fs/promises';
import './buffer-replace.js';
import encBwRle from './encodings/bw_rle.js';

const encodings = {encBwRle};
const file = process.argv[2] ?? "in.png";
const encoding = process.argv[3] ?? "encBwRle";

console.log(`Using encoding "${encoding}"`);

console.log(`Reading file "${file}"...`);
const pngBuf = await fs.readFile(file);

console.log("Decoding png...")
let pixels, width, height;
{
  const image  = UPNG.decode(pngBuf);
  const frames = UPNG.toRGBA8(image);
  const pixarr = [];
  for (const frame of frames) {
    const view = new Uint8ClampedArray(frame);
    for (let i = 0; i < view.length; i++) {
      pixarr.push(view[i]);
    }
  }
  pixels = new Uint8ClampedArray(pixarr);
  width = image.width;
  height = image.height;
  console.log(`\t- Resolution: ${width}x${height}`);
}

console.log("Generating video data...")
const buf = Buffer.from(encodings[encoding](pixels, width, height));
console.log(`\t- Raw buffer size: ${buf.length} bytes.`);
  
console.log("Generating player code...");
const PREFIX = 'local DATA=([=[\n';
const POSTFIX = ']=]):gsub("\\n\\1","\\r"):gsub("\\n\\0","\\n");';
const playerCode = await fs.readFile(`./player/${encoding}.lua`);
const lua = Buffer.concat([
  Buffer.from(PREFIX),
  buf
    .replace(Buffer.from([10]), Buffer.from([10, 0]))
    .replace(Buffer.from([13]), Buffer.from([10, 1])),
  Buffer.from(POSTFIX),
  playerCode
]);
console.log(`\t- Player code size: ${lua.length} characters`);
  
console.log("Writing data...");
await fs.rm("./output", { recursive: true });
await fs.mkdir("./output");
await Promise.all([
  fs.writeFile("./output/player.lua", lua),
  fs.writeFile("./output/video.bin", buf)
]);

console.log("Done.");

