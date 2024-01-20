const { sequelize } = require("../config/database");
const { Sequelize, DataTypes } = require("sequelize");
const bcrypt = require("bcryptjs");

const Roomlist = sequelize.define(
  "roomlist",
  {
    chatID: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    senderid: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    recieverID: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    Roomname: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    updatedAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
    },
    latestmessage: {
      type: DataTypes.STRING,
      allowNull: true,
    },
  },
  {
    timestamps: true,
  }
);

// sequelize.queryInterface.addColumn("roomlists", "latestmessage", {
//   type: DataTypes.STRING,
//   allowNull: true,
// });
sequelize
  .sync()
  .then(() => console.log(" roomlist Table created"))
  .catch((error) => console.log(error));

module.exports = Roomlist;
