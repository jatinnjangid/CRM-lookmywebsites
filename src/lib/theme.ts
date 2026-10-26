export interface BrandAccentColor {
  hex: string;
  name: string;
}

export const BRAND_ACCENT_COLORS: readonly BrandAccentColor[] = [
  { hex: "#f43f5e", name: "Rose Crimson (Default)" },
  { hex: "#ef4444", name: "Ruby Crimson" },
  { hex: "#f97316", name: "Sunset Orange" },
  { hex: "#f59e0b", name: "Amber Gold" },
  { hex: "#eab308", name: "Solar Yellow" },
  { hex: "#84cc16", name: "Lime Energy" },
  { hex: "#10b981", name: "Emerald Growth" },
  { hex: "#14b8a6", name: "Teal Laguna" },
  { hex: "#06b6d4", name: "Cyan Spark" },
  { hex: "#0ea5e9", name: "Sky Azure" },
  { hex: "#3b82f6", name: "Royal Sapphire" },
  { hex: "#6366f1", name: "Deep Indigo" },
  { hex: "#8b5cf6", name: "Neon Violet" },
  { hex: "#a855f7", name: "Purple Orchid" },
  { hex: "#d946ef", name: "Electric Fuchsia" },
  { hex: "#ec4899", name: "Hot Pink" },
  { hex: "#64748b", name: "Slate Modern" },
] as const;

export const ACCENT_COLOR_MAP: Record<string, string> = {
  "#f43f5e": "0.6 0.2 20",
  "#ef4444": "0.62 0.22 25",
  "#f97316": "0.70 0.19 45",
  "#f59e0b": "0.7 0.2 45",
  "#eab308": "0.78 0.18 85",
  "#84cc16": "0.75 0.19 130",
  "#10b981": "0.65 0.15 150",
  "#14b8a6": "0.68 0.14 175",
  "#06b6d4": "0.7 0.12 210",
  "#0ea5e9": "0.68 0.16 235",
  "#3b82f6": "0.6 0.15 250",
  "#6366f1": "0.58 0.22 270",
  "#8b5cf6": "0.6 0.18 290",
  "#a855f7": "0.62 0.23 305",
  "#d946ef": "0.65 0.25 325",
  "#ec4899": "0.65 0.23 350",
  "#64748b": "0.55 0.04 250",
};

export function applyAppearanceToDOM(appearance?: {
  theme?: string;
  fontSize?: string;
  accentColor?: string;
}) {
  if (typeof document === "undefined") return;
  const root = document.documentElement;

  // Theme
  if (appearance?.theme) {
    root.classList.remove("dark");
    if (appearance.theme === "system") {
      const systemTheme = window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
      if (systemTheme === "dark") root.classList.add("dark");
    } else if (appearance.theme === "dark") {
      root.classList.add("dark");
    }
  }

  // Font size
  if (appearance?.fontSize === "small") root.style.fontSize = "14px";
  else if (appearance?.fontSize === "large") root.style.fontSize = "18px";
  else if (appearance?.fontSize) root.style.fontSize = "16px";

  // Accent color
  if (appearance?.accentColor && ACCENT_COLOR_MAP[appearance.accentColor]) {
    root.style.setProperty("--primary", `oklch(${ACCENT_COLOR_MAP[appearance.accentColor]})`);
  } else {
    root.style.removeProperty("--primary");
  }
}
