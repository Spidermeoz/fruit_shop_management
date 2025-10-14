import express, { Express, Request, Response } from "express";
import dotenv from "dotenv";

dotenv.config();

import sequelize from "./config/database";
import mainV1Routes from "./api/v1/routes/client/index.route";

sequelize;

const app: Express = express();
const port: number | string = process.env.PORT || 3000;

mainV1Routes(app);

app.listen(port, () => {
  console.log(`App listening on port ${port}`);
});
