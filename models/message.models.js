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
    userId: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    // messages: {
    //   type: DataTypes.ARRAY(DataTypes.STRING),
    //   allowNull: true, // Set to false if you want the array to be required
    //   defaultValue: [],
    // },
    Messages: {
      type: DataTypes.ARRAY(DataTypes.JSONB),
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
