const nodemailer = require("nodemailer");
require("dotenv").config();   // ✅ IMPORTANT

console.log("EMAIL:", process.env.EMAIL);        // ✅ DEBUG
console.log("PASS:", process.env.EMAIL_PASS);    // ✅ DEBUG

const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",     // ✅ better than service: gmail
  port: 465,
  secure: true,
  auth: {
    user: process.env.EMAIL,
    pass: process.env.EMAIL_PASS,
  },
});

module.exports = transporter;