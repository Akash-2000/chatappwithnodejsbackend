const Messages = require("../models/message.models");
const { Sequelize } = require("sequelize");

exports.getMessages = async (req, res) => {
  try {
    const { id } = req.body;
    const MessagesofTheuser = await Messages.findAll({
      where: {
        userId: id,
      },
      plain: true,
      returning: true,
    });
    res.status(200).json({ data: MessagesofTheuser });
  } catch (error) {
    res.status(500).json({ message: error });
  }
};
