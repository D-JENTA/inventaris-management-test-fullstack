const Sequelize = require('sequelize');
require("dotenv").config();

const sequelize = new Sequelize(
    process.env.DB_NAME,
    process.env.DB_USER,
    process.env.DB_PASSWORD, 
    {
        host: process.env.DB_HOST,
        port: process.env.DB_PORT,
        dialect: "mariadb",
        loging: false,
        dialectOptions: {
            connectTimeout: 10000
        }
    }
);

sequelize.authenticate()
  .then(() => console.log("successfully connected to the database"))
  .catch(err => {
    console.error("unable to connect to database", err);
    process.exit(1);
  });

module.exports = sequelize;