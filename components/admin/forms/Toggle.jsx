export function Toggle({
    label,
    description,
    value,
    onChange,
    disabled = false,
    color = "cyan",
    className = "",
}) {
    const trackColor = {
        cyan: value ? "#16C7E7" : "#1E2A34",
        red: value ? "#ef4444" : "#1E2A34",
        green: value ? "#22c55e" : "#1E2A34",
    };

    return (
        <div
            className={`flex items-center justify-between p-4 rounded-xl ${className}`}
            style={{ backgroundColor: "#0D1217", border: "1px solid #1E2A34" }}
        >
            <div className="flex-1 mr-4">
                {label && (
                    <p className="text-sm font-medium" style={{ color: "#F4F8FB" }}>{label}</p>
                )}
                {description && (
                    <p className="text-xs mt-0.5" style={{ color: "#B2C0CD" }}>{description}</p>
                )}
            </div>
            <button
                type="button"
                onClick={() => !disabled && onChange(!value)}
                disabled={disabled}
                aria-label={label || "Toggle switch"}
                role="switch"
                aria-checked={value}
                style={{
                    position: "relative",
                    width: "48px",
                    height: "26px",
                    borderRadius: "999px",
                    backgroundColor: trackColor[color] || trackColor.cyan,
                    transition: "background-color 0.2s",
                    cursor: disabled ? "not-allowed" : "pointer",
                    opacity: disabled ? 0.5 : 1,
                    flexShrink: 0,
                    border: "none",
                    outline: "none",
                }}
            >
                <div
                    style={{
                        position: "absolute",
                        top: "3px",
                        left: value ? "calc(100% - 23px)" : "3px",
                        width: "20px",
                        height: "20px",
                        borderRadius: "50%",
                        backgroundColor: "#F4F8FB",
                        transition: "left 0.2s",
                        boxShadow: "0 1px 3px rgba(0,0,0,0.4)",
                    }}
                />
            </button>
        </div>
    );
}

export default Toggle;
