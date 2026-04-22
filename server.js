const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const http = require("http");
const { Server } = require("socket.io");
const path = require("path");

const connectDB = require("./config/db");


dotenv.config();
connectDB();

const app = express();

/* ================= MIDDLEWARE ================= */
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

/* ✅ STATIC IMAGE ACCESS */
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

/* ================= ROUTES ================= */

/* AUTH + USER ROUTES */
app.use("/api/auth", require("./routes/userRoutes"));

/* USER FETCH */
app.use("/users", require("./routes/userFetchRoutes"));

/* CARS */
app.use("/cars", require("./routes/carRoutes"));

/* IMAGE UPLOAD */
app.use("/upload", require("./routes/uploadRoutes"));

/* CHAT ROUTES */
app.use("/api/chat", require("./routes/chatRoutes"));

/* KYC ROUTES */

app.use("/api/kyc", require("./kyc/kyc.routes"));

/* OFFERS ROUTE */
app.use("/api/offers", require("./routes/offerRoutes"));

/* TEST ROUTE */

const { loadModels } = require("./utils/faceMatcher");
const paymentRoutes = require("./routes/paymentRoutes");

/* PAYMENT ROUTE */
app.use("/api/payment", paymentRoutes);


(async () => {
  await loadModels();
})();


/* TEST ROUTE */
app.get("/", (req, res) => {
  res.send("Backend is running 🚀");
});



/* ================= SOCKET SERVER ================= */

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});

  app.set("io", io);



/* 🔥 IMPORT YOUR ADVANCED SOCKET LOGIC */
require("./socket/chatSocket")(io);

/* ================= SERVER ================= */

const PORT = process.env.PORT || 5000;

server.listen(PORT, "0.0.0.0", () => {
  console.log(`Server running on port ${PORT}`);
});