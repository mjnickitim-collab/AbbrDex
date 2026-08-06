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
    seoTitle: "Business & Workspace Acronyms Dictionary",
    intro: "A central hub for essential business terms, corporate acronyms, and workplace jargon commonly found in corporate emails, Slack messages, project proposals, and executive meetings.",
    structureText: "Business terminology is organized into four main operational areas: Management, Finance & Marketing, Operations & Collaboration, and Communication.",
    scopeText: "Provides practical abbreviations crucial for working in global startups, multinational corporations, and modern enterprise environments.",
    representativeCodes: ["ROI", "KPI", "WFH", "ASAP", "B2B", "ETA"],
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
    seoTitle: "Sports Terminology & League Acronyms Dictionary",
    intro: "A database of sports abbreviations, tournament codes, statistical acronyms, and league names for soccer, basketball, baseball, golf, and combat sports.",
    structureText: "Sports acronyms are structured into four main sports pillars: Leagues & Federations, Player Awards & Statistics, Game Rules & Officiating, and Positions & Tactics.",
    scopeText: "Features commentary terms and official shorthand used in Olympic games, FIFA World Cup, NBA, Premier League, and major sports broadcasts.",
    representativeCodes: ["GOAT", "MVP", "NBA", "VAR", "PGA", "UFC"],
    relatedCategories: ["social", "companies", "countries"]
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
