import { motion } from "framer-motion";
import { Plane, Bus, FileText, Shield, RefreshCcw } from "lucide-react";
import { Logistics } from "../types";

interface LogisticsCardProps {
  logistics: Logistics;
}

export default function LogisticsCard({ logistics }: LogisticsCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.3 }}
      className="rounded-2xl border border-[var(--border)] bg-[var(--bg-card)]/80 backdrop-blur-sm overflow-hidden"
    >
      <div className="p-5 border-b border-[var(--border)]">
        <div className="flex items-center gap-2">
          <Plane className="w-5 h-5 text-[var(--primary)]" />
          <h3 className="font-semibold text-[var(--text-main)]">Logistics & Transport</h3>
        </div>
      </div>

      <div className="p-5 space-y-5">
        {/* Flights */}
        {logistics.flights.length > 0 && (
          <div>
            <span className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider flex items-center gap-1.5">
              <Plane className="w-3.5 h-3.5" />
              Flights
            </span>
            <ul className="mt-2 space-y-2">
              {logistics.flights.map((flight, i) => (
                <li
                  key={i}
                  className="text-sm text-[var(--text-main)] bg-[var(--bg-deep)]/50 p-3 rounded-xl border border-[var(--border)]"
                >
                  <p className="font-medium">{flight.airline} {flight.flight_number}</p>
                  <p className="text-xs text-[var(--text-muted)]">
                    {flight.departure} → {flight.arrival}
                  </p>
                  <p className="text-xs font-medium mt-1">${flight.cost_usd}</p>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Ground Transport */}
        {logistics.ground_transport.length > 0 && (
          <div>
            <span className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider flex items-center gap-1.5">
              <Bus className="w-3.5 h-3.5" />
              Ground Transport
            </span>
            <ul className="mt-2 space-y-2">
              {logistics.ground_transport.map((transport, i) => (
                <li
                  key={i}
                  className="text-sm text-[var(--text-main)] bg-[var(--bg-deep)]/50 p-3 rounded-xl border border-[var(--border)]"
                >
                  <p className="font-medium">{transport.type}</p>
                  <p className="text-xs text-[var(--text-muted)]">{transport.route}</p>
                  <p className="text-xs font-medium mt-1">${transport.cost_usd}</p>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Visas */}
        {logistics.visas.length > 0 && (
          <div>
            <span className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5" />
              Visa Requirements
            </span>
            <ul className="mt-2 space-y-1">
              {logistics.visas.map((visa, i) => (
                <li key={i} className="text-sm text-[var(--text-muted)] flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-[var(--primary)]" />
                  {visa}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Travel Insurance */}
        {logistics.travel_insurance && (
          <div className="flex items-center gap-2 text-sm text-[var(--success)] bg-[var(--success)]/5 p-3 rounded-xl border border-[var(--success)]/15">
            <Shield className="w-4 h-4 shrink-0" />
            {logistics.travel_insurance}
          </div>
        )}
      </div>
    </motion.div>
  );
}
