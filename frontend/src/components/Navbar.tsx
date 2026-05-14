import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Compass, Menu, X } from "lucide-react";
import { cn } from "../lib/utils";

interface NavbarProps {
  transparent?: boolean;
}

export default function Navbar({ transparent = false }: NavbarProps) {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const solid = scrolled || !transparent;

  return (
    <motion.header
      initial={{ y: -80 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
      className={cn(
        "fixed top-0 left-0 right-0 z-50 transition-all duration-300",
        solid
          ? "bg-white/90 backdrop-blur-md border-b border-[var(--border)] shadow-sm"
          : "bg-transparent border-transparent"
      )}
    >
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        <a href="/" className="flex items-center gap-2.5 group">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[var(--gradient-from)] to-[var(--gradient-to)] flex items-center justify-center shadow-md">
            <Compass className="w-5 h-5 text-white" />
          </div>
          <span className="font-bold text-lg tracking-tight text-[var(--text-main)]">
            Voyage<span className="text-[var(--primary)]">AI</span>
          </span>
        </a>

        <nav className="hidden md:flex items-center gap-8">
          <a href="/" className="text-sm font-medium text-[var(--text-muted)] hover:text-[var(--text-main)] transition-colors">
            Home
          </a>
          <span className="text-sm font-medium text-[var(--text-muted)] cursor-default">
            How it Works
          </span>
          <span className="text-sm font-medium text-[var(--text-muted)] cursor-default">
            Destinations
          </span>
        </nav>

        <div className="hidden md:flex items-center gap-3">
          <span className="text-xs font-semibold px-3 py-1.5 rounded-full bg-[var(--primary-soft)] text-[var(--primary)] border border-[var(--border)]">
            Beta
          </span>
        </div>

        <button
          className="md:hidden text-[var(--text-main)] p-2"
          onClick={() => setMobileOpen(!mobileOpen)}
        >
          {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {mobileOpen && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          className="md:hidden bg-white border-b border-[var(--border)] px-6 pb-4"
        >
          <a href="/" className="block py-2 text-sm text-[var(--text-muted)] hover:text-[var(--text-main)]">Home</a>
          <span className="block py-2 text-sm text-[var(--text-muted)]">How it Works</span>
          <span className="block py-2 text-sm text-[var(--text-muted)]">Destinations</span>
        </motion.div>
      )}
    </motion.header>
  );
}
