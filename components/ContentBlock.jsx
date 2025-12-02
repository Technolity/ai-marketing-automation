// components/ContentBlock.jsx
"use client";
import CopyButton from "./CopyButton";

export default function ContentBlock({ title, content, icon, color = "border-accentRed" }) {
  return (
    <div className={`bg-grayDark rounded-xl border-l-4 ${color} p-6 hover:shadow-lg transition-all`}>
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          {icon && <span className="text-3xl">{icon}</span>}
          <h3 className="text-2xl font-bold">{title}</h3>
        </div>
        <CopyButton text={typeof content === 'string' ? content : JSON.stringify(content, null, 2)} />
      </div>
      
      <div className="text-gray-300 whitespace-pre-line">
        {typeof content === 'string' ? (
          <p>{content}</p>
        ) : Array.isArray(content) ? (
          <ul className="space-y-2">
            {content.map((item, i) => (
              <li key={i} className="flex items-start">
                <span className="text-accentRed mr-2">•</span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        ) : (
          <pre className="text-sm overflow-x-auto">{JSON.stringify(content, null, 2)}</pre>
        )}
      </div>
    </div>
  );
}
