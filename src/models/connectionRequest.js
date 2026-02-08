/** @format */

const mongoose = require("mongoose");
const states = ["ignore", "interested", "accepted", "rejected"];

const connectionRequestSchema = new mongoose.Schema(
  {
    fromUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User", //reference to the User model
      required: true,
    },
    toUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    status: {
      type: String,
      enum: {
        values: states,
        message: `{VALUE} is not a valid connection request status`,
      },
    },
  },
  { timestamps: true },
);

connectionRequestSchema.index({ fromUserId: 1, toUserId: 1 }); // Add compound index for faster lookups of connection requests between users

connectionRequestSchema.pre("save", async function (next) {
  const connection = this;
  if (connection.fromUserId.toString() === connection.toUserId.toString()) {
    throw new Error("You cannot send a connection request to yourself");
  }
  next();
});

const ConnectionRequestModel = mongoose.model(
  "ConnectionRequest",
  connectionRequestSchema,
);

module.exports = ConnectionRequestModel;
