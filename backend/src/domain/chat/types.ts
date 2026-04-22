export type ChatSessionStatus = "active" | "closed" | "archived";
export type ChatChannel = "web" | "mobile" | "admin" | "api";
export type ChatMessageSenderType = "user" | "assistant" | "system";
export type ChatMessageType = "text" | "system" | "recommendation";
export type SourceStatus = "active" | "inactive";
export type HealthRecordStatus = "active" | "inactive";
export type HealthCautionSeverity = "low" | "medium" | "high";

export type ChatIntentKey =
  | "general"
  | "weight_loss"
  | "low_sugar"
  | "juicing"
  | "gifting"
  | "kids"
  | "seniors"
  | "fresh_eating"
  | "energy_boost"
  | "seasonal";

export type ChatSizePreference = "small" | "medium" | "large";

export interface ChatSession {
  id?: number;
  userId?: number | null;
  sessionToken: string;
  channel: ChatChannel;
  status: ChatSessionStatus;
  startedAt?: Date;
  endedAt?: Date | null;
  lastMessageAt?: Date | null;
  metadataJson?: Record<string, any> | null;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface ChatMessage {
  id?: number;
  chatSessionId: number;
  senderType: ChatMessageSenderType;
  messageType: ChatMessageType;
  content: string;
  intent?: string | null;
  extractedFiltersJson?: Record<string, any> | null;
  modelName?: string | null;
  promptTokens?: number | null;
  completionTokens?: number | null;
  latencyMs?: number | null;
  createdAt?: Date;
}

export interface ProductRecommendationLog {
  id?: number;
  chatSessionId: number;
  chatMessageId?: number | null;
  productId: number;
  productVariantId?: number | null;
  rankPosition: number;
  score?: number | null;
  reason?: string | null;
  matchedTagsJson?: string[] | null;
  matchedAttributesJson?: Record<string, any> | null;
  createdAt?: Date;
}

export interface NutritionReferenceSource {
  id?: number;
  code: string;
  name: string;
  sourceType: string;
  homepageUrl?: string | null;
  notes?: string | null;
  status: SourceStatus;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface ProductHealthFact {
  id?: number;
  productId: number;
  sourceId?: number | null;
  factKey: string;
  factValueText?: string | null;
  factValueNumber?: number | null;
  unit?: string | null;
  evidenceNote?: string | null;
  priority?: number;
  status: HealthRecordStatus;
  reviewedById?: number | null;
  reviewedAt?: Date | null;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface ProductHealthCaution {
  id?: number;
  productId: number;
  sourceId?: number | null;
  cautionType: string;
  cautionText: string;
  severity: HealthCautionSeverity;
  status: HealthRecordStatus;
  reviewedById?: number | null;
  reviewedAt?: Date | null;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface ExtractedChatIntent {
  rawText: string;
  normalizedText: string;
  primaryIntent: ChatIntentKey;
  intents: ChatIntentKey[];
  tags: string[];
  keywords: string[];
  audienceKeywords: string[];
  usageKeywords: string[];
  sizePreference?: ChatSizePreference | null;
  requestedPeopleCount?: number | null;
  shouldAskClarifyingQuestion: boolean;
  shouldAvoidMedicalClaims: boolean;
  requiresDisclaimer: boolean;
}

export interface RecommendationFilters {
  searchText?: string;
  tags: string[];
  keywords: string[];
  audienceKeywords: string[];
  usageKeywords: string[];
  sizePreference?: ChatSizePreference | null;
  requestedPeopleCount?: number | null;
  requireInStock: boolean;
  preferredStatuses: string[];
  maxResults: number;
}

export interface ChatProductTagRef {
  id: number;
  name: string;
  slug?: string | null;
  productTagGroupId?: number | null;
  group?: { id: number; name: string; slug?: string | null } | null;
}

export interface ChatProductVariantCandidate {
  id: number;
  productId?: number | null;
  sku?: string | null;
  title?: string | null;
  price: number;
  compareAtPrice?: number | null;
  stock?: number;
  availableStock?: number;
  reservedQuantity?: number;
  status: string;
  sortOrder?: number;
}

export interface ChatProductCandidate {
  id: number;
  title: string;
  slug?: string | null;
  status: string;
  featured?: boolean;
  thumbnail?: string | null;
  description?: string | null;
  shortDescription?: string | null;
  storageGuide?: string | null;
  usageSuggestions?: string | null;
  nutritionNotes?: string | null;
  price?: number | null;
  totalStock?: number;
  averageRating?: number;
  reviewCount?: number;
  origin?: { id: number; name: string; slug?: string | null } | null;
  tags?: ChatProductTagRef[];
  variants?: ChatProductVariantCandidate[];
  healthFacts?: ProductHealthFact[];
  healthCautions?: ProductHealthCaution[];
}

export interface RankedChatRecommendation {
  product: ChatProductCandidate;
  variantId?: number | null;
  score: number;
  reason: string;
  matchedTags: string[];
  matchedAttributes: Record<string, any>;
}

export interface ChatSafetyAssessment {
  isAllowed: boolean;
  category:
    | "ok"
    | "medical_high_risk"
    | "diagnosis"
    | "medication"
    | "pregnancy"
    | "other";
  safeReply?: string;
  requiresDisclaimer: boolean;
  shouldAvoidMedicalClaims: boolean;
}

export interface ChatMessageListFilter {
  limit?: number;
  page?: number;
}
export interface ChatMessageListResult {
  rows: ChatMessage[];
  count: number;
}
export interface ChatSessionDetail {
  session: ChatSession;
  messages: ChatMessage[];
}
export interface RecommendProductsInput {
  userMessage: string;
  extractedIntent: ExtractedChatIntent;
  filters: RecommendationFilters;
}
export interface RecommendProductsOutput {
  filters: RecommendationFilters;
  recommendations: RankedChatRecommendation[];
}
export interface SendChatMessageResult {
  session: ChatSession;
  userMessage: ChatMessage;
  assistantMessage: ChatMessage;
  filters: RecommendationFilters;
  extractedIntent: ExtractedChatIntent;
  recommendations: RankedChatRecommendation[];
  safety: ChatSafetyAssessment;
}
