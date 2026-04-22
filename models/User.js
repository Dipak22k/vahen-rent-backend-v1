const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const userSchema = new mongoose.Schema(
{
  name: { type: String },

  email: { type: String, required: true, unique: true },

  password: { type: String },

  isEmailVerified: { type: Boolean, default: false },

  otp: String,
  otpExpiry: Date,

  passwordResetAllowed: { type: Boolean, default: false },

  role: {
    type: String,
    enum: ["owner", "borrower", "lender"],
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

  socketId: {
    type: String,
    default: null,
  },

  isOnline: {
    type: Boolean,
    default: false,
  },

  lastSeen: {
    type: Date,
    default: null,
  },

  isBlocked: {
    type: Boolean,
    default: false,
  },

  notifications: [
    {
      title: String,
      message: String,
      type: String,
      read: { type: Boolean, default: false },
      createdAt: { type: Date, default: Date.now },
    },
  ],
},
{ timestamps: true }
);

// 🔐 PASSWORD HASHING
userSchema.pre("save", async function (next) {
  if (!this.isModified("password") || !this.password) return next();

  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);

  next();
});

// 🔐 PASSWORD MATCH
userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model("User", userSchema);