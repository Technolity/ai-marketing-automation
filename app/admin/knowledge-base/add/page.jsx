"use client";
import { useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { toast } from "sonner";
import {
    ArrowLeft,
    Save,
    X,
    Plus,
    ChevronDown,
    Loader2
} from "lucide-react";
import AdminLayout from "@/components/admin/AdminLayout";

const INDUSTRIES = [
    "Technology",
    "Health & Fitness",
    "Real Estate",
    "Finance",
    "Legal",
    "Healthcare",
    "Marketing",
    "Retail",
    "Education",
    "Consulting",
];

const CONTENT_TYPES = [
    "Guide",
    "Article",
    "Template",
    "Resource",
    "Research",
    "Framework",
    "Case Study",
    "Checklist",
];

const AVAILABLE_TAGS = [
    "Lead Generation",
    "Email Marketing",
    "Social Media",
    "SEO",
    "PPC",
    "Content Marketing",
    "Branding",
    "Sales",
    "Automation",
    "Analytics",
];

export default function AddKnowledgeContent() {
    const router = useRouter();
    const supabase = createClientComponentClient();
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        title: "",
        industry: "",
        contentType: "",
        content: "",
        tags: [],
    });
    const [industryOpen, setIndustryOpen] = useState(false);
    const [contentTypeOpen, setContentTypeOpen] = useState(false);

    const handleTagToggle = (tag) => {
        setFormData((prev) => ({
            ...prev,
            tags: prev.tags.includes(tag)
                ? prev.tags.filter((t) => t !== tag)
                : [...prev.tags, tag],
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) throw new Error("Not authenticated");

            const response = await fetch('/api/admin/knowledge-base', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${session.access_token}`
                },
                body: JSON.stringify(formData)
            });

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.error || 'Failed to create content');
            }

            toast.success("Content added successfully!");
            router.push("/admin/knowledge-base");
        } catch (error) {
            console.error("Error creating knowledge base entry:", error);
            toast.error(error.message || "Failed to add content");
        } finally {
            setLoading(false);
        }
    };

    return (
        <AdminLayout>
            <div className="max-w-4xl mx-auto space-y-6">
                {/* Header */}
                <div className="flex items-center gap-4">
                    <Link
                        href="/admin/knowledge-base"
                        className="p-2 hover:bg-[#1b1b1d] rounded-lg transition-colors"
                    >
                        <ArrowLeft className="w-5 h-5 text-gray-400" />
                    </Link>
                    <div>
                        <h1 className="text-3xl font-bold mb-1">Add Content</h1>
                        <p className="text-gray-400">Add new content to the knowledge base for RAG.</p>
                    </div>
                </div>

                {/* Form */}
                <motion.form
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    onSubmit={handleSubmit}
                    className="bg-[#1b1b1d] rounded-2xl border border-[#2a2a2d] p-8 space-y-6"
                >
                    {/* Title */}
                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                            Title *
                        </label>
                        <input
                            type="text"
                            value={formData.title}
                            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                            placeholder="Enter content title..."
                            className="w-full px-4 py-3 bg-[#0e0e0f] border border-[#2a2a2d] rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-cyan transition-colors"
                            required
                        />
                    </div>

                    {/* Industry & Content Type Row */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Industry Dropdown */}
                        <div className="relative">
                            <label className="block text-sm font-medium text-gray-300 mb-2">
                                Industry *
                            </label>
                            <button
                                type="button"
                                onClick={() => {
                                    setIndustryOpen(!industryOpen);
                                    setContentTypeOpen(false);
                                }}
                                className="w-full flex items-center justify-between px-4 py-3 bg-[#0e0e0f] border border-[#2a2a2d] rounded-xl text-left focus:outline-none focus:border-cyan transition-colors"
                            >
                                <span className={formData.industry ? "text-white" : "text-gray-500"}>
                                    {formData.industry || "Select industry..."}
                                </span>
                                <ChevronDown className={`w-5 h-5 text-gray-400 transition-transform ${industryOpen ? "rotate-180" : ""}`} />
                            </button>
                            {industryOpen && (
                                <div className="absolute z-10 w-full mt-2 bg-[#1b1b1d] border border-[#2a2a2d] rounded-xl shadow-xl overflow-hidden max-h-60 overflow-y-auto">
                                    {INDUSTRIES.map((industry) => (
                                        <button
                                            key={industry}
                                            type="button"
                                            onClick={() => {
                                                setFormData({ ...formData, industry });
                                                setIndustryOpen(false);
                                            }}
                                            className="w-full px-4 py-3 text-left hover:bg-cyan/10 hover:text-cyan transition-colors"
                                        >
                                            {industry}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Content Type Dropdown */}
                        <div className="relative">
                            <label className="block text-sm font-medium text-gray-300 mb-2">
                                Content Type *
                            </label>
                            <button
                                type="button"
                                onClick={() => {
                                    setContentTypeOpen(!contentTypeOpen);
                                    setIndustryOpen(false);
                                }}
                                className="w-full flex items-center justify-between px-4 py-3 bg-[#0e0e0f] border border-[#2a2a2d] rounded-xl text-left focus:outline-none focus:border-cyan transition-colors"
                            >
                                <span className={formData.contentType ? "text-white" : "text-gray-500"}>
                                    {formData.contentType || "Select content type..."}
                                </span>
                                <ChevronDown className={`w-5 h-5 text-gray-400 transition-transform ${contentTypeOpen ? "rotate-180" : ""}`} />
                            </button>
                            {contentTypeOpen && (
                                <div className="absolute z-10 w-full mt-2 bg-[#1b1b1d] border border-[#2a2a2d] rounded-xl shadow-xl overflow-hidden max-h-60 overflow-y-auto">
                                    {CONTENT_TYPES.map((type) => (
                                        <button
                                            key={type}
                                            type="button"
                                            onClick={() => {
                                                setFormData({ ...formData, contentType: type });
                                                setContentTypeOpen(false);
                                            }}
                                            className="w-full px-4 py-3 text-left hover:bg-cyan/10 hover:text-cyan transition-colors"
                                        >
                                            {type}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Content Textarea */}
                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                            Content *
                        </label>
                        <textarea
                            value={formData.content}
                            onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                            placeholder="Enter your content here... This will be used for RAG-based generation."
                            rows={12}
                            className="w-full px-4 py-3 bg-[#0e0e0f] border border-[#2a2a2d] rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-cyan transition-colors resize-none"
                            required
                        />
                    </div>

                    {/* Tags Multi-select */}
                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                            Tags
                        </label>
                        <div className="flex flex-wrap gap-2">
                            {AVAILABLE_TAGS.map((tag) => (
                                <button
                                    key={tag}
                                    type="button"
                                    onClick={() => handleTagToggle(tag)}
                                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${formData.tags.includes(tag)
                                            ? "bg-cyan text-black"
                                            : "bg-[#0e0e0f] text-gray-400 border border-[#2a2a2d] hover:border-cyan/50"
                                        }`}
                                >
                                    {formData.tags.includes(tag) ? (
                                        <span className="flex items-center gap-1">
                                            {tag}
                                            <X className="w-3 h-3" />
                                        </span>
                                    ) : (
                                        <span className="flex items-center gap-1">
                                            <Plus className="w-3 h-3" />
                                            {tag}
                                        </span>
                                    )}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Submit Button */}
                    <div className="flex items-center justify-end gap-4 pt-4 border-t border-[#2a2a2d]">
                        <Link
                            href="/admin/knowledge-base"
                            className="px-6 py-3 bg-[#0e0e0f] hover:bg-[#2a2a2d] text-gray-300 rounded-xl font-medium transition-colors"
                        >
                            Cancel
                        </Link>
                        <button
                            type="submit"
                            disabled={loading || !formData.title || !formData.industry || !formData.contentType || !formData.content}
                            className="flex items-center gap-2 px-6 py-3 bg-cyan hover:brightness-110 text-black rounded-xl font-semibold transition-all shadow-lg shadow-cyan/20 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {loading ? (
                                <>
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                    Saving...
                                </>
                            ) : (
                                <>
                                    <Save className="w-5 h-5" />
                                    Save Content
                                </>
                            )}
                        </button>
                    </div>
                </motion.form>
            </div>
        </AdminLayout>
    );
}
