import { Body, Controller, Logger, Post } from '@nestjs/common';
import { parseStringPromise } from 'xml2js';

import { AppService } from './app.service';
import { isIsoDurationOver } from './utils';
import { YtDlpService } from './ytDlp.service';
import { FfmpegService } from './ffmpeg.service';
import { randomUUID } from 'node:crypto';
import { AssemblyAiService } from './assemblyAi.service';
import { ConfigService } from '@nestjs/config';
import { AnthropicService } from './anthropic.service';
import fs from 'node:fs';
import { YtService } from './yt.service';

@Controller()
export class AppController {
  constructor(
    private readonly appService: AppService,
    private readonly ytDlpService: YtDlpService,
    private readonly ffmpegService: FfmpegService,
    private readonly assemblyAiService: AssemblyAiService,
    private configService: ConfigService,
    private readonly anthropicService: AnthropicService,
    private readonly ytService: YtService
  ) {}

  @Post('ytb-webhook')
  async ytbWebhook(@Body() xml: string) {
    const apiKey = this.configService.get<string>('YOUTUBE_API_KEY');
    const VIDEO_DEV = this.configService.get<string>('VIDEO_DEV');
    const VIDEO_LESS_THAN_MINUTES = 20; // 15 minutes
    const ASSEMBLY_AI_DEV = this.configService.get<string>('ASSEMBLY_AI_DEV');
    const ANTHROPIC_DEV = this.configService.get<string>('ANTHROPIC_DEV');

    this.ytService.test();
    
    
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

        // Download video with yt-dlp
        let videoNameLocal: string;
        const extension: string = 'webm';
        if (`${VIDEO_DEV}` === '') {
          videoNameLocal = `${latestVideos[0]['yt:videoId'][0]}@${randomUUID()}`;
          this.ytDlpService.ytDlpDownload(
            latestVideos[0].link[0].$.href,
            videoNameLocal,
          );
        } else {
          videoNameLocal = `${VIDEO_DEV}`;
          Logger.warn(
            `Using video from env VIDEO_DEV: ${videoNameLocal}. This is for development purposes only, and should not be used in production!`,
          );
        }

        // Transcribe with AssemblyAI
        let transcription: any;
        const transcriptionResultFileName = `transcription_result.txt`;
        if ( `${ASSEMBLY_AI_DEV}` === '') {
          transcription = await this.assemblyAiService.transcribe(
            `${videoNameLocal}.${extension}`,
          );
          Logger.log(`${JSON.stringify(transcription)}`);
          fs.writeFileSync(
            transcriptionResultFileName,
            JSON.stringify(transcription),
          );
        } else {
          transcription = JSON.parse(
            fs.readFileSync(`assembly_ai_mock.json`, 'utf-8'),
          );
          Logger.warn(
            `Using transcription from env ASSEMBLY_AI_DEV. This is for development purposes only, and should not be used in production!`,
          );
        }

        // Get response from Anthropic
        let anthropicResponseData:any;
        if ( `${ANTHROPIC_DEV}` === '') {
          const {id: fileId}:{id:string}= await this.anthropicService.uploadTranscription(
            transcriptionResultFileName,
          );
          const result = await this.anthropicService.getResponse(fileId);
          Logger.log("Anthropic response", (result.content[0] as any).text);
          anthropicResponseData = JSON.parse((result.content[0] as any).text);
        } else {
          Logger.warn(
            `Using response from env ANTHROPIC_DEV. This is for development purposes only, and should not be used in production!`,
          );
          anthropicResponseData = JSON.parse(JSON.parse(fs.readFileSync(`anthropic_response_mock.json`, 'utf-8')).content[0].text);
        }


        // FFMPEG - extract clips
        let clipNames: string[] = [];
        anthropicResponseData.clips.forEach((clip: any, index:number) => {
          clipNames = [...clipNames, `clip_${index}`];
          this.ffmpegService.extractClips(`${videoNameLocal}.${extension}`, clip, `clip_${index}`);
        });


        // Send to youtube
        // TODO



        // fs.writeFileSync(`anthropic_response_TEST.json`, JSON.parse(((result.content[0]) as any).text));


        // this.ffmpegService.extractClips(JSON.parse(((result.content[0]) as any).text));

      }
    }
    return p;
  }
}
