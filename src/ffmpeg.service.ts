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
    clip: {
      title: string;
      start_timestamp_ms: number;
      end_timestamp_ms: number;
    },
    clipName: string
  ) {
    return new Promise<void>((resolve, reject) => {

      // const ffmpeg = spawn("ffmpeg", [
      //   "-y",
      //   "-ss",
      //   this.msToTime(clip.start_timestamp_ms),
      //   "-i",
      //   originalVideoFileName,
      //   "-t",
      //   this.msToTime(clip.end_timestamp_ms),
      //   "-vf",
      //   "scale=1080:1920:force_original_aspect_ratio=decrease,pad=1080:1920:(ow-iw)/2:(oh-ih)/2",
      //   `${clipName}.mp4`
      // ]);


      const ffmpeg = spawn("ffmpeg", [
        "-y",
        "-ss",
        this.msToTime(clip.start_timestamp_ms),
        "-i",
        originalVideoFileName,
        "-t",
        this.msToTime(clip.end_timestamp_ms - clip.start_timestamp_ms),
        "-filter_complex",
        "[0:v]scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920,gblur=sigma=20[bg];[0:v]scale=iw*1.5:ih*1.5[zoomed];[zoomed]scale=1080:1920:force_original_aspect_ratio=decrease[fg];[bg][fg]overlay=(W-w)/2:(H-h)/2",
        `${clipName}.mp4`
      ]);

      ffmpeg.stderr.on("data", (data) => {
        console.log(data.toString());
      });

      ffmpeg.on("error", reject);

      ffmpeg.on("close", (code) => {
        if (code === 0) resolve();
        else reject(new Error(`ffmpeg exited with code ${code}`));
      });

    });
  }
}
