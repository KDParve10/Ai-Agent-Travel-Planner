import { motion } from "framer-motion";
import { Sparkles, ArrowDown } from "lucide-react";

export default function HeroSection() {
  return (
    <section className="relative min-h-[80vh] flex flex-col items-center justify-center px-6 pt-16 overflow-hidden bg-[var(--bg-deep)]">
      {/* Subtle decorative shapes */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-20 left-[10%] w-72 h-72 rounded-full opacity-30 blur-3xl bg-[var(--primary-soft)]" />
        <div className="absolute bottom-20 right-[10%] w-96 h-96 rounded-full opacity-20 blur-3xl bg-blue-100" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.2 }}
        className="relative z-10 text-center max-w-3xl mx-auto"
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3 }}
          className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[var(--primary-soft)] border border-[var(--border)] text-[var(--primary)] text-sm font-medium mb-6"
        >
          <Sparkles className="w-3.5 h-3.5" />
          Multi-Agent AI Travel Intelligence
        </motion.div>

        <h1 className="text-4xl md:text-6xl font-bold tracking-tight leading-[1.1] mb-5 text-[var(--text-main)]">
          Plan Your
          <br />
          <span className="bg-gradient-to-r from-[var(--gradient-from)] to-[var(--gradient-to)] bg-clip-text text-transparent">
            Perfect Journey
          </span>
        </h1>

        <p className="text-base md:text-lg text-[var(--text-muted)] max-w-xl mx-auto leading-relaxed">
          Describe your dream trip in plain English. Our AI agents research destinations,
          optimize logistics, and craft a verified itinerary in seconds.
        </p>
      </motion.div>
    </section>
  );
}
