"use client";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
    CheckCircle, Circle, ArrowRight, Download, Rocket,
    Layout, MessageSquare, BookOpen, DollarSign, Phone,
    Magnet, Video, Mail, Megaphone, Edit3
} from "lucide-react";
import Link from "next/link";

const STEPS = [
    { id: 1, title: "Ideal Client Builder", icon: CheckCircle },
    { id: 2, title: "Million-Dollar Message", icon: MessageSquare },
    { id: 3, title: "Signature Story Creator", icon: BookOpen },
    { id: 4, title: "High-Ticket Offer Builder", icon: DollarSign },
    { id: 5, title: "Personalized Sales Scripts", icon: Phone },
    { id: 6, title: "Lead Magnet Generator", icon: Magnet },
    { id: 7, title: "VSL Builder", icon: Video },
    { id: 8, title: "15-Day Email Sequence", icon: Mail },
    { id: 9, title: "Ad Copy & Creative", icon: Megaphone },
    { id: 10, title: "Funnel Copy", icon: Layout },
];

export default function Dashboard() {
    const [progress, setProgress] = useState({});
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        // Fetch progress from API (mock for now or implement endpoint)
        // For MVP, we'll assume we can get this status. 
        // Real implementation would fetch from 'slide_results' table via an API.
        const fetchProgress = async () => {
            try {
                // Mock response
                const mockProgress = {
                    1: true, 2: true, 3: false // Example
                };
                setProgress(mockProgress);
            } catch (error) {
                console.error("Failed to fetch progress", error);
            } finally {
                setIsLoading(false);
            }
        };
        fetchProgress();
    }, []);

    return (
        <div className="min-h-screen bg-[#0e0e0f] text-white font-sans">
            {/* Top Bar */}
            <div className="h-16 border-b border-[#1b1b1d] bg-[#0e0e0f] flex items-center justify-between px-8">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-gradient-to-br from-red-600 to-red-800 rounded-lg flex items-center justify-center">
                        <span className="font-bold text-white">S</span>
                    </div>
                    <span className="font-bold text-lg tracking-tight">Scalez Media</span>
                </div>
                <div className="flex items-center gap-4">
                    <div className="w-8 h-8 rounded-full bg-gray-800 flex items-center justify-center text-sm font-bold">
                        JD
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto p-8">
                <h1 className="text-3xl font-bold mb-8">Project Dashboard</h1>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                    {/* Progress Overview */}
                    <div className="lg:col-span-2 space-y-6">
                        <div className="bg-[#1b1b1d] rounded-2xl border border-[#2a2a2d] p-6">
                            <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
                                <Rocket className="w-5 h-5 text-red-500" />
                                Implementation Steps
                            </h2>
                            <div className="space-y-3">
                                {STEPS.map((step) => (
                                    <div key={step.id} className="flex items-center justify-between p-4 bg-[#0e0e0f] rounded-xl border border-[#2a2a2d] hover:border-red-900/50 transition-colors group">
                                        <div className="flex items-center gap-4">
                                            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${progress[step.id] ? 'bg-green-500/20 text-green-500' : 'bg-gray-800 text-gray-500'}`}>
                                                {progress[step.id] ? <CheckCircle className="w-5 h-5" /> : <Circle className="w-5 h-5" />}
                                            </div>
                                            <span className={`font-medium ${progress[step.id] ? 'text-white' : 'text-gray-400'}`}>
                                                {step.title}
                                            </span>
                                        </div>
                                        <Link href={`/os?step=${step.id}`}>
                                            <button className="px-4 py-2 rounded-lg bg-[#1b1b1d] hover:bg-red-600 hover:text-white text-gray-400 text-sm font-medium transition-all opacity-0 group-hover:opacity-100 flex items-center gap-2">
                                                Open <ArrowRight className="w-4 h-4" />
                                            </button>
                                        </Link>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Quick Actions & Preview */}
                    <div className="space-y-6">
                        <div className="bg-[#1b1b1d] rounded-2xl border border-[#2a2a2d] p-6">
                            <h2 className="text-xl font-bold mb-6">Quick Actions</h2>
                            <div className="space-y-4">
                                <button className="w-full py-4 bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold flex items-center justify-center gap-2 transition-all shadow-lg shadow-red-900/20">
                                    <Rocket className="w-5 h-5" /> Deploy to GoHighLevel
                                </button>
                                <button className="w-full py-4 bg-[#0e0e0f] hover:bg-[#2a2a2d] text-white border border-[#2a2a2d] rounded-xl font-bold flex items-center justify-center gap-2 transition-all">
                                    <Download className="w-5 h-5" /> Download Bundle JSON
                                </button>
                            </div>
                        </div>

                        <div className="bg-[#1b1b1d] rounded-2xl border border-[#2a2a2d] p-6">
                            <h2 className="text-xl font-bold mb-4">Need Help?</h2>
                            <p className="text-gray-400 text-sm mb-4">
                                Watch the training tutorials to get the most out of your automation system.
                            </p>
                            <button className="text-red-500 font-medium text-sm hover:underline">
                                View Tutorials →
                            </button>
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
}
