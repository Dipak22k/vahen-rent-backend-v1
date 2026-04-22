const multer = require("multer");
const path = require("path");
const fs = require("fs");

console.log("🔥 KYC MULTER LOADED");

/* ================= CREATE FOLDERS ================= */

const profileDir = path.join(__dirname, "..", "uploads", "profile");
const carDir = path.join(__dirname, "..", "uploads", "cars");
const idDir = path.join(__dirname, "..", "uploads", "kyc", "ids");
const selfieDir = path.join(__dirname, "..", "uploads", "kyc", "selfies");
const chatDir = path.join(__dirname, "..", "uploads", "chat");

// Ensure all folders exist
[profileDir, carDir, idDir, selfieDir,chatDir].forEach((dir) => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

/* ================= STORAGE ================= */

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    let folder;

   if (file.fieldname === "avatar") {
  folder = profileDir;
} else if (file.fieldname === "idImage") {
  folder = idDir;
} else if (file.fieldname === "selfieImage") {
  folder = selfieDir;
} else if (file.fieldname === "chatImage") {
  folder = chatDir; // ✅ NEW
} else {
  folder = carDir;
}

    cb(null, folder);
  },

  filename: (req, file, cb) => {
    const uniqueName =
      Date.now() +
      "-" +
      file.fieldname +
      path.extname(file.originalname);

    cb(null, uniqueName);
  },
});

/* ================= FILE FILTER ================= */

const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith("image")) {
    cb(null, true);
  } else {
    cb(new Error("Only image files allowed"), false);
  }
};

/* ================= EXPORT ================= */

module.exports = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 🔥 increase to 10MB
  },
});