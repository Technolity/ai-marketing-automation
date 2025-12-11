"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft, Download, Copy, CheckCircle, Star, PlayCircle,
  Shield, Zap, Target, TrendingUp, Users, Award, Clock, Sparkles,
  Loader2, BookOpen, Rocket, ChevronRight, ChevronLeft, Layout, Smartphone, Monitor
} from "lucide-react";
import { toast } from "sonner";
import Confetti from "react-confetti";

// Building messages for progress animation
const BUILDING_MESSAGES = [
  "Analyzing your business data...",
  "Crafting your headline copy...",
  "Generating hero visuals...",
  "Building Landing Page...",
  "Creating Opt-in Form...",
  "Designing Thank You Page...",
  "Optimizing for conversions...",
  "Adding final polish...",
  "Your funnel is ready!"
];

export default function FunnelCopyPage() {
  const router = useRouter();
  const [funnelData, setFunnelData] = useState(null);
  const [generatedImages, setGeneratedImages] = useState([]);
  const [isBuilding, setIsBuilding] = useState(true);
  const [buildingMessage, setBuildingMessage] = useState(BUILDING_MESSAGES[0]);
  const [buildProgress, setBuildProgress] = useState(0);
  const [showConfetti, setShowConfetti] = useState(false);
  const [windowSize, setWindowSize] = useState({ width: 0, height: 0 });
  const [imagesLoading, setImagesLoading] = useState(false);

  // Preview State
  const [currentSlide, setCurrentSlide] = useState(0);
  const [viewMode, setViewMode] = useState('desktop'); // desktop | mobile

  // Cycling through building messages
  useEffect(() => {
    if (!isBuilding) return;

    const messageInterval = setInterval(() => {
      setBuildProgress(prev => {
        const newProgress = Math.min(prev + 12, 100);
        const messageIndex = Math.min(
          Math.floor((newProgress / 100) * BUILDING_MESSAGES.length),
          BUILDING_MESSAGES.length - 1
        );
        setBuildingMessage(BUILDING_MESSAGES[messageIndex]);
        return newProgress;
      });
    }, 400);

    return () => clearInterval(messageInterval);
  }, [isBuilding]);

  // Load funnel data and generate images
  useEffect(() => {
    const initializeFunnel = async () => {
      setWindowSize({ width: window.innerWidth, height: window.innerHeight });
      window.addEventListener('resize', () => setWindowSize({ width: window.innerWidth, height: window.innerHeight }));

      const storedData = localStorage.getItem('funnel_data');
      if (storedData) {
        try {
          const data = JSON.parse(storedData);
          setFunnelData(data);
          const cachedImages = localStorage.getItem('funnel_images');
          if (cachedImages) setGeneratedImages(JSON.parse(cachedImages));
        } catch (e) {
          console.error('Failed to parse funnel data:', e);
        }
      }

      setTimeout(() => {
        setIsBuilding(false);
        setShowConfetti(true);
        setTimeout(() => setShowConfetti(false), 5000);
      }, 3500);
    };

    initializeFunnel();
  }, []);

  const generateImages = async () => {
    if (!funnelData) return;
    setImagesLoading(true);
    try {
      const res = await fetch('/api/os/generate-images', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ businessData: funnelData })
      });
      const data = await res.json();
      if (data.images) {
        setGeneratedImages(data.images);
        localStorage.setItem('funnel_images', JSON.stringify(data.images));
        toast.success(`Generated ${data.count} AI images!`);
      }
    } catch (error) {
      console.error('Image generation error:', error);
      toast.error('Failed to generate images');
    } finally {
      setImagesLoading(false);
    }
  };

  const getImage = (id) => {
    const img = generatedImages.find(i => i.id === id);
    return img?.url || null;
  };

  const handleCopySection = (text) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard!');
  };

  // Content Extraction
  const businessName = funnelData?.idealClient?.businessName || "Your Business";
  const headline = funnelData?.message?.headline || "Transform Your Results Today";
  const subheadline = funnelData?.message?.subheadline || "Discover the proven system that will change everything";
  const cta = funnelData?.callToAction?.primary || "Get Started Now";
  const offerName = funnelData?.offerProgram?.programName || headline;
  const features = funnelData?.deliverables?.features || [];

  // --- FUNNEL PAGES (SLIDES) with ViewMode awareness ---
  const getSlides = (mode) => [
    {
      id: 'landing',
      title: 'Landing Page',
      component: (
        <div className="bg-[#050505] text-white min-h-full font-inter">
          {/* Landing Page Content - Green Theme */}
          <section className={`relative ${mode === 'mobile' ? 'py-8 px-4' : 'py-16 px-8'}`}>
            <div className={`max-w-4xl mx-auto flex ${mode === 'mobile' ? 'flex-col-reverse gap-8' : 'grid md:grid-cols-2 gap-12'} items-center`}>
              <div className="text-left w-full">
                <p className="text-green-500 text-sm font-bold uppercase tracking-widest mb-4">Free Book Offer</p>
                <h1 className={`${mode === 'mobile' ? 'text-3xl' : 'text-4xl'} font-extrabold leading-tight mb-6`}>
                  Get The <span className="text-green-500">Playbook</span> That <br />Changes Everything
                </h1>
                <p className={`text-gray-400 ${mode === 'mobile' ? 'text-base' : 'text-lg'} mb-8`}>{subheadline}</p>
                <button className="w-full md:w-auto px-8 py-4 bg-green-500 hover:bg-green-600 text-black font-bold text-lg rounded-md shadow-lg shadow-green-500/20 transition-all">
                  {cta}
                </button>
              </div>
              <div className={`relative w-full ${mode === 'mobile' ? 'mb-4' : ''}`}>
                {getImage('hero_book') ? (
                  <img src={getImage('hero_book')} alt="Book" className={`mx-auto shadow-2xl rounded-sm transform ${mode === 'mobile' ? 'w-[60%] rotate-0' : 'w-[80%] rotate-[-5deg] hover:rotate-0'} transition-all duration-500`} />
                ) : (
                  <div className={`${mode === 'mobile' ? 'w-[200px] h-[300px]' : 'w-[280px] h-[400px]'} bg-gradient-to-br from-green-900 to-black border border-green-800 mx-auto flex items-center justify-center rounded-sm shadow-2xl`}>
                    <BookOpen className="w-16 h-16 text-green-500 opacity-50" />
                  </div>
                )}
              </div>
            </div>
          </section>

          <section className="bg-[#0a0a0a] py-12 px-8">
            <div className="max-w-4xl mx-auto">
              <h3 className={`${mode === 'mobile' ? 'text-xl' : 'text-2xl'} font-bold text-center mb-10`}>What You'll Discover Inside...</h3>
              <div className={`${mode === 'mobile' ? 'flex flex-col' : 'grid md:grid-cols-2'} gap-6`}>
                {(features.length > 0 ? features.slice(0, 4) : [1, 2, 3, 4]).map((f, i) => (
                  <div key={i} className="flex gap-4 p-4 bg-[#111] rounded-lg border border-white/5">
                    <CheckCircle className="w-6 h-6 text-green-500 flex-shrink-0" />
                    <p className="text-gray-300 text-sm">{typeof f === 'string' ? f : "Unlock the secrets to massive growth and stability in your business."}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>
        </div>
      )
    },
    {
      id: 'optin',
      title: 'Opt-in Page',
      component: (
        <div className="bg-[#050505] text-white min-h-full font-inter flex flex-col justify-center">
          <div className={`max-w-5xl mx-auto w-full px-8 py-12 ${mode === 'mobile' ? 'flex flex-col gap-8' : 'grid md:grid-cols-2 gap-16'} items-center`}>
            {/* Form Section First on Mobile? No, usually Promise then Form. Original layout was: Image(2->1), Form(1->2) with grid. */}
            {/* Let's be explicit: Image then Form */}

            <div className={`w-full ${mode === 'mobile' ? 'order-1' : 'order-1'}`}>
              {/* Changed order logic for clarity: always Image first visually if strictly defined, or swap.
                  Design referenced had Image on Left (col 1), Form on Right (col 2).
                  On mobile: Image Top, Form Bottom usually.
                  Wait, code had: order-2 (Image) md:order-1. order-1 (Form) md:order-2. 
                  So on mobile: Form is Top (order-1), Image is Bottom (order-2).
                  Let's flip it for mobile to be Image Top (standard funnel).
              */}
              {getImage('hero_product') ? (
                <img src={getImage('hero_product')} alt="Bundle" className="w-full rounded-lg shadow-2xl border border-white/10" />
              ) : (
                <div className="aspect-video bg-[#111] rounded-lg border border-dashed border-green-500/30 flex items-center justify-center">
                  <p className="text-green-500">Product Bundle Image</p>
                </div>
              )}
            </div>

            <div className={`w-full bg-[#111] p-8 rounded-2xl border border-white/10 shadow-2xl ${mode === 'mobile' ? 'order-2' : 'order-2'}`}>
              <div className="w-16 h-1 bg-green-500 mb-6"></div>
              <h2 className={`${mode === 'mobile' ? 'text-2xl' : 'text-3xl'} font-bold mb-4`}>Where Should We Send Your Free Copy?</h2>
              <p className="text-gray-400 mb-8">Enter your details below to get instant access to the full system.</p>

              <div className="space-y-4">
                <input type="text" placeholder="Your Name" className="w-full bg-black/50 border border-white/10 rounded-lg px-4 py-3 focus:outline-none focus:border-green-500 transition-colors" />
                <input type="email" placeholder="Your Email Address" className="w-full bg-black/50 border border-white/10 rounded-lg px-4 py-3 focus:outline-none focus:border-green-500 transition-colors" />
                <button className="w-full bg-green-500 hover:bg-green-600 text-black font-bold py-4 rounded-lg text-lg shadow-lg shadow-green-500/20 transition-all">
                  Send Me The Book Now »
                </button>
              </div>
              <p className="text-xs text-center text-gray-500 mt-4">We respect your privacy. Unsubscribe at any time.</p>
            </div>
          </div>
        </div>
      )
    },
    {
      id: 'thankyou',
      title: 'Thank You Page',
      component: (
        <div className="bg-[#050505] text-white min-h-full font-inter pt-12">
          <div className="max-w-2xl mx-auto text-center px-8 mb-12">
            <div className="w-20 h-20 bg-green-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="w-10 h-10 text-green-500" />
            </div>
            <h1 className={`${mode === 'mobile' ? 'text-3xl' : 'text-4xl'} font-bold mb-4`}>You're All Set!</h1>
            <p className={`${mode === 'mobile' ? 'text-lg' : 'text-xl'} text-gray-400`}>Please check your email inbox for your access link. It should arrive in the next 5 minutes.</p>
          </div>

          <div className="bg-[#111] py-16 px-8 border-t border-white/5">
            <div className="max-w-4xl mx-auto">
              <h3 className="text-center text-2xl font-bold mb-12">See What Others Are Saying</h3>
              <div className={`${mode === 'mobile' ? 'flex flex-col' : 'grid md:grid-cols-2'} gap-8`}>
                {[1, 2].map((i) => (
                  <div key={i} className="bg-black/40 p-6 rounded-xl border border-white/5">
                    <div className="flex gap-1 mb-4">
                      {[1, 2, 3, 4, 5].map(s => <Star key={s} className="w-4 h-4 text-yellow-500 fill-yellow-500" />)}
                    </div>
                    <p className="text-gray-300 italic mb-6">"This system completely revolutionized how I approach my business. Highly recommended!"</p>
                    <div className="flex items-center gap-4">
                      {getImage(`testimonial_${i}`) ? (
                        <img src={getImage(`testimonial_${i}`)} alt="User" className="w-12 h-12 rounded-full object-cover border-2 border-green-500" />
                      ) : (
                        <div className="w-12 h-12 rounded-full bg-[#222] border-2 border-green-500"></div>
                      )}
                      <div>
                        <p className="font-bold">Happy Client</p>
                        <p className="text-xs text-gray-500">Business Owner</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )
    }
  ];

  const currentSlides = getSlides(viewMode);

  if (isBuilding) {
    return (
      <div className="min-h-screen bg-[#0a0a0b] flex items-center justify-center">
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="text-center max-w-md px-6">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            className="w-24 h-24 mx-auto mb-8 rounded-full bg-gradient-to-r from-cyan-500 to-blue-500 flex items-center justify-center shadow-lg shadow-cyan-500/20"
          >
            <Rocket className="w-12 h-12 text-white" />
          </motion.div>
          <div className="mb-6">
            <div className="h-2 bg-[#1a1a1a] rounded-full overflow-hidden">
              <motion.div className="h-full bg-gradient-to-r from-cyan-400 to-blue-500" initial={{ width: "0%" }} animate={{ width: `${buildProgress}%` }} />
            </div>
            <p className="text-sm text-cyan-400 mt-2 font-medium">{buildProgress}% Complete</p>
          </div>
          <p className="text-xl text-white font-medium mb-4">{buildingMessage}</p>
        </motion.div>
      </div>
    );
  }

  if (!funnelData) return null;

  return (
    <div className="min-h-screen bg-[#0e0e10] text-white flex flex-col h-screen overflow-hidden">
      {/* APP HEADER - Cyan Theme (App Context) */}
      <div className="h-16 bg-[#0a0a0b] border-b border-[#1a1a1a] flex items-center justify-between px-6 flex-shrink-0 z-50">
        <div className="flex items-center gap-4">
          <button onClick={() => router.push('/results')} className="text-gray-400 hover:text-white flex items-center gap-2 text-sm transition-colors">
            <ArrowLeft className="w-4 h-4" /> Back
          </button>
          <div className="h-6 w-px bg-[#2a2a2a]"></div>
          <h1 className="text-lg font-bold bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
            Funnel Builder
          </h1>
        </div>

        <div className="flex items-center gap-4">
          {/* View Mode Toggles */}
          <div className="hidden md:flex bg-[#1a1a1a] rounded-lg p-1 border border-[#2a2a2a]">
            <button
              onClick={() => setViewMode('desktop')}
              className={`p-2 rounded-md transition-all ${viewMode === 'desktop' ? 'bg-[#2a2a2a] text-cyan-400' : 'text-gray-500 hover:text-white'}`}
            >
              <Monitor className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('mobile')}
              className={`p-2 rounded-md transition-all ${viewMode === 'mobile' ? 'bg-[#2a2a2a] text-cyan-400' : 'text-gray-500 hover:text-white'}`}
            >
              <Smartphone className="w-4 h-4" />
            </button>
          </div>

          <button onClick={generateImages} disabled={imagesLoading} className="px-3 py-2 bg-[#1a1a1a] hover:bg-[#252525] border border-[#2a2a2a] rounded-lg font-medium flex items-center gap-2 text-sm text-cyan-400">
            {imagesLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
            <span>Generate Visuals</span>
          </button>

          <button className="px-4 py-2 bg-gradient-to-r from-cyan-500 to-blue-600 hover:brightness-110 rounded-lg font-bold text-sm text-white shadow-lg shadow-cyan-500/20">
            Publish Funnel
          </button>
        </div>
      </div>

      {/* MAIN LAYOUT: Sidebar (Slides) + Preview Area */}
      <div className="flex-1 flex overflow-hidden">

        {/* LEFT SIDEBAR - Funnel Steps Navigation */}
        <div className="w-64 bg-[#0a0a0b] border-r border-[#1a1a1a] flex flex-col">
          <div className="p-4 border-b border-[#1a1a1a]">
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Funnel Steps</p>
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-2">
            {currentSlides.map((slide, index) => (
              <button
                key={slide.id}
                onClick={() => setCurrentSlide(index)}
                className={`w-full text-left p-3 rounded-lg border transition-all flex items-center gap-3 ${currentSlide === index
                    ? 'bg-[#1a1a1a] border-cyan-500/50 text-white shadow-md'
                    : 'bg-transparent border-transparent text-gray-500 hover:bg-[#111] hover:text-gray-300'
                  }`}
              >
                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${currentSlide === index ? 'bg-cyan-500 text-black' : 'bg-[#222] text-gray-500'
                  }`}>
                  {index + 1}
                </div>
                <span className="text-sm font-medium">{slide.title}</span>
              </button>
            ))}
          </div>
        </div>

        {/* PREVIEW AREA */}
        <div className="flex-1 bg-[#151515] flex items-center justify-center p-8 relative">

          {/* Confetti */}
          {showConfetti && <Confetti width={windowSize.width} height={windowSize.height} recycle={false} numberOfPieces={500} colors={['#22d3ee', '#06b6d4', '#ffffff']} />}

          {/* Device Frame */}
          <motion.div
            initial={false}
            animate={{
              width: viewMode === 'mobile' ? '375px' : '100%',
              maxWidth: viewMode === 'desktop' ? '1200px' : '375px',
              height: viewMode === 'mobile' ? '100%' : '100%',
              borderRadius: viewMode === 'mobile' ? '32px' : '8px',
            }}
            transition={{ type: "spring", stiffness: 200, damping: 25 }}
            className={`bg-white relative shadow-2xl overflow-hidden flex flex-col ${viewMode === 'mobile' ? 'border-8 border-[#333]' : 'border border-[#333]'}`}
          >
            {/* Browser Bar (Desktop only) */}
            {viewMode === 'desktop' && (
              <div className="h-10 bg-[#222] flex items-center px-4 gap-2 border-b border-[#333] flex-shrink-0">
                <div className="flex gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-red-500/20"></div>
                  <div className="w-3 h-3 rounded-full bg-yellow-500/20"></div>
                  <div className="w-3 h-3 rounded-full bg-green-500/20"></div>
                </div>
                <div className="flex-1 flex justify-center">
                  <div className="bg-[#111] text-gray-500 text-xs px-24 py-1 rounded-md flex items-center gap-2">
                    <Shield className="w-3 h-3" />
                    secure-funnel.com/{businessName.toLowerCase().replace(/\s/g, '')}
                  </div>
                </div>
              </div>
            )}

            {/* Funnel Content Slider */}
            <div className="flex-1 relative bg-[#050505] overflow-y-auto custom-scrollbar">
              <AnimatePresence mode="wait">
                <motion.div
                  key={currentSlide}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.2 }}
                  className="min-h-full"
                >
                  <div className="relative">
                    {/* Copy Button Overlay */}
                    <div className="absolute top-4 right-4 z-50">
                      <button onClick={() => handleCopySection("Funnel Page Content")} className="bg-black/50 hover:bg-black/80 text-white px-3 py-1 rounded text-xs border border-white/10 backdrop-blur-sm transition-all flex items-center gap-2">
                        <Copy className="w-3 h-3" /> Copy
                      </button>
                    </div>
                    {currentSlides[currentSlide].component}
                  </div>
                </motion.div>
              </AnimatePresence>
            </div>

            {/* Navigation Overlay (Arrows) */}
            <div className={`absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-4 bg-black/80 backdrop-blur-md px-4 py-2 rounded-full border border-white/10 shadow-xl transition-opacity ${viewMode === 'mobile' ? 'opacity-100' : 'opacity-0 hover:opacity-100'}`}>
              <button
                onClick={() => setCurrentSlide(Math.max(0, currentSlide - 1))}
                disabled={currentSlide === 0}
                className="p-2 hover:bg-white/10 rounded-full disabled:opacity-30 text-white"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <span className="text-xs font-mono text-gray-400">{currentSlide + 1} / {currentSlides.length}</span>
              <button
                onClick={() => setCurrentSlide(Math.min(currentSlides.length - 1, currentSlide + 1))}
                disabled={currentSlide === currentSlides.length - 1}
                className="p-2 hover:bg-white/10 rounded-full disabled:opacity-30 text-white"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>

          </motion.div>
        </div>
      </div>
    </div>
  );
}
