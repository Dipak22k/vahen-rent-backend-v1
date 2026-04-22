const express = require("express");
const router = express.Router();

const upload = require("../utils/fileUploads");
const auth = require("../middleware/authMiddleware");

const {
  uploadId,
  uploadSelfie,
  verifyKYC,
} = require("./kyc.controller");

const Kyc = require("../models/Kyc"); // ✅ use KYC model

// Upload ID
router.post("/upload-id", auth, upload.single("idImage"), uploadId);

// Upload Selfie
router.post("/upload-selfie", auth, upload.single("selfieImage"), uploadSelfie);

// Verify KYC
router.post("/verify", auth, verifyKYC);

// Get KYC status
router.get("/status", auth, async (req, res) => {
  const kyc = await Kyc.findOne({ user: req.user._id });

  res.json({
    status: kyc?.status || "not_started",
    mobile: kyc?.mobile || null,
    idImage: kyc?.idImage || null,
    selfieImage: kyc?.selfieImage || null,
  });
});

module.exports = router;