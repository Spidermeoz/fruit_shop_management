import { Sequelize } from "sequelize";

const sequelize = new Sequelize(
  process.env.DATABASE_NAME, // database name
  process.env.DATABASE_USERNAME, // username
  process.env.DATABASE_PASSWORD, // password
  {
    host: process.env.DATABASE_HOST || "127.0.0.1",
    port: Number(process.env.DATABASE_PORT) || 3307,
    dialect: "mysql",
    logging: false, // console.log
  }
);

sequelize
  .authenticate()
  .then(() => {
    console.log("Connection has been established successfully.");
  })
  .catch((error) => {
    console.error("Unable to connect to the database: ", error);
  });

export default sequelize;
