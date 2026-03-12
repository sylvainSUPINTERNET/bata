import { Injectable, Logger } from '@nestjs/common';
import { spawn } from 'node:child_process';

@Injectable()
export class YtDlpService {
  constructor() {}

  ytDlpHelp() {
    const ytDlp = spawn('yt-dlp', ['--help']);
    ytDlp.stdout.on('data', (data) => {
      console.log(`yt-dlp help: ${data}`);
    });
    ytDlp.stderr.on('data', (data) => {
      Logger.error(`yt-dlp error: ${data}`);
    });
  }
}
