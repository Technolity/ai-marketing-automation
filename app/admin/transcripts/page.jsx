"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import {
  FileText,
  Plus,
  Search,
  Filter,
  Loader2,
  CheckCircle,
  Clock,
  AlertCircle,
  PlayCircle,
  Trash2,
  Eye,
  MoreVertical,
  Tag,
  Video,
  FileIcon,
  Edit
} from "lucide-react";
import AdminLayout from "@/components/admin/AdminLayout";

export default function TranscriptsPage() {
  const { session, loading: authLoading } = useAuth();
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [transcripts, setTranscripts] = useState([]);
  const [stats, setStats] = useState(null);
  const [error, setError] = useState(null);

  // Filters and pagination
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedTranscript, setSelectedTranscript] = useState(null);

  useEffect(() => {
    if (!authLoading && session) {
      fetchTranscripts();
      fetchStats();
    } else if (!authLoading && !session) {
      setLoading(false);
      setError("Not authenticated");
    }
  }, [authLoading, session, currentPage, searchQuery, statusFilter]);

  const fetchTranscripts = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: '20'
      });

      if (searchQuery) params.append('search', searchQuery);
      if (statusFilter) params.append('status', statusFilter);

      const response = await fetch(`/api/admin/transcripts?${params}`, {
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error('Failed to fetch transcripts');
      }

      const data = await response.json();
      setTranscripts(data.transcripts || []);
      setTotalPages(data.pagination?.totalPages || 1);
      setError(null);
    } catch (err) {
      console.error('Error fetching transcripts:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await fetch('/api/admin/transcripts/stats', {
        credentials: 'include'
      });

      if (response.ok) {
        const data = await response.json();
        setStats(data.stats);
      }
    } catch (err) {
      console.error('Error fetching stats:', err);
    }
  };

  const handleDelete = async (transcriptId) => {
    if (!confirm('Are you sure you want to delete this transcript? All associated chunks will be permanently deleted.')) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/transcripts/${transcriptId}`, {
        method: 'DELETE',
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error('Failed to delete transcript');
      }

      // Refresh list
      fetchTranscripts();
      fetchStats();
    } catch (err) {
      console.error('Error deleting transcript:', err);
      alert('Failed to delete transcript: ' + err.message);
    }
  };

  const handleProcess = async (transcriptId) => {
    try {
      const response = await fetch('/api/admin/transcripts/process', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ transcript_id: transcriptId })
      });

      if (!response.ok) {
        throw new Error('Failed to start processing');
      }

      // Refresh list to show processing status
      fetchTranscripts();
    } catch (err) {
      console.error('Error processing transcript:', err);
      alert('Failed to start processing: ' + err.message);
    }
  };

  const getStatusBadge = (status) => {
    const variants = {
      pending: { bg: 'bg-gray-500/10', text: 'text-gray-400', icon: Clock },
      processing: { bg: 'bg-cyan/10', text: 'text-cyan', icon: Loader2 },
      completed: { bg: 'bg-green-500/10', text: 'text-green-500', icon: CheckCircle },
      failed: { bg: 'bg-red-500/10', text: 'text-red-500', icon: AlertCircle }
    };

    const variant = variants[status] || variants.pending;
    const Icon = variant.icon;

    return (
      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${variant.bg} ${variant.text}`}>
        <Icon className={`h-3.5 w-3.5 ${status === 'processing' ? 'animate-spin' : ''}`} />
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  const getSourceIcon = (sourceType) => {
    const icons = {
      youtube: Video,
      manual: Edit,
      document: FileIcon
    };
    return icons[sourceType] || FileIcon;
  };

  if (authLoading || loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center min-h-screen">
          <Loader2 className="h-8 w-8 text-cyan animate-spin" />
        </div>
      </AdminLayout>
    );
  }

  if (error) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <p className="text-white text-lg">{error}</p>
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="min-h-screen p-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <h1 className="text-3xl font-bold text-white flex items-center gap-3">
              <FileText className="h-8 w-8 text-cyan" />
              Transcript Management
            </h1>
            <button
              onClick={() => router.push('/admin/transcripts/add')}
              className="px-4 py-2 bg-cyan text-black rounded-lg hover:bg-cyan/90 transition-colors flex items-center gap-2 font-medium"
            >
              <Plus className="h-5 w-5" />
              Add Transcript
            </button>
          </div>
          <p className="text-gray-400">
            Manage your RAG knowledge base transcripts and processing
          </p>
        </div>

        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-[#0e0e0f] border border-[#2a2a2d] rounded-lg p-6"
            >
              <div className="text-gray-400 text-sm mb-2">Total Transcripts</div>
              <div className="text-3xl font-bold text-white">{stats.transcripts?.total || 0}</div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-[#0e0e0f] border border-[#2a2a2d] rounded-lg p-6"
            >
              <div className="text-gray-400 text-sm mb-2">Total Chunks</div>
              <div className="text-3xl font-bold text-cyan">{stats.chunks?.total || 0}</div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-[#0e0e0f] border border-[#2a2a2d] rounded-lg p-6"
            >
              <div className="text-gray-400 text-sm mb-2">Completed</div>
              <div className="text-3xl font-bold text-green-500">{stats.transcripts?.completed || 0}</div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-[#0e0e0f] border border-[#2a2a2d] rounded-lg p-6"
            >
              <div className="text-gray-400 text-sm mb-2">Avg. Chunks/Transcript</div>
              <div className="text-3xl font-bold text-white">{stats.chunks?.average_per_transcript || 0}</div>
            </motion.div>
          </div>
        )}

        {/* Filters and Search */}
        <div className="bg-[#0e0e0f] border border-[#2a2a2d] rounded-lg p-4 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search transcripts..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full pl-10 pr-4 py-2 bg-black/30 border border-[#2a2a2d] rounded-lg text-white placeholder-gray-500 focus:border-cyan focus:outline-none transition-colors"
              />
            </div>

            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="px-4 py-2 bg-black/30 border border-[#2a2a2d] rounded-lg text-white focus:border-cyan focus:outline-none transition-colors"
            >
              <option value="">All Status</option>
              <option value="pending">Pending</option>
              <option value="processing">Processing</option>
              <option value="completed">Completed</option>
              <option value="failed">Failed</option>
            </select>
          </div>
        </div>

        {/* Transcripts Table */}
        <div className="bg-[#0e0e0f] border border-[#2a2a2d] rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-black/30 border-b border-[#2a2a2d]">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Title
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Source
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Chunks
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Tags
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Created
                  </th>
                  <th className="px-6 py-4 text-right text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#2a2a2d]">
                {transcripts.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="px-6 py-12 text-center">
                      <FileText className="h-12 w-12 text-gray-600 mx-auto mb-4" />
                      <p className="text-gray-400 mb-4">No transcripts found</p>
                      <button
                        onClick={() => router.push('/admin/transcripts/add')}
                        className="px-4 py-2 bg-cyan text-black rounded-lg hover:bg-cyan/90 transition-colors inline-flex items-center gap-2"
                      >
                        <Plus className="h-4 w-4" />
                        Add Your First Transcript
                      </button>
                    </td>
                  </tr>
                ) : (
                  transcripts.map((transcript) => {
                    const SourceIcon = getSourceIcon(transcript.source_type);
                    return (
                      <tr
                        key={transcript.id}
                        className="hover:bg-white/5 transition-colors cursor-pointer"
                        onClick={() => router.push(`/admin/transcripts/${transcript.id}`)}
                      >
                        <td className="px-6 py-4">
                          <div className="text-white font-medium">{transcript.title}</div>
                          {transcript.description && (
                            <div className="text-sm text-gray-400 mt-1 truncate max-w-md">
                              {transcript.description}
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2 text-gray-400">
                            <SourceIcon className="h-4 w-4" />
                            <span className="text-sm capitalize">{transcript.source_type}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          {getStatusBadge(transcript.status)}
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-white">
                            {transcript.status === 'processing' ? (
                              <span>{transcript.processed_chunks || 0} / {transcript.total_chunks || '?'}</span>
                            ) : (
                              <span>{transcript.total_chunks || 0}</span>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex flex-wrap gap-1">
                            {transcript.tags?.slice(0, 3).map((tag, idx) => (
                              <span
                                key={idx}
                                className="px-2 py-0.5 bg-cyan/10 text-cyan text-xs rounded-full"
                              >
                                {tag}
                              </span>
                            ))}
                            {transcript.tags?.length > 3 && (
                              <span className="px-2 py-0.5 bg-gray-500/10 text-gray-400 text-xs rounded-full">
                                +{transcript.tags.length - 3}
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-gray-400 text-sm">
                          {new Date(transcript.created_at).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-2" onClick={(e) => e.stopPropagation()}>
                            {transcript.status === 'pending' && (
                              <button
                                onClick={() => handleProcess(transcript.id)}
                                className="p-2 hover:bg-cyan/10 rounded-lg transition-colors group"
                                title="Process transcript"
                              >
                                <PlayCircle className="h-4 w-4 text-gray-400 group-hover:text-cyan" />
                              </button>
                            )}
                            <button
                              onClick={() => router.push(`/admin/transcripts/${transcript.id}`)}
                              className="p-2 hover:bg-cyan/10 rounded-lg transition-colors group"
                              title="View details"
                            >
                              <Eye className="h-4 w-4 text-gray-400 group-hover:text-cyan" />
                            </button>
                            <button
                              onClick={() => handleDelete(transcript.id)}
                              className="p-2 hover:bg-red-500/10 rounded-lg transition-colors group"
                              title="Delete transcript"
                            >
                              <Trash2 className="h-4 w-4 text-gray-400 group-hover:text-red-500" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="px-6 py-4 border-t border-[#2a2a2d] flex items-center justify-between">
              <div className="text-sm text-gray-400">
                Page {currentPage} of {totalPages}
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="px-4 py-2 bg-black/30 border border-[#2a2a2d] rounded-lg text-white hover:border-cyan disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Previous
                </button>
                <button
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="px-4 py-2 bg-black/30 border border-[#2a2a2d] rounded-lg text-white hover:border-cyan disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}
