const mongoose = require("mongoose");
const uniqueValidator = require("mongoose-unique-validator");

const Schema = mongoose.Schema;

const userSchema = new Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true, minlength: 6 },
  cart: [{ type: mongoose.Types.ObjectId, required: true, ref: "CartItem" }],
  isAdmin: { type: Boolean, required: true, default: false },
  location: {
    address: { type: String },
    city: { type: String },
    zipcode: { type: String },
    phone: { type: String },
  },
  confirmed: { type: Boolean, required: true, defualt: false },
});

userSchema.plugin(uniqueValidator);

module.exports = mongoose.model("User", userSchema);
