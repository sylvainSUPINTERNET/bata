import { Injectable } from '@nestjs/common';
import { spawn } from 'node:child_process';

@Injectable()
export class FfmpegService {
  constructor() {}

  ffmpegHelp() {
    const ffmpeg = spawn('ffmpeg', ['-h']);
    ffmpeg.stdout.on('data', (data) => {
      console.log(`ffmpeg help: ${data}`);
    });
    ffmpeg.stderr.on('data', (data) => {
      console.error(`ffmpeg error: ${data}`);
    });
  }
}
