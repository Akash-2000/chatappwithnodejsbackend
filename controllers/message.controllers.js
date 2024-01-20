const Roomlist = require("../models/roomlist.model");
const { Sequelize } = require("sequelize");

exports.getMessages = async (req, res) => {
  try {
    const { id } = req.body;
    const MessagesofTheuser = await Roomlist.findAll({
      where: {
        recieverID: id,
      },
      plain: true,
      returning: true,
    });
    res.status(200).json({ data: MessagesofTheuser });
  } catch (error) {
    console.log(error);
    res.status(500).json({ error });
  }
};
