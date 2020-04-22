const express = require("express");
const auth = require("../middleware/check-auth");

const cartControllers = require("../controllers/cart-controller");

const router = express.Router();

router.post("/add2cart", auth, cartControllers.add2cart);

router.get("/", auth, cartControllers.getCartItemByUserId);

router.patch("/:cartItemId", auth, cartControllers.updateCartItem);

router.delete("/:cartItemId", auth, cartControllers.deleteCartItem);

router.post("/checkout", auth, cartControllers.checkout);

router.post("/location", auth, cartControllers.addLocation);

router.get("/location", auth, cartControllers.getUserLocation);

module.exports = router;
