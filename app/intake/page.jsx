// app/intake/page.jsx
"use client";
import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useRouter } from "next/navigation";
import FullscreenSlide from "@/components/FullscreenSlide";
import ProgressIndicator from "@/components/ProgressIndicator";
import { useFormStore } from "@/store/formStore";

const questions = [
  {
    key: "intro",
    type: "intro",
    title: "Let's Build Your Automated Marketing System",
    subtitle: "Answer a few questions and get your complete funnel, copy, and campaigns in minutes",
    buttonText: "Get Started"
  },
  {
    key: "name",
    title: "What's your name?",
    subtitle: "Let's personalize your experience",
    placeholder: "John Smith"
  },
  {
    key: "businessName",
    title: "What's your business name?",
    subtitle: "This will be used throughout your marketing materials",
    placeholder: "Acme Marketing Co."
  },
  {
    key: "productName",
    title: "What product or service are you selling?",
    subtitle: "Be specific about what you offer",
    placeholder: "High-ticket coaching program for real estate agents",
    multiline: true
  },
  {
    key: "idealClient",
    title: "Who is your ideal customer?",
    subtitle: "Describe their demographics, role, and situation",
    placeholder: "Real estate agents aged 30-50 struggling to generate consistent leads online",
    multiline: true
  },
  {
    key: "pains",
    title: "What are their top 3 frustrations or pain points?",
    subtitle: "What keeps them up at night?",
    placeholder: "1. Inconsistent lead flow\n2. Wasting money on ineffective ads\n3. No time to create content",
    multiline: true,
    rows: 6
  },
  {
    key: "desires",
    title: "What results do they desperately want?",
    subtitle: "What transformation are they seeking?",
    placeholder: "Consistent 20-30 qualified leads per month, predictable pipeline, systems that run without them",
    multiline: true
  },
  {
    key: "solution",
    title: "How does your offer solve their problem?",
    subtitle: "Explain your unique approach or methodology",
    placeholder: "Our 90-day system combines done-for-you ad campaigns with weekly coaching to build a predictable lead generation machine",
    multiline: true,
    rows: 6
  },
  {
    key: "offerModules",
    title: "What modules or components are included?",
    subtitle: "List the key parts of your program/product",
    placeholder: "• Done-for-you Facebook ads\n• Weekly group coaching\n• Lead magnet templates\n• CRM setup & automation\n• 24/7 Slack support",
    multiline: true,
    rows: 6
  },
  {
    key: "bonuses",
    title: "What bonuses or extras do you include?",
    subtitle: "Additional value you provide (optional)",
    placeholder: "• Free website audit ($500 value)\n• Script templates library\n• 30-min 1-on-1 kickoff call",
    multiline: true,
    optional: true
  },
  {
    key: "testimonial",
    title: "Share a powerful client testimonial or result",
    subtitle: "Real success story that proves your offer works",
    placeholder: "Sarah went from 3 leads/month to 47 leads/month in 60 days and closed $180K in new business",
    multiline: true,
    optional: true
  },
  {
    key: "pricePoint",
    title: "What's your price point?",
    subtitle: "This helps us craft appropriate messaging",
    placeholder: "$3,000 - $5,000",
    optional: true
  },
  {
    key: "ctaPreference",
    title: "What's your preferred call-to-action?",
    subtitle: "How should prospects take the next step?",
    placeholder: "Book a free strategy call / Apply now / Start your trial",
    optional: true
  }
];

export default function Intake() {
  const [step, setStep] = useState(0);
  const router = useRouter();
  const { formData, setFormData } = useFormStore();

  const currentQuestion = questions[step];
  const isIntro = currentQuestion.type === "intro";
  const isLast = step === questions.length - 1;

  const handleNext = () => {
    if (isLast) {
      router.push("/processing");
    } else {
      setStep(s => s + 1);
    }
  };

  const handleBack = () => {
    if (step > 0) setStep(s => s - 1);
  };

  return (
    <div className="min-h-screen bg-dark relative">
      {!isIntro && (
        <ProgressIndicator current={step} total={questions.length - 1} />
      )}

      <AnimatePresence mode="wait">
        <FullscreenSlide
          key={step}
          title={currentQuestion.title}
          subtitle={currentQuestion.subtitle}
        >
          {isIntro ? (
            <motion.button
              whileHover={{ scale: 1.05, boxShadow: "0 0 25px rgba(225, 29, 72, 0.6)" }}
              whileTap={{ scale: 0.98 }}
              onClick={handleNext}
              className="bg-gradient-to-r from-accentRed to-crimson text-white px-16 py-6 text-2xl font-bold rounded-full mt-12 shadow-glow transition-all duration-300 border border-white/10"
            >
              {currentQuestion.buttonText}
            </motion.button>
          ) : (
            <div className="w-full max-w-2xl mx-auto space-y-6">
              {currentQuestion.multiline ? (
                <textarea
                  className="w-full bg-grayDark/50 backdrop-blur-md border border-gray-700/50 focus:border-accentRed rounded-xl p-6 text-white text-xl focus:outline-none transition-all resize-none shadow-inner input-glow min-h-[200px]"
                  rows={currentQuestion.rows || 4}
                  value={formData[currentQuestion.key] || ""}
                  onChange={(e) => setFormData({ [currentQuestion.key]: e.target.value })}
                  placeholder={currentQuestion.placeholder}
                  autoFocus
                />
              ) : (
                <input
                  type="text"
                  className="w-full bg-grayDark/50 backdrop-blur-md border border-gray-700/50 focus:border-accentRed rounded-xl p-6 text-white text-2xl focus:outline-none transition-all shadow-inner input-glow text-center"
                  value={formData[currentQuestion.key] || ""}
                  onChange={(e) => setFormData({ [currentQuestion.key]: e.target.value })}
                  placeholder={currentQuestion.placeholder}
                  autoFocus
                />
              )}

              <div className="flex gap-4 justify-center pt-4">
                {step > 1 && (
                  <button
                    onClick={handleBack}
                    className="bg-gray-700 hover:bg-gray-600 text-white px-8 py-4 rounded-lg font-semibold transition-all"
                  >
                    ← Back
                  </button>
                )}

                <button
                  onClick={handleNext}
                  className="bg-gradient-to-r from-accentRed to-crimson hover:brightness-110 text-white px-12 py-4 rounded-xl font-bold text-lg transition-all shadow-lg hover:shadow-glow-sm"
                >
                  {isLast ? "Generate My Marketing System →" : "Continue →"}
                </button>
              </div>

              {currentQuestion.optional && (
                <p className="text-sm text-gray-500 text-center">Optional - skip if not applicable</p>
              )}
            </div>
          )}
        </FullscreenSlide>
      </AnimatePresence>
    </div>
  );
}
