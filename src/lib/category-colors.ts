const palette = [
  { bg: "#FEE2E2", icon: "#DC2626" },
  { bg: "#DBEAFE", icon: "#2563EB" },
  { bg: "#D1FAE5", icon: "#059669" },
  { bg: "#FEF3C7", icon: "#D97706" },
  { bg: "#E0E7FF", icon: "#4F46E5" },
  { bg: "#FCE7F3", icon: "#DB2777" },
  { bg: "#EDE9FE", icon: "#7C3AED" },
  { bg: "#FFEDD5", icon: "#EA580C" },
  { bg: "#CFFAFE", icon: "#0891B2" },
  { bg: "#F5F5F4", icon: "#78716C" },
  { bg: "#FECDD3", icon: "#BE123C" },
  { bg: "#D9F99D", icon: "#65A30D" },
];

const cache = new Map<string, { bg: string; icon: string }>();

function hash(str: string): number {
  let h = 0;
  for (let i = 0; i < str.length; i++) {
    h = (h * 31 + str.charCodeAt(i)) | 0;
  }
  return Math.abs(h);
}

export function getCategoryColor(name: string): { bg: string; icon: string } {
  const cached = cache.get(name);
  if (cached) return cached;
  const idx = hash(name) % palette.length;
  const color = palette[idx];
  cache.set(name, color);
  return color;
}
