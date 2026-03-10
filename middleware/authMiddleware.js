const jwt = require("jsonwebtoken");
const User = require("../models/User");

module.exports = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ message: "Not authorized, no token" });
    }

    const token = authHeader.split(" ")[1];

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const user = await User.findById(decoded.id).select("_id role");

    if (!user) {
      return res.status(401).json({ message: "User not found" });
    }

    /* ✅ THIS IS WHAT YOUR CAR ROUTES NEED */
    req.user = {
      id: user._id,
      role: user.role,
    };

    next();

  } catch (err) {
    console.log("AUTH MIDDLEWARE ERROR:", err.message);
    res.status(401).json({ message: "Invalid token" });
  }
};