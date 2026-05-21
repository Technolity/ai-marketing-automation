"use client";
import { useState } from "react";
import { X, Plus } from "@/lib/icons";

export function MultiSelect({
    label,
    value = [],
    onChange,
    placeholder = "Add tags (press Enter)",
    required = false,
    error = "",
    helperText = "",
    className = "",
    maxItems = null,
    allowCustom = true,
    suggestions = [],
}) {
    const [inputValue, setInputValue] = useState("");
    const [showSuggestions, setShowSuggestions] = useState(false);

    const handleAddItem = (item) => {
        if (!item || !item.trim()) return;
        const trimmed = item.trim().toLowerCase();
        if (value.includes(trimmed)) { setInputValue(""); return; }
        if (maxItems && value.length >= maxItems) return;
        onChange([...value, trimmed]);
        setInputValue("");
        setShowSuggestions(false);
    };

    const handleRemoveItem = (itemToRemove) => {
        onChange(value.filter((i) => i !== itemToRemove));
    };

    const handleKeyDown = (e) => {
        if (e.key === "Enter") {
            e.preventDefault();
            if (allowCustom && inputValue) handleAddItem(inputValue);
        } else if (e.key === "Backspace" && !inputValue && value.length > 0) {
            handleRemoveItem(value[value.length - 1]);
        }
    };

    const filteredSuggestions = suggestions.filter(
        (s) =>
            !value.includes(s.toLowerCase()) &&
            s.toLowerCase().includes(inputValue.toLowerCase())
    );

    return (
        <div className={className}>
            {label && (
                <label className="block text-sm font-medium mb-2" style={{ color: "#F4F8FB" }}>
                    {label}
                    {required && <span className="ml-1" style={{ color: "#f87171" }}>*</span>}
                    {maxItems && (
                        <span className="ml-2 text-xs font-normal" style={{ color: "#B2C0CD" }}>
                            {value.length}/{maxItems}
                        </span>
                    )}
                </label>
            )}

            <div
                className="w-full px-3 py-2 rounded-xl transition-colors"
                style={{
                    backgroundColor: "#121920",
                    border: `1px solid ${error ? "#f87171" : "#1E2A34"}`,
                }}
                onFocus={() => {}}
            >
                {value.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mb-2">
                        {value.map((item) => (
                            <div
                                key={item}
                                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium"
                                style={{ backgroundColor: "rgba(22,199,231,0.12)", color: "#16C7E7" }}
                            >
                                <span>{item}</span>
                                <button
                                    type="button"
                                    onClick={() => handleRemoveItem(item)}
                                    aria-label={`Remove ${item}`}
                                    style={{ color: "#16C7E7", background: "none", border: "none", cursor: "pointer", padding: 0 }}
                                >
                                    <X size={12} />
                                </button>
                            </div>
                        ))}
                    </div>
                )}

                <div className="relative">
                    <input
                        type="text"
                        value={inputValue}
                        onChange={(e) => {
                            setInputValue(e.target.value);
                            setShowSuggestions(e.target.value.length > 0 && suggestions.length > 0);
                        }}
                        onKeyDown={handleKeyDown}
                        onFocus={() => setShowSuggestions(inputValue.length > 0 && suggestions.length > 0)}
                        onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                        placeholder={value.length === 0 ? placeholder : ""}
                        disabled={maxItems && value.length >= maxItems}
                        className="w-full bg-transparent focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                        style={{ color: "#F4F8FB" }}
                    />

                    {showSuggestions && filteredSuggestions.length > 0 && (
                        <div
                            className="absolute z-10 w-full mt-1 rounded-xl shadow-xl max-h-48 overflow-y-auto"
                            style={{
                                backgroundColor: "#1A2129",
                                border: "1px solid #1E2A34",
                                top: "100%",
                            }}
                        >
                            {filteredSuggestions.map((suggestion) => (
                                <button
                                    key={suggestion}
                                    type="button"
                                    onClick={() => handleAddItem(suggestion)}
                                    className="w-full px-3 py-2 text-left text-sm flex items-center gap-2 transition-colors"
                                    style={{ color: "#F4F8FB", background: "none", border: "none", cursor: "pointer" }}
                                    onMouseEnter={e => e.currentTarget.style.backgroundColor = "#121920"}
                                    onMouseLeave={e => e.currentTarget.style.backgroundColor = "transparent"}
                                >
                                    <Plus size={13} style={{ color: "#16C7E7" }} />
                                    {suggestion}
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {helperText && !error && (
                <p className="mt-1.5 text-xs" style={{ color: "#B2C0CD" }}>{helperText}</p>
            )}
            {error && (
                <p className="mt-1.5 text-xs" style={{ color: "#f87171" }}>{error}</p>
            )}
        </div>
    );
}

export default MultiSelect;
