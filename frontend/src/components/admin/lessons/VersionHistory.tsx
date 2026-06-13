import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { History, ArrowLeft, RotateCcw, User, Calendar, Loader2, ClipboardList } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { adminApi, LessonVersion } from "@/lib/adminApi";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface VersionHistoryProps {
  lessonId: string;
  lessonTitle: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function VersionHistory({ lessonId, lessonTitle, open, onOpenChange }: VersionHistoryProps) {
  const { token } = useAuth();
  const queryClient = useQueryClient();
  const [selectedVersionNum, setSelectedVersionNum] = useState<number | null>(null);

  // List all versions
  const { data: versionsData, isLoading } = useQuery({
    queryKey: ["admin-lesson-versions", lessonId],
    queryFn: () => adminApi.getLessonVersions(lessonId, token),
    enabled: open && !!lessonId,
  });

  // Get specific version details (snapshot)
  const { data: detailData, isLoading: isLoadingDetail } = useQuery({
    queryKey: ["admin-lesson-version-detail", lessonId, selectedVersionNum],
    queryFn: () => adminApi.getLessonVersion(lessonId, selectedVersionNum!, token),
    enabled: open && !!lessonId && selectedVersionNum !== null,
  });

  const restoreMutation = useMutation({
    mutationFn: (versionNum: number) => adminApi.restoreLessonVersion(lessonId, versionNum, token),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-lessons"] });
      queryClient.invalidateQueries({ queryKey: ["admin-lesson-detail", lessonId] });
      toast.success(`Restored version successfully`);
      onOpenChange(false);
      setSelectedVersionNum(null);
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to restore version");
    },
  });

  const versions = versionsData?.versions || [];
  const snapshot: any = detailData?.version?.snapshot;

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl p-6 bg-white rounded-2xl shadow-2xl border border-slate-100 flex flex-col max-h-[85vh]">
        <DialogHeader className="pb-3 border-b border-slate-100">
          <DialogTitle className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <History className="w-5 h-5 text-indigo-600" />
            Version History — {lessonTitle}
          </DialogTitle>
        </DialogHeader>

        {isLoading ? (
          <div className="flex-1 flex flex-col items-center justify-center py-20 text-slate-400">
            <Loader2 className="w-8 h-8 animate-spin text-indigo-500 mb-2" />
            <p className="text-sm font-medium">Loading version records...</p>
          </div>
        ) : selectedVersionNum === null ? (
          /* TIMELINE VIEW */
          <div className="flex-1 overflow-y-auto py-4 pr-1">
            {versions.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-slate-400">
                <span className="text-3xl mb-2">📜</span>
                <p className="text-sm font-semibold">No version backups found</p>
                <p className="text-xs text-slate-500 mt-1">
                  Updates to a lesson auto-generate versions for rollback recovery.
                </p>
              </div>
            ) : (
              <div className="space-y-6 relative before:absolute before:left-6 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-100">
                {versions.map((ver) => (
                  <div key={ver.id} className="flex gap-4 relative">
                    {/* Circle Node */}
                    <div className="w-12 h-12 rounded-full bg-slate-50 border border-slate-200 flex items-center justify-center font-bold text-slate-700 shadow-sm z-10 flex-shrink-0">
                      v{ver.version}
                    </div>

                    {/* Content Box */}
                    <div className="flex-1 bg-slate-50/50 border border-slate-150 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all hover:bg-slate-50">
                      <div className="space-y-1.5">
                        <p className="font-bold text-slate-800 text-sm">
                          {ver.changeNote || "Modified lesson content details"}
                        </p>
                        <div className="flex items-center gap-4 text-xs text-slate-500">
                          <span className="flex items-center gap-1">
                            <User className="w-3.5 h-3.5 text-slate-400" />
                            {ver.createdBy || "System"}
                          </span>
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3.5 h-3.5 text-slate-400" />
                            {formatDate(ver.createdAt)}
                          </span>
                        </div>
                      </div>

                      <div className="flex gap-2 self-end sm:self-center">
                        <Button
                          variant="outline"
                          onClick={() => setSelectedVersionNum(ver.version)}
                          className="h-8 rounded-lg text-xs font-semibold px-3 border-slate-200 hover:bg-white shadow-sm"
                        >
                          View Snapshot
                        </Button>
                        <Button
                          onClick={() => {
                            if (confirm(`Are you sure you want to rollback to Version ${ver.version}?`)) {
                              restoreMutation.mutate(ver.version);
                            }
                          }}
                          className="bg-indigo-600 hover:bg-indigo-700 text-white h-8 rounded-lg text-xs font-bold px-3 shadow"
                        >
                          Restore
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          /* SNAPSHOT DETAIL VIEW */
          <div className="flex-1 flex flex-col overflow-hidden py-4">
            <Button
              variant="ghost"
              onClick={() => setSelectedVersionNum(null)}
              className="text-xs font-semibold text-slate-500 hover:text-slate-700 p-0 h-8 gap-1 self-start mb-4 hover:bg-transparent"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Back to timeline
            </Button>

            {isLoadingDetail ? (
              <div className="flex-1 flex flex-col items-center justify-center text-slate-400">
                <Loader2 className="w-8 h-8 animate-spin text-indigo-500 mb-2" />
                <p className="text-sm font-medium">Loading snapshot details...</p>
              </div>
            ) : snapshot ? (
              <div className="flex-1 overflow-y-auto space-y-5 pr-1">
                {/* Snapshot header */}
                <div className="bg-slate-50 border border-slate-250 p-4 rounded-2xl flex items-center justify-between">
                  <div>
                    <h4 className="font-extrabold text-slate-800 text-base">Version {selectedVersionNum} Snapshot</h4>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Back-up state created on {formatDate(detailData.version.createdAt)}
                    </p>
                  </div>
                  <Button
                    onClick={() => {
                      if (confirm(`Are you sure you want to rollback to Version ${selectedVersionNum}?`)) {
                        restoreMutation.mutate(selectedVersionNum);
                      }
                    }}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow font-bold"
                  >
                    <RotateCcw className="w-4 h-4 mr-1.5" /> Restore This Version
                  </Button>
                </div>

                {/* Grid details */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-white border border-slate-100 p-4 rounded-2xl space-y-3">
                    <h5 className="font-bold text-slate-800 text-xs uppercase tracking-wider flex items-center gap-1 border-b pb-1.5">
                      📖 Metadata & Details
                    </h5>
                    <div className="text-xs space-y-1.5 text-slate-600">
                      <p className="flex justify-between">
                        <span>Lesson Title:</span> <span className="font-semibold text-slate-800">{snapshot.title}</span>
                      </p>
                      <p className="flex justify-between">
                        <span>Intro Text:</span> <span className="text-slate-800">{snapshot.intro || "—"}</span>
                      </p>
                      <p className="flex justify-between">
                        <span>Status:</span> <span className="text-slate-800 capitalize font-medium">{snapshot.status}</span>
                      </p>
                      <p className="flex justify-between">
                        <span>Premium:</span> <span className="text-slate-800">{snapshot.isPremium ? "Yes 👑" : "No"}</span>
                      </p>
                    </div>
                  </div>

                  <div className="bg-white border border-slate-100 p-4 rounded-2xl space-y-3">
                    <h5 className="font-bold text-slate-800 text-xs uppercase tracking-wider flex items-center gap-1 border-b pb-1.5">
                      <ClipboardList className="w-4 h-4" /> Lesson Structure
                    </h5>
                    <div className="text-xs space-y-1.5 text-slate-600">
                      <p className="flex justify-between">
                        <span>Total Cards:</span>{" "}
                        <span className="font-semibold text-slate-800">{snapshot.cards?.length || 0}</span>
                      </p>
                      <p className="flex justify-between">
                        <span>Quiz Questions:</span>{" "}
                        <span className="font-semibold text-slate-800">
                          {snapshot.quizzes?.[0]?.questions?.length || 0}
                        </span>
                      </p>
                    </div>
                  </div>
                </div>

                {/* Cards List in Snapshot */}
                {snapshot.cards && snapshot.cards.length > 0 && (
                  <div className="space-y-2.5">
                    <h5 className="font-bold text-slate-800 text-xs uppercase tracking-wider">
                      Snapshot Cards ({snapshot.cards.length})
                    </h5>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {snapshot.cards.map((c: any, idx: number) => (
                        <div key={c.id || idx} className="p-3 bg-slate-50 border border-slate-100 rounded-xl flex items-center gap-3">
                          <div className="w-9 h-9 bg-white border border-slate-200 flex items-center justify-center text-lg rounded-lg overflow-hidden flex-shrink-0">
                            {c.imageUrl ? <img src={c.imageUrl} className="w-full h-full object-cover" /> : c.emoji || "📚"}
                          </div>
                          <div className="min-w-0">
                            <p className="text-xs font-bold text-slate-800 truncate">{c.word}</p>
                            <p className="text-[10px] text-slate-400 italic truncate">{c.translit || "No Subtitle"}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-slate-400">
                <p>Failed to load snapshot details.</p>
              </div>
            )}
          </div>
        )}

        <DialogFooter className="pt-3 border-t border-slate-100">
          <Button
            variant="outline"
            onClick={() => {
              onOpenChange(false);
              setSelectedVersionNum(null);
            }}
            className="rounded-xl border-slate-200"
          >
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
