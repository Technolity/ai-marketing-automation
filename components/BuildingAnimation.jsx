"use client";
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, CheckCircle, Loader2, Cpu, Zap, Shield, Database, Send } from 'lucide-react';

const BUILD_ITEMS = [
    { key: 'message', label: 'Message Engine' },
    { key: 'offer', label: 'Offer Architecture' },
    { key: 'icp', label: 'Client DNA' },
    { key: 'ads', label: 'Ad Creatives' },
    { key: 'emails', label: 'Nurture Sequences' },
    { key: 'scripts', label: 'Sales Scripts' },
];

export default function BuildingAnimation({ processingMessage, isGenerating = true }) {
    const [completedItems, setCompletedItems] = useState([]);
    const [currentItemIndex, setCurrentItemIndex] = useState(0);

    useEffect(() => {
        if (!isGenerating) return;

        const interval = setInterval(() => {
            setCurrentItemIndex(prev => {
                if (prev < BUILD_ITEMS.length) {
                    setCompletedItems(items => [...items, BUILD_ITEMS[prev].key]);
                    return prev + 1;
                }
                return prev;
            });
        }, 6000);

        return () => clearInterval(interval);
    }, [isGenerating]);

    return (
        <div className="fixed inset-0 z-[100] bg-[#0c0c0d] flex items-center justify-center overflow-hidden">
            {/* Matrix Pulse Background */}
            <div className="absolute inset-0 overflow-hidden opacity-20">
                <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_50%_50%,#22d3ee22_0%,transparent_70%)]" />
                <motion.div
                    animate={{
                        opacity: [0.1, 0.3, 0.1],
                        scale: [1, 1.1, 1]
                    }}
                    transition={{ duration: 4, repeat: Infinity }}
                    className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-overlay"
                />
            </div>

            <div className="text-center max-w-4xl px-8 relative z-10 w-full">
                {/* Advanced Tech Core */}
                <div className="relative w-48 h-48 mx-auto mb-12">
                    <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                        className="absolute inset-0 border border-cyan/20 rounded-full"
                    />
                    <motion.div
                        animate={{ rotate: -360 }}
                        transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
                        className="absolute inset-4 border border-blue-500/20 rounded-full border-dashed"
                    />
                    <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
                        className="absolute inset-8 border-2 border-t-cyan border-transparent rounded-full"
                    />

                    <div className="absolute inset-0 flex items-center justify-center">
                        <motion.div
                            animate={{
                                scale: [1, 1.15, 1],
                                opacity: [0.5, 1, 0.5]
                            }}
                            transition={{ duration: 2, repeat: Infinity }}
                            className="bg-cyan/10 p-6 rounded-full blur-xl absolute"
                        />
                        <Sparkles className="w-12 h-12 text-cyan relative z-10 drop-shadow-[0_0_15px_rgba(34,211,238,0.8)]" />
                    </div>

                    {/* Orbital Icons */}
                    <OrbitalIcon angle={0} icon={<Cpu className="w-4 h-4" />} color="text-cyan" delay={0} />
                    <OrbitalIcon angle={120} icon={<Database className="w-4 h-4" />} color="text-blue-500" delay={0.5} />
                    <OrbitalIcon angle={240} icon={<Shield className="w-4 h-4" />} color="text-indigo-500" delay={1} />
                </div>

                <motion.div
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    className="space-y-4"
                >
                    <h1 className="text-4xl md:text-5xl font-black text-white tracking-tighter uppercase italic">
                        Architecting <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan to-blue-500">Your Empire</span>
                    </h1>
                    <p className="text-gray-500 font-mono text-sm tracking-widest uppercase mb-12">
                        System Protocol: {processingMessage || "Synthesizing Neural Assets"}
                    </p>
                </motion.div>

                {/* Checklist Matrix */}
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-12 max-w-2xl mx-auto">
                    {BUILD_ITEMS.map((item, index) => {
                        const isCompleted = completedItems.includes(item.key);
                        const isCurrent = index === currentItemIndex && !isCompleted;

                        return (
                            <motion.div
                                key={item.key}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: index * 0.1 }}
                                className={`relative p-4 rounded-2xl border transition-all duration-500 ${isCompleted
                                        ? 'bg-cyan/10 border-cyan/30'
                                        : isCurrent
                                            ? 'bg-white/5 border-cyan/50 shadow-[0_0_20px_rgba(34,211,238,0.15)]'
                                            : 'bg-white/[0.02] border-white/5'
                                    }`}
                            >
                                <div className="flex items-center gap-3">
                                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${isCompleted ? 'bg-cyan text-black' : 'bg-white/5 text-gray-600'
                                        }`}>
                                        {isCompleted ? <CheckCircle className="w-5 h-5" /> : isCurrent ? <Loader2 className="w-5 h-5 animate-spin text-cyan" /> : <div className="w-2 h-2 rounded-full bg-current" />}
                                    </div>
                                    <span className={`text-xs font-bold uppercase tracking-tight ${isCompleted ? 'text-white' : isCurrent ? 'text-cyan' : 'text-gray-600'}`}>
                                        {item.label}
                                    </span>
                                </div>
                                {isCurrent && (
                                    <motion.div
                                        layoutId="active-glow"
                                        className="absolute inset-0 rounded-2xl border-2 border-cyan/50 pointer-events-none"
                                    />
                                )}
                            </motion.div>
                        );
                    })}
                </div>

                {/* Bottom Status Bar */}
                <div className="max-w-md mx-auto">
                    <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden mb-4 border border-white/5">
                        <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${(completedItems.length / BUILD_ITEMS.length) * 100}%` }}
                            className="h-full bg-gradient-to-r from-cyan via-blue-500 to-indigo-600"
                        />
                    </div>
                    <div className="flex justify-between items-center text-[10px] font-black tracking-widest text-gray-500 uppercase">
                        <span className="flex items-center gap-1"><Zap className="w-3 h-3" /> Processing Neural Link</span>
                        <span>EST: 45.2s</span>
                    </div>
                </div>
            </div>

            {/* Matrix Grid Decoration */}
            <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:40px_40px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]" />
        </div>
    );
}

function OrbitalIcon({ angle, icon, color, delay }) {
    return (
        <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 12, repeat: Infinity, ease: "linear", delay }}
            className="absolute inset-0 flex items-center justify-center"
        >
            <div
                style={{ transform: `rotate(-${angle}deg) translate(80px) rotate(${angle}deg)` }}
                className={`w-8 h-8 rounded-lg bg-[#131314] border border-white/10 flex items-center justify-center ${color} shadow-2xl`}
            >
                {icon}
            </div>
        </motion.div>
    );
}
