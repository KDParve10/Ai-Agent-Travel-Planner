import { useState } from "react";
import { useRouter } from "next/navigation";
import Navbar from "../components/Navbar";
import HeroSection from "../components/HeroSection";
import PromptBar from "../components/PromptBar";
import AgentCards from "../components/AgentCards";
import LoadingExperience from "../components/LoadingExperience";
import { generatePlan, savePlanToStorage } from "../lib/api";

export default function LandingPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (request: string, demo: boolean) => {
    setLoading(true);
    setError(null);

    try {
      const plan = await generatePlan(request, demo);
      savePlanToStorage(plan.trace_id, plan);
      router.push(`/plan/${plan.trace_id}`);
    } catch (err: any) {
      setError(err.message || "Failed to generate plan");
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[var(--bg-deep)]">
        <Navbar transparent />
        <LoadingExperience />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--bg-deep)]">
      <Navbar transparent />

      <main>
        <HeroSection />
        <PromptBar onSubmit={handleSubmit} loading={loading} />
        {error && (
          <div className="max-w-xl mx-auto mt-6 px-6">
            <div className="rounded-xl border border-[var(--error)]/20 bg-red-50 p-4 text-sm text-[var(--error)]">
              {error}
            </div>
          </div>
        )}
        <AgentCards />

        {/* Footer */}
        <footer className="relative z-10 border-t border-[var(--border)] bg-white py-8 px-6">
          <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-3">
            <p className="text-xs text-[var(--text-muted)]">
              AI-generated intelligence for planning support. Verify local conditions and pricing before booking.
            </p>
            <span className="text-xs text-[var(--text-muted)] font-medium">
              VoyageAI — Multi-Agent Travel Intelligence
            </span>
          </div>
        </footer>
      </main>
    </div>
  );
}
