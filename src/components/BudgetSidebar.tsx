import { motion } from "framer-motion";
import { Wallet, Bed, Bus, UtensilsCrossed, Ticket, TrendingUp, TrendingDown } from "lucide-react";
import { BudgetBreakdown } from "../types";

interface BudgetSidebarProps {
  budget: BudgetBreakdown;
}

const CATEGORIES = [
  { key: "accommodation" as const, label: "Accommodation", icon: Bed, color: "from-violet-500 to-purple-500" },
  { key: "transport" as const, label: "Transport", icon: Bus, color: "from-blue-500 to-cyan-500" },
  { key: "meals" as const, label: "Food & Dining", icon: UtensilsCrossed, color: "from-emerald-500 to-teal-500" },
  { key: "activities" as const, label: "Activities", icon: Ticket, color: "from-amber-500 to-orange-500" },
];

export default function BudgetSidebar({ budget }: BudgetSidebarProps) {
  const maxVal = Math.max(
    budget.accommodation,
    budget.transport,
    budget.meals,
    budget.activities,
    1
  );

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.5, delay: 0.2 }}
      className="rounded-2xl border border-[var(--border)] bg-[var(--bg-card)]/80 backdrop-blur-sm overflow-hidden"
    >
      <div className="p-5 border-b border-[var(--border)]">
        <div className="flex items-center gap-2 mb-1">
          <Wallet className="w-5 h-5 text-[var(--primary)]" />
          <h3 className="font-semibold text-[var(--text-main)]">Budget Breakdown</h3>
        </div>
        <p className="text-xs text-[var(--text-muted)]">AI-optimized allocation across categories</p>
      </div>

      <div className="p-5 space-y-5">
        {CATEGORIES.map((cat, i) => {
          const value = budget[cat.key];
          const pct = Math.round((value / maxVal) * 100);
          return (
            <motion.div
              key={cat.key}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 + i * 0.08 }}
            >
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-2">
                  <cat.icon className="w-4 h-4 text-[var(--text-muted)]" />
                  <span className="text-sm text-[var(--text-muted)]">{cat.label}</span>
                </div>
                <span className="text-sm font-semibold text-[var(--text-main)]">
                  ${value.toLocaleString()}
                </span>
              </div>
              <div className="h-2 rounded-full bg-[var(--bg-deep)] overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${pct}%` }}
                  transition={{ duration: 0.8, delay: 0.4 + i * 0.1, ease: "easeOut" }}
                  className={`h-full rounded-full bg-gradient-to-r ${cat.color}`}
                />
              </div>
            </motion.div>
          );
        })}

        <div className="pt-4 border-t border-[var(--border)]">
          <div className="flex items-center justify-between mb-1">
            <span className="text-sm text-[var(--text-muted)]">Grand Total</span>
            <span className="text-lg font-bold text-[var(--text-main)]">
              {budget.currency || '$'}{budget.total.toLocaleString()}
            </span>
          </div>

          <div className="flex items-center gap-2 mt-3">
            {(budget.within_budget ?? budget.total <= (budget.budget_usd || budget.total * 1.1)) ? (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[var(--success)]/10 text-[var(--success)] text-xs font-semibold border border-[var(--success)]/20">
                <TrendingDown className="w-3.5 h-3.5" />
                Within Budget
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[var(--error)]/10 text-[var(--error)] text-xs font-semibold border border-[var(--error)]/20">
                <TrendingUp className="w-3.5 h-3.5" />
                Budget Exceeded
              </span>
            )}
          </div>

          {(budget.violations && budget.violations.length > 0) && (
            <div className="mt-3 space-y-1">
              {budget.violations.map((v, i) => (
                <p key={i} className="text-xs text-[var(--error)]">{v}</p>
              ))}
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}
