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
    enum: ["Owner","borrower", "lender"],
    required: false,
  },

  /* ✅ Avatar */
  avatar: {
    type: String,
    default: null,
  },

  /* 🔐 ADD THIS FOR KYC */
  kycStatus: {
    type: String,
    enum: ["pending", "verified", "rejected"],
    default: "pending",
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