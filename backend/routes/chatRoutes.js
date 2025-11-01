/**
 * @file routes/chatRoutes.js
 * @description Routes for interacting with per-project LLM chatbot.
 */

const express = require("express");
const {
	chatHandler,
	aiReplyHandler,
	getChatHistory,
	createChatManually,
	renameChat,
} = require("../controllers/chatController");
const { chatUpload } = require("../middlewares/upload");
const { verifyToken } = require("../middlewares/auth");

const router = express.Router();

// Wrap upload to return JSON on multer errors and allow many files for chat temp uploads
router.post(
	"/chat",
	verifyToken,
	(req, res, next) => {
		chatUpload.array("files", 100)(req, res, (err) => {
			if (err) {
				const msg = err.message || "Upload failed";
				const invalid = /invalid|unsupported|format|extension/i.test(msg || "");
				const status = Number(err?.http_code) || 400;
				return res.status(status).json({
					error: invalid ? "Unsupported file type. Allowed: csv, xls, xlsx." : msg,
					code: err?.code || undefined,
				});
			}
			next();
		});
	},
	chatHandler
); // save message + datasets + temp files

router.post("/chat/ai", verifyToken, aiReplyHandler); // send text to AI using last message context
/**
 * @route   GET /:projectId/:chatId
 * @desc    Get full chat history for a specific chat in a project
 * @access  Private
 */
router.get("/:projectId/:chatId", verifyToken, getChatHistory);

/**
 * @route   POST /chat/create
 * @desc    Manually create a new empty chat for a project
 * @access  Private
 */
router.post("/chat/create", verifyToken, createChatManually);

// Rename a chat
router.patch("/chat/rename", verifyToken, renameChat);

module.exports = router;
