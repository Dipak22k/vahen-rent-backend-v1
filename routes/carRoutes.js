const express = require("express");
const router = express.Router();
const Car = require("../models/Car");
const authMiddleware = require("../middleware/authMiddleware");
const Kyc = require("../models/Kyc");

/* ================= ADD CAR ================= */
router.post("/", authMiddleware, async (req, res) => {
  try {
    const user = req.user;

    // ✅ ONLY lender can add car
    if (user.role !== "lender") {
      return res.status(403).json({
        message: "Only lenders can list cars"
      });
    }

    // ✅ Check KYC
    const kyc = await Kyc.findOne({ user: user.id });

    if (!kyc || kyc.status !== "verified") {
      return res.status(403).json({
        message: "Complete KYC before listing cars"
      });
    }

    const { images, ...rest } = req.body;

    const car = await Car.create({
      ...rest,
      images: Array.isArray(images) ? images : [],
      lenderId: user.id,
      availability: "Available",
    });

    res.json(car);

  } catch (err) {
    console.log("ADD CAR ERROR:", err);
    res.status(400).json({ message: err.message });
  }
});
/* ================= UPDATE CAR ================= */

router.post("/update", authMiddleware, async (req, res) => {
  try {
    const { carId, images, ...rest } = req.body;

    if (!carId) {
      return res.status(400).json({ message: "carId missing" });
    }

    const updateData = { ...rest };

    // ✅ ONLY update images if provided
    if (images && Array.isArray(images) && images.length > 0) {
      updateData.images = images;
    }

    const updatedCar = await Car.findByIdAndUpdate(
      carId,
      updateData,
      { new: true }
    );

    res.json(updatedCar);

  } catch (err) {
    console.log("UPDATE CAR ERROR:", err);
    res.status(500).json({ message: err.message });
  }
});

/* ================= BORROWER CARS ================= */

router.get("/", async (_, res) => {
  try {
    const cars = await Car.find({ availability: "Available" })
      .sort({ createdAt: -1 });

    res.json(cars);

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

/* ================= LENDER CARS ================= */

router.get("/my-cars", authMiddleware, async (req, res) => {
  try {
    const cars = await Car.find({ lenderId: req.user.id })
      .sort({ createdAt: -1 });

    res.json(cars);

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;