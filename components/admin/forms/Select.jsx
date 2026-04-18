export function Select({
    label,
    value,
    onChange,
    options = [],
    placeholder = "Select an option",
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
            <select
                value={value}
                onChange={onChange}
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
                    cursor: disabled ? "not-allowed" : "pointer",
                    opacity: disabled ? 0.5 : 1,
                    transition: "border-color 0.15s",
                    appearance: "auto",
                }}
                onFocus={e => { if (!error) e.target.style.borderColor = "#16C7E7"; }}
                onBlur={e => { if (!error) e.target.style.borderColor = "#1E2A34"; }}
            >
                {placeholder && (
                    <option value="" disabled style={{ backgroundColor: "#121920" }}>
                        {placeholder}
                    </option>
                )}
                {options.map((option) => (
                    <option
                        key={option.value}
                        value={option.value}
                        style={{ backgroundColor: "#121920", color: "#F4F8FB" }}
                    >
                        {option.label}
                    </option>
                ))}
            </select>
            {helperText && !error && (
                <p className="mt-1.5 text-xs" style={{ color: "#B2C0CD" }}>{helperText}</p>
            )}
            {error && (
                <p className="mt-1.5 text-xs" style={{ color: "#f87171" }}>{error}</p>
            )}
        </div>
    );
}

export default Select;
