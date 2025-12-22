"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useRouter, useParams } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import {
  FileText,
  ArrowLeft,
  Loader2,
  CheckCircle,
  Clock,
  AlertCircle,
  PlayCircle,
  Trash2,
  Edit,
  RefreshCw,
  Eye,
  Copy,
  Check,
  Database,
  Tag,
  Calendar,
  Hash
} from "lucide-react";
import AdminLayout from "@/components/admin/AdminLayout";

export default function TranscriptDetailPage() {
  const router = useRouter();
  const params = useParams();
  const { session, loading: authLoading } = useAuth();
  const transcriptId = params.id;

  const [loading, setLoading] = useState(true);
  const [transcript, setTranscript] = useState(null);
  const [chunks, setChunks] = useState([]);
  const [error, setError] = useState(null);
  const [processing, setProcessing] = useState(false);
  const [copiedChunk, setCopiedChunk] = useState(null);

  useEffect(() => {
    if (!authLoading && session && transcriptId) {
      fetchTranscript();
    } else if (!authLoading && !session) {
      setLoading(false);
      setError("Not authenticated");
    }
  }, [authLoading, session, transcriptId]);

  const fetchTranscript = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/admin/transcripts/${transcriptId}?include_chunks=true`, {
        credentials: 'include'
      });

      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('Transcript not found');
        }
        throw new Error('Failed to fetch transcript');
      }

      const data = await response.json();
      setTranscript(data.transcript);
      setChunks(data.chunks || []);
      setError(null);
    } catch (err) {
      console.error('Error fetching transcript:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleProcess = async () => {
    setProcessing(true);
    try {
      const response = await fetch('/api/admin/transcripts/process', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          transcript_id: transcriptId,
          options: {
            chunkSize: 1000,
            chunkOverlap: 200
          }
        })
      });

      if (!response.ok) {
        throw new Error('Failed to start processing');
      }

      // Poll for updates
      const pollInterval = setInterval(async () => {
        await fetchTranscript();
        const currentTranscript = await fetch(`/api/admin/transcripts/${transcriptId}`, {
          credentials: 'include'
        }).then(r => r.json());

        if (currentTranscript.transcript.status === 'completed' || currentTranscript.transcript.status === 'failed') {
          clearInterval(pollInterval);
          setProcessing(false);
        }
      }, 2000);

    } catch (err) {
      console.error('Error processing transcript:', err);
      setError('Failed to start processing: ' + err.message);
      setProcessing(false);
    }
  };

  const handleReprocess = async () => {
    if (!confirm('Reprocess this transcript? All existing chunks will be deleted and regenerated.')) {
      return;
    }

    setProcessing(true);
    try {
      const response = await fetch('/api/admin/transcripts/process', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          transcript_id: transcriptId,
          options: {
            chunkSize: 1000,
            chunkOverlap: 200,
            reprocess: true
          }
        })
      });

      if (!response.ok) {
        throw new Error('Failed to start reprocessing');
      }

      await fetchTranscript();
    } catch (err) {
      console.error('Error reprocessing:', err);
      setError('Failed to reprocess: ' + err.message);
    } finally {
      setProcessing(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Delete this transcript? All chunks will be permanently deleted. This cannot be undone.')) {
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

      router.push('/admin/transcripts');
    } catch (err) {
      console.error('Error deleting:', err);
      setError('Failed to delete: ' + err.message);
    }
  };

  const copyToClipboard = (text, chunkId) => {
    navigator.clipboard.writeText(text);
    setCopiedChunk(chunkId);
    setTimeout(() => setCopiedChunk(null), 2000);
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
      <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium ${variant.bg} ${variant.text}`}>
        <Icon className={`h-4 w-4 ${status === 'processing' ? 'animate-spin' : ''}`} />
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
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

  if (error || !transcript) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <p className="text-white text-lg mb-4">{error || 'Transcript not found'}</p>
            <button
              onClick={() => router.push('/admin/transcripts')}
              className="px-4 py-2 bg-cyan text-black rounded-lg hover:bg-cyan/90"
            >
              Back to Transcripts
            </button>
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
          <button
            onClick={() => router.push('/admin/transcripts')}
            className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors mb-4"
          >
            <ArrowLeft className="h-5 w-5" />
            Back to Transcripts
          </button>

          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <FileText className="h-8 w-8 text-cyan" />
                <h1 className="text-3xl font-bold text-white">{transcript.title}</h1>
                {getStatusBadge(transcript.status)}
              </div>
              {transcript.description && (
                <p className="text-gray-400 mt-2">{transcript.description}</p>
              )}
            </div>

            <div className="flex items-center gap-2">
              {transcript.status === 'pending' && (
                <button
                  onClick={handleProcess}
                  disabled={processing}
                  className="px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-lg transition-colors flex items-center gap-2"
                >
                  {processing ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    <PlayCircle className="h-5 w-5" />
                  )}
                  Process Now
                </button>
              )}

              {transcript.status === 'completed' && (
                <button
                  onClick={handleReprocess}
                  disabled={processing}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-lg transition-colors flex items-center gap-2"
                >
                  {processing ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    <RefreshCw className="h-5 w-5" />
                  )}
                  Reprocess
                </button>
              )}

              <button
                onClick={handleDelete}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors flex items-center gap-2"
              >
                <Trash2 className="h-5 w-5" />
                Delete
              </button>
            </div>
          </div>
        </div>

        {/* Error Message */}
        {transcript.status === 'failed' && transcript.processing_error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-red-500/10 border border-red-500/20 rounded-lg p-4 mb-6"
          >
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-red-500 font-medium">Processing Failed</p>
                <p className="text-red-400 text-sm mt-1">{transcript.processing_error}</p>
              </div>
            </div>
          </motion.div>
        )}

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-[#0e0e0f] border border-[#2a2a2d] rounded-lg p-6"
          >
            <div className="flex items-center justify-between mb-2">
              <Database className="h-5 w-5 text-cyan" />
            </div>
            <div className="text-2xl font-bold text-white mb-1">
              {transcript.total_chunks || 0}
            </div>
            <div className="text-sm text-gray-400">Total Chunks</div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-[#0e0e0f] border border-[#2a2a2d] rounded-lg p-6"
          >
            <div className="flex items-center justify-between mb-2">
              <Hash className="h-5 w-5 text-purple-500" />
            </div>
            <div className="text-2xl font-bold text-white mb-1">
              {transcript.raw_transcript?.length.toLocaleString() || 0}
            </div>
            <div className="text-sm text-gray-400">Characters</div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-[#0e0e0f] border border-[#2a2a2d] rounded-lg p-6"
          >
            <div className="flex items-center justify-between mb-2">
              <Tag className="h-5 w-5 text-blue-500" />
            </div>
            <div className="text-2xl font-bold text-white mb-1">
              {transcript.tags?.length || 0}
            </div>
            <div className="text-sm text-gray-400">Tags</div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-[#0e0e0f] border border-[#2a2a2d] rounded-lg p-6"
          >
            <div className="flex items-center justify-between mb-2">
              <Calendar className="h-5 w-5 text-green-500" />
            </div>
            <div className="text-2xl font-bold text-white mb-1">
              {new Date(transcript.created_at).toLocaleDateString()}
            </div>
            <div className="text-sm text-gray-400">Created</div>
          </motion.div>
        </div>

        {/* Metadata */}
        <div className="bg-[#0e0e0f] border border-[#2a2a2d] rounded-lg p-6 mb-6">
          <h2 className="text-xl font-bold text-white mb-4">Metadata</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <div className="text-sm text-gray-400 mb-2">Source Type</div>
              <div className="text-white capitalize">{transcript.source_type}</div>
            </div>

            {transcript.source_url && (
              <div>
                <div className="text-sm text-gray-400 mb-2">Source URL</div>
                <a
                  href={transcript.source_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-cyan hover:underline break-all"
                >
                  {transcript.source_url}
                </a>
              </div>
            )}

            <div className="md:col-span-2">
              <div className="text-sm text-gray-400 mb-2">Tags</div>
              <div className="flex flex-wrap gap-2">
                {transcript.tags && transcript.tags.length > 0 ? (
                  transcript.tags.map((tag, idx) => (
                    <span
                      key={idx}
                      className="px-3 py-1 bg-cyan/10 text-cyan text-sm rounded-full"
                    >
                      {tag}
                    </span>
                  ))
                ) : (
                  <span className="text-gray-500">No tags</span>
                )}
              </div>
            </div>

            <div className="md:col-span-2">
              <div className="text-sm text-gray-400 mb-2">Content Types</div>
              <div className="flex flex-wrap gap-2">
                {transcript.content_types && transcript.content_types.length > 0 ? (
                  transcript.content_types.map((type, idx) => (
                    <span
                      key={idx}
                      className="px-3 py-1 bg-purple-500/10 text-purple-400 text-sm rounded-full"
                    >
                      {type}
                    </span>
                  ))
                ) : (
                  <span className="text-gray-500">No content types</span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Chunks */}
        <div className="bg-[#0e0e0f] border border-[#2a2a2d] rounded-lg p-6">
          <h2 className="text-xl font-bold text-white mb-4">
            Chunks ({chunks.length})
          </h2>

          {chunks.length === 0 ? (
            <div className="text-center py-12">
              <Database className="h-12 w-12 text-gray-600 mx-auto mb-4" />
              <p className="text-gray-400 mb-4">
                {transcript.status === 'pending' ? 'No chunks yet. Click "Process Now" to generate chunks.' :
                 transcript.status === 'processing' ? 'Processing transcript into chunks...' :
                 'No chunks found'}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {chunks.map((chunk, idx) => (
                <motion.div
                  key={chunk.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  className="bg-black/30 border border-[#2a2a2d] rounded-lg p-4 hover:border-cyan/30 transition-colors"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-1 bg-cyan/10 text-cyan text-xs font-mono rounded">
                        Chunk #{chunk.metadata?.chunk_index !== undefined ? chunk.metadata.chunk_index + 1 : idx + 1}
                      </span>
                      <span className="text-xs text-gray-500">
                        {chunk.content.length} chars
                      </span>
                    </div>
                    <button
                      onClick={() => copyToClipboard(chunk.content, chunk.id)}
                      className="p-1.5 hover:bg-cyan/10 rounded transition-colors group"
                      title="Copy chunk"
                    >
                      {copiedChunk === chunk.id ? (
                        <Check className="h-4 w-4 text-green-500" />
                      ) : (
                        <Copy className="h-4 w-4 text-gray-400 group-hover:text-cyan" />
                      )}
                    </button>
                  </div>
                  <div className="text-gray-300 text-sm leading-relaxed whitespace-pre-wrap">
                    {chunk.content}
                  </div>
                  {chunk.metadata && (
                    <div className="mt-3 pt-3 border-t border-[#2a2a2d]">
                      <div className="text-xs text-gray-500">
                        Created: {new Date(chunk.created_at).toLocaleString()}
                      </div>
                    </div>
                  )}
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}
