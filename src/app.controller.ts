import { Body, Controller, Post } from '@nestjs/common';
import { parseStringPromise } from 'xml2js';

import { AppService } from './app.service';
import { isIsoDurationOver } from './utils';
import { YtDlpService } from './ytDlp.service';
import { FfmpegService } from './ffmpeg.service';

@Controller()
export class AppController {
  constructor(
    private readonly appService: AppService,
    private readonly ytDlpService: YtDlpService,
    private readonly ffmpegService: FfmpegService,
  ) {}

  @Post('ytb-webhook')
  async ytbWebhook(@Body() xml: string) {
    const apiKey = process.env.YOUTUBE_API_KEY as string;
    const VIDEO_LESS_THAN_MINUTES = 15; // 15 minutes

    const p = await parseStringPromise(xml);

    const latestVideos = p.feed.entry
      .filter((entry) => entry.link[0].$.href.includes('/watch?v=')) // keep only video format, and from less than 1 day ago
      .filter((entry) => {
        const publishedAt = new Date(entry.published[0]).getTime();
        const age = Date.now() - publishedAt;
        return age >= 0 && age < 24 * 60 * 60 * 1000;
      })
      .sort(
        (a, b) =>
          new Date(b.published[0]).getTime() -
          new Date(a.published[0]).getTime(),
      );

    if (latestVideos.length > 0) {
      const data = await fetch(
        `https://www.googleapis.com/youtube/v3/videos?part=contentDetails&id=${latestVideos[0]['yt:videoId'][0]}&key=${apiKey}`,
      );
      const json = await data.json();

      let acceptVideo = false;
      for (const item of json.items) {
        if (item.id === latestVideos[0]['yt:videoId'][0]) {
          if (
            !isIsoDurationOver(
              item.contentDetails.duration,
              VIDEO_LESS_THAN_MINUTES,
            )
          ) {
            acceptVideo = true;
          }
        }
      }

      if (acceptVideo) {
        console.log('New video uploaded:');
        console.log(
          'Title:',
          latestVideos[0].title[0],
          'URL:',
          latestVideos[0].link[0].$.href,
          'Published:',
          latestVideos[0].published[0],
          'Id',
          latestVideos[0],
        );
      }
    }
    return p;
  }
}
