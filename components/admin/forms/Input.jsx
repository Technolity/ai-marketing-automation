/**
 * Reusable Input Component for Admin Forms
 * Maintains consistent styling across all admin pages
 */

export function Input({
  label,
  value,
  onChange,
  type = "text",
  placeholder = "",
  required = false,
  disabled = false,
  error = "",
  helperText = "",
  className = ""
}) {
  return (
    <div className={className}>
      {label && (
        <label className="block text-sm font-medium mb-2">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      <input
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        required={required}
        disabled={disabled}
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

export default Input;
