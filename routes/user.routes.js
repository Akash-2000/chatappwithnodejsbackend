const express = require("express");
const router = express.Router();

const {
  checkServer,
  createUser,
  loginUser,
  getAllUsers,
} = require("../controllers/user.controller");

router.post("/register", createUser);
router.post("/login", loginUser);
router.get("/check", checkServer);
router.get("/getAll", getAllUsers);
module.exports = router;
