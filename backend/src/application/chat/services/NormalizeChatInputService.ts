export class NormalizeChatInputService {
  execute(input: string) {
    const normalized = String(input ?? "")
      .replace(/\r\n?/g, "\n")
      .replace(/\t/g, " ")
      .replace(/[ ]{2,}/g, " ")
      .replace(/\n{3,}/g, "\n\n")
      .trim();

    if (!normalized) {
      throw new Error("Message is required");
    }

    return normalized.slice(0, 2000);
  }
}
