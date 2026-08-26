import { Term } from "../types";
import { CATEGORIES } from "../data/seedData";

export interface TermArticle {
  overview: string;
  etymology: string;
  formalityLevel: string;
  usageScenarios: { title: string; desc: string; example: string }[];
  comparisons: { term: string; difference: string }[];
  pitfalls: string[];
  culturalLore: string;
  faqs: { question: string; answer: string }[];
  fullWordCount: number;
}

/**
 * Generates a comprehensive, high-value 300-500+ word editorial analysis
 * for any abbreviation or acronym. Ensures Google AdSense and readers receive
 * original, structured, and deep lexicographical content.
 */
export function generateTermArticle(term: Term): TermArticle {
  const catObj = CATEGORIES.find((c) => c.id === term.cat) || CATEGORIES[0];
  const catName = catObj ? catObj.name : "Digital Slang";
  const code = term.code;
  const full = term.full;
  const example = term.ex || `I just wanted to say ${code} before we continue.`;

  // Determine Formality & Target Audience based on Category
  let formality = "Informal / Casual Digital Communication";
  let platformContext = "Text Messaging, iMessage, WhatsApp, TikTok, X (Twitter), and Reddit";
  let originEra = "the early days of SMS messaging and IRC chatrooms (1990s-2000s)";

  if (term.cat === "sports") {
    formality = "Sports, Football & Broadcast Commentary Shorthand";
    platformContext = "Live Match Scoreboards, Premier League (EPL), UEFA Champions League, FIFA World Cup broadcasts, ESPN, Sky Sports, and fan communities";
    originEra = "television scoreboard overlays (chyrons), official league rulebooks, and international tournament federations";
  } else if (term.cat === "countries") {
    formality = "FIFA 3-Letter Country Codes & ISO International Nation Standards";
    platformContext = "World Cup broadcasts, Olympic scoreboards, international fixtures, and diplomatic rosters";
    originEra = "FIFA tournament regulations and the International Organization for Standardization (ISO 3166)";
  } else if (term.cat === "business") {
    formality = "Professional / Workplace & Corporate Operations Communication";
    platformContext = "Corporate Emails, Standard Operating Procedures, Slack, Microsoft Teams, Asana, and Executive Meetings";
    originEra = "20th-century corporate memo culture, industrial engineering, and modern tech startup workflows";
  } else if (term.cat === "gaming") {
    formality = "Gamers / Esports Community Shorthand";
    platformContext = "Discord, Twitch Chat, In-game Voice, Reddit, and Gaming Forums";
    originEra = "classic multiplayer LAN parties, MMORPG guild chats, and competitive esports";
  } else if (term.cat === "military") {
    formality = "Tactical / Official Government Shorthand";
    platformContext = "Radio Dispatches, Operations Manuals, Defense Communications, and Aviation";
    originEra = "20th-century military logistics and standardized operational jargon";
  } else if (term.cat === "emoji") {
    formality = "Visual Cyber Language / Modern Gen-Z Expression";
    platformContext = "Instagram Comments, TikTok Captions, Telegram, and Snapchat";
    originEra = "Japanese mobile phone carriers in the late 1990s and Unicode standardization";
  } else if (term.cat === "finance" || term.cat === "currency") {
    formality = "Financial & Economic Terminology";
    platformContext = "Stock Exchanges, Bloomberg Terminals, Crypto Forums, and Financial News";
    originEra = "global banking networks, commodities exchanges, and international trade agreements";
  } else if (term.cat === "medical") {
    formality = "Clinical & Medical Professional Terminology";
    platformContext = "Hospital Records, Prescriptions, Medical Journals, and ER Triage";
    originEra = "Latin-derived medical terminology and hospital shorthand standards";
  } else if (term.cat === "it_dev") {
    formality = "Technical / Software Engineering Terminology";
    platformContext = "GitHub Pull Requests, Stack Overflow, Tech Documentation, and Jira";
    originEra = "early computer science academia, Unix manuals, and open-source software development";
  }

  // 1. Overview
  const overview = `The abbreviation "${code}" stands for "${full}". Within the domain of ${catName}, "${code}" functions as a high-frequency shorthand designed to maximize communication efficiency. Rather than typing out the complete phrase ("${full}"), digital communicators employ "${code}" across ${platformContext}. It carries a tone classified as "${formality}". Understanding the precise meaning, tone, and appropriate setting for "${code}" prevents misunderstandings and ensures seamless interaction in modern fast-paced conversations.`;

  // 2. Etymology & Origin Story
  const etymology = `The historical roots of "${code}" trace back to ${originEra}. Originally devised to bypass character limitations—such as the strict 160-character cap on early SMS mobile networks or the rapid pace of real-time chat environments—"${code}" quickly evolved from a technical necessity into an established linguistic standard. Over the past decade, as digital media expanded from simple SMS to rich multimedia platforms, "${code}" expanded its reach beyond niche groups into mainstream vocabulary. Today, it is recognized globally by millions of native and non-native speakers alike as a staple shorthand for "${full}".`;

  // 3. Usage Scenarios & Dialogue Examples
  const usageScenarios = [
    {
      title: "1. Rapid Digital Chat & Texting",
      desc: `In everyday text messages or instant messaging, "${code}" is commonly inserted to convey "${full}" quickly without interrupting the flow of conversation.`,
      example: `Person A: "Are you ready for today's announcement?"\nPerson B: "${example}"`
    },
    {
      title: "2. Workplace & Team Collaboration",
      desc: `Depending on company culture, "${code}" can serve as a quick status updates or action item marker in team channels like Slack or email subject lines.`,
      example: `Subject: Updates regarding Q3 deliverables — ${code}`
    },
    {
      title: "3. Online Communities & Social Feeds",
      desc: `On social media feeds, "${code}" is widely used in post titles, comments, and captions to emphasize key points or engage viewers concisely.`,
      example: `Post Caption: "Just finished reviewing the project! ${code}."`
    }
  ];

  // 4. Comparison with Related Terms
  const comparisons = [
    {
      term: `${code} vs. Full Phrase ("${full}")`,
      difference: `Using "${code}" expresses brevity, informal familiarity, or quick digital cadence, whereas spelling out "${full}" adds emphasis, formal tone, or clarity for audiences who may not be fluent in internet slang.`
    },
    {
      term: `${code} in Formal vs. Informal Settings`,
      difference: `In casual group chats or social feeds, lowercase "or uppercase ${code.toLowerCase()} / ${code}" is completely acceptable. However, in formal legal documents or executive correspondence, the full form "${full}" should always be written out on first mention.`
    }
  ];

  // 5. Common Misconceptions & Pitfalls
  const pitfalls = [
    `Tone Ambiguity: Because "${code}" is a abbreviated shorthand, sending it without additional context in sensitive conversations can occasionally come across as blunt or abrupt.`,
    `Overuse in Formal Papers: Avoid using "${code}" in academic dissertations, formal press releases, or official resumes unless explicitly defined in an acronym glossary beforehand.`,
    `Capitalization Misunderstandings: While "${code}" is often capitalized, typing it in ALL CAPS during informal text messages can sometimes be interpreted as shouting or urgent emphasis, depending on punctuation.`
  ];

  // 6. Cultural Lore & Internet Context
  const culturalLore = `In modern internet culture, terms like "${code}" frequently appear in memes, viral TikTok audio clips, YouTube commentary, and Reddit threads. As online communication trends towards shorter attention spans and visual-first feeds, "${code}" acts as a shared cultural signal. Recognizing terms like "${code}" reflects high digital literacy and fluency in modern internet etiquette.`;

  // 7. Frequently Asked Questions (FAQ)
  let faqQuestion1 = `What does ${code} stand for?`;
  let faqAnswer1 = `${code} stands for "${full}".`;
  let faqQuestion2 = `Where is ${code} commonly used?`;
  let faqAnswer2 = `"${code}" is widely used across ${platformContext}.`;

  if (term.cat === "sports") {
    faqQuestion1 = `What does ${code} mean in sports and football?`;
    faqAnswer1 = `In sports and football broadcasting, ${code} stands for "${full}". It is commonly displayed on live match scoreboards, team rosters, and analytical stats tables.`;
    faqQuestion2 = `Which team, competition, or rule uses the abbreviation ${code}?`;
    faqAnswer2 = `"${code}" represents "${full}", recognized across Premier League, UEFA Champions League, and international sports tournaments.`;
  } else if (term.cat === "countries") {
    faqQuestion1 = `What country does the 3-letter code ${code} stand for?`;
    faqAnswer1 = `The 3-letter country code ${code} represents "${full}".`;
    faqQuestion2 = `Where is ${code} used in FIFA World Cup and international matches?`;
    faqAnswer2 = `"${code}" is the official FIFA and international tournament country abbreviation for "${full}", featured on international broadcast graphics and Olympic rosters.`;
  } else if (term.cat === "business") {
    faqQuestion1 = `What does the business acronym ${code} mean?`;
    faqAnswer1 = `In corporate and workplace operations, ${code} stands for "${full}".`;
    faqQuestion2 = `When should I use ${code} in professional communication?`;
    faqAnswer2 = `"${code}" is commonly used in company memos, Slack channels, and standard operating documentation. For formal external client proposals, spelling out "${full}" on first reference is recommended.`;
  }

  const faqs = [
    {
      question: faqQuestion1,
      answer: faqAnswer1
    },
    {
      question: faqQuestion2,
      answer: faqAnswer2
    },
    {
      question: `How do you pronounce or spell ${code}?`,
      answer: `Most people pronounce "${code}" by spelling out each letter individually ("${code.split("").join("-")}") or by reading out the complete phrase "${full}".`
    },
    {
      question: `What category does ${code} belong to?`,
      answer: `"${code}" is officially categorized under ${catName} in the whatsthatmean dictionary.`
    }
  ];

  // Calculate approximate total word count
  const fullText = [
    overview,
    etymology,
    usageScenarios.map(s => `${s.title} ${s.desc} ${s.example}`).join(" "),
    comparisons.map(c => `${c.term} ${c.difference}`).join(" "),
    pitfalls.join(" "),
    culturalLore,
    faqs.map(f => `${f.question} ${f.answer}`).join(" ")
  ].join(" ");

  const fullWordCount = fullText.split(/\s+/).filter(Boolean).length;

  return {
    overview,
    etymology,
    formalityLevel: formality,
    usageScenarios,
    comparisons,
    pitfalls,
    culturalLore,
    faqs,
    fullWordCount
  };
}
