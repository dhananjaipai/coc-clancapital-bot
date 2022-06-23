import { Telegraf } from "telegraf";
import ngrok from "ngrok";
import express from "express";
import {} from 'dotenv/config'

const ngrok_token = process.env.NGROK_TOKEN;
const bot_token = process.env.TELEGRAM_TOKEN;
const chat_id = process.env.CHAT_ID;
const PORT = 3000;

const url = await ngrok.connect({ authtoken: ngrok_token, addr: PORT });
export const bot = new Telegraf(bot_token);
const secretPath = `/telegraf/${bot.secretPathComponent()}`;
bot.telegram.setWebhook(`${url}${secretPath}`);

const app = express();
app.get("/", (_, res) => res.send("OK"));
app.use(bot.webhookCallback(secretPath));
app.listen(PORT, () => {
  console.log(`Listening on local port ${PORT}`);
  console.log(`Ngrok running at ${url}`);
  console.log(`Telegram webhook path at ${url}${secretPath}`);
});

export const message = (notification_text) => {
  return _fetch(
    `https://api.telegram.org/bot${bot_token}/sendMessage?chat_id=${chat_id}&parse_mode=markdown&text=${notification_text}`,
    { body: null, method: "POST" }
  );
};
