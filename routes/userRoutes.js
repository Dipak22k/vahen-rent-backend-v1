const express = require("express");
const router = express.Router();

const User = require("../models/User");
const authMiddleware = require("../middleware/authMiddleware");
const upload = require("../middleware/uploadMiddleware");

/* ✅ IMPORT CONTROLLER FUNCTIONS */
const {
  sendOtp,
  verifyOtp,
  register,
  login,
  sendResetOtp,   // ✅ ADD THIS
  verifyResetOtp,
  resetPassword,
  googleAuth
} = require("../controllers/authController");


/* ================= UPDATE AVATAR ================= */
router.post(
  "/update-avatar",
  authMiddleware,
  upload.single("avatar"),
  async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
      }

      // ✅ STORE ONLY RELATIVE PATH
      const avatarPath = `/uploads/profile/${req.file.filename}`;

      const updatedUser = await User.findByIdAndUpdate(
        req.user.id,
        { avatar: avatarPath },
        { new: true }
      );

      // ✅ CLEAN RESPONSE
      res.json({
        message: "Avatar updated successfully",
        avatar: avatarPath,
        user: updatedUser,
      });

    } catch (err) {
      console.log("AVATAR ERROR:", err);
      res.status(500).json({ message: "Server error" });
    }
  }
);


/* ================= CHECK KYC STATUS ================= */
/* 🔐 Used for Pickup Location Unlock */

router.get("/check-kyc/:userId", async (req, res) => {
  try {
    const user = await User.findById(req.params.userId).select("kycStatus");

    if (!user) {
      return res.status(404).json({
        verified: false,
        status: "not_found"
      });
    }

    res.json({
      verified: user.kycStatus === "verified",
      status: user.kycStatus,
    });

  } catch (error) {
    console.error("KYC CHECK ERROR:", error);
    res.status(500).json({
      verified: false,
      status: "error"
    });
  }
});




/* ================= GET USER BY ID ================= */
router.get("/users/:id", async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select("-password");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json(user); // ✅ important: return clean user
  } catch (err) {
    console.error("GET USER ERROR:", err);
    res.status(500).json({ message: "Server error" });
  }
});


/* ================= AUTH ROUTES ================= */
router.post("/send-otp", sendOtp);
router.post("/verify-otp", verifyOtp);
router.post("/register", register);
router.post("/login", login);
router.post("/send-reset-otp", sendResetOtp); // ✅ FIX
router.post("/verify-reset-otp", verifyResetOtp);
router.post("/reset-password", resetPassword);
router.post("/google", googleAuth);

module.exports = router;