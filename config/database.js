require("dotenv").config();
const { Sequelize, DataTypes } = require("sequelize");
const sequelize = new Sequelize(
  `postgres://chat:chat@localhost:5432/chatdata`,
  { dialect: "postgres" }
);

const connectDb = () => {
  sequelize
    .authenticate()
    .then(() => {
      console.log(`Database connected to discover`);
    })
    .catch((err) => {
      console.log(err);
    });
};

module.exports = { sequelize, connectDb };
