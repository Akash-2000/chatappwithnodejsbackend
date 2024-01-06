const RoomIds = require("../models/roomId.model");
const { Sequelize } = require("sequelize");

exports.createChatRooms = async (req, res) => {
  try {
    console.log(req.body);
    const targetArray = [req.body.senderId, req.body.reciverId];
    const targetArray1 = [req.body.reciverId, req.body.senderId];
    const result = await RoomIds.findAll({
      where: {
        [Sequelize.Op.or]: [
          { usersInChat1: targetArray },
          { usersInChat2: targetArray },
        ],
      },
    });

    function generateRandomID(length) {
      const characters =
        "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
      let randomID = "";

      for (let i = 0; i < length; i++) {
        const randomIndex = Math.floor(Math.random() * characters.length);
        randomID += characters.charAt(randomIndex);
      }

      return randomID;
    }
    if (result.length < 1) {
      try {
        const created = await RoomIds.create({
          usersInChat1: targetArray,
          chatId: generateRandomID(12),
          usersInChat2: targetArray1,
        });
        console.log("new data", created.dataValues.chatId);
        return res.status(200).json({ data: created.dataValues.chatId });
      } catch (error) {
        console.log(error);
      }
    } else {
      console.log(result[0].dataValues.chatId);
      return res.status(200).json({ data: result[0].dataValues.chatId });
    }
  } catch (error) {
    console.error(error);
    return res.status(500).json({ data: "error while fetching" });
  }
};
