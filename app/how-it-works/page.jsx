import Link from "next/link";

export default function HowItWorksPage() {
  return (
    <main
      className="min-h-screen flex flex-col items-center justify-center px-4"
      style={{ background: "#00031C" }}
    >
      <div className="text-center max-w-lg">
        <p className="text-[#00E5FF] font-poppins text-sm uppercase tracking-widest mb-4">How It Works</p>
        <h1
          className="font-poppins font-medium text-[#F4F7FF] mb-4"
          style={{ fontSize: "clamp(32px,4vw,48px)" }}
        >
          Coming Soon
        </h1>
        <p className="text-[#94A3B8] font-poppins text-base leading-relaxed mb-8">
          We're working on this page. Check back soon.
        </p>
        <Link
          href="/"
          className="inline-flex items-center gap-2 px-6 py-3 rounded-full font-poppins font-semibold text-sm text-[#00031C]"
          style={{ background: "#00E5FF" }}
        >
          ← Back to Home
        </Link>
      </div>
    </main>
  );
}
