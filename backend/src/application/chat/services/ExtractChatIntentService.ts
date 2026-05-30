import type {
  ChatIntentKey,
  ChatSizePreference,
  ConversationTurn,
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

/**
 * Stopwords mở rộng — loại bỏ các từ không mang giá trị phân biệt sản phẩm.
 */
const STOPWORDS = new Set([
  // Đại từ / xưng hô
  "toi", "tôi", "ban", "bạn", "minh", "mình", "no", "nó", "ho", "họ",
  "ta", "chung", "chúng",
  // Động từ cầu khiến
  "muon", "muốn", "can", "cần", "tim", "tìm", "giup", "giúp",
  "hay", "hãy", "nhe", "nhé", "xin", "mong",
  // Từ chỉ sản phẩm chung (quá generic)
  "san", "sản", "pham", "phẩm", "loai", "loại", "do", "đồ",
  "hang", "hàng", "mon", "món",
  // Động từ ăn uống chung chung
  "an", "ăn", "uong", "uống", "vao", "vào",
  // Trợ từ / kết từ
  "de", "để", "cho", "va", "và", "the", "thể",
  "co", "có", "khong", "không", "se", "sẽ", "bi", "bị",
  "la", "là", "nao", "nào", "gi", "gì", "nhu", "như",
  "voi", "với", "cua", "của", "tren", "trên", "duoi", "dưới",
  "theo", "tu", "từ", "ra", "len", "lên",
  "khi", "neu", "nếu", "thi", "thì", "ma", "mà",
  // So sánh / mức độ (quá generic, gây false positive)
  "hon", "hơn", "nhat", "nhất", "lam", "làm", "rat", "rất",
  "qua", "quá", "them", "thêm", "nua", "nữa", "lai", "lại",
  "tro", "trở", "nen", "nên", "thanh", "thành",
  // Số lượng / đơn vị chung
  "mot", "một", "cai", "cái",
  // Thời gian
  "hom", "hôm", "nay", "ngay", "ngày", "mai",
  // Câu hỏi / đại từ hỏi (đã có 1 phần)
  "dau", "đâu", "sao",
]);

// ─── Patterns: Phi thực tế / Fantasy ─────────────────────────────────────────
const UNREALISTIC_PATTERNS: RegExp[] = [
  // "biến thành X" hoặc "hóa thành X" — trong context thực phẩm luôn phi thực tế
  /bi[eế]n\s*th[àa]nh\b/i,
  /h[oó]a\s*th[àa]nh\b/i,
  // Siêu năng lực
  /siêu\s*nhân/i,
  /super\s*hero/i,
  /superpower/i,
  /phép\s*màu/i,
  /ma\s*thuật/i,
  /\bmagic\b/i,
  // Nhân vật hư cấu phổ biến
  /son\s*goku|songoku|\bgoku\b/i,
  /\bnaruto\b/i,
  /batman|superman|ironman|spider\s*man/i,
  /doraemon/i,
  /pikachu/i,
  // Trẻ hóa / bất tử cực đoan
  /tr[eẻ]\s*(lại|ra|mãi)\s*\d+/i,
  /trẻ\s*(ra|lại|mãi)\s*(mãi|vĩnh\s*viễn)/i,
  /bất\s*tử/i,
  /sống\s*mãi\s*(không|vĩnh)/i,
  /\bimmortal\b/i,
  /eternal\s*youth/i,
  // Chữa dứt điểm với cam kết tuyệt đối
  /ch[ưữ]a\s*(khỏi|dứt)\s*(hoàn\s*toàn|100%|tuyệt\s*đối)/i,
  /đảm\s*bảo\s*(chữa|trị|khỏi)/i,
  /100%\s*(hiệu\s*quả|tác\s*dụng|chữa)/i,
  // Biến đổi cơ thể không thể
  /mọc\s*(cánh|sừng|đuôi)/i,
  /tàng\s*hình/i,
  /bay\s*(lên|được|như\s*chim)/i,
  // Giảm cân thần kỳ
  /gi[aả]m\s*\d+\s*kg\s*(trong|chỉ)\s*\d+\s*(ngày|giờ|phút)/i,
  // Tăng trưởng không thực tế
  /cao\s*thêm\s*\d+\s*cm/i,
  /thông\s*minh\s*(hơn|ra)/i,

  // ─── Kết quả phi thực tế từ ăn uống (pattern rộng) ───
  // Bắt: "ăn vào sẽ [X]", "uống để [X]", "ăn cho [X]" hoặc đơn giản "ăn vào [X]" với X = kết quả phi thực tế
  /(ăn|uống)\s*(vào\s*)?(sẽ|để|cho|giúp|làm)?\s*.{0,30}(giàu|giỏi|thông minh|đẹp trai|đẹp gái|nổi tiếng|thành công|may mắn|quyền lực|tài giỏi|thiên tài|iq)/i,
  /(ăn|uống)\s*(vào\s*)?(sẽ|để|cho|giúp|làm)?\s*.{0,30}(học giỏi|thi đỗ|đậu đại học|trúng số|trúng thưởng|kiếm tiền|làm giàu)/i,
  /(ăn|uống)\s*(vào\s*)?(sẽ|để|cho|giúp|làm)?\s*.{0,30}(hạnh phúc|vui vẻ|yêu đời|giải thoát|thoát nghèo|phát tài|phát đạt)/i,
  // "trái cây/sản phẩm nào ăn vào sẽ [X]" — broad
  /(trái|quả|sản\s*phẩm|loại)\s*.{0,30}(sẽ|để|cho|giúp|làm)?\s*.{0,30}(giàu|giỏi|thông minh|đẹp trai|nổi tiếng|thành công|may mắn|tài giỏi|học giỏi|thi đỗ|trúng số|kiếm tiền|hạnh phúc)/i,
];

// ─── Patterns: Yêu cầu sản phẩm gây hại ─────────────────────────────────────
/**
 * Bắt câu hỏi tìm sản phẩm có tác dụng tiêu cực / gây hại.
 * Logic: có harmful pattern VÀ KHÔNG có từ phủ định (tránh, không muốn bị...).
 * Ví dụ BẮT: "sản phẩm ăn vào sẽ ung thư", "loại nào gây béo phì"
 * Ví dụ KHÔNG BẮT: "tôi muốn tránh béo phì", "loại không gây đầy bụng"
 */
const HARMFUL_OUTCOME_PATTERNS: RegExp[] = [
  // Tác hại hệ tiêu hoá
  /(t[áa]o\s*b[óo]n|ki[êe]t\s*l[îi][ê]?t|đ[ầa]y\s*b[ụu]ng|kh[óo]\s*ti[êe]u)/i,
  /đ[ầa]y\s*h[ơơ]i|kh[óo]\s*ti[êe]u/i,
  // Bệnh lý nghiêm trọng
  /ung\s*th[ưu]/i,
  /béo\s*phì/i,
  /sỏi\s*(thận|mật|tiết\s*niệu)/i,
  /ngộ\s*độc/i,
  /tử\s*vong/i,
  /chết\s*(người|sớm|yểu)/i,
  // Tác hại chung — phải có verb "gây/làm/khiến" trước để tránh false positive
  /gây\s*(ra\s*)?(hại|độc|bệnh|viêm|đau|tổn|hỏng|béo|ung|sỏi|ngộ)/i,
  /làm\s*(hại|hỏng|tổn|đau|bệnh|béo|ung)/i,
  /khiến\s*(bị\s*)?(bệnh|béo|ung|sỏi|ngộ|độc)/i,
  /phá\s*(hủy|hoại)\s*(sức\s*kh[eẻo]+|gan|thận|dạ\s*dày)/i,
  /có\s*hại\s*(cho|đến|với)\s*(sức\s*kh[eẻo]+|cơ\s*thể)/i,
  /độc\s*(hại|tố|chất)/i,
  // Câu hỏi tìm sản phẩm cụ thể gây hại
  /(loại|quả|trái|sản\s*phẩm)\s*nào\s*(ăn\s*vào\s*)?(sẽ\s*)?(gây|làm|khiến|dẫn\s*đến)\s*(béo|ung|sỏi|ngộ|hại|độc|bệnh)/i,
  /(ăn|uống)\s*(vào\s*)?(sẽ|để|khiến|làm|gây)\s*(bị|ra|thành)\s*(béo|ung|sỏi|ngộ|độc|hại|bệnh)/i,
  /sẽ\s*bị\s*(béo\s*phì|ung\s*th[ưu]|sỏi\s*thận|ngộ\s*độc|tử\s*vong|chết)/i,
  // Tìm thứ "độc"
  /(loại|quả|trái)\s*nào\s*(độc|có\s*độc|nguy\s*hiểm)/i,
];

/** Từ phủ định — nếu có thì câu hỏi là muốn TRÁNH hại, không phải tìm hại */
const HARMFUL_NEGATION_PATTERNS: RegExp[] = [
  /tránh\s*(bị|được|khỏi|không)/i,
  /\bkhông\s*(bị|gây|làm|muốn\s*bị)/i,
  /phòng\s*(tránh|ngừa|chống)/i,
  /giảm\s*(nguy\s*cơ|rủi\s*ro|khả\s*năng\s*bị)/i,
  /hạn\s*chế\s*(nguy\s*cơ|tác\s*hại)/i,
  /để\s*(không|tránh|phòng)/i,
  /\bkhông\s*(ăn\s*)?gây/i,
  /\bít\s*(gây|hại)/i,
  /an\s*toàn\s*(cho|với)/i,
  /\btốt\s*cho/i,
];

const detectHarmfulRequest = (text: string): boolean => {
  // Nếu có từ phủ định → KHÔNG phải harmful (người dùng muốn tránh hại)
  if (HARMFUL_NEGATION_PATTERNS.some((p) => p.test(text))) return false;
  // Kiểm tra có harmful pattern không
  return HARMFUL_OUTCOME_PATTERNS.some((p) => p.test(text));
};

// ─── Patterns: Off-topic ──────────────────────────────────────────────────────
const OFF_TOPIC_PATTERNS: RegExp[] = [
  /th[oờ]i\s*ti[eế]t/i,
  /nhiệt\s*độ\s*ngoài\s*trời/i,
  /d[uự]\s*báo\s*(thời tiết|mưa|nắng)/i,
  /l[aậ]p\s*tr[ìi]nh/i,
  /\bcode\b.*\b(gì|như|bằng)\b/i,
  /\bjavascript\b|\bpython\b|\bjava\b|\bphp\b|\bc\+\+\b/i,
  /tin\s*tức\s*(hôm nay|mới nhất)/i,
  /bầu\s*cử/i,
  /chính\s*tr[ịi]\s*(gia|đảng)/i,
  /đường\s*đi\s*(đến|tới)\s*(bệnh viện|trường|sân bay)/i,
  /xe\s*(buýt|bus)\s*(số|tuyến)/i,
  /khách\s*sạn\s*gần/i,
  /t[yỷ]\s*giá\s*(hối\s*đoái|usd|euro)/i,
  /chứng\s*khoán/i,
  /\bcrypto\b|\bbitcoin\b|\bethereum\b/i,
  /mua\s*(điện\s*thoại|laptop|máy\s*tính|xe\s*máy|ô\s*tô|xe\s*đạp)/i,
  /\b(chatgpt|gemini|openai|claude|gpt)\b/i,
];

// ─── Patterns: Lời chào / chat xã giao ──────────────────────────────────────
/**
 * Bắt các tin nhắn xã giao thuần túy: lời chào, câu hỏi thăm, bày tỏ cảm xúc.
 * Những tin này không phải yêu cầu tư vấn sản phẩm.
 */
const GREETING_PATTERNS: RegExp[] = [
  // ── Chào mở đầu ──
  /^(xin\s*ch[àa]o|ch[àa]o\s*(b[ạa]n|m[ọo]i\s*ng[ưu][ờo]i|shop|anh|ch[ịi]|em)?)[!.\s]*$/i,
  /^(hello+|hi+|hey+|helo+|heya|hiya|howdy|yo+)[!.\s]*$/i,
  /^(good\s*(morning|afternoon|evening|night|day))[!.\s]*$/i,
  /^(ch[àa]o\s*bu[ổo]i\s*(s[áa]ng|chi[ềe]u|t[ốo]i|tr[ưu]a))[!.\s]*$/i,
  /^(xin\s*ch[àa]o\s*(shop|c[ưử]a\s*h[àa]ng|b[ạa]n))[!.\s]*$/i,

  // ── Tạm biệt / kết thúc cuộc trò chuyện ──
  /^(t[ạa]m\s*bi[ệe]t|bye+|goodbye+|good\s*bye|see\s*you|ciao)[!.\s]*$/i,
  /^(h[ẹe]n\s*g[ặa]p\s*(l[ạa]i|b[ạa]n\s*sau|sau))[!.\s]*$/i,
  /^(th[ôo]i\s*(m[ìi]nh|m[ìi])\s*v[ềe]|v[ềe]\s*r[ồo]i|m[ìi]nh\s*v[ềe])[!.\s]*$/i,
  /^(th[ôo]i\s*nh[ée]|th[ôo]i\s*nha|ok\s*nh[ée]|ok\s*nha|v[ậa]y\s*nh[ée]|v[ậa]y\s*nha)[!.\s]*$/i,
  /^(m[ìi]nh\s*(ng[ừu]ng|d[ừu]ng|t[ắa]t)\s*[ởo]\s*[đd][âa]y)[!.\s]*$/i,
  /^(kh[ôo]ng\s*c[ầa]n\s*(n[ữu]a|r[ồo]i)|th[ôo]i\s*c[ũu]ng\s*[đd][ưư][ợo]c)[!.\s]*$/i,

  // ── Hỏi thăm sức khỏe / trạng thái ──
  /^(b[ạa]n\s*kh[ỏo]e\s*kh[ôo]ng|b[ạa]n\s*c[óo]\s*kh[ỏo]e\s*kh[ôo]ng)[?!\s]*$/i,
  /^(kh[ỏo]e\s*kh[ôo]ng|how\s*are\s*you)[?!\s]*$/i,
  /^(b[ạa]n\s*[đd]ang\s*(l[àa]m\s*g[ìi]|[ởo]\s*[đd][âa]u))[?!\s]*$/i,

  // ── Bày tỏ tình cảm / khen ngợi (không liên quan sản phẩm) ──
  /^(t[ôo]i?\s*(y[êe]u|th[ươ][ươ]ng|m[êe]n|qu[yý])\s*(b[ạa]n|shop|c[ưử]a\s*h[àa]ng|anh|ch[ịi]|em|m[ọo]i\s*ng[ưu][ờo]i))[!.\s]*$/i,
  /^(c[ảa]m\s*[ơo]n|c[ảa]m\s*[ơo]n\s*b[ạa]n|thanks?\s*(a\s*lot|so\s*much|you)?|thank\s*u|ty+|camon)[!.\s]*$/i,
  /^(b[ạa]n\s*(gi[ỏo]i|hay|th[ôo]ng\s*minh|d[ễe]\s*th[ươ][ươ]ng|d[ễe]\s*y[êe]u))[!.\s]*$/i,
  /^(b[ạa]n\s*t[ốo]t\s*qu[áa])[!.\s]*$/i,

  // ── Xác nhận / đồng ý (không đặt hàng) ──
  /^(ok+e?|okay|alright|sure|[đd][ưư][ợo]c|r[ồo]i|[ừu]+)[!.\s]*$/i,
  /^(v[âa]ng|d[ạa]|[ừu]+|hi[ểe]u\s*r[ồo]i|r[õo]\s*r[ồo]i|[đd][ưư][ợo]c\s*r[ồo]i)[!.\s]*$/i,
  /^(kh[ôo]ng\s*sao|kh[ôo]ng\s*c[ầa]n|th[ôo]i\s*c[ũu]ng\s*[đd][ưư][ợo]c)[!.\s]*$/i,

  // ── Độc thoại / âm thanh vô nghĩa ──
  /^(hm+|h[ưu]m+|[ừu]m+|hmm+|uhh+|uh+|[ờo]+|[àa]+|[ồo]+|[ée]+)[!.?\s]*$/i,
  /^[!?.\s]+$/,

  // ── Hỏi chatbot là gì ──
  /^(b[ạa]n\s*l[àa]\s*(ai|g[ìi]|c[áa]i\s*g[ìi])|m[àa]y\s*l[àa]\s*(ai|g[ìi]))[?!\s]*$/i,
  /^(b[ạa]n\s*(l[àa]m|c[óo]\s*th[ểe]\s*l[àa]m)\s*g[ìi])[?!\s]*$/i,
  /^(chatbot|tr[ợo]\s*l[ýy])\s*(l[àa]\s*(ai|g[ìi])|n[àa]y)[?!\s]*$/i,

  // ── Chúc mừng / lời chúc ──
  /^(ch[úu]c\s*(m[ừu]ng|b[ạa]n\s*(vui|ng[ủu]|may\s*m[ắa]n)|vui|ng[ủu]\s*ngon))[!.\s]*$/i,
  /^(happy\s*(birthday|new\s*year|holiday))[!.\s]*$/i,
];

/** Bắt các câu chat xã giao / chửi bới / không phải lời chào chuẩn */
const SOCIAL_CHAT_PATTERNS: RegExp[] = [
  // Bày tỏ trạng thái cảm xúc không liên quan
  /^(bored?|ch[áa]n\s*qu[áa]|bu[ồo]n\s*qu[áa]|m[ệe]t\s*qu[áa]|stress\s*qu[áa])[!.?\s]*$/i,
  /^(th[íi]ch\s*chat|mu[ốo]n\s*chat|n[óo]i\s*chuy[ệe]n)[!.?\s]*$/i,
  /^(test|th[ửu]|ki[ểe]m\s*tra|th[ửu]\s*xem)[!.?\s]*$/i,
  /^(haha+|hihi+|hehe+|lol+|huhu+)[!.?\s]*$/i,
  /^(b[àa]i\s*h[áa]t|xem\s*phim|ng[ẹe]\s*nh[ạa]c)[?!\s]*$/i,
  // Từ ngữ tục tĩu / chửi bới thô tục
  /[đd][uụ]|[đd][mM][cs]|[đd][cC][mM]|l[ồo]n|bu[ồo]i|c[ặa]c|v[ãa]i|shit|fuck|ass|wtf/i,
  // Chửi / xúc phạm / gây hấn (không tục nhưng mang tính chửi)
  /\b(ngu|ng[ốo]c|ngu\s*ng[ốo]c|[đd][ầa]n|[đd][ầa]n\s*[đd][ộo]n|ngu\s*si|ngu\s*xu[ẩa]n)\b/i,
  /\b([đd]i[êe]n|kh[ùu]ng|h[âa]m|d[ởo]\s*h[ơo]i|ngu\s*nh[ưu]\s*b[oò]|ngu\s*nh[ưu]\s*ch[oó])\b/i,
  /\b([đd][ồo]\s*ngu|[đd][ồo]\s*ng[ốo]c|[đd][ồo]\s*[đd]i[êe]n|[đd][ồo]\s*kh[ùu]ng|[đd][ồo]\s*h[âa]m)\b/i,
  /\b([đd][ồo]\s*r[áa]c|v[ôo]\s*d[ụu]ng|[đd][ồo]\s*b[ỏo]\s*[đd]i|r[áa]c\s*r[ưư][ởo]i)\b/i,
  /\b(m[àa]y\s*ngu|m[àa]y\s*[đd]i[êe]n|m[àa]y\s*kh[ùu]ng|m[àa]y\s*h[âa]m)\b/i,
  /\b(ch[eế]t\s*[đd]i|bi[ếe]n\s*[đd]i|c[úu]t\s*[đd]i|c[úu]t)\b/i,
  /\b(stupid|idiot|dumb|moron|loser|trash|garbage)\b/i,
];

const FOOD_HEALTH_SIGNALS: RegExp[] = [
  /tr[áa]i\s*c[âa]y|hoa\s*qu[ảa]|fruit/i,
  /ăn|u[ốo]ng|n[ướu][ớu]c\s*[eé]p|sinh\s*t[ốo]/i,
  /vitamin|kho[áa]ng\s*ch[ấa]t|ch[ấa]t\s*x[ơơ]|dinh\s*d[ưư][ỡo]ng/i,
  /s[uứ]c\s*kh[oỏe]+/i,
  /t[áa]o|cam|xo[àa]i|chu[ốo]i|nho|d[ưư]a|[ổo]i|d[ứu]a|thanh\s*long|b[ưu][ởo]i|chanh|m[ăa]ng\s*c[ụu]t|ch[ôo]m\s*ch[ôo]m|v[ảa]i|nh[ãa]n|s[ầa]u\s*ri[êe]ng|me|kh[ếe]|m[ậa]n/i,
  /gi[ảa]m\s*c[âa]n|ăn\s*ki[êe]ng|diet/i,
  /tr[ẻe]\s*em|ng[ưu][ờơ]i\s*gi[àa]|b[eé]/i,
  /bi[êe]u\s*t[ặa]ng|qu[àa]/i,
  /mua|[đd][ặa]t\s*h[àa]ng|\border\b/i,
  /t[ăa]ng\s*c[âa]n|t[ăa]ng\s*n[ăa]ng\s*l[ưư][ợo]ng|gi[ảa]m\s*m[ệa]t/i,
];

// ─── Helpers ──────────────────────────────────────────────────────────────────
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

const detectGreeting = (text: string): boolean =>
  GREETING_PATTERNS.some((p) => p.test(text.trim()));

const detectSocialChat = (text: string): boolean =>
  SOCIAL_CHAT_PATTERNS.some((p) => p.test(text.trim()));

const detectUnrealisticRequest = (text: string): boolean =>
  UNREALISTIC_PATTERNS.some((pattern) => pattern.test(text));

const detectOffTopic = (text: string): boolean => {
  // Bắt rõ ràng các topic off-topic
  if (OFF_TOPIC_PATTERNS.some((pattern) => pattern.test(text))) return true;
  return false;
};

// ─── Patterns: Câu hỏi nối tiếp ngữ cảnh (Follow-up) ─────────────────────────────
/**
 * Bắt các câu hỏi ngắn, ngữ cảnh phụ thuộc vào lượt trước.
 * Ví dụ: "loại nào rẻ hơn?", "đó có vitamin c không", "còn cái nào nữa không"
 */
const CONTEXTUAL_FOLLOWUP_PATTERNS: RegExp[] = [
  // Đại từ thảy thế rõ ràng
  /^(cái|loại|quả|trái|sản\s*phẩm|cơi|cách)\s*(nào|kia|này|[0-9]+|trước|sau|vừa\s*rồi|bạn\s*vừa|mình\s*vừa)/i,
  // Câu hỏi hỏi thêm về sản phẩm trong kết quả trước
  /^(cái|loại|quả|sản\s*phẩm)\s*(số|thứ)\s*[0-9]+/i,
  // Hỏi tiếp về giá
  /^(giá|bao\s*(nhiêu|tiền|ngàn)|mấy\s*(tiền|ngàn|trăm|thọi))[?\s]*$/i,
  // Hỏi so sánh với lượt trước
  /(rẻ|mắc|tốt|ngon|ngon\s*hơn|rẻ\s*hơn|mua\s*được\s*không)\s*[?]?$/i,
  // Còn, thêm, khác
  /^(còn|thêm|khác|nữa|nào|gì)\s+(nữa|khác|không)[?\s]*$/i,
  // "Đó có X không" hay "cái đó X không"
  /^(đó|cái\s*đó|cái\s*kia|loại\s*đó|sản\s*phẩm\s*đó)\s+/i,
  // "Cái [tên sản phẩm] có X không" — mắ chẩm dứt phủ thuộc
  /(vitamin|chất\s*(xơ|đạm|béo|khoáng)|cơ|nước|calo|dinh\s*dưỡng)\s*(có|không|bao\s*nhiêu)[?\s]*$/i,
  // Mua thêm, lấy thêm
  /^(mua|lấy|cho\s*mình|order|thêm)\s+(thêm|cái|loại|quả)?\s*[0-9]*[?\s]*$/i,
  // "Loại nào tốt nhất trong mấy loại này"
  /(trong|giữa|với\s*nhau|mấy\s*loại|cả\s*hai|cả\s*ba|hai\s*loại|ba\s*loại)/i,
  // "Mua cái nào thì ngon hơn"
  /cái\s*nào\s+(thì\s+)?(ngon|tốt|phù\s*hợp|nên|nên\s*mua|hơn)/i,
];

/**
 * Trích xuất keywords có nghĩa từ lịch sử hội thoại:
 * Chỉ lấy từ user messages, loai bỏ stopwords.
 */
const extractContextKeywords = (
  history: ConversationTurn[],
): string[] => {
  const userMessages = history
    .filter((turn) => turn.role === "user")
    .map((turn) => turn.content.toLowerCase())
    .join(" ");

  return userMessages
    .normalize("NFKC")
    .split(/[^\p{L}\p{N}]+/u)
    .map((word) => word.trim())
    .filter((word) => word.length >= 2 && !STOPWORDS.has(word))
    .slice(0, 15);
};

/**
 * Lấy primary intent từ lịch sử hội thoại (câu trả lời gần nhất của assistant có intent)
 */
const extractContextIntent = (
  history: ConversationTurn[],
): ChatIntentKey | null => {
  // Tìm user messages gần nhất có intent cụ thể
  for (let i = history.length - 1; i >= 0; i--) {
    const turn = history[i];
    if (turn.role !== "user") continue;
    const lower = turn.content.toLowerCase();
    for (const { intent, patterns } of INTENT_PATTERNS) {
      if (patterns.some((p) => p.test(lower))) return intent;
    }
  }
  return null;
};

// ─── Main Service ─────────────────────────────────────────────────────────────
export class ExtractChatIntentService {
  execute(
    message: string,
    conversationHistory: ConversationTurn[] = [],
  ): ExtractedChatIntent {
    const normalizedText = String(message ?? "").trim();
    const lower = normalizedText.toLowerCase();

    // ── Phân tích intent từ tin nhắn hiện tại ──────────────────────────────────
    const intents = INTENT_PATTERNS.filter((item) =>
      item.patterns.some((pattern) => pattern.test(lower)),
    ).map((item) => item.intent);

    // ── Trích xuất ngữ cảnh từ lịch sử hội thoại ──────────────────────────────
    const hasHistory = conversationHistory.length > 0;
    const contextKeywords = hasHistory
      ? extractContextKeywords(conversationHistory)
      : [];
    const contextIntent = hasHistory
      ? extractContextIntent(conversationHistory)
      : null;

    // Phát hiện câu hỏi nối tiếp ngữ cảnh
    const isContextualFollowUp =
      hasHistory &&
      intents.length === 0 &&
      CONTEXTUAL_FOLLOWUP_PATTERNS.some((p) => p.test(lower));

    // Nếu là follow-up và không có intent riêng, kế thừa intent từ ngữ cảnh
    const effectiveIntents =
      intents.length > 0
        ? intents
        : isContextualFollowUp && contextIntent
          ? [contextIntent]
          : intents;

    const primaryIntent = effectiveIntents[0] ?? "general";

    // ── Keywords từ tin nhắn hiện tại ──────────────────────────────────────────
    const keywords = lower
      .normalize("NFKC")
      .split(/[^\p{L}\p{N}]+/u)
      .map((word) => word.trim())
      .filter((word) => word.length >= 2 && !STOPWORDS.has(word));

    // Với follow-up, bổ sung context keywords để tăng khả năng tìm kiếm
    const enrichedKeywords = isContextualFollowUp
      ? Array.from(new Set([...keywords, ...contextKeywords])).slice(0, 15)
      : Array.from(new Set(keywords)).slice(0, 12);

    const audienceKeywords = AUDIENCE_KEYWORDS.filter((item) =>
      lower.includes(item),
    );
    const usageKeywords = USAGE_KEYWORDS.filter((item) => lower.includes(item));
    const tags = Array.from(
      new Set([
        ...effectiveIntents,
        ...audienceKeywords,
        ...usageKeywords,
        ...enrichedKeywords,
      ]),
    ).slice(0, 20);

    // ── Safety checks (dựa trên tin nhắn hiện tại, không kế thừa history) ──────
    const isHarmfulRequest = detectHarmfulRequest(lower);
    const isUnrealisticRequest =
      !isHarmfulRequest && detectUnrealisticRequest(lower);
    const isOffTopic =
      !isHarmfulRequest && !isUnrealisticRequest && detectOffTopic(lower);
    const isGreeting =
      !isHarmfulRequest &&
      !isUnrealisticRequest &&
      !isOffTopic &&
      detectGreeting(lower);
    const isSocialChat =
      !isHarmfulRequest &&
      !isUnrealisticRequest &&
      !isOffTopic &&
      !isGreeting &&
      detectSocialChat(lower);

    // Kiểm tra tín hiệu thực phẩm/sức khỏe
    // Follow-up trong ngữ cảnh thực phẩm → cũng xét là có food signal
    const hasFoodHealthSignal =
      FOOD_HEALTH_SIGNALS.some((p) => p.test(lower)) ||
      (isContextualFollowUp &&
        contextKeywords.some((kw) =>
          FOOD_HEALTH_SIGNALS.some((p) => p.test(kw)),
        ));

    return {
      rawText: normalizedText,
      normalizedText,
      primaryIntent,
      intents: effectiveIntents.length ? effectiveIntents : ["general"],
      tags,
      keywords: enrichedKeywords,
      audienceKeywords,
      usageKeywords,
      sizePreference: detectSizePreference(lower),
      requestedPeopleCount: detectPeopleCount(lower),
      shouldAskClarifyingQuestion:
        !isUnrealisticRequest &&
        !isOffTopic &&
        !isHarmfulRequest &&
        !isGreeting &&
        !isSocialChat &&
        !isContextualFollowUp && // Follow-up không cần hỏi thêm
        effectiveIntents.length === 0 &&
        keywords.length < 2,
      shouldAvoidMedicalClaims:
        /(tiểu đường|huyết áp|bệnh|thuốc|mang thai)/i.test(lower),
      requiresDisclaimer: /(tiểu đường|huyết áp|bệnh|mang thai|thuốc)/i.test(
        lower,
      ),
      isUnrealisticRequest,
      isOffTopic,
      isHarmfulRequest,
      isGreeting,
      isSocialChat,
      hasFoodHealthSignal,
      isContextualFollowUp,
      contextKeywords,
    };
  }
}

