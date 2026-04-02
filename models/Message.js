const mongoose = require("mongoose");

const MessageSchema = new mongoose.Schema({
  chatId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Chat",
    required: true,
  },

  senderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },

  receiverId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },

  type: {
  type: String,
  enum: [
    "text",
    "image",
    "location",

    // ✅ NEW TYPES (NON-BREAKING)
    "offer",
    "payment",
    "booking",
    "pickup",
    "system"
  ],
  default: "text",
},

  text: String,
  image: String,

  location: {
    lat: Number,
    lng: Number,
    address: String,
  },

  metadata: {
  type: mongoose.Schema.Types.Mixed,
  default: {}
},

  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("Message", MessageSchema);