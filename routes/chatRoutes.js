const express = require("express");
const router = express.Router();
const Chat = require("../models/Chat");

// Create or get existing chat
router.post("/create", async (req, res) => {
  const { carId, borrowerId, lenderId } = req.body;

  let chat = await Chat.findOne({ carId, borrowerId });

  if (!chat) {
    chat = await Chat.create({
      carId,
      borrowerId,
      lenderId,
      status: "pending",
    });
  }

  res.json(chat);
});

module.exports = router;