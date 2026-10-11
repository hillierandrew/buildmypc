import { FORM_RANK, PM, isHardware, isNvme, isSataDrive } from "./catalog";
import { summarize } from "./compat";
import type { CasePart, CoolerPart, CpuPart, GpuPart, HardwarePart, Line, MbPart, PsuPart, RamPart, SsdPart } from "./types";

export type FitStatus = "compatible" | "incompatible" | "conditional" | "unknown";

export interface Verdict {
  id: string;
  status: FitStatus;
  title: string;
  why: string;
  parts: string[];
  fix: string;
  missing: string;
}

const RANK: Record<FitStatus, number> = {
  incompatible: 3,
  unknown: 2,
  conditional: 1,
  compatible: 0,
};

export function worst(list: Verdict[]): FitStatus | "empty" {
  if (!list.length) return "empty";
  return list.reduce((top, item) => (RANK[item.status] > RANK[top] ? item.status : top), "compatible" as FitStatus);
}

function linesOf(cart: Record<string, number>): Line[] {
  const lines: Line[] = [];
  for (const [id, qty] of Object.entries(cart)) {
    const part = PM[id];
    if (!part || !isHardware(part) || qty < 1) continue;
    lines.push({ part, qty });
  }
  return lines;
}

function one(lines: Line[], cat: HardwarePart["cat"]) {
  return lines.find((line) => line.part.cat === cat)?.part;
}

function add(out: Verdict[], row: Verdict) {
  if (!out.some((item) => item.id === row.id)) out.push(row);
}

export function verdicts(cart: Record<string, number>): Verdict[] {
  const lines = linesOf(cart);
  const out: Verdict[] = [];
  const cpu = one(lines, "cpu") as CpuPart | undefined;
  const mb = one(lines, "mb") as MbPart | undefined;
  const gpu = one(lines, "gpu") as GpuPart | undefined;
  const cooler = one(lines, "cooler") as CoolerPart | undefined;
  const psu = one(lines, "psu") as PsuPart | undefined;
  const cs = one(lines, "case") as CasePart | undefined;
  const rams = lines.filter((line) => line.part.cat === "ram").map((line) => line.part as RamPart);
  const drives = lines.filter((line) => line.part.cat === "ssd").map((line) => line.part as SsdPart);

  if (cpu && mb) {
    const names = [cpu.n, mb.n];
    if (cpu.sock === mb.sock) {
      add(out, {
        id: "socket",
        status: "compatible",
        title: "Processor socket",
        why: `Both use ${cpu.sock}.`,
        parts: names,
        fix: "",
        missing: "",
      });
      add(out, {
        id: "bios",
        status: "conditional",
        title: "BIOS support",
        why: "A matching socket is not a BIOS guarantee. This catalog has no BIOS version for the board.",
        parts: names,
        fix: "Check the motherboard CPU support list before you buy. A newer chip sometimes needs a BIOS update.",
        missing: "BIOS version and CPU support list",
      });
    } else {
      add(out, {
        id: "socket",
        status: "incompatible",
        title: "Processor socket",
        why: `${cpu.n} needs ${cpu.sock}. This board is ${mb.sock}.`,
        parts: names,
        fix: `Pick a ${cpu.sock} motherboard, or a ${mb.sock} processor.`,
        missing: "",
      });
    }
  }

  for (const ram of rams) {
    if (mb && mb.d !== ram.d) {
      add(out, {
        id: `ram-mb-${ram.id}`,
        status: "incompatible",
        title: "Memory generation",
        why: `${mb.n} takes DDR${mb.d}. ${ram.n} is DDR${ram.d}. The kit will not fit those slots.`,
        parts: [mb.n, ram.n],
        fix: `Use a DDR${mb.d} kit.`,
        missing: "",
      });
    } else if (mb) {
      add(out, {
        id: `ram-mb-${ram.id}`,
        status: "compatible",
        title: "Memory generation",
        why: `${ram.n} is DDR${ram.d}, and the board takes DDR${mb.d}.`,
        parts: [mb.n, ram.n],
        fix: "",
        missing: "",
      });
    }
    if (cpu && !cpu.d.includes(ram.d)) {
      add(out, {
        id: `ram-cpu-${ram.id}`,
        status: "incompatible",
        title: "Memory and processor",
        why: `${cpu.n} supports DDR${[...cpu.d].join(" and DDR")}. This kit is DDR${ram.d}.`,
        parts: [cpu.n, ram.n],
        fix: "Change the memory kit to a generation the processor supports.",
        missing: "",
      });
    }
  }

  if (mb && rams.length) {
    const sticks = lines
      .filter((line) => line.part.cat === "ram")
      .reduce((sum, line) => sum + (line.part as RamPart).sticks * line.qty, 0);
    if (sticks > mb.dimm) {
      add(out, {
        id: "dimm",
        status: "incompatible",
        title: "Memory slots",
        why: `The kits use ${sticks} sticks. The board has ${mb.dimm} slots.`,
        parts: [mb.n, ...rams.map((ram) => ram.n)],
        fix: "Use fewer sticks, or a board with more slots.",
        missing: "",
      });
    } else {
      add(out, {
        id: "dimm",
        status: "compatible",
        title: "Memory slots",
        why: `${sticks} stick${sticks === 1 ? "" : "s"} on a board with ${mb.dimm} slots.`,
        parts: [mb.n],
        fix: "",
        missing: "",
      });
    }
  }

  if (mb && cs) {
    const boardRank = FORM_RANK[mb.form] ?? 0;
    const caseRank = FORM_RANK[cs.form] ?? 0;
    if (!boardRank || !caseRank) {
      add(out, {
        id: "form",
        status: "unknown",
        title: "Board size",
        why: "One of the form factors is not a known size in this catalog.",
        parts: [mb.n, cs.n],
        fix: "Compare the board size to the case spec sheet.",
        missing: "Form factor",
      });
    } else if (boardRank > caseRank) {
      add(out, {
        id: "form",
        status: "incompatible",
        title: "Board size",
        why: `A ${mb.form} board does not fit a ${cs.form} case. Smaller boards fit larger cases. The other way does not.`,
        parts: [mb.n, cs.n],
        fix: "Pick a larger case, or a smaller board.",
        missing: "",
      });
    } else {
      add(out, {
        id: "form",
        status: "compatible",
        title: "Board size",
        why: `${mb.form} fits in a ${cs.form} case.`,
        parts: [mb.n, cs.n],
        fix: "",
        missing: "",
      });
    }
  }

  if (gpu && cs) {
    if (gpu.len > cs.gl) {
      add(out, {
        id: "gpu-len",
        status: "incompatible",
        title: "Graphics card length",
        why: `The card is ${gpu.len}mm long. The case lists ${cs.gl}mm.`,
        parts: [gpu.n, cs.n],
        fix: "Pick a shorter card, or a case with more room.",
        missing: "",
      });
    } else {
      add(out, {
        id: "gpu-len",
        status: "compatible",
        title: "Graphics card length",
        why: `${gpu.len}mm card in a case that lists ${cs.gl}mm.`,
        parts: [gpu.n, cs.n],
        fix: "",
        missing: "",
      });
    }
    add(out, {
      id: "gpu-thick",
      status: "unknown",
      title: "Graphics card thickness",
      why: "Slot width and card thickness are not in this catalog. Length can fit while the card still hits a drive cage or the side panel.",
      parts: [gpu.n, cs.n],
      fix: "Check the card's slot width against the case.",
      missing: "GPU thickness and case slot room",
    });
  }

  if (cooler && cs) {
    if (cooler.t === "AIO") {
      if (!cs.rad) {
        add(out, {
          id: "cooler-fit",
          status: "unknown",
          title: "Radiator fit",
          why: "This case has no radiator size in the catalog.",
          parts: [cooler.n, cs.n],
          fix: "Check the case radiator support.",
          missing: "Radiator support",
        });
      } else if (cooler.size > cs.rad) {
        add(out, {
          id: "cooler-fit",
          status: "incompatible",
          title: "Radiator fit",
          why: `This cooler needs a ${cooler.size}mm radiator mount. The case lists ${cs.rad}mm.`,
          parts: [cooler.n, cs.n],
          fix: "Use a smaller radiator, or a case that mounts this size.",
          missing: "",
        });
      } else {
        add(out, {
          id: "cooler-fit",
          status: "conditional",
          title: "Radiator fit",
          why: `The case lists up to ${cs.rad}mm, and this radiator is ${cooler.size}mm. Which mount (top, front, side) is not in the catalog.`,
          parts: [cooler.n, cs.n],
          fix: "Confirm the mount position on the case page. A front radiator can also steal graphics-card length.",
          missing: "Mount position",
        });
      }
    } else if (cooler.size > cs.cl) {
      add(out, {
        id: "cooler-fit",
        status: "incompatible",
        title: "Cooler height",
        why: `The cooler is ${cooler.size}mm tall. The case lists ${cs.cl}mm.`,
        parts: [cooler.n, cs.n],
        fix: "Use a shorter cooler, or a wider case.",
        missing: "",
      });
    } else {
      add(out, {
        id: "cooler-fit",
        status: "compatible",
        title: "Cooler height",
        why: `${cooler.size}mm cooler in a case that lists ${cs.cl}mm.`,
        parts: [cooler.n, cs.n],
        fix: "",
        missing: "",
      });
    }
  }

  if (cooler && rams.length && cooler.t !== "AIO") {
    add(out, {
      id: "ram-height",
      status: "unknown",
      title: "Cooler over the memory",
      why: "Memory height is not in this catalog. A tall air cooler can hit a tall heatsink even when the case itself is tall enough.",
      parts: [cooler.n, ...rams.map((ram) => ram.n)],
      fix: "Compare RAM height to the cooler's memory clearance.",
      missing: "RAM height and cooler memory clearance",
    });
  }

  if (cpu && cooler) {
    const intelOnly = cooler.s === "I" && cpu.brand !== "Intel";
    const amdOnly = cooler.s === "A" && cpu.brand !== "AMD";
    if (intelOnly || amdOnly) {
      add(out, {
        id: "cooler-sock",
        status: "incompatible",
        title: "Cooler mount",
        why: intelOnly ? "This cooler is Intel-only." : "This cooler is AMD-only.",
        parts: [cpu.n, cooler.n],
        fix: "Pick a cooler that includes the bracket for this processor.",
        missing: "",
      });
    } else if (cooler.tdp < cpu.w) {
      add(out, {
        id: "cooler-tdp",
        status: "incompatible",
        title: "Cooler capacity",
        why: `The cooler is rated ${cooler.tdp}W. The processor can draw ${cpu.w}W.`,
        parts: [cpu.n, cooler.n],
        fix: "Use a cooler rated at least as high as the processor.",
        missing: "",
      });
    } else {
      add(out, {
        id: "cooler-tdp",
        status: "compatible",
        title: "Cooler capacity",
        why: `Cooler rated ${cooler.tdp}W, processor up to ${cpu.w}W.`,
        parts: [cpu.n, cooler.n],
        fix: "",
        missing: "",
      });
    }
  }

  if (psu && cs && cs.psu === "SFX" && psu.form !== "SFX") {
    add(out, {
      id: "psu-form",
      status: "incompatible",
      title: "Power supply size",
      why: "This case needs an SFX power supply. The one selected is not SFX.",
      parts: [psu.n, cs.n],
      fix: "Pick an SFX supply.",
      missing: "",
    });
  } else if (psu && cs && cs.psu) {
    add(out, {
      id: "psu-form",
      status: "compatible",
      title: "Power supply size",
      why: `${psu.form} supply in a case that takes ${cs.psu}.`,
      parts: [psu.n, cs.n],
      fix: "",
      missing: "",
    });
  }

  if (gpu && psu) {
    if (psu.w < gpu.rec) {
      add(out, {
        id: "gpu-psu",
        status: "incompatible",
        title: "Graphics card power",
        why: `${gpu.n} asks for a ${gpu.rec}W or larger supply. This one is ${psu.w}W.`,
        parts: [gpu.n, psu.n],
        fix: `Use a ${gpu.rec}W or larger supply.`,
        missing: "",
      });
    }
    add(out, {
      id: "psu-cables",
      status: "unknown",
      title: "Power cables",
      why: "PCIe cable counts are not in this catalog. Wattage can be enough while the card still wants a plug the supply does not include.",
      parts: [gpu.n, psu.n],
      fix: "Check the card's power plugs against the supply's cable list.",
      missing: "PCIe connector counts",
    });
  }

  const summary = summarize(cart, PM);
  if (psu && summary.watts) {
    if (summary.watts > psu.w) {
      add(out, {
        id: "watts",
        status: "incompatible",
        title: "Estimated load",
        why: `A simple formula (processor + graphics card + extras) estimates ${summary.watts}W. The supply is ${psu.w}W. This is not a lab measurement.`,
        parts: [psu.n],
        fix: "Use a larger supply.",
        missing: "",
      });
    } else if (summary.watts > psu.w * 0.85) {
      add(out, {
        id: "watts",
        status: "conditional",
        title: "Estimated load",
        why: `Estimated load is ${summary.watts}W of ${psu.w}W. That is tight. The number is a formula, not a measured wall draw.`,
        parts: [psu.n],
        fix: "Leave more headroom if you can.",
        missing: "",
      });
    } else {
      add(out, {
        id: "watts",
        status: "conditional",
        title: "Estimated load",
        why: `Estimated load is ${summary.watts}W on a ${psu.w}W supply. Headroom looks fine, but the number is a formula, not a lab test, so it is not marked verified.`,
        parts: [psu.n],
        fix: "",
        missing: "Measured system power",
      });
    }
  }

  if (mb && drives.length) {
    const nvme = lines.filter((line) => isNvme(line.part)).reduce((sum, line) => sum + line.qty, 0);
    const sata = lines.filter((line) => isSataDrive(line.part)).reduce((sum, line) => sum + line.qty, 0);
    if (nvme > mb.m2) {
      add(out, {
        id: "m2",
        status: "incompatible",
        title: "M.2 slots",
        why: `${nvme} NVMe drive${nvme === 1 ? "" : "s"} and the board has ${mb.m2} M.2 slot${mb.m2 === 1 ? "" : "s"}.`,
        parts: [mb.n],
        fix: "Remove an NVMe drive, or use a board with more M.2 slots.",
        missing: "",
      });
    } else if (nvme) {
      add(out, {
        id: "m2",
        status: "compatible",
        title: "M.2 slots",
        why: `${nvme} NVMe drive${nvme === 1 ? "" : "s"} and the board has ${mb.m2} M.2 slot${mb.m2 === 1 ? "" : "s"}.`,
        parts: [mb.n],
        fix: "",
        missing: "",
      });
    }
    if (sata > mb.sata) {
      add(out, {
        id: "sata",
        status: "incompatible",
        title: "SATA ports",
        why: `${sata} SATA drive${sata === 1 ? "" : "s"} and the board has ${mb.sata} SATA ports.`,
        parts: [mb.n],
        fix: "Remove a SATA drive, or pick a board with more ports.",
        missing: "",
      });
    } else if (sata) {
      add(out, {
        id: "sata",
        status: "compatible",
        title: "SATA ports",
        why: `${sata} SATA drive${sata === 1 ? "" : "s"} and the board has ${mb.sata} SATA ports.`,
        parts: [mb.n],
        fix: "",
        missing: "",
      });
    }
  }

  if (cpu && !cpu.ig && !gpu) {
    add(out, {
      id: "igpu",
      status: "incompatible",
      title: "Display output",
      why: `${cpu.n} has no integrated graphics. Nothing will drive a monitor until you add a graphics card.`,
      parts: [cpu.n],
      fix: "Add a graphics card, or pick a processor with graphics.",
      missing: "",
    });
  }

  if (lines.some((line) => line.part.cat === "fan")) {
    add(out, {
      id: "headers",
      status: "unknown",
      title: "Fan headers",
      why: "Motherboard fan-header counts are not in this catalog. Extra fans may need a splitter or a hub.",
      parts: [mb?.n ?? "Motherboard not selected yet"],
      fix: "Count the fan plugs against the board's headers.",
      missing: "Fan header count",
    });
  }

  if (cpu && gpu && gpu.f - cpu.f >= 4) {
    add(out, {
      id: "balance",
      status: "conditional",
      title: "Rough balance",
      why: "On this catalog's class score, the graphics card sits well ahead of the processor. That is not a measured frame rate or a proven bottleneck.",
      parts: [cpu.n, gpu.n],
      fix: "If you play CPU-heavy games, a stronger processor may matter more than a faster card.",
      missing: "Measured FPS",
    });
  }

  return out;
}
