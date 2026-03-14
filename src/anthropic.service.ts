import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Anthropic from '@anthropic-ai/sdk';

@Injectable()
export class AnthropicService {
  constructor(private configService: ConfigService) {}

  async getResponse(transcript: string): Promise<string> {
    const client = new Anthropic({
      apiKey: `${this.configService.get<string>('ANTHROPIC_API_KEY')}`,
    });

    const message = await client.messages.create({
      max_tokens: 1024,
      messages: [{ role: 'user', content: 'Hello, Claude' }],
      model: `${this.configService.get<string>('ANTHROPIC_MODEL')}`,
    });

    return Promise.resolve(
      `This is a mock response for the transcript: ${transcript}`,
    );
  }
}
