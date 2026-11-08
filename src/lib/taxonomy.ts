// ==============================================================================
// Multi-Dimensional Learning Taxonomy Engine
// Categorizes vocabulary decks into: Exam Type -> Topic -> CEFR Level
// ==============================================================================

import { Deck } from "@/types";

export type ExamType =
  | "all"
  | "ielts"
  | "toeic"
  | "toefl"
  | "sat_gre"
  | "communication"
  | "business"
  | "academic";

export type TopicType =
  | "all"
  | "education"
  | "environment"
  | "technology"
  | "business_work"
  | "society_culture"
  | "health_sports"
  | "travel_leisure"
  | "communication_daily"
  | "arts_media"
  | "general_core";

export type CefrLevel = "all" | "A1_A2" | "B1_B2" | "C1_C2";

export interface ExamMeta {
  id: ExamType;
  label: string;
  shortLabel: string;
  description: string;
  iconName: string;
  badgeClass: string;
  accentColor: string;
}

export interface TopicMeta {
  id: TopicType;
  label: string;
  shortLabel: string;
  iconName: string;
  description: string;
}

export interface LevelMeta {
  id: CefrLevel;
  label: string;
  subLabel: string;
  targetBands: string;
  colorClass: string;
  badgeBg: string;
}

export const EXAM_TYPES: ExamMeta[] = [
  {
    id: "all",
    label: "Tất cả chương trình",
    shortLabel: "Tất cả",
    description: "Toàn bộ kho từ vựng mọi chương trình ôn luyện",
    iconName: "Globe",
    badgeClass: "bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-200",
    accentColor: "slate",
  },
  {
    id: "ielts",
    label: "IELTS Mastery",
    shortLabel: "IELTS",
    description: "34 chủ đề Listening, 33 chủ đề W&S Band 7.0+, Barron's IELTS",
    iconName: "GraduationCap",
    badgeClass: "bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300",
    accentColor: "rose",
  },
  {
    id: "toeic",
    label: "TOEIC Preparation",
    shortLabel: "TOEIC",
    description: "600 từ vựng căn bản 10 chủ đề & TOEIC Comprehensive",
    iconName: "Briefcase",
    badgeClass: "bg-sky-100 text-sky-800 dark:bg-sky-950/60 dark:text-sky-300",
    accentColor: "sky",
  },
  {
    id: "toefl",
    label: "TOEFL iBT",
    shortLabel: "TOEFL",
    description: "900 từ học thuật cốt lõi & kho từ vựng toàn diện TOEFL",
    iconName: "Building2",
    badgeClass: "bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300",
    accentColor: "amber",
  },
  {
    id: "sat_gre",
    label: "SAT / GRE / GMAT",
    shortLabel: "SAT / GRE",
    description: "College Panda, Barron's SAT, Powerscore GRE 700+",
    iconName: "Target",
    badgeClass: "bg-purple-100 text-purple-800 dark:bg-purple-950/60 dark:text-purple-300",
    accentColor: "purple",
  },
  {
    id: "communication",
    label: "Tiếng Anh Giao Tiếp",
    shortLabel: "Giao tiếp",
    description: "Đàm thoại cơ bản, trung cấp & thành ngữ thông dụng (Idioms)",
    iconName: "MessageCircle",
    badgeClass: "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300",
    accentColor: "emerald",
  },
  {
    id: "business",
    label: "Công Sở & Kinh Doanh",
    shortLabel: "Business",
    description: "Tiếng Anh văn phòng, thương mại, tài chính & Silicon Valley",
    iconName: "LineChart",
    badgeClass: "bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300",
    accentColor: "blue",
  },
  {
    id: "academic",
    label: "Học Thuật (AWL/NAWL)",
    shortLabel: "Academic",
    description: "Danh mục từ vựng học thuật nghiên cứu New Academic Word List",
    iconName: "BookOpen",
    badgeClass: "bg-indigo-100 text-indigo-800 dark:bg-indigo-950/60 dark:text-indigo-300",
    accentColor: "indigo",
  },
];

export const TOPICS: TopicMeta[] = [
  {
    id: "all",
    label: "Tất cả chủ đề",
    shortLabel: "Tất cả",
    iconName: "Sparkles",
    description: "Toàn bộ chủ đề",
  },
  {
    id: "education",
    label: "Giáo dục & Học thuật",
    shortLabel: "Giáo dục",
    iconName: "BookOpen",
    description: "Trường đại học, nghiên cứu, môn học, kỹ năng học tập",
  },
  {
    id: "environment",
    label: "Môi trường & Thiên nhiên",
    shortLabel: "Môi trường",
    iconName: "Leaf",
    description: "Biến đổi khí hậu, năng lượng tái tạo, động thực vật",
  },
  {
    id: "technology",
    label: "Khoa học & Công nghệ",
    shortLabel: "Công nghệ",
    iconName: "Cpu",
    description: "Trí tuệ nhân tạo, thiết bị số, khám phá vũ trụ, khoa học",
  },
  {
    id: "business_work",
    label: "Kinh doanh & Việc làm",
    shortLabel: "Việc làm",
    iconName: "Briefcase",
    description: "Công sở, tài chính, tiếp thị, quản trị, ngân hàng",
  },
  {
    id: "society_culture",
    label: "Xã hội, Văn hóa & Luật",
    shortLabel: "Xã hội",
    iconName: "Users",
    description: "Chính phủ, pháp luật, gia đình, dân số, di sản",
  },
  {
    id: "health_sports",
    label: "Sức khỏe & Thể thao",
    shortLabel: "Sức khỏe",
    iconName: "Activity",
    description: "Y tế, dinh dưỡng, lối sống lành mạnh, thể thao",
  },
  {
    id: "travel_leisure",
    label: "Du lịch, Giao thông & Đô thị",
    shortLabel: "Du lịch",
    iconName: "Compass",
    description: "Khách sạn, phương tiện di chuyển, lục địa, thành phố",
  },
  {
    id: "communication_daily",
    label: "Giao tiếp & Đàm thoại",
    shortLabel: "Giao tiếp",
    iconName: "MessagesSquare",
    description: "Thành ngữ (Idioms), phản xạ đàm thoại, từ nối",
  },
  {
    id: "arts_media",
    label: "Nghệ thuật & Truyền thông",
    shortLabel: "Truyền thông",
    iconName: "Film",
    description: "Quảng cáo, âm nhạc, báo chí, thời trang, văn học",
  },
  {
    id: "general_core",
    label: "Tổng hợp & Nền tảng",
    shortLabel: "Tổng hợp",
    iconName: "Layers",
    description: "Từ vựng cốt lõi, ngày tháng, màu sắc, hình học",
  },
];

export const CEFR_LEVELS: LevelMeta[] = [
  {
    id: "all",
    label: "Tất cả trình độ",
    subLabel: "Từ căn bản đến nâng cao",
    targetBands: "Mọi trình độ",
    colorClass: "text-slate-700 dark:text-slate-300",
    badgeBg: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300",
  },
  {
    id: "A1_A2",
    label: "A1 - A2 (Căn bản)",
    subLabel: "Khởi đầu & Đời sống hàng ngày",
    targetBands: "IELTS 1.0 - 4.0 | TOEIC 100 - 350",
    colorClass: "text-emerald-600 dark:text-emerald-400",
    badgeBg: "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300",
  },
  {
    id: "B1_B2",
    label: "B1 - B2 (Trung cấp)",
    subLabel: "Giao tiếp tự tin & Công sở",
    targetBands: "IELTS 4.5 - 6.5 | TOEIC 400 - 750",
    colorClass: "text-blue-600 dark:text-blue-400",
    badgeBg: "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300",
  },
  {
    id: "C1_C2",
    label: "C1 - C2 (Nâng cao)",
    subLabel: "Học thuật, Tranh biện & Du học",
    targetBands: "IELTS 7.0 - 9.0 | TOEIC 800+ | GRE",
    colorClass: "text-purple-600 dark:text-purple-400",
    badgeBg: "bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300",
  },
];

/**
 * Automatically classifies any deck into its (Exam, Topic, Level) taxonomy
 */
export function classifyDeck(deck: Deck): {
  examType: ExamType;
  topic: TopicType;
  level: CefrLevel;
} {
  const id = deck.id.toLowerCase();
  const title = deck.title.toLowerCase();
  const tagsStr = (deck.tags || []).join(" ").toLowerCase();

  // 1. Phân loại Chứng chỉ / Mục đích (Exam Type)
  let examType: ExamType = "ielts";
  if (id.includes("toeic") || title.includes("toeic")) {
    examType = "toeic";
  } else if (id.includes("toefl") || title.includes("toefl")) {
    examType = "toefl";
  } else if (
    id.includes("sat") ||
    id.includes("gre") ||
    title.includes("sat") ||
    title.includes("gre") ||
    title.includes("gmat")
  ) {
    examType = "sat_gre";
  } else if (
    id.includes("comm") ||
    title.includes("giao tiếp") ||
    title.includes("idioms")
  ) {
    examType = "communication";
  } else if (
    id.includes("business") ||
    id.includes("office") ||
    id.includes("silicon") ||
    title.includes("văn phòng") ||
    title.includes("kinh doanh")
  ) {
    examType = "business";
  } else if (
    id.includes("academic") ||
    title.includes("academic") ||
    title.includes("nawl")
  ) {
    examType = "academic";
  }

  // 2. Phân loại Chủ đề (Topic)
  let topic: TopicType = "general_core";
  if (
    title.includes("education") ||
    title.includes("giáo dục") ||
    title.includes("học đại học") ||
    title.includes("môn học") ||
    tagsStr.includes("giáo dục")
  ) {
    topic = "education";
  } else if (
    title.includes("environment") ||
    title.includes("môi trường") ||
    title.includes("climate") ||
    title.includes("animals") ||
    title.includes("weather") ||
    tagsStr.includes("môi trường")
  ) {
    topic = "environment";
  } else if (
    title.includes("tech") ||
    title.includes("công nghệ") ||
    title.includes("science") ||
    title.includes("space") ||
    tagsStr.includes("công nghệ")
  ) {
    topic = "technology";
  } else if (
    title.includes("health") ||
    title.includes("sức khỏe") ||
    title.includes("sport") ||
    tagsStr.includes("sức khỏe")
  ) {
    topic = "health_sports";
  } else if (
    title.includes("work") ||
    title.includes("business") ||
    title.includes("việc làm") ||
    title.includes("kinh doanh") ||
    title.includes("office") ||
    title.includes("marketing") ||
    title.includes("money") ||
    tagsStr.includes("kinh tế") ||
    tagsStr.includes("việc làm")
  ) {
    topic = "business_work";
  } else if (
    title.includes("travel") ||
    title.includes("du lịch") ||
    title.includes("continents") ||
    title.includes("vehicles") ||
    title.includes("city") ||
    title.includes("transport") ||
    tagsStr.includes("du lịch") ||
    tagsStr.includes("đô thị")
  ) {
    topic = "travel_leisure";
  } else if (
    title.includes("art") ||
    title.includes("media") ||
    title.includes("music") ||
    title.includes("advertising") ||
    title.includes("fashion") ||
    title.includes("literature") ||
    tagsStr.includes("nghệ thuật") ||
    tagsStr.includes("truyền thông")
  ) {
    topic = "arts_media";
  } else if (
    title.includes("society") ||
    title.includes("xã hội") ||
    title.includes("family") ||
    title.includes("crime") ||
    title.includes("law") ||
    title.includes("government") ||
    tagsStr.includes("xã hội") ||
    tagsStr.includes("đời sống")
  ) {
    topic = "society_culture";
  } else if (
    title.includes("communication") ||
    title.includes("giao tiếp") ||
    title.includes("idioms") ||
    title.includes("language")
  ) {
    topic = "communication_daily";
  }

  // 3. Phân loại Trình độ (CEFR Level)
  let level: CefrLevel = "B1_B2";
  if (
    id.includes("basic") ||
    title.includes("cơ bản") ||
    title.includes("days") ||
    title.includes("shapes") ||
    title.includes("colors") ||
    title.includes("months")
  ) {
    level = "A1_A2";
  } else if (
    examType === "sat_gre" ||
    title.includes("band 7") ||
    title.includes("700") ||
    title.includes("gre") ||
    id.includes("barron") ||
    tagsStr.includes("band 7.0+")
  ) {
    level = "C1_C2";
  } else if (
    tagsStr.includes("band 7.0+") ||
    title.includes("nâng cao") ||
    examType === "toefl" ||
    examType === "academic"
  ) {
    level = "C1_C2";
  }

  return { examType, topic, level };
}

/**
 * Filter a list of decks based on the 3 taxonomy selections
 */
export function filterDecksByTaxonomy(
  decks: Deck[],
  criteria: {
    examType: ExamType;
    topic: TopicType;
    level: CefrLevel;
    searchQuery?: string;
  }
): Deck[] {
  const query = criteria.searchQuery?.toLowerCase().trim();

  return decks.filter((deck) => {
    const { examType, topic, level } = classifyDeck(deck);

    if (criteria.examType !== "all" && examType !== criteria.examType) {
      return false;
    }
    if (criteria.topic !== "all" && topic !== criteria.topic) {
      return false;
    }
    if (criteria.level !== "all" && level !== criteria.level) {
      return false;
    }

    if (query) {
      const matchTitle = deck.title.toLowerCase().includes(query);
      const matchDesc = deck.description?.toLowerCase().includes(query);
      const matchTags = deck.tags?.some((t) => t.toLowerCase().includes(query));
      if (!matchTitle && !matchDesc && !matchTags) return false;
    }

    return true;
  });
}

/**
 * Calculate card and deck counts for all taxonomy combinations
 */
export function getTaxonomyCounts(decks: Deck[]) {
  const examCounts: Record<string, { decks: number; cards: number }> = {};
  const topicCounts: Record<string, { decks: number; cards: number }> = {};
  const levelCounts: Record<string, { decks: number; cards: number }> = {};

  decks.forEach((deck) => {
    const { examType, topic, level } = classifyDeck(deck);
    const cards = deck.totalCards || 0;

    // Exam
    if (!examCounts[examType]) examCounts[examType] = { decks: 0, cards: 0 };
    examCounts[examType].decks += 1;
    examCounts[examType].cards += cards;

    // Topic
    if (!topicCounts[topic]) topicCounts[topic] = { decks: 0, cards: 0 };
    topicCounts[topic].decks += 1;
    topicCounts[topic].cards += cards;

    // Level
    if (!levelCounts[level]) levelCounts[level] = { decks: 0, cards: 0 };
    levelCounts[level].decks += 1;
    levelCounts[level].cards += cards;
  });

  return { examCounts, topicCounts, levelCounts };
}
