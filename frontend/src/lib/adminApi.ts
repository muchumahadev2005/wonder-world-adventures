import { apiFetch } from "./api";

const API_BASE = import.meta.env.VITE_SERVER_URL || "https://wonder-world-adventures.onrender.com";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface AdminStats {
  totalUsers: number;
  premiumUsers: number;
  activeSubscriptions: number;
  totalSubscriptions: number;
  totalStories: number;
  totalLessons: number;
  totalRevenue: number;
  monthlyRevenue: number;
  paymentsToday: number;
  totalPayments: number;
  revenueTrend: { date: string; revenue: number }[];
  userGrowth: { date: string; users: number }[];
  activity: ActivityItem[];
}

export interface ActivityItem {
  type: "new_user" | "payment" | "subscription";
  name: string;
  detail: string;
  at: string;
}

export interface AdminUser {
  id: string;
  name: string;
  email: string;
  provider: string[];
  isVerified: boolean;
  createdAt: string;
  profileImage?: string | null;
  subscriptions: Array<{ plan: { name: string }; status: string; endDate: string }>;
}

export interface AdminSubscription {
  id: string;
  userId: string;
  planId: string;
  status: "ACTIVE" | "EXPIRED" | "CANCELLED" | "PENDING";
  startDate: string;
  endDate: string;
  createdAt: string;
  user: { name: string; email: string };
  plan: { name: string; price: number };
  payments: Array<{ id: string; razorpayOrderId: string; razorpayPaymentId?: string; amount: number; status: string }>;
}

export interface AdminPayment {
  id: string;
  userId: string;
  amount: number;
  status: string;
  razorpayOrderId: string;
  razorpayPaymentId?: string | null;
  createdAt: string;
  user: { name: string; email: string };
  subscription?: { plan?: { name: string } } | null;
}

export interface AdminStory {
  id: string;
  slug: string;
  title: string;
  description?: string | null;
  content: string;
  author?: string | null;
  category?: string | null;
  ageGroup?: string | null;
  thumbnail?: string | null;
  coverEmoji?: string | null;
  audioUrl?: string | null;
  readingTime?: number | null;
  duration?: string | null;
  isPremium: boolean;
  isPublished: boolean;
  starsReward: number;
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

export interface AdminLanguage {
  id: string;
  code: string;
  name: string;
  native?: string | null;
  flag?: string | null;
  isActive: boolean;
  sortOrder: number;
  createdAt: string;
}

export interface AdminLesson {
  id: string;
  slug: string;
  title: string;
  description?: string | null;
  intro?: string | null;
  emoji?: string | null;
  color?: string | null;
  category?: string | null;
  isPremium: boolean;
  isPublished: boolean;
  createdAt: string;
  language: { name: string; code: string };
  level: { name: string; code: string };
  _count?: { cards: number; quizzes: number };
}

export interface SubscriptionPlan {
  id: string;
  name: string;
  description?: string | null;
  price: number;
  durationDays: number;
  isActive: boolean;
  createdAt: string;
}

// ─── Mock Data ────────────────────────────────────────────────────────────────

const MOCK_STATS: AdminStats = {
  totalUsers: 342,
  premiumUsers: 87,
  activeSubscriptions: 87,
  totalSubscriptions: 134,
  totalStories: 8,
  totalLessons: 26,
  totalRevenue: 43433,
  monthlyRevenue: 12451,
  paymentsToday: 3,
  totalPayments: 156,
  revenueTrend: [
    { date: "Jun 1", revenue: 4990 },
    { date: "Jun 2", revenue: 2495 },
    { date: "Jun 3", revenue: 7485 },
    { date: "Jun 4", revenue: 4990 },
    { date: "Jun 5", revenue: 9980 },
    { date: "Jun 6", revenue: 2495 },
    { date: "Jun 7", revenue: 4990 },
  ],
  userGrowth: [
    { date: "Jun 1", users: 12 },
    { date: "Jun 2", users: 8 },
    { date: "Jun 3", users: 19 },
    { date: "Jun 4", users: 14 },
    { date: "Jun 5", users: 22 },
    { date: "Jun 6", users: 7 },
    { date: "Jun 7", users: 16 },
  ],
  activity: [
    { type: "new_user", name: "Priya Sharma", detail: "priya@gmail.com", at: new Date(Date.now() - 2 * 60000).toISOString() },
    { type: "payment", name: "Ravi Kumar", detail: "₹499", at: new Date(Date.now() - 15 * 60000).toISOString() },
    { type: "subscription", name: "Anita Patel", detail: "Premium", at: new Date(Date.now() - 30 * 60000).toISOString() },
    { type: "new_user", name: "Deepak Reddy", detail: "deepak@yahoo.com", at: new Date(Date.now() - 45 * 60000).toISOString() },
    { type: "payment", name: "Sunita Singh", detail: "₹999", at: new Date(Date.now() - 90 * 60000).toISOString() },
    { type: "new_user", name: "Arjun Nair", detail: "arjun@hotmail.com", at: new Date(Date.now() - 120 * 60000).toISOString() },
  ],
};

const MOCK_USERS: AdminUser[] = Array.from({ length: 20 }, (_, i) => ({
  id: `user_${i + 1}`,
  name: ["Priya Sharma", "Ravi Kumar", "Anita Patel", "Deepak Reddy", "Sunita Singh", "Arjun Nair", "Kavya Menon", "Rohit Verma"][i % 8],
  email: `user${i + 1}@example.com`,
  provider: i % 3 === 0 ? ["google"] : ["email"],
  isVerified: i % 5 !== 0,
  createdAt: new Date(Date.now() - i * 3 * 24 * 60 * 60 * 1000).toISOString(),
  profileImage: null,
  subscriptions: i % 4 === 0 ? [{ plan: { name: "Premium" }, status: "ACTIVE", endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() }] : [],
}));

const MOCK_SUBSCRIPTIONS: AdminSubscription[] = Array.from({ length: 15 }, (_, i) => ({
  id: `sub_${i + 1}`,
  userId: `user_${i + 1}`,
  planId: "plan_1",
  status: (["ACTIVE", "ACTIVE", "ACTIVE", "EXPIRED", "CANCELLED"] as const)[i % 5],
  startDate: new Date(Date.now() - (i + 1) * 7 * 24 * 60 * 60 * 1000).toISOString(),
  endDate: new Date(Date.now() + (30 - i * 2) * 24 * 60 * 60 * 1000).toISOString(),
  createdAt: new Date(Date.now() - (i + 1) * 7 * 24 * 60 * 60 * 1000).toISOString(),
  user: { name: ["Priya Sharma", "Ravi Kumar", "Anita Patel", "Deepak Reddy", "Sunita Singh"][i % 5], email: `user${i + 1}@example.com` },
  plan: { name: i % 3 === 0 ? "Premium Monthly" : "Premium", price: i % 3 === 0 ? 999 : 499 },
  payments: [{ id: `pay_${i + 1}`, razorpayOrderId: `order_${i + 1}`, razorpayPaymentId: `pay_rzp_${i + 1}`, amount: 499, status: "SUCCESS" }],
}));

const MOCK_PAYMENTS: AdminPayment[] = Array.from({ length: 20 }, (_, i) => ({
  id: `pay_${i + 1}`,
  userId: `user_${i + 1}`,
  amount: [499, 999, 1499][i % 3],
  status: (["SUCCESS", "SUCCESS", "SUCCESS", "PENDING", "FAILED"] as const)[i % 5],
  razorpayOrderId: `order_${Date.now()}_${i}`,
  razorpayPaymentId: i % 5 !== 4 ? `pay_rzp_${i + 1}` : null,
  createdAt: new Date(Date.now() - i * 2 * 24 * 60 * 60 * 1000).toISOString(),
  user: { name: ["Priya Sharma", "Ravi Kumar", "Anita Patel", "Deepak Reddy", "Sunita Singh"][i % 5], email: `user${i + 1}@example.com` },
  subscription: { plan: { name: "Premium" } },
}));

// ─── Admin API Helper ─────────────────────────────────────────────────────────

const adminFetch = async <T>(path: string, options: RequestInit = {}, token?: string | null): Promise<T> => {
  const url = `${API_BASE}/api${path}`;
  const headers = new Headers({ "Content-Type": "application/json" });
  if (token) headers.set("Authorization", `Bearer ${token}`);

  const response = await fetch(url, { ...options, headers });
  const data = await response.json();
  if (!response.ok || data?.success === false) {
    throw new Error(data?.message || "Request failed");
  }
  return data as T;
};

// ─── Admin API ────────────────────────────────────────────────────────────────

export const adminApi = {
  // Stats
  getStats: async (token: string | null): Promise<AdminStats> => {
    try {
      const data = await adminFetch<AdminStats & { success: boolean }>("/admin/stats", {}, token);
      return data;
    } catch {
      return MOCK_STATS;
    }
  },

  // Users
  getUsers: async (token: string | null, params: { page?: number; search?: string } = {}) => {
    try {
      const qs = new URLSearchParams();
      if (params.page) qs.set("page", String(params.page));
      if (params.search) qs.set("search", params.search);
      const data = await adminFetch<{ users: AdminUser[]; total: number }>(`/admin/users?${qs}`, {}, token);
      return data;
    } catch {
      return { users: MOCK_USERS, total: MOCK_USERS.length };
    }
  },

  // Subscriptions
  getSubscriptions: async (token: string | null, params: { page?: number; status?: string } = {}) => {
    try {
      const qs = new URLSearchParams();
      if (params.page) qs.set("page", String(params.page));
      if (params.status) qs.set("status", params.status);
      const data = await adminFetch<{ subscriptions: AdminSubscription[]; total: number }>(`/admin/subscriptions?${qs}`, {}, token);
      return data;
    } catch {
      const filtered = params.status ? MOCK_SUBSCRIPTIONS.filter(s => s.status === params.status) : MOCK_SUBSCRIPTIONS;
      return { subscriptions: filtered, total: filtered.length };
    }
  },

  updateSubscriptionStatus: async (id: string, status: string, token: string | null) => {
    return adminFetch(`/admin/subscriptions/${id}`, { method: "PATCH", body: JSON.stringify({ status }) }, token);
  },

  // Payments
  getPayments: async (token: string | null, params: { page?: number; status?: string } = {}) => {
    try {
      const qs = new URLSearchParams();
      if (params.page) qs.set("page", String(params.page));
      if (params.status) qs.set("status", params.status);
      const data = await adminFetch<{ payments: AdminPayment[]; total: number }>(`/admin/payments?${qs}`, {}, token);
      return data;
    } catch {
      const filtered = params.status ? MOCK_PAYMENTS.filter(p => p.status === params.status) : MOCK_PAYMENTS;
      return { payments: filtered, total: filtered.length };
    }
  },

  // Stories (real API)
  getStories: async () => {
    const data = await apiFetch<{ stories: AdminStory[] }>("/stories");
    return data.stories;
  },
  createStory: async (body: Partial<AdminStory>, token: string | null) =>
    adminFetch<{ story: AdminStory }>("/stories", { method: "POST", body: JSON.stringify(body) }, token),
  updateStory: async (id: string, body: Partial<AdminStory>, token: string | null) =>
    adminFetch<{ story: AdminStory }>(`/stories/${id}`, { method: "PUT", body: JSON.stringify(body) }, token),
  deleteStory: async (id: string, token: string | null) =>
    adminFetch<{ success: boolean }>(`/stories/${id}`, { method: "DELETE" }, token),

  // Languages (real API)
  getLanguages: async () => {
    const data = await apiFetch<{ languages: AdminLanguage[] }>("/languages");
    return data.languages;
  },

  // Lessons (real API)
  getLessons: async () => {
    const data = await apiFetch<{ lessons: AdminLesson[] }>("/lessons");
    return data.lessons;
  },

  // Plans (real API)
  getPlans: async () => {
    const data = await apiFetch<{ plans: SubscriptionPlan[] }>("/subscriptions/plans");
    return data.plans;
  },

  // Admin login
  login: async (email: string, password: string) => {
    const data = await apiFetch<{ user: { id: string; name: string; email: string; isVerified: boolean; provider: string[]; createdAt: string }; token: string }>(
      "/auth/login",
      { method: "POST", body: { email, password } as never }
    );
    if (data.user.email !== "admin@storynest.com") {
      throw new Error("Not an admin account");
    }
    return data;
  },
};

export const ADMIN_EMAIL = "admin@storynest.com";
export const isAdminUser = (email?: string | null) => email === ADMIN_EMAIL;
