const mongoose = require("mongoose");

const Schema = mongoose.Schema;

const cartItemSchema = new Schema({
  type: { type: String, required: true },
  postUrl: { type: String, required: true },
  title: { type: String, required: true },
  image: { type: String, required: true },
  variation: {
    sex: { type: String },
    size: { type: String },
    color: { type: String },
  },
  price: { type: Number, required: true },
  quantity: { type: Number, required: true },
  paid: { type: Boolean, default: false, required: true },
  status: { type: Number, required: true, default: 0 },
  itemId: { type: mongoose.Types.ObjectId, required: true, ref: "Shop" },
  owner: { type: mongoose.Types.ObjectId, required: true, ref: "User" },
});

module.exports = mongoose.model("CartItem", cartItemSchema);
