import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Anthropic, { toFile } from '@anthropic-ai/sdk';
import fs from 'node:fs';

@Injectable()
export class AnthropicService {
  client: Anthropic;
  constructor(private configService: ConfigService) {
    this.client = new Anthropic({
      apiKey: `${this.configService.get<string>('ANTHROPIC_API_KEY')}`,
    });
  }

  async uploadTranscription(transcriptionTxtFile: string) {
    return await this.client.beta.files.upload({
      file: await toFile(
        fs.createReadStream(`${transcriptionTxtFile}`),
        undefined,
        { type: 'text/plain' },
      ),
      betas: ['files-api-2025-04-14'],
    });
  }

  async getResponse(fileId: string){
    return await this.client.beta.messages.create({
        model: `${this.configService.get<string>('ANTHROPIC_MODEL')}`,
        max_tokens: 1024,
        messages: [
            {
            role: "user",
            content: [
                {
                    type: "text",
                    text: fs.readFileSync('prompt_v2.txt', 'utf-8'),
                },
                {
                type: "document",
                source: {
                    type: "file",
                    file_id: fileId,
                },
                },
            ],
            },
        ],
        betas: ["files-api-2025-04-14"],
    });
  }
  
}
