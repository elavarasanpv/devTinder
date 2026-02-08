/** @format */

const express = require("express");
const { userAuth } = require("../middlewares/auth");
const connectionRequest = require("../models/connectionRequest");
const User = require("../models/user");

const userRouter = express.Router();

//get all the pending connection requests for the logged in user
userRouter.get("/users/requests/received", userAuth, async (req, res) => {
  try {
    const userId = req.user._id;
    const pendingRequests = await connectionRequest
      .find({
        toUserId: userId,
        status: "interested",
      })
      .populate("fromUserId", "firstname lastname photoUrl about");
    console.log("Pending requests:", pendingRequests);
    res.json({
      message: "Pending connection requests retrieved successfully",
      data: pendingRequests,
    });
  } catch (err) {
    return res.status(400).send("Server error" + err.message);
  }
});

userRouter.get("/users/connections", userAuth, async (req, res) => {
  try {
    const userId = req.user._id;
    const connections = await connectionRequest
      .find({
        $or: [
          { fromUserId: userId, status: "accepted" },
          { toUserId: userId, status: "accepted" },
        ],
      })
      .populate("fromUserId toUserId", "firstname lastname photoUrl about");

    const data = connections.map((connection) => {
      if (connection.fromUserId._id.toString() === userId.toString()) {
        return connection.toUserId;
      } else {
        return connection.fromUserId;
      }
    });
    res.json({
      message: "Connections retrieved successfully",
      data: data,
    });
  } catch (err) {
    return res.status(400).send("Server error" + err.message);
  }
});

userRouter.get("/users/feed", userAuth, async (req, res) => {
  try {
    const userId = req.user._id;
    const page = parseInt(req.query.page) || 1;
    let limit = parseInt(req.query.limit) || 5;
    const skip = (page - 1) * limit;
    limit = limit > 10 ? 10 : limit; // Set a maximum limit of 10 to prevent abuse

    const connections = await connectionRequest
      .find({
        $or: [{ fromUserId: userId }, { toUserId: userId }],
      })
      .select("fromUserId toUserId"); //we only need the user ids of the connections to filter the feed

    //one way to get the feed users is to get all the users and filter out the connections from the feed, but this can be inefficient if there are a lot of users in the database. A more efficient way is to use MongoDB's $nin operator to exclude the connections from the feed query itself.
    // const connectionIds = connections.map((connection) => {
    //   if (connection.fromUserId.toString() === userId.toString()) {
    //     return connection.toUserId.toString();
    //   } else {
    //     return connection.fromUserId.toString();
    //   }
    // });
    // console.log("Connection IDs:", connectionIds);
    // const allUsers = await User.find({ _id: { $ne: userId } }); //exclude the logged in user from the feed

    // const feedUsers = allUsers.filter(
    //   (user) => !connectionIds.includes(user._id.toString()),
    // );

    const hideUsers = new Set();

    connections.forEach((connection) => {
      hideUsers.add(connection.fromUserId.toString());
      hideUsers.add(connection.toUserId.toString());
    });

    const feedUsers = await User.find({
      $and: [
        { _id: { $nin: Array.from(hideUsers) } },
        { _id: { $ne: userId } },
      ],
    })
      .select("firstname lastname photoUrl about skills")
      .skip(skip)
      .limit(limit); //$nin operator to exclude the connections from the feed query itself, this is more efficient than filtering the feed users in memory after fetching all users from the database

    res.json({
      message: "Feed retrieved successfully!!",
      data: feedUsers,
    });
  } catch (err) {
    return res.status(400).send("Server error" + err.message);
  }
});

module.exports = userRouter;
