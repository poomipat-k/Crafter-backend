const HttpError = require("../models/http-error");
const CartItem = require("../models/cart");
const mongoose = require("mongoose");

const inStock = async (req, res, next) => {
  const { checkoutItems } = req.body;
  if (!checkoutItems) {
    return next(new HttpError("No checkout item", 400));
  }
  const userId = req.userData.userId;
  try {
    const result = await CartItem.find({
      _id: {
        $in: checkoutItems.map((item) => mongoose.Types.ObjectId(item._id)),
      },
      owner: mongoose.Types.ObjectId(userId),
    }).populate("itemId");
    if (result.length !== checkoutItems.length) {
      throw new Error("Could not find one or more cart item.");
    }

    let verifiedItems = [];
    let total = 0;
    result.forEach((cartItem) => {
      const sex = cartItem.variation.sex;
      const size = cartItem.variation.size;
      const quantity = cartItem.quantity;
      if (quantity > cartItem.itemId.stock[sex][size].qty) {
        console.log("Quantity exceed");
        throw new Error("Quantity exceed item in stock");
      }
      const price = cartItem.itemId.stock[sex][size].price;

      verifiedItems.push({
        _id: cartItem._id,
        quantity: quantity,
        price: price,
      });

      total += +(price * quantity).toFixed(2);
    });

    req.checkoutDetails = {
      items: verifiedItems,
      total: total,
    };

    next();
  } catch (err) {
    return next(
      new HttpError("One or more checkout item is out of stock", 400)
    );
  }
};

module.exports = inStock;
