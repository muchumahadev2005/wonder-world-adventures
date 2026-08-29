/**
 * lifeSkillsApi.ts — API client for Life Skills Practice section.
 */

const API_BASE = import.meta.env.VITE_SERVER_URL || "https://wonder-world-adventures.onrender.com";

async function lifeFetch<T>(path: string, options: RequestInit = {}, token?: string | null): Promise<T> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
  const res = await fetch(`${API_BASE}/api${path}`, { ...options, headers });
  const data = await res.json();
  if (!res.ok || data?.success === false) {
    throw new Error(data?.message || "API error");
  }
  return data as T;
}

// ── Types ─────────────────────────────────────────────────────────

export interface LifeSkillScenario {
  id: string;
  slug: string;
  title: string;
  description: string;
  icon: string;
  characterName: string;
  characterAvatar?: string | null;
  coverGradient: string;
  systemPrompt?: string;
  modelName?: string | null;
  hasCustomApiKey?: boolean;
  apiKeyMasked?: string | null;
  maxWords: number;
  isActive: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

export interface ChatHistoryItem {
  role: "user" | "assistant";
  content: string;
}

// ── Public APIs ───────────────────────────────────────────────────

export const lifeSkillsApi = {
  /** Fetch all active scenarios */
  listScenarios: async (): Promise<LifeSkillScenario[]> => {
    const data = await lifeFetch<{ success: boolean; scenarios: LifeSkillScenario[] }>("/life-skills");
    return data.scenarios;
  },

  /** Fetch single scenario by slug */
  getScenario: async (slug: string): Promise<LifeSkillScenario> => {
    const data = await lifeFetch<{ success: boolean; scenario: LifeSkillScenario }>(`/life-skills/${slug}`);
    return data.scenario;
  },

  /** Send a message to scenario character (direct LLM, no RAG) */
  chat: async (
    slug: string,
    message: string,
    history: ChatHistoryItem[] = []
  ): Promise<{ reply: string; model: string }> => {
    const data = await lifeFetch<{ success: boolean; reply: string; model: string }>(
      `/life-skills/${slug}/chat`,
      { method: "POST", body: JSON.stringify({ message, history }) }
    );
    return { reply: data.reply, model: data.model };
  },
};

// ── Admin APIs ────────────────────────────────────────────────────

export const lifeSkillsAdminApi = {
  listAll: async (token: string | null): Promise<LifeSkillScenario[]> => {
    const data = await lifeFetch<{ success: boolean; scenarios: LifeSkillScenario[] }>(
      "/admin/life-skills",
      {},
      token
    );
    return data.scenarios;
  },

  create: async (data: Partial<LifeSkillScenario> & { apiKey?: string }, token: string | null) => {
    return lifeFetch<{ success: boolean; scenario: LifeSkillScenario; message: string }>(
      "/admin/life-skills",
      { method: "POST", body: JSON.stringify(data) },
      token
    );
  },

  update: async (id: string, data: Partial<LifeSkillScenario> & { apiKey?: string }, token: string | null) => {
    return lifeFetch<{ success: boolean; scenario: LifeSkillScenario; message: string }>(
      `/admin/life-skills/${id}`,
      { method: "PUT", body: JSON.stringify(data) },
      token
    );
  },

  delete: async (id: string, token: string | null) => {
    return lifeFetch<{ success: boolean; message: string }>(
      `/admin/life-skills/${id}`,
      { method: "DELETE" },
      token
    );
  },
};
