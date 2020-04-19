const jwt = require("jsonwebtoken");

const HttpError = require("../models/http-error");

const auth = (req, res, next) => {
  if (req.method === "OPTIONS") {
    return next();
  }
  try {
    const token = req.headers.authorization.split(" ")[1]; // Authorization: 'Bearer Token'

    if (!token) {
      throw new Error("Must login to proceed!");
    }

    const decodedToken = jwt.verify(token, process.env.JWT_KEY);
    req.userData = {
      userId: decodedToken.userId,
    };
    next();
  } catch (err) {
    const error = new HttpError("Must login to proceed!", 403);
    return next(error);
  }
};

module.exports = auth;
