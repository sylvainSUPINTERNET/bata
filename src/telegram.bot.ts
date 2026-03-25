import { Injectable, OnModuleInit, OnModuleDestroy } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { Bot } from "grammy";

@Injectable()
export class TelegramBot implements OnModuleInit, OnModuleDestroy {
  private bot: Bot;
  private started = false;

  constructor(private readonly configService: ConfigService) {
    this.bot = new Bot(this.configService.get<string>('TELEGRAM_TOKEN')!);
  }

  getBot() {
    return this.bot;
  }

  async onModuleInit() {
    if (this.started) return;

    this.bot.callbackQuery("video_1", async (ctx) => {
      console.log("CLICK DETECTED");
      await ctx.answerCallbackQuery({
        text: "Tu as choisi la vidéo 1 ! 🎬",
      });
    });
    if ( !this.bot.isRunning() ) {
        await this.bot.start();
        this.started = true;
    }
  }

  async onModuleDestroy() {
    if ( this.bot.isRunning() ) {
        await this.bot.stop();
        this.started = false;
    }
  }
}