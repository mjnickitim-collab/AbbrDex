export interface CategorySEOInfo {
  id: string;
  seoTitle: string;
  intro: string;
  structureText: string;
  scopeText: string;
  representativeCodes: string[];
  relatedCategories: string[];
}

export const CATEGORY_SEO_DATA: Record<string, CategorySEOInfo> = {
  military: {
    id: "military",
    seoTitle: "Military Acronyms & Tactical Codes Dictionary",
    intro: "A specialized dictionary organizing military acronyms, tactical codes, and radio communication terms widely used across the Army, Navy, Air Force, Marine Corps, and NATO forces.",
    structureText: "Military abbreviations are categorized into four core domains: Tactical, Equipment, Administrative, and Training.",
    scopeText: "Includes essential jargon and radio brevity codes standard across US Armed Forces, NATO allies, and global defense operations.",
    representativeCodes: ["AWOL", "ACFT", "AAR", "APC", "SNAFU", "FUBAR"],
    relatedCategories: ["business", "it_dev", "texting", "internet"]
  },
  business: {
    id: "business",
    seoTitle: "Business, Consumer & Workplace Acronyms Dictionary",
    intro: "A central hub for essential business terms, corporate abbreviations, consumer short forms (CONS, CSMR, B2C, D2C), and workplace jargon commonly found in commerce reports, corporate emails, Slack messages, project proposals, and executive meetings.",
    structureText: "Business terminology is organized into four main operational areas: Consumer & Commerce (B2C, D2C, CONS, CX), Management & Strategy, Finance & Marketing, and Workplace Operations.",
    scopeText: "Provides practical abbreviations and consumer short forms crucial for working in retail e-commerce, global startups, multinational corporations, and modern enterprise environments.",
    representativeCodes: ["CONS", "B2C", "D2C", "CX", "ROI", "KPI", "WFH", "ASAP"],
    relatedCategories: ["finance", "it_dev", "companies", "texting"]
  },
  internet: {
    id: "internet",
    seoTitle: "Internet Chat & Digital Slang Glossary",
    intro: "A comprehensive reference for popular internet abbreviations, online forum shorthand, and digital slang widely used across social networks, online communities, and chat platforms.",
    structureText: "Internet shorthand is classified into four key functional groups: Expressions of Emotion, Status Indicators, Sharing Opinions, and Message Truncations.",
    scopeText: "Covers contemporary cultural contexts and trending online abbreviations from Reddit, X (formerly Twitter), Discord, and online gaming forums.",
    representativeCodes: ["LOL", "BRB", "FYI", "IMO", "TBH", "TL;DR"],
    relatedCategories: ["texting", "social", "emoji", "gaming"]
  },
  texting: {
    id: "texting",
    seoTitle: "Texting & Mobile SMS Shorthand Dictionary",
    intro: "A collection of fast-paced conversational abbreviations and mobile messaging shorthand popular in direct messaging apps, SMS, and group chats.",
    structureText: "Texting acronyms are grouped into four everyday conversation types: Greetings & Check-ins, Plans & Travel, Confirmation & Responses, and Emotional Reactions.",
    scopeText: "Features essential mobile messaging shorthand designed to speed up typing for Gen Z, millennials, and active mobile users.",
    representativeCodes: ["HMU", "IDK", "LMK", "OMW", "JK", "NBD"],
    relatedCategories: ["internet", "social", "emoji", "gaming"]
  },
  social: {
    id: "social",
    seoTitle: "Social Media Slang & Hashtags Encyclopedia",
    intro: "An encyclopedia of trending hashtags, social platform slang, and viral acronyms frequently used on Instagram, TikTok, X (Twitter), and YouTube.",
    structureText: "Social media terminology is divided into four main content pillars: Short-form Video Terms, Popular Hashtags, Viral Trends & Memes, and Direct Messaging (DM).",
    scopeText: "Explains the exact origin, contextual meaning, and usage examples of viral social media trends and global memes.",
    representativeCodes: ["FOMO", "POV", "GOAT", "TBT", "DM", "TL;DR"],
    relatedCategories: ["internet", "texting", "emoji", "sports"]
  },
  gaming: {
    id: "gaming",
    seoTitle: "Gaming Terms & Esports Acronyms Dictionary",
    intro: "A tactical glossary of gaming terminology, esports acronyms, and quick-chat commands used in voice and text channels across multiplayer online games.",
    structureText: "Gaming terms are categorized into four tactical clusters: In-game Commands, Character Classes, Game Modes, and Gamer Etiquette.",
    scopeText: "Covers essential player shorthand used daily in Steam titles, Roblox, League of Legends, Valorant, and competitive gaming tournaments.",
    representativeCodes: ["GG", "AFK", "FPS", "NPC", "OP", "PVP"],
    relatedCategories: ["internet", "it_dev", "texting", "social"]
  },
  emoji: {
    id: "emoji",
    seoTitle: "Emoji Meanings & Modern Symbol Slang Dictionary",
    intro: "An insightful guide explaining double meanings, subtle context, and modern slang nuances behind popular emoji symbols used in messaging and social media.",
    structureText: "Emoji meanings are structured into four emotional categories: Humor & Laughter, Admiration & Praise, Irony & Sarcasm, and Moods & Atmosphere.",
    scopeText: "Decodes modern cultural interpretations of emoji combinations in YouTube comments, TikTok videos, and messaging apps.",
    representativeCodes: ["💀", "😭", "🔥", "🤡", "🧢", "✨"],
    relatedCategories: ["social", "texting", "internet"]
  },
  sports: {
    id: "sports",
    seoTitle: "Sports, Soccer Club & Football Team Abbreviations Dictionary",
    intro: "A dedicated reference hub for sports abbreviations, football club 3-letter codes (Premier League, La Liga, Champions League), World Cup rules (VAR, FT, xG), and international league acronyms.",
    structureText: "Sports and football abbreviations are structured into four core domains: Club & Team Codes (EPL, La Liga, Serie A), Match Status & Rules (VAR, HT, FT, ET), Advanced Analytics (xG, xA, G/A), and Governing Leagues & Tournaments (FIFA, UEFA, NBA, NFL).",
    scopeText: "Provides verified explanations for 3-letter scoreboard abbreviations, player statistics, and broadcast graphics used worldwide across football, basketball, baseball, and combat sports.",
    representativeCodes: ["VAR", "EPL", "ARS", "MCI", "MUN", "CHE", "FCB", "RMA", "xG", "FIFA"],
    relatedCategories: ["countries", "social", "companies", "gaming"]
  },
  companies: {
    id: "companies",
    seoTitle: "Corporate Brands & Company Name Acronyms Directory",
    intro: "A directory explaining company name origins, corporate ticker acronyms, and abbreviated titles of major tech giants, financial institutions, and global brands.",
    structureText: "Corporate brand acronyms are organized into four industry sectors: Big Tech & IT, Automotive & Manufacturing, Financial Services, and Retail & Consumer Goods.",
    scopeText: "Essential brand knowledge for stock market research, corporate analysis, and business news comprehension.",
    representativeCodes: ["FAANG", "IBM", "BMW", "AMD", "LG"],
    relatedCategories: ["business", "finance", "it_dev", "currency"]
  },
  countries: {
    id: "countries",
    seoTitle: "Country Codes & International Terms Glossary",
    intro: "A comprehensive reference for ISO country codes, international organization abbreviations, and diplomatic alliance acronyms.",
    structureText: "Global nation terms are categorized into three international domains: ISO Country Codes, Unions & Alliances, and Global Economic Blocs.",
    scopeText: "Covers international standards used in news reporting, trade documentation, customs processing, and diplomatic relations.",
    representativeCodes: ["USA", "UK", "UAE", "UN", "EU", "NATO"],
    relatedCategories: ["military", "currency", "cities", "business"]
  },
  cities: {
    id: "cities",
    seoTitle: "City & Airport IATA Metropolitan Codes Directory",
    intro: "A directory of major city abbreviations, IATA airport codes, and metropolitan area shorthand used in global travel and logistics.",
    structureText: "Metropolitan terms are grouped into three travel categories: City Shorthand, Airport IATA Codes, and Regional Transit Zones.",
    scopeText: "Essential codes used in flight reservations, air cargo shipping, travel itineraries, and metropolitan navigation.",
    representativeCodes: ["NYC", "LA", "TYO", "PAR", "ICN", "JFK"],
    relatedCategories: ["countries", "currency", "companies"]
  },
  medical: {
    id: "medical",
    seoTitle: "Medical Terms & Clinical Acronyms Glossary",
    intro: "A clinical glossary covering medical terminology, hospital abbreviations, prescription codes, and diagnostic terms used in healthcare.",
    structureText: "Medical abbreviations are grouped into four healthcare pillars: Diagnostics & Testing, Emergency & Trauma, Physiology & Anatomy, and Pharmacology & Prescriptions.",
    scopeText: "Helps patients and healthcare readers understand medical records, laboratory results, and general health articles.",
    representativeCodes: ["CPR", "MRI", "ICU", "DNA", "OTC", "BP"],
    relatedCategories: ["it_dev", "business", "countries"]
  },
  finance: {
    id: "finance",
    seoTitle: "Finance & Crypto Investment Acronyms Glossary",
    intro: "A financial dictionary covering stock market jargon, cryptocurrency abbreviations, asset management acronyms, and economic indicators.",
    structureText: "Financial terms are structured into four market domains: Stocks & Equities, Cryptocurrency & Web3, Asset Management, and Economic Metrics.",
    scopeText: "Provides clear explanations for individual investors, financial news readers, and personal finance enthusiasts.",
    representativeCodes: ["ETF", "IPO", "SEC", "ATH", "FOMO", "HODL"],
    relatedCategories: ["business", "companies", "currency", "it_dev"]
  },
  currency: {
    id: "currency",
    seoTitle: "Global Currency Codes & Forex Symbols Directory",
    intro: "A standardized reference for ISO 4217 currency codes, foreign exchange symbols, and international monetary unit abbreviations.",
    structureText: "Currency shorthand is divided into three financial categories: Fiat Currencies, Cryptocurrencies, and Foreign Exchange (Forex) Terms.",
    scopeText: "Covers international commerce standards used in e-commerce, forex trading, cross-border payments, and global banking.",
    representativeCodes: ["USD", "EUR", "JPY", "KRW", "GBP", "BTC"],
    relatedCategories: ["finance", "countries", "companies", "business"]
  },
  it_dev: {
    id: "it_dev",
    seoTitle: "IT & Software Engineering Acronyms Dictionary",
    intro: "A technical reference for software development terms, cloud infrastructure acronyms, cybersecurity codes, APIs, and DevOps terminology.",
    structureText: "IT terms are structured into four engineering pillars: Web & Software Development, Cloud Infrastructure, Security & Networking, and Databases & Data Engineering.",
    scopeText: "Designed for software engineers, IT professionals, tech job candidates, and technical documentation readers.",
    representativeCodes: ["API", "SDK", "SQL", "AWS", "CI/CD", "SaaS"],
    relatedCategories: ["business", "companies", "finance", "gaming"]
  }
};

export const DEFAULT_CATEGORY_SEO: CategorySEOInfo = {
  id: "all",
  seoTitle: "Explore All Abbreviations & Categories Dictionary",
  intro: "whatsthatmean is an all-in-one dictionary covering internet slang, business acronyms, military codes, IT technical terms, emoji meanings, and more.",
  structureText: "Our complete abbreviation index is systematically divided into 15 specialized categories spanning daily conversations, technology, corporate work, and professional fields.",
  scopeText: "Optimized with dynamic search, structured content, and sitemap crawling to help search engines and readers find accurate definition origins instantly.",
  representativeCodes: ["FYI", "ROI", "AWOL", "API", "GG", "POV"],
  relatedCategories: ["internet", "texting", "business", "military", "it_dev"]
};
