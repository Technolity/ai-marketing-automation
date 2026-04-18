export function FormSection({
    title,
    description,
    children,
    className = "",
    variant = "default",
}) {
    const variantStyle = {
        default: { backgroundColor: "#0D1217", borderColor: "#1E2A34" },
        danger: { backgroundColor: "rgba(239,68,68,0.04)", borderColor: "rgba(239,68,68,0.2)" },
        info: { backgroundColor: "rgba(22,199,231,0.04)", borderColor: "rgba(22,199,231,0.2)" },
    };

    const titleColor = {
        default: "#F4F8FB",
        danger: "#f87171",
        info: "#16C7E7",
    };

    const style = variantStyle[variant] || variantStyle.default;

    return (
        <div
            className={`p-6 rounded-xl border ${className}`}
            style={{ backgroundColor: style.backgroundColor, borderColor: style.borderColor }}
        >
            {(title || description) && (
                <div className="mb-5">
                    {title && (
                        <h3
                            className="text-base font-semibold mb-1"
                            style={{ color: titleColor[variant] || titleColor.default }}
                        >
                            {title}
                        </h3>
                    )}
                    {description && (
                        <p className="text-sm" style={{ color: "#B2C0CD" }}>{description}</p>
                    )}
                </div>
            )}
            <div className="space-y-5">{children}</div>
        </div>
    );
}

export default FormSection;
