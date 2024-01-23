const { sequelize } = require("../config/database");
const { Sequelize, DataTypes } = require("sequelize");
const bcrypt = require("bcryptjs");

const Messages = sequelize.define(
  "Message",
  {
    chatID: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    Messages: {
      type: DataTypes.ARRAY(DataTypes.JSON),
      defaultValue: [],
    },
  },
  {
    timestamps: true,
  }
);

sequelize
  .sync()
  .then(() => console.log(" Messages Table created"))
  .catch((error) => console.log(error));

module.exports = Messages;
