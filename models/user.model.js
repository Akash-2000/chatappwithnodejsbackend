const { sequelize } = require("../config/database");
const { Sequelize, DataTypes } = require("sequelize");
const bcrypt = require("bcryptjs");

const User = sequelize.define(
  "User",
  {
    _id: {
      type: DataTypes.UUID,
      defaultValue: Sequelize.UUIDV4,
      primaryKey: true,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },
    password: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    room: {
      type: DataTypes.STRING,
      allowNull: true,
    },
  },
  {
    timestamps: true,
    hooks: {
      beforeCreate: (user) => {
        if (user.changed("password")) {
          user.password = bcrypt.hashSync(user.password, 12);
        }
      },
    },
  }
);

User.prototype.comparePassword = async function (enterPassword) {
  return bcrypt.compareSync(enterPassword, this.password);
};

sequelize
  .sync()
  .then(() => console.log("Table created"))
  .catch((error) => console.log(error));

module.exports = User;
