const { sequelize } = require("../config/database");
const { Sequelize, DataTypes } = require("sequelize");
const bcrypt = require("bcryptjs");

const Activeusers = sequelize.define(
  "ActiveUser",
  {
    room: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    activeUsers: {
      type: DataTypes.ARRAY(DataTypes.STRING),
      allowNull: false,
    },
  },
  {
    timestamps: true,
  }
);

sequelize
  .sync()
  .then(() => console.log(" roomlist Table created"))
  .catch((error) => console.log(error));

module.exports = Activeusers;
