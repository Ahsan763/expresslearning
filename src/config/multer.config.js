import fs from "fs";
import path from "path";
import multer from "multer";
import { AppError } from "../utils/app.error.js";

const ensureDir = (dirPath) => {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
};

const createStorage = (folder) => {
  const uploadPath = path.join(process.cwd(), "uploads", folder);
  ensureDir(uploadPath);

  return multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, uploadPath),
    filename: (_req, file, cb) => {
      const uniqueName = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
      cb(null, `${uniqueName}${path.extname(file.originalname)}`);
    },
  });
};

const imageFilter = (_req, file, cb) => {
  if (file.mimetype.startsWith("image/")) {
    cb(null, true);
  } else {
    cb(new AppError("Only image files are allowed.", 400), false);
  }
};

const limits = { fileSize: 1 * 1024 * 1024 }; // 5 MB

export const uploadProductImages = multer({
  storage: createStorage("products"),
  fileFilter: imageFilter,
  limits,
}).array("images", 5);

export const handleMulterError = (err, _req, _res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === "LIMIT_FILE_SIZE") {
      return next(new AppError("Image must be smaller than 5 MB.", 400));
    }
    if (err.code === "LIMIT_FILE_COUNT") {
      return next(new AppError("You can upload up to 5 images per product.", 400));
    }
    return next(new AppError(err.message, 400));
  }
  next(err);
};
