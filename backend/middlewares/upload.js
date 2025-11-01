const multer = require("multer");
const path = require("path");
const { storage } = require("../config/cloudinary");

// Accept only csv/xls/xlsx by extension or common mimetypes
const allowedExts = ["csv", "xls", "xlsx"];
const allowedMimes = [
	"text/csv",
	"application/vnd.ms-excel",
	"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
	"application/octet-stream", // some environments label these generically
];

const fileFilter = (req, file, cb) => {
	const ext = (path.extname(file.originalname || "").toLowerCase() || "").replace(".", "");
	if (allowedExts.includes(ext) || allowedMimes.includes(file.mimetype)) {
		return cb(null, true);
	}
	return cb(new Error("Unsupported file type. Allowed: csv, xls, xlsx."));
};

const upload = multer({ storage, fileFilter, limits: { files: 10 } });

module.exports = upload;
