const razorpayInstance = require("../config/razorpay");

exports.createOrder = async (amount) => {
  const options = {
    amount: amount * 100, // 🔥 VERY IMPORTANT (₹ → paise)
    currency: "INR",
    receipt: `receipt_${Date.now()}`,
  };

  const order = await razorpayInstance.orders.create(options);
  return order;
};