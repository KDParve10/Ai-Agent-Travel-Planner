import { motion } from "framer-motion";
import { Search, Route, PiggyBank, ShieldCheck } from "lucide-react";

const agents = [
  {
    icon: Search,
    title: "Destination Researcher",
    description: "Scours top attractions, hidden gems, and local events tailored to your preferences.",
    color: "from-violet-500 to-purple-500",
    bg: "bg-violet-50",
  },
  {
    icon: Route,
    title: "Logistics Optimizer",
    description: "Maps efficient routes, transport modes, and city-to-city movement strategy.",
    color: "from-blue-500 to-sky-500",
    bg: "bg-blue-50",
  },
  {
    icon: PiggyBank,
    title: "Budget Balancer",
    description: "Allocates funds across stay, transport, food, and activities without breaking the bank.",
    color: "from-emerald-500 to-teal-500",
    bg: "bg-emerald-50",
  },
  {
    icon: ShieldCheck,
    title: "Quality Reviewer",
    description: "Audits the itinerary for consistency, feasibility, and preference alignment.",
    color: "from-amber-500 to-orange-500",
    bg: "bg-amber-50",
  },
];

export default function AgentCards() {
  return (
    <section className="relative z-10 max-w-6xl mx-auto px-6 py-20 bg-white">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
        className="text-center mb-12"
      >
        <h2 className="text-2xl md:text-3xl font-bold text-[var(--text-main)] mb-2">
          Powered by <span className="text-[var(--primary)]">Specialized AI Agents</span>
        </h2>
        <p className="text-[var(--text-muted)] max-w-lg mx-auto text-sm">
          Four intelligent agents collaborate in real-time to craft, optimize, and verify your travel plan.
        </p>
      </motion.div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {agents.map((agent, i) => (
          <motion.div
            key={agent.title}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4, delay: i * 0.08 }}
            whileHover={{ y: -4, transition: { duration: 0.2 } }}
            className="group relative rounded-2xl border border-[var(--border)] bg-white p-5 hover:shadow-md hover:border-[var(--primary)]/20 transition-all"
          >
            <div className={`w-10 h-10 rounded-xl ${agent.bg} flex items-center justify-center mb-4`}>
              <agent.icon className="w-5 h-5 text-[var(--primary)]" />
            </div>
            <h3 className="text-[var(--text-main)] font-semibold text-sm mb-1">{agent.title}</h3>
            <p className="text-[var(--text-muted)] text-xs leading-relaxed">{agent.description}</p>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
