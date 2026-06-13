import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { adminApi } from "@/lib/adminApi";
import AdminLayout from "@/components/admin/AdminLayout";
import LessonBuilder from "@/components/admin/lessons/LessonBuilder";

export default function LessonBuilderPage() {
  const { id } = useParams<{ id: string }>();
  const { token } = useAuth();
  const isEdit = !!id;

  const { data, isLoading, isError } = useQuery({
    queryKey: ["admin-lesson-detail", id],
    queryFn: () => adminApi.getAdminLesson(id!, token),
    enabled: isEdit,
  });

  const lesson = data?.lesson || null;

  return (
    <AdminLayout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center min-h-[400px] text-slate-400 bg-white border border-slate-100 rounded-2xl shadow-sm">
            <Loader2 className="w-10 h-10 animate-spin text-indigo-500 mb-4" />
            <p className="text-sm font-semibold text-slate-700">Loading lesson content...</p>
            <p className="text-xs text-slate-400 mt-1">Retrieving drafts, card records, and quizzes</p>
          </div>
        ) : isError ? (
          <div className="flex flex-col items-center justify-center min-h-[400px] text-rose-500 bg-white border border-slate-100 rounded-2xl shadow-sm">
            <span className="text-4xl mb-3">⚠️</span>
            <p className="text-sm font-bold">Failed to load lesson</p>
            <p className="text-xs text-slate-400 mt-1">Please verify the lesson exists and that you have administrator credentials.</p>
          </div>
        ) : (
          <LessonBuilder initialData={lesson} isEdit={isEdit} />
        )}
      </div>
    </AdminLayout>
  );
}
