const express = require("express");
const router = express.Router();

const Offer = require("../models/Offer");
const Chat = require("../models/Chat");
const Message = require("../models/Message");
const Booking = require("../models/Booking");
const paymentService = require("../services/paymentService");

const authMiddleware = require("../middleware/authMiddleware");


// ============================
// ✅ CREATE OFFER
// ============================
router.post("/create", authMiddleware, async (req, res) => {
  try {
    const { chatId, pricePerDay, startDate, endDate } = req.body;

    const lenderId = req.user.id;

    const chat = await Chat.findById(chatId);
    if (!chat) {
      return res.status(404).json({ message: "Chat not found" });
    }
    console.log("CHAT LENDER ID:", chat.lenderId.toString());
    console.log("LOGGED USER ID:", lenderId);

    // ✅ Only lender allowed
    if (chat.lenderId.toString() !== lenderId.toString()) {
      return res.status(403).json({ message: "Only lender can send offer" });
    }

    // ✅ Prevent multiple pending offers
    const existing = await Offer.findOne({
      chatId,
      status: "pending",
    });

    if (existing) {
      return res.status(400).json({
        message: "Pending offer already exists",
      });
    }

    // ✅ Create offer
    const offer = await Offer.create({
      chatId,
      carId: chat.carId,
      lenderId,
      borrowerId: chat.borrowerId,
      pricePerDay,
      startDate,
      endDate,
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hrs
    });

    // ✅ Send message in chat
    await Message.create({
      chatId,
      senderId: lenderId,
      receiverId: chat.borrowerId,
      type: "offer",
      metadata: {
        offerId: offer._id,
      },
    });

    res.status(201).json({
      success: true,
      offer,
    });

  } catch (err) {
    console.log("CREATE OFFER ERROR:", err);
    res.status(500).json({ message: "Server error" });
  }
});


// ============================
// ✅ ACCEPT OFFER → CREATE PAYMENT ORDER
// ============================
router.put("/:offerId/accept", authMiddleware, async (req, res) => {
  try {
    const userId = String(req.user.id);

    const offer = await Offer.findById(req.params.offerId);

    if (!offer) {
      return res.status(404).json({
        success: false,
        message: "Offer not found",
      });
    }

    console.log("REQ USER:", userId);
    console.log("BORROWER:", String(offer.borrowerId));

    // ✅ Only borrower
    if (String(offer.borrowerId) !== userId) {
      return res.status(403).json({
        success: false,
        message: "Only borrower can accept this offer",
      });
    }

    // 🔥 ✅ CASE 1: Already accepted → return existing order
    if (offer.status === "accepted") {
      return res.json({
        success: true,
        message: "Offer already accepted",
        offer,
        order: {
          id: offer.orderId,
          amount: offer.totalPrice * 100, // ₹ → paise
          currency: "INR",
        },
      });
    }

    // ❌ Block if not pending
    if (offer.status !== "pending") {
      return res.status(400).json({
        success: false,
        message: `Offer already ${offer.status}`,
      });
    }

    // ✅ Expiry check
    if (offer.expiresAt && offer.expiresAt < new Date()) {
      offer.status = "expired";
      await offer.save();

      return res.status(400).json({
        success: false,
        message: "Offer expired",
      });
    }

    // ✅ Prevent double booking
    const conflict = await Booking.findOne({
      carId: offer.carId,
      status: "confirmed",
      $or: [
        {
          startDate: { $lte: offer.endDate },
          endDate: { $gte: offer.startDate },
        },
      ],
    });

    if (conflict) {
      return res.status(400).json({
        success: false,
        message: "Car already booked for these dates",
      });
    }

    // ✅ Create order ONLY once
    const order = await paymentService.createOrder(offer.totalPrice);

    offer.orderId = order.id;
    offer.status = "accepted";
    await offer.save();

    // ✅ System message
    const message = await Message.create({
      chatId: offer.chatId,
      senderId: userId,
      receiverId: offer.lenderId,
      type: "system",
      metadata: {
        action: "OFFER_ACCEPTED",
        offerId: offer._id,
      },
    });

    const io = req.app.get("io");
    if (io) {
      io.to(offer.chatId.toString()).emit("receive_message", message);
    }

    res.json({
      success: true,
      message: "Offer accepted, proceed to payment",
      offer,
      order,
    });

  } catch (err) {
    console.log("ACCEPT ERROR:", err);
    res.status(500).json({
      success: false,
      message: "Error accepting offer",
    });
  }
});


// ============================
// ❌ REJECT OFFER
// ============================
router.put("/:offerId/reject", authMiddleware, async (req, res) => {
  try {
    const userId = String(req.user.id);

    const offer = await Offer.findById(req.params.offerId);

    if (!offer) {
      return res.status(404).json({ message: "Offer not found" });
    }

    // 🔍 DEBUG (optional)
    console.log("REQ USER:", userId);
    console.log("BORROWER:", String(offer.borrowerId));

    // ✅ Only borrower can reject
    if (String(offer.borrowerId) !== userId) {
      return res.status(403).json({
        message: "Only borrower can reject this offer",
      });
    }

    // ✅ Prevent duplicate action
    if (offer.status !== "pending") {
      return res.status(400).json({
        message: `Offer already ${offer.status}`,
      });
    }

    // ✅ Update status
    offer.status = "rejected";
    await offer.save();

    // ✅ Create system message
    const message = await Message.create({
      chatId: offer.chatId,
      senderId: userId,
      receiverId: offer.lenderId,
      type: "system",
      metadata: {
        action: "OFFER_REJECTED",
        offerId: offer._id,
      },
    });

    // ✅ Emit real-time update (IMPORTANT)
    const io = req.app.get("io");
    io.to(offer.chatId.toString()).emit("receive_message", message);

    res.json({
      success: true,
      offer,
    });

  } catch (err) {
    console.log("REJECT ERROR:", err);
    res.status(500).json({ message: "Error rejecting offer" });
  }
});

// ============================
// 🔍 DELETE / WITHDRAW OFFER
// ============================
router.delete("/:offerId", authMiddleware, async (req, res) => {
  console.log("🔥 DELETE ROUTE HIT"); 
  try {
    const userId = req.user.id;

    const offer = await Offer.findById(req.params.offerId);
    if (!offer) {
      return res.status(404).json({ message: "Offer not found" });
    }

    // ✅ Only lender can withdraw
    if (String(offer.lenderId) !== String(userId)) {
      return res.status(403).json({ message: "Only lender can delete offer" });
    }

    // ✅ Allow withdraw only if pending
    if (offer.status !== "pending") {
      return res.status(400).json({ message: "Cannot delete processed offer" });
    }

    // 🔥 IMPORTANT: DO NOT DELETE → MARK CANCELLED
    offer.status = "cancelled";
    await offer.save();

    res.json({ success: true, offer });

  } catch (err) {
    console.log("DELETE ERROR:", err);
    res.status(500).json({ message: "Error deleting offer" });
  }
});

// ============================
// 🔍 GET SINGLE OFFER
// ============================
router.get("/:offerId", authMiddleware, async (req, res) => {
  try {
    console.log("FETCH ID:", req.params.offerId); // ✅ ADD HERE

    const offer = await Offer.findById(req.params.offerId);

    console.log("FOUND OFFER:", offer); // ✅ ADD HERE

    if (!offer) {
      return res.status(404).json({ message: "Offer not found" });
    }

    res.json(offer);

  } catch (err) {
    console.log("GET OFFER ERROR:", err);
    res.status(500).json({ message: "Error fetching offer" });
  }
});


module.exports = router;