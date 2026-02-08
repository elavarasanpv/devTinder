/** @format */

const mongoose = require("mongoose");
const validator = require("validator");

const userSchema = new mongoose.Schema(
  {
    firstname: {
      type: String,
      required: true,
      maxLength: 50,
      minLength: 4,
      index: true, // Add index for faster search
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
        message: (props) => `Password is not strong enough!`,
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
          return v.length <= 10;
        },
        message: (props) =>
          `One or more skills exceed the maximum length of 10 skills!`,
      },
    },
  },
  { timestamps: true },
);

userSchema.methods.getJWT = async function () {
  //this refres to the user document, instance of the model
  const jwt = require("jsonwebtoken");
  const token = await jwt.sign({ _id: this._id }, "Tanu@2001", {
    expiresIn: "1d",
  });
  return token;
};

userSchema.methods.verifyPassword = async function (inputPassword) {
  const bcrypt = require("bcrypt");
  return await bcrypt.compare(inputPassword, this.password);
};

const User = mongoose.model("User", userSchema);
module.exports = User;
