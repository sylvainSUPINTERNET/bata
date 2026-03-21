import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { Bot } from "grammy";


@Injectable()
export class TelegramBot {
    constructor(private readonly configService:ConfigService) {}

    getBot() {
        return new Bot(this.configService.get<string>('TELEGRAM_TOKEN')!);
    }
}
