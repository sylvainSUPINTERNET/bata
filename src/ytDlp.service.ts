import { Injectable, Logger } from '@nestjs/common';
import { spawn } from 'node:child_process';

@Injectable()
export class YtDlpService {
  constructor() {}

  ytDlpDownload(url: string, videoNameLocal: string) {
    const ytDlp = spawn('yt-dlp', [url, '-o', `${videoNameLocal}.%(ext)s`]);
    ytDlp.stdout.on('data', (data) => {
      Logger.log(`yt-dlp output: ${data}`);
    });
    ytDlp.stderr.on('data', (data) => {
      Logger.error(`yt-dlp error: ${data}`);
    });
  }
}
