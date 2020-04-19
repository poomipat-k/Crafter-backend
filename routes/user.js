const express = require("express");

const userControllers = require("../controllers/users-controller");

const router = express.Router();

router.post("/signup", userControllers.signup);

router.post("/login", userControllers.login);

router.get("/activate/:token", userControllers.activateAccount);

module.exports = router;
