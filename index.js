import * as fs from 'fs/promises';
import * as path from 'path';
import ffmpeg from 'ffmpeg';
import sharp from 'sharp';
import lzma from 'lzma-native';
import z85 from 'z85';

console.time('Done');

// Constants
const targetWidth = 255;
const targetHeight = 255;

// Output
const output = [];

// Define functions
const getNumeric = s => parseInt(s.replace(/\D/g,''));

// Parse args
const args = process.argv.slice(2);
const file = path.resolve(process.cwd(), args.shift());

// Load file
console.log(`Loading file "${file}"`);
const video = await new ffmpeg(file)

// Create directory
const framesDir = path.resolve(process.cwd(), '.frames/');
try { await fs.rm(framesDir, {recursive: true, force: true}); } catch {}
await fs.mkdir(framesDir);

// Split
console.log(`Splitting to "${framesDir}"`);
await video.fnExtractFrameToJPG(framesDir, {
  every_n_frames: 2,
  file_name: '%i'
});

// Process files
console.log('Processing images...');
const framesFiles = await fs.readdir(framesDir);
framesFiles.sort((a, b) => getNumeric(a) - getNumeric(b));
console.log('Please wait');
let frameIndex = 0;
let repeats = 0;
let currentColor = false;
for(const frameFileName of framesFiles) {
  const framePath = path.resolve(path.join(framesDir, frameFileName));
  const frameData = await sharp(framePath)
    .threshold()
    .resize({width: targetWidth, height: targetHeight})
    .toColorspace('b-w')
    .raw().toBuffer();
  for(let i = 0; i < frameData.length; i++) {
    const pixelColor = (frameData[i] > 0);
    if(pixelColor == currentColor) {
      repeats++;
      if(repeats >= 0xFF) {
        repeats -= 0xFF;
        output.push(0xFF);
      }
    } else {
      output.push(repeats);
      currentColor = pixelColor;
      repeats = 0;
    }
  }
  if((frameIndex % 500) === 0) console.log(frameIndex + '/' + framesFiles.length);
  frameIndex++;
}
if(repeats > 0) output.push(repeats);

// Delete the frames
console.log('Cleaning up...');
try { await fs.rm(framesDir, {recursive: true, force: true}); } catch {}

// Build a Uint8array and compress it
console.log('Compressing (LZMA)...');
const u8output = new Uint8Array(output);
const compressedData = await new Promise((resolve, reject) => {
  lzma.compress(u8output, data => resolve(data));
});

// z85
console.log('Using ZeroMQ Base-85 Encoding on compressedData...');
const z85output = z85.encode(compressedData);

// Write the output file
console.log('Writing...')
await fs.writeFile('output.txt', z85output);

// Done!
console.log(`File size: ${z85output.length} bytes`);
console.timeEnd('Done')
