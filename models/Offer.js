const mongoose = require("mongoose");

const offerSchema = new mongoose.Schema(
  {
    chatId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Chat",
      required: true,
    },

    carId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Car",
      required: true,
    },

    lenderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    borrowerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    // ✅ clearer pricing
    pricePerDay: {
      type: Number,
      required: true,
    },

    totalPrice: {
      type: Number,
      required: true,
    },

    // ✅ booking period (source of truth)
    startDate: {
      type: Date,
      required: true,
    },

    endDate: {
      type: Date,
      required: true,
    },

    // ✅ proper lifecycle
    status: {
      type: String,
      enum: [
        "pending",
        "accepted",
        "rejected",
        "expired",
        "cancelled",
        "paid",
      ],
      default: "pending",
    },
        paymentId: {
      type: String,
    },

    orderId: {
      type: String,
    },

    // ✅ offer expiry
    expiresAt: {
      type: Date,
      required: true,
    },
  },
  { timestamps: true }
);

// ✅ auto-calc total price
offerSchema.pre("validate", function (next) {
  const days = Math.ceil(
    (this.endDate - this.startDate) / (1000 * 60 * 60 * 24)
  );

  if (days <= 0) {
    return next(new Error("Invalid date range"));
  }

  this.totalPrice = this.pricePerDay * days;

  next();
});

module.exports = mongoose.model("Offer", offerSchema);