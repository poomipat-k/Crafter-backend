const express = require("express");
const auth = require("../middleware/check-auth");
const inStock = require("../middleware/check_instock");

const paymentControllers = require("../controllers/payment-controller");

const router = express.Router();

router.post(
  "/paypal/create",
  auth,
  inStock,
  paymentControllers.setupTransaction
);

router.post(
  "/paypal/capture",
  auth,
  inStock,
  paymentControllers.captureTransaction
);

module.exports = router;
