import type {
  ChatIntentKey,
  ChatSizePreference,
  ExtractedChatIntent,
} from "../../../domain/chat/types";

const INTENT_PATTERNS: Array<{ intent: ChatIntentKey; patterns: RegExp[] }> = [
  {
    intent: "weight_loss",
    patterns: [/giảm cân/i, /ăn kiêng/i, /eat clean/i, /diet/i],
  },
  {
    intent: "low_sugar",
    patterns: [/ít ngọt/i, /ít đường/i, /low sugar/i, /đường huyết/i],
  },
  {
    intent: "juicing",
    patterns: [/ép nước/i, /nước ép/i, /juic/i, /sinh tố/i],
  },
  { intent: "gifting", patterns: [/biếu tặng/i, /quà/i, /tặng/i, /gift/i] },
  {
    intent: "kids",
    patterns: [/trẻ em/i, /bé/i, /con nít/i, /kid/i, /children/i],
  },
  {
    intent: "seniors",
    patterns: [/người lớn tuổi/i, /người già/i, /ông bà/i, /senior/i],
  },
  {
    intent: "fresh_eating",
    patterns: [/ăn trực tiếp/i, /ăn tươi/i, /ăn liền/i],
  },
  {
    intent: "energy_boost",
    patterns: [/tăng năng lượng/i, /nhiều năng lượng/i, /pre workout/i],
  },
  { intent: "seasonal", patterns: [/theo mùa/i, /mùa này/i, /season/i] },
];

const AUDIENCE_KEYWORDS = [
  "trẻ em",
  "bé",
  "người lớn tuổi",
  "ông bà",
  "gia đình",
];
const USAGE_KEYWORDS = [
  "ép nước",
  "ăn trực tiếp",
  "biếu tặng",
  "ăn vặt",
  "sinh tố",
];
const STOPWORDS = new Set([
  "toi",
  "tôi",
  "muon",
  "muốn",
  "tim",
  "tìm",
  "can",
  "cần",
  "loai",
  "loại",
  "giup",
  "giúp",
  "de",
  "để",
  "cho",
  "va",
  "và",
  "the",
  "thể",
  "co",
  "có",
  "khong",
  "không",
]);

const detectSizePreference = (text: string): ChatSizePreference | null => {
  if (/size\s*l|lớn|to|hộp lớn/i.test(text)) return "large";
  if (/size\s*m|vừa|trung bình|medium/i.test(text)) return "medium";
  if (/size\s*s|nhỏ|mini|small/i.test(text)) return "small";
  return null;
};

const detectPeopleCount = (text: string): number | null => {
  const match = text.match(/(\d+)\s*(người|nguoi|ng)/i);
  if (!match) return null;
  const value = Number(match[1]);
  return Number.isFinite(value) && value > 0 ? value : null;
};

export class ExtractChatIntentService {
  execute(message: string): ExtractedChatIntent {
    const normalizedText = String(message ?? "").trim();
    const lower = normalizedText.toLowerCase();

    const intents = INTENT_PATTERNS.filter((item) =>
      item.patterns.some((pattern) => pattern.test(lower)),
    ).map((item) => item.intent);
    const primaryIntent = intents[0] ?? "general";

    const keywords = lower
      .normalize("NFKC")
      .split(/[^\p{L}\p{N}]+/u)
      .map((word) => word.trim())
      .filter((word) => word.length >= 2 && !STOPWORDS.has(word));

    const audienceKeywords = AUDIENCE_KEYWORDS.filter((item) =>
      lower.includes(item),
    );
    const usageKeywords = USAGE_KEYWORDS.filter((item) => lower.includes(item));
    const tags = Array.from(
      new Set([...intents, ...audienceKeywords, ...usageKeywords, ...keywords]),
    ).slice(0, 20);

    return {
      rawText: normalizedText,
      normalizedText,
      primaryIntent,
      intents: intents.length ? intents : ["general"],
      tags,
      keywords: Array.from(new Set(keywords)).slice(0, 12),
      audienceKeywords,
      usageKeywords,
      sizePreference: detectSizePreference(lower),
      requestedPeopleCount: detectPeopleCount(lower),
      shouldAskClarifyingQuestion: intents.length === 0 && keywords.length < 2,
      shouldAvoidMedicalClaims:
        /(tiểu đường|huyết áp|bệnh|thuốc|mang thai)/i.test(lower),
      requiresDisclaimer: /(tiểu đường|huyết áp|bệnh|mang thai|thuốc)/i.test(
        lower,
      ),
    };
  }
}
