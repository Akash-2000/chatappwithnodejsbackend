const { sequelize } = require("../config/database");
const { Sequelize, DataTypes } = require("sequelize");
const bcrypt = require("bcryptjs");

const RoomIds = sequelize.define(
  "ChatRoomId",
  {
    usersInChat1: {
      type: DataTypes.ARRAY(DataTypes.STRING),
      primaryKey: true,
      defaultValue: [],
    },
    chatId: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    usersInChat2: {
      type: DataTypes.ARRAY(DataTypes.STRING),
      allowNull: false,
      defaultValue: [],
    },
  },
  {
    timestamps: true,
  }
);

sequelize
  .sync()
  .then(() => console.log(" RoomIds Table created"))
  .catch((error) => console.log(error));

module.exports = RoomIds;
