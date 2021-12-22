import jpeg from 'jpeg-js';
import ffmpeg from 'ffmpeg';
import * as fs from 'fs/promises';
import * as path from 'path';

// Parse args
const args = process.argv.slice(2);
const file = path.resolve(process.cwd(), args.shift());

// Load file
console.log(`Loading file "${file}"`);
const video = await new ffmpeg(file)
console.log(video.metadata);
