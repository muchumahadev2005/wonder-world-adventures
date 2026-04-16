import React, { createContext, useContext, useState, ReactNode } from 'react';

interface ChildProfile {
  name: string;
  age: number;
  favoriteColor: string;
  stars: number;
  completedGames: string[];
  completedStories: string[];
  isPremium: boolean;
}

interface ChildContextType {
  profile: ChildProfile | null;
  setProfile: (profile: ChildProfile) => void;
  addStars: (count: number) => void;
  completeGame: (gameId: string) => void;
  completeStory: (storyId: string) => void;
  isLoggedIn: boolean;
  logout: () => void;
}

const ChildContext = createContext<ChildContextType | null>(null);

export const useChild = () => {
  const ctx = useContext(ChildContext);
  if (!ctx) throw new Error('useChild must be used within ChildProvider');
  return ctx;
};

export const ChildProvider = ({ children }: { children: ReactNode }) => {
  const [profile, setProfileState] = useState<ChildProfile | null>(null);

  const setProfile = (p: ChildProfile) => setProfileState(p);

  const addStars = (count: number) => {
    setProfileState(prev => prev ? { ...prev, stars: prev.stars + count } : prev);
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

  const logout = () => setProfileState(null);

  return (
    <ChildContext.Provider value={{
      profile,
      setProfile,
      addStars,
      completeGame,
      completeStory,
      isLoggedIn: !!profile,
      logout,
    }}>
      {children}
    </ChildContext.Provider>
  );
};
