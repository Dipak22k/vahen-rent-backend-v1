const multer = require("multer");
const path = require("path");
const fs = require("fs");

/* ================= CREATE FOLDERS ================= */

const profileDir = path.join(__dirname, "..", "uploads", "profile");
const carDir = path.join(__dirname, "..", "uploads", "cars");

// Ensure folders exist
[profileDir, carDir].forEach((dir) => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

/* ================= STORAGE ================= */

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    let folder = carDir; // default

    // ✅ FIX: Route-based detection (reliable)
    if (req.originalUrl.includes("update-avatar")) {
      folder = profileDir;
    }

    cb(null, folder);
  },

  filename: (req, file, cb) => {
    const uniqueName =
      Date.now() +
      "-" +
      file.fieldname +
      path.extname(file.originalname).replace(/\s+/g, "_");

    cb(null, uniqueName);
  },
});

/* ================= FILE FILTER ================= */

const fileFilter = (req, file, cb) => {
  const allowedTypes = /jpg|jpeg|png/;

  const ext = allowedTypes.test(
    path.extname(file.originalname).toLowerCase()
  );

  if (ext) {
    cb(null, true);
  } else {
    cb(new Error("Only JPG, JPEG, PNG images are allowed"));
  }
};

/* ================= EXPORT ================= */

module.exports = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
});