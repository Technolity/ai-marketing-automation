/**
 * Reusable Toggle Switch Component for Admin Forms
 * Maintains consistent styling across all admin pages
 */

export function Toggle({
  label,
  description,
  value,
  onChange,
  disabled = false,
  color = "cyan", // cyan, red, green
  className = ""
}) {
  const colorClasses = {
    cyan: value ? "bg-cyan" : "bg-gray-600",
    red: value ? "bg-red-500" : "bg-gray-600",
    green: value ? "bg-green-500" : "bg-gray-600"
  };

  return (
    <div className={`flex items-center justify-between p-4 bg-[#0e0e0f] rounded-lg ${className}`}>
      <div className="flex-1">
        {label && <p className="font-medium">{label}</p>}
        {description && <p className="text-sm text-gray-400">{description}</p>}
      </div>
      <button
        type="button"
        onClick={() => !disabled && onChange(!value)}
        disabled={disabled}
        className={`
          relative w-14 h-7 rounded-full transition-colors
          ${colorClasses[color]}
          ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
        `}
        aria-label={label || 'Toggle switch'}
        role="switch"
        aria-checked={value}
      >
        <div
          className={`
            absolute top-1 left-1 w-5 h-5 bg-white rounded-full
            transition-transform duration-200
            ${value ? 'translate-x-7' : 'translate-x-0'}
          `}
        />
      </button>
    </div>
  );
}

export default Toggle;
