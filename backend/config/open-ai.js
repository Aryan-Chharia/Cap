const OpenAI = require("openai");
const readlineSync = require("readline-sync");
const colors = require("colors");
require("dotenv").config();
const token = process.env["GITHUB_TOKEN"];

async function chatWithBot(client) {
	console.log(colors.bold.green("Welcome to the Chatbot!"));
	console.log(
		colors.bold.red('You can chat with the bot! (Type "exit" to quit)')
	);
	const chatHistory = [
		{ role: "system", content: "You are a helpful assistant." },
	];
	while (true) {
		const userInput = readlineSync.question(colors.yellow("You: "));
		if (userInput.toLowerCase() === "exit") {
			console.log(colors.bold.blue("Goodbye!"));
			break;
		}
		try {
			chatHistory.push({ role: "user", content: userInput });

			const response = await client.chat.completions.create({
				messages: chatHistory,
				model: "gpt-4o",
				temperature: 1,
				max_tokens: 4096,
				top_p: 1,
			});
			const botResponse = response.choices[0].message.content;
			console.log(colors.green("Bot: ") + botResponse);

			chatHistory.push({ role: "assistant", content: botResponse });
		} catch (error) {
			console.error(colors.red("Error: " + error.message));
		}
	}
}

async function chatMain() {
	if (!token) {
		console.error(
			colors.red(
				"Error: Missing API token. Please set GITHUB_TOKEN in your .env file."
			)
		);
		return;
	}
	const client = new OpenAI({
		baseURL: "https://models.inference.ai.azure.com",
		apiKey: token,
	});

	await chatWithBot(client);
}

module.exports = { chatMain };

// const OpenAI = require("openai");
// require("dotenv").config();

// const token = process.env["OPENAI_API_KEY"];

// if (!token) {
// 	console.error(
// 		"Error: Missing API token. Please set OPENAI_API_KEY in your .env file."
// 	);
// 	process.exit(1);
// }

// const client = new OpenAI({
// 	baseURL: "https://models.inference.ai.azure.com",
// 	apiKey: token,
// });

// const chatWithBot = async (userMessage, chatHistory = []) => {
// 	try {
// 		chatHistory.push({ role: "user", content: userMessage });

// 		const response = await client.chat.completions.create({
// 			messages: chatHistory,
// 			model: "gpt-4o",
// 			temperature: 1,
// 			max_tokens: 4096,
// 			top_p: 1,
// 		});

// 		const botResponse = response.choices[0].message.content;
// 		chatHistory.push({ role: "assistant", content: botResponse });

// 		return { response: botResponse, chatHistory };
// 	} catch (error) {
// 		console.error("Error:", error.message);
// 		return { error: error.message };
// 	}
// };

// module.exports = { chatWithBot };
