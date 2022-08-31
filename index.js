import yargs from 'yargs/yargs';
import { hideBin } from 'yargs/helpers';
import UPNG from 'upng-js';
import * as fs from 'fs/promises';
import * as pathlib from 'path';
import './buffer-replace.js';
import encBwRle from './encodings/bw_rle.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = pathlib.dirname(__filename);

const encodings = { encBwRle };
const { argv } = yargs(hideBin(process.argv))
  .usage('Usage: $0 <file> [options]')
  .option('video', {
    alias: 'v',
    describe: 'Animated PNG/APNG file',
    type: 'string',
  })
  .option('encoding', {
    alias: 'e',
    describe: 'Video encoding type',
    choices: Object.keys(encodings),
    default: 'encBwRle'
  })
  .option('audio', {
    alias: 'a',
    describe: 'MIDI audio file',
    type: 'string'
  })
  .option('output', {
    alias: 'o',
    describe: 'Output directory path',
    type: 'string'
  })
  .check(argv => {
    //Check if at least one audio/video flag is set
    if (!(argv.audio || argv.video)) {
      throw new Error("No actions to perform. Specify either -v or -a flag");
    }
    //Check if paths point to valid files
    const paths = [
      argv.video ?? null,
      argv.audio ?? null
    ];
    for (const path of paths) {
      if (!path) continue;
      if (!(await fs.exists(path))) {
        throw new Error(`File doesn't exist: "${path}"`)
      }
      const lstat = await fs.lstat(path);
      if (lstat.isDirectory()) {
        throw new Error(`Is a directory: "${path}"`)
      } else if (!(lstat.isFile())) {
        throw new Error(`Not a file: "${path}"`)
      }
    }
    return true;
  });
let { audio, video, output, encoding } = argv;
audio = pathlib.resolve(audio);
video = pathlib.resolve(video);

/* Generate video */
let outLua, outVideoBin;
if (video) {
  console.log(`Using video encoding "${encoding}"`);
  
  console.log(`Reading file "${ video }"...`);
  const pngBuf = await fs.readFile(video);
  
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
  const POSTFIX = String.raw `]=]):gsub("\nr","\r"):gsub("\nn","\n"):gsub("\n0","\0");`;
  const playerPath = `./player/${encoding}.lua`;
  const resolvedPath = pathlib.resolve(__dirname, playerPath);
  const playerCode = await fs.readFile(resolvedPath);
  const processedBuf = buf
    .replace(Buffer.from([10]), Buffer.from([10, 'n'.charCodeAt()]))
    .replace(Buffer.from([13]), Buffer.from([10, 'r'.charCodeAt()]))
    .replace(Buffer.from([0 ]), Buffer.from([10, '0'.charCodeAt()]));
  const lua = Buffer.concat([
    Buffer.from(PREFIX),
    processedBuf,
    Buffer.from(POSTFIX),
    playerCode
  ]);
  console.log(`\t- Player code size: ${lua.length} characters`);
  outLua = lua;
  outVideoBin = buf;
}

/* Write generated data */
{
  console.log("Writing data...");
  try {
    await fs.rm("./output", { recursive: true });
  } catch {}
  await fs.mkdir("./output");
  const promises = [];
  if (video) {
    promises.push(
      fs.writeFile("./output/player.lua", outLua),
      fs.writeFile("./output/video.bin", outVideoBin)
    );
  }
  await Promise.all(promises);
}

console.log("Done. Check output directory");
