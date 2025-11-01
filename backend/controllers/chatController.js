/**
 * @file controllers/chatController.js
 * @description Handles per-project chat using GitHub-AI, persisting messages in MongoDB.
 */

require("dotenv").config();
const ModelClient = require("@azure-rest/ai-inference").default;
const { isUnexpected } = require("@azure-rest/ai-inference");
const { AzureKeyCredential } = require("@azure/core-auth");
const Project = require("../models/projectSchema");
const Team = require("../models/teamSchema");
const Chat = require("../models/chatSchema");
const Message = require("../models/messageSchema");

/** GitHub-AI / Azure REST config from .env */
const TOKEN = process.env.GITHUB_TOKEN;
const ENDPOINT = process.env.GITHUB_AI_ENDPOINT;
const MODEL = process.env.GITHUB_AI_MODEL;

/**
 * @function
 * @name chatHandler
 * @description
 *   - Validates the requester belongs to the project’s team (or is team_admin/superadmin)
 *   - Saves the user’s message (text or image)
 *   - Sends it to GitHub-AI only if text exists
 *   - Saves bot reply (text only)
 *   - Returns the bot’s text + confidenceScore (if any)
 */
// async function chatHandler(req, res) {
// 	try {
// 		const { chatId, projectId, content } = req.body;
// 		const imageUrl = req.file?.path || null;

// 		if (!projectId || (!content?.trim() && !imageUrl)) {
// 			return res
// 				.status(400)
// 				.json({
// 					error:
// 						"projectId and at least one of content or imageUrl are required.",
// 				});
// 		}

// 		// 1) Load project + team + members
// 		const project = await Project.findById(projectId).populate({
// 			path: "team",
// 			populate: { path: "members.user", select: "_id role" },
// 		});
// 		if (!project) return res.status(404).json({ error: "Project not found." });

// 		const team = project.team;
// 		const { userId, organization, role: globalRole } = req.user;

// 		// 2) Access validation
// 		if (globalRole !== "superadmin") {
// 			if (team.organization.toString() !== organization.toString()) {
// 				return res.status(403).json({ error: "Not in this organization." });
// 			}
// 			const memberEntry = team.members.find(
// 				(m) => m.user._id.toString() === userId.toString()
// 			);
// 			if (!memberEntry) {
// 				return res.status(403).json({ error: "Not a member of this team." });
// 			}
// 		}

// 		// 3) Get or create chat
// 		let chat = null;
// 		if (chatId) {
// 			chat = await Chat.findOne({ _id: chatId, project: projectId });
// 		} else {
// 			chat = await Chat.findOne({ project: projectId });
// 			if (!chat) {
// 				chat = await Chat.create({ project: projectId, messages: [] });
// 				project.chats.push(chat._id);
// 				await project.save();
// 			}
// 		}
// 		if (!chat) {
// 			return res
// 				.status(404)
// 				.json({ error: "Chat not found or could not be created." });
// 		}

// 		// 4) Save user message
// 		const userMsg = await Message.create({
// 			chat: chat._id,
// 			sender: "user",
// 			content: content?.trim() || null,
// 			imageUrl: imageUrl,
// 		});
// 		chat.messages.push(userMsg._id);
// 		await chat.save();

// 		// 5) AI interaction
// 		if (content?.trim()) {
// 			const client = ModelClient(ENDPOINT, new AzureKeyCredential(TOKEN));
// 			const messagesPayload = [
// 				{ role: "system", content: "You are a helpful assistant." },
// 				{ role: "user", content: content.trim() },
// 			];

// 			const response = await client
// 				.path("/chat/completions")
// 				.post({ body: { model: MODEL, messages: messagesPayload } });

// 			if (isUnexpected(response)) {
// 				throw new Error(response.body.error?.message || "AI error");
// 			}

// 			const botText = response.body.choices[0].message.content;
// 			const confidence =
// 				response.body.choices[0].message.confidenceScore ?? null;

// 			const botMsg = await Message.create({
// 				chat: chat._id,
// 				sender: "chatbot",
// 				content: botText,
// 				confidenceScore: confidence,
// 			});
// 			chat.messages.push(botMsg._id);
// 			await chat.save();

// 			return res.json({ botReply: botText, confidenceScore: confidence });
// 		}

// 		// 6) Image-only message, no AI
// 		return res.json({ success: true, message: "Image-only message saved." });
// 	} catch (err) {
// 		console.error("Chat handler error:", err);
// 		return res.status(500).json({ error: "Internal server error." });
// 	}
// }
// POST /chat
async function chatHandler(req, res) { 
	try {
		let { chatId, projectId, content, selectedDatasets } = req.body;
		const incomingFiles = req.files || [];
		// Reduce chat-time files to lightweight metadata only (don't persist buffers or upload to Cloudinary)
		const tempFiles = incomingFiles.map((f) => ({
			originalname: f.originalname,
			mimetype: f.mimetype,
			size: f.size,
		}));
		// Normalize selectedDatasets from multipart form-data (could be JSON string, single value, or array)
		if (selectedDatasets) {
			if (typeof selectedDatasets === "string") {
				try {
					const parsed = JSON.parse(selectedDatasets);
					if (Array.isArray(parsed)) selectedDatasets = parsed;
					else selectedDatasets = [parsed];
				} catch (_) {
					// Fallback: comma-separated or single id
					selectedDatasets = selectedDatasets.includes(",")
						? selectedDatasets.split(",").map((s) => s.trim()).filter(Boolean)
						: [selectedDatasets];
				}
			}
			if (!Array.isArray(selectedDatasets)) selectedDatasets = [selectedDatasets];
		} else {
			selectedDatasets = [];
		}

		// Allow either content, selectedDatasets, or files to create a message
		if (
			!projectId ||
			(
				!content?.trim() &&
				(tempFiles.length === 0) &&
				!(Array.isArray(selectedDatasets) && selectedDatasets.length > 0)
			)
		) {
			return res.status(400).json({
				error: "projectId and at least one of content, selectedDatasets or files are required.",
			});
		}

		// Load project + team + members
		const project = await Project.findById(projectId).populate({
			path: "team",
			populate: { path: "members.user", select: "_id role" },
		});
		if (!project) return res.status(404).json({ error: "Project not found." });

		const team = project.team;
		const { userId, organization, role: globalRole } = req.user;

		// Access check
		if (globalRole !== "superadmin") {
			if (team.organization.toString() !== organization.toString())
				return res.status(403).json({ error: "Not in this organization." });

			const memberEntry = team.members.find(
				(m) => m.user._id.toString() === userId.toString()
			);
			if (!memberEntry)
				return res.status(403).json({ error: "Not a member of this team." });
		}

		// Get or create chat
		let chat;
		if (chatId) {
			chat = await Chat.findOne({ _id: chatId, project: projectId });
		} else {
			chat = await Chat.create({ project: projectId, title: "New chat", messages: [] });
			project.chats.push(chat._id);
			await project.save();
		}

		// Save user message
		const userMsg = await Message.create({
			chat: chat._id,
			sender: "user",
			content: content?.trim() || null,
			selectedDatasets, // save selected dataset IDs
			tempFiles, // store only metadata for this message
		});
		chat.messages.push(userMsg._id);
		await chat.save();

		return res.json({
			message: "User message saved (datasets selected, files uploaded).",
			chatId: chat._id,
		});
	} catch (err) {
		console.error("Chat handler error:", err);
		return res.status(500).json({ error: "Internal server error." });
	}
}
// POST /chat/ai
async function aiReplyHandler(req, res) {
	try {
		const { chatId, projectId, content } = req.body;
		if (!projectId || !chatId || !content?.trim()) {
			return res
				.status(400)
				.json({ error: "projectId, chatId, and content required." });
		}

		const project = await Project.findById(projectId).populate({
			path: "team",
			populate: { path: "members.user", select: "_id role" },
		});
		if (!project) return res.status(404).json({ error: "Project not found." });

		const chat = await Chat.findById(chatId).populate("messages");
		if (!chat) return res.status(404).json({ error: "Chat not found." });

		const team = project.team;
		const { userId, organization, role: globalRole } = req.user;

		// Access check
		if (globalRole !== "superadmin") {
			if (team.organization.toString() !== organization.toString())
				return res.status(403).json({ error: "Not in this organization." });

			const memberEntry = team.members.find(
				(m) => m.user._id.toString() === userId.toString()
			);
			if (!memberEntry)
				return res.status(403).json({ error: "Not a member of this team." });
		}

		// Get datasets from last user message in this chat
		const lastUserMsg = [...chat.messages]
			.reverse()
			.find((m) => m.sender === "user");
		const selectedDatasets = lastUserMsg?.selectedDatasets || [];
		const tempFiles = lastUserMsg?.tempFiles || [];

		// During chat, even if no datasets/files, proceed to use AI when user sends a message.

		// Normalize dataset ids to strings for comparison with subdoc _id strings
		const selectedDatasetIds = selectedDatasets.map((d) => d?.toString?.() || String(d));

		// Prepare AI payload
		const aiPayload = [
			{ role: "system", content: "You are a helpful assistant." },
			{ role: "user", content: content.trim() },
		];

		// Add dataset info
		if (selectedDatasetIds.length) {
			const datasetsInfo = project.datasets
				.filter((d) => selectedDatasetIds.includes(d._id.toString()))
				.map((d) => `Dataset: ${d.name}, URL: ${d.url}`);
			aiPayload.push({
				role: "system",
				content: `Use these datasets: ${datasetsInfo.join(", ")}`,
			});
		}

		// Add temporary file info (names only)
		if (tempFiles.length > 0) {
			const tempInfo = tempFiles.map((f) => f.originalname).join(", ");
			aiPayload.push({
				role: "system",
				content: `Temporary files: ${tempInfo}`,
			});
		}

		// Call AI
		const client = ModelClient(ENDPOINT, new AzureKeyCredential(TOKEN));
		const response = await client.path("/chat/completions").post({
			body: { model: MODEL, messages: aiPayload },
		});

		if (isUnexpected(response))
			throw new Error(response.body.error?.message || "AI error");

		const botText = response.body.choices[0].message.content;
		const confidence = response.body.choices[0].message.confidenceScore ?? null;

		const botMsg = await Message.create({
			chat: chat._id,
			sender: "chatbot",
			content: botText,
			confidenceScore: confidence,
		});
		chat.messages.push(botMsg._id);
		await chat.save();

		return res.json({ botReply: botText, confidenceScore: confidence });
	} catch (err) {
		console.error("AI Reply Error:", err);
		return res.status(500).json({ error: "Internal server error." });
	}
}

// PATCH /chat/rename
async function renameChat(req, res) {
	try {
		const { chatId, projectId, title } = req.body;
		if (!chatId || !projectId || !title || !title.trim()) {
			return res.status(400).json({ error: "chatId, projectId and title are required." });
		}

		// Load project and verify access (same checks as other handlers)
		const project = await Project.findById(projectId).populate({
			path: "team",
			populate: { path: "members.user", select: "_id role" },
		});
		if (!project) return res.status(404).json({ error: "Project not found." });

		const team = project.team;
		const { userId, organization, role: globalRole } = req.user;
		if (globalRole !== "superadmin") {
			if (team.organization.toString() !== organization.toString()) {
				return res.status(403).json({ error: "Not in this organization." });
			}
			const memberEntry = team.members.find(
				(m) => m.user._id.toString() === userId.toString()
			);
			if (!memberEntry) {
				return res.status(403).json({ error: "Not a member of this team." });
			}
		}

		const updated = await Chat.findOneAndUpdate(
			{ _id: chatId, project: projectId },
			{ title: title.trim() },
			{ new: true }
		);
		if (!updated) return res.status(404).json({ error: "Chat not found." });

		return res.json({ success: true, chat: updated });
	} catch (err) {
		console.error("Rename Chat Error:", err);
		return res.status(500).json({ error: "Internal server error." });
	}
}

/**
 * @function
 * @name getChatHistory
 * @description Returns full chat history for a project
 */
const getChatHistory = async (req, res) => {
	try {
		const { projectId, chatId } = req.params;
		const { userId, organization, role: globalRole } = req.user;

		const project = await Project.findById(projectId).populate({
			path: "team",
			populate: { path: "members.user", select: "_id role" },
		});
		if (!project) return res.status(404).json({ error: "Project not found." });

		const team = project.team;

		if (globalRole !== "superadmin") {
			if (team.organization.toString() !== organization.toString()) {
				return res.status(403).json({ error: "Not in this organization." });
			}
			const memberEntry = team.members.find(
				(m) => m.user._id.toString() === userId.toString()
			);
			if (!memberEntry)
				return res.status(403).json({ error: "Not a member of this team." });
		}

		const chat = await Chat.findOne({
			_id: chatId,
			project: project._id,
		}).populate({
			path: "messages",
			options: { sort: { createdAt: 1 } },
		});
		if (!chat) return res.status(404).json({ error: "Chat not found." });

		return res.json({ chat });
	} catch (err) {
		console.error("Get Chat History Error:", err);
		return res.status(500).json({ error: "Server error." });
	}
};

/**
 * @function
 * @name createChatManually
 * @description Creates a new empty chat for a project (manual endpoint)
 */
const createChatManually = async (req, res) => {
	try {
		const { projectId } = req.body;
		if (!projectId)
			return res.status(400).json({ error: "projectId is required." });

		const project = await Project.findById(projectId);
		if (!project) return res.status(404).json({ error: "Project not found." });

		const newChat = await Chat.create({ project: project._id, title: "New chat", messages: [] });
		project.chats.push(newChat._id);
		await project.save();

		return res
			.status(201)
			.json({ message: "New chat created for project.", chat: newChat });
	} catch (err) {
		console.error("Manual Chat Creation Error:", err);
		return res.status(500).json({ error: "Server error while creating chat." });
	}
};

module.exports = {
	chatHandler,
	aiReplyHandler,
	getChatHistory,
	createChatManually,
	renameChat,
};
