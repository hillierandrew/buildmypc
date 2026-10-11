import { CATS, FORM_RANK, isNvme, isSataDrive, MULTI, REQUIRED } from "./catalog";
import type {
  BuildSummary,
  CasePart,
  CompatIssue,
  CoolerPart,
  CpuPart,
  FanPart,
  GpuPart,
  HardwarePart,
  Line,
  MbPart,
  Part,
  PsuPart,
  RamPart,
  SsdPart,
} from "./types";

function pairIssue(a: HardwarePart, b: HardwarePart): string {
  const m: Partial<Record<string, HardwarePart>> = { [a.cat]: a, [b.cat]: b };
  const cpu = m.cpu as CpuPart | undefined;
  const mb = m.mb as MbPart | undefined;
  const ram = m.ram as RamPart | undefined;
  const gpu = m.gpu as GpuPart | undefined;
  const cooler = m.cooler as CoolerPart | undefined;
  const psu = m.psu as PsuPart | undefined;
  const cs = m.case as CasePart | undefined;

  if (cpu && mb && cpu.sock !== mb.sock) return `Needs a ${cpu.sock} motherboard`;
  if (mb && ram && mb.d !== ram.d) return `Motherboard uses DDR${mb.d}`;
  if (cpu && ram && !cpu.d.includes(ram.d)) return `CPU supports DDR${[...cpu.d].join("/")}`;
  if (mb && cs && (FORM_RANK[mb.form] ?? 0) > (FORM_RANK[cs.form] ?? 0))
    return `${mb.form} board won't fit this ${cs.form} case`;
  if (cooler && cs) {
    if (cooler.t === "AIO") {
      if (cooler.size > (cs.rad || 0)) return `Case fits ${cs.rad || "no"}mm radiators`;
    } else if (cooler.size > cs.cl) {
      return `Case fits coolers up to ${cs.cl}mm`;
    }
  }
  if (gpu && cs && gpu.len > cs.gl) return `GPU is ${gpu.len}mm, case fits ${cs.gl}mm`;
  if (psu && cs && cs.psu === "SFX" && psu.form !== "SFX") return "Case needs an SFX power supply";
  if (gpu && psu && psu.w < gpu.rec) return `GPU needs a ${gpu.rec}W+ power supply`;
  if (cpu && cooler && cooler.s === "I" && cpu.brand !== "Intel") return "This cooler is Intel-only";
  if (cpu && cooler && cooler.s === "A" && cpu.brand !== "AMD") return "This cooler is AMD-only";
  if (cpu && cooler && cooler.tdp < cpu.w)
    return `Cooler is rated ${cooler.tdp}W, CPU can draw ${cpu.w}W`;
  return "";
}

export function issueAgainstBuild(candidate: HardwarePart, lines: Line[]): string {
  for (const { part } of lines) {
    if (part.cat === candidate.cat && !MULTI[candidate.cat]) continue;
    if (part.cat === candidate.cat) continue;
    const msg = pairIssue(candidate, part);
    if (msg) return msg;
  }
  const mb = lines.find((l) => l.part.cat === "mb")?.part as MbPart | undefined;
  if (mb && candidate.cat === "ssd") {
    const ssd = candidate as SsdPart;
    const nv = lines
      .filter((l) => isNvme(l.part))
      .reduce((a, l) => a + l.qty, 0);
    const sa = lines
      .filter((l) => isSataDrive(l.part))
      .reduce((a, l) => a + l.qty, 0);
    if (isNvme(ssd) && nv >= mb.m2) return `Board has ${mb.m2} M.2 slots — all filled`;
    if (isSataDrive(ssd) && sa >= mb.sata) return `Board has ${mb.sata} SATA ports — all filled`;
  }
  if (mb && candidate.cat === "ram") {
    const used = lines
      .filter((l) => l.part.cat === "ram")
      .reduce((a, l) => a + (l.part as RamPart).sticks * l.qty, 0);
    const add = (candidate as RamPart).sticks;
    if (used + add > mb.dimm) return `Board has ${mb.dimm} DIMM slots (${used} used)`;
  }
  return "";
}

export function summarize(cart: Record<string, number>, catalog: Record<string, Part>): BuildSummary {
  const lines: Line[] = Object.entries(cart)
    .map(([id, qty]) => {
      const part = catalog[id];
      if (!part || part.cat === "pb" || qty < 1) return null;
      return { part: part as HardwarePart, qty };
    })
    .filter((l): l is Line => Boolean(l));

  const by = (cat: string) => lines.filter((l) => l.part.cat === cat);
  const qtyOf = (cat: string, pred: (p: HardwarePart) => number) =>
    by(cat).reduce((a, l) => a + pred(l.part) * l.qty, 0);

  const cpu = by("cpu")[0]?.part as CpuPart | undefined;
  const mb = by("mb")[0]?.part as MbPart | undefined;
  const gpu = by("gpu")[0]?.part as GpuPart | undefined;
  const psu = by("psu")[0]?.part as PsuPart | undefined;
  const cs = by("case")[0]?.part as CasePart | undefined;

  const issues: CompatIssue[] = [];
  const seen = new Set<string>();
  const add = (level: "err" | "warn", msg: string) => {
    if (!msg || seen.has(msg)) return;
    seen.add(msg);
    issues.push({ level, msg });
  };

  for (let i = 0; i < lines.length; i++) {
    for (let j = i + 1; j < lines.length; j++) {
      if (lines[i].part.cat === lines[j].part.cat) continue;
      add("err", pairIssue(lines[i].part, lines[j].part));
    }
  }

  const required: string[] = [];
  for (const [cat, label] of REQUIRED) {
    if (!by(cat).length) required.push(`${label} is required`);
  }
  if (cpu && !cpu.ig && !gpu) add("err", `${cpu.n} has no integrated graphics — add a GPU`);

  const nvme = lines.filter((l) => isNvme(l.part)).reduce((a, l) => a + l.qty, 0);
  const sata = lines.filter((l) => isSataDrive(l.part)).reduce((a, l) => a + l.qty, 0);
  const sticks = qtyOf("ram", (p) => (p as RamPart).sticks);
  const fans = qtyOf("fan", (p) => (p as FanPart).pk);
  const ramGb = qtyOf("ram", (p) => (p as RamPart).gb);
  const storage = qtyOf("ssd", (p) => (p as SsdPart).gb);

  if (mb) {
    if (nvme > mb.m2) add("err", `Using ${nvme} NVMe drives — board has ${mb.m2} M.2 slots`);
    if (sata > mb.sata) add("err", `Using ${sata} SATA drives — board has ${mb.sata} SATA ports`);
    if (sticks > mb.dimm) add("err", `Using ${sticks} RAM sticks — board has ${mb.dimm} DIMM slots`);
  }
  if (cs && fans > cs.fx) add("warn", `Case lists ${cs.fx} fan mounts, build uses ${fans}`);

  const watts =
    (cpu ? cpu.w : 0) +
    (gpu ? gpu.tdp : 0) +
    ramGb * 0.4 +
    nvme * 6 +
    sata * 8 +
    fans * 3 +
    (by("sound").length ? 8 : 0) +
    (cpu || gpu ? 50 : 0);
  const wattsR = Math.round(watts);

  if (psu && wattsR > psu.w) add("err", `Estimated load ${wattsR}W exceeds ${psu.w}W PSU`);
  else if (psu && wattsR > psu.w * 0.85)
    add("warn", `PSU headroom is tight (${wattsR}W of ${psu.w}W)`);

  const boot = by("ssd");
  if (boot.length && boot.every((l) => (l.part as SsdPart).t === "HDD"))
    add("warn", "Booting from HDD will feel slow — add an NVMe or SATA SSD");

  if (cpu && gpu && gpu.f - cpu.f >= 4)
    add("warn", "GPU is far ahead of the CPU — possible bottleneck in CPU-bound games");
  if (cpu && gpu && cpu.f - gpu.f >= 4)
    add("warn", "CPU is far ahead of the GPU — a stronger GPU would unlock more FPS");
  if (gpu && ramGb < 16) add("warn", "16GB RAM is the practical floor for gaming");
  if (gpu && ramGb < 32 && gpu.f >= 8) add("warn", "High-end GPUs prefer 32GB RAM");
  if (!by("os").length && lines.length)
    add("warn", "No OS selected — add Windows or bring your own");
  if (cpu && !gpu && cpu.ig) add("warn", "Integrated graphics only — fine for office, media, and light work");

  const tot = lines.reduce((a, l) => a + l.part.p * l.qty, 0);
  const cf = cpu ? cpu.f : 0;
  const gf = gpu ? gpu.f : 0;

  return {
    lines,
    tot,
    c: cpu ? cpu.c : 0,
    t: cpu ? cpu.t : 0,
    v: gpu ? gpu.v : 0,
    r: ramGb,
    st: storage,
    nvme,
    sata,
    sticks,
    fans,
    watts: wattsR,
    issues,
    required,
    scores: {
      gaming: gpu ? gf * 0.7 + cf * 0.3 : cf * 0.3,
      ai: gpu ? Math.min(10, gpu.v / 3) : 0,
      creator: Math.min(5, cpu ? cpu.t / 6 : 0),
    },
    mb,
    cpu,
    gpu,
    psu,
    case: cs,
  };
}

export function catLabel(id: string) {
  return CATS.find((c) => c[0] === id)?.[1] ?? id;
}
