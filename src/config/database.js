/** @format */

const mongoose = require("mongoose");

const connectDB = async () => {
  await mongoose.connect(
    "mongodb+srv://elavarasan_db_user:OAtFu9bS7gVqQof6@ommuruga.izltlfg.mongodb.net/devTinder",
  );
};
module.exports = connectDB;
// connectDB()
//   .then((res) => {
//     console.log("connected database");
//   })
//   .catch((err) => {
//     console.error("Database connection error:", err);
//   });

// mongoose.connect(
//   "mongodb+srv://elavarasan_db_user:OAtFu9bS7gVqQof6@ommuruga.izltlfg.mongodb.net/?appName=OmMuruga",
// );
