const DEFAULT_SERVER_URL = "https://wonder-world-adventures.onrender.com";
const API_BASE_URL = `${import.meta.env.VITE_SERVER_URL || DEFAULT_SERVER_URL}/api`;
const apiDebug = import.meta.env.VITE_API_DEBUG === "true";
let hasLoggedBase = false;

const logApiBase = () => {
  if (hasLoggedBase) return;
  hasLoggedBase = true;
  console.log("[api] base", {
    apiBaseUrl: API_BASE_URL,
    viteServerUrl: import.meta.env.VITE_SERVER_URL || null,
  });
};

type ApiOptions = Omit<RequestInit, "body"> & { body?: Record<string, unknown> };

export const apiFetch = async <T>(path: string, options: ApiOptions = {}, token?: string | null) => {
  const url = `${API_BASE_URL}${path}`;
  if (apiDebug) {
    logApiBase();
    console.log("[api] full url", url);
  }
  const headers = new Headers(options.headers || {});
  if (!headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }
  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  if (import.meta.env.DEV || apiDebug) {
    console.log("[api] request", {
      url,
      method: options.method || "GET",
      body: options.body || null,
    });
  }

  const response = await fetch(url, {
    ...options,
    headers,
    body: options.body ? JSON.stringify(options.body) : undefined,
  });

  const data = await response.json();
  if (import.meta.env.DEV || apiDebug) {
    console.log("[api] response", {
      url,
      status: response.status,
      ok: response.ok,
      data,
    });
  }
  if (!response.ok || data?.success === false) {
    const message = data?.message || "Request failed";
    const error = new Error(message) as Error & { code?: string };
    if (data?.code) {
      error.code = data.code;
    }
    throw error;
  }

  return data as T;
};

export type ApiLanguage = {
  id: string;
  code: string;
  name: string;
  native?: string | null;
  flag?: string | null;
};

export type ApiLevel = {
  id: string;
  code: string;
  name: string;
  title?: string;
  description?: string | null;
};

export type ApiQuestion = {
  id?: string;
  type: "mcq" | "fill" | string;
  question: string;
  emoji?: string | null;
  options?: string[];
  answer: string;
  hint?: string | null;
};

export type ApiLesson = {
  id: string;
  lessonId?: string;
  title: string;
  intro?: string | null;
  description?: string | null;
  emoji?: string | null;
  color?: string | null;
  isPremium?: boolean;
  premium?: boolean;
  words?: Array<{
    word: string;
    translit?: string | null;
    meaning?: string | null;
    emoji?: string | null;
  }>;
  quiz?: ApiQuestion[];
  quizzes?: Array<{ id: string; questions: ApiQuestion[] }>;
};

export type ApiStory = {
  id: string;
  title: string;
  author?: string | null;
  tags?: string[];
  coverEmoji?: string | null;
  coverGradient?: string | null;
  duration?: string | null;
  description?: string | null;
  premium?: boolean;
  isPremium?: boolean;
  stars?: number;
  starsReward?: number;
  pages?: string[] | unknown;
  quizzes?: Array<{ id: string; questions: ApiQuestion[] }>;
  quiz?: ApiQuestion[];
};

export type ApiGame = {
  id: string;
  slug?: string;
  title: string;
  category?: string | null;
  icon?: string | null;
  color?: string | null;
  stars?: number;
  starsReward?: number;
  premium?: boolean;
  isPremium?: boolean;
};

export const contentApi = {
  listLanguages: () => apiFetch<{ languages: ApiLanguage[] }>("/languages"),
  listLevelsForLanguage: (language: string) =>
    apiFetch<{ language: ApiLanguage; levels: ApiLevel[] }>(`/languages/${language}/levels`),
  listLessons: (params: { language?: string; level?: string } = {}) => {
    const search = new URLSearchParams();
    if (params.language) search.set("language", params.language);
    if (params.level) search.set("level", params.level);
    const qs = search.toString();
    return apiFetch<{ lessons: ApiLesson[] }>(`/lessons${qs ? `?${qs}` : ""}`);
  },
  listStories: () => apiFetch<{ stories: ApiStory[] }>("/stories"),
  listGames: () => apiFetch<{ games: ApiGame[] }>("/games"),
  chat: (message: string, token?: string | null) =>
    apiFetch<{ reply: string }>("/chatbot/message", { method: "POST", body: { message } }, token),
  claimReward: (
    body: { stars?: number; coins?: number; xp?: number; reason?: string; sourceType?: string; sourceId?: string },
    token?: string | null,
  ) => apiFetch<{ wallet: unknown }>("/rewards/claim", { method: "POST", body }, token),
  updateProgress: (
    body: {
      contentType: "LESSON" | "STORY" | "GAME" | "LANGUAGE";
      contentId: string;
      progressPercentage: number;
      isCompleted?: boolean;
      score?: number;
      metadata?: Record<string, unknown>;
    },
    token?: string | null,
  ) => apiFetch<{ progress: unknown }>("/progress/update", { method: "POST", body }, token),
  parentDashboard: (token?: string | null) =>
    apiFetch<{ dashboard: { stats?: Record<string, number>; recentActivity?: unknown[] } }>("/parents/dashboard", {}, token),
};

export type ApiPlan = {
  id: string;
  name: string;
  description?: string | null;
  price: number;
  durationDays: number;
  isActive: boolean;
};

export type ApiSubscription = {
  id: string;
  planId: string;
  status: string;
  startDate: string;
  endDate: string;
  plan?: ApiPlan;
};

export type ApiPayment = {
  id: string;
  amount: number;
  status: string;
  razorpayOrderId: string;
  razorpayPaymentId?: string | null;
  createdAt: string;
  subscription?: { plan?: ApiPlan } | null;
};

export type CreateOrderResponse = {
  orderId: string;
  amount: number;
  currency: string;
  planId: string;
  planName: string;
  razorpayKeyId: string;
};

export const subscriptionApi = {
  listPlans: () => apiFetch<{ plans: ApiPlan[] }>("/subscriptions/plans"),
  getCurrent: (token: string | null) =>
    apiFetch<{ subscription: ApiSubscription | null }>("/subscriptions/current", {}, token),
  getStatus: (token: string | null) =>
    apiFetch<{ status: string; subscription: ApiSubscription | null }>("/subscriptions/status", {}, token),
};

export const paymentApi = {
  createOrder: (planId: string, token: string | null) =>
    apiFetch<CreateOrderResponse>(
      "/payments/create-order",
      { method: "POST", body: { planId } },
      token,
    ),
  verifyPayment: (
    body: { razorpayOrderId: string; razorpayPaymentId: string; razorpaySignature: string; planId: string },
    token: string | null,
  ) =>
    apiFetch<{ subscription: ApiSubscription; message: string }>(
      "/payments/verify",
      { method: "POST", body },
      token,
    ),
  getHistory: (token: string | null) =>
    apiFetch<{ payments: ApiPayment[] }>("/payments/history", {}, token),
};

