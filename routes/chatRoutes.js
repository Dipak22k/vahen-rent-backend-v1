const express = require("express");
const router = express.Router();

const authMiddleware = require("../middleware/authMiddleware");
const Chat = require("../models/Chat");
const Message = require("../models/Message");
const User = require("../models/User");
const Kyc = require("../models/Kyc");

// ============================
// CREATE OR GET CHAT
// ============================
router.post("/create", authMiddleware, async (req, res) => {
  try {
    const { carId, lenderId } = req.body;
    const borrowerId = req.user.id;

    if (!carId || !lenderId) {
      return res.status(400).json({ message: "Car and lender are required" });
    }

    if (borrowerId === lenderId) {
      return res.status(400).json({ message: "You cannot chat with yourself" });
    }

    const borrower = await User.findById(borrowerId);
    if (!borrower) {
      return res.status(404).json({ message: "User not found" });
    }

    const kyc = await Kyc.findOne({ user: borrowerId });
    if (!kyc || kyc.status !== "verified") {
      return res.status(403).json({
        message: "Please complete your KYC before requesting a car",
      });
    }

    let chat = await Chat.findOne({ carId, borrowerId, lenderId });

    if (!chat) {
      chat = await Chat.create({
        carId,
        borrowerId,
        lenderId,
        status: "pending",
        finalStatus: "pending",
        unreadCounts: { borrower: 0, lender: 0 }, // ✅ FIX
      });
    }

    res.json(chat);
  } catch (err) {
    console.error("CREATE CHAT ERROR:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// ============================
// SEND MESSAGE (🔥 MOST IMPORTANT)
// ============================
router.post("/send", authMiddleware, async (req, res) => {
  try {
    const { chatId, text, receiverId } = req.body;
    const senderId = req.user.id;

    if (!chatId || !receiverId) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    // 1. Save message
    const message = await Message.create({
      chatId,
      senderId,
      receiverId,
      text,
    });

    // 2. Update unread count
    const chat = await Chat.findById(chatId);

    if (!chat.unreadCounts) {
      chat.unreadCounts = { borrower: 0, lender: 0 };
    }

    if (String(senderId) === String(chat.borrowerId)) {
      chat.unreadCounts.lender += 1;
    } else {
      chat.unreadCounts.borrower += 1;
    }

    await chat.save();

    // 3. Emit socket to BOTH users
    const io = req.app.get("io");

    io.to(chat.borrowerId.toString()).emit("receive_message", message);
    io.to(chat.lenderId.toString()).emit("receive_message", message);

    res.json(message);

  } catch (err) {
    console.error("SEND MESSAGE ERROR:", err);
    res.status(500).json({ message: "Failed to send message" });
  }
});

// ============================
// GET MESSAGES
// ============================
router.get("/messages/:chatId", authMiddleware, async (req, res) => {
  try {
    const messages = await Message.find({
      chatId: req.params.chatId,
    }).sort({ createdAt: 1 });

    res.json(messages);
  } catch (err) {
    console.error("FETCH MESSAGES ERROR:", err);
    res.status(500).json({ message: "Failed to fetch messages" });
  }
});

// ============================
// MARK AS READ
// ============================
router.put("/:chatId/read", authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    const chat = await Chat.findById(req.params.chatId);

    if (!chat) {
      return res.status(404).json({ message: "Chat not found" });
    }

    if (String(chat.borrowerId) === String(userId)) {
      chat.unreadCounts.borrower = 0;
    } else {
      chat.unreadCounts.lender = 0;
    }

    await chat.save();

    res.json({ success: true });
  } catch (err) {
    console.error("READ ERROR:", err);
    res.status(500).json({ message: "Failed to mark as read" });
  }
});

// ============================
// GET CHATS (WITH UNREAD)
// ============================
router.get("/", authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;

    const chats = await Chat.find({
      $or: [{ borrowerId: userId }, { lenderId: userId }],
    })
      .populate("borrowerId", "name avatar")
      .populate("lenderId", "name avatar")
      .sort({ createdAt: -1 });

    const formatted = chats.map((chat) => {
      const isBorrower =
        String(chat.borrowerId._id) === String(userId);

      return {
        ...chat._doc,
        unreadCount: isBorrower
          ? chat.unreadCounts?.borrower || 0
          : chat.unreadCounts?.lender || 0,
      };
    });

    res.json(formatted);
  } catch (err) {
    console.error("FETCH CHATS ERROR:", err);
    res.status(500).json({ message: "Failed to fetch chats" });
  }
});

// ============================
// UPDATE STATUS
// ============================
router.put("/:chatId/status", authMiddleware, async (req, res) => {
  try {
    const { status } = req.body;
    const userId = req.user.id;

    const chat = await Chat.findById(req.params.chatId);

    if (!chat) return res.status(404).json({ message: "Chat not found" });

    if (String(chat.lenderId) !== String(userId)) {
      return res.status(403).json({ message: "Only lender allowed" });
    }

    chat.status = status;
    await chat.save();

    const io = req.app.get("io");

    io.to(chat.borrowerId.toString()).emit("chat_status_updated", {
      chatId: chat._id,
      status: chat.status,
    });

    res.json(chat);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Update failed" });
  }
});

module.exports = router;