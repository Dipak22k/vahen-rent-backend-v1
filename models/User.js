const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const userSchema = new mongoose.Schema(
{
  name: { type: String, required: false },

  email: { type: String, required: true, unique: true },

  password: { type: String, required: false },

  isEmailVerified: { type: Boolean, default: false },

  otp: String,
  otpExpiry: Date,

  passwordResetAllowed: { type: Boolean, default: false },

  role: {
    type: String,
    enum: ["owner", "borrower", "lender"],
    required: false,
  },

  avatar: {
    type: String,
    default: null,
  },

  authProvider: {
    type: String,
    enum: ["email", "google"],
    default: "email",
  },

  googleId: {
    type: String,
    default: null,
  },

  /* 🔐 ADVANCED KYC */
  kyc: {
    status: {
      type: String,
      enum: ["not_started", "pending", "verified", "rejected"],
      default: "not_started",
    },

    idImage: {
      type: String,
      default: null,
    },

    selfieImage: {
      type: String,
      default: null,
    },

    faceMatchScore: {
      type: Number,
      default: null,
    },

    verifiedAt: {
      type: Date,
      default: null,
    },

    expiryDate: {
      type: Date,
      default: null,
    },
  },
},
{ timestamps: true }
);

userSchema.pre("save", async function () {
  if (!this.isModified("password") || !this.password) return;

  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

userSchema.methods.matchPassword = async function (enteredPassword) {
  if (!this.password) return false;
  return bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model("User", userSchema);