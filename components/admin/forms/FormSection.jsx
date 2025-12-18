/**
 * Reusable FormSection Component for Admin Forms
 * Groups related form fields together with consistent styling
 */

export function FormSection({
  title,
  description,
  children,
  className = "",
  variant = "default" // "default", "danger", "info"
}) {
  const variantClasses = {
    default: "bg-[#0e0e0f] border-[#2a2a2d]",
    danger: "bg-red-500/5 border-red-500/20",
    info: "bg-cyan/5 border-cyan/20"
  };

  return (
    <div className={`p-6 rounded-lg border ${variantClasses[variant]} ${className}`}>
      {(title || description) && (
        <div className="mb-6">
          {title && <h3 className="text-lg font-semibold mb-2">{title}</h3>}
          {description && <p className="text-sm text-gray-400">{description}</p>}
        </div>
      )}
      <div className="space-y-6">{children}</div>
    </div>
  );
}

export default FormSection;
