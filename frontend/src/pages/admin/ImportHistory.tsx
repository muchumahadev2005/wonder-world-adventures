import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { FileUp, Calendar, User, FileSpreadsheet, FileCode, CheckCircle, AlertTriangle, XCircle, ChevronDown, ChevronUp } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { adminApi, ImportAuditEntry } from "@/lib/adminApi";
import AdminLayout from "@/components/admin/AdminLayout";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

export default function ImportHistory() {
  const { token } = useAuth();
  const [page, setPage] = useState(1);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["admin-import-history", page],
    queryFn: () => adminApi.getImportHistory(token, { page, limit: 10 }),
  });

  const toggleRow = (id: string) => {
    setExpandedId(expandedId === id ? null : id);
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const auditEntries = data?.imports || [];
  const totalPages = data?.pages || 1;

  return (
    <AdminLayout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="border-b border-slate-100 pb-5"
        >
          <h1 className="text-2xl font-black text-slate-800 flex items-center gap-2.5">
            <span className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">📋</span>
            Bulk Import History
          </h1>
          <p className="text-xs font-semibold text-slate-500 mt-1">
            Audit logs for bulk Excel templates and JSON payloads imported into the system.
          </p>
        </motion.div>

        {/* List Table */}
        {isLoading ? (
          <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-sm space-y-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-12 bg-slate-50 rounded-xl animate-pulse" />
            ))}
          </div>
        ) : auditEntries.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-slate-400 bg-white border border-slate-100 rounded-2xl shadow-sm">
            <span className="text-4xl mb-3">📭</span>
            <p className="text-sm font-semibold">No import history found</p>
            <p className="text-xs text-slate-400 mt-1">Audit logs will be displayed once bulk spreadsheets are processed.</p>
          </div>
        ) : (
          <div className="bg-white border border-slate-150 rounded-2xl overflow-hidden shadow-sm">
            <Table>
              <TableHeader className="bg-slate-50">
                <TableRow>
                  <TableHead className="w-10" />
                  <TableHead className="text-xs font-bold">Import Date</TableHead>
                  <TableHead className="text-xs font-bold">Type</TableHead>
                  <TableHead className="text-xs font-bold">File Name</TableHead>
                  <TableHead className="text-xs font-bold">Imported By</TableHead>
                  <TableHead className="text-xs font-bold text-center">Total</TableHead>
                  <TableHead className="text-xs font-bold text-center text-emerald-600">Success</TableHead>
                  <TableHead className="text-xs font-bold text-center text-rose-600">Failed</TableHead>
                  <TableHead className="text-xs font-bold text-center">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {auditEntries.map((log) => {
                  const isExpanded = expandedId === log.id;
                  const statusColors = {
                    completed: "bg-emerald-50 text-emerald-700 border-emerald-200",
                    partial: "bg-amber-50 text-amber-700 border-amber-200",
                    failed: "bg-rose-50 text-rose-700 border-rose-200",
                  }[log.status] || "bg-slate-50 text-slate-700 border-slate-200";

                  const StatusIcon = {
                    completed: CheckCircle,
                    partial: AlertTriangle,
                    failed: XCircle,
                  }[log.status] || AlertTriangle;

                  return (
                    <>
                      <TableRow
                        key={log.id}
                        className="cursor-pointer hover:bg-slate-50/50 transition-colors"
                        onClick={() => toggleRow(log.id)}
                      >
                        <TableCell className="p-3 text-center">
                          {isExpanded ? (
                            <ChevronUp className="w-4 h-4 text-slate-400" />
                          ) : (
                            <ChevronDown className="w-4 h-4 text-slate-400" />
                          )}
                        </TableCell>
                        <TableCell className="text-xs font-medium text-slate-700">
                          <span className="flex items-center gap-1.5">
                            <Calendar className="w-3.5 h-3.5 text-slate-400" />
                            {formatDate(log.createdAt)}
                          </span>
                        </TableCell>
                        <TableCell className="text-xs font-semibold">
                          <span className="flex items-center gap-1.5">
                            {log.importType === "excel" ? (
                              <>
                                <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" /> Excel
                              </>
                            ) : (
                              <>
                                <FileCode className="w-3.5 h-3.5 text-indigo-600" /> JSON
                              </>
                            )}
                          </span>
                        </TableCell>
                        <TableCell className="text-xs font-semibold text-slate-700 truncate max-w-xs">
                          {log.fileName || <span className="italic text-slate-400">Direct Payload</span>}
                        </TableCell>
                        <TableCell className="text-xs text-slate-600">
                          <span className="flex items-center gap-1">
                            <User className="w-3 h-3 text-slate-400" />
                            {log.importedBy}
                          </span>
                        </TableCell>
                        <TableCell className="text-xs text-center font-bold text-slate-800">
                          {log.totalRecords}
                        </TableCell>
                        <TableCell className="text-xs text-center font-bold text-emerald-600 bg-emerald-50/20">
                          {log.successCount}
                        </TableCell>
                        <TableCell className="text-xs text-center font-bold text-rose-600 bg-rose-50/20">
                          {log.failureCount}
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge className={`${statusColors} border text-[10px] px-2 py-0.5 shadow-none rounded-full flex items-center gap-1 w-fit mx-auto font-bold uppercase`}>
                            <StatusIcon className="w-3 h-3" />
                            {log.status}
                          </Badge>
                        </TableCell>
                      </TableRow>

                      {/* Expanded error log row */}
                      {isExpanded && log.errors && (log.errors as any[]).length > 0 && (
                        <TableRow className="bg-slate-50/30 hover:bg-slate-50/30">
                          <TableCell colSpan={9} className="p-4 border-t border-slate-100">
                            <motion.div
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: "auto" }}
                              exit={{ opacity: 0, height: 0 }}
                              className="pl-8 space-y-2 border-l-2 border-rose-300"
                            >
                              <h4 className="text-xs font-bold text-rose-800">
                                Import Error Details ({(log.errors as any[]).length} failed items)
                              </h4>
                              <div className="max-h-60 overflow-y-auto space-y-1.5 pr-2">
                                {(log.errors as any[]).map((err, idx) => (
                                  <div
                                    key={idx}
                                    className="text-[11px] p-2.5 bg-white border border-rose-100 rounded-lg text-rose-700 shadow-sm flex items-start gap-2"
                                  >
                                    <span className="font-bold bg-rose-50 text-rose-600 px-1.5 py-0.5 rounded text-[9px] flex-shrink-0 mt-0.5">
                                      Index {err.index ?? idx}
                                    </span>
                                    <div>
                                      <p className="font-bold text-slate-800 leading-normal">{err.title || err.lessonCode || "Unknown Lesson"}</p>
                                      <p className="mt-1 leading-normal text-rose-600">{err.error || "Missing metadata or schema conflict"}</p>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </motion.div>
                          </TableCell>
                        </TableRow>
                      )}
                    </>
                  );
                })}
              </TableBody>
            </Table>
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
