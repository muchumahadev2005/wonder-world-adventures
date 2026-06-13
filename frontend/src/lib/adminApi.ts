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
  lessonCode?: string | null;
  slug: string;
  title: string;
  description?: string | null;
  intro?: string | null;
  emoji?: string | null;
  color?: string | null;
  category?: string | null;
  tags?: string[];
  status?: string;
  isPremium: boolean;
  isPublished: boolean;
  sortOrder?: number;
  archivedAt?: string | null;
  publishedAt?: string | null;
  createdAt: string;
  updatedAt?: string;
  language: { id?: string; name: string; code: string };
  level: { id?: string; name: string; code: string };
  _count?: { cards: number; quizQuestions?: number };
}

export interface AdminLessonFull extends AdminLesson {
  languageId?: string;
  levelId?: string;
  cards: AdminLessonCard[];
  quizzes: AdminQuizFull[];
  versions?: LessonVersion[];
}

export interface AdminLessonCard {
  id: string;
  word: string;
  translit?: string | null;
  meaning?: string | null;
  emoji?: string | null;
  imageUrl?: string | null;
  sortOrder: number;
}

export interface AdminQuizFull {
  id: string;
  title: string;
  questions: AdminQuizQuestion[];
}

export interface AdminQuizQuestion {
  id: string;
  question: string;
  options?: string[] | null;
  answer: string;
  explanation?: string | null;
  emoji?: string | null;
  hint?: string | null;
  type: string;
  points: number;
  sortOrder: number;
}

export interface LessonVersion {
  id: string;
  version: number;
  changeNote?: string | null;
  createdBy?: string | null;
  createdAt: string;
  snapshot?: unknown;
}

export interface ImportAuditEntry {
  id: string;
  importType: string;
  fileName?: string | null;
  importedBy: string;
  totalRecords: number;
  successCount: number;
  failureCount: number;
  errors?: unknown[] | null;
  status: string;
  createdAt: string;
}

export interface ContentAnalytics {
  totalLessons: number;
  totalCards: number;
  totalQuizQuestions: number;
  draftLessons: number;
  publishedLessons: number;
  archivedLessons: number;
  premiumLessons: number;
  freeLessons: number;
  byLanguage: { code: string; name: string; count: number }[];
  byLevel: { code: string; name: string; count: number }[];
}

export interface MediaItem {
  id: string;
  fileName: string;
  originalName: string;
  mimeType: string;
  size: number;
  url: string;
  provider: string;
  folder?: string | null;
  altText?: string | null;
  createdAt: string;
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

  getLevelsForLanguage: async (langId: string) => {
    const data = await apiFetch<{ language: any; levels: any[] }>(`/languages/${langId}/levels`);
    return data;
  },

  // Lessons (real API)
  getLessons: async () => {
    const data = await apiFetch<{ lessons: AdminLesson[] }>("/lessons");
    return data.lessons;
  },

  // Lesson CMS
  getAdminLessons: async (token: string | null, params: { page?: number; limit?: number; search?: string; language?: string; level?: string; status?: string; premium?: boolean } = {}) => {
    const qs = new URLSearchParams();
    if (params.page) qs.set("page", String(params.page));
    if (params.limit) qs.set("limit", String(params.limit));
    if (params.search) qs.set("search", params.search);
    if (params.language) qs.set("language", params.language);
    if (params.level) qs.set("level", params.level);
    if (params.status) qs.set("status", params.status);
    if (params.premium !== undefined) qs.set("premium", String(params.premium));
    return adminFetch<{ lessons: AdminLesson[]; total: number; pages: number }>(`/admin/lessons?${qs}`, {}, token);
  },

  getAdminLesson: async (id: string, token: string | null) => {
    return adminFetch<{ lesson: AdminLessonFull }>(`/admin/lessons/${id}`, {}, token);
  },

  createLesson: async (body: Partial<AdminLessonFull>, token: string | null) => {
    return adminFetch<{ lesson: AdminLessonFull }>("/admin/lessons", { method: "POST", body: JSON.stringify(body) }, token);
  },

  updateLesson: async (id: string, body: Partial<AdminLessonFull>, token: string | null) => {
    return adminFetch<{ lesson: AdminLessonFull }>(`/admin/lessons/${id}`, { method: "PUT", body: JSON.stringify(body) }, token);
  },

  deleteLesson: async (id: string, token: string | null) => {
    return adminFetch<{ success: boolean; message: string }>(`/admin/lessons/${id}`, { method: "DELETE" }, token);
  },

  duplicateLesson: async (id: string, token: string | null) => {
    return adminFetch<{ lesson: AdminLessonFull }>(`/admin/lessons/${id}/duplicate`, { method: "POST" }, token);
  },

  archiveLesson: async (id: string, token: string | null) => {
    return adminFetch<{ lesson: AdminLessonFull }>(`/admin/lessons/${id}/archive`, { method: "POST" }, token);
  },

  restoreLesson: async (id: string, token: string | null) => {
    return adminFetch<{ lesson: AdminLessonFull }>(`/admin/lessons/${id}/restore`, { method: "POST" }, token);
  },

  publishLesson: async (id: string, token: string | null) => {
    return adminFetch<{ lesson: AdminLessonFull }>(`/admin/lessons/${id}/publish`, { method: "POST" }, token);
  },

  // Cards
  addCard: async (lessonId: string, card: Omit<AdminLessonCard, "id">, token: string | null) => {
    return adminFetch<{ card: AdminLessonCard }>(`/admin/lessons/${lessonId}/cards`, { method: "POST", body: JSON.stringify(card) }, token);
  },

  updateCard: async (lessonId: string, cardId: string, card: Partial<AdminLessonCard>, token: string | null) => {
    return adminFetch<{ card: AdminLessonCard }>(`/admin/lessons/${lessonId}/cards/${cardId}`, { method: "PUT", body: JSON.stringify(card) }, token);
  },

  deleteCard: async (lessonId: string, cardId: string, token: string | null) => {
    return adminFetch<{ success: boolean; message: string }>(`/admin/lessons/${lessonId}/cards/${cardId}`, { method: "DELETE" }, token);
  },

  reorderCards: async (lessonId: string, items: { id: string; sortOrder: number }[], token: string | null) => {
    return adminFetch<{ success: boolean; message: string }>(`/admin/lessons/${lessonId}/cards-reorder`, { method: "PUT", body: JSON.stringify({ items }) }, token);
  },

  // Quiz
  addQuizQuestion: async (lessonId: string, question: Omit<AdminQuizQuestion, "id" | "sortOrder"> & { sortOrder?: number }, token: string | null) => {
    return adminFetch<{ question: AdminQuizQuestion }>(`/admin/lessons/${lessonId}/quiz`, { method: "POST", body: JSON.stringify(question) }, token);
  },

  updateQuizQuestion: async (lessonId: string, qId: string, question: Partial<AdminQuizQuestion>, token: string | null) => {
    return adminFetch<{ question: AdminQuizQuestion }>(`/admin/lessons/${lessonId}/quiz/${qId}`, { method: "PUT", body: JSON.stringify(question) }, token);
  },

  deleteQuizQuestion: async (lessonId: string, qId: string, token: string | null) => {
    return adminFetch<{ success: boolean; message: string }>(`/admin/lessons/${lessonId}/quiz/${qId}`, { method: "DELETE" }, token);
  },

  // Import / Export
  importJson: async (data: unknown, token: string | null) => {
    return adminFetch<{ success: boolean; totalRecords: number; successCount: number; failureCount: number; errors?: any[] }>("/admin/lessons/import/json", { method: "POST", body: JSON.stringify(data) }, token);
  },

  importExcel: async (file: File, token: string | null) => {
    const formData = new FormData();
    formData.append("file", file);
    const url = `${API_BASE}/api/admin/lessons/import/excel`;
    const headers = new Headers();
    if (token) headers.set("Authorization", `Bearer ${token}`);
    const response = await fetch(url, { method: "POST", body: formData, headers });
    const data = await response.json();
    if (!response.ok || data?.success === false) {
      throw new Error(data?.message || "Excel import failed");
    }
    return data;
  },

  exportJson: async (params: { language?: string; level?: string; lessonId?: string } = {}, token: string | null) => {
    const qs = new URLSearchParams();
    if (params.language) qs.set("language", params.language);
    if (params.level) qs.set("level", params.level);
    if (params.lessonId) qs.set("lessonId", params.lessonId);
    return adminFetch<{ success: boolean; data: any }>(`/admin/lessons/export/json?${qs}`, {}, token);
  },

  exportExcelUrl: (params: { language?: string; level?: string; lessonId?: string } = {}, token: string | null) => {
    const qs = new URLSearchParams();
    if (params.language) qs.set("language", params.language);
    if (params.level) qs.set("level", params.level);
    if (params.lessonId) qs.set("lessonId", params.lessonId);
    if (token) qs.set("token", token);
    return `${API_BASE}/api/admin/lessons/export/excel?${qs}`;
  },

  downloadExcelTemplateUrl: (token: string | null) => {
    const qs = new URLSearchParams();
    if (token) qs.set("token", token);
    return `${API_BASE}/api/admin/lessons/template/excel?${qs}`;
  },

  // Versioning
  getLessonVersions: async (lessonId: string, token: string | null) => {
    return adminFetch<{ versions: LessonVersion[] }>(`/admin/lessons/${lessonId}/versions`, {}, token);
  },

  getLessonVersion: async (lessonId: string, version: number, token: string | null) => {
    return adminFetch<{ version: LessonVersion }>(`/admin/lessons/${lessonId}/versions/${version}`, {}, token);
  },

  restoreLessonVersion: async (lessonId: string, version: number, token: string | null) => {
    return adminFetch<{ lesson: AdminLessonFull }>(`/admin/lessons/${lessonId}/versions/${version}/restore`, { method: "POST" }, token);
  },

  // Analytics
  getContentAnalytics: async (token: string | null) => {
    return adminFetch<ContentAnalytics & { success: boolean }>("/admin/lessons/analytics", {}, token);
  },

  // Audit
  getImportHistory: async (token: string | null, params: { page?: number; limit?: number } = {}) => {
    const qs = new URLSearchParams();
    if (params.page) qs.set("page", String(params.page));
    if (params.limit) qs.set("limit", String(params.limit));
    return adminFetch<{ imports: ImportAuditEntry[]; total: number; pages: number }>(`/admin/imports?${qs}`, {}, token);
  },

  // Media
  listMedia: async (token: string | null, params: { page?: number; limit?: number; search?: string; folder?: string } = {}) => {
    const qs = new URLSearchParams();
    if (params.page) qs.set("page", String(params.page));
    if (params.limit) qs.set("limit", String(params.limit));
    if (params.search) qs.set("search", params.search);
    if (params.folder) qs.set("folder", params.folder);
    return adminFetch<{ media: MediaItem[]; total: number; pages: number }>(`/admin/media?${qs}`, {}, token);
  },

  uploadMedia: async (file: File, token: string | null) => {
    const formData = new FormData();
    formData.append("file", file);
    const url = `${API_BASE}/api/admin/media`;
    const headers = new Headers();
    if (token) headers.set("Authorization", `Bearer ${token}`);
    const response = await fetch(url, { method: "POST", body: formData, headers });
    const data = await response.json();
    if (!response.ok || data?.success === false) {
      throw new Error(data?.message || "Media upload failed");
    }
    return data as { success: boolean; media: MediaItem };
  },

  deleteMedia: async (id: string, token: string | null) => {
    return adminFetch<{ success: boolean; message: string }>(`/admin/media/${id}`, { method: "DELETE" }, token);
  },

  updateMedia: async (id: string, data: { altText?: string; folder?: string }, token: string | null) => {
    return adminFetch<{ success: boolean; media: MediaItem }>(`/admin/media/${id}`, { method: "PUT", body: JSON.stringify(data) }, token);
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

