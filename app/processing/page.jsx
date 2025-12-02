// app/processing/page.jsx
"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useFormStore } from "@/store/formStore";
import Loader from "@/components/Loader";

import { generateMockResults } from "@/lib/mockData";

export default function Processing() {
  const router = useRouter();
  const { formData } = useFormStore();
  const [status, setStatus] = useState("Analyzing your business...");

  useEffect(() => {
    if (!formData.businessName) {
      router.push("/intake");
      return;
    }

    const processData = async () => {
      const messages = [
        "Analyzing your business...",
        "Identifying customer pain points...",
        "Crafting messaging framework...",
        "Generating VSL script...",
        "Writing email sequences...",
        "Creating Facebook ads...",
        "Building funnel structure...",
        "Finalizing your results..."
      ];

      let i = 0;
      const interval = setInterval(() => {
        if (i < messages.length) {
          setStatus(messages[i]);
          i++;
        }
      }, 800); // Speed up for testing

      try {
        // MOCK DATA GENERATION FOR TESTING
        const results = await generateMockResults(formData);

        clearInterval(interval);

        if (typeof window !== 'undefined') {
          sessionStorage.setItem('marketingResults', JSON.stringify(results));
        }

        router.push("/results");
      } catch (err) {
        clearInterval(interval);
        console.error(err);
        setStatus("Error occurred. Redirecting...");
        setTimeout(() => router.push("/intake"), 2000);
      }
    };

    processData();
  }, [formData, router]);

  return (
    <div className="min-h-screen flex items-center justify-center px-6">
      <Loader message={status} />
    </div>
  );
}
