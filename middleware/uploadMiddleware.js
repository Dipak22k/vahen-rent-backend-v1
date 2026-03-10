const multer = require("multer");
const path = require("path");
const fs = require("fs");

const dir = "uploads/profile";

if (!fs.existsSync(dir)) {
  fs.mkdirSync(dir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, dir);                    // ⭐ PROFILE FOLDER
  },
  filename: (req, file, cb) => {
    const uniqueName = Date.now() + path.extname(file.originalname);
    cb(null, uniqueName);
  },
});

module.exports = multer({ storage });