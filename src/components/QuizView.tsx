import React, { useState, useEffect } from "react";
import { Term, QuizQuestion, QuizState, UserProfile } from "../types";
import { CATEGORIES } from "../data/seedData";
import { recordQuizScore } from "../data/dbService";
import { Trophy, Flame, Play, RefreshCw, CheckCircle, XCircle } from "lucide-react";

interface QuizViewProps {
  terms: Term[];
  currentUser: UserProfile | null;
  initialMode?: "abbreviation" | "emoji";
}

export default function QuizView({ terms, currentUser, initialMode = "abbreviation" }: QuizViewProps) {
  const [quiz, setQuiz] = useState<QuizState | null>(null);
  const [bestStreakGlobal, setBestStreakGlobal] = useState(0);
  const [selectedMode, setSelectedMode] = useState<"abbreviation" | "emoji">(initialMode);

  useEffect(() => {
    setSelectedMode(initialMode);
  }, [initialMode]);

  // Pick questions from TERMS
  const generateQuestions = (n = 5, mode: "abbreviation" | "emoji" = "abbreviation"): QuizQuestion[] => {
    const poolTerms = mode === "emoji" 
      ? terms.filter(t => t.cat === "emoji")
      : terms.filter(t => t.cat !== "emoji");

    if (poolTerms.length < 5) return [];
    
    // Shuffle and pick n terms
    const pool = [...poolTerms].sort(() => Math.random() - 0.5).slice(0, n);
    
    return pool.map((t) => {
      // Calculate a similarity score for all other terms in the database
      const candidates = poolTerms.filter(
        (x) => x.code !== t.code && x.full.toLowerCase() !== t.full.toLowerCase()
      );

      const scoredCandidates = candidates.map((cand) => {
        let score = 0;

        // 1. Same category gets a bonus
        if (cand.cat === t.cat) {
          score += 15;
        }

        const tCode = t.code.toUpperCase();
        const candCode = cand.code.toUpperCase();

        // 2. Matching character counts in the abbreviation code
        let charMatches = 0;
        const targetChars = tCode.split("");
        for (const char of targetChars) {
          if (candCode.includes(char)) {
            charMatches++;
          }
        }
        score += charMatches * 5;

        // 3. Same length of abbreviation code
        if (tCode.length === candCode.length) {
          score += 8;
        }

        // 4. Shares first letter of the abbreviation code
        if (tCode[0] === candCode[0]) {
          score += 25;
        }

        const tFull = t.full.toLowerCase();
        const candFull = cand.full.toLowerCase();

        // 5. Shares first letter of meaning
        if (tFull[0] === candFull[0]) {
          score += 15;
        }

        // 6. Shares any common words of length > 2
        const tWords = tFull.split(/\s+/);
        const candWords = candFull.split(/\s+/);
        let wordMatches = 0;
        for (const w of tWords) {
          const cleanW = w.replace(/[^a-z0-9]/g, "");
          if (cleanW.length > 2 && candWords.some(cw => cw.replace(/[^a-z0-9]/g, "") === cleanW)) {
            wordMatches++;
          }
        }
        score += wordMatches * 15;

        return { cand, score };
      });

      // Sort by score descending to get most similar terms
      scoredCandidates.sort((a, b) => b.score - a.score);

      // To keep quiz non-repetitive, we take the top 15 most similar candidates
      // and randomly shuffle & pick 3 of them.
      const topCandidates = scoredCandidates.slice(0, 15).map(item => item.cand.full);
      const uniqueTopMeanings = Array.from(new Set(topCandidates));

      const wrong = uniqueTopMeanings
        .sort(() => Math.random() - 0.5)
        .slice(0, 3);

      // If for any reason we don't have enough (e.g. unique meanings limit), fallback
      if (wrong.length < 3) {
        const fallbacks = Array.from(new Set(candidates.map(x => x.full)))
          .filter(f => f !== t.full && !wrong.includes(f));
        while (wrong.length < 3 && fallbacks.length > 0) {
          wrong.push(fallbacks.pop()!);
        }
      }

      // Combine with correct answer and shuffle
      const choices = Array.from(new Set([...wrong, t.full])).sort(() => Math.random() - 0.5);
      
      return {
        code: t.code,
        correct: t.full,
        choices
      };
    });
  };

  const startQuiz = () => {
    const qs = generateQuestions(5, selectedMode);
    setQuiz({
      qs,
      idx: 0,
      score: 0,
      streak: 0,
      bestStreak: 0,
      answered: false,
      selectedAnswer: null
    });
  };

  const handleAnswerSelect = async (selected: string) => {
    if (!quiz || quiz.answered) return;
    
    const curQuestion = quiz.qs[quiz.idx];
    const isCorrect = selected === curQuestion.correct;
    
    const newStreak = isCorrect ? quiz.streak + 1 : 0;
    const newBestStreak = Math.max(quiz.bestStreak, newStreak);
    const newScore = isCorrect ? quiz.score + 1 : quiz.score;

    setQuiz({
      ...quiz,
      answered: true,
      selectedAnswer: selected,
      streak: newStreak,
      bestStreak: newBestStreak,
      score: newScore
    });

    // Check if this was the last question, we record to firestore if logged in
    const isLastQuestion = quiz.idx === quiz.qs.length - 1;
    if (isLastQuestion && currentUser) {
      try {
        await recordQuizScore(currentUser.uid, newScore, newBestStreak, selectedMode);
      } catch (err) {
        console.error("Failed to record score in Firebase:", err);
      }
    }

    // Advance to next question after delay
    setTimeout(() => {
      setQuiz((prev) => {
        if (!prev) return null;
        return {
          ...prev,
          idx: prev.idx + 1,
          answered: false,
          selectedAnswer: null
        };
      });
    }, 1200);
  };

  // Keep track of best global streak during this active tab session
  useEffect(() => {
    if (quiz && quiz.bestStreak > bestStreakGlobal) {
      setBestStreakGlobal(quiz.bestStreak);
    }
  }, [quiz?.bestStreak]);

  // If not started, show landing state
  if (!quiz) {
    const isEmoji = selectedMode === "emoji";
    return (
      <div className="max-w-lg mx-auto px-6 py-16 text-center">
        <div className="bg-card border border-line rounded-2xl p-10 shadow-sm flex flex-col items-center">
          {/* Custom Switch Tab */}
          <div className="grid grid-cols-2 p-1 bg-paper/60 rounded-xl border border-line mb-8 w-full max-w-sm">
            <button
              type="button"
              onClick={() => setSelectedMode("abbreviation")}
              className={`py-2 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer
                ${selectedMode === "abbreviation" 
                  ? "bg-white text-indigo border border-line shadow-sm" 
                  : "text-ink-soft hover:text-ink"}`}
            >
              <span>🔤 Abbreviation Quiz</span>
            </button>
            <button
              type="button"
              onClick={() => setSelectedMode("emoji")}
              className={`py-2 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer
                ${selectedMode === "emoji" 
                  ? "bg-white text-indigo border border-line shadow-sm" 
                  : "text-ink-soft hover:text-ink"}`}
            >
              <span>😊 Emoji Quiz</span>
            </button>
          </div>

          <div className="w-16 h-16 bg-yellow/15 text-yellow-ink rounded-full flex items-center justify-center mb-6">
            <Trophy className="w-8 h-8 text-yellow animate-pulse" />
          </div>
          
          <h2 className="font-display font-bold text-3xl text-ink">
            {isEmoji ? "Guess the Emoji Meaning" : "Abbreviation Quiz Master"}
          </h2>
          <h4 className="text-xs font-bold text-indigo/80 mt-1 uppercase tracking-wide">
            {isEmoji ? "Emoji Meaning Quiz" : "Internet Slang Master Quiz"}
          </h4>
          <p className="text-sm text-ink-soft max-w-sm mt-3 mb-8 leading-relaxed">
            {isEmoji 
              ? "Do you know the real meanings of trendy emojis like 💅, 💀, 🧢, 🫠 used in chats and SNS? Answer 5 random emoji questions and test your skills!"
              : "Answer 5 random abbreviation questions about chat slangs, neologisms, and business acronyms to test your score and show your expertise!"}
          </p>

          <button 
            onClick={startQuiz}
            className="btn btn-solid font-display font-bold px-8 py-3.5 flex items-center gap-2 shadow-md hover:scale-[1.02] active:scale-95 transition"
          >
            <Play className="w-4 h-4 fill-white" />
            <span>{isEmoji ? "Start Emoji Quiz" : "Start Abbreviation Quiz"}</span>
          </button>

          {currentUser && (
            <p className="text-[11px] text-ink-soft mt-4">
              ✨ Logged in as <span className="font-semibold">{currentUser.name}</span>.
            </p>
          )}
        </div>
      </div>
    );
  }

  const isCompleted = quiz.idx >= quiz.qs.length;

  // Completed State
  if (isCompleted) {
    const isPerfect = quiz.score === quiz.qs.length;
    return (
      <div className="max-w-md mx-auto px-6 py-16 text-center">
        <div className="bg-card border border-line rounded-2xl p-10 shadow-lg flex flex-col items-center">
          <span className="text-xs font-semibold uppercase tracking-wider text-ink-soft">Quiz Completed</span>
          
          <div className="score font-display font-bold text-6xl text-indigo mt-4 mb-2">
            {quiz.score}/{quiz.qs.length}
          </div>

          <div className="font-display font-bold text-xl text-ink">
            {isPerfect ? "Absolute Master!" : quiz.score >= 3 ? "Great Job!" : "Keep Practicing!"}
          </div>

          <div className="flex items-center gap-1.5 text-xs text-coral-ink bg-coral/10 border border-coral/15 rounded-full px-4 py-1.5 mt-5 mb-8">
            <Flame className="w-4 h-4 text-coral fill-coral/10 animate-bounce" />
            <span className="font-semibold">Best streak this round: {quiz.bestStreak}</span>
          </div>

          <button 
            onClick={startQuiz}
            className="btn btn-solid w-full font-display font-bold p-3.5 flex items-center justify-center gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Play again</span>
          </button>
        </div>
      </div>
    );
  }

  const cur = quiz.qs[quiz.idx];
  const isEmojiActive = selectedMode === "emoji";

  return (
    <div className="max-w-lg mx-auto px-6 py-12">
      {/* Quiz Top bar */}
      <div className="quiz-top flex justify-between items-center mb-6">
        <span className="quiz-progress text-xs font-semibold text-ink-soft">
          Question {quiz.idx + 1} of {quiz.qs.length} ({isEmojiActive ? "Emoji Quiz" : "Abbreviation Quiz"})
        </span>
        <div className="streak flex items-center gap-1.5 text-xs font-bold text-coral-ink bg-coral/10 border border-coral/15 rounded-full px-3 py-1">
          <Flame className="w-4 h-4 text-coral fill-coral/10" />
          <span>{quiz.streak} streak</span>
        </div>
      </div>

      {/* Quiz Question Card */}
      <div className="quiz-card bg-card border-1.5 border-line rounded-2xl p-8 shadow-sm text-center flex flex-col items-center animate-in fade-in slide-in-from-bottom-4 duration-200">
        <div className={`qcode font-bold mb-3 ${isEmojiActive ? "text-7xl drop-shadow-sm select-none" : "mono font-mono text-5xl text-indigo tracking-wide"}`}>
          {cur.code}
        </div>
        <div className="qprompt text-sm font-semibold text-ink-soft mb-8">
          {isEmojiActive ? "What does this emoji mean?" : "What does this abbreviation stand for?"}
        </div>

        <div className="choiceList w-full space-y-3">
          {cur.choices.map((choice) => {
            const isSelected = quiz.selectedAnswer === choice;
            const isCorrectAnswer = choice === cur.correct;
            
            let btnClass = "border-line bg-paper text-ink";
            let icon = null;

            if (quiz.answered) {
              if (isCorrectAnswer) {
                btnClass = "border-mint bg-mint/10 text-mint-ink font-semibold";
                icon = <CheckCircle className="w-4 h-4 text-mint flex-shrink-0" />;
              } else if (isSelected) {
                btnClass = "border-coral bg-coral/10 text-coral-ink font-semibold";
                icon = <XCircle className="w-4 h-4 text-coral flex-shrink-0" />;
              } else {
                btnClass = "border-line bg-paper text-ink-soft opacity-60";
              }
            } else {
              btnClass = "border-line bg-paper text-ink hover:border-ink hover:bg-line/20";
            }

            return (
              <button
                key={choice}
                disabled={quiz.answered}
                onClick={() => handleAnswerSelect(choice)}
                className={`choice w-full text-left p-4 rounded-xl border-1.5 flex justify-between items-center transition cursor-pointer text-sm font-medium ${btnClass}`}
              >
                <span className="line-clamp-2 pr-2">{choice}</span>
                {icon}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
