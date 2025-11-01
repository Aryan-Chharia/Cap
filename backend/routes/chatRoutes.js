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
} = require("../controllers/chatController");
const upload = require("../middlewares/upload");
const { verifyToken } = require("../middlewares/auth");

const router = express.Router();

router.post("/chat", verifyToken, upload.array("files", 3), chatHandler); // save message + datasets + temp files

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

module.exports = router;
