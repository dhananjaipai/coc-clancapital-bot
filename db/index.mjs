import { Sequelize } from "sequelize";
import _Member from "./models/Member.mjs";
import _Record from "./models/Record.mjs";
import * as fs from "fs";

export const DATABASE_USERNAME = process.env.DATABASE_USERNAME;
export const DATABASE_PASSWORD = process.env.DATABASE_PASSWORD;
export const DATABASE_HOST = process.env.DATABASE_HOST;
export const DATABASE_NAME = process.env.DATABASE_NAME;

export const sequelize = new Sequelize(
  DATABASE_NAME,
  DATABASE_USERNAME,
  DATABASE_PASSWORD,
  {
    dialect: "mysql",
    host: DATABASE_HOST,
    logging: false,
  }
);

export const Member = sequelize.define("Member", _Member);
export const Record = sequelize.define("Record", _Record);
export const QUERY_SUMMARY = fs.readFileSync(
  new URL("./query/summary.sql", import.meta.url),
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
