const { validationResult } = require("express-validator");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const nodemailer = require("nodemailer");
const mailTemplate = require("../utils/email_activation_template");

const HttpError = require("../models/http-error");
const User = require("../models/user");

const ADMIN_EMAIL = [
  "k.poomipat@gmail.com",
  "craftorful@gmail.com",
  "kpn95mask@gmail.com",
];

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.GMAIL_USERNAME,
    pass: process.env.GMAIL_PASSWORD,
  },
});

const signup = async (req, res, next) => {

  const { name, email, password } = req.body;
  let existingUser;
  try {
    existingUser = await User.findOne({ email: email });
  } catch (err) {
    const error = new HttpError(
      "Signing up failed, please try again later.",
      500
    );
    return next(error);
  }

  if (existingUser) {
    const error = new HttpError("User exists already.", 422);
    return next(error);
  }

  let hashedPassword;
  try {
    hashedPassword = await bcrypt.hash(password, 12);
  } catch (err) {
    const error = new HttpError(
      "Could not create user, please try again.",
      500
    );
    return next(error);
  }

  // Determine if email match any possible admin email.
  let isAdmin = false;
  for (let adminEmail of ADMIN_EMAIL) {
    if (adminEmail === email) {
      isAdmin = true;
      break;
    }
  }

  const createdUser = new User({
    name,
    email,
    password: hashedPassword,
    isAdmin,
    confirmed: false,
  });

  try {
    await createdUser.save();
  } catch (err) {
    const error = new HttpError(
      "Signing up failed (token can not be created successfully), please try again.",
      500
    );
    return next(error);
  }

  let token;
  try {
    token = jwt.sign(
      { userId: createdUser.id, email: createdUser.email },
      process.env.JWT_KEY,
      { expiresIn: "1d" }
    );
  } catch (err) {
    const error = new HttpError(
      "Signing up failed (data not correct), please try again.",
      500
    );
    return next(error);
  }

  const url = `${process.env.BASE_URL}/api/user/activate/${token}`;

  let mailOptions = {
    from: process.env.GMAIL_USERNAME,
    to: createdUser.email,
    subject: "Craftorful account activation",
    html: mailTemplate.template(url),
  };

  transporter.sendMail(mailOptions, (err, data) => {
    if (err) {
      console.log(err);
    } else {
    }
  });

  res.status(201).json({ success: true });
};

const login = async (req, res, next) => {
  const { email, password } = req.body;

  let existingUser;

  try {
    existingUser = await User.findOne({ email: email });
  } catch (err) {
    const error = new HttpError(
      "Logging in failed, please try again later.",
      500
    );
    return next(error);
  }

  if (!existingUser) {
    const error = new HttpError(
      "Invalid credentials, could not log you in.",
      403
    );
    return next(error);
  }

  let isValidPassword = false;

  try {
    isValidPassword = await bcrypt.compare(password, existingUser.password);
  } catch (err) {
    const error = new HttpError(
      "Could not log you in, please check your credentials and try again.",
      500
    );
    return next(error);
  }

  if (!isValidPassword) {
    const error = new HttpError(
      "Invalid credentials, could not log you in.",
      403
    );
    return next(error);
  }

  if (!existingUser.confirmed) {
    const error = new HttpError(
      "Account not activate. Please activate your account in your email.",
      401
    );
    return next(error);
  }

  let token;
  try {
    token = jwt.sign(
      { userId: existingUser.id, email: existingUser.email },
      process.env.JWT_KEY,
      { expiresIn: "1d" }
    );
  } catch (err) {
    const error = new HttpError(
      "Loging in failed (data not correct), please try again.",
      500
    );
    return next(error);
  }

  res.json({
    userId: existingUser.id,
    email: existingUser.email,
    token: token,
    isAdmin: existingUser.isAdmin,
  });
};

const activateAccount = async (req, res, next) => {
  const { token } = req.params;
  if (req.method === "OPTIONS") {
    console.log("METHOD:", req.method);
    return next();
  }

  if (!token) {
    const error = new HttpError("Token not found", 404);
    return next(error);
  }

  let user;
  try {
    const decodedToken = jwt.verify(token, process.env.JWT_KEY);
    user = await User.findOne({ _id: decodedToken.userId });
  } catch (err) {
    const error = new HttpError(
      "Could not activate account now, please try again later",
      500
    );
    return next(error);
  }

  if (!user) {
    const error = new HttpError("Error: USER NOT FOUND", 404);
    return next(error);
  }
  if (user.confirmed) {
    return res.redirect(process.env.FRONT_END_LOGIN_URL);
  }

  user.confirmed = true;
  try {
    await user.save();
  } catch (err) {
    const error = new HttpError("Activation Failed! ", 500);
    return next(error);
  }
  res.redirect(`${process.env.FRONT_END_LOGIN_URL}?verified=true`);
};

module.exports = {
  signup,
  login,
  activateAccount,
};
