'use client';

export function UL({ items }) {
  return (
    <ul className="list-disc pl-5 space-y-1 mt-2">
      {items.map((item, i) => <li key={i}>{item}</li>)}
    </ul>
  );
}

export function SubSection({ label, children }) {
  return (
    <div className="mt-4">
      <p className="font-semibold text-[#9CB3C5] mb-2">{label}</p>
      {children}
    </div>
  );
}
