import express, { Express, Request, Response } from "express";
import dotenv from "dotenv";
import sequelize from "./config/database";

dotenv.config();

sequelize;

const app: Express = express();
const port: number | string = process.env.PORT || 3000;

app.get("/products", async (req: Request, res: Response) => {
  res.send("Danh sách hoa quả");
});

app.listen(port, () => {
  console.log(`App listening on port ${port}`);
});
