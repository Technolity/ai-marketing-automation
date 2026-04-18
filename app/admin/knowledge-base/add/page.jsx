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

const T = {
    cardBg: "#0D1217",
    surface: "#121920",
    border: "#1E2A34",
    cyan: "#16C7E7",
    primary: "#F4F8FB",
    secondary: "#B2C0CD",
    muted: "#5a6a78",
};

const INDUSTRIES = [
    "Technology", "Health & Fitness", "Real Estate", "Finance", "Legal",
    "Healthcare", "Marketing", "Retail", "Education", "Consulting",
];

const CONTENT_TYPES = [
    "Guide", "Article", "Template", "Resource", "Research",
    "Framework", "Case Study", "Checklist",
];

const AVAILABLE_TAGS = [
    "Lead Generation", "Email Marketing", "Social Media", "SEO", "PPC",
    "Content Marketing", "Branding", "Sales", "Automation", "Analytics",
];

function StyledInput({ value, onChange, placeholder, type = "text", required }) {
    const [focused, setFocused] = useState(false);
    return (
        <input
            type={type}
            value={value}
            onChange={onChange}
            placeholder={placeholder}
            required={required}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            style={{
                width: "100%", boxSizing: "border-box",
                padding: "11px 14px", backgroundColor: T.surface,
                border: `1px solid ${focused ? T.cyan : T.border}`,
                borderRadius: 10, color: T.primary, fontSize: 14, outline: "none",
                transition: "border-color 0.15s ease",
            }}
        />
    );
}

function DropdownButton({ label, value, isOpen, onToggle, children, placeholder }) {
    return (
        <div style={{ position: "relative" }}>
            <label style={{ display: "block", color: T.secondary, fontSize: 13, fontWeight: 500, marginBottom: 6 }}>{label}</label>
            <button
                type="button"
                onClick={onToggle}
                style={{
                    width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between",
                    padding: "11px 14px", backgroundColor: T.surface,
                    border: `1px solid ${isOpen ? T.cyan : T.border}`,
                    borderRadius: 10, textAlign: "left", cursor: "pointer",
                    color: value ? T.primary : T.muted, fontSize: 14, outline: "none",
                    transition: "border-color 0.15s ease",
                }}
            >
                {value || placeholder}
                <ChevronDown style={{ width: 16, height: 16, color: T.muted, transform: isOpen ? "rotate(180deg)" : "none", transition: "transform 0.2s ease" }} />
            </button>
            {isOpen && (
                <div style={{
                    position: "absolute", zIndex: 10, width: "100%", marginTop: 4,
                    backgroundColor: T.surface, border: `1px solid ${T.border}`,
                    borderRadius: 10, boxShadow: "0 8px 24px rgba(0,0,0,0.4)",
                    overflow: "hidden", maxHeight: 220, overflowY: "auto",
                }}>
                    {children}
                </div>
            )}
        </div>
    );
}

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
    const [contentFocused, setContentFocused] = useState(false);

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

    const dropdownItemStyle = {
        width: "100%", padding: "10px 14px", textAlign: "left",
        background: "none", border: "none", cursor: "pointer",
        color: T.primary, fontSize: 14, transition: "background-color 0.12s ease",
    };

    return (
        <AdminLayout>
            <div style={{ maxWidth: 720, marginLeft: "auto", marginRight: "auto", display: "flex", flexDirection: "column", gap: 24, width: "100%", overflowX: "hidden", boxSizing: "border-box" }}>

                {/* Header */}
                <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                    <Link
                        href="/admin/knowledge-base"
                        style={{
                            width: 36, height: 36, borderRadius: 9,
                            backgroundColor: T.surface, border: `1px solid ${T.border}`,
                            display: "flex", alignItems: "center", justifyContent: "center",
                            textDecoration: "none",
                        }}
                    >
                        <ArrowLeft style={{ width: 16, height: 16, color: T.secondary }} />
                    </Link>
                    <div>
                        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 2 }}>
                            <div style={{ width: 3, height: 22, backgroundColor: T.cyan, borderRadius: 2 }} />
                            <h1 style={{ color: T.primary, fontSize: 22, fontWeight: 700, margin: 0 }}>Add Content</h1>
                        </div>
                        <p style={{ color: T.secondary, fontSize: 13, margin: "0 0 0 11px" }}>Add new content to the knowledge base for RAG.</p>
                    </div>
                </div>

                {/* Form */}
                <motion.form
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    onSubmit={handleSubmit}
                    style={{
                        backgroundColor: T.cardBg, border: `1px solid ${T.border}`,
                        borderRadius: 16, padding: 32, display: "flex", flexDirection: "column", gap: 22,
                    }}
                >
                    {/* Title */}
                    <div>
                        <label style={{ display: "block", color: T.secondary, fontSize: 13, fontWeight: 500, marginBottom: 6 }}>
                            Title <span style={{ color: "#f87171" }}>*</span>
                        </label>
                        <StyledInput
                            value={formData.title}
                            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                            placeholder="Enter content title..."
                            required
                        />
                    </div>

                    {/* Industry & Content Type Row */}
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
                        <DropdownButton
                            label={<>Industry <span style={{ color: "#f87171" }}>*</span></>}
                            value={formData.industry}
                            isOpen={industryOpen}
                            onToggle={() => { setIndustryOpen(!industryOpen); setContentTypeOpen(false); }}
                            placeholder="Select industry..."
                        >
                            {INDUSTRIES.map((industry) => (
                                <button
                                    key={industry}
                                    type="button"
                                    onClick={() => { setFormData({ ...formData, industry }); setIndustryOpen(false); }}
                                    style={dropdownItemStyle}
                                    onMouseEnter={e => e.currentTarget.style.backgroundColor = "rgba(22,199,231,0.06)"}
                                    onMouseLeave={e => e.currentTarget.style.backgroundColor = "transparent"}
                                >
                                    {industry}
                                </button>
                            ))}
                        </DropdownButton>

                        <DropdownButton
                            label={<>Content Type <span style={{ color: "#f87171" }}>*</span></>}
                            value={formData.contentType}
                            isOpen={contentTypeOpen}
                            onToggle={() => { setContentTypeOpen(!contentTypeOpen); setIndustryOpen(false); }}
                            placeholder="Select content type..."
                        >
                            {CONTENT_TYPES.map((type) => (
                                <button
                                    key={type}
                                    type="button"
                                    onClick={() => { setFormData({ ...formData, contentType: type }); setContentTypeOpen(false); }}
                                    style={dropdownItemStyle}
                                    onMouseEnter={e => e.currentTarget.style.backgroundColor = "rgba(22,199,231,0.06)"}
                                    onMouseLeave={e => e.currentTarget.style.backgroundColor = "transparent"}
                                >
                                    {type}
                                </button>
                            ))}
                        </DropdownButton>
                    </div>

                    {/* Content Textarea */}
                    <div>
                        <label style={{ display: "block", color: T.secondary, fontSize: 13, fontWeight: 500, marginBottom: 6 }}>
                            Content <span style={{ color: "#f87171" }}>*</span>
                        </label>
                        <textarea
                            value={formData.content}
                            onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                            placeholder="Enter your content here... This will be used for RAG-based generation."
                            rows={12}
                            required
                            onFocus={() => setContentFocused(true)}
                            onBlur={() => setContentFocused(false)}
                            style={{
                                width: "100%", boxSizing: "border-box",
                                padding: "11px 14px", backgroundColor: T.surface,
                                border: `1px solid ${contentFocused ? T.cyan : T.border}`,
                                borderRadius: 10, color: T.primary, fontSize: 14, outline: "none",
                                resize: "none", lineHeight: 1.6,
                                transition: "border-color 0.15s ease", fontFamily: "inherit",
                            }}
                        />
                    </div>

                    {/* Tags */}
                    <div>
                        <label style={{ display: "block", color: T.secondary, fontSize: 13, fontWeight: 500, marginBottom: 10 }}>Tags</label>
                        <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                            {AVAILABLE_TAGS.map((tag) => {
                                const selected = formData.tags.includes(tag);
                                return (
                                    <button
                                        key={tag}
                                        type="button"
                                        onClick={() => handleTagToggle(tag)}
                                        style={{
                                            display: "flex", alignItems: "center", gap: 5,
                                            padding: "6px 14px", borderRadius: 8, fontSize: 13, fontWeight: 500, cursor: "pointer",
                                            backgroundColor: selected ? T.cyan : T.surface,
                                            border: `1px solid ${selected ? T.cyan : T.border}`,
                                            color: selected ? "#05080B" : T.secondary,
                                            transition: "all 0.15s ease",
                                        }}
                                    >
                                        {selected ? <X style={{ width: 12, height: 12 }} /> : <Plus style={{ width: 12, height: 12 }} />}
                                        {tag}
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Footer */}
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: 12, paddingTop: 16, borderTop: `1px solid ${T.border}` }}>
                        <Link
                            href="/admin/knowledge-base"
                            style={{
                                padding: "10px 20px", backgroundColor: T.surface, border: `1px solid ${T.border}`,
                                borderRadius: 10, color: T.secondary, fontSize: 14, fontWeight: 500,
                                textDecoration: "none", display: "inline-block",
                            }}
                        >
                            Cancel
                        </Link>
                        <button
                            type="submit"
                            disabled={loading || !formData.title || !formData.industry || !formData.contentType || !formData.content}
                            style={{
                                display: "flex", alignItems: "center", gap: 8,
                                padding: "10px 24px", backgroundColor: T.cyan,
                                color: "#05080B", fontWeight: 700, fontSize: 14,
                                border: "none", borderRadius: 10, cursor: loading || !formData.title || !formData.industry || !formData.contentType || !formData.content ? "not-allowed" : "pointer",
                                opacity: loading || !formData.title || !formData.industry || !formData.contentType || !formData.content ? 0.5 : 1,
                                transition: "opacity 0.15s ease",
                            }}
                        >
                            {loading ? (
                                <>
                                    <Loader2 style={{ width: 16, height: 16, animation: "spin 1s linear infinite" }} />
                                    Saving...
                                </>
                            ) : (
                                <>
                                    <Save style={{ width: 16, height: 16 }} />
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
