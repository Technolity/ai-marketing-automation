"use client";
import { useState, useEffect, useRef } from "react";
import { Pencil, Check, X, AlertCircle, Loader2 } from "@/lib/icons";
import { motion, AnimatePresence } from "framer-motion";

const SUBSCRIPTION_TIERS = [
    { value: "starter", label: "Starter" },
    { value: "growth", label: "Growth" },
    { value: "scale", label: "Scale" },
];

const TIER_STYLES = {
    starter: { backgroundColor: "rgba(178,192,205,0.12)", color: "#B2C0CD" },
    growth: { backgroundColor: "rgba(22,199,231,0.12)", color: "#16C7E7" },
    scale: { backgroundColor: "rgba(167,139,250,0.12)", color: "#a78bfa" },
};

const inputStyle = {
    width: "100%",
    padding: "6px 12px",
    backgroundColor: "#0D1217",
    border: "1px solid #16C7E7",
    borderRadius: "8px",
    color: "#F4F8FB",
    fontSize: "13px",
    outline: "none",
};

export default function EditableCell({
    value,
    type = "text",
    field,
    userId,
    onSave,
    validation = {},
    className = "",
    displayFormatter = (val) => val,
    options = [],
    disabled = false,
}) {
    const [isEditing, setIsEditing] = useState(false);
    const [editValue, setEditValue] = useState(value);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);
    const [isHovered, setIsHovered] = useState(false);
    const inputRef = useRef(null);

    useEffect(() => { setEditValue(value); }, [value]);

    useEffect(() => {
        if (isEditing && inputRef.current) {
            inputRef.current.focus();
            if (type === "text" || type === "number") inputRef.current.select();
        }
    }, [isEditing, type]);

    const validate = (val) => {
        if (validation.required && (val === "" || val === null || val === undefined))
            return "This field is required";
        if (type === "number") {
            const numVal = Number(val);
            if (isNaN(numVal)) return "Must be a valid number";
            if (validation.min !== undefined && numVal < validation.min) return `Must be at least ${validation.min}`;
            if (validation.max !== undefined && numVal > validation.max) return `Must be at most ${validation.max}`;
            if (validation.integer && !Number.isInteger(numVal)) return "Must be a whole number";
        }
        if (validation.custom && typeof validation.custom === "function") return validation.custom(val);
        return null;
    };

    const handleEdit = () => { if (!disabled) { setIsEditing(true); setError(null); } };
    const handleCancel = () => { setIsEditing(false); setEditValue(value); setError(null); };

    const handleSave = async () => {
        const validationError = validate(editValue);
        if (validationError) { setError(validationError); return; }
        if (editValue === value) { setIsEditing(false); return; }
        setIsLoading(true);
        setError(null);
        try {
            await onSave(field, editValue, userId);
            setIsEditing(false);
        } catch (err) {
            setError(err.message || "Failed to save. Please try again.");
            setEditValue(value);
        } finally {
            setIsLoading(false);
        }
    };

    const handleKeyDown = (e) => {
        if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSave(); }
        else if (e.key === "Escape") { e.preventDefault(); handleCancel(); }
    };

    const renderViewMode = () => {
        const displayValue = displayFormatter(value);
        if (type === "select" && field === "subscription_tier") {
            const tier = SUBSCRIPTION_TIERS.find((t) => t.value === value);
            const style = TIER_STYLES[value] || TIER_STYLES.starter;
            return (
                <span
                    className="px-3 py-1 rounded-full text-xs font-semibold capitalize"
                    style={style}
                >
                    {tier?.label || value || "Starter"}
                </span>
            );
        }
        return (
            <span style={{ color: "#F4F8FB" }}>
                {displayValue !== null && displayValue !== undefined ? displayValue : "—"}
            </span>
        );
    };

    const renderEditMode = () => {
        if (type === "select") {
            const selectOptions = field === "subscription_tier" ? SUBSCRIPTION_TIERS : options;
            return (
                <select
                    ref={inputRef}
                    value={editValue || ""}
                    onChange={(e) => setEditValue(e.target.value)}
                    onKeyDown={handleKeyDown}
                    disabled={isLoading}
                    style={{ ...inputStyle, cursor: "pointer" }}
                >
                    {selectOptions.map((opt) => (
                        <option key={opt.value} value={opt.value} style={{ backgroundColor: "#0D1217" }}>
                            {opt.label}
                        </option>
                    ))}
                </select>
            );
        }
        return (
            <input
                ref={inputRef}
                type={type === "number" ? "number" : "text"}
                value={editValue || ""}
                onChange={(e) => setEditValue(e.target.value)}
                onKeyDown={handleKeyDown}
                disabled={isLoading}
                min={type === "number" ? validation.min : undefined}
                max={type === "number" ? validation.max : undefined}
                step={type === "number" ? (validation.step || 1) : undefined}
                style={inputStyle}
            />
        );
    };

    return (
        <div
            className={`relative group ${className}`}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
        >
            {!isEditing ? (
                <div className="flex items-center gap-2">
                    {renderViewMode()}
                    <AnimatePresence>
                        {isHovered && !disabled && (
                            <motion.button
                                initial={{ opacity: 0, scale: 0.8 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.8 }}
                                transition={{ duration: 0.12 }}
                                onClick={handleEdit}
                                className="p-1.5 rounded-lg transition-colors"
                                style={{ color: "#B2C0CD" }}
                                onMouseEnter={e => {
                                    e.currentTarget.style.backgroundColor = "rgba(22,199,231,0.1)";
                                    e.currentTarget.style.color = "#16C7E7";
                                }}
                                onMouseLeave={e => {
                                    e.currentTarget.style.backgroundColor = "transparent";
                                    e.currentTarget.style.color = "#B2C0CD";
                                }}
                                title={`Edit ${field}`}
                            >
                                <Pencil className="w-3.5 h-3.5" />
                            </motion.button>
                        )}
                    </AnimatePresence>
                </div>
            ) : (
                <div className="space-y-2">
                    <div className="flex items-center gap-2">
                        {renderEditMode()}
                        <button
                            onClick={handleSave}
                            disabled={isLoading}
                            className="p-1.5 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            style={{ backgroundColor: "rgba(22,199,231,0.15)", color: "#16C7E7" }}
                            onMouseEnter={e => e.currentTarget.style.backgroundColor = "rgba(22,199,231,0.25)"}
                            onMouseLeave={e => e.currentTarget.style.backgroundColor = "rgba(22,199,231,0.15)"}
                            title="Save changes"
                        >
                            {isLoading
                                ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                : <Check className="w-3.5 h-3.5" />
                            }
                        </button>
                        <button
                            onClick={handleCancel}
                            disabled={isLoading}
                            className="p-1.5 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            style={{ color: "#B2C0CD" }}
                            onMouseEnter={e => {
                                e.currentTarget.style.backgroundColor = "rgba(239,68,68,0.15)";
                                e.currentTarget.style.color = "#f87171";
                            }}
                            onMouseLeave={e => {
                                e.currentTarget.style.backgroundColor = "transparent";
                                e.currentTarget.style.color = "#B2C0CD";
                            }}
                            title="Cancel"
                        >
                            <X className="w-3.5 h-3.5" />
                        </button>
                    </div>
                    {error && (
                        <motion.div
                            initial={{ opacity: 0, y: -4 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="flex items-center gap-1.5 text-xs px-2 py-1 rounded"
                            style={{
                                color: "#f87171",
                                backgroundColor: "rgba(239,68,68,0.1)",
                                border: "1px solid rgba(239,68,68,0.2)",
                            }}
                        >
                            <AlertCircle className="w-3 h-3 flex-shrink-0" />
                            <span>{error}</span>
                        </motion.div>
                    )}
                </div>
            )}
        </div>
    );
}
