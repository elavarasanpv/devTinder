/** @format */

const validator = require("validator");
const validateSignupData = (req) => {
  const { firstname, lastname, email, password } = req.body;

  if (!firstname || !lastname) {
    throw new Error("Firstname and Lastname are required");
  } else if (validator.isEmail(email) === false) {
    throw new Error("Invalid email format");
  } else if (
    !validator.isStrongPassword(password, {
      minLength: 8,
      minLowercase: 1,
      minUppercase: 1,
      minNumbers: 1,
      minSymbols: 1,
    })
  ) {
    throw new Error(
      "Password is not strong enough! It should be at least 8 characters long and include uppercase letters, lowercase letters, numbers, and symbols.",
    );
  }
};

const validatEditProfileData = (req) => {
  const allowedEditFields = [
    "firstname",
    "lastname",
    "age",
    "gender",
    "photoUrl",
    "about",
    "skills",
  ];
  const editFields = Object.keys(req.body);
  const isValidOperation = editFields.every((field) =>
    allowedEditFields.includes(field),
  );
  if (!isValidOperation) {
    throw new Error("Invalid edit fields");
  }
};

module.exports = { validateSignupData, validatEditProfileData };
