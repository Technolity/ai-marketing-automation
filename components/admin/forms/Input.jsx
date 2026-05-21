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
    className = "",
}) {
    return (
        <div className={className}>
            {label && (
                <label className="block text-sm font-medium mb-2" style={{ color: "#F4F8FB" }}>
                    {label}
                    {required && <span className="ml-1" style={{ color: "#f87171" }}>*</span>}
                </label>
            )}
            <input
                type={type}
                value={value}
                onChange={onChange}
                placeholder={placeholder}
                required={required}
                disabled={disabled}
                style={{
                    width: "100%",
                    padding: "10px 16px",
                    backgroundColor: "#121920",
                    border: `1px solid ${error ? "#f87171" : "#1E2A34"}`,
                    borderRadius: "10px",
                    color: "#F4F8FB",
                    fontSize: "14px",
                    outline: "none",
                    transition: "border-color 0.15s",
                    opacity: disabled ? 0.5 : 1,
                    cursor: disabled ? "not-allowed" : "text",
                }}
                onFocus={e => { if (!error) e.target.style.borderColor = "#16C7E7"; }}
                onBlur={e => { if (!error) e.target.style.borderColor = "#1E2A34"; }}
                className="placeholder-[#5a6a78]"
            />
            {helperText && !error && (
                <p className="mt-1.5 text-xs" style={{ color: "#B2C0CD" }}>{helperText}</p>
            )}
            {error && (
                <p className="mt-1.5 text-xs" style={{ color: "#f87171" }}>{error}</p>
            )}
        </div>
    );
}

export default Input;
