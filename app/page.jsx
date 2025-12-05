// app/page.jsx
"use client";
import Link from "next/link";
import { motion } from "framer-motion";
import { Zap, Target, Rocket } from "lucide-react";

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center relative overflow-hidden px-6 pt-20">
      {/* Background Glows - Premium Electric Cyan */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[800px] bg-cyan/10 rounded-full blur-[120px] -z-10 pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-cyan/8 rounded-full blur-[150px] -z-10 pointer-events-none" />
      <div className="absolute top-1/2 right-0 w-[500px] h-[500px] bg-cyan/12 rounded-full blur-[100px] -z-10 pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="max-w-5xl text-center relative z-10"
      >
        <div className="inline-block mb-6 px-4 py-1.5 rounded-full glass border border-cyan/30 text-cyan text-sm font-medium tracking-wide shadow-glow-sm">
          TedOS v1.0
        </div>

        <h1 className="text-6xl md:text-7xl lg:text-8xl font-bold mb-8 text-white tracking-tight leading-tight drop-shadow-2xl">
          Your Business <br />
          <span className="text-cyan text-glow">Built For You</span> in
          <span className="text-cyan text-glow-lg"> 12 Minutes</span>
        </h1>

        <p className="text-xl md:text-2xl text-gray-300 mb-12 max-w-3xl mx-auto font-light leading-relaxed">
          God-tier AI system that builds <span className="text-cyan font-medium">VSL scripts</span>, <span className="text-cyan font-medium">email sequences</span>, <span className="text-cyan font-medium">ad campaigns</span>,
          and complete funnels—deployed instantly to GoHighLevel.
        </p>

        <Link href="/auth/signup">
          <motion.button
            whileHover={{ scale: 1.05, boxShadow: "0 0 50px rgba(0, 229, 255, 0.8)" }}
            whileTap={{ scale: 0.98 }}
            className="bg-cyan text-black px-16 py-6 text-2xl font-bold rounded-full shadow-glow-xl transition-all duration-300 border border-cyan relative overflow-hidden group"
          >
            <span className="relative z-10 font-black">Initialize TedOS →</span>
            <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
          </motion.button>
        </Link>

        <p className="mt-8 text-sm text-gray-500 font-medium tracking-wide uppercase">Zero setup • Deploy in 12 minutes</p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4, duration: 0.8 }}
        className="mt-32 grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl w-full px-4"
      >
        {[
          { icon: <Zap className="w-6 h-6 text-cyan" />, title: "Instant Deployment", desc: "Complete business systems in 12 minutes" },
          { icon: <Target className="w-6 h-6 text-cyan" />, title: "God-Tier AI", desc: "Terminator-level intelligence writing your copy" },
          { icon: <Rocket className="w-6 h-6 text-cyan" />, title: "One-Click Push", desc: "Deploy to GoHighLevel instantly" }
        ].map((feature, i) => (
          <div key={i} className="glass-card p-10 rounded-2xl hover:border-cyan/50 transition-all duration-300 group hover:-translate-y-2 hover:shadow-glow-lg">
            <div className="text-6xl mb-6 group-hover:scale-110 transition-transform duration-300">{feature.icon}</div>
            <h3 className="text-2xl font-bold mb-3 text-white">{feature.title}</h3>
            <p className="text-gray-400 leading-relaxed">{feature.desc}</p>
          </div>
        ))}
      </motion.div>
    </div>
  );
}
