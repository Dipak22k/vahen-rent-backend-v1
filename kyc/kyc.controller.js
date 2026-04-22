const Kyc = require("../models/Kyc");

/* ================= UPLOAD ID ================= */
exports.uploadId = async (req, res) => {
  try {
    const kyc = await Kyc.findOneAndUpdate(
      { user: req.user._id },
      {
        $set: {
          idImage: req.file.path,
          status: "pending",
        },
      },
      { new: true, upsert: true }
    );

    res.json({
      message: "ID uploaded",
      kycStatus: kyc.status,
    });

  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Error uploading ID" });
  }
};
/* ================= UPLOAD SELFIE ================= */
exports.uploadSelfie = async (req, res) => {
  try {
    const kyc = await Kyc.findOneAndUpdate(
      { user: req.user._id },
      {
        $set: {
          selfieImage: req.file.path,
          status: "pending",
        },
      },
      { new: true, upsert: true }
    );

    res.json({
      message: "Selfie uploaded",
      kycStatus: kyc.status,
    });

  } catch (err) {
    res.status(500).json({ message: "Error uploading selfie" });
  }
};
/* ================= VERIFY KYC ================= */
exports.verifyKYC = async (req, res) => {
  try {
    console.log("VERIFY USER:", req.user._id);

    const kyc = await Kyc.findOne({ user: req.user._id });

    console.log("KYC FOUND:", kyc);

    if (!kyc) {
      return res.status(404).json({
        message: "KYC not found for this user",
      });
    }

    if (!kyc.idImage || !kyc.selfieImage) {
      return res.status(400).json({
        message: "Upload both ID and Selfie first",
      });
    }

    // ✅ update directly
    kyc.status = "verified";
    kyc.verifiedAt = new Date();

    await kyc.save();

    return res.json({
      message: "KYC_SUCCESS",
      kyc,
    });

  } catch (err) {
    console.log("VERIFY ERROR:", err);
    return res.status(500).json({
      message: "KYC verification failed",
    });
  }
};