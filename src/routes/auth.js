/** @format */

const express = require("express");

const authRouter = express.Router();

const bcrypt = require("bcrypt");

const User = require("../models/user");

const { validateSignupData } = require("../utils/validation");

authRouter.post("/signup", async (req, res) => {
  const { firstname, lastname, email, password } = req.body;

  const passwordHash = await bcrypt.hash(password, 10);
  console.log("Hashed password:", passwordHash);

  const user = new User({
    firstname,
    lastname,
    email,
    password: passwordHash,
  });

  //encrpt password before saving (to be implemented)

  try {
    validateSignupData(req);
    await user.save();
    res.send("User signed up successfully");
  } catch (error) {
    return res.status(500).send("Error signing up user: " + error.message);
  }
});

authRouter.post("/login", async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).send("Invalid email or password");
    }

    const isPasswordValid = await user.verifyPassword(password);
    if (!isPasswordValid) {
      return res.status(400).send("Invalid email or password");
    } else {
      const token = await user.getJWT();
      res.cookie("token", token);
      res.send("User logged in successfully");
    }
  } catch (error) {
    return res.status(500).send("Error logging in user: " + error.message);
  }
});

authRouter.post("/logout", (req, res) => {
  res.cookie("token", null, { expires: new Date(Date.now()) });
  res.send("User logged out successfully");
});

module.exports = authRouter;
