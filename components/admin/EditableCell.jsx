"use client";
import { useState, useEffect, useRef } from "react";
import { Pencil, Check, X, AlertCircle, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

/**
 * EditableCell Component
 * Allows inline editing of table cells with validation and real-time updates
 *
 * Types supported:
 * - text: Simple text input
 * - number: Number input with min/max validation
 * - select: Dropdown selection
 *
 * Features:
 * - Hover to reveal edit button
 * - Click to enter edit mode
 * - Validation with error messages
 * - Optimistic UI updates
 * - Loading states
 * - Keyboard shortcuts (Enter to save, Esc to cancel)
 */

const SUBSCRIPTION_TIERS = [
  { value: 'starter', label: 'Starter', color: 'text-gray-400' },
  { value: 'growth', label: 'Growth', color: 'text-cyan' },
  { value: 'scale', label: 'Scale', color: 'text-purple-400' }
];

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
  disabled = false
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(value);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isHovered, setIsHovered] = useState(false);
  const inputRef = useRef(null);

  useEffect(() => {
    setEditValue(value);
  }, [value]);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      if (type === 'text' || type === 'number') {
        inputRef.current.select();
      }
    }
  }, [isEditing, type]);

  const validate = (val) => {
    // Required validation
    if (validation.required && (val === '' || val === null || val === undefined)) {
      return 'This field is required';
    }

    // Number validations
    if (type === 'number') {
      const numVal = Number(val);
      if (isNaN(numVal)) {
        return 'Must be a valid number';
      }
      if (validation.min !== undefined && numVal < validation.min) {
        return `Must be at least ${validation.min}`;
      }
      if (validation.max !== undefined && numVal > validation.max) {
        return `Must be at most ${validation.max}`;
      }
      if (validation.integer && !Number.isInteger(numVal)) {
        return 'Must be a whole number';
      }
    }

    // Custom validation function
    if (validation.custom && typeof validation.custom === 'function') {
      return validation.custom(val);
    }

    return null;
  };

  const handleEdit = () => {
    if (disabled) return;
    setIsEditing(true);
    setError(null);
  };

  const handleCancel = () => {
    setIsEditing(false);
    setEditValue(value);
    setError(null);
  };

  const handleSave = async () => {
    // Validate
    const validationError = validate(editValue);
    if (validationError) {
      setError(validationError);
      return;
    }

    // Don't save if value hasn't changed
    if (editValue === value) {
      setIsEditing(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      await onSave(field, editValue, userId);
      setIsEditing(false);
    } catch (err) {
      console.error(`Error saving ${field}:`, err);
      setError(err.message || 'Failed to save. Please try again.');
      // Revert to original value on error
      setEditValue(value);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSave();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      handleCancel();
    }
  };

  const renderViewMode = () => {
    const displayValue = displayFormatter(value);

    if (type === 'select' && field === 'subscription_tier') {
      const tier = SUBSCRIPTION_TIERS.find(t => t.value === value);
      return (
        <span className={`px-3 py-1 rounded-full text-xs font-medium capitalize ${
          tier?.value === 'starter' ? 'bg-gray-500/20 text-gray-400' :
          tier?.value === 'growth' ? 'bg-cyan/20 text-cyan' :
          tier?.value === 'scale' ? 'bg-purple-500/20 text-purple-400' :
          'bg-gray-500/20 text-gray-400'
        }`}>
          {tier?.label || value || 'Starter'}
        </span>
      );
    }

    return (
      <span className="text-white">
        {displayValue !== null && displayValue !== undefined ? displayValue : '-'}
      </span>
    );
  };

  const renderEditMode = () => {
    if (type === 'select') {
      const selectOptions = field === 'subscription_tier' ? SUBSCRIPTION_TIERS : options;

      return (
        <select
          ref={inputRef}
          value={editValue || ''}
          onChange={(e) => setEditValue(e.target.value)}
          onKeyDown={handleKeyDown}
          className="w-full px-3 py-1.5 bg-[#0e0e0f] border border-cyan rounded-lg text-white text-sm focus:outline-none focus:border-cyan/60"
          disabled={isLoading}
        >
          {selectOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      );
    }

    if (type === 'number') {
      return (
        <input
          ref={inputRef}
          type="number"
          value={editValue || ''}
          onChange={(e) => setEditValue(e.target.value)}
          onKeyDown={handleKeyDown}
          min={validation.min}
          max={validation.max}
          step={validation.step || 1}
          className="w-full px-3 py-1.5 bg-[#0e0e0f] border border-cyan rounded-lg text-white text-sm focus:outline-none focus:border-cyan/60"
          disabled={isLoading}
        />
      );
    }

    // Default: text input
    return (
      <input
        ref={inputRef}
        type="text"
        value={editValue || ''}
        onChange={(e) => setEditValue(e.target.value)}
        onKeyDown={handleKeyDown}
        className="w-full px-3 py-1.5 bg-[#0e0e0f] border border-cyan rounded-lg text-white text-sm focus:outline-none focus:border-cyan/60"
        disabled={isLoading}
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
                transition={{ duration: 0.15 }}
                onClick={handleEdit}
                className="p-1.5 hover:bg-cyan/10 rounded-lg transition-colors"
                title={`Edit ${field}`}
              >
                <Pencil className="w-3.5 h-3.5 text-gray-400 group-hover:text-cyan" />
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
              className="p-1.5 bg-cyan/20 hover:bg-cyan/30 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              title="Save changes"
            >
              {isLoading ? (
                <Loader2 className="w-3.5 h-3.5 text-cyan animate-spin" />
              ) : (
                <Check className="w-3.5 h-3.5 text-cyan" />
              )}
            </button>

            <button
              onClick={handleCancel}
              disabled={isLoading}
              className="p-1.5 hover:bg-red-500/20 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              title="Cancel"
            >
              <X className="w-3.5 h-3.5 text-gray-400 hover:text-red-400" />
            </button>
          </div>

          {error && (
            <motion.div
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center gap-1.5 text-xs text-red-400 bg-red-500/10 px-2 py-1 rounded border border-red-500/20"
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
