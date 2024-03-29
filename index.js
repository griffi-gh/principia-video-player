import yargs from 'yargs/yargs';
import { hideBin } from 'yargs/helpers';
import UPNG from 'upng-js';
import MIDI from '@tonejs/midi';
import fs from 'fs-extra';
import * as pathlib from 'path';
import { fileURLToPath } from 'url';
import './common/buffer-replace.js';
import luaHex from './common/luastr-workaround.js';
import luaBin from './common/luastr.js';
import encBwRle from './encodings/bw_rle.js';
import luamin from 'luamin';

const { Midi } = MIDI;
const strEncodings = { luaHex, luaBin };
const encBwRleHq = (data, width, height) => encBwRle(data, width, height, true);
const encodings = { encBwRle, encBwRleHq };

const __filename = fileURLToPath(import.meta.url);
const __dirname = pathlib.dirname(__filename);

const argv = await yargs(hideBin(process.argv))
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
    type: 'string',
    default: './_output'
  })
  .option('nominify', {
    alias: 'm',
    describe: 'Do not minify lua files',
    type: 'boolean',
  })
  .option('string', {
    alias: 's',
    describe: 'Lua string encoding type',
    choices: Object.keys(strEncodings),
    default: 'luaHex'
  })
  .check(async argv => {
    //Check if at least one audio/video flag is set
    if (!(argv.audio || argv.video)) {
      return "No actions to perform. Specify either -v or -a flag";
    }
    //Check if paths point to valid files
    const paths = [
      argv.video ?? null,
      argv.audio ?? null
    ];
    for (const path of paths) {
      if (!path) continue;
      if (!(await fs.pathExists(path))) {
        return `File doesn't exist: "${path}"`;
      }
      const lstat = await fs.lstat(path);
      if (lstat.isDirectory()) {
        return `Is a directory: "${path}"`;
      } else if (!(lstat.isFile())) {
        return `Not a file: "${path}"`;
      }
    }
    return true;
  })
  .parseAsync();
let { audio, video, output, encoding, nominify, string: strEnc } = argv;
if (audio) audio = pathlib.resolve(audio);
if (video) video = pathlib.resolve(video);
output = pathlib.resolve(output);

/* Generate video */
let outVideoLua, outVideoBin;
if (video) {
  console.log("=== VIDEO STEP ===");
  
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
  const playerPath = `./player/${encoding}.lua`;
  const resolvedPath = pathlib.resolve(__dirname, playerPath);
  const playerCode = await fs.readFile(resolvedPath, 'utf-8');
  let minPlrCode = playerCode;
  if (!nominify) {
    minPlrCode = luamin.minify(minPlrCode);
  }
  const lua = Buffer.concat([
    Buffer.from('local DATA='),
    strEncodings[strEnc](buf),
    Buffer.from(minPlrCode),
  ]);
  console.log(`\t- Player code size: ${lua.length} characters`);
  outVideoLua = lua;
  outVideoBin = buf;
  console.log("=== VIDEO READY ===\n");
}

if (audio) {
  console.log("=== AUDIO STEP ===");
  
  console.log(`Reading file "${audio}"...`);
  const midiData = await fs.readFile(audio);
  
  console.log('Parsing MIDI');
  const midi = new Midi(midiData);
  console.log(`\t- Name: ${ midi.name }`);
  console.log(`\t- Duration: ${ midi.durationTicks } ticks`);
  
  console.log("=== AUDIO READY ===\n");
}

/* Write generated data */
{
  console.log("Writing data...");
  console.log(`\t- Output directory "${ output }"`);
  await fs.ensureDir(output);
  const promises = [];
  if (video) {
    promises.push(
      fs.outputFile(pathlib.join(output, "player.lua"), outVideoLua),
      fs.outputFile(pathlib.join(output, "video.bin"), outVideoBin)
    );
  }
  await Promise.all(promises);
}

console.log("Done. Check output directory");
