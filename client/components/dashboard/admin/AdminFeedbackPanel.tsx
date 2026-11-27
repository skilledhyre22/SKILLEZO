'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  MessageSquare,
  Search,
  RefreshCw,
  Trash2,
  CheckCircle2,
  Clock,
  Sparkles,
  Bug,
  Lightbulb,
  ExternalLink,
} from 'lucide-react';
import { toast } from 'sonner';
import {
  adminService,
  AdminFeedbackItem,
  AdminFeedbackListResponse,
} from '@/services/admin.service';

const TYPE_META: Record<
  AdminFeedbackItem['type'],
  { label: string; badgeClass: string; icon: React.ElementType }
> = {
  improvement: {
    label: 'Idea / Suggestion',
    badgeClass: 'bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800',
    icon: Lightbulb,
  },
  bug: {
    label: 'Issue / Bug',
    badgeClass: 'bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-300 border-rose-200 dark:border-rose-800',
    icon: Bug,
  },
  feature: {
    label: 'Feature Request',
    badgeClass: 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800',
    icon: Sparkles,
  },
};

export function AdminFeedbackPanel() {
  const [items, setItems] = useState<AdminFeedbackItem[]>([]);
  const [summary, setSummary] = useState<AdminFeedbackListResponse['summary']>({
    total: 0,
    new: 0,
    reviewed: 0,
    resolved: 0,
  });
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [typeFilter, setTypeFilter] = useState<string>('');
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search.trim()), 300);
    return () => clearTimeout(timer);
  }, [search]);

  const loadFeedback = useCallback(async () => {
    setLoading(true);
    try {
      const data = await adminService.getFeedback({
        page,
        limit: 20,
        status: statusFilter || undefined,
        type: typeFilter || undefined,
        search: debouncedSearch || undefined,
      });
      setItems(data.items || []);
      setSummary(data.summary || { total: 0, new: 0, reviewed: 0, resolved: 0 });
      setTotalPages(data.pagination?.totalPages || 1);
    } catch (err: any) {
      toast.error(err?.message || 'Failed to load feedback submissions');
    } finally {
      setLoading(false);
    }
  }, [page, statusFilter, typeFilter, debouncedSearch]);

  useEffect(() => {
    loadFeedback();
  }, [loadFeedback]);

  const handleStatusChange = async (id: string, status: AdminFeedbackItem['status']) => {
    setUpdatingId(id);
    try {
      await adminService.updateFeedback(id, { status });
      toast.success(`Marked feedback as ${status}`);
      await loadFeedback();
    } catch (err: any) {
      toast.error(err?.message || 'Failed to update feedback status');
    } finally {
      setUpdatingId(null);
    }
  };

  const handleDelete = async (id: string) => {
    setUpdatingId(id);
    try {
      await adminService.deleteFeedback(id);
      toast.success('Feedback deleted');
      await loadFeedback();
    } catch (err: any) {
      toast.error(err?.message || 'Failed to delete feedback');
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* KPI Summary Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Total Submissions</p>
          <p className="text-2xl font-extrabold text-slate-900 dark:text-white mt-1">{summary.total}</p>
        </div>
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <p className="text-xs font-medium text-amber-600 dark:text-amber-400">New / Unread</p>
          <p className="text-2xl font-extrabold text-amber-600 dark:text-amber-400 mt-1">{summary.new}</p>
        </div>
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <p className="text-xs font-medium text-indigo-600 dark:text-indigo-400">Reviewed</p>
          <p className="text-2xl font-extrabold text-indigo-600 dark:text-indigo-400 mt-1">{summary.reviewed}</p>
        </div>
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <p className="text-xs font-medium text-emerald-600 dark:text-emerald-400">Resolved</p>
          <p className="text-2xl font-extrabold text-emerald-600 dark:text-emerald-400 mt-1">{summary.resolved}</p>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[220px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => {
              setPage(1);
              setSearch(e.target.value);
            }}
            placeholder="Search by user, email, message, or page..."
            className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500"
          />
        </div>

        <select
          value={typeFilter}
          onChange={(e) => {
            setPage(1);
            setTypeFilter(e.target.value);
          }}
          className="px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-700 dark:text-slate-200 cursor-pointer"
        >
          <option value="">All Categories</option>
          <option value="improvement">Idea / Suggestion</option>
          <option value="bug">Issue / Bug</option>
          <option value="feature">Feature Request</option>
        </select>

        <select
          value={statusFilter}
          onChange={(e) => {
            setPage(1);
            setStatusFilter(e.target.value);
          }}
          className="px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-700 dark:text-slate-200 cursor-pointer"
        >
          <option value="">All Statuses</option>
          <option value="new">New</option>
          <option value="reviewed">Reviewed</option>
          <option value="resolved">Resolved</option>
        </select>

        <button
          type="button"
          onClick={loadFeedback}
          disabled={loading}
          className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-200 transition-colors cursor-pointer disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh</span>
        </button>
      </div>

      {/* Feedback List */}
      {loading ? (
        <div className="p-12 text-center rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-sm text-slate-500">
          Loading user feedback...
        </div>
      ) : items.length === 0 ? (
        <div className="p-12 text-center rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-2">
          <MessageSquare className="w-8 h-8 text-slate-400 mx-auto" />
          <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
            No feedback submissions found
          </p>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Feedback submitted from the dashboard footer will appear here automatically.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {items.map((item) => {
            const meta = TYPE_META[item.type] || TYPE_META.improvement;
            const TypeIcon = meta.icon;

            return (
              <div
                key={item._id}
                className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col sm:flex-row sm:items-start justify-between gap-4"
              >
                <div className="space-y-2 flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${meta.badgeClass}`}
                    >
                      <TypeIcon className="w-3 h-3" />
                      {meta.label}
                    </span>

                    <span className="text-xs font-semibold text-slate-900 dark:text-white">
                      {item.userName || 'Candidate'}
                    </span>
                    {item.userEmail && (
                      <span className="text-xs text-slate-500 dark:text-slate-400">
                        ({item.userEmail})
                      </span>
                    )}

                    {item.pagePath && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-[11px] font-mono text-slate-600 dark:text-slate-400">
                        <ExternalLink className="w-2.5 h-2.5" />
                        {item.pagePath}
                      </span>
                    )}
                  </div>

                  <p className="text-sm text-slate-700 dark:text-slate-200 whitespace-pre-wrap leading-relaxed">
                    {item.message}
                  </p>

                  <p className="text-[11px] text-slate-400 flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {new Date(item.createdAt).toLocaleString()}
                  </p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <select
                    value={item.status}
                    disabled={updatingId === item._id}
                    onChange={(e) =>
                      handleStatusChange(item._id, e.target.value as AdminFeedbackItem['status'])
                    }
                    className={`px-2.5 py-1.5 rounded-xl text-xs font-semibold border cursor-pointer ${
                      item.status === 'resolved'
                        ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800'
                        : item.status === 'reviewed'
                        ? 'bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800'
                        : 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800'
                    }`}
                  >
                    <option value="new">New</option>
                    <option value="reviewed">Reviewed</option>
                    <option value="resolved">Resolved</option>
                  </select>

                  <button
                    type="button"
                    disabled={updatingId === item._id}
                    onClick={() => handleDelete(item._id)}
                    title="Delete feedback"
                    className="p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer disabled:opacity-50"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}

          {totalPages > 1 && (
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold disabled:opacity-40 cursor-pointer"
              >
                Previous
              </button>
              <span className="text-xs text-slate-500">
                Page {page} of {totalPages}
              </span>
              <button
                type="button"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => p + 1)}
                className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold disabled:opacity-40 cursor-pointer"
              >
                Next
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
