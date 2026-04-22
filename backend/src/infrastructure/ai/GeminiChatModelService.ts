import type {
  ChatModelGenerateInput,
  ChatModelGenerateOutput,
  ChatModelService,
} from "../../application/chat/services/ChatModelService";

export class GeminiChatModelService implements ChatModelService {
  constructor(
    private apiKey = process.env.GEMINI_API_KEY,
    private model = process.env.GEMINI_MODEL || "gemini-1.5-flash",
    private baseUrl = "https://generativelanguage.googleapis.com/v1beta/models",
  ) {}

  async generate(
    input: ChatModelGenerateInput,
  ): Promise<ChatModelGenerateOutput> {
    if (!this.apiKey) {
      throw new Error("GEMINI_API_KEY is not configured");
    }

    const startedAt = Date.now();

    // Endpoint của Gemini API đưa API key vào query parameter
    const endpoint = `${this.baseUrl}/${this.model}:generateContent?key=${this.apiKey}`;

    // Xây dựng payload theo chuẩn của Gemini
    const body: any = {
      contents: [
        {
          role: "user",
          parts: [{ text: input.userPrompt }],
        },
      ],
      generationConfig: {
        temperature: input.temperature ?? 0.4,
        maxOutputTokens: input.maxTokens ?? 500,
      },
    };

    // Gemini xử lý system prompt riêng biệt trong systemInstruction
    if (input.systemPrompt) {
      body.systemInstruction = {
        parts: [{ text: input.systemPrompt }],
      };
    }

    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Gemini request failed: ${response.status} ${errorText}`);
    }

    const data = await response.json();

    // Trích xuất text từ cấu trúc response của Gemini
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text ?? "";

    return {
      text: String(text).trim(),
      modelName: this.model,
      promptTokens: data?.usageMetadata?.promptTokenCount ?? null,
      completionTokens: data?.usageMetadata?.candidatesTokenCount ?? null,
      latencyMs: Date.now() - startedAt,
      raw: data,
    };
  }
}
