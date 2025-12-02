// app/results/page.jsx
"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import ResultsDashboard from "@/components/ResultsDashboard";

export default function Results() {
  const router = useRouter();
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const storedResults = sessionStorage.getItem('marketingResults');
      
      if (!storedResults) {
        router.push("/intake");
        return;
      }

      try {
        const parsedResults = JSON.parse(storedResults);
        setResults(parsedResults);
        setLoading(false);
      } catch (error) {
        console.error('Error parsing results:', error);
        router.push("/intake");
      }
    }
  }, [router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin w-16 h-16 border-4 border-gray-800 border-t-accentRed rounded-full"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-8 bg-dark">
      <ResultsDashboard results={results} />
    </div>
  );
}
