const express = require("express");
const router = express.Router();

const { createChatRooms } = require("../controllers/roomId.controller");

router.post("/createRoom", createChatRooms);
module.exports = router;
