const razorpay = require("../config/razorpay");

exports.createOrder = async (amount) => {
  const options = {
    amount: amount * 100, // convert to paise
    currency: "INR",
    receipt: "receipt_" + Date.now(),
  };

  const order = await razorpay.orders.create(options);
  return order;
};