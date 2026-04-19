const paymentService = require("../services/paymentService");

exports.createOrder = async (req, res) => {
  try {
    const { amount } = req.body;

    if (!amount) {
      return res.status(400).json({ message: "Amount is required" });
    }

    const order = await paymentService.createOrder(amount);

    res.status(200).json({
      success: true,
      order,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error creating order",
      error: error.message,
    });
  }
};
const { verifyPayment } = require("../utils/verifySignature");

exports.verifyPayment = (req, res) => {
  const { order_id, payment_id, signature } = req.body;

  const isValid = verifyPayment(order_id, payment_id, signature);

  if (isValid) {
    res.json({
      success: true,
      message: "Payment verified successfully",
    });
  } else {
    res.status(400).json({
      success: false,
      message: "Invalid signature",
    });
  }
};