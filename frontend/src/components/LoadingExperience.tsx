import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Globe, Map, Wallet, ClipboardCheck, Plane } from "lucide-react";

const STEPS = [
  { icon: Globe, label: "Researching destinations" },
  { icon: Map, label: "Optimizing logistics" },
  { icon: Wallet, label: "Balancing budget" },
  { icon: ClipboardCheck, label: "Reviewing itinerary" },
  { icon: Plane, label: "Finalizing travel plan" },
];

export default function LoadingExperience() {
  const [activeStep, setActiveStep] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveStep((prev) => {
        if (prev >= STEPS.length - 1) return prev;
        return prev + 1;
      });
    }, 1800);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 relative overflow-hidden bg-[var(--bg-deep)]">
      {/* Background ambient */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-[400px] h-[400px] rounded-full opacity-10 blur-3xl bg-[var(--primary-soft)]" />
        <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] rounded-full opacity-10 blur-3xl bg-blue-100" />
      </div>

      <div className="relative z-10 max-w-md w-full">
        {/* Central pulsing orb */}
        <div className="flex justify-center mb-10">
          <div className="relative">
            <div className="absolute inset-0 rounded-full bg-[var(--primary)]/10 blur-xl animate-pulse scale-125" />
            <div className="relative w-14 h-14 rounded-full bg-gradient-to-br from-[var(--gradient-from)] to-[var(--gradient-to)] flex items-center justify-center shadow-md">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
              >
                <Plane className="w-6 h-6 text-white" />
              </motion.div>
            </div>
          </div>
        </div>

        <h2 className="text-center text-lg font-semibold text-[var(--text-main)] mb-8">
          Orchestrating your journey
        </h2>

        <div className="space-y-4">
          {STEPS.map((step, i) => {
            const isActive = i === activeStep;
            const isDone = i < activeStep;
            return (
              <motion.div
                key={step.label}
                initial={false}
                animate={{
                  opacity: isDone ? 0.5 : 1,
                  x: isActive ? 4 : 0,
                }}
                className="flex items-center gap-4"
              >
                <div
                  className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 border transition-all duration-500 ${
                    isActive
                      ? "bg-gradient-to-br from-[var(--gradient-from)] to-[var(--gradient-to)] border-transparent shadow-sm"
                      : isDone
                      ? "bg-[var(--primary-soft)] border-[var(--primary)]/10"
                      : "bg-white border-[var(--border)]"
                  }`}
                >
                  <step.icon
                    className={`w-4 h-4 transition-colors duration-500 ${
                      isActive || isDone ? "text-white" : "text-[var(--text-light)]"
                    }`}
                  />
                </div>
                <div className="flex-1">
                  <span
                    className={`text-sm font-medium transition-colors duration-500 ${
                      isActive ? "text-[var(--text-main)]" : "text-[var(--text-muted)]"
                    }`}
                  >
                    {step.label}
                  </span>
                  {isActive && (
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: "100%" }}
                      transition={{ duration: 1.8, ease: "easeInOut" }}
                      className="h-0.5 mt-2 rounded-full bg-gradient-to-r from-[var(--gradient-from)] to-[var(--gradient-to)]"
                    />
                  )}
                </div>
                <AnimatePresence>
                  {isDone && (
                    <motion.svg
                      initial={{ scale: 0, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      exit={{ scale: 0, opacity: 0 }}
                      className="w-5 h-5 text-[var(--success)] shrink-0"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={3}
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </motion.svg>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </div>

        <p className="text-center text-xs text-[var(--text-muted)] mt-8">
          This may take up to 30 seconds while our agents collaborate.
        </p>
      </div>
    </div>
  );
}
