const mongoose = require("mongoose");

const carSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    brand: { type: String, required: true },
    model: { type: String, required: true },

    year: { type: Number, required: true },
    price: { type: Number, required: true },

    fuel: String,
    transmission: String,
    kmDriven: Number,      // ⭐⭐⭐ FIXED

    color: String,
    city: String,
    description: String,
    insurance: String,

    images: [{ type: String }],

    lenderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    availability: {
      type: String,
      default: "Available",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Car", carSchema);