import { Injectable } from '@nestjs/common';
import { spawn } from 'node:child_process';

@Injectable()
export class FfmpegService {
  constructor() {}

  msToTime(ms: number) {
    const totalSeconds = Math.floor(ms / 1000);

    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    return [hours, minutes, seconds]
      .map(v => v.toString().padStart(2, '0'))
      .join(':');
  }

  // with format tiktok
  extractClips(
    originalVideoFileName: string,
    clip:{
      title: string;
      start_timestamp_ms:number;
      end_timestamp_ms:number;
    },
     index:number) {
    const ffmpeg = spawn('ffmpeg', [
            '-i',
      `${originalVideoFileName}`,
      '-ss',
      `${this.msToTime(clip.start_timestamp_ms)}`,
      '-to',
      `${this.msToTime(clip.end_timestamp_ms)}`,
      '-vf',
      'scale=1080:1920:force_original_aspect_ratio=decrease,pad=1080:1920:(ow-iw)/2:(oh-ih)/2',
      `clip_${index}.mp4`,
    ]);

    ffmpeg.stdout.on('data', (data) => {
      console.log(`ffmpeg output: ${data}`);
    });
    ffmpeg.stderr.on('data', (data) => {
      console.error(`ffmpeg error: ${data}`);
    });
  }

  // ffmpegHelp() {
  //   const ffmpeg = spawn('ffmpeg', ['-h']);
  //   ffmpeg.stdout.on('data', (data) => {
  //     console.log(`ffmpeg help: ${data}`);
  //   });
  //   ffmpeg.stderr.on('data', (data) => {
  //     console.error(`ffmpeg error: ${data}`);
  //   });
  // }
}
