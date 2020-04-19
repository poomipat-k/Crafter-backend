const express = require("express");
const designController = require("../controllers/design-controller");

const router = express.Router();

router.get("/polo/1/cotton", designController.getDesignTemplate);

module.exports = router;
