import { Telegraf } from "telegraf";
import ngrok from "ngrok";
import express from "express";
import cors from "cors";
import {} from "dotenv/config";
import _fetch from "node-fetch";
import { findOpenClans } from "./findClans.mjs";
import { QueryTypes } from "sequelize";
import { sequelize, QUERY_SUMMARY } from "../db/index.mjs";

const ngrok_token = process.env.NGROK_TOKEN;
const bot_token = process.env.TELEGRAM_TOKEN;
const chat_id = process.env.CHAT_ID;
const PORT = 3000;
const allowedOrigins = [
  "http://localhost:3000",
  "https://dhananjaipai.github.io",
];

const fetch = (URI) =>
  _fetch(URI, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${process.env.CLASH_API_TOKEN}`,
    },
  });

export const url = await ngrok.connect({ authtoken: ngrok_token, addr: PORT });
export const bot = new Telegraf(bot_token);
const secretPath = `/telegraf/${bot.secretPathComponent()}`;
bot.telegram.setWebhook(`${url}${secretPath}`);

const app = express();
app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin) return callback(null, true);
      if (allowedOrigins.indexOf(origin) === -1)
        return callback(
          new Error(
            "CORS policy restricts access from specified Origin. Goto https://dhananjaipai.github.io"
          ),
          false
        );
      return callback(null, true);
    },
  })
);

app.get("/", (_, res) => res.send("OK"));
app.use(bot.webhookCallback(secretPath));

app.get("/summary", async (_, res) => {
  res.send(await sequelize.query(QUERY_SUMMARY, { type: QueryTypes.SELECT }));
});

let cachedClans = [];
app.get("/findOpenClans/:tag/:max?", async (req, res) => {
  const { tag, max } = req.params;
  cachedClans = await findOpenClans(tag, max);
  res.send(cachedClans);
});
app.get("/openClans", (_, res) => {
  res.send({ clans: cachedClans });
});
app.get("/playerClan/:tag", async (req, res) => {
  const { tag } = req.params;
  const data = await fetch(
    `https://api.clashofclans.com/v1/players/${encodeURIComponent(tag)}`
  ).then((response) => response.json());
  res.send(data?.clan?.name);
});
app.get("/playerName/:tag", async (req, res) => {
  const { tag } = req.params;
  const data = await fetch(
    `https://api.clashofclans.com/v1/players/${encodeURIComponent(tag)}`
  ).then((response) => response.json());
  res.send(data?.name);
});
app.get("/clanMembers/:tag", async (req, res) => {
  const { tag } = req.params;
  const data = await fetch(
    `https://api.clashofclans.com/v1/clans/${encodeURIComponent(tag)}/members`
  ).then((response) => response.json());
  res.send(data?.items.map(({ name }) => name));
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
