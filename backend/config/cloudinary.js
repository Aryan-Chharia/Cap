const cloudinary = require("cloudinary").v2;
const { CloudinaryStorage } = require("multer-storage-cloudinary");

cloudinary.config({
	cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
	api_key: process.env.CLOUDINARY_API_KEY,
	api_secret: process.env.CLOUDINARY_API_SECRET,
});

const storage = new CloudinaryStorage({
	cloudinary,
	params: {
		folder: "project-datasets",
		// Accept spreadsheets and CSVs; Cloudinary should treat these as raw files
		allowed_formats: ["csv", "xls", "xlsx"],
		allowedFormats: ["csv", "xls", "xlsx"], // adapter uses camelCase
		resource_type: "raw",
	},
});

module.exports = { cloudinary, storage };
