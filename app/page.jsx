// app/page.jsx
"use client";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, Zap, Target, Rocket } from "lucide-react";

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center relative overflow-hidden px-6 pt-20">
      {/* Background Glows */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[800px] bg-accentRed/10 rounded-full blur-[120px] -z-10 pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-blue-900/10 rounded-full blur-[120px] -z-10 pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="max-w-5xl text-center relative z-10"
      >
        <div className="inline-block mb-6 px-4 py-1.5 rounded-full glass border border-accentRed/30 text-accentRed text-sm font-medium tracking-wide">
          ✨ The Future of Funnel Building
        </div>

        <h1 className="text-6xl md:text-7xl lg:text-8xl font-bold mb-8 text-white tracking-tight leading-tight drop-shadow-2xl">
          Build Your Complete <br />
          <span className="bg-gradient-to-r from-white via-gray-200 to-gray-400 bg-clip-text text-transparent">Marketing Funnel</span> in
          <span className="bg-gradient-to-r from-accentRed to-crimson bg-clip-text text-transparent"> 10 Minutes</span>
        </h1>

        <p className="text-xl md:text-2xl text-gray-300 mb-12 max-w-3xl mx-auto font-light leading-relaxed">
          AI-powered platform that generates <span className="text-white font-medium">VSL scripts</span>, <span className="text-white font-medium">email sequences</span>, <span className="text-white font-medium">ad campaigns</span>,
          and complete funnels—ready to deploy in GoHighLevel.
        </p>

        <Link href="/auth/signup">
          <motion.button
            whileHover={{ scale: 1.05, boxShadow: "0 0 30px rgba(225, 29, 72, 0.5)" }}
            whileTap={{ scale: 0.98 }}
            className="bg-gradient-to-r from-accentRed to-crimson text-white px-16 py-6 text-2xl font-bold rounded-full shadow-glow transition-all duration-300 border border-white/10 relative overflow-hidden group"
          >
            <span className="relative z-10">Start Building Now →</span>
            <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
          </motion.button>
        </Link>

        <p className="mt-8 text-sm text-gray-500 font-medium tracking-wide uppercase">No credit card required • 5 minute setup</p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4, duration: 0.8 }}
        className="mt-32 grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl w-full px-4"
      >
        {[
          { icon: <Zap className="w-6 h-6 text-yellow-500" />, title: "Instant Generation", desc: "Complete funnels in minutes, not weeks" },
          { icon: <Target className="w-6 h-6 text-red-500" />, title: "AI-Powered Copy", desc: "VSL scripts, emails, and ads written for you" },
          { icon: <Rocket className="w-6 h-6 text-blue-500" />, title: "Deploy to GHL", desc: "Push directly to GoHighLevel with one click" }
        ].map((feature, i) => (
          <div key={i} className="glass-card p-10 rounded-2xl hover:border-accentRed/50 transition-all duration-300 group hover:-translate-y-2">
            <div className="text-6xl mb-6 group-hover:scale-110 transition-transform duration-300">{feature.icon}</div>
            <h3 className="text-2xl font-bold mb-3 text-white">{feature.title}</h3>
            <p className="text-gray-400 leading-relaxed">{feature.desc}</p>
          </div>
        ))}
      </motion.div>
    </div>
  );
}
