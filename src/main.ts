import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import * as bodyParser from 'body-parser';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors();
  app.enableShutdownHooks();
  app.use(bodyParser.json());
  app.use('/ytb-webhook', bodyParser.text({ type: '*/*' }));

  // const TelegramBotInjected = app.get(TelegramBot);
  
  // TelegramBotInjected.getBot().start().catch( (err) => {
  //   console.error('Error starting bot:', err);
  // });

  // bot.on("message:text", async (ctx) => {
  //   console.log("Received message:", ctx.message.text);
  //   console.log("Chat ID:", ctx.chatId);
  //   await ctx.reply("You said: " + ctx.message.text);
    
  // });

  // TelegramBotInjected.getBot().catch( (err) => {
  //   console.error('Error in bot:', err);
  // })

  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
