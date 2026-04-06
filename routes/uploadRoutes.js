const express = require("express");
const router = express.Router();
const multer = require("multer");

/* ================= MULTER STORAGE ================= */

const fs = require("fs");
const path = require("path");

const profileDir = path.join(__dirname, "..", "uploads", "profile");
const carDir = path.join(__dirname, "..", "uploads", "cars");

if (!fs.existsSync(profileDir)) {
  fs.mkdirSync(profileDir, { recursive: true });
}

if (!fs.existsSync(carDir)) {
  fs.mkdirSync(carDir, { recursive: true });
}

const storage = multer.diskStorage({
 destination: (req, file, cb) => {
  const folder =
    req.body.type === "profile" ? profileDir : carDir;
  cb(null, folder);
},
  filename: (req, file, cb) => {
    cb(null, Date.now() + "-" + file.originalname);
  },
});

const upload = multer({ storage });

/* ================= UPLOAD IMAGES ================= */

router.post("/", upload.any(), (req, res) => {
  try {
    const files = req.files || [];

    if (!files.length) {
      return res.status(400).json({ message: "No files uploaded" });
    }

    const baseUrl = "http://10.122.71.15:5000"; // your IP

    const imageUrls = files.map((file) => {
      const folder =
        req.body.type === "profile" ? "profile" : "cars";
      return `/uploads/${folder}/${file.filename}`;
    });

    res.json({ imageUrls });

  } catch (err) {
    console.error("UPLOAD ERROR:", err);
    res.status(500).json({ message: "Upload failed" });
  }
});

module.exports = router;