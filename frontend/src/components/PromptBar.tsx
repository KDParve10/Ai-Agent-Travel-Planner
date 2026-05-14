import { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { Sparkles, ArrowRight, MapPin, Plane, Wallet, Users } from "lucide-react";
import { cn } from "../lib/utils";

interface PromptBarProps {
  onSubmit: (request: string, demo: boolean) => void;
  loading: boolean;
}

const SUGGESTIONS = [
  { icon: MapPin, text: "5 days in Japan — Tokyo & Kyoto, $3,000 budget" },
  { icon: Plane, text: "A romantic week in Paris and Rome" },
  { icon: Wallet, text: "Budget backpacker trip across Bali for 10 days" },
  { icon: Users, text: "Family road trip across Switzerland, scenic routes" },
];

export default function PromptBar({ onSubmit, loading }: PromptBarProps) {
  const [request, setRequest] = useState("");
  const [demoMode, setDemoMode] = useState(false);
  const [focused, setFocused] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 200)}px`;
  }, [request]);

  const handleSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!request.trim() || loading) return;
    onSubmit(request.trim(), demoMode);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.7, delay: 0.5 }}
      className="relative z-10 w-full max-w-3xl mx-auto px-6"
    >
      <form onSubmit={handleSubmit} className="relative">
        <div
          className={cn(
            "relative rounded-2xl border bg-white p-1 transition-all duration-300",
            focused
              ? "border-[var(--primary)] shadow-md shadow-[var(--glow)]"
              : "border-[var(--border)] shadow-sm"
          )}
        >
          <textarea
            ref={textareaRef}
            value={request}
            onChange={(e) => setRequest(e.target.value)}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            placeholder="Where do you want to go? Try: 'Plan a 5-day trip to Japan. Tokyo + Kyoto. $3,000 budget. Love food and temples, avoid crowds.'"
            rows={1}
            className="w-full bg-transparent text-[var(--text-main)] placeholder:text-[var(--text-light)] text-base px-5 py-4 resize-none outline-none min-h-[56px] max-h-[200px]"
            disabled={loading}
          />

          <div className="flex items-center justify-between px-3 pb-2 pt-1">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setDemoMode(!demoMode)}
                className={cn(
                  "flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold transition-all border",
                  demoMode
                    ? "bg-[var(--primary-soft)] text-[var(--primary)] border-[var(--primary)]/20"
                    : "bg-transparent text-[var(--text-light)] border-[var(--border)] hover:border-[var(--text-muted)]"
                )}
              >
                <span className="relative flex h-2 w-2">
                  {demoMode && <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[var(--primary)] opacity-50" />}
                  <span className={cn("relative inline-flex rounded-full h-2 w-2", demoMode ? "bg-[var(--primary)]" : "bg-[var(--text-light)]")} />
                </span>
                Demo Mode
              </button>
            </div>

            <motion.button
              type="submit"
              disabled={!request.trim() || loading}
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              className={cn(
                "flex items-center gap-2 px-5 py-2 rounded-full font-semibold text-sm transition-all",
                request.trim() && !loading
                  ? "bg-gradient-to-r from-[var(--gradient-from)] to-[var(--gradient-to)] text-white shadow-md"
                  : "bg-[var(--border-light)] text-[var(--text-light)] cursor-not-allowed"
              )}
            >
              {loading ? (
                <>
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Planning...
                </>
              ) : (
                <>
                  Create Plan
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </motion.button>
          </div>
        </div>
      </form>

      {/* Suggestion chips */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8 }}
        className="flex flex-wrap justify-center gap-2 mt-5"
      >
        {SUGGESTIONS.map((s, i) => (
          <button
            key={i}
            onClick={() => setRequest(s.text)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[var(--chip-bg)] border border-[var(--border)] text-[var(--text-muted)] text-xs font-medium hover:text-[var(--text-main)] hover:border-[var(--primary)]/20 transition-all"
          >
            <s.icon className="w-3.5 h-3.5" />
            {s.text}
          </button>
        ))}
      </motion.div>
    </motion.div>
  );
}
