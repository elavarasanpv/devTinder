/** @format */

const jwt = require("jsonwebtoken");
const User = require("../models/user");
const userAuth = async (req, res, next) => {
  try {
    const { token } = req.cookies;
    if (!token) {
      throw new Error("Authentication token missing");
    }
    const decoded = await jwt.verify(token, "Tanu@2001");
    const { _id } = decoded;
    const user = await User.findById(_id);
    if (!user) {
      throw new Error("User not found");
    }
    req.user = user;
    next();
  } catch (err) {
    return res.status(400).send("Error: " + err.message);
  }
};

module.exports = { userAuth };
