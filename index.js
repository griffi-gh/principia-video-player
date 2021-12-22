import sharp from 'sharp';
import ffmpeg from 'ffmpeg';
import * as fs from 'fs/promises';
import * as path from 'path';

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

// List files
console.log('Processing images...')
const framesFiles = await fs.readdir(framesDir);
framesFiles.sort((a, b) => getNumeric(a) - getNumeric(b));
for(const frameFileName of framesFiles) {
  const framePath = path.resolve(path.join(framesDir, frameFileName));
  const frameData = await sharp(framePath).toColourspace('b-w').raw().toBuffer();
}

// Delete the frames
console.log('Cleaning up...');
try { await fs.rm(framesDir, {recursive: true, force: true}); } catch {}

console.log('Done!');
