const HttpError = require("../models/http-error");
const User = require("../models/user");

const loginAsAdmin = async (req, res, next) => {
  if (req.method === "OPTIONS") {
    return next();
  }

  if (!req.userData) {
    const error = new HttpError("Not logged in", 401);
    return next(error);
  }

  let userId = req.userData.userId;
  let user;
  try {
    user = await User.findById(userId);
  } catch (err) {
    const error = new HttpError("Could not find user, please try again", 500);
    return next(error);
  }

  if (!user) {
    const error = new HttpError("User not found", 404);
    return next(error);
  }

  if (!user.isAdmin) {
    const error = new HttpError("Unauthorized", 401);
    return next(error);
  }

  next();
};

module.exports = loginAsAdmin;
