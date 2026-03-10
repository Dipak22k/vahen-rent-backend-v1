const User = require("../models/User");
const jwt = require("jsonwebtoken");
const transporter = require("../config/mail");
const generateOtp = require("../utils/generateOtp");

/* ================= SEND OTP ================= */

exports.sendOtp = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: "Email is required" });
    }

    const otp = generateOtp();

    let user = await User.findOne({ email });

    // ✅ DO NOT create incomplete user with required fields missing
    if (!user) {
      user = await User.create({
        email,
        isEmailVerified: false,
      });
    }

    user.otp = otp;
    user.otpExpiry = Date.now() + 10 * 60 * 1000;

    await user.save();

    await transporter.sendMail({
      to: email,
      subject: "Email Verification",
      html: `<h2>Your OTP is ${otp}</h2>`,
    });

    res.json({ message: "OTP sent successfully" });
    console.log("otp succes");

  } catch (err) {
    console.error("SEND OTP ERROR:", err);
    res.status(500).json({ message: "Server error" });
  }
};

/* ================= VERIFY OTP ================= */

exports.verifyOtp = async (req, res) => {
  const { email, otp } = req.body;

  const user = await User.findOne({ email });

  if (!user || user.otp !== otp || user.otpExpiry < Date.now()) {
    return res.status(400).json({ message: "Invalid or expired OTP" });
  }

  user.isEmailVerified = true;
  user.otp = null;
  user.otpExpiry = null;

  await user.save();

  res.json({ message: "Email verified" });
};

/* ================= REGISTER ================= */

exports.register = async (req, res) => {
  const { name, email, password, role } = req.body;

  if (!name || !email || !password || !role) {
    return res.status(400).json({ message: "All fields are required" });
  }

  const normalizedRole = role.toLowerCase();

  if (!["borrower", "lender"].includes(normalizedRole)) {
    return res.status(400).json({ message: "Invalid role selected" });
  }

  const user = await User.findOne({ email });

  if (!user || !user.isEmailVerified) {
    return res.status(400).json({ message: "Email not verified" });
  }

  if (user.password) {
    return res.status(400).json({ message: "User already registered" });
  }

  user.name = name;
  user.password = password; // hashed by schema
  user.role = normalizedRole;

  await user.save();

  const token = jwt.sign(
    { id: user._id, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: "7d" }
  );

  res.json({
    token,
    user: {
      email: user.email,
      name: user.name,
      role: user.role,
    },
  });
};

/* ================= LOGIN ================= */

exports.login = async (req, res) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email });

  if (!user || !user.isEmailVerified) {
    return res.status(400).json({ message: "Invalid credentials" });
  }

  const isMatch = await user.matchPassword(password);

  if (!isMatch) {
    return res.status(400).json({ message: "Invalid credentials" });
  }

  const token = jwt.sign(
    { id: user._id, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: "7d" }
  );

  res.json({
    token,
    user: {
      email: user.email,
      name: user.name,
      role: user.role,
    },
  });
};

/* ================= VERIFY RESET OTP ================= */

exports.verifyResetOtp = async (req, res) => {
  const { email, otp } = req.body;

  if (!email || !otp) {
    return res.status(400).json({ message: "Email and OTP required" });
  }

  const user = await User.findOne({ email });

  if (!user || user.otp !== otp || user.otpExpiry < Date.now()) {
    return res.status(400).json({ message: "Invalid or expired OTP" });
  }

  user.otp = null;
  user.otpExpiry = null;
  user.passwordResetAllowed = true;

  await user.save();

  res.json({ message: "OTP verified. Proceed to reset password." });
};

/* ================= RESET PASSWORD ================= */

exports.resetPassword = async (req, res) => {
  const { email, newPassword } = req.body;

  if (!email || !newPassword) {
    return res.status(400).json({ message: "Missing fields" });
  }

  const user = await User.findOne({ email });

  if (!user || !user.passwordResetAllowed) {
    return res.status(403).json({ message: "Unauthorized password reset" });
  }

  user.password = newPassword; // hashed by schema
  user.passwordResetAllowed = false;

  await user.save();

  res.json({ message: "Password reset successful" });
};
