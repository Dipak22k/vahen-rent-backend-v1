const User = require("../models/User");
const jwt = require("jsonwebtoken");
const transporter = require("../config/mail");
const generateOtp = require("../utils/generateOtp");
const { OAuth2Client } = require("google-auth-library");

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

/* ================= SEND OTP ================= */
exports.sendOtp = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: "Email is required" });
    }

    const otp = generateOtp();
    console.log("SENT OTP:", otp);

    let user = await User.findOne({ email });

    if (!user) {
      user = new User({ email });
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

  } catch (err) {
    console.error("SEND OTP ERROR:", err);
    res.status(500).json({ message: err.message || "Server error" });
  }
};

/* ================= VERIFY OTP ================= */
exports.verifyOtp = async (req, res) => {
  try {
    console.log("VERIFY OTP API HIT");
    const { email, otp } = req.body;

    const user = await User.findOne({ email });

    if (!user || user.otp.toString() !== otp.toString() || user.otpExpiry < Date.now()) {
      return res.status(400).json({ message: "Invalid or expired OTP" });
    }

    user.isEmailVerified = true;
    user.otp = null;
    user.otpExpiry = null;

    await user.save();

    res.json({ message: "Email verified" });

  } catch (err) {
    console.error("VERIFY OTP ERROR:", err);
    res.status(500).json({ message: "Server error" });
  }
};

/* ================= REGISTER ================= */
exports.register = async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    if (!name || !email || !password || !role) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const normalizedRole = role.toLowerCase();

    if (!["owner", "borrower", "lender"].includes(normalizedRole)) {
      return res.status(400).json({ message: "Invalid role selected" });
    }

    const user = await User.findOne({ email });

    if (!user || !user.isEmailVerified) {
      return res.status(400).json({ message: "Please verify your email before registering" });
    }

    if (user.password) {
      return res.status(400).json({ message: "User already registered" });
    }

    user.name = name;
    user.password = password;
    user.role = normalizedRole;

    await user.save();

    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "31d" }
    );

   res.json({
  token,
  user: {
    _id: user._id,
    email: user.email,
    name: user.name,
    role: user.role,
   avatar: user.avatar || null, // ✅ ADD THIS LINE
  },
});

  } catch (err) {
    console.error("REGISTER ERROR:", err);
    res.status(500).json({ message: "Server error" });
  }
};

/* ================= LOGIN ================= */
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email }).select("+avatar");

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
  { expiresIn: "31d" }
);

res.json({
  token,
  user: {
    _id: user._id,
    email: user.email,
    name: user.name,
    role: user.role,
    avatar: user.avatar || null,
    kyc: user.kyc || null  // ✅ FINAL FIX
  },
});

  } catch (err) {
    console.error("LOGIN ERROR:", err);
    res.status(500).json({ message: "Server error" });
  }
};

/* ================= SEND RESET OTP ================= */
exports.sendResetOtp = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: "Email is required" });
    }

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const otp = generateOtp().toString();

    user.otp = otp;
    user.otpExpiry = Date.now() + 10 * 60 * 1000;

    await user.save();

    await transporter.sendMail({
      to: email,
      subject: "Password Reset OTP",
      html: `<h2>Your OTP is ${otp}</h2>`,
    });

    res.json({ message: "OTP sent successfully" });

  } catch (err) {
    console.error("SEND RESET OTP ERROR:", err);
    res.status(500).json({ message: "Server error" });
  }
};

/* ================= VERIFY RESET OTP ================= */
exports.verifyResetOtp = async (req, res) => {
  try {
    const { email, otp } = req.body;

    const user = await User.findOne({ email });

    if (!user || user.otp !== otp || user.otpExpiry < Date.now()) {
      return res.status(400).json({ message: "Invalid or expired OTP" });
    }

    user.otp = null;
    user.otpExpiry = null;
    user.passwordResetAllowed = true;

    await user.save();

    res.json({ message: "OTP verified. Proceed to reset password." });

  } catch (err) {
    console.error("VERIFY RESET OTP ERROR:", err);
    res.status(500).json({ message: "Server error" });
  }
};

/* ================= RESET PASSWORD ================= */
exports.resetPassword = async (req, res) => {
  try {
    const { email, newPassword } = req.body;

    const user = await User.findOne({ email });

    if (!user || !user.passwordResetAllowed) {
      return res.status(403).json({ message: "Unauthorized password reset" });
    }

    user.password = newPassword;
    user.passwordResetAllowed = false;

    await user.save();

    res.json({ message: "Password reset successful" });

  } catch (err) {
    console.error("RESET PASSWORD ERROR:", err);
    res.status(500).json({ message: "Server error" });
  }
};

/* ================= GOOGLE AUTH ================= */
exports.googleAuth = async (req, res) => {
  try {
    const { token, role } = req.body;

    const normalizedRole = role.toLowerCase();

    const ticket = await client.verifyIdToken({
      idToken: token,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();

    let user = await User.findOne({ email: payload.email });

    if (!user) {
      user = await User.create({
        name: payload.name,
        email: payload.email,
        role: normalizedRole,
        avatar: payload.picture,
        googleId: payload.sub,
        authProvider: "google",
        isEmailVerified: true,
      });
    }

    const tokenJwt = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.json({
      token: tokenJwt,
      user: {
        _id: user._id, // ✅ ADDED
        email: user.email,
        name: user.name,
        role: user.role,
        avatar: user.avatar,
      },
    });

  } catch (error) {
    console.error("GOOGLE AUTH ERROR:", error);
    res.status(500).json({ message: "Google authentication failed" });
  }
};