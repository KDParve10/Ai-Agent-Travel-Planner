export interface DestinationTheme {
  name: string;
  primary: string;
  primaryLight: string;
  primarySoft: string;
  accent: string;
  bgDeep: string;
  bgCard: string;
  bgCardHover: string;
  border: string;
  borderLight: string;
  textMain: string;
  textMuted: string;
  textLight: string;
  success: string;
  warning: string;
  error: string;
  gradientFrom: string;
  gradientTo: string;
  badgeBg: string;
  glow: string;
  heroOverlay: string;
  timelineLine: string;
  chipBg: string;
}

const defaultTheme: DestinationTheme = {
  name: "default",
  primary: "#7C3AED",
  primaryLight: "#8B5CF6",
  primarySoft: "#EDE9FE",
  accent: "#06B6D4",
  bgDeep: "#F8F9FC",
  bgCard: "#FFFFFF",
  bgCardHover: "#FAFAFA",
  border: "#E5E7EB",
  borderLight: "#F3F4F6",
  textMain: "#1F2937",
  textMuted: "#6B7280",
  textLight: "#9CA3AF",
  success: "#10B981",
  warning: "#F59E0B",
  error: "#EF4444",
  gradientFrom: "#7C3AED",
  gradientTo: "#3B82F6",
  badgeBg: "rgba(124, 58, 237, 0.08)",
  glow: "rgba(124, 58, 237, 0.15)",
  heroOverlay: "rgba(255, 255, 255, 0.85)",
  timelineLine: "#7C3AED",
  chipBg: "rgba(124, 58, 237, 0.08)",
};

const themes: Record<string, DestinationTheme> = {
  japan: {
    ...defaultTheme,
    name: "japan",
    primary: "#DB2777",
    primaryLight: "#EC4899",
    primarySoft: "#FCE7F3",
    gradientFrom: "#DB2777",
    gradientTo: "#8B5CF6",
    badgeBg: "rgba(219, 39, 119, 0.08)",
    glow: "rgba(219, 39, 119, 0.15)",
    timelineLine: "#DB2777",
    chipBg: "rgba(219, 39, 119, 0.08)",
  },
  europe: {
    ...defaultTheme,
    name: "europe",
    primary: "#D97706",
    primaryLight: "#F59E0B",
    primarySoft: "#FEF3C7",
    gradientFrom: "#D97706",
    gradientTo: "#3B82F6",
    badgeBg: "rgba(217, 119, 6, 0.08)",
    glow: "rgba(217, 119, 6, 0.15)",
    timelineLine: "#D97706",
    chipBg: "rgba(217, 119, 6, 0.08)",
  },
  india: {
    ...defaultTheme,
    name: "india",
    primary: "#EA580C",
    primaryLight: "#F97316",
    primarySoft: "#FFEDD5",
    gradientFrom: "#EA580C",
    gradientTo: "#14B8A6",
    badgeBg: "rgba(234, 88, 12, 0.08)",
    glow: "rgba(234, 88, 12, 0.15)",
    timelineLine: "#EA580C",
    chipBg: "rgba(234, 88, 12, 0.08)",
  },
  bali: {
    ...defaultTheme,
    name: "bali",
    primary: "#059669",
    primaryLight: "#10B981",
    primarySoft: "#D1FAE5",
    gradientFrom: "#059669",
    gradientTo: "#F97316",
    badgeBg: "rgba(5, 150, 105, 0.08)",
    glow: "rgba(5, 150, 105, 0.15)",
    timelineLine: "#059669",
    chipBg: "rgba(5, 150, 105, 0.08)",
  },
  switzerland: {
    ...defaultTheme,
    name: "switzerland",
    primary: "#0EA5E9",
    primaryLight: "#38BDF8",
    primarySoft: "#E0F2FE",
    gradientFrom: "#0EA5E9",
    gradientTo: "#6366F1",
    badgeBg: "rgba(14, 165, 233, 0.08)",
    glow: "rgba(14, 165, 233, 0.15)",
    timelineLine: "#0EA5E9",
    chipBg: "rgba(14, 165, 233, 0.08)",
  },
  usa: {
    ...defaultTheme,
    name: "usa",
    primary: "#2563EB",
    primaryLight: "#3B82F6",
    primarySoft: "#DBEAFE",
    gradientFrom: "#2563EB",
    gradientTo: "#EF4444",
    badgeBg: "rgba(37, 99, 235, 0.08)",
    glow: "rgba(37, 99, 235, 0.15)",
    timelineLine: "#2563EB",
    chipBg: "rgba(37, 99, 235, 0.08)",
  },
};

export function getTheme(destination: string): DestinationTheme {
  const key = destination.toLowerCase().trim();
  for (const [themeKey, theme] of Object.entries(themes)) {
    if (key.includes(themeKey)) return theme;
  }
  return defaultTheme;
}

export function applyTheme(theme: DestinationTheme) {
  const root = document.documentElement;
  root.style.setProperty("--primary", theme.primary);
  root.style.setProperty("--primary-light", theme.primaryLight);
  root.style.setProperty("--primary-soft", theme.primarySoft);
  root.style.setProperty("--accent", theme.accent);
  root.style.setProperty("--bg-deep", theme.bgDeep);
  root.style.setProperty("--bg-card", theme.bgCard);
  root.style.setProperty("--bg-card-hover", theme.bgCardHover);
  root.style.setProperty("--border", theme.border);
  root.style.setProperty("--border-light", theme.borderLight);
  root.style.setProperty("--text-main", theme.textMain);
  root.style.setProperty("--text-muted", theme.textMuted);
  root.style.setProperty("--text-light", theme.textLight);
  root.style.setProperty("--success", theme.success);
  root.style.setProperty("--warning", theme.warning);
  root.style.setProperty("--error", theme.error);
  root.style.setProperty("--gradient-from", theme.gradientFrom);
  root.style.setProperty("--gradient-to", theme.gradientTo);
  root.style.setProperty("--badge-bg", theme.badgeBg);
  root.style.setProperty("--glow", theme.glow);
  root.style.setProperty("--hero-overlay", theme.heroOverlay);
  root.style.setProperty("--timeline-line", theme.timelineLine);
  root.style.setProperty("--chip-bg", theme.chipBg);
}
