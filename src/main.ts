import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import * as bodyParser from 'body-parser';
import { Bot } from "grammy"


export const bot = new Bot(process.env.TELEGRAM_TOKEN!);

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors();

  app.use(bodyParser.json());
  app.use('/ytb-webhook', bodyParser.text({ type: '*/*' }));

  bot.start();

  // bot.on("message:text", async (ctx) => {
  //   console.log("Received message:", ctx.message.text);
  //   console.log("Chat ID:", ctx.chatId);
  //   await ctx.reply("You said: " + ctx.message.text);
    
  // });

  bot.catch( (err) => {
    console.error('Error in bot:', err);
  })

  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
