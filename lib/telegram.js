import TelegramBot from "node-telegram-bot-api"

export function getTelegramBot() {
  return new TelegramBot(process.env.TELEGRAM_BOT_TOKEN, { polling: false })
}
