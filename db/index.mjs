import { Sequelize } from "sequelize";
import _Member from "./models/Member.mjs";
import _Record from "./models/Record.mjs";
import * as fs from "fs";

export const sequelize = new Sequelize({
  dialect: "sqlite",
  storage: "./members.sqlite",
  logging: false,
  retry: {
    max: 20,
  },
});

export const Member = sequelize.define("Member", _Member);
export const Record = sequelize.define("Record", _Record);
export const QUERY_SUMMARY = fs.readFileSync(
  new URL('./query/summary.sql', import.meta.url),
  { encoding: "utf8", flag: "r" }
);
try {
  await sequelize.authenticate();
  console.log("Connection has been established successfully");
  await sequelize.sync();
  //   await sequelize.sync({ force: true });
  console.log("Models have been synchronized");
} catch (error) {
  console.error("Error -", error);
}
