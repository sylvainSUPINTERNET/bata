import { Body, Controller, Get, Logger, Post, Query, Res } from '@nestjs/common';
import { parseStringPromise } from 'xml2js';
import type { Response } from 'express';

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
import { GetTokenResponse } from 'google-auth-library/build/src/auth/oauth2client';
import {google} from 'googleapis';
import { bot } from './main';
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

  @Get("/test")
  async test() {
    const d = await bot.api.sendMessage(process.env.CHAT_ID_LA_VOIX_LIBRE!, "Hello world from NestJS!");
    console.log("Message sent with id", d.message_id);
    return "ok";
  }

  @Get('/oauth2/google/callback')
  async googleOAuth2Callback(@Query('code') code: string, @Res() res: Response) {
    try {
        const oauth2Client = this.ytService.getOAuth2Client();
        const resp:GetTokenResponse = await oauth2Client.getToken(code);
        const {
            access_token,
            refresh_token,
            scope,
            token_type,
            expiry_date
        } = resp.tokens;

        oauth2Client.setCredentials({
            access_token,
            refresh_token,
            scope,
            token_type,
            expiry_date
        });

        const service = google.youtube('v3');
        const videoMetadata = {
            snippet: {
                title: 'Ma vidéo uploadée via API ' + randomUUID(),
                description: 'Description my first video',
                tags: ['nodejs', 'youtube', 'api'],
                categoryId: '22', // Catégorie "People & Blogs"
                defaultLanguage: 'fr',
                defaultAudioLanguage: 'fr'
            },
            status: {
                privacyStatus: 'private', // 'public', 'unlisted', 'private'
                selfDeclaredMadeForKids: false
            }
        };

      const response = await service.videos.insert({
          auth: oauth2Client,
          part: ['snippet', 'status'],
          requestBody: videoMetadata,
          media: {
              body: fs.createReadStream('clip_1.mp4') // TODO: replace with actual clip name 
          }
      });

      Logger.log('Video uploaded to YouTube with ID:', response);

      return res.status(200).send({
        code
      });
    } catch ( error ) {
      return res.status(500).send({
        error: 'Failed to get access token',
        details: error instanceof Error ? error.message : error
      });
    }
  }

  @Post('ytb-webhook')
  async ytbWebhook(@Body() xml: string) {
    const apiKey = this.configService.get<string>('YOUTUBE_API_KEY');
    const VIDEO_DEV = this.configService.get<string>('VIDEO_DEV');
    const VIDEO_LESS_THAN_MINUTES = 20; // 15 minutes
    const ASSEMBLY_AI_DEV = this.configService.get<string>('ASSEMBLY_AI_DEV');
    const ANTHROPIC_DEV = this.configService.get<string>('ANTHROPIC_DEV');

    
    
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
        const clipNames: string[] = [];
        for (const [index, clip] of anthropicResponseData.clips.entries()) {
          const name = `clip_${index}`;
          clipNames.push(name);

          await this.ffmpegService.extractClips(
            `${videoNameLocal}.${extension}`,
            clip,
            name
          );
        }

        this.ytService.oauth2LoginPrompt();


        // Send to youtube
        // TODO



        // fs.writeFileSync(`anthropic_response_TEST.json`, JSON.parse(((result.content[0]) as any).text));


        // this.ffmpegService.extractClips(JSON.parse(((result.content[0]) as any).text));

      }
    }
    return p;
  }
}
