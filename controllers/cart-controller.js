const HttpError = require("../models/http-error");
const CartItem = require("../models/cart");
const ShopItem = require("../models/shop");
const User = require("../models/user");
const mongoose = require("mongoose");

const add2cart = async (req, res, next) => {
  const { variation, quantity, itemId } = req.body;
  let item = null;

  try {
    item = await ShopItem.findById(itemId);
  } catch (err) {
    const error = new HttpError(
      "Fetching item failed, can not find item you want to add to cart. Please try again later",
      500
    );
    return next(error);
  }
  if (!item) {
    return next(new HttpError("Item not found", 404));
  }

  let { type, title, Images } = item;
  let image = Images[0];
  let postUrl = `/shop/post/${title}-id.${itemId}`.replace(/\s/g, "-");
  const paid = false;
  const owner = req.userData.userId;
  let status = 0;
  let price;
  try {
    let quantityInstock = item.stock[variation.sex][variation.size].qty;
    if (quantityInstock > 0 && quantity < quantityInstock) {
      price = item.stock[variation.sex][variation.size].price;
    } else {
      throw new Error();
    }
  } catch (err) {
    const error = new HttpError(
      `Error! one of these occur. 1. Item out of stock or 2. Item is not available or 3. Chosen quantity exceeds the item in stock`,
      500
    );
    return next(error);
  }
  if (!price) {
    return next(new HttpError("Price data not found", 404));
  }

  // find user
  let user;
  try {
    user = await (await User.findById(owner)).populate("cart");
  } catch (err) {
    const error = new HttpError(
      "Add Item to cart failed, please try again.",
      500
    );
    return next(error);
  }

  if (!user) {
    const error = new HttpError("Could not find user for provided id", 404);
    return next(error);
  }

  // Check if the item already exist in the cartItem. Not implement user model at the moment
  let searchedCartItem;
  try {
    // Need to search by owner (user) later
    searchedCartItem = await CartItem.findOne({
      itemId: itemId,
      variation: variation,
      owner: owner,
      paid: false
    });
  } catch (err) {
    const error = new HttpError(
      "Fetching item cart item failed. Please try again later",
      500
    );
    return next(error);
  }

  // Item we want to add not exist in cart
  if (!searchedCartItem) {
    // Create new cart Item
    let newCartItem = new CartItem({
      type,
      postUrl,
      title,
      image,
      variation,
      price,
      quantity,
      paid,
      status,
      itemId: mongoose.Types.ObjectId(itemId),
      owner,
    });

    try {

      const sess = await mongoose.startSession();
      sess.startTransaction();
      await newCartItem.save({ session: sess });
      user.cart.push(newCartItem); // mongoose push method
      await user.save({ session: sess });
      await sess.commitTransaction(); // Commit data to database
    } catch (err) {
      const error = new HttpError(
        "Can not add item to cart, please try again.",
        500
      );
      return next(error);
    }

    res.status(201).json({ cartItem: newCartItem });
  }
  // Item already exist, update the quantity
  else {
    searchedCartItem.quantity = +searchedCartItem.quantity + quantity;
    try {
      await searchedCartItem.save();
    } catch (err) {
      const error = new HttpError(
        "Can not add item to existing cart, please try again.",
        500
      );
      return next(error);
    }

    res.status(200).json({ cartItem: searchedCartItem });
  }
};

const getCartItemByUserId = async (req, res, next) => {
  const userId = req.userData.userId;
  let userWithCartItem;
  try {
    userWithCartItem = await User.findById(userId).populate("cart");
  } catch (err) {
    const error = new HttpError("Could not fetch user data", 500);
    return next(error);
  }

  if (!userWithCartItem) {
    return next(new HttpError("Could not find user for provided id", 404));
  }

  let cartItemQuantity = 0;
  let cartObjects = userWithCartItem.cart.filter(
    (cartItem) => cartItem.toObject({ getters: true }).paid === false
  );

  cartObjects = cartObjects.map((item) => item.toObject({ getters: true }));

  cartObjects.forEach((item) => {
    cartItemQuantity += item.quantity;
  });

  res.json({
    cart: cartObjects,
    quantity: cartItemQuantity,
  });
};

const deleteCartItem = async (req, res, next) => {
  const cartItemId = req.params.cartItemId;
  let cartItem;
  try {
    cartItem = await CartItem.findById(cartItemId).populate("owner");
  } catch (err) {
    const error = new HttpError(
      "Something went wrong, could not delete cart item",
      500
    );
    return next(error);
  }

  if (!cartItem) {
    const error = new HttpError("Could not find cart item for this id", 404);
    return next(error);
  }

  if (cartItem.owner.id !== req.userData.userId) {
    const error = new HttpError(
      "You are not allowed to delete this cart Item",
      401
    );
    return next(error);
  }

  try {
    const sess = await mongoose.startSession();
    sess.startTransaction();
    await cartItem.remove({ session: sess });
    cartItem.owner.cart.pull(cartItem);
    await cartItem.owner.save({ session: sess });
    await sess.commitTransaction();
  } catch (err) {
    const error = new HttpError(
      "Something went wrong, could not delete place",
      500
    );
    return next(error);
  }

  res.status(200).json({ message: "Delete cart item" });
};

const updateCartItem = async (req, res, next) => {
  const userId = req.userData.userId;
  let { quantity } = req.body;
  const cartItemId = req.params.cartItemId;

  if (typeof quantity !== "number") {
    return next(new HttpError("Input must be a number", 400));
  }

  if (quantity % 1 !== 0 || quantity < 1) {
    return next(new HttpError("Input must be positive integer", 400));
  }

  let cartItem;
  try {
    cartItem = await CartItem.findById(cartItemId).populate("itemId");
  } catch (err) {
    const error = new HttpError(
      "Can not find cart item, please try again",
      500
    );
    return next(error);
  }

  if (!cartItem) {
    return next(new HttpError("Cart item not found", 404));
  }

  if (cartItem.owner.toString() !== userId) {
    return next(new HttpError("You can not edit this item", 401));
  }

  if (cartItem.paid) {
    return next(new HttpError("Can not edit paid item", 401));
  }

  const sex = cartItem.variation.sex;
  const size = cartItem.variation.size;
  let inStockQuantity = 0;
  try {
    inStockQuantity = cartItem.itemId.stock[sex][size].qty;
  } catch (err) {}

  if (quantity > inStockQuantity) {
    return next(
      new HttpError(
        `Quantity exceed items in stock (${inStockQuantity} pieces)`
      )
    );
  }

  cartItem.quantity = quantity;

  try {
    await cartItem.save();
  } catch (err) {
    return next(new HttpError("Can not successfully edit this item", 500));
  }

  res.status(200).json({
    cartItem: cartItem,
  });
};

const checkout = async (req, res, next) => {
  const userId = req.userData.userId;
  const { cartItemList } = req.body;
  if (typeof cartItemList !== "object") {
    return next(new HttpError("Checkout items data are not valid", 400));
  }

  const cartItems = [...new Set(cartItemList)];

  if (cartItems.length === 0) {
    return next(
      new HttpError("No item to checkout, please choose at least one", 400)
    );
  }

  try {
    cartItems.forEach((id) => {
      if (typeof id !== "string") {
        throw new Error();
      }
    });
  } catch (err) {
    return next(new HttpError("Cart item data type is note valid", 400));
  }

  let userWithCartItem;
  try {
    userWithCartItem = await User.findById(userId).populate("cart");
  } catch (err) {
    return next(
      new HttpError("Could not fetch user data, please try again", 500)
    );
  }

  if (!userWithCartItem) {
    return next(new HttpError("Could not find user", 404));
  }

  let checkoutItem = [];

  try {
    cartItems.forEach((itemId) => {
      let found = userWithCartItem.cart.find((x) => x.id.toString() === itemId);
      if (!found) {
        throw new Error("Cart item not found");
      }

      if (found.paid) {
        throw new Error("Can not checkout purchased item.");
      }

      checkoutItem.push(found.toObject({ getters: true }));
    });
  } catch (err) {
    return next(new HttpError(err, 400));
  }

  res.json({ items: checkoutItem });
};

const addLocation = async (req, res, next) => {
  const userId = req.userData.userId;
  let user;
  try {
    user = await User.findById(userId, "location");
  } catch (err) {
    const error = new HttpError("Could not fetch user data", 500);
    return next(error);
  }

  if (!user) {
    return next(new HttpError("Could not find user for provided id", 404));
  }

  const { address, city, zipcode, phone } = req.body;

  // User input validation
  if (
    typeof address !== "string" &&
    typeof city !== "string" &&
    typeof zipcode !== "string" &&
    typeof phone !== "string"
  ) {
    return next(new HttpError("Data type is not valild", 400));
  }

  if (!+zipcode || zipcode.length !== 5) {
    return next(new HttpError("Zipcode input is not valid", 400));
  }

  user.location = { address, city, zipcode, phone };
  try {
    await user.save();
  } catch (err) {
    return next(new HttpError("Could not add location to your account", 500));
  }

  res.json({ location: user.location });
};

const getUserLocation = async (req, res, next) => {
  const userId = req.userData.userId;
  let user;
  try {
    user = await User.findById(userId, "location");
  } catch (err) {
    const error = new HttpError("Could not fetch user data", 500);
    return next(error);
  }

  if (!user) {
    return next(new HttpError("Could not find user for provided id", 404));
  }

  res.json({ location: user.location });
};

module.exports = {
  add2cart,
  deleteCartItem,
  getCartItemByUserId,
  updateCartItem,
  checkout,
  addLocation,
  getUserLocation,
};
