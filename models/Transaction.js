const mongoose = require("mongoose");

const transactionSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    offerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Offer",
    },

    amount: {
      type: Number,
      required: true,
    },

    type: {
      type: String,
      enum: ["credit", "debit"],
      required: true,
    },

    status: {
      type: String,
      enum: ["success", "failed"],
      default: "success",
    },

    title: {
      type: String,
      default: "Car Rental",
    },

    paymentId: String,
  },
  { timestamps: true }
);

module.exports = mongoose.model("Transaction", transactionSchema);