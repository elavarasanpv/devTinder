/** @format */

const express = require("express");
const profileRouter = express.Router();
const { userAuth } = require("../middlewares/auth");
const { validatEditProfileData } = require("../utils/validation");
const User = require("../models/user");
const bcrypt = require("bcrypt");
const validator = require("validator");

profileRouter.get("/profile/view", userAuth, async (req, res) => {
  try {
    res.json({
      message: "Profile retrieved successfully",
      data: req.user,
    });
  } catch (err) {
    return res.status(500).send("Server error");
  }
});

profileRouter.patch("/profile/edit", userAuth, async (req, res) => {
  try {
    validatEditProfileData(req);
    const loggedInUser = req.user;
    Object.keys(req.body).forEach((field) => {
      loggedInUser[field] = req.body[field];
    });
    // const updatedUser = await User.findByIdAndUpdate(loggedInUser._id, req.body, {
    //   new: true,
    //   runValidators: true,
    // });
    // if (!updatedUser) {
    //   return res.status(404).send("User not found");
    // }
    await loggedInUser.save();
    res.json({
      message: `${loggedInUser.firstname}'s Profile updated successfully`,
      data: loggedInUser,
    });
  } catch (err) {
    return res.status(400).send("Error updating profile: " + err.message);
  }
});

profileRouter.patch("/profile/changePassword", userAuth, async (req, res) => {
  const { oldPassword, newPassword } = req.body;
  try {
    const user = req.user;
    const isOldPasswordValid = await user.verifyPassword(oldPassword);
    if (!isOldPasswordValid) {
      return res.status(400).send("Old password is incorrect");
    }
    const isStrongPassword = validator.isStrongPassword(newPassword, {
      minLength: 8,
      minLowercase: 1,
      minUppercase: 1,
      minNumbers: 1,
      minSymbols: 1,
    });
    if (!isStrongPassword) {
      throw new Error(
        "New password is not strong enough! It should be at least 8 characters long and include uppercase letters, lowercase letters, numbers, and symbols.",
      );
    }
    user.password = await bcrypt.hash(newPassword, 10);
    await user.save();
    res.json({ message: "Password changed successfully" });
  } catch (err) {
    return res.status(400).send("Error changing password: " + err.message);
  }
});

module.exports = profileRouter;
