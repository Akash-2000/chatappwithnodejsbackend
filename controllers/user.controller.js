const User = require("../models/user.model");
const { where } = require("sequelize");

exports.createUser = async (req, res) => {
  try {
    console.log(req.body);
    const userExist = await User.findOne({
      where: { email: req.body.email },
    }); // Checking if the user exist
    if (userExist) return res.status(400).json({ message: "User exist" });
    const { name, email, password } = req.body;
    const user = await User.create({ name, email, password }); //Creating the user
    if (!user) return res.status(400).json({ message: "Cannot create user" });

    return res.status(200).json({
      message: "Signup successfull",
    });
  } catch (error) {
    console.log(error.message);
    console.log("Unable to create a User");
  }
};

exports.checkServer = async (req, res) => {
  return res.status(200).json({ message: "it works on the same port" });
};

exports.loginUser = async (req, res) => {
  try {
    // find the email of the user
    const user = await User.findOne({
      where: { email: req.body.email },
    });

    const isMatched = await user.comparePassword(req.body.password);

    if (!isMatched)
      return res.status(400).json({ message: "Incorrect password or email" });

    //encrypt the refresh

    return res.status(200).json({
      message: "Login successfull",
      data: user,
    });
  } catch (error) {
    console.log(error.message);
  }
};

exports.getAllUsers = async (req, res) => {
  try {
    // find the email of the user
    const user = await User.findAll();

    //encrypt the refresh
    //which get the data
    const userData = user.map((e) => e.get({ plain: true }));
    console.log(userData);
    return res.status(200).json({
      message: "Login successfull",
      data: userData,
    });
  } catch (error) {
    console.log(error.message);
  }
};
