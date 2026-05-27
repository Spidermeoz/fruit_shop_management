import { GeminiChatModelService } from "./infrastructure/ai/GeminiChatModelService";
import { config } from "dotenv";

config();

async function test() {
  console.log("Using model:", process.env.GEMINI_MODEL);
  const service = new GeminiChatModelService(
    process.env.GEMINI_API_KEY,
    process.env.GEMINI_MODEL
  );
  
  try {
    const result = await service.generate({
      systemPrompt: "You are a helpful assistant.",
      userPrompt: "Hello, testing 1 2 3.",
    });
    console.log("Success with env model:", result.text);
  } catch (error) {
    console.error("Error with env model:", error.message);
  }
}

test();
