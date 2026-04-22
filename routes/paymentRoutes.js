const express = require("express");
const router = express.Router();

const paymentController = require("../controllers/paymentController");
const authMiddleware = require("../middleware/authMiddleware"); // ✅ ADD THIS
const Transaction = require("../models/Transaction"); // ✅ ADD THIS

// ============================
// 🧾 CREATE ORDER
// ============================
router.post("/create-order", paymentController.createOrder);

// ============================
// 💳 VERIFY PAYMENT
// ============================
router.post("/verify", paymentController.verifyPayment);

// ============================
// 📊 TRANSACTION HISTORY (NEW)
// ============================
router.get("/history", authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;

    const transactions = await Transaction.find({ userId })
      .sort({ createdAt: -1 });

    res.json(transactions);

  } catch (err) {
    console.log("HISTORY ERROR:", err);
    res.status(500).json({ message: "Error fetching transactions" });
  }
});

module.exports = router;