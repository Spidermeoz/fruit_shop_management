import type { ChatSafetyAssessment } from "../../../domain/chat/types";

const HIGH_RISK_PATTERNS: Array<{
  category: ChatSafetyAssessment["category"];
  patterns: RegExp[];
}> = [
  {
    category: "medication",
    patterns: [
      /thu[oố]c/i,
      /u[oố]ng thu[oố]c/i,
      /medication/i,
      /drug/i,
      /toa thu[oố]c/i,
    ],
  },
  { category: "pregnancy", patterns: [/mang thai/i, /b[aà] bầu/i, /pregnan/i] },
  {
    category: "diagnosis",
    patterns: [
      /ch[uẩa]n đo[aá]n/i,
      /điều tr[iị]/i,
      /trị bệnh/i,
      /liều/i,
      /dose/i,
    ],
  },
  {
    category: "medical_high_risk",
    patterns: [
      /tiểu đường/i,
      /huyết áp/i,
      /ung thư/i,
      /suy thận/i,
      /tim mạch/i,
      /bệnh nền/i,
      /diabetes/i,
      /kidney/i,
      /cancer/i,
    ],
  },
];

export class ChatSafetyPolicyService {
  evaluate(message: string): ChatSafetyAssessment {
    const text = String(message ?? "").trim();

    for (const group of HIGH_RISK_PATTERNS) {
      if (group.patterns.some((pattern) => pattern.test(text))) {
        return {
          isAllowed: true,
          category: group.category,
          safeReply:
            "Mình có thể gợi ý sản phẩm ở mức tham khảo dựa trên dữ liệu dinh dưỡng và thông tin sản phẩm hiện có, nhưng không thể thay thế tư vấn y khoa cá nhân hóa. Nếu bạn đang có bệnh lý, đang dùng thuốc hoặc thuộc nhóm đặc biệt như mang thai, bạn nên hỏi bác sĩ hoặc chuyên gia dinh dưỡng trước khi quyết định.",
          requiresDisclaimer: true,
          shouldAvoidMedicalClaims: true,
        };
      }
    }

    return {
      isAllowed: true,
      category: "ok",
      requiresDisclaimer: false,
      shouldAvoidMedicalClaims: false,
    };
  }
}
