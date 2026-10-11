import { create } from "zustand";
import { CATS, DB, MULTI, PM } from "./catalog";
import { issueAgainstBuild, summarize } from "./compat";
import { DISGUISE_KEYS } from "./disguises";
import type { BuildSummary, CatId, Part, SavedBuild } from "./types";
import { styleById, UI_STYLES } from "./ui-styles";

const SAVES_KEY = "bmpc-saves";
const CART_KEY = "bmpc-cart";
export type LayoutMode =
  | "desk"
  | "phone"
  | "phone2"
  | "phone3"
  | "android"
  | "tablet"
  | "tv"
  | "console"
  | "ds"
  | "berry"
  | "browser";
export const LAYOUT_CHOICES: { id: LayoutMode; label: string; blurb: string }[] = [
  { id: "desk", label: "Desktop", blurb: "Wide builder" },
  { id: "browser", label: "Browser", blurb: "A window with the same parts" },
  { id: "phone", label: "Phone", blurb: "One-hand builder" },
  { id: "android", label: "Android", blurb: "Plain list, one column" },
  { id: "tablet", label: "Tablet", blurb: "Large cards, two columns" },
  { id: "tv", label: "TV", blurb: "Huge type from the couch" },
  { id: "console", label: "Switch", blurb: "Big tiles" },
  { id: "ds", label: "3DS", blurb: "Two small screens" },
  { id: "phone3", label: "Kindle", blurb: "Black and white only" },
  { id: "berry", label: "Blackberry", blurb: "Keyboard list" },
  { id: "phone2", label: "Phone 2", blurb: "Big cards and a cart" },
];
const LAYOUTS: LayoutMode[] = LAYOUT_CHOICES.map((item) => item.id);
const COMPACT = new Set<LayoutMode>(["phone", "phone2", "phone3", "android", "ds", "berry"]);
const layoutPatch = (mode: LayoutMode) => ({ layoutMode: mode, layoutCompact: COMPACT.has(mode) });

function loadSaves(): SavedBuild[] {
  try {
    const raw = localStorage.getItem(SAVES_KEY);
    return raw ? (JSON.parse(raw) as SavedBuild[]) : [];
  } catch {
    return [];
  }
}

function loadSaved() {
  let cart: Record<string, number> = {};
  let saves: SavedBuild[] = [];
  if (typeof window === "undefined") return { cart, saves };
  cart = loadCart();
  saves = loadSaves();
  if (location.hash.length > 1) {
    try {
      const data = JSON.parse(atob(location.hash.slice(1))) as Record<string, number>;
      const fromHash: Record<string, number> = {};
      for (const [k, v] of Object.entries(data)) if (PM[k] && v > 0) fromHash[k] = v;
      if (Object.keys(fromHash).length) cart = fromHash;
    } catch {
      /* ignore */
    }
  }
  return { cart, saves };
}

function loadCart(): Record<string, number> {
  try {
    const raw = localStorage.getItem(CART_KEY);
    if (!raw) return {};
    const data = JSON.parse(raw) as Record<string, number>;
    const next: Record<string, number> = {};
    for (const [k, v] of Object.entries(data)) if (PM[k] && v > 0) next[k] = v;
    return next;
  } catch {
    return {};
  }
}

export interface Filters {
  use: string;
  plat: string;
  sock: string;
  ramSize: string;
  ramType: string;
  storType: string;
  pMin: string;
  pMax: string;
  compatOnly: boolean;
  sort: "price-asc" | "price-desc" | "name";
}

interface BuilderState {
  unlocked: boolean;
  pwOpen: boolean;
  pwError: string;
  currentUI: number;
  cart: Record<string, number>;
  tab: CatId;
  tag: string;
  query: string;
  budget: number;
  basicMode: boolean;
  filters: Filters;
  themeCycle: string;
  lang: string;
  layoutMode: LayoutMode;
  layoutCompact: boolean;
  surface: "build" | "hub";
  erp: boolean;
  disguise: string | null;
  tourOn: boolean;
  tourIdx: number;
  toast: string;
  modal: "components" | "bench" | "compare" | "saves" | "keys" | null;
  dgCat: CatId;
  dgPage: number;
  dgQ: string;
  saves: SavedBuild[];
  unlock: (id: number) => void;
  enter: (dest: "hub" | LayoutMode) => void;
  setSurface: (surface: "build" | "hub") => void;
  openPw: () => void;
  closePw: () => void;
  failPw: (msg: string) => void;
  setUI: (id: number) => void;
  cycleUI: () => void;
  setTab: (tab: CatId) => void;
  setTag: (tag: string) => void;
  setQuery: (q: string) => void;
  setBudget: (n: number) => void;
  setBasic: (v: boolean) => void;
  setFilter: <K extends keyof Filters>(k: K, v: Filters[K]) => void;
  cycleTheme: () => void;
  setThemeMode: (mode: "light" | "dark") => void;
  setLang: (lang: string) => void;
  cycleLayout: () => void;
  setLayout: (mode: LayoutMode) => void;
  add: (id: string) => void;
  dec: (id: string) => void;
  del: (id: string) => void;
  pick: (id: string) => void;
  loadBuild: (id: string) => void;
  loadCart: (cart: Record<string, number>) => void;
  clear: () => void;
  suggest: () => void;
  showToast: (t: string) => void;
  openModal: (m: BuilderState["modal"]) => void;
  closeModal: () => void;
  setDg: (p: Partial<Pick<BuilderState, "dgCat" | "dgPage" | "dgQ">>) => void;
  startTour: () => void;
  nextTour: () => void;
  prevTour: () => void;
  endTour: () => void;
  setDisguise: (k: string | null) => void;
  saveCurrent: (name: string) => void;
  deleteSave: (id: string) => void;
  restoreHash: () => void;
  persistCart: () => void;
}

const THEMES = ["dark", "light", "neon", "dark-erp"];

export const useBuilder = create<BuilderState>((set, get) => ({
  unlocked: false,
  pwOpen: false,
  pwError: "",
  currentUI: 1,
  cart: {},
  tab: "pb",
  tag: "",
  query: "",
  budget: 1500,
  basicMode: false,
  filters: {
    use: "",
    plat: "",
    sock: "",
    ramSize: "",
    ramType: "",
    storType: "",
    pMin: "",
    pMax: "",
    compatOnly: false,
    sort: "price-asc",
  },
  themeCycle: "light",
  lang: "en",
  layoutMode: "phone",
  layoutCompact: true,
  surface: "build",
  erp: false,
  disguise: null,
  tourOn: false,
  tourIdx: 0,
  toast: "",
  modal: null,
  dgCat: "cpu",
  dgPage: 0,
  dgQ: "",
  saves: [],
  unlock: (id) => {
    const s = styleById(id);
    const { cart, saves } = loadSaved();
    set({
      unlocked: true,
      pwOpen: false,
      pwError: "",
      currentUI: id,
      surface: "build",
      erp: Boolean(s.erp),
      themeCycle: s.theme === "light" ? "light" : "dark",
      ...layoutPatch(id <= 4 || (typeof window !== "undefined" && window.innerWidth < 900) ? "phone" : "desk"),
      cart,
      saves,
    });
  },
  enter: (dest) => {
    const { cart, saves } = loadSaved();
    set({
      unlocked: true,
      pwOpen: false,
      pwError: "",
      currentUI: get().currentUI || 1,
      surface: dest === "hub" ? "hub" : "build",
      erp: false,
      themeCycle: get().themeCycle || "light",
      ...layoutPatch(dest === "hub" ? (typeof window !== "undefined" && window.innerWidth < 900 ? "phone" : "desk") : dest),
      cart,
      saves,
    });
  },
  setSurface: (surface) => set({ surface }),
  openPw: () => set({ pwOpen: true, pwError: "" }),
  closePw: () => set({ pwOpen: false, pwError: "" }),
  failPw: (msg) => set({ pwError: msg }),
  setUI: (id) => {
    const s = styleById(id);
    set({
      currentUI: id,
      erp: Boolean(s.erp),
      themeCycle: s.theme === "light" ? "light" : "dark",
    });
  },
  cycleUI: () => {
    const ids = UI_STYLES.map((s) => s.id);
    const i = ids.indexOf(get().currentUI);
    const next = ids[(i + 1) % ids.length];
    get().setUI(next);
  },
  setTab: (tab) => set({ tab, tag: "", query: "" }),
  setTag: (tag) => set({ tag }),
  setQuery: (query) => set({ query }),
  setBudget: (budget) => set({ budget }),
  setBasic: (basicMode) => set({ basicMode }),
  setFilter: (k, v) => set({ filters: { ...get().filters, [k]: v } }),
  cycleTheme: () => {
    const cur = get().themeCycle;
    const themeCycle = THEMES[(THEMES.indexOf(cur) + 1) % THEMES.length];
    set({ themeCycle });
  },
  setThemeMode: (mode) => {
    set({ themeCycle: mode });
    try {
      localStorage.setItem("bmpc-theme", mode);
    } catch {
      /* ignore */
    }
  },
  setLang: (lang) => {
    set({ lang });
    try {
      localStorage.setItem("bmpc-lang", lang);
    } catch {
      /* ignore */
    }
  },
  cycleLayout: () => {
    const i = LAYOUTS.indexOf(get().layoutMode);
    set(layoutPatch(LAYOUTS[(i + 1) % LAYOUTS.length]));
  },
  setLayout: (mode) => set(layoutPatch(mode)),
  add: (id) => {
    const p = PM[id];
    if (!p || p.cat === "pb") return;
    const cart = { ...get().cart };
    if (!MULTI[p.cat]) {
      for (const k of Object.keys(cart)) {
        if (PM[k]?.cat === p.cat) delete cart[k];
      }
    }
    cart[id] = (cart[id] || 0) + 1;
    set({ cart });
    get().persistCart();
  },
  dec: (id) => {
    const cart = { ...get().cart };
    const n = (cart[id] || 0) - 1;
    if (n < 1) delete cart[id];
    else cart[id] = n;
    set({ cart });
    get().persistCart();
  },
  del: (id) => {
    const cart = { ...get().cart };
    delete cart[id];
    set({ cart });
    get().persistCart();
  },
  pick: (id) => {
    const p = PM[id];
    if (!p) return;
    if (!MULTI[p.cat] && get().cart[id]) get().del(id);
    else get().add(id);
  },
  loadBuild: (id) => {
    const pb = DB.pb.find((o) => o.id === id);
    if (!pb || pb.cat !== "pb") return;
    const cart: Record<string, number> = {};
    for (const p of pb.parts) cart[p.id] = (cart[p.id] || 0) + 1;
    set({ cart });
    get().persistCart();
  },
  loadCart: (cart) => {
    set({ cart: { ...cart } });
    get().persistCart();
  },
  clear: () => {
    set({ cart: {} });
    get().persistCart();
    get().showToast("Build cleared");
  },
  suggest: () => {
    const b = get().budget || 1500;
    const u = get().filters.use;
    const UCR: Record<string, RegExp> = {
      g: /Gaming/,
      s: /Streaming/,
      v: /Video|Creator/,
      c: /CAD|Workstation/,
      a: /Audio/,
      i: /AI|LLM/,
      w: /Server|NAS|VM/,
      p: /Plex|Media/,
      m: /Mining/,
      o: /Office/,
    };
    const pool = DB.pb.filter((x) => !u || UCR[u]?.test(x.n + " " + x.tags.join(" ")));
    const list = pool.length ? pool : DB.pb;
    const ok =
      list.filter((x) => x.p <= b).sort((x, y) => y.p - x.p)[0] ??
      [...list].sort((x, y) => x.p - y.p)[0];
    if (ok) {
      get().loadBuild(ok.id);
      get().showToast("Suggested: " + ok.n);
    } else get().showToast("No prebuilt fits that budget.");
  },
  showToast: (toast) => {
    set({ toast });
    window.setTimeout(() => {
      if (get().toast === toast) set({ toast: "" });
    }, 2400);
  },
  openModal: (modal) => set({ modal, dgPage: 0 }),
  closeModal: () => set({ modal: null }),
  setDg: (p) => set(p),
  startTour: () => set({ tourOn: true, tourIdx: 0 }),
  nextTour: () => set({ tourIdx: get().tourIdx + 1 }),
  prevTour: () => set({ tourIdx: Math.max(0, get().tourIdx - 1) }),
  endTour: () => set({ tourOn: false, tourIdx: 0 }),
  setDisguise: (disguise) => set({ disguise }),
  saveCurrent: (name) => {
    const saves = [
      {
        id: String(Date.now()),
        name: name || "Untitled build",
        at: Date.now(),
        cart: { ...get().cart },
        ui: get().currentUI,
      },
      ...get().saves,
    ].slice(0, 24);
    set({ saves });
    try {
      localStorage.setItem(SAVES_KEY, JSON.stringify(saves));
    } catch {
      /* ignore */
    }
    get().showToast("Build saved");
  },
  deleteSave: (id) => {
    const saves = get().saves.filter((s) => s.id !== id);
    set({ saves });
    try {
      localStorage.setItem(SAVES_KEY, JSON.stringify(saves));
    } catch {
      /* ignore */
    }
  },
  restoreHash: () => {
    if (typeof window === "undefined" || !location.hash) return;
    try {
      const data = JSON.parse(atob(location.hash.slice(1))) as Record<string, number>;
      const cart: Record<string, number> = {};
      for (const [k, v] of Object.entries(data)) if (PM[k]) cart[k] = v;
      set({ cart });
    } catch {
      /* ignore */
    }
  },
  persistCart: () => {
    try {
      localStorage.setItem(CART_KEY, JSON.stringify(get().cart));
    } catch {
      /* ignore */
    }
  },
}));

export function listParts(state: BuilderState, cat: CatId, q: string, tag: string): Part[] {
  const { filters, basicMode, cart } = state;
  const pmin = Number(filters.pMin) || 0;
  const pmax = Number(filters.pMax) || Infinity;
  const lines = Object.entries(cart)
    .map(([id, qty]) => {
      const part = PM[id];
      if (!part || part.cat === "pb") return null;
      return { part, qty };
    })
    .filter((l): l is { part: import("./types").HardwarePart; qty: number } => Boolean(l));

  let out = DB[cat].filter((p) => {
    if (q && !(p.n + " " + p.tags.join(" ")).toLowerCase().includes(q.toLowerCase())) return false;
    if (tag && !p.tags.includes(tag)) return false;
    if (basicMode && cat !== "pb") {
      if (p.p > 1500 && cat !== "gpu") return false;
      if (cat === "gpu" && p.p > 1200) return false;
      if (cat === "cpu" && "t" in p && (p.t as number) > 16) return false;
    }
    if (!basicMode) {
      if (filters.plat && "brand" in p && p.cat === "cpu" && p.brand !== filters.plat) return false;
      if (filters.sock && "sock" in p && p.sock !== filters.sock) return false;
      if (filters.ramSize && p.cat === "ram" && String(p.gb) !== filters.ramSize) return false;
      if (filters.ramType && p.cat === "ram" && String(p.d) !== filters.ramType) return false;
      if (filters.ramType && p.cat === "mb" && String(p.d) !== filters.ramType) return false;
      if (filters.storType && p.cat === "ssd" && p.t !== filters.storType) return false;
      if (p.p < pmin || p.p > pmax) return false;
    }
    if (filters.compatOnly && p.cat !== "pb" && !cart[p.id]) {
      const msg = issueAgainstBuild(p, lines);
      if (msg) return false;
    }
    return true;
  });

  if (filters.use && cat === "pb") {
    const UCR: Record<string, RegExp> = {
      g: /Gaming/,
      s: /Streaming/,
      v: /Video|Creator/,
      c: /CAD|Workstation/,
      a: /Audio/,
      i: /AI|LLM/,
      w: /Server|NAS|VM/,
      p: /Plex|Media/,
      m: /Mining/,
      o: /Office/,
    };
    const re = UCR[filters.use];
    if (re) out = out.filter((p) => re.test(p.n + " " + p.tags.join(" ")));
  }

  out = [...out];
  if (filters.sort === "price-desc") out.sort((a, b) => b.p - a.p);
  else if (filters.sort === "name") out.sort((a, b) => a.n.localeCompare(b.n));
  else out.sort((a, b) => a.p - b.p);
  return out;
}

export function currentSummary(cart: Record<string, number>): BuildSummary {
  return summarize(cart, PM);
}

export function quoteText(s: BuildSummary) {
  let t = "PC BUILD QUOTE\n\n";
  for (const cat of CATS) {
    if (cat[0] === "pb") continue;
    for (const l of s.lines.filter((x) => x.part.cat === cat[0])) {
      t += `${cat[1]}: ${l.part.n} x${l.qty} - $${(l.part.p * l.qty).toFixed(2)}\n`;
    }
  }
  t += `\nSubtotal $${s.tot.toFixed(2)}\nHST 13% $${(s.tot * 0.13).toFixed(2)}\nTOTAL $${(s.tot * 1.13).toFixed(2)}\n`;
  if (s.mb) t += `\nBoard sockets: ${s.mb.m2} M.2 / ${s.mb.sata} SATA / ${s.mb.dimm} DIMM\n`;
  t += `Estimated load: ${s.watts}W\n`;
  return t;
}

export { CATS, DISGUISE_KEYS };
