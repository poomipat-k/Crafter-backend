const paypal = require("@paypal/checkout-server-sdk");
const HttpError = require("../models/http-error");
const CartItem = require("../models/cart");
const ShopItem = require("../models/shop");
const mongoose = require("mongoose");

const payPalClient = require("../config/PaypalConfig");

const setupTransaction = async (req, res, next) => {
  const request = new paypal.orders.OrdersCreateRequest();
  request.prefer("return=representation");

  // Order details
  const totalPrice = req.checkoutDetails.total;
  request.requestBody({
    intent: "CAPTURE",
    purchase_units: [
      {
        amount: {
          currency_code: "THB",
          value: totalPrice,
        },
      },
    ],
  });

  let order;
  try {
    order = await payPalClient.client().execute(request);
  } catch (err) {
    console.error(err);
    return next(new HttpError("Something went wrong on Paypal", 500));
  }

  if (!order) {
    return next(new HttpError("Could not create paypal order.", 500));
  }

  res.status(200).json({
    orderID: order.result.id,
  });
};

const captureTransaction = async (req, res, next) => {
  const { orderID } = req.body;
  const request = new paypal.orders.OrdersCaptureRequest(orderID);
  request.requestBody({});

  let capture;
  try {
    capture = await payPalClient.client().execute(request);
    const captureID = capture.result.purchase_units[0].payments.captures[0].id;

    const cartItems = await CartItem.find({
      _id: {
        $in: req.checkoutDetails.items.map((item) =>
          mongoose.Types.ObjectId(item._id)
        ),
      },
    });

    if (!cartItems) {
      throw new Error("Can not find item.");
    }

    const sess = await mongoose.startSession();
    sess.startTransaction();

    cartItems.forEach(async (item) => {
      // Change paid status of cartItem to true, save it db session
      item.paid = true;
      item.PayPalOrderId = orderID;
      item.PayPalCaptureId = captureID;

      // Update item quantity in shop
      const sex = item.variation.sex;
      const size = item.variation.size;
      const shopItem = await ShopItem.findById(item.itemId);
      shopItem.stock[sex][size].qty -= item.quantity;
      shopItem.sold += item.quantity;

      item.save({ sesion: sess });
      shopItem.save({ sesion: sess });
    });

    // Commit transaction
    await sess.commitTransaction();
  } catch (err) {
    return next(new HttpError("Can not make a payment, please try again", 500));
  }

  res.status(200).json(capture);
};

module.exports = { setupTransaction, captureTransaction };
