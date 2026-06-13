import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Image as ImageIcon, Search, Upload, Trash2, Link, Edit2, Check, X, Loader2, FolderOpen } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { adminApi, MediaItem } from "@/lib/adminApi";
import AdminLayout from "@/components/admin/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";

export default function MediaLibrary() {
  const { token } = useAuth();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [folder, setFolder] = useState("");
  const [page, setPage] = useState(1);
  const [uploading, setUploading] = useState(false);

  // Editing state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ altText: "", folder: "" });

  const { data, isLoading } = useQuery({
    queryKey: ["admin-media-library", page, search, folder],
    queryFn: () => adminApi.listMedia(token, { page, limit: 12, search, folder }),
  });

  const uploadMutation = useMutation({
    mutationFn: (file: File) => adminApi.uploadMedia(file, token),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-media-library"] });
      toast.success("Image uploaded successfully!");
    },
    onError: (err: any) => {
      toast.error(err.message || "Upload failed");
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => adminApi.updateMedia(id, data, token),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-media-library"] });
      setEditingId(null);
      toast.success("Media metadata updated");
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to update media");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => adminApi.deleteMedia(id, token),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-media-library"] });
      toast.success("Media item deleted");
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to delete");
    },
  });

  const handleUploadChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    uploadMutation.mutate(file, {
      onSettled: () => setUploading(false),
    });
  };

  const copyUrl = (url: string) => {
    navigator.clipboard.writeText(url);
    toast.success("Copied to clipboard!");
  };

  const startEdit = (item: MediaItem) => {
    setEditForm({
      altText: item.altText || "",
      folder: item.folder || "",
    });
    setEditingId(item.id);
  };

  const saveEdit = (id: string) => {
    updateMutation.mutate({
      id,
      data: {
        altText: editForm.altText.trim() || null,
        folder: editForm.folder.trim() || null,
      },
    });
  };

  const mediaItems = data?.media || [];
  const totalPages = data?.pages || 1;

  return (
    <AdminLayout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-100 pb-5"
        >
          <div>
            <h1 className="text-2xl font-black text-slate-800 flex items-center gap-2.5">
              <span className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">🖼️</span>
              Media Assets Library
            </h1>
            <p className="text-xs font-semibold text-slate-500 mt-1">
              Store and manage illustrations and graphics for learning card slides.
            </p>
          </div>

          <label className="relative flex items-center justify-center px-4 h-10 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white rounded-xl font-bold cursor-pointer shadow-md shadow-indigo-100 transition-all hover:scale-[1.02] active:scale-[0.98]">
            {uploading ? (
              <Loader2 className="w-4.5 h-4.5 animate-spin mr-2" />
            ) : (
              <Upload className="w-4.5 h-4.5 mr-2" />
            )}
            Upload Graphic
            <input
              type="file"
              accept="image/*"
              onChange={handleUploadChange}
              disabled={uploading}
              className="hidden"
            />
          </label>
        </motion.div>

        {/* Toolbar */}
        <div className="flex flex-col sm:flex-row gap-3 bg-white border border-slate-100 p-4 rounded-2xl shadow-sm">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
            <Input
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              placeholder="Search images by filename or alt text..."
              className="pl-11 h-10 border-slate-200 focus:border-indigo-500 bg-slate-50/30 rounded-xl text-sm"
            />
          </div>
          <div className="relative w-full sm:w-60">
            <FolderOpen className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
            <Input
              value={folder}
              onChange={(e) => {
                setFolder(e.target.value);
                setPage(1);
              }}
              placeholder="Filter by folder..."
              className="pl-11 h-10 border-slate-200 focus:border-indigo-500 bg-slate-50/30 rounded-xl text-sm"
            />
          </div>
        </div>

        {/* Grid Asset List */}
        {isLoading ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="h-64 bg-slate-100 border border-slate-100 rounded-2xl animate-pulse" />
            ))}
          </div>
        ) : mediaItems.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-slate-400 bg-white border border-slate-100 rounded-2xl shadow-sm">
            <span className="text-4xl mb-3">📁</span>
            <p className="text-sm font-semibold">No assets found</p>
            <p className="text-xs text-slate-400 mt-1">Upload files using the button above to begin filling the library.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
            {mediaItems.map((item) => {
              const isEditing = editingId === item.id;
              return (
                <Card
                  key={item.id}
                  className="group bg-white border border-slate-150 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
                >
                  {/* Image container */}
                  <div className="aspect-video w-full bg-slate-50 border-b border-slate-100 relative overflow-hidden flex items-center justify-center">
                    <img src={item.url} alt={item.altText || item.fileName} className="w-full h-full object-cover" />
                    <div className="absolute top-2 right-2 flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button
                        size="icon"
                        variant="secondary"
                        onClick={() => copyUrl(item.url)}
                        className="w-8 h-8 rounded-lg bg-white/95 text-indigo-600 hover:bg-indigo-50 shadow-md"
                        title="Copy Link URL"
                      >
                        <Link className="w-3.5 h-3.5" />
                      </Button>
                      <Button
                        size="icon"
                        variant="secondary"
                        onClick={() => {
                          if (confirm("Delete this media graphic?")) {
                            deleteMutation.mutate(item.id);
                          }
                        }}
                        className="w-8 h-8 rounded-lg bg-white/95 text-rose-600 hover:bg-rose-50 shadow-md"
                        title="Delete Graphic"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </div>

                  {/* Body Content Info */}
                  <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                    <div className="space-y-1 min-w-0">
                      <p className="text-xs font-bold text-slate-700 truncate" title={item.originalName}>
                        {item.originalName}
                      </p>
                      <p className="text-[10px] font-mono text-slate-400">
                        {(item.size / 1024).toFixed(1)} KB · {item.mimeType.split("/")[1]?.toUpperCase()}
                      </p>
                    </div>

                    {isEditing ? (
                      /* Inline metadata forms */
                      <div className="space-y-2.5 pt-2 border-t border-slate-100">
                        <div>
                          <Label className="text-[10px] font-bold text-slate-500">Alt Text</Label>
                          <Input
                            value={editForm.altText}
                            onChange={(e) => setEditForm((f) => ({ ...f, altText: e.target.value }))}
                            className="h-8 text-xs mt-0.5 rounded-lg"
                          />
                        </div>
                        <div>
                          <Label className="text-[10px] font-bold text-slate-500">Folder</Label>
                          <Input
                            value={editForm.folder}
                            onChange={(e) => setEditForm((f) => ({ ...f, folder: e.target.value }))}
                            className="h-8 text-xs mt-0.5 rounded-lg"
                          />
                        </div>
                        <div className="flex justify-end gap-1 pt-1">
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => setEditingId(null)}
                            className="w-7 h-7 hover:bg-slate-100 text-slate-400"
                          >
                            <X className="w-3.5 h-3.5" />
                          </Button>
                          <Button
                            size="icon"
                            onClick={() => saveEdit(item.id)}
                            className="w-7 h-7 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg shadow-sm"
                          >
                            <Check className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      </div>
                    ) : (
                      /* Display values */
                      <div className="pt-2 border-t border-slate-100 space-y-2 flex flex-col justify-between flex-1">
                        <div className="text-[11px] leading-relaxed text-slate-500 min-h-[32px]">
                          <span className="font-bold text-slate-400">Alt:</span>{" "}
                          {item.altText || <span className="italic text-slate-300">No alt text specified</span>}
                        </div>
                        <div className="flex justify-between items-center text-[10px]">
                          {item.folder ? (
                            <span className="bg-indigo-50 text-indigo-600 font-semibold px-2 py-0.5 rounded-full border border-indigo-100/40">
                              📁 {item.folder}
                            </span>
                          ) : (
                            <span className="text-slate-300 italic">No folder</span>
                          )}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => startEdit(item)}
                            className="h-7 text-indigo-600 font-bold hover:bg-indigo-50/50 hover:text-indigo-700 px-2 rounded-lg flex items-center gap-1"
                          >
                            <Edit2 className="w-3 h-3" /> Edit
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                </Card>
              );
            })}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between pt-6 border-t border-slate-150 mt-6 bg-white p-4 rounded-2xl shadow-sm border">
            <Button
              variant="outline"
              disabled={page <= 1}
              onClick={() => setPage((p) => p - 1)}
              className="h-9 rounded-xl text-slate-600 border-slate-200"
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
              className="h-9 rounded-xl text-slate-600 border-slate-200"
            >
              Next
            </Button>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
