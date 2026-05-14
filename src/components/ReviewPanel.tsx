import { motion } from "framer-motion";
import { ShieldCheck, AlertTriangle, CheckCircle2, XCircle } from "lucide-react";
import { ReviewReport } from "../types";

interface ReviewPanelProps {
  review: ReviewReport;
}

export default function ReviewPanel({ review }: ReviewPanelProps) {
  const score = review.score || 0;
  const maxScore = review.max_score || 10;
  const percentage = Math.round((score / maxScore) * 100);
  
  const allIssues = [
    ...(review.warnings || []),
    ...(review.suggestions || []),
    ...(review.feedback || [])
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.4 }}
      className="rounded-2xl border border-[var(--border)] bg-[var(--bg-card)]/80 backdrop-blur-sm overflow-hidden"
    >
      <div className="p-5 border-b border-[var(--border)]">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-5 h-5 text-[var(--primary)]" />
          <h3 className="font-semibold text-[var(--text-main)]">Quality Review</h3>
        </div>
      </div>

      <div className="p-5 space-y-5">
        {/* Overall status */}
        <div
          className={`flex items-center gap-3 p-4 rounded-xl border ${
            review.passed
              ? "bg-[var(--success)]/5 border-[var(--success)]/20"
              : "bg-[var(--warning)]/5 border-[var(--warning)]/20"
          }`}
        >
          {review.passed ? (
            <CheckCircle2 className="w-6 h-6 text-[var(--success)] shrink-0" />
          ) : (
            <AlertTriangle className="w-6 h-6 text-[var(--warning)] shrink-0" />
          )}
          <div>
            <p className={`text-sm font-semibold ${review.passed ? "text-[var(--success)]" : "text-[var(--warning)]"}`}>
              {review.passed ? "Verified Plan" : "Draft with Warnings"}
            </p>
            <p className="text-xs text-[var(--text-muted)] mt-0.5">
              Quality Score: {score}/{maxScore} ({percentage}%)
            </p>
          </div>
        </div>

        {/* Issues */}
        {allIssues.length > 0 && (
          <div className="space-y-2">
            <span className="text-xs font-semibold text-[var(--warning)] uppercase tracking-wider">Agent Feedback</span>
            {allIssues.map((issue, i) => (
              <div
                key={i}
                className="flex items-start gap-2 text-sm text-[var(--warning)] bg-[var(--warning)]/5 p-3 rounded-xl border border-[var(--warning)]/15"
              >
                <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
                {issue}
              </div>
            ))}
          </div>
        )}

        {allIssues.length === 0 && (
          <div className="flex items-center gap-2 text-sm text-[var(--success)] bg-[var(--success)]/5 p-3 rounded-xl border border-[var(--success)]/15">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            All agents approved the plan quality.
          </div>
        )}

      </div>
    </motion.div>
  );
}
