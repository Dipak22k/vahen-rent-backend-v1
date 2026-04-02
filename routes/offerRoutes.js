const express = require("express");
const router = express.Router();

const Offer = require("../models/Offer");
const Chat = require("../models/Chat");
const Message = require("../models/Message");
const authMiddleware = require("../middleware/authMiddleware");

router.post("/create", authMiddleware, async (req, res) => {
  try {
    const { chatId, price, days } = req.body;

    const lenderId = req.user.id;

    // 1. Get chat
    const chat = await Chat.findById(chatId);

    if (!chat) {
      return res.status(404).json({ message: "Chat not found" });
    }

    // 2. Only lender can send offer
    if (chat.lenderId.toString() !== lenderId) {
      return res.status(403).json({ message: "Only lender can send offer" });
    }

    // 3. Create offer
    const offer = await Offer.create({
      chatId,
      carId: chat.carId,
      lenderId,
      borrowerId: chat.borrowerId,
      price,
      days,
    });

    // 4. Send message in chat
    await Message.create({
      chatId,
      senderId: lenderId,
      receiverId: chat.borrowerId,
      type: "offer",
      metadata: {
        offerId: offer._id,
      },
    });

    res.status(201).json(offer);

  } catch (err) {
    console.log("CREATE OFFER ERROR:", err);
    res.status(500).json({ message: "Server error" });
  }
});

router.put("/:offerId/accept", authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;

    const offer = await Offer.findById(req.params.offerId);

    if (!offer) {
      return res.status(404).json({ message: "Offer not found" });
    }

    // Only borrower can accept
    if (offer.borrowerId.toString() !== userId) {
      return res.status(403).json({ message: "Not allowed" });
    }

    if (offer.status !== "pending") {
      return res.status(400).json({ message: "Offer already processed" });
    }

    offer.status = "accepted";
    await offer.save();

    // Send system message
    await Message.create({
      chatId: offer.chatId,
      senderId: userId,
      receiverId: offer.lenderId,
      type: "system",
      metadata: {
        action: "OFFER_ACCEPTED",
        offerId: offer._id,
      },
    });

    res.json(offer);

  } catch (err) {
    res.status(500).json({ message: "Error accepting offer" });
  }
});

router.put("/:offerId/reject", authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;

    const offer = await Offer.findById(req.params.offerId);

    if (!offer) {
      return res.status(404).json({ message: "Offer not found" });
    }

    // Only borrower
    if (offer.borrowerId.toString() !== userId) {
      return res.status(403).json({ message: "Not allowed" });
    }

    if (offer.status !== "pending") {
      return res.status(400).json({ message: "Offer already processed" });
    }

    offer.status = "rejected";
    await offer.save();

    // Send system message
    await Message.create({
      chatId: offer.chatId,
      senderId: userId,
      receiverId: offer.lenderId,
      type: "system",
      metadata: {
        action: "OFFER_REJECTED",
        offerId: offer._id,
      },
    });

    res.json(offer);

  } catch (err) {
    res.status(500).json({ message: "Error rejecting offer" });
  }
});

module.exports = router;