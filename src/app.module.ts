import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule } from '@nestjs/config';
import { YtDlpService } from './ytDlp.service';
import { FfmpegService } from './ffmpeg.service';
import { AssemblyAiService } from './assemblyAi.service';
import { AnthropicService } from './anthropic.service';
import { YtService } from './yt.service';
import { TelegramBot } from './telegram.bot';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
  ],
  controllers: [AppController],
  providers: [
    AppService,
    YtDlpService,
    FfmpegService,
    AssemblyAiService,
    AnthropicService,
    YtService,
    TelegramBot
  ],
  exports: [
    TelegramBot
  ]
})
export class AppModule {}
