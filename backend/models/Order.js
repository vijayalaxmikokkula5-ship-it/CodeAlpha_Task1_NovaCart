const mongoose = require("mongoose");

const orderItemSchema = new mongoose.Schema({
  productId: { type: mongoose.Schema.Types.ObjectId, ref: "Product", required: true },
  name: String,
  price: Number,
  quantity: Number
}, { _id: false });

const orderSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  items: { type: [orderItemSchema], required: true },
  total: { type: Number, required: true },
  shippingAddress: { type: String, required: true },
  status: { type: String, enum: ["Pending", "Confirmed", "Shipped", "Delivered"], default: "Pending" }
}, { timestamps: true });

module.exports = mongoose.model("Order", orderSchema);
