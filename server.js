const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");

const designRoutes = require("./routes/design");
const shopRoutes = require("./routes/shop");
const cartRoutes = require("./routes/cart");
const userRoutes = require("./routes/user");
const paymentRoutes = require("./routes/payment");
const cors = require("cors");

const HttpError = require("./models/http-error");

const port = process.env.PORT || 5000;

const app = express();
app.use(cors());
app.use(bodyParser.json());

app.use("/api/design", designRoutes);
app.use("/api/shop", shopRoutes);
app.use("/api/cart", cartRoutes);
app.use("/api/user", userRoutes);
app.use("/api/payment", paymentRoutes);

app.use((req, res, next) => {
  const error = new HttpError("Could not find this route", 404);
  throw error;
});

app.use((error, req, res, next) => {
  if (res.headerSent) {
    return next(error);
  }

  res.status(error.code || 500);
  res.json({ message: error.message || "An unknown error occurred!" });
});

mongoose.set("useNewUrlParser", true);
mongoose.set("useUnifiedTopology", true);
mongoose.set("useCreateIndex", true);

mongoose
  .connect(
    `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0-e0wu9.mongodb.net/${process.env.DB_NAME}?retryWrites=true&w=majority`
  )
  .then(() => {
    app.listen(port, () => {
      console.log("SERVER UP ON PORT:", port);
    });
  })
  .catch((err) => {
    console.log(err);
  });
