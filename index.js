import getPixels from 'get-pixels';
import * as fs from 'fs/promises';
import encBwRle from './encodings/bw_rle.js';

const encodings = {encBwRle};

const file = process.argv[2] ?? "in.gif";
const encoding = process.argv[3] ?? "encBwRle";

const luaDatastring = buf => {
  let str = '';
  let dangerEscape = false;
  for (const byte of buf) {
    if (byte == 10) {
      str += '\\n';
      dangerEscape = false;
    } else if ((byte >= 32) && (byte <= 126)) {
      if (dangerEscape && (byte >= 48) && (byte <= 57)) {
        str += '\\' + byte.toString();
        dangerEscape = true;
      } else {
        const chr = String.fromCharCode(byte);
        if ((chr == '\\') || (chr == "'")) {
          str += '\\';
        }
        str += chr;
        dangerEscape = false;
      }
    } else {
      const byteStr = byte.toString();
      str += '\\' + byteStr;
      dangerEscape = byteStr.length !== 3;
    }
  }
  return str;
};

console.log("Reading GIF file...");
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
  lua = lua.replace("$DATASTRING$", luaDatastring(buf));
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
