/**
 * Reusable Multi-Select Component for Admin Forms
 * Used for selecting multiple tags, categories, or options
 */

import { useState } from "react";
import { X, Plus } from "lucide-react";

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
  suggestions = []
}) {
  const [inputValue, setInputValue] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);

  const handleAddItem = (item) => {
    if (!item || !item.trim()) return;

    const trimmedItem = item.trim().toLowerCase();

    // Check if already exists
    if (value.includes(trimmedItem)) {
      setInputValue("");
      return;
    }

    // Check max items limit
    if (maxItems && value.length >= maxItems) {
      return;
    }

    onChange([...value, trimmedItem]);
    setInputValue("");
    setShowSuggestions(false);
  };

  const handleRemoveItem = (itemToRemove) => {
    onChange(value.filter((item) => item !== itemToRemove));
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      if (allowCustom && inputValue) {
        handleAddItem(inputValue);
      }
    } else if (e.key === "Backspace" && !inputValue && value.length > 0) {
      handleRemoveItem(value[value.length - 1]);
    }
  };

  const filteredSuggestions = suggestions.filter(
    (suggestion) =>
      !value.includes(suggestion.toLowerCase()) &&
      suggestion.toLowerCase().includes(inputValue.toLowerCase())
  );

  return (
    <div className={className}>
      {label && (
        <label className="block text-sm font-medium mb-2">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
          {maxItems && (
            <span className="text-gray-400 text-xs ml-2">
              {value.length}/{maxItems}
            </span>
          )}
        </label>
      )}

      <div
        className={`
          w-full px-3 py-2
          bg-[#0e0e0f]
          border ${error ? 'border-red-500' : 'border-[#2a2a2d]'}
          rounded-lg
          focus-within:border-cyan
          transition-colors
        `}
      >
        {/* Selected items */}
        <div className="flex flex-wrap gap-2 mb-2">
          {value.map((item) => (
            <div
              key={item}
              className="inline-flex items-center gap-1 px-3 py-1 bg-cyan/10 text-cyan-400 rounded-md text-sm"
            >
              <span>{item}</span>
              <button
                type="button"
                onClick={() => handleRemoveItem(item)}
                className="hover:text-cyan-300 transition-colors"
                aria-label={`Remove ${item}`}
              >
                <X size={14} />
              </button>
            </div>
          ))}
        </div>

        {/* Input */}
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
            className="w-full bg-transparent text-white placeholder-gray-500 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed"
          />

          {/* Suggestions dropdown */}
          {showSuggestions && filteredSuggestions.length > 0 && (
            <div className="absolute z-10 w-full mt-1 bg-[#1b1b1d] border border-[#2a2a2d] rounded-lg shadow-lg max-h-48 overflow-y-auto">
              {filteredSuggestions.map((suggestion) => (
                <button
                  key={suggestion}
                  type="button"
                  onClick={() => handleAddItem(suggestion)}
                  className="w-full px-4 py-2 text-left text-white hover:bg-[#2a2a2d] transition-colors flex items-center gap-2"
                >
                  <Plus size={14} className="text-cyan-400" />
                  {suggestion}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {helperText && !error && (
        <p className="mt-2 text-sm text-gray-400">{helperText}</p>
      )}
      {error && (
        <p className="mt-2 text-sm text-red-500">{error}</p>
      )}
    </div>
  );
}

export default MultiSelect;
