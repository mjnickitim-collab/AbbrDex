export interface Category {
  id: string;
  name: string;
  tag: string;
}

export interface Term {
  id?: string;
  code: string;
  full: string;
  cat: string; // matches Category.id
  ex: string;
  trending?: boolean;
  createdAt?: any;
}

export interface BlogPost {
  id?: string;
  title: string;
  date: string;
  excerpt: string;
  body: string;
  cat?: string; // category id
  createdAt?: any;
  seoTitle?: string;
  metaDescription?: string;
  keywords?: string;
  draft?: boolean;
  imageUrl?: string;
  imageAlt?: string;
}

export interface AdSlot {
  id?: string;
  name: string;
  desc: string;
  on: boolean;
  network: string;
  adsenseCode?: string;
}

export interface UserProfile {
  uid: string;
  name: string;
  email: string;
  role: "Admin" | "Editor" | "User";
  status: "active" | "banned";
  joined: string;
}

export interface QuizQuestion {
  code: string;
  correct: string;
  choices: string[];
}

export interface QuizState {
  qs: QuizQuestion[];
  idx: number;
  score: number;
  streak: number;
  bestStreak: number;
  answered: boolean;
  selectedAnswer: string | null;
}
