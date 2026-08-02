import { normalizeText } from "./normalize";
import type { InstitutionRecord } from "./types";

export interface QualificationCategory {
  key: string;
  label: string;
  keywords: string[];
}

/** The primary pill row shown directly beneath the hero. */
export const PRIMARY_CATEGORY_KEYS = [
  "computer-science",
  "engineering",
  "business",
  "health-sciences",
  "education",
  "law",
  "arts",
  "hospitality",
] as const;

/**
 * Heuristic keyword sets used to bucket free-text qualification titles into browsable
 * fields of study. This is an editorial grouping for discovery purposes, not the
 * official DHET/SAQA/CESM classification.
 */
export const QUALIFICATION_CATEGORIES: QualificationCategory[] = [
  {
    key: "computer-science",
    label: "Computer Science",
    keywords: [
      "computer science",
      "information technology",
      "information systems",
      "informatics",
      "software",
      "computing",
      "data science",
      "cyber security",
      "programming",
      "computer systems",
    ],
  },
  {
    key: "engineering",
    label: "Engineering",
    keywords: [
      "engineering",
      "mechatronics",
      "civil eng",
      "electrical eng",
      "mechanical eng",
      "industrial eng",
      "chemical eng",
      "beng",
    ],
  },
  {
    key: "business",
    label: "Business",
    keywords: [
      "business",
      "commerce",
      "bcom",
      "management",
      "administration",
      "entrepreneurship",
      "marketing",
      "logistics",
      "supply chain",
      "human resource",
      "accounting",
      "finance",
      "economics",
      "office administration",
      "mba",
    ],
  },
  {
    key: "health-sciences",
    label: "Health Sciences",
    keywords: [
      "health",
      "nursing",
      "medicine",
      "medical",
      "surgery",
      "mbchb",
      "pharmacy",
      "dentistry",
      "physiotherapy",
      "occupational therapy",
      "radiography",
      "emergency medical",
      "biomedical",
      "optometry",
      "dietetics",
      "public health",
    ],
  },
  {
    key: "education",
    label: "Education",
    keywords: [
      "education",
      "teaching",
      "early childhood development",
      " ecd",
      "foundation phase",
      "intermediate phase",
      "senior phase",
    ],
  },
  {
    key: "law",
    label: "Law",
    keywords: ["law", "llb", "legal", "paralegal", "jurisprudence"],
  },
  {
    key: "arts",
    label: "Arts",
    keywords: [
      "arts",
      "design",
      "visual communication",
      "fine art",
      "music",
      "performing arts",
      "drama",
      "film",
      "photography",
      "fashion",
      "creative",
    ],
  },
  {
    key: "hospitality",
    label: "Hospitality",
    keywords: [
      "hospitality",
      "tourism",
      "catering",
      "culinary",
      "events management",
      "travel and tourism",
      "food and beverage",
    ],
  },
  {
    key: "agriculture",
    label: "Agriculture",
    keywords: ["agriculture", "agricultural", "animal production", "horticulture", "viticulture"],
  },
  {
    key: "built-environment",
    label: "Built Environment & Architecture",
    keywords: ["architecture", "built environment", "quantity surveying", "urban planning", "construction"],
  },
  {
    key: "psychology-social",
    label: "Psychology & Social Sciences",
    keywords: ["psychology", "social work", "social science", "counselling", "sociology"],
  },
  {
    key: "media-journalism",
    label: "Media & Journalism",
    keywords: ["journalism", "media studies", "communication", "public relations", "broadcasting"],
  },
  {
    key: "theology",
    label: "Theology & Religious Studies",
    keywords: ["theology", "religious studies", "ministry", "biblical studies"],
  },
  {
    key: "beauty-wellness",
    label: "Beauty & Somatology",
    keywords: ["somatology", "beauty therapy", "cosmetology", "wellness"],
  },
  {
    key: "environmental-science",
    label: "Environmental Science",
    keywords: ["environmental science", "environmental management", "conservation", "sustainability"],
  },
  {
    key: "sport-science",
    label: "Sport Science",
    keywords: ["sport science", "biokinetics", "kinesiology", "sports management"],
  },
  {
    key: "security-safety",
    label: "Security & Safety Management",
    keywords: ["security management", "safety management", "policing", "criminal justice", "occupational health and safety"],
  },
];

const CATEGORY_BY_KEY = new Map(QUALIFICATION_CATEGORIES.map((category) => [category.key, category]));

export function getCategory(key: string): QualificationCategory | undefined {
  return CATEGORY_BY_KEY.get(key);
}

export function countQualificationsInCategory(institution: InstitutionRecord, categoryKey: string): number {
  const category = CATEGORY_BY_KEY.get(categoryKey);
  if (!category) return 0;

  return institution.qualifications.reduce((count, qualification) => {
    const title = normalizeText(qualification.title);
    return category.keywords.some((keyword) => title.includes(normalizeText(keyword))) ? count + 1 : count;
  }, 0);
}

export function institutionMatchesCategory(institution: InstitutionRecord, categoryKey: string): boolean {
  if (categoryKey === "all") return true;
  return countQualificationsInCategory(institution, categoryKey) > 0;
}

export function filterByCategory(institutions: InstitutionRecord[], categoryKey: string): InstitutionRecord[] {
  if (categoryKey === "all") return institutions;
  return institutions.filter((institution) => institutionMatchesCategory(institution, categoryKey));
}
