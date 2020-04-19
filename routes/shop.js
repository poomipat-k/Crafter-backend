const express = require("express");
const fileUpload = require("../middleware/image-upload");
const auth = require("../middleware/check-auth");
const loginAsAdmin = require("../middleware/check-isAdmin");

const shopControllers = require("../controllers/shop-controller");

const router = express.Router();

router.get("/", shopControllers.getItems);

router.get("/categories", shopControllers.getCategories);

router.get("/:category", shopControllers.getItemsByCategory);

router.get("/item/:itemId", shopControllers.getPostById);

router.post(
  "/",
  auth,
  loginAsAdmin,
  fileUpload.array("image", 20),
  shopControllers.createItem
);

router.patch("/:itemId", auth, loginAsAdmin, shopControllers.updateItemById);

router.delete("/:itemId", auth, loginAsAdmin, shopControllers.deleteItemById);

router.delete(
  "/image/:itemId",
  auth,
  loginAsAdmin,
  shopControllers.deleteImageInPost
);

module.exports = router;
