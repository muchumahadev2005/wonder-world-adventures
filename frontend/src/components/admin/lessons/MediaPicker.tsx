import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Search, Upload, Trash2, Check, Loader2 } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { adminApi, MediaItem } from "@/lib/adminApi";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

interface MediaPickerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelect: (url: string) => void;
  selectedUrl?: string | null;
}

export default function MediaPicker({ open, onOpenChange, onSelect, selectedUrl }: MediaPickerProps) {
  const { token } = useAuth();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [uploading, setUploading] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ["admin-media", page, search],
    queryFn: () => adminApi.listMedia(token, { page, limit: 12, search }),
    enabled: open,
  });

  const uploadMutation = useMutation({
    mutationFn: (file: File) => adminApi.uploadMedia(file, token),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ["admin-media"] });
      toast.success("Media uploaded successfully");
      if (res.media?.url) {
        onSelect(res.media.url);
        onOpenChange(false);
      }
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to upload media");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => adminApi.deleteMedia(id, token),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-media"] });
      toast.success("Media deleted successfully");
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to delete media");
    },
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Only image uploads are allowed currently");
      return;
    }

    setUploading(true);
    uploadMutation.mutate(file, {
      onSettled: () => setUploading(false),
    });
  };

  const mediaItems = data?.media || [];
  const totalPages = data?.pages || 1;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[85vh] flex flex-col p-6 bg-white rounded-2xl shadow-2xl border border-slate-100">
        <DialogHeader className="pb-4 border-b border-slate-100">
          <DialogTitle className="text-xl font-bold text-slate-800 flex items-center gap-2">
            🖼️ Select Media Asset
          </DialogTitle>
        </DialogHeader>

        {/* Toolbar */}
        <div className="flex flex-col sm:flex-row gap-4 py-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
            <Input
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              placeholder="Search images by name..."
              className="pl-10 h-10 border-slate-200 focus:border-indigo-500 focus:ring-indigo-500 bg-slate-50/50 rounded-xl"
            />
          </div>

          <label className="relative flex items-center justify-center px-4 h-10 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white rounded-xl font-medium cursor-pointer shadow-md shadow-indigo-100 transition-all hover:scale-[1.02] active:scale-[0.98]">
            {uploading ? (
              <Loader2 className="w-4 h-4 animate-spin mr-2" />
            ) : (
              <Upload className="w-4 h-4 mr-2" />
            )}
            Upload Image
            <input
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              disabled={uploading}
              className="hidden"
            />
          </label>
        </div>

        {/* Grid Area */}
        <div className="flex-1 min-h-[300px] overflow-y-auto pr-1">
          {isLoading ? (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <div
                  key={i}
                  className="aspect-square bg-slate-100 rounded-xl animate-pulse"
                />
              ))}
            </div>
          ) : mediaItems.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-slate-400">
              <span className="text-4xl mb-3">📁</span>
              <p className="text-sm font-medium">No media files found</p>
              <p className="text-xs text-slate-400 mt-1">Upload an image to start using it in your lessons.</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {mediaItems.map((item) => {
                const isSelected = selectedUrl === item.url;
                return (
                  <div
                    key={item.id}
                    className={`group relative aspect-square rounded-xl overflow-hidden border bg-slate-50 cursor-pointer transition-all hover:shadow-md ${
                      isSelected
                        ? "border-indigo-600 ring-2 ring-indigo-600/20"
                        : "border-slate-100 hover:border-slate-300"
                    }`}
                    onClick={() => {
                      onSelect(item.url);
                      onOpenChange(false);
                    }}
                  >
                    <img
                      src={item.url}
                      alt={item.altText || item.originalName}
                      className="w-full h-full object-cover transition-transform group-hover:scale-105"
                      loading="lazy"
                    />

                    {/* Overlay info */}
                    <div className="absolute inset-0 bg-slate-900/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-2 text-white">
                      <p className="text-[10px] font-semibold truncate leading-tight">
                        {item.originalName}
                      </p>
                      <p className="text-[8px] text-slate-300">
                        {(item.size / 1024).toFixed(1)} KB
                      </p>
                    </div>

                    {/* Status badges */}
                    {isSelected && (
                      <div className="absolute top-2 right-2 w-6 h-6 bg-indigo-600 text-white rounded-full flex items-center justify-center shadow-md">
                        <Check className="w-3.5 h-3.5 stroke-[3]" />
                      </div>
                    )}

                    {/* Delete button */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        if (confirm("Are you sure you want to delete this media?")) {
                          deleteMutation.mutate(item.id);
                        }
                      }}
                      className="absolute top-2 left-2 w-6 h-6 bg-white/95 text-rose-600 rounded-full flex items-center justify-center shadow-md opacity-0 group-hover:opacity-100 hover:bg-rose-50 transition-all"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between pt-4 border-t border-slate-100 mt-4">
            <Button
              variant="outline"
              disabled={page <= 1}
              onClick={() => setPage((p) => p - 1)}
              className="h-8 rounded-lg text-slate-600 border-slate-200"
            >
              Previous
            </Button>
            <span className="text-xs font-semibold text-slate-500">
              Page {page} of {totalPages}
            </span>
            <Button
              variant="outline"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => p + 1)}
              className="h-8 rounded-lg text-slate-600 border-slate-200"
            >
              Next
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
