import getPixels from 'get-pixels';
import * as fs from 'fs/promises';
import encBwRle from './encodings/bw_rle.js';

const encodings = {encBwRle};
const file = process.argv[2] ?? "in.gif";
const encoding = process.argv[3] ?? "encBwRle";

console.log(`Using encoding "${encoding}"`);
console.log(`Reading GIF file (${file})...`);
getPixels(file, async (err, pixels) => {
  if (err) {
    console.error("Error", err);
    return;
  }
  
  console.log("Generating video data...")
  const buf = Buffer.from(encodings[encoding](pixels));
  console.log(`\t- Raw buffer size: ${buf.length} bytes.`);
  
  console.log("Generating player code...");
  let lua = await fs.readFile(`./player/${encoding}.lua`, 'utf-8');
  lua = `local DATA="${ buf.toString('base64') }";` + lua;
  console.log(`\t- Player code size: ${lua.length} characters`);
  
  console.log("Writing data...");
  await fs.rm("./output", { recursive: true });
  await fs.mkdir("./output");
  await Promise.all([
    fs.writeFile("./output/player.lua", lua),
    fs.writeFile("./output/video.bin", buf)
  ]);
  
  console.log("Done.");
});
