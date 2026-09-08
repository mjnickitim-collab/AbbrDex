import { BlogPost, Term } from "../types";

// Static mapping of specific popular acronyms to their dedicated in-depth editorial articles
const DIRECT_TERM_SLUG_MAP: Record<string, string> = {
  WTA: "wta-what-does-wta-stand-for-in-sports-slang-and-business",
  MMA: "mma-the-evolution-science-and-global-impact-of-mixed-martial-arts",
  "JUNK BOND": "junk-bond-high-yield-debt-investing-risk-vs-reward-market-dynamics",
  "BLUE CHIP": "blue-chip-definitive-guide-to-blue-chip-stocks-companies-long-term-wealth-building",
  CONS: "abbreviation-for-consumer-the-ultimate-business-financial-and-legal-shorthand-guide",
  CSMR: "abbreviation-for-consumer-the-ultimate-business-financial-and-legal-shorthand-guide",
  FIFA: "fifa-the-ultimate-guide-to-soccers-global-governing-body-and-gaming-icon",
  VAR: "world-cup-abbreviations-the-ultimate-guide-to-fifa-codes-match-statistics-and-tournament-acronyms",
  SAOT: "world-cup-abbreviations-the-ultimate-guide-to-fifa-codes-match-statistics-and-tournament-acronyms",
  GK: "world-cup-abbreviations-the-ultimate-guide-to-fifa-codes-match-statistics-and-tournament-acronyms",
  CDM: "world-cup-abbreviations-the-ultimate-guide-to-fifa-codes-match-statistics-and-tournament-acronyms",
  AET: "world-cup-abbreviations-the-ultimate-guide-to-fifa-codes-match-statistics-and-tournament-acronyms",
  QQ: "qq-meaning-gaming-slang-origin-and-tencent-messenger-guide",
  RDY: "rdy-meaning-digital-slang-tech-systems-and-operational-readiness-guide",
  SYK: "syk-complete-meaning-origin-and-usage-guide",
  SWAT: "swat-history-tactics-equipment-and-the-evolution-of-tactical-policing",
  DIY: "diy-the-ultimate-guide-to-home-improvement-crafting-and-self-reliance",
  BBS: "bbs-the-complete-history-architecture-and-legacy-of-bulletin-board-systems",
  WYSIWYG: "wysiwyg-the-complete-guide-to-what-you-see-is-what-you-get-editors",
  B2C: "b2c-the-ultimate-guide-to-business-to-consumer-strategies-models-and-future-trends",
  OPEX: "opex-the-ultimate-guide-to-operational-expenditure-and-business-efficiency",
  KYC: "kyc-the-ultimate-guide-to-know-your-customer-compliance",
  DM: "dm-the-ultimate-guide-to-direct-messaging-and-online-communication",
  DPOY: "dpoy-what-it-means-in-sports-social-media-and-everyday-slang",
  DYU: "dyu-what-does-this-texting-slang-mean-and-how-do-you-use-it",
  GOOGL: "googl-the-complete-investor-guide-to-alphabet-class-a-shares",
  GOOG: "googl-the-complete-investor-guide-to-alphabet-class-a-shares",
  AI: "what-does-ai-stands-for-the-definitive-guide-to-artificial-intelligence-and-its-modern-meaning",
  SEO: "search-engine-optimization-the-complete-guide-to-high-ranking-organic-strategy",
  NFC: "contactless-payment-complete-technology-guide-security-future-trends",
  ROI: "used-acronym-the-ultimate-masterclass-guide-to-modern-business-tech-and-texting-abbreviations",
  KPI: "used-acronym-the-ultimate-masterclass-guide-to-modern-business-tech-and-texting-abbreviations",
  SLA: "used-acronym-the-ultimate-masterclass-guide-to-modern-business-tech-and-texting-abbreviations",
  OKR: "used-acronym-the-ultimate-masterclass-guide-to-modern-business-tech-and-texting-abbreviations",
  API: "used-acronym-the-ultimate-masterclass-guide-to-modern-business-tech-and-texting-abbreviations",
  SAAS: "used-acronym-the-ultimate-masterclass-guide-to-modern-business-tech-and-texting-abbreviations",
  LLM: "used-acronym-the-ultimate-masterclass-guide-to-modern-business-tech-and-texting-abbreviations",
  GPU: "used-acronym-the-ultimate-masterclass-guide-to-modern-business-tech-and-texting-abbreviations",
  B2B: "used-acronym-the-ultimate-masterclass-guide-to-modern-business-tech-and-texting-abbreviations",
  VC: "video-call-abbreviation-essential-acronyms-workplace-meaning-professional-usage-guide",
  VTC: "video-call-abbreviation-essential-acronyms-workplace-meaning-professional-usage-guide",
  TLDR: "most-used-acronyms-in-everyday-english-master-modern-communication-with-ease",
  "TL;DR": "most-used-acronyms-in-everyday-english-master-modern-communication-with-ease",
  FOMO: "most-used-acronyms-in-everyday-english-master-modern-communication-with-ease"
};

/**
 * Finds a matching editorial blog article for a given term code or full phrase
 */
export function findRelatedBlogForTerm(term: Term | null | undefined, blogs: BlogPost[]): BlogPost | null {
  if (!term || !blogs || blogs.length === 0) return null;

  const codeUpper = (term.code || "").toUpperCase().trim();
  const directSlug = DIRECT_TERM_SLUG_MAP[codeUpper];

  if (directSlug) {
    const matched = blogs.find(b => b.slug === directSlug || b.id === directSlug);
    if (matched) return matched;
  }

  // Check if blog title or keywords explicitly mention this exact code
  const exactRegex = new RegExp(`\\b${codeUpper}\\b`, "i");
  for (const blog of blogs) {
    if (blog.keywords && exactRegex.test(blog.keywords)) {
      return blog;
    }
    if (blog.title && exactRegex.test(blog.title)) {
      return blog;
    }
  }

  return null;
}
