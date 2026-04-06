const express = require("express");
const router = express.Router();

const upload = require("../../backend/utils/fileUploads");
const auth = require("../middleware/authMiddleware");

const {
  uploadId,
  uploadSelfie,
  verifyKYC,
} = require("./kyc.controller");

// Upload ID
router.post(
  "/upload-id",
  auth,
  upload.single("idImage"),
  uploadId
);

// Upload Selfie
router.post(
  "/upload-selfie",
  auth,
  upload.single("selfieImage"),
  uploadSelfie
);

// ✅ VERIFY KYC (AI FACE MATCH)
router.post("/verify", auth, verifyKYC);

// ✅ GET KYC STATUS
router.get("/status", auth, async (req, res) => {
  const user = await User.findById(req.user._id);
  res.json(user.kyc);
});


module.exports = router;