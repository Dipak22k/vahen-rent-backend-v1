const multer = require("multer");
const path = require("path");

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    if (file.fieldname === "idImage") {
      cb(null, "uploads/kyc/ids/");
    } else if (file.fieldname === "selfieImage") {
      cb(null, "uploads/kyc/selfies/");
    } else {
      cb(new Error("Invalid field name"), null);
    }
  },

  filename: function (req, file, cb) {
    const uniqueName =
      file.fieldname +
      "_" +
      req.user._id +
      "_" +
      Date.now() +
      path.extname(file.originalname);

    cb(null, uniqueName);
  },
});

const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith("image")) {
    cb(null, true);
  } else {
    cb(new Error("Only image files allowed"), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 },
});

module.exports = upload;