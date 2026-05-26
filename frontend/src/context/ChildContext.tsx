import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export interface ChildProfile {
  name: string;
  ageGroup: "3-5" | "6-8" | "9-11";
  favoriteColor: string;
  favoriteCharacter: string;
  stars: number;
  coins: number;
  xp: number;
  level: number;
  streak: number;
  completedGames: string[];
  completedStories: string[];
  completedLessons: string[];
  unlockedLessons: string[];
  isPremium: boolean;
}

interface ChildContextType {
  profile: ChildProfile | null;
  setProfile: (profile: ChildProfile) => void;
  addStars: (count: number) => void;
  addCoins: (count: number) => void;
  addXP: (amount: number) => void;
  incrementStreak: () => void;
  completeGame: (gameId: string) => void;
  completeStory: (storyId: string) => void;
  completeLesson: (lessonId: string, nextLessonId?: string) => void;
  isLoggedIn: boolean;
  logout: () => void;
}

const ChildContext = createContext<ChildContextType | null>(null);

export const useChild = () => {
  const ctx = useContext(ChildContext);
  if (!ctx) throw new Error('useChild must be used within ChildProvider');
  return ctx;
};

const XP_PER_LEVEL = 100;

export const ChildProvider = ({ children }: { children: ReactNode }) => {
  const [profile, setProfileState] = useState<ChildProfile | null>(() => {
    const saved = localStorage.getItem("child_profile");
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (err) {
        return null;
      }
    }
    return null;
  });

  useEffect(() => {
    if (profile) {
      localStorage.setItem("child_profile", JSON.stringify(profile));
    } else {
      localStorage.removeItem("child_profile");
    }
  }, [profile]);

  const setProfile = (p: ChildProfile) => setProfileState(p);

  const addStars = (count: number) => {
    setProfileState(prev => prev ? { ...prev, stars: prev.stars + count } : prev);
  };

  const addCoins = (count: number) => {
    setProfileState(prev => prev ? { ...prev, coins: prev.coins + count } : prev);
  };

  const addXP = (amount: number) => {
    setProfileState(prev => {
      if (!prev) return prev;
      const newXP = prev.xp + amount;
      const newLevel = Math.floor(newXP / XP_PER_LEVEL) + 1;
      return { ...prev, xp: newXP, level: newLevel };
    });
  };

  const incrementStreak = () => {
    setProfileState(prev => prev ? { ...prev, streak: prev.streak + 1 } : prev);
  };

  const completeGame = (gameId: string) => {
    setProfileState(prev =>
      prev && !prev.completedGames.includes(gameId)
        ? { ...prev, completedGames: [...prev.completedGames, gameId] }
        : prev
    );
  };

  const completeStory = (storyId: string) => {
    setProfileState(prev =>
      prev && !prev.completedStories.includes(storyId)
        ? { ...prev, completedStories: [...prev.completedStories, storyId] }
        : prev
    );
  };

  const completeLesson = (lessonId: string, nextLessonId?: string) => {
    setProfileState(prev => {
      if (!prev) return prev;
      const alreadyDone = prev.completedLessons.includes(lessonId);
      const newCompleted = alreadyDone ? prev.completedLessons : [...prev.completedLessons, lessonId];
      const newUnlocked = nextLessonId && !prev.unlockedLessons.includes(nextLessonId)
        ? [...prev.unlockedLessons, nextLessonId]
        : prev.unlockedLessons;
      return { ...prev, completedLessons: newCompleted, unlockedLessons: newUnlocked };
    });
  };

  const logout = () => setProfileState(null);

  return (
    <ChildContext.Provider value={{
      profile,
      setProfile,
      addStars,
      addCoins,
      addXP,
      incrementStreak,
      completeGame,
      completeStory,
      completeLesson,
      isLoggedIn: !!profile,
      logout,
    }}>
      {children}
    </ChildContext.Provider>
  );
};
