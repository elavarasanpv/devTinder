/** @format */

const mongoose = require("mongoose");
const validator = require("validator");

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
      validate: {
        validator: function (v) {
          return validator.isEmail(v);
        },
        message: (props) => `${props.value} is not a valid email!`,
      },
    },
    password: {
      type: String,
      required: true,
      validate: {
        validator: function (v) {
          return validator.isStrongPassword(v, {
            minLength: 8,
            minLowercase: 1,
            minUppercase: 1,
            minNumbers: 1,
            minSymbols: 1,
          });
        },
        message: (props) =>
          `Password is not strong enough! It should be at least 8 characters long and include uppercase letters, lowercase letters, numbers, and symbols.`,
      },
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
