/* Reusable  ——— Label ———  pill — used before every section H2 */
export function SectionLabel({ text, align = "center", className = "" }) {
  return (
    <div
      className={`flex items-center gap-3 mb-5 ${
        align === "center" ? "justify-center" : "justify-start"
      } ${className}`}
    >
      <div className="h-px w-16 bg-gradient-to-r from-transparent to-[rgba(0,229,255,0.5)]" />
      <span className="text-[#00E5FF] text-xs font-poppins font-medium tracking-[0.2em] uppercase whitespace-nowrap">
        {text}
      </span>
      <div className="h-px w-16 bg-gradient-to-l from-transparent to-[rgba(0,229,255,0.5)]" />
    </div>
  );
}
