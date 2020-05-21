const HttpError = require("../models/http-error");
const Shop = require("../models/shop");
const User = require("../models/user");

const aws = require("aws-sdk");

function capitalizeFirstLetter(string) {
  return string.trim().charAt(0).toUpperCase() + string.trim().slice(1);
}

const createItem = async (req, res, next) => {
  const {
    type,
    category,
    title,
    description,
    imageIndex,
    price,
    maxPrice,
    stock,
    sold,
    views,
  } = req.body;

  let imagesUrl = req.files.map((image) => {
    return image.location;
  });
  let indexedImagesUrl = imagesUrl;

  let imageIndexArray;
  if (imageIndex) {
    imageIndexArray = imageIndex.split(",").map((index) => +index);
    indexedImagesUrl = imageIndexArray.map((ind) => {
      return imagesUrl[ind];
    });
  }

  let stockObject = {};
  if (stock) {
    stockObject = JSON.parse(stock);
  }

  let newItem = new Shop({
    type,
    categoryUrl: category.trim(),
    categoryName:
      category.trim() === "tshirt"
        ? "T-Shirt"
        : capitalizeFirstLetter(category.trim()),
    title,
    description,
    Images: indexedImagesUrl,
    price,
    maxPrice,
    stock: { ...stockObject },
    sold,
    views,
  });

  try {
    await newItem.save();
  } catch (err) {
    const error = new HttpError("Can not create post, please try again.", 500);
    return next(error);
  }

  res.status(201).json({ item: newItem });
};

const getItems = async (req, res, next) => {
  let items;
  try {
    items = await Shop.find(
      {},
      "categoryUrl title Images price stock sold views id"
    );
  } catch (err) {
    const error = new HttpError(
      "Fetch shop items failed, please try again later.",
      500
    );
    return next(error);
  }

  res.json({
    shopItems: items.map((item) => {
      item.Images = item.Images.shift();
      return item.toObject({ getters: true });
    }),
  });
};

const getCategories = async (req, res, next) => {
  let categories;
  try {
    categories = await Shop.find({}, "categoryUrl categoryName");
  } catch (err) {
    const error = new HttpError(
      "Fetch categories failed, please try again later.",
      500
    );
    return next(error);
  }
  let uniqueUrl = [...new Set(categories.map((doc) => doc.categoryUrl))].sort();
  let uniqueName = [
    ...new Set(categories.map((doc) => doc.categoryName)),
  ].sort();

  if (uniqueName.length !== uniqueUrl.length) {
    const error = new HttpError(
      "Category data incorect, please try again later.",
      500
    );
    return next(error);
  }
  let categoryItems = [];
  for (let i = 0; i < uniqueUrl.length; i++) {
    categoryItems.push({ url: uniqueUrl[i], name: uniqueName[i] });
  }

  res.json({ categories: categoryItems });
};

const getItemsByCategory = async (req, res, next) => {
  const category = req.params.category;
  let items;
  try {
    items = await Shop.find(
      { categoryUrl: category },
      "categoryUrl title Images price stock sold views id"
    );
  } catch (err) {
    const error = new HttpError(
      "Fetch shop items failed, please try again later.",
      500
    );
    return next(error);
  }
  res.json({
    shopItems: items.map((item) => {
      item.Images = item.Images.shift();
      return item.toObject({ getters: true });
    }),
  });
};

const getPostById = async (req, res, next) => {
  const id = req.params.itemId;
  let post = null;
  try {
    post = await Shop.findById(id);
  } catch (err) {
    const error = new HttpError(
      "Fetching post failed, please try again later",
      500
    );
    return next(error);
  }

  if (!post) {
    return next(new HttpError("Cound not find post", 404));
  }

  res.json({
    post: post.toObject({ getters: true }),
  });
};

const updateItemById = async (req, res, next) => {
  const id = req.params.itemId;
  const {
    type,
    categoryUrl,
    categoryName,
    title,
    description,
    price,
    stock,
  } = req.body;
  let item;
  try {
    item = await Shop.findById(id);
  } catch (err) {
    const error = new HttpError(
      "Something went wrong, could not update item",
      500
    );
    return next(error);
  }
  if (Object.keys(item).length === 0) {
    const error = new HttpError("Item not found, please check your data.", 404);
    return next(error);
  }

  item.type = type;
  item.categoryUrl = categoryUrl;
  item.categoryName = categoryName;
  item.title = title;
  item.description = description;
  item.price = price;
  item.stock = stock;

  try {
    await item.save();
  } catch (err) {
    const error = new HttpError(
      "Something went wrong, could not update item",
      500
    );
    return next(error);
  }

  res.status(200).json({ item: item });
};

const REGION = "ap-southeast-1";
const { S3_BUCKET_NAME, S3_ACCESS_KEY, S3_SECRET_KEY } = process.env;
aws.config.update({
  secretAccessKey: S3_SECRET_KEY,
  accessKeyId: S3_ACCESS_KEY,
  region: REGION,
});
const s3 = new aws.S3({ apiVersion: "2006-03-01" });

const deleteItemById = async (req, res, next) => {
  const id = req.params.itemId;

  let item;
  try {
    item = await Shop.findById(id);
  } catch (err) {
    const error = new HttpError(
      "Something went wrong, could not delete item",
      500
    );
    return next(error);
  }

  if (!item) {
    const error = new HttpError("Could not find item for this id.", 404);
    return next(error);
  }
  let images = item.Images;

  await item.remove();

  let imgUrl = images.map((url) => {
    let key = "shop/" + url.split("/").slice(-1);
    return key;
  });
  imgUrl.forEach((key) => {
    let params = {
      Bucket: S3_BUCKET_NAME,
      Key: key,
    };
    s3.deleteObject(params, (err, data) => {
      if (err) {
        console.log(err, err.stack);
      } else {
      }
    });
  });

  res.status(200).json({ success: true });
};

const deleteImageInPost = async (req, res, next) => {
  const id = req.params.itemId;
  const image = req.body.image;
  let item;
  try {
    item = await Shop.findById(id);
  } catch (err) {
    const error = new HttpError(
      "Something went wrong, could not delete the image",
      500
    );
    return next(error);
  }
  if (!item) {
    const error = new HttpError("Could not find post for this id.", 404);
    return next(error);
  }

  if (!item.Images.find((img) => img === image)) {
    const error = new HttpError("Image not exist in post", 404);
    return next(error);
  }

  let newItem;
  try {
    item.Images = item.Images.filter((img) => img !== image);
    newItem = await item.save();
  } catch (err) {
    const error = new HttpError("Could not Delete image.", 500);
    return next(error);
  }

  // Delete image in S3
  let params = {
    Bucket: S3_BUCKET_NAME,
    Key: "shop/" + image.split("/").slice(-1),
  };
  s3.deleteObject(params, (err, data) => {
    if (err) {
      console.log(err, err.stack);
    } else {
    }
  });

  res.json({ success: true });
};

module.exports = {
  createItem,
  getItems,
  getCategories,
  getItemsByCategory,
  getPostById,
  updateItemById,
  deleteItemById,
  deleteImageInPost,
};
