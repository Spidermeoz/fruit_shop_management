export type ChatModelGenerateInput = {
  systemPrompt?: string;
  userPrompt: string;
  temperature?: number;
  maxTokens?: number;
};

export type ChatModelGenerateOutput = {
  text: string;
  modelName?: string | null;
  promptTokens?: number | null;
  completionTokens?: number | null;
  latencyMs?: number | null;
  raw?: any;
};

export interface ChatModelService {
  generate(input: ChatModelGenerateInput): Promise<ChatModelGenerateOutput>;
}
