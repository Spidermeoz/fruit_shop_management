import { BuildChatPromptService } from "./application/chat/services/BuildChatPromptService";
import { GeminiChatModelService } from "./infrastructure/ai/GeminiChatModelService";
import { config } from "dotenv";

config();

async function test() {
  const model = new GeminiChatModelService(
    process.env.GEMINI_API_KEY,
    process.env.GEMINI_MODEL
  );

  const result = await model.generate({
    systemPrompt: prompt.systemPrompt,
    userPrompt: prompt.userPrompt,
    temperature: 0.4,
    maxTokens: 2000
  });

  console.log("\n=== TEXT ===");
  console.log(result.text);
  console.log("\n=== RAW PAYLOAD ===");
  console.log(JSON.stringify(result.raw, null, 2));
}

test();
