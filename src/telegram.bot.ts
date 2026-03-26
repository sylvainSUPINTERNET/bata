import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from "@nestjs/common";
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

  onModuleInit() {
    if (this.started) return;

    
    // // can also use regex: this.bot.callbackQuery(/video_\d+/, async (ctx) => {
    this.bot.callbackQuery(/^publish_.+$/, async (ctx) => {
      Logger.log("telegram [publish] - callback query", ctx.callbackQuery.data);
      
       await ctx.reply(`Do you want to publish : ${ctx.callbackQuery.data.split("_")[1]}`, {
            reply_markup: {
            inline_keyboard: [
                [
                { text: "✅ Yes", callback_data: `confirm_publish_${ctx.callbackQuery.data}` },
                { text: "❌ Epstein", callback_data: "cancel" }
                ]
            ]
            }
        });
    });

    this.bot.callbackQuery(/^confirm_publish_.+$/, async (ctx) => {
      Logger.log("telegram [confirm_publish] - callback query", ctx.callbackQuery.data);

        await ctx.answerCallbackQuery({
            text: `Processing upload for ${ctx.callbackQuery.data}`,
            show_alert: true,
        });
        
        // TODO upload to yt and send link to user

    });
    // this.bot.on("callback_query:data", async (ctx) => {
    //     const data = ctx.callbackQuery.data;

    //     console.log("CLICK:", data);

    //     await ctx.answerCallbackQuery();
    // });
    if ( !this.bot.isRunning() ) {
        this.bot.start().catch((err) => {
          this.started = false;
          Logger.error('Telegram bot polling error:', err);
        });
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