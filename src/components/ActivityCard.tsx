import { motion } from "framer-motion";
import { Clock, Mountain, UtensilsCrossed, Camera, ShoppingBag, Landmark, TreePine, Sparkles } from "lucide-react";
import { Activity } from "../types";

interface ActivityCardProps {
  activity: Activity;
  index: number;
}

function getActivityIcon(notes: string) {
  const n = notes.toLowerCase();
  if (n.includes("temple") || n.includes("shrine") || n.includes("museum") || n.includes("castle")) return Landmark;
  if (n.includes("food") || n.includes("dinner") || n.includes("breakfast") || n.includes("lunch") || n.includes("restaurant") || n.includes("market")) return UtensilsCrossed;
  if (n.includes("park") || n.includes("garden") || n.includes("nature") || n.includes("hike")) return TreePine;
  if (n.includes("shop") || n.includes("market") || n.includes("mall")) return ShoppingBag;
  if (n.includes("photo") || n.includes("view") || n.includes("scenic")) return Camera;
  if (n.includes("arrive") || n.includes("travel") || n.includes("explore")) return Sparkles;
  return Mountain;
}

function getTimeColor(timeSlot: string) {
  const t = timeSlot.toLowerCase();
  if (t.includes("morning")) return "text-amber-600 bg-amber-50";
  if (t.includes("afternoon")) return "text-orange-600 bg-orange-50";
  if (t.includes("evening") || t.includes("night")) return "text-indigo-600 bg-indigo-50";
  return "text-[var(--primary)] bg-[var(--primary-soft)]";
}

export default function ActivityCard({ activity, index }: ActivityCardProps) {
  const Icon = getActivityIcon(activity.description);
  const timeStyle = getTimeColor(activity.category);

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: index * 0.06 }}
      className="relative flex gap-4 group"
    >
      {/* Timeline connector */}
      <div className="flex flex-col items-center">
        <div className="w-8 h-8 rounded-full bg-[var(--primary-soft)] flex items-center justify-center shrink-0 border border-[var(--primary)]/10">
          <Icon className="w-4 h-4 text-[var(--primary)]" />
        </div>
        {index < 2 && (
          <div className="w-px h-full bg-[var(--border)] my-1" />
        )}
      </div>

      <div className="flex-1 pb-5">
        <div className="flex items-center gap-2 mb-1">
          <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${timeStyle}`}>
            {activity.category}
          </span>
          <span className="text-[10px] text-[var(--text-muted)] flex items-center gap-1">
            <Clock className="w-3 h-3" />
            {activity.duration_hours}h
          </span>
        </div>
        <p className="text-[var(--text-main)] text-sm leading-relaxed font-medium">{activity.name}</p>
        <p className="text-[var(--text-muted)] text-xs mt-1">{activity.description}</p>
        <p className="text-[var(--text-main)] text-xs font-medium mt-2">
          ${activity.cost_usd} • {activity.location}
        </p>
      </div>
    </motion.div>
  );
}
