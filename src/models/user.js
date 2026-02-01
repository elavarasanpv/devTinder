/** @format */

const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    firstname: {
      type: String,
      required: true,
      maxLength: 50,
      minLength: 5,
    },
    lastname: {
      type: String,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true, // Convert to lowercase
      trim: true, // Remove whitespace
    },
    password: {
      type: String,
      required: true,
    },
    age: {
      type: Number,
      min: 18,
    },
    gender: {
      type: String,
      validate: {
        validator: function (v) {
          // only called on create and save
          return ["male", "female", "other"].includes(v);
        },
        message: (props) => `${props.value} is not a valid gender!`,
      },
    },
    photoUrl: {
      type: String,
      default: "https://example.com/default-profile-pic.png",
    },
    about: {
      type: String,
    },
    skills: {
      type: [String],
      validate: {
        validator: function (v) {
          return v.length <= 3;
        },
        message: (props) =>
          `One or more skills exceed the maximum length of 3 skills!`,
      },
    },
  },
  { timestamps: true },
);

const User = mongoose.model("User", userSchema);
module.exports = User;
