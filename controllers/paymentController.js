const paymentService = require("../services/paymentService");
const Offer = require("../models/Offer");
const Booking = require("../models/Booking");
const { verifyPayment } = require("../utils/verifySignature");
const Transaction = require("../models/Transaction");

// ============================
// 🧾 CREATE ORDER
// ============================
exports.createOrder = async (req, res) => {
  try {
    const { amount } = req.body;

    // ✅ Validate input
    if (!amount || amount <= 0) {
      return res.status(400).json({
        success: false,
        message: "Valid amount is required",
      });
    }

    // ✅ Create Razorpay order
    const order = await paymentService.createOrder(amount);

    res.status(200).json({
      success: true,
      order,
    });

  } catch (error) {
    console.log("CREATE ORDER ERROR:", error);
    res.status(500).json({
      success: false,
      message: "Error creating order",
    });
  }
};


// ============================
// 💳 VERIFY PAYMENT
// ============================
exports.verifyPayment = async (req, res) => {
  try {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      offerId,
    } = req.body;

    // ✅ Validate input
    if (
      !razorpay_order_id ||
      !razorpay_payment_id ||
      !razorpay_signature ||
      !offerId
    ) {
      return res.status(400).json({
        success: false,
        message: "Missing payment details",
      });
    }

    // ✅ Verify signature
    const isValid = verifyPayment(
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature
    );

    if (!isValid) {
      return res.status(400).json({
        success: false,
        message: "Invalid payment signature",
      });
    }

    // ✅ Get offer
    const offer = await Offer.findById(offerId);

    if (!offer) {
      return res.status(404).json({
        success: false,
        message: "Offer not found",
      });
    }

    // ✅ Prevent duplicate payment
    if (offer.status === "paid") {
      return res.status(400).json({
        success: false,
        message: "Offer already paid",
      });
    }

    // ✅ Update offer
    offer.status = "paid";
    offer.paymentId = razorpay_payment_id;
    offer.orderId = razorpay_order_id;

    await offer.save();

    // ✅ Create booking
    const booking = await Booking.create({
      carId: offer.carId,
      lenderId: offer.lenderId,
      borrowerId: offer.borrowerId,
      startDate: offer.startDate,
      endDate: offer.endDate,
      totalPrice: offer.totalPrice,
      status: "confirmed",
    });

    // ============================
    // 💰 SAVE TRANSACTIONS
    // ============================

    // 🔻 Borrower (DEBIT)
    await Transaction.create({
      userId: offer.borrowerId,
      offerId: offer._id,
      amount: offer.totalPrice,
      type: "debit",
      status: "success",
      title: "Car Rental Payment",
      paymentId: razorpay_payment_id,
    });

    // 🔺 Lender (CREDIT)
    await Transaction.create({
      userId: offer.lenderId,
      offerId: offer._id,
      amount: offer.totalPrice,
      type: "credit",
      status: "success",
      title: "Car Rental Earnings",
      paymentId: razorpay_payment_id,
    });

    res.json({
      success: true,
      message: "Payment successful & booking confirmed",
      booking,
    });

  } catch (err) {
    console.log("VERIFY PAYMENT ERROR:", err);
    res.status(500).json({
      success: false,
      message: "Payment verification failed",
    });
  }
};