const express = require("express");
const router = express.Router();

const { getMessages } = require("../controllers/message.controllers");

router.post("/getMessages", getMessages);
module.exports = router;
