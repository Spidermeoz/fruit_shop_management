import express, { Express, Request, Response } from "express";
import dotenv from "dotenv";

dotenv.config();

import sequelize from "./config/database";
import Product from "./models/product.model";

sequelize;

const app: Express = express();
const port: number | string = process.env.PORT || 3000;

app.get("/products", async (req, res) => {
  try {
    const products = await Product.findAll({
      raw: true,
    });
    return res.json(products);
  } catch (err: any) {
    console.error("SQL:", err?.sql);
    console.error("DB-ERR:", err?.parent?.sqlMessage || err?.parent?.message, err?.parent?.code);
    return res.status(500).json({ message: "DB error", detail: err?.parent?.sqlMessage || String(err) });
  }
});

app.get("/products/detail/:id", async (req: Request, res: Response) => {
  const id = req.params.id;
  
  const products = await Product.findOne({
    where: { 
      id,
      deleted: 0 },
  });

  res.json(products);
});

app.listen(port, () => {
  console.log(`App listening on port ${port}`);
});
