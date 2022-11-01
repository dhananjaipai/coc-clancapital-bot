import { Telegraf } from "telegraf";
import ngrok from "ngrok";
import express from "express";
import {} from 'dotenv/config'
import _fetch from "node-fetch";
import { findOpenClans } from "./findClans.mjs";

const ngrok_token = process.env.NGROK_TOKEN;
const bot_token = process.env.TELEGRAM_TOKEN;
const chat_id = process.env.CHAT_ID;
const PORT = 3000;

const fetch = URI => _fetch(URI, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${process.env.CLASH_API_TOKEN}`,
    }
});

export const url = await ngrok.connect({ authtoken: ngrok_token, addr: PORT });
export const bot = new Telegraf(bot_token);
const secretPath = `/telegraf/${bot.secretPathComponent()}`;
bot.telegram.setWebhook(`${url}${secretPath}`);

const app = express();
app.get("/", (_, res) => res.send("OK"));
app.use(bot.webhookCallback(secretPath));

app.get("/findOpenClans/:tag/:max?", async (req, res) => {
    const {tag, max} = req.params;
    res.send(await findOpenClans(tag, max));
});
app.get("/playerClan/:tag", async (req, res) => {
    const {tag}=req.params;
    const data = await fetch(
        `https://api.clashofclans.com/v1/players/${encodeURIComponent(tag)}`
      ).then(response => response.json());
    res.send(data?.clan?.name);
});
app.get("/playerName/:tag", async (req, res) => {
    const {tag}=req.params;
    const data = await fetch(
        `https://api.clashofclans.com/v1/players/${encodeURIComponent(tag)}`
      ).then(response => response.json());
    res.send(data?.name);
});
app.get("/clanMembers/:tag", async (req, res) => {
    const {tag}=req.params;
    const data = await fetch(
        `https://api.clashofclans.com/v1/clans/${encodeURIComponent(tag)}/members`
      ).then(response => response.json());
    res.send(data?.items.map(({name}) => name));
});


app.listen(PORT, () => {
  console.log(`Listening on local port ${PORT}`);
  console.log(`Ngrok running at ${url}`);
  console.log(`Telegram webhook path at ${url}${secretPath}`);
});

export const message = (notification_text) => {
  return _fetch(
    `https://api.telegram.org/bot${bot_token}/sendMessage?chat_id=${chat_id}&text=${notification_text}`,
    { body: null, method: "POST" }
  );
};
