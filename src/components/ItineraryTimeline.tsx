import { motion } from "framer-motion";
import { DaySkeleton } from "../types";
import DayCard from "./DayCard";

interface ItineraryTimelineProps {
  days: DaySkeleton[];
  activeDay: number;
}

export default function ItineraryTimeline({ days, activeDay }: ItineraryTimelineProps) {
  const day = days.find((d) => d.day_number === activeDay);

  if (!day) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="text-center py-16 text-[var(--text-muted)]"
      >
        No itinerary for this day.
      </motion.div>
    );
  }

  return (
    <motion.div
      key={day.day_number}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <DayCard day={day} index={0} />
    </motion.div>
  );
}
