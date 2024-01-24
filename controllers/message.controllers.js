const Roomlist = require("../models/roomlist.model");
const { Sequelize, Op } = require("sequelize");

exports.getMessages = async (req, res) => {
  try {
    const { id } = req.body;
    console.log("my id of the id", id);
    const MessagesofTheuser = await Roomlist.findAll({
      where: {
        senderid: id,
      },
    });
    // const MessagesofTheuser = await Roomlist.findAll({
    //   where: {
    //     recieverID: id,
    //   },
    //   plain: true,
    //   logging: console.log,
    // });
    console.log(MessagesofTheuser);
    return res.status(200).json({ data: MessagesofTheuser });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ error });
  }
};
