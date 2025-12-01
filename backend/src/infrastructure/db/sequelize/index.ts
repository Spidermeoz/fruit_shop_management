// src/infrastructure/db/sequelize/index.ts
import { Sequelize } from "sequelize";
import dotenv from "dotenv";

dotenv.config();

// Hỗ trợ cả 2 kiểu biến: DB_* và DATABASE_*
const DB_HOST: string =
  process.env.DB_HOST ?? process.env.DATABASE_HOST ?? "127.0.0.1";
const DB_PORT: number = Number(
  process.env.DB_PORT ?? process.env.DATABASE_PORT ?? 3307
);
const DB_USER: string =
  process.env.DB_USER ?? process.env.DATABASE_USERNAME ?? "root";
const DB_PASSWORD: string =
  process.env.DB_PASSWORD ?? process.env.DATABASE_PASSWORD ?? "";
const DB_NAME: string =
  process.env.DB_NAME ?? process.env.DATABASE_NAME ?? "fruitshop";

const NODE_ENV: string = process.env.NODE_ENV ?? "development";

// Aiven yêu cầu SSL
const USE_SSL = process.env.DATABASE_SSL === "true";

const sequelize = new Sequelize(DB_NAME, DB_USER, DB_PASSWORD, {
  host: DB_HOST,
  port: DB_PORT,
  dialect: "mysql",
  dialectModule: require("mysql2"),
  logging: NODE_ENV !== "production" ? console.log : false,
  timezone: "+07:00",

  define: {
    underscored: true,
    freezeTableName: true,
  },

  pool: { max: 10, min: 0, idle: 10_000, acquire: 60_000 },

  dialectOptions: {
    decimalNumbers: true,
    supportBigNumbers: true,
    bigNumberStrings: false,

    ...(USE_SSL
      ? {
          ssl: {
            require: true,
            rejectUnauthorized: false, // Aiven cho phép bỏ verify
          },
        }
      : {}),
  },
});

export default sequelize;
