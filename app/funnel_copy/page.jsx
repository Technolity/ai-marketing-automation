"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  ArrowLeft, Download, Copy, CheckCircle, Star, PlayCircle,
  Shield, Zap, Target, TrendingUp, Users, Award, Clock, Sparkles
} from "lucide-react";
import { toast } from "sonner";
import Confetti from "react-confetti";

export default function FunnelCopyPage() {
  const router = useRouter();
  const [funnelData, setFunnelData] = useState(null);
  const [showConfetti, setShowConfetti] = useState(true);
  const [windowSize, setWindowSize] = useState({ width: 0, height: 0 });

  useEffect(() => {
    // Load funnel data from localStorage
    const storedData = localStorage.getItem('funnel_data');
    if (storedData) {
      try {
        setFunnelData(JSON.parse(storedData));
      } catch (e) {
        console.error('Failed to parse funnel data:', e);
        toast.error('Failed to load funnel data');
      }
    }

    // Set window size for confetti
    setWindowSize({
      width: window.innerWidth,
      height: window.innerHeight
    });

    const handleResize = () => {
      setWindowSize({
        width: window.innerWidth,
        height: window.innerHeight
      });
    };

    window.addEventListener('resize', handleResize);

    // Stop confetti after 5 seconds
    const timer = setTimeout(() => {
      setShowConfetti(false);
    }, 5000);

    return () => {
      window.removeEventListener('resize', handleResize);
      clearTimeout(timer);
    };
  }, []);

  const handleCopySection = (text) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard!');
  };

  const handleDownloadFunnel = () => {
    const htmlContent = generateFunnelHTML();
    const blob = new Blob([htmlContent], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'funnel-page.html';
    link.click();
    toast.success('Funnel downloaded!');
  };

  const generateFunnelHTML = () => {
    // This would generate a complete HTML page with the funnel content
    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>High-Converting Funnel</title>
  <style>
    /* Add your funnel styles here */
  </style>
</head>
<body>
  <!-- Funnel content will be generated here -->
</body>
</html>`;
  };

  if (!funnelData) {
    return (
      <div className="min-h-screen bg-[#0e0e0f] flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-400 mb-4">No funnel data found</p>
          <button
            onClick={() => router.push('/results')}
            className="px-6 py-3 bg-cyan hover:brightness-110 rounded-lg font-semibold transition-all text-black"
          >
            Go to Results
          </button>
        </div>
      </div>
    );
  }

  // Extract key information from funnel data
  const businessName = funnelData.idealClient?.businessName || "Your Business";
  const headline = funnelData.message?.headline || "Transform Your Life Today";
  const subheadline = funnelData.message?.subheadline || "Discover the proven system that will change everything";
  const cta = funnelData.message?.cta || "Get Started Now";

  return (
    <div className="min-h-screen bg-[#0e0e0f] text-white">
      {/* Confetti Effect */}
      {showConfetti && (
        <Confetti
          width={windowSize.width}
          height={windowSize.height}
          recycle={false}
          numberOfPieces={500}
          gravity={0.3}
        />
      )}

      {/* Top Navigation */}
      <div className="sticky top-0 z-50 bg-[#0e0e0f]/95 backdrop-blur-sm border-b border-[#2a2a2d]">
        <div className="max-w-7xl mx-auto px-8 py-4 flex items-center justify-between">
          <button
            onClick={() => router.push('/results')}
            className="text-gray-400 hover:text-white flex items-center gap-2 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Results
          </button>
          <div className="flex gap-3">
            <button
              onClick={handleDownloadFunnel}
              className="px-4 py-2 bg-[#1b1b1d] hover:bg-[#2a2a2d] border border-[#2a2a2d] rounded-lg font-medium flex items-center gap-2 transition-all text-sm"
            >
              <Download className="w-4 h-4" /> Download HTML
            </button>
          </div>
        </div>
      </div>

      {/* Success Banner */}
      <div className="bg-gradient-to-r from-green-600 to-emerald-600 py-4">
        <div className="max-w-7xl mx-auto px-8">
          <div className="flex items-center justify-center gap-3">
            <CheckCircle className="w-6 h-6" />
            <p className="text-xl font-bold">Your Funnel is Ready!</p>
            <Sparkles className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Funnel Preview */}
      <div className="max-w-6xl mx-auto px-8 py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8 text-center"
        >
          <h1 className="text-4xl font-bold mb-3 bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">
            Your High-Converting Funnel
          </h1>
          <p className="text-gray-400">Preview your funnel page before deployment</p>
        </motion.div>

        {/* Funnel Page Preview */}
        <div className="bg-white text-black rounded-2xl overflow-hidden shadow-2xl">
          {/* Hero Section */}
          <section className="relative bg-gradient-to-br from-blue-600 via-purple-600 to-pink-600 text-white py-20 px-8">
            <div className="absolute top-4 right-4">
              <button
                onClick={() => handleCopySection(`${headline}\n${subheadline}`)}
                className="px-3 py-2 bg-white/20 hover:bg-white/30 backdrop-blur-sm rounded-lg flex items-center gap-2 text-sm transition-all"
              >
                <Copy className="w-4 h-4" /> Copy
              </button>
            </div>
            <div className="max-w-4xl mx-auto text-center">
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                <h1 className="text-5xl md:text-6xl font-bold mb-6 leading-tight">
                  {headline}
                </h1>
                <p className="text-xl md:text-2xl mb-8 text-white/90">
                  {subheadline}
                </p>
                <button className="px-8 py-4 bg-white text-purple-600 rounded-full font-bold text-lg hover:scale-105 transition-transform shadow-2xl">
                  {cta}
                </button>
              </motion.div>
            </div>
          </section>

          {/* Video/Image Section */}
          <section className="py-16 px-8 bg-gray-50">
            <div className="max-w-4xl mx-auto">
              <div className="relative aspect-video bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl overflow-hidden shadow-xl flex items-center justify-center">
                <div className="absolute top-4 right-4 z-10">
                  <button
                    onClick={() => handleCopySection('Video Section')}
                    className="px-3 py-2 bg-white/20 hover:bg-white/30 backdrop-blur-sm rounded-lg flex items-center gap-2 text-sm transition-all text-white"
                  >
                    <Copy className="w-4 h-4" /> Copy
                  </button>
                </div>
                <PlayCircle className="w-24 h-24 text-white/80" />
                <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                  <div className="text-center">
                    <p className="text-white text-2xl font-bold mb-2">Watch Our Story</p>
                    <p className="text-white/80">Discover how we can help you succeed</p>
                  </div>
                </div>
                <img
                  src="/funnel-images/placeholder-video.jpg"
                  alt="Video Thumbnail"
                  className="absolute inset-0 w-full h-full object-cover opacity-30"
                  onError={(e) => { e.target.style.display = 'none'; }}
                />
              </div>
            </div>
          </section>

          {/* Benefits Section */}
          <section className="py-16 px-8 bg-white">
            <div className="absolute top-4 right-4">
              <button
                onClick={() => handleCopySection('Benefits section content')}
                className="px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg flex items-center gap-2 text-sm transition-all"
              >
                <Copy className="w-4 h-4" /> Copy
              </button>
            </div>
            <div className="max-w-6xl mx-auto">
              <h2 className="text-4xl font-bold text-center mb-4">Why Choose Us?</h2>
              <p className="text-xl text-gray-600 text-center mb-12">Everything you need to succeed</p>

              <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
                {[
                  { icon: <Zap className="w-8 h-8" />, title: "Fast Results", desc: "See changes in weeks, not months" },
                  { icon: <Shield className="w-8 h-8" />, title: "Proven System", desc: "Battle-tested with 1000+ clients" },
                  { icon: <Target className="w-8 h-8" />, title: "Laser-Focused", desc: "Customized to your unique goals" },
                  { icon: <Award className="w-8 h-8" />, title: "Award-Winning", desc: "Recognized industry leader" }
                ].map((benefit, idx) => (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.1 }}
                    className="text-center p-6 bg-gray-50 rounded-xl hover:shadow-lg transition-shadow"
                  >
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-purple-600 text-white rounded-full mb-4">
                      {benefit.icon}
                    </div>
                    <h3 className="text-xl font-bold mb-2">{benefit.title}</h3>
                    <p className="text-gray-600">{benefit.desc}</p>
                  </motion.div>
                ))}
              </div>
            </div>
          </section>

          {/* Social Proof Section */}
          <section className="py-16 px-8 bg-gray-50 relative">
            <div className="absolute top-4 right-4">
              <button
                onClick={() => handleCopySection('Testimonials section')}
                className="px-3 py-2 bg-white hover:bg-gray-100 rounded-lg flex items-center gap-2 text-sm transition-all"
              >
                <Copy className="w-4 h-4" /> Copy
              </button>
            </div>
            <div className="max-w-6xl mx-auto">
              <h2 className="text-4xl font-bold text-center mb-4">Success Stories</h2>
              <p className="text-xl text-gray-600 text-center mb-12">Join thousands of happy clients</p>

              <div className="grid md:grid-cols-3 gap-8">
                {[1, 2, 3].map((idx) => (
                  <div key={idx} className="bg-white p-6 rounded-xl shadow-lg">
                    <div className="flex items-center gap-1 mb-4">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                      ))}
                    </div>
                    <p className="text-gray-700 mb-4 italic">
                      "This completely transformed my business. I saw results within the first week!"
                    </p>
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-gradient-to-br from-purple-400 to-pink-400 rounded-full"></div>
                      <div>
                        <p className="font-bold">Client Name</p>
                        <p className="text-sm text-gray-600">Business Owner</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* Stats Section */}
          <section className="py-16 px-8 bg-gradient-to-br from-purple-600 to-blue-600 text-white relative">
            <div className="absolute top-4 right-4">
              <button
                onClick={() => handleCopySection('Stats section')}
                className="px-3 py-2 bg-white/20 hover:bg-white/30 backdrop-blur-sm rounded-lg flex items-center gap-2 text-sm transition-all"
              >
                <Copy className="w-4 h-4" /> Copy
              </button>
            </div>
            <div className="max-w-6xl mx-auto">
              <div className="grid md:grid-cols-4 gap-8 text-center">
                {[
                  { icon: <Users className="w-8 h-8" />, value: "10,000+", label: "Happy Clients" },
                  { icon: <TrendingUp className="w-8 h-8" />, value: "250%", label: "Average Growth" },
                  { icon: <Clock className="w-8 h-8" />, value: "24/7", label: "Support" },
                  { icon: <Award className="w-8 h-8" />, value: "15+", label: "Industry Awards" }
                ].map((stat, idx) => (
                  <div key={idx}>
                    <div className="inline-flex items-center justify-center mb-3">
                      {stat.icon}
                    </div>
                    <p className="text-4xl font-bold mb-2">{stat.value}</p>
                    <p className="text-white/80">{stat.label}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* Final CTA Section */}
          <section className="py-16 px-8 bg-white relative">
            <div className="absolute top-4 right-4">
              <button
                onClick={() => handleCopySection(`Final CTA: ${cta}`)}
                className="px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg flex items-center gap-2 text-sm transition-all"
              >
                <Copy className="w-4 h-4" /> Copy
              </button>
            </div>
            <div className="max-w-4xl mx-auto text-center">
              <h2 className="text-4xl font-bold mb-4">Ready to Get Started?</h2>
              <p className="text-xl text-gray-600 mb-8">
                Join thousands of successful clients today
              </p>
              <button className="px-8 py-4 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-full font-bold text-lg hover:scale-105 transition-transform shadow-2xl">
                {cta}
              </button>
              <p className="text-sm text-gray-500 mt-6">
                🔒 100% Secure • 30-Day Money Back Guarantee • No Credit Card Required
              </p>
            </div>
          </section>

          {/* Footer */}
          <footer className="py-8 px-8 bg-gray-900 text-gray-400 text-center">
            <p className="mb-2">&copy; 2025 {businessName}. All rights reserved.</p>
            <p className="text-sm">Privacy Policy • Terms of Service • Contact Us</p>
          </footer>
        </div>
      </div>
    </div>
  );
}
