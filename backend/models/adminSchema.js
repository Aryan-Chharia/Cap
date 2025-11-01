// const mongoose = require("mongoose");

// const adminSchema = new mongoose.Schema(
// 	{
// 		userId: {
// 			type: mongoose.Schema.Types.ObjectId,
// 			ref: "user",
// 			required: true,
// 		},
// 		role: {
// 			type: String,
// 			enum: ["superadmin", "moderator", "analyst"],
// 			default: "moderator",
// 		},
// 		permissions: {
// 			type: [String],
// 			default: [],
// 		},
// 	},
// 	{ timestamps: true }
// );

// const admin = mongoose.models.admin || mongoose.model("admin", adminSchema);
// module.exports = admin;
