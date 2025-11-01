const multer = require("multer");
const path = require("path");
const { datasetStorage } = require("../config/cloudinary");

// Dataset uploads: only csv/xls/xlsx
const dsAllowedExts = ["csv", "xls", "xlsx"];
const dsAllowedMimes = [
  "text/csv",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/octet-stream",
];
const datasetFileFilter = (req, file, cb) => {
  const ext = (path.extname(file.originalname || "").toLowerCase() || "").replace(".", "");
  if (dsAllowedExts.includes(ext) || dsAllowedMimes.includes(file.mimetype)) {
    return cb(null, true);
  }
  return cb(new Error("Unsupported file type. Allowed: csv, xls, xlsx."));
};

// Chat temp uploads: restrict to same dataset types (csv/xls/xlsx)
const chatFileFilter = datasetFileFilter;

const datasetUpload = multer({ storage: datasetStorage, fileFilter: datasetFileFilter, limits: { files: 10 } });
// For chat-time additional datasets, do NOT upload to Cloudinary. Keep in memory and only forward metadata to AI.
const chatUpload = multer({ storage: multer.memoryStorage(), fileFilter: chatFileFilter, limits: { files: 100 } });

module.exports = { datasetUpload, chatUpload };
