// models/Chat.js

const mongoose = require("mongoose");

const ChatSchema = new mongoose.Schema(
  {
    carId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Car",
      required: true,
    },

    borrowerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    lenderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    status: {
      type: String,
      enum: ["pending", "accepted", "rejected"],
      default: "pending",
    },

    // ✅ ADD THIS
    finalStatus: {
      type: String,
      enum: ["pending", "confirmed", "cancelled","closed"],
      default: "pending",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Chat", ChatSchema);