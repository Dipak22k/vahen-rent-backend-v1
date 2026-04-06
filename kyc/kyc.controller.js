const User = require("../models/User");
const { matchFaces } = require("../utils/faceMatcher");

// ✅ Upload ID
exports.uploadId = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    user.kyc.idImage = req.file.path;
    user.kyc.status = "pending";

    await user.save();

    res.json({ message: "ID uploaded" });
  } catch (err) {
    res.status(500).json({ message: "Error uploading ID" });
  }
};

// ✅ Upload Selfie
exports.uploadSelfie = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    user.kyc.selfieImage = req.file.path;
    user.kyc.status = "pending";

    await user.save();

    res.json({ message: "Selfie uploaded" });
  } catch (err) {
    res.status(500).json({ message: "Error uploading selfie" });
  }
};

// ✅ VERIFY KYC (FACE MATCH)
exports.verifyKYC = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    if (!user.kyc.idImage || !user.kyc.selfieImage) {
      return res.status(400).json({
        message: "Upload ID and Selfie first",
      });
    }

    // 🔥 FACE MATCH
    const result = await matchFaces(
      user.kyc.idImage,
      user.kyc.selfieImage
    );

    if (!result.match) {
      user.kyc.status = "rejected";
      await user.save();

      return res.status(400).json({
        message: "FACE_NOT_MATCHED",
      });
    }

    // ✅ SUCCESS
    user.kyc.status = "verified";
    user.kyc.faceMatchScore = 0.6; // optional
    user.kyc.verifiedAt = new Date();

    await user.save();

    res.json({
      message: "KYC_SUCCESS",
      kyc: user.kyc,
    });
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "KYC verification failed" });
  }
};