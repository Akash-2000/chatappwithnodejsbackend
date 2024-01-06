const { sequelize } = require("../config/database");
const { Sequelize, DataTypes } = require("sequelize");
const bcrypt = require("bcryptjs");

const ChatLists = sequelize.define(
  "chatlists",
  {
    chatId: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    userId: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    recieverId: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    roomname: {
      type: DataTypes.STRING,
      allowNull: false,
    },
  },
  {
    timestamps: true,
  }
);

sequelize
  .sync()
  .then(() => console.log(" chatlists Table created"))
  .catch((error) => console.log(error));

module.exports = ChatLists;
