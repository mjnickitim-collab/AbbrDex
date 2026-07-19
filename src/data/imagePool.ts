export interface CuratedImage {
  id: string;
  category: string;
  keywords: string[];
  url: string;
  alt: string;
}

export const CURATED_IMAGES: CuratedImage[] = [
  // AI & Tech
  {
    id: "ai-fluid",
    category: "AI & Tech",
    keywords: ["ai", "tech", "artificial", "cyber", "technology", "quantum", "neural", "deepseek", "chatgpt", "sora", "agi", "vision pro"],
    url: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=1000&auto=format&fit=crop&q=80",
    alt: "Abstract purple-blue fluid digital art representing high-tech quantum computing and AI neural network concepts"
  },
  {
    id: "ai-brain",
    category: "AI & Tech",
    keywords: ["ai", "neural", "brain", "network", "artificial", "technology", "quantum", "deepseek", "chatgpt"],
    url: "https://images.unsplash.com/photo-1620712943543-bcc4688e7485?w=1000&auto=format&fit=crop&q=80",
    alt: "Glowing AI neural network brain interface representing machine learning and technological evolution"
  },
  {
    id: "blockchain",
    category: "AI & Tech",
    keywords: ["blockchain", "tech", "quantum", "cryptography", "web3", "data", "cyberspace"],
    url: "https://images.unsplash.com/photo-1639762681485-074b7f938ba0?w=1000&auto=format&fit=crop&q=80",
    alt: "Intricate glowing 3D node network rendering representing decentralization, blockchain and secure data"
  },
  {
    id: "microchip",
    category: "AI & Tech",
    keywords: ["hardware", "chip", "semiconductor", "microchip", "circuitry", "server", "tech"],
    url: "https://images.unsplash.com/photo-1518770660439-4636190af475?w=1000&auto=format&fit=crop&q=80",
    alt: "Extremely close up shot of a silicon motherboard microchip with gold circuits and neon lights"
  },
  {
    id: "hacker-code",
    category: "AI & Tech",
    keywords: ["code", "developer", "programmer", "matrix", "hacking", "cybersecurity", "javascript", "python", "html"],
    url: "https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=1000&auto=format&fit=crop&q=80",
    alt: "Lines of brilliant green programming code cascading down a dark terminal screen"
  },
  {
    id: "cyber-defense",
    category: "AI & Tech",
    keywords: ["cybersecurity", "security", "lock", "server", "defense", "internet", "hosting"],
    url: "https://images.unsplash.com/photo-1550751827-4bd374c3f58b?w=1000&auto=format&fit=crop&q=80",
    alt: "A secure mainframe network computer illuminated with neon blue protection shields and security locks"
  },
  {
    id: "dev-laptop",
    category: "AI & Tech",
    keywords: ["code", "developer", "coding", "laptop", "workspace", "react", "programming"],
    url: "https://images.unsplash.com/photo-1488590528505-98d2b5aba04b?w=1000&auto=format&fit=crop&q=80",
    alt: "A software developer setup showing a sleek modern laptop with active lines of code on the screen"
  },

  // Gaming & Esports
  {
    id: "game-station",
    category: "Gaming",
    keywords: ["game", "gaming", "esports", "station", "pubg", "lol", "elden", "gta", "steam", "ps5"],
    url: "https://images.unsplash.com/photo-1538481199705-c710c4e965fc?w=1000&auto=format&fit=crop&q=80",
    alt: "State of the art gaming desktop setup illuminated with vivid custom pink and purple RGB neon lighting"
  },
  {
    id: "controller",
    category: "Gaming",
    keywords: ["controller", "gamepad", "console", "game", "gaming", "switch", "xbox", "ps5"],
    url: "https://images.unsplash.com/photo-1542751371-adc38448a05e?w=1000&auto=format&fit=crop&q=80",
    alt: "Close up of a premium matte black gaming console controller resting on an illuminated keyboard"
  },
  {
    id: "vr-headset",
    category: "Gaming",
    keywords: ["vr", "virtual reality", "headset", "metaverse", "gaming", "experience", "simulation"],
    url: "https://images.unsplash.com/photo-1600861195091-690c92f1d2cc?w=1000&auto=format&fit=crop&q=80",
    alt: "A tech enthusiast wearing a virtual reality headset immersed in a high-fidelity gaming simulation"
  },
  {
    id: "retro-arcade",
    category: "Gaming",
    keywords: ["retro", "arcade", "game", "gaming", "memories", "vintage", "cabinets"],
    url: "https://images.unsplash.com/photo-1552820728-8b83bb6b773f?w=1000&auto=format&fit=crop&q=80",
    alt: "Row of glowing vintage 1980s retro arcade game cabinets inside a dim nostalgic gaming parlor"
  },

  // Trendy, Gen-Z, Pop Culture & Friends
  {
    id: "genz-friends",
    category: "Pop Culture",
    keywords: ["slang", "friend", "talk", "chat", "gen-z", "gossip", "tiktok", "rizz", "meme", "meet", "youth"],
    url: "https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=1000&auto=format&fit=crop&q=80",
    alt: "Group of diverse, fashionable young Gen-Z teenagers hanging out together, laughing and looking at a smartphone"
  },
  {
    id: "trendy-students",
    category: "Pop Culture",
    keywords: ["college", "student", "laugh", "happy", "trendy", "gen-z", "friends", "talk", "high-five"],
    url: "https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?w=1000&auto=format&fit=crop&q=80",
    alt: "Diverse group of college students in trendy streetwear collaborating on a dynamic group project"
  },
  {
    id: "microphone-neon",
    category: "Pop Culture",
    keywords: ["podcast", "media", "talk", "chat", "speak", "youtube", "creator", "gossip"],
    url: "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=1000&auto=format&fit=crop&q=80",
    alt: "A professional broadcast studio microphone standing in front of colorful background lightings"
  },
  {
    id: "laptop-creative-hands",
    category: "Pop Culture",
    keywords: ["creator", "design", "video", "content", "laptop", "youtube", "media", "tiktok"],
    url: "https://images.unsplash.com/photo-1515378791036-0648a3ef77b2?w=1000&auto=format&fit=crop&q=80",
    alt: "Creative designer's hands navigating keyboard with glowing light overlay reflecting high-energy content creation"
  },

  // Office, WFH & Productivity
  {
    id: "collab-workspace",
    category: "Work & Productivity",
    keywords: ["office", "work", "wfh", "collab", "desk", "meeting", "startup", "brainstorm"],
    url: "https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=1000&auto=format&fit=crop&q=80",
    alt: "Modern bright startup co-working space with teammates collaborating on digital laptop layouts"
  },
  {
    id: "wfh-flatlay",
    category: "Work & Productivity",
    keywords: ["wfh", "remotely", "laptop", "coffee", "study", "notes", "workspace", "homeoffice"],
    url: "https://images.unsplash.com/photo-1499750310107-5fef28a66643?w=1000&auto=format&fit=crop&q=80",
    alt: "A minimal and aesthetic work-from-home setup with a laptop, warm cup of coffee, and handwritten notebook journal"
  },
  {
    id: "macbook-wood",
    category: "Work & Productivity",
    keywords: ["laptop", "study", "desk", "work", "minimalist", "design", "write", "office"],
    url: "https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=1000&auto=format&fit=crop&q=80",
    alt: "A clean minimalist wooden office desk holding a sleek white laptop, planner, and stationery accessories"
  },
  {
    id: "wireframing",
    category: "Work & Productivity",
    keywords: ["design", "ui", "ux", "wireframe", "app", "sketch", "notes", "strategy"],
    url: "https://images.unsplash.com/photo-1531403009284-440f080d1e12?w=1000&auto=format&fit=crop&q=80",
    alt: "A designer's desk with UX wireframing schematics, design templates, and mobile app storyboards"
  },

  // Money, Finance & FIRE
  {
    id: "stock-charts",
    category: "Finance & FIRE",
    keywords: ["money", "stock", "trade", "finance", "invest", "fire", "cash", "crypto", "bitcoin"],
    url: "https://images.unsplash.com/photo-1559526324-4b87b5e36e44?w=1000&auto=format&fit=crop&q=80",
    alt: "Modern financial analyst workstation showing real-time multi-colored stock market candles and charts on screens"
  },
  {
    id: "gold-bitcoins",
    category: "Finance & FIRE",
    keywords: ["bitcoin", "crypto", "ethereum", "money", "invest", "finance", "blockchain"],
    url: "https://images.unsplash.com/photo-1518546305927-5a555bb7020d?w=1000&auto=format&fit=crop&q=80",
    alt: "Stacks of heavy golden Bitcoin coins glistening under golden ambient studio lighting"
  },
  {
    id: "saving-plant",
    category: "Finance & FIRE",
    keywords: ["saving", "money", "invest", "plant", "grow", "fire", "retirement", "budget"],
    url: "https://images.unsplash.com/photo-1579621970563-ebec7560ff3e?w=1000&auto=format&fit=crop&q=80",
    alt: "A young green plant sprouting from fertile soil surrounded by stacks of shiny coins representing financial savings"
  },
  {
    id: "market-growth",
    category: "Finance & FIRE",
    keywords: ["growth", "trend", "chart", "invest", "finance", "stock", "upward"],
    url: "https://images.unsplash.com/photo-1621416894569-0f39ed31d247?w=1000&auto=format&fit=crop&q=80",
    alt: "Minimalist upward trending finance line chart showing green and red growth vectors"
  },

  // Lifestyle, Aesthetic & Food
  {
    id: "cozy-cafe",
    category: "Lifestyle",
    keywords: ["lifestyle", "coffee", "morning", "travel", "vibe", "aesthetic", "chill", "retro", "cafe"],
    url: "https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=1000&auto=format&fit=crop&q=80",
    alt: "Extremely cozy hipster retro cafe interior with warm soft lighting, green indoor plants, and comfortable seating"
  },
  {
    id: "latte-flatlay",
    category: "Lifestyle",
    keywords: ["coffee", "latte", "cafe", "vibe", "morning", "aesthetic", "breakfast"],
    url: "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=1000&auto=format&fit=crop&q=80",
    alt: "A beautiful top-down view of freshly brewed coffee cups with perfect milky latte art on a cozy rustic tabletop"
  },
  {
    id: "tiramisu-cake",
    category: "Lifestyle",
    keywords: ["tiramisu", "dessert", "cake", "food", "sweet", "cafe", "plate"],
    url: "https://images.unsplash.com/photo-1574085733277-851d9d856a3a?w=1000&auto=format&fit=crop&q=80",
    alt: "A slice of delicious Italian tiramisu cake topped with rich cocoa powder, served on a luxury ceramic dessert plate"
  },
  {
    id: "sunny-beach",
    category: "Lifestyle",
    keywords: ["travel", "beach", "ocean", "sunny", "vibe", "vacation", "nature", "summer"],
    url: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1000&auto=format&fit=crop&q=80",
    alt: "Breathtaking sunny white sand beach with gentle turquoise ocean waves breaking on the tropical shoreline"
  },
  {
    id: "zen-nature",
    category: "Lifestyle",
    keywords: ["nature", "mountain", "zen", "peaceful", "landscape", "mist", "forest"],
    url: "https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?w=1000&auto=format&fit=crop&q=80",
    alt: "Mystical mist and early morning fog drifting slowly over lush green pine forest mountains"
  },

  // Emojis, Memes & Hot News
  {
    id: "emoji-cushion",
    category: "Trending & Emojis",
    keywords: ["emoji", "smile", "love", "heart", "face", "symbol", "meme"],
    url: "https://images.unsplash.com/photo-1583511655857-d19b40a7a54e?w=1000&auto=format&fit=crop&q=80",
    alt: "Bright yellow happy face emoji cushion sitting on a clean, sunlit white minimalist bedsheet"
  },
  {
    id: "hearts-balloons",
    category: "Trending & Emojis",
    keywords: ["love", "heart", "emoji", "romance", "vibe", "gift"],
    url: "https://images.unsplash.com/photo-1518199266791-5375a83190b7?w=1000&auto=format&fit=crop&q=80",
    alt: "A collection of romantic metallic red heart-shaped balloons floating together under high-contrast lighting"
  },
  {
    id: "news-press",
    category: "Trending & Emojis",
    keywords: ["news", "trend", "hot", "fire", "hype", "issue", "newspaper", "breaking"],
    url: "https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=1000&auto=format&fit=crop&q=80",
    alt: "Stack of daily morning newspapers close up representing trending current events and viral breaking news stories"
  },
  {
    id: "digital-news",
    category: "Trending & Emojis",
    keywords: ["news", "digital", "tablet", "blog", "phone", "media", "internet"],
    url: "https://images.unsplash.com/photo-1585829365295-ab7cd400c167?w=1000&auto=format&fit=crop&q=80",
    alt: "A tablet computer displaying high-quality digital newspaper blog feeds on a clean, modern desk layout"
  }
];
