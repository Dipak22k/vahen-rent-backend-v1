const mongoose = require("mongoose");

const kycSchema = new mongoose.Schema(
{
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
    unique: true,
  },

  mobile: {
    type: String,
    default: null, // ✅ correct (NOT "null")
  },

  status: {
    type: String,
    enum: ["not_started", "pending", "verified", "rejected"],
    default: "not_started",
  },

  idImage: {
    type: String,
    default: null, // ✅ correct
  },

  selfieImage: {
    type: String,
    default: null, // ✅ correct
  },

  verifiedAt: {
    type: Date,
    default: null, // ✅ correct
  },
},
{ timestamps: true }
);

module.exports = mongoose.model("Kyc", kycSchema);