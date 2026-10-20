/* The six-sided interest diagram. */
import { h } from "./ui.js";

export function radar(rows) {
  const cx = 150, cy = 140, R = 96;
  const point = (k, value) => {
    const angle = -Math.PI / 2 + k * Math.PI / 3;
    return [cx + R * value * Math.cos(angle), cy + R * value * Math.sin(angle)];
  };
  const polygon = (value) => rows.map((_, k) => point(k, typeof value === "function" ? value(k) : value).join(",")).join(" ");
  const grid = [0.25, 0.5, 0.75, 1].map((v) => `<polygon points="${polygon(v)}" fill="none" stroke="#dce9ff"/>`).join("");
  const axes = rows.map((_, k) => { const [x, y] = point(k, 1); return `<line x1="${cx}" y1="${cy}" x2="${x}" y2="${y}" stroke="#dce9ff"/>`; }).join("");
  const labels = rows.map((row, k) => {
    const [x, y] = point(k, 1.24);
    return `<text x="${x}" y="${y}" text-anchor="middle" dominant-baseline="middle" font-size="11" font-weight="600" fill="#5b6b8a">${h(row.short)}</text>`;
  }).join("");
  const shape = polygon((k) => Math.max(0.04, rows[k].percent / 100));
  return `<svg viewBox="0 0 300 280" class="mx-auto w-full max-w-sm" role="img" aria-label="Diagram profil minat">
    ${grid}${axes}<polygon points="${shape}" fill="rgba(47,128,255,.22)" stroke="#2f80ff" stroke-width="2.5" stroke-linejoin="round"/>${labels}</svg>`;
}
