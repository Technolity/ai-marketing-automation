/**
 * Reusable Textarea Component for Admin Forms
 * Maintains consistent styling across all admin pages
 */

export function Textarea({
  label,
  value,
  onChange,
  placeholder = "",
  rows = 4,
  required = false,
  disabled = false,
  error = "",
  helperText = "",
  className = "",
  maxLength = null
}) {
  return (
    <div className={className}>
      {label && (
        <label className="block text-sm font-medium mb-2">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
          {maxLength && value && (
            <span className="text-gray-400 text-xs ml-2">
              {value.length}/{maxLength}
            </span>
          )}
        </label>
      )}
      <textarea
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        rows={rows}
        required={required}
        disabled={disabled}
        maxLength={maxLength}
        className={`
          w-full px-4 py-3
          bg-[#0e0e0f]
          border ${error ? 'border-red-500' : 'border-[#2a2a2d]'}
          rounded-lg
          text-white
          placeholder-gray-500
          focus:outline-none
          focus:border-cyan
          transition-colors
          resize-none
          disabled:opacity-50
          disabled:cursor-not-allowed
        `}
      />
      {helperText && !error && (
        <p className="mt-2 text-sm text-gray-400">{helperText}</p>
      )}
      {error && (
        <p className="mt-2 text-sm text-red-500">{error}</p>
      )}
    </div>
  );
}

export default Textarea;
