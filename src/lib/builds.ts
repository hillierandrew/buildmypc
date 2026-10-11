import { DB, MULTI, PM, isHardware } from "./catalog";
import { issueAgainstBuild } from "./compat";
import type { CatId, HardwarePart, Line, Part } from "./types";

export const CHEAP_KEY = "c0";
export const MAX_KEY = "x0";
export const GAME_KEYS = ["fort", "cad", "3dm", "wz", "pubg", "mc", "rbx", "val", "cs2", "cp2077", "lol"] as const;

const FILL: CatId[] = ["gpu", "ssd", "cooler", "psu", "case", "sound"];

export function linesFrom(cart: Record<string, number>): Line[] {
  const lines: Line[] = [];
  for (const [id, qty] of Object.entries(cart)) {
    const part = PM[id];
    if (!part || !isHardware(part) || qty < 1) continue;
    lines.push({ part, qty });
  }
  return lines;
}

function fitting(cat: CatId, lines: Line[]) {
  return DB[cat].filter((p): p is HardwarePart => isHardware(p) && !issueAgainstBuild(p, lines));
}

export function choose(cat: CatId, lines: Line[], spend: number): HardwarePart | undefined {
  const sorted = [...fitting(cat, lines)].sort((a, b) => a.p - b.p);
  if (!sorted.length) return;
  if (cat === "case") {
    const mid = sorted.filter((p) => p.cat === "case" && p.form === "ATX");
    const pool = mid.length ? mid : sorted;
    if (spend > 1500) return pool.find((p) => p.p >= 139) ?? pool[0];
    return pool[0];
  }
  if (cat === "gpu") {
    const cpu = lines.find((l) => l.part.cat === "cpu")?.part;
    const score = cpu && cpu.cat === "cpu" ? cpu.f : 5;
    const near = sorted.filter((p) => p.cat === "gpu" && p.f >= 4 && Math.abs(p.f - score) <= 2);
    return near[0] ?? sorted.find((p) => p.cat === "gpu" && p.f >= 4) ?? sorted[0];
  }
  if (cat === "psu" && spend > 1200) return sorted.find((p) => p.cat === "psu" && p.w >= 750) ?? sorted[0];
  if (cat === "ssd") return sorted.find((p) => p.cat === "ssd" && p.gb >= 1000 && /NVMe/.test(p.t)) ?? sorted[0];
  if (cat === "sound") return sorted.find((p) => p.k === "snd-on") ?? sorted[0];
  return sorted[0];
}

function spendOf(cart: Record<string, number>) {
  return Object.entries(cart).reduce((sum, [id, qty]) => sum + (PM[id]?.p || 0) * qty, 0);
}

function has(cart: Record<string, number>, cat: CatId) {
  return Object.keys(cart).some((id) => PM[id]?.cat === cat);
}

export function materialize(parts: Part[], windows?: boolean): Record<string, number> {
  const cart: Record<string, number> = {};
  for (const part of parts) {
    if (!isHardware(part)) continue;
    cart[part.id] = (cart[part.id] || 0) + 1;
  }
  const cpu = parts.find((p) => p.cat === "cpu");
  if (!has(cart, "gpu") && cpu && cpu.cat === "cpu" && (!cpu.ig || cpu.f >= 8)) {
    const gpu = choose("gpu", linesFrom(cart), spendOf(cart));
    if (gpu) cart[gpu.id] = 1;
  }
  for (const cat of ["ssd", "cooler", "case", "psu", "sound"] as const) {
    if (has(cart, cat)) continue;
    const part = choose(cat, linesFrom(cart), spendOf(cart));
    if (part) cart[part.id] = 1;
  }
  if (windows === true && !has(cart, "os")) {
    const os = DB.os.find((p) => p.k === "w11h");
    if (os) cart[os.id] = 1;
  }
  if (windows === false) {
    for (const id of Object.keys(cart)) if (PM[id]?.cat === "os") delete cart[id];
  }
  return cart;
}

export function gapsFor(parts: Part[]): CatId[] {
  const present = new Set(parts.map((p) => p.cat));
  const gaps = FILL.filter((cat) => !present.has(cat));
  if (!gaps.includes("case")) gaps.push("case");
  if (!gaps.includes("sound")) gaps.push("sound");
  return gaps;
}

export function spread(cat: CatId, lines: Line[], currentId?: string): HardwarePart[] {
  const sorted = [...fitting(cat, lines.filter((l) => l.part.cat !== cat))].sort((a, b) => a.p - b.p);
  if (sorted.length <= 8) return sorted;
  const indexes = [0, 1, 2, Math.floor(sorted.length * 0.45), Math.floor(sorted.length * 0.7), sorted.length - 1];
  const out: HardwarePart[] = [];
  for (const index of indexes) {
    const part = sorted[index];
    if (part && !out.includes(part)) out.push(part);
  }
  if (currentId) {
    const current = sorted.find((p) => p.id === currentId);
    if (current && !out.includes(current)) out.unshift(current);
  }
  return out;
}

export function caseChoices(lines: Line[]) {
  const sorted = [...fitting("case", lines.filter((l) => l.part.cat !== "case" && l.part.cat !== "psu"))].sort((a, b) => a.p - b.p);
  return {
    mid: sorted.filter((p) => p.cat === "case" && p.form === "ATX"),
    other: sorted.filter((p) => p.cat !== "case" || p.form !== "ATX"),
  };
}

export function soundChoices(lines: Line[]) {
  return [...fitting("sound", lines.filter((l) => l.part.cat !== "sound"))].sort((a, b) => a.p - b.p);
}

function replaceCat(cart: Record<string, number>, cat: CatId, id: string) {
  for (const key of Object.keys(cart)) if (PM[key]?.cat === cat) delete cart[key];
  cart[id] = 1;
}

export function withPart(cart: Record<string, number>, id: string): Record<string, number> {
  const part = PM[id];
  if (!part || !isHardware(part)) return cart;
  const next = { ...cart };
  if (!MULTI[part.cat]) replaceCat(next, part.cat, id);
  else next[id] = (next[id] || 0) + 1;

  if (part.cat === "case" && part.psu === "SFX") {
    const psu = linesFrom(next).find((l) => l.part.cat === "psu")?.part;
    if (psu && psu.cat === "psu" && psu.form !== "SFX") {
      const repl = choose("psu", linesFrom(next).filter((l) => l.part.cat !== "psu"), 0);
      if (repl) replaceCat(next, "psu", repl.id);
    }
  }
  if (part.cat === "gpu") {
    const psu = linesFrom(next).find((l) => l.part.cat === "psu")?.part;
    if (psu && psu.cat === "psu" && psu.w < part.rec) {
      const repl = choose("psu", linesFrom(next).filter((l) => l.part.cat !== "psu"), 0);
      if (repl) replaceCat(next, "psu", repl.id);
    }
  }
  return next;
}

export function withoutCat(cart: Record<string, number>, cat: CatId) {
  const next = { ...cart };
  for (const id of Object.keys(next)) if (PM[id]?.cat === cat) delete next[id];
  return next;
}
