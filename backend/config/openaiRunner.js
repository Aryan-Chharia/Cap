// // openaiRunner.js
// require("dotenv").config();                  // load .env before anything else
// const colors = require("colors");
// const { chatMain } = require("./open-ai");

// (async () => {
//   // quick sanity-check
//   console.log("🔍 OPENAI_API_KEY =", process.env.OPENAI_API_KEY ? "[loaded]" : "[MISSING]");
//   if (!process.env.OPENAI_API_KEY) {
//     console.error(colors.red("Missing OPENAI_API_KEY. Aborting."));
//     process.exit(1);
//   }

//   try {
//     await chatMain();
//   } catch (err) {
//     console.error(colors.red("Fatal error:"), err);
//   }
// })();


// chatWithAzureRest.js
require("dotenv").config();
const ModelClient = require("@azure-rest/ai-inference").default;
const { isUnexpected } = require("@azure-rest/ai-inference");
const { AzureKeyCredential } = require("@azure/core-auth");
const readlineSync = require("readline-sync");
const colors = require("colors");

const token    = process.env.GITHUB_TOKEN;
const endpoint = process.env.GITHUB_AI_ENDPOINT || "https://models.github.ai/inference";
const model    = process.env.GITHUB_AI_MODEL    || "openai/gpt-4.1";

if (!token) {
  console.error(colors.red("❌ Error: Missing GITHUB_TOKEN in your .env."));
  process.exit(1);
}

async function chatWithBot() {
  console.log(colors.bold.green("🚀 Welcome to the GitHub‑AI Chatbot!"));
  console.log(colors.bold.red('Type "exit" to quit at any time.'));
  const client = ModelClient(endpoint, new AzureKeyCredential(token));

  const chatHistory = [
    { role: "system", content: "You are a helpful assistant." },
  ];

  while (true) {
    const userInput = readlineSync.question(colors.yellow("You: "));
    if (userInput.trim().toLowerCase() === "exit") {
      console.log(colors.bold.blue("👋 Goodbye!"));
      break;
    }
    chatHistory.push({ role: "user", content: userInput });

    try {
      const response = await client
        .path("/chat/completions")
        .post({
          body: {
            model,
            messages: chatHistory,
            temperature: 1,
            top_p: 1,
            max_tokens: 4096,
          },
        });

      if (isUnexpected(response)) {
        throw response.body.error;
      }

      const botResponse = response.body.choices[0].message.content;
      console.log(colors.green("Bot: ") + botResponse);
      chatHistory.push({ role: "assistant", content: botResponse });
    } catch (err) {
      console.error(colors.red("❌ Error:"), err.message || err);
    }
  }
}

(async () => {
  try {
    await chatWithBot();
  } catch (e) {
    console.error(colors.red("Fatal:"), e);
  }
})();
