import * as fs from 'fs/promises';
import * as path from 'path';
import ffmpeg from 'ffmpeg';
import sharp from 'sharp';
import zlib from 'zlib';

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
console.log('Processing images...')
const framesFiles = await fs.readdir(framesDir);
framesFiles.sort((a, b) => getNumeric(a) - getNumeric(b));
for(const frameFileName of framesFiles) {
  const framePath = path.resolve(path.join(framesDir, frameFileName));
  const frameData = await sharp(framePath)
    .threshold()
    .resize({width: targetWidth, height: targetHeight})
    .toColorspace('b-w')
    .raw().toBuffer();
  let currentColor = false;
  let repeats = 0;
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
  if(repeats > 0) output.push(repeats);
  break;
}

// Delete the frames
console.log('Cleaning up...');
try { await fs.rm(framesDir, {recursive: true, force: true}); } catch {}

// Done, write the output file
// TODO write out
console.log('Done!');
