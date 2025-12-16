"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import {
  FileText,
  ArrowLeft,
  Sparkles,
  Loader2,
  CheckCircle,
  AlertCircle,
  PlayCircle
} from "lucide-react";
import AdminLayout from "@/components/admin/AdminLayout";
import {
  Input,
  Textarea,
  Select,
  MultiSelect,
  FormSection
} from "@/components/admin/forms";

const CONTENT_TYPE_OPTIONS = [
  'VSL',
  'Email Sequence',
  'Social Media Ads',
  'Sales Page',
  'Lead Magnet',
  'Story',
  'Webinar Script',
  'Landing Page',
  'Facebook Ad',
  'YouTube Ad'
];

const TAG_SUGGESTIONS = [
  'lead-generation',
  'sales',
  'storytelling',
  'funnels',
  'ads',
  'email-marketing',
  'webinar',
  'conversion',
  'automation',
  'strategy'
];

export default function AddTranscriptPage() {
  const router = useRouter();
  const { session, loading: authLoading } = useAuth();

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    source_type: 'manual',
    source_url: '',
    raw_transcript: '',
    tags: [],
    content_types: []
  });

  const [extracting, setExtracting] = useState(false);
  const [saving, setSaving] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState('');
  const [extractionResult, setExtractionResult] = useState(null);

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setError('');
  };

  const handleExtractMetadata = async () => {
    if (!formData.raw_transcript || formData.raw_transcript.trim().length < 100) {
      setError('Please enter at least 100 characters of transcript text to extract metadata');
      return;
    }

    setExtracting(true);
    setError('');

    try {
      const response = await fetch('/api/admin/transcripts/extract-metadata', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          raw_transcript: formData.raw_transcript,
          provided_metadata: {
            title: formData.title || undefined,
            description: formData.description || undefined,
            tags: formData.tags.length > 0 ? formData.tags : undefined,
            content_types: formData.content_types.length > 0 ? formData.content_types : undefined
          }
        })
      });

      if (!response.ok) {
        throw new Error('Failed to extract metadata');
      }

      const data = await response.json();
      setExtractionResult(data.metadata);

      // Auto-fill empty fields with extracted metadata
      setFormData(prev => ({
        ...prev,
        title: prev.title || data.metadata.title,
        description: prev.description || data.metadata.description,
        tags: prev.tags.length > 0 ? prev.tags : data.metadata.tags,
        content_types: prev.content_types.length > 0 ? prev.content_types : data.metadata.content_types
      }));

    } catch (err) {
      console.error('Extraction error:', err);
      setError('Failed to extract metadata: ' + err.message);
    } finally {
      setExtracting(false);
    }
  };

  const handleSubmit = async (e, shouldProcess = false) => {
    e.preventDefault();
    setError('');

    // Validation
    if (!formData.title.trim()) {
      setError('Title is required');
      return;
    }

    if (!formData.raw_transcript.trim()) {
      setError('Transcript text is required');
      return;
    }

    if (formData.raw_transcript.trim().length < 100) {
      setError('Transcript must be at least 100 characters');
      return;
    }

    setSaving(true);

    try {
      // Step 1: Create transcript
      const createResponse = await fetch('/api/admin/transcripts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(formData)
      });

      if (!createResponse.ok) {
        const errorData = await createResponse.json();
        throw new Error(errorData.error || 'Failed to create transcript');
      }

      const { transcript } = await createResponse.json();

      // Step 2: If shouldProcess, trigger processing
      if (shouldProcess) {
        setProcessing(true);

        const processResponse = await fetch('/api/admin/transcripts/process', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({
            transcript_id: transcript.id,
            options: {
              chunkSize: 1000,
              chunkOverlap: 200
            }
          })
        });

        if (!processResponse.ok) {
          console.error('Failed to start processing, but transcript was saved');
        }
      }

      // Redirect to transcript detail page
      router.push(`/admin/transcripts/${transcript.id}`);

    } catch (err) {
      console.error('Submit error:', err);
      setError(err.message);
    } finally {
      setSaving(false);
      setProcessing(false);
    }
  };

  if (authLoading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center min-h-screen">
          <Loader2 className="h-8 w-8 text-cyan animate-spin" />
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
            onClick={() => router.back()}
            className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors mb-4"
          >
            <ArrowLeft className="h-5 w-5" />
            Back to Transcripts
          </button>

          <h1 className="text-3xl font-bold text-white flex items-center gap-3">
            <FileText className="h-8 w-8 text-cyan" />
            Add New Transcript
          </h1>
          <p className="text-gray-400 mt-2">
            Feed raw transcripts into the RAG system for AI-powered content generation
          </p>
        </div>

        {/* Error Display */}
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-red-500/10 border border-red-500/20 rounded-lg p-4 mb-6 flex items-start gap-3"
          >
            <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-red-500 font-medium">Error</p>
              <p className="text-red-400 text-sm mt-1">{error}</p>
            </div>
          </motion.div>
        )}

        {/* Extraction Success */}
        {extractionResult && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-cyan/10 border border-cyan/20 rounded-lg p-4 mb-6 flex items-start gap-3"
          >
            <CheckCircle className="h-5 w-5 text-cyan flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-cyan font-medium">Metadata Extracted Successfully</p>
              <p className="text-gray-400 text-sm mt-1">
                AI has analyzed your transcript and extracted metadata. Review and edit as needed.
              </p>
            </div>
          </motion.div>
        )}

        {/* Form */}
        <form onSubmit={(e) => handleSubmit(e, false)} className="max-w-4xl">
          {/* Basic Information */}
          <FormSection
            title="Basic Information"
            description="Provide details about this transcript"
            className="mb-6"
          >
            <div className="space-y-4">
              <Input
                label="Title"
                value={formData.title}
                onChange={(e) => handleChange('title', e.target.value)}
                placeholder="e.g., Lead Generation Masterclass"
                required
              />

              <Textarea
                label="Description"
                value={formData.description}
                onChange={(e) => handleChange('description', e.target.value)}
                placeholder="Brief description of what this transcript is about..."
                rows={3}
              />
            </div>
          </FormSection>

          {/* Source Information */}
          <FormSection
            title="Source Information"
            description="Where did this transcript come from?"
            className="mb-6"
          >
            <div className="space-y-4">
              <Select
                label="Source Type"
                value={formData.source_type}
                onChange={(e) => handleChange('source_type', e.target.value)}
                options={[
                  { value: 'youtube', label: 'YouTube Video' },
                  { value: 'manual', label: 'Manual Entry' },
                  { value: 'document', label: 'Document Upload' }
                ]}
                required
              />

              {(formData.source_type === 'youtube' || formData.source_type === 'document') && (
                <Input
                  label="Source URL"
                  value={formData.source_url}
                  onChange={(e) => handleChange('source_url', e.target.value)}
                  placeholder={formData.source_type === 'youtube' ? 'https://youtube.com/watch?v=...' : 'https://...'}
                />
              )}
            </div>
          </FormSection>

          {/* Transcript Content */}
          <FormSection
            title="Transcript Content"
            description="Paste the raw transcript text here (minimum 100 characters)"
            className="mb-6"
          >
            <Textarea
              label="Raw Transcript"
              value={formData.raw_transcript}
              onChange={(e) => handleChange('raw_transcript', e.target.value)}
              placeholder="Paste your transcript here...

Example:
Welcome to today's training on lead generation. In this video, I'm going to share my proven framework for generating leads consistently..."
              rows={12}
              maxLength={100000}
              required
              helperText={`${formData.raw_transcript.length} characters (minimum 100)`}
            />

            {/* AI Extract Button */}
            <div className="mt-4">
              <button
                type="button"
                onClick={handleExtractMetadata}
                disabled={extracting || formData.raw_transcript.trim().length < 100}
                className="px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-lg transition-colors flex items-center gap-2"
              >
                {extracting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Extracting Metadata...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4" />
                    AI Extract Metadata
                  </>
                )}
              </button>
              <p className="text-sm text-gray-500 mt-2">
                Use AI to automatically extract title, description, tags, and content types from your transcript
              </p>
            </div>
          </FormSection>

          {/* Metadata */}
          <FormSection
            title="Metadata & Categorization"
            description="Categorize this transcript for better organization and retrieval"
            className="mb-6"
          >
            <div className="space-y-4">
              <MultiSelect
                label="Tags"
                value={formData.tags}
                onChange={(tags) => handleChange('tags', tags)}
                placeholder="Add tags (press Enter)"
                suggestions={TAG_SUGGESTIONS}
                allowCustom={true}
                helperText="Add tags to categorize this transcript (e.g., lead-generation, sales, storytelling)"
              />

              <MultiSelect
                label="Content Types"
                value={formData.content_types}
                onChange={(types) => handleChange('content_types', types)}
                placeholder="Select content types"
                suggestions={CONTENT_TYPE_OPTIONS}
                allowCustom={false}
                helperText="What types of content can be generated from this transcript?"
              />
            </div>
          </FormSection>

          {/* Actions */}
          <div className="flex items-center gap-4">
            <button
              type="submit"
              disabled={saving || processing}
              className="px-6 py-3 bg-cyan hover:bg-cyan/90 disabled:bg-gray-600 disabled:cursor-not-allowed text-black font-medium rounded-lg transition-colors flex items-center gap-2"
            >
              {saving ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <CheckCircle className="h-5 w-5" />
                  Save Transcript
                </>
              )}
            </button>

            <button
              type="button"
              onClick={(e) => handleSubmit(e, true)}
              disabled={saving || processing}
              className="px-6 py-3 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-medium rounded-lg transition-colors flex items-center gap-2"
            >
              {processing ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  Saving & Processing...
                </>
              ) : (
                <>
                  <PlayCircle className="h-5 w-5" />
                  Save & Process Now
                </>
              )}
            </button>

            <button
              type="button"
              onClick={() => router.back()}
              className="px-6 py-3 bg-black/30 border border-[#2a2a2d] hover:border-gray-600 text-white rounded-lg transition-colors"
            >
              Cancel
            </button>
          </div>

          <p className="text-sm text-gray-500 mt-4">
            <strong>Save Transcript:</strong> Saves without processing (status: pending)<br />
            <strong>Save & Process Now:</strong> Saves and immediately processes into RAG chunks
          </p>
        </form>
      </div>
    </AdminLayout>
  );
}
