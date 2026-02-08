/** @format */

const express = require("express");
const requestsRouter = express.Router();
const { userAuth } = require("../middlewares/auth");
const ConnectionRequest = require("../models/connectionRequest");
const User = require("../models/user");

requestsRouter.post(
  "/request/send/:status/:toUserId",
  userAuth,
  async (req, res) => {
    try {
      const fromUserId = req.user._id;
      const toUserId = req.params.toUserId;

      const status = req.params.status;
      const allowedStatuses = ["interested", "ignore"];
      if (!allowedStatuses.includes(status)) {
        return res.status(400).send({
          message: `Invalid status. Allowed statuses are: ${allowedStatuses.join(", ")}`,
        });
      }

      //   if (fromUserId.toString() === toUserId) {
      //     throw new Error("You cannot send a connection request to yourself");
      //   }
      const findToUser = await User.findById(toUserId);
      if (!findToUser) {
        return res
          .status(404)
          .send("The user you are trying to connect with does not exist");
      }
      const existingRequest = await ConnectionRequest.findOne({
        $or: [
          { fromUserId: fromUserId, toUserId: toUserId },
          { fromUserId: toUserId, toUserId: fromUserId },
        ],
      });

      if (existingRequest) {
        return res
          .status(400)
          .send("Connection request already sent to this user");
      }
      const connectionRequest = new ConnectionRequest({
        fromUserId: fromUserId,
        toUserId: toUserId,
        status: req.params.status,
      });
      const data = await connectionRequest.save();
      res.json({
        message: "Connection request sent successfully",
        data: data,
      });
    } catch (err) {
      return res.status(400).send("error " + err.message);
    }
  },
);

requestsRouter.post(
  "/requests/review/:status/:requestId",
  userAuth,
  async (req, res) => {
    try {
      const loggedInUserId = req.user._id;
      const requestId = req.params.requestId;
      const status = req.params.status;

      const allowedStatuses = ["accepted", "rejected"];
      if (!allowedStatuses.includes(status)) {
        return res.status(400).send({
          message: `Invalid status. Allowed statuses are: ${allowedStatuses.join(", ")}`,
        });
      }

      const connectionRequest = await ConnectionRequest.findOne({
        _id: requestId,
        toUserId: loggedInUserId,
        status: "interested",
      });
      console.log("Connection request found:", connectionRequest);
      if (!connectionRequest) {
        return res.status(404).send("Connection request not found");
      }
      connectionRequest.status = status;
      connectionRequest.save();
      res.json({
        message: `Connection request ${status} successfully`,
        data: connectionRequest,
      });

      //tanvi => elon
      //loggedInUserId = toUserId
      //status = interested
    } catch (err) {
      return res.status(400).send("error " + err.message);
    }
  },
);

module.exports = requestsRouter;
