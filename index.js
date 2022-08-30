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
  const image = UPNG.decode(pngBuf);
  width = image.width;
  height = image.height;
  console.log(`\t- Resolution: ${width}x${height}`);
  
  const frames = UPNG.toRGBA8(image);
  console.log(`\t- Frames: ${frames.length}`);
  
  const buff = Buffer.allocUnsafe(width * height * frames.length * 4);
  let ptr = 0;
  for (const frame of frames) {
    const view = new Uint8ClampedArray(frame);
    for (let i = 0; i < view.length; i++) {
      buff[ptr++] = view[i];
    }
  }
  console.assert(ptr == buff.length, "Buffer not filled");
  pixels = new Uint8ClampedArray(buff);
}

console.log("Generating video data...")
const buf = Buffer.from(encodings[encoding](pixels, width, height));
console.log(`\t- Raw buffer size: ${buf.length} bytes.`);
  
console.log("Generating player code...");
const PREFIX = 'local DATA=([=[\n';
const POSTFIX = String.raw `]=]):gsub("\nn","\r"):gsub("\nr","\n"):gsub("\n0","\0");`;
const playerCode = await fs.readFile(`./player/${encoding}.lua`);
const lua = Buffer.concat([
  Buffer.from(PREFIX),
  buf
    .replace(Buffer.from([0 ]), Buffer.from([10, '0'.charCodeAt()]))
    .replace(Buffer.from([10]), Buffer.from([10, 'n'.charCodeAt()]))
    .replace(Buffer.from([13]), Buffer.from([10, 'r'.charCodeAt()])),
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
