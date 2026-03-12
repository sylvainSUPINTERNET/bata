import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule } from '@nestjs/config';
import { YtDlpService } from './ytDlp.service';
import { FfmpegService } from './ffmpeg.service';

@Module({
  imports: [ConfigModule.forRoot()],
  controllers: [AppController],
  providers: [AppService, YtDlpService, FfmpegService],
})
export class AppModule {}
