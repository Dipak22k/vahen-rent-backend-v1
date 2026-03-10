const express = require("express");
const router = express.Router();            // ⭐ REQUIRED
const User = require("../models/User");

router.get("/:id", async (req, res) => {
  try {
    const user = await User.findById(req.params.id)
      .select("name email role avatar");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json(user);

  } catch (err) {
    console.log("GET USER ERROR:", err);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;                    // ⭐ REQUIRED