import getPixels from 'get-pixels';
import * as fs from 'fs/promises';
import encBwRle from './encodings/bw_rle.js';

const encodings = {encBwRle};

const file = process.argv[2] ?? "in.gif";
const encoding = process.argv[3] ?? "encBwRle";

getPixels(file, async (err, pixels) => {
  if (err) {
    console.error("Error", err);
    return;
  }
  const out = encodings[encoding](pixels);
  const outBuf = Buffer.from(out);
  fs.writeFile("out.bin", outBuf);
});
