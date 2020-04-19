const mongoose = require("mongoose");

const Schema = mongoose.Schema;

const shopSchema = new Schema({
  type: { type: String, required: true, default: "stock" },
  categoryUrl: { type: String, required: true },
  categoryName: { type: String, required: true },
  title: { type: String, required: true },
  description: { type: String, required: true },
  Images: {
    type: [String],
    validate: {
      validator: (array) => {
        return array.length !== 0;
      },
      message: () => `Need at least one image`,
    },
    required: true,
  },
  price: { type: Number, required: true },
  maxPrice: { type: Number, required: true },
  sold: { type: Number, required: true, default: 0 },
  views: { type: Number, default: 0 },
  stock: {
    male: {
      xs: {
        qty: { type: Number },
        price: { type: Number },
      },
      s: {
        qty: { type: Number },
        price: { type: Number },
      },
      m: {
        qty: { type: Number },
        price: { type: Number },
      },
      l: {
        qty: { type: Number },
        price: { type: Number },
      },
      xl: {
        qty: { type: Number },
        price: { type: Number },
      },
      "2xl": {
        qty: { type: Number },
        price: { type: Number },
      },
      "3xl": {
        qty: { type: Number },
        price: { type: Number },
      },
      "4xl": {
        qty: { type: Number },
        price: { type: Number },
      },
      "5xl": {
        qty: { type: Number },
        price: { type: Number },
      },
      "6xl": {
        qty: { type: Number },
        price: { type: Number },
      },
    },
    female: {
      xs: {
        qty: { type: Number },
        price: { type: Number },
      },
      s: {
        qty: { type: Number },
        price: { type: Number },
      },
      m: {
        qty: { type: Number },
        price: { type: Number },
      },
      l: {
        qty: { type: Number },
        price: { type: Number },
      },
      xl: {
        qty: { type: Number },
        price: { type: Number },
      },
      "2xl": {
        qty: { type: Number },
        price: { type: Number },
      },
      "3xl": {
        qty: { type: Number },
        price: { type: Number },
      },
      "4xl": {
        qty: { type: Number },
        price: { type: Number },
      },
      "5xl": {
        qty: { type: Number },
        price: { type: Number },
      },
      "6xl": {
        qty: { type: Number },
        price: { type: Number },
      },
    },
    unisex: {
      xs: {
        qty: { type: Number },
        price: { type: Number },
      },
      s: {
        qty: { type: Number },
        price: { type: Number },
      },
      m: {
        qty: { type: Number },
        price: { type: Number },
      },
      l: {
        qty: { type: Number },
        price: { type: Number },
      },
      xl: {
        qty: { type: Number },
        price: { type: Number },
      },
      "2xl": {
        qty: { type: Number },
        price: { type: Number },
      },
      "3xl": {
        qty: { type: Number },
        price: { type: Number },
      },
      "4xl": {
        qty: { type: Number },
        price: { type: Number },
      },
      "5xl": {
        qty: { type: Number },
        price: { type: Number },
      },
      "6xl": {
        qty: { type: Number },
        price: { type: Number },
      },
    },
    total: { type: Number, default: 0 },
  },
});

module.exports = mongoose.model("Shop", shopSchema);
