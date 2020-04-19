const multer = require("multer");
const multerS3 = require("multer-s3");
const aws = require("aws-sdk");
const { v1: uuidv1 } = require("uuid");

const REGION = "ap-southeast-1";
const { S3_BUCKET_NAME, S3_ACCESS_KEY, S3_SECRET_KEY } = process.env;

const MIME_TYPE_MAP = {
  "image/png": "png",
  "image/jpeg": "jpeg",
  "image/jpg": "jpg",
};

aws.config.update({
  secretAccessKey: S3_SECRET_KEY,
  accessKeyId: S3_ACCESS_KEY,
  region: REGION,
});

const s3 = new aws.S3({ apiVersion: "2006-03-01" });

const storage = multerS3({
  s3: s3,
  bucket: S3_BUCKET_NAME,
  acl: "public-read",
  contentType: multerS3.AUTO_CONTENT_TYPE,
  key: (req, file, cb) => {
    const ext = MIME_TYPE_MAP[file.mimetype];
    const filename = `shop/${uuidv1()}.${ext}`;
    let path = `https://${S3_BUCKET_NAME}.s3-${REGION}.amazonaws.com/${filename}`;
    let url = [];
    url.push(path);
    req.uploadPath = url;
    cb(null, filename);
  },
});

const fileUpload = multer({
  storage,
  limits: {
    fileSize: 819200,
  },
  fileFilter(req, file, cb) {
    const isValid = !!MIME_TYPE_MAP[file.mimetype];
    let error = isValid ? null : new Error("Invalid mime type!");
    cb(error, isValid);
  },
});

module.exports = fileUpload;
