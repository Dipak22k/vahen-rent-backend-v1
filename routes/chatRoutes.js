// routes/chatRoutes.js
const authMiddleware = require("../middleware/authMiddleware");
const User = require("../models/User");
const express = require("express");
const router = express.Router();
const Chat = require("../models/Chat");


// ============================
// CREATE OR GET CHAT
// ============================
router.post("/create", authMiddleware, async (req, res) => {
  try {
    const { carId, lenderId } = req.body;

    // ✅ GET BORROWER FROM TOKEN (SECURE)
    const borrowerId = req.user.id;

    // ❌ Basic validation
    if (!carId || !lenderId) {
      return res.status(400).json({
        message: "Car and lender are required",
      });
    }

    // ❌ Prevent self chat
    if (borrowerId === lenderId) {
      return res.status(400).json({
        message: "You cannot chat with yourself",
      });
    }

    // 🔥 ✅ KYC CHECK
    const borrower = await User.findById(borrowerId);

    if (!borrower) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    if (borrower.kycStatus !== "verified") {
      return res.status(403).json({
        message: "Please complete your KYC before requesting a car",
      });
    }

    // ✅ Find existing chat
    let chat = await Chat.findOne({ carId, borrowerId });

    // ✅ Create if not exists
    if (!chat) {
      chat = await Chat.create({
        carId,
        borrowerId,
        lenderId,
        status: "pending",
        finalStatus: "pending",
      });
    }

    res.status(200).json(chat);

  } catch (err) {
    console.log("CREATE CHAT ERROR:", err);
    res.status(500).json({
      message: "Server error",
    });
  }
});


// ============================
// UPDATE CHAT STATUS (ACCEPT / REJECT)
// ============================
router.put("/:chatId/status", async (req, res) => {
  try {
    const { status, userId } = req.body;

    const chat = await Chat.findById(req.params.chatId);

    if (!chat) {
      return res.status(404).json({
        message: "Chat not found",
      });
    }

    // 🔐 Only lender can update
    if (chat.lenderId.toString() !== userId) {
      return res.status(403).json({
        message: "Only lender can update status",
      });
    }

    chat.status = status;
    await chat.save();

    res.json(chat);
  } catch (err) {
    res.status(500).json({
      message: "Update failed",
    });
  }
});


// ============================
// CONFIRM RENT (FINAL STEP)
// ============================
router.put("/:chatId/confirm", async (req, res) => {
  try {
    const { userId } = req.body;

    const chat = await Chat.findById(req.params.chatId);

    if (!chat) {
      return res.status(404).json({
        message: "Chat not found",
      });
    }

    // 🔐 Only lender can confirm
    if (chat.lenderId.toString() !== userId) {
      return res.status(403).json({
        message: "Only lender can confirm rent",
      });
    }

    // ❌ Cannot confirm before accept
    if (chat.status !== "accepted") {
      return res.status(400).json({
        message: "Chat must be accepted first",
      });
    }

    chat.finalStatus = "confirmed";
    await chat.save();

    res.json(chat);
  } catch (err) {
    res.status(500).json({
      message: "Confirmation failed",
    });
  }
});

module.exports = router;