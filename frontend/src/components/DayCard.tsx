import { motion } from "framer-motion";
import { MapPin } from "lucide-react";
import { DayPlan, Activity } from "../types";
import ActivityCard from "./ActivityCard";

interface DayCardProps {
  day: DayPlan;
  index?: number;
}

export default function DayCard({ day, index = 0 }: DayCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.1 }}
      className="bg-white rounded-2xl border border-[var(--border)] p-6 shadow-sm"
    >
      <div className="flex items-center gap-3 mb-5 pb-4 border-b border-[var(--border-light)]">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[var(--gradient-from)] to-[var(--gradient-to)] flex items-center justify-center text-white font-bold text-sm">
          {day.day}
        </div>
        <div>
          <h3 className="text-[var(--text-main)] font-bold text-base">
            Day {day.day} — {day.city}
          </h3>
          <div className="flex items-center gap-1 text-[var(--text-light)] text-xs">
            <MapPin className="w-3 h-3" />
            {day.city}
          </div>
        </div>
      </div>

      <div>
        {day.activities.map((activity: Activity, i: number) => (
          <ActivityCard key={i} activity={activity} index={i} />
        ))}
      </div>
    </motion.div>
  );
}
