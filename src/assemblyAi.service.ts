import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AssemblyAI } from 'assemblyai';
import fs from 'node:fs';
@Injectable()
export class AssemblyAiService {
  client: AssemblyAI;
  constructor(private configService: ConfigService) {
    this.client = new AssemblyAI({
      apiKey: this.configService.get<string>('ASSEMBLY_AI_API_KEY')!,
    });
  }

  async transcribe(videoNameLocal: string) {
    const params = {
      audio: fs.createReadStream(`${videoNameLocal}`),
      language_detection: true,
      // Uses universal-3-pro for en, es, de, fr, it, pt. Else uses universal-2 for support across all other languages
      speech_models: ['universal-3-pro', 'universal-2'],
    };
    Logger.log(
      `Starting transcription for ${videoNameLocal} with params: ${JSON.stringify(params)}`,
    );
    return await this.client.transcripts.transcribe(params);
  }
}
