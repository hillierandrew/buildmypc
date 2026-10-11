import type { CatId, Part } from "@/lib/types";

const stroke = { fill: "none", stroke: "currentColor", strokeWidth: 2, strokeLinejoin: "round" as const };

export function PartSilhouette({ part }: { part: Part }) {
  return (
    <div className="sil" aria-hidden>
      {part.cat === "gpu" ? <Gpu len={"len" in part ? part.len : 240} /> : null}
      {part.cat === "mb" ? <Board form={"form" in part ? String(part.form) : "ATX"} /> : null}
      {part.cat === "case" || part.cat === "pb" ? <Tower /> : null}
      {part.cat === "cpu" ? <Chip /> : null}
      {part.cat === "ram" ? <Stick /> : null}
      {part.cat === "ssd" ? <Drive nvme={"t" in part && /NVMe/i.test(part.t)} /> : null}
      {part.cat === "cooler" ? <Cooler aio={"t" in part && part.t === "AIO"} /> : null}
      {part.cat === "psu" ? <Psu /> : null}
      {part.cat === "fan" ? <Fan /> : null}
      {part.cat === "sound" || part.cat === "nic" ? <ShortCard /> : null}
      {part.cat === "os" ? <Disc /> : null}
    </div>
  );
}

export function DeviceSilhouette({ filled }: { filled: Partial<Record<CatId, boolean>> }) {
  const c = (id: CatId) => (filled[id] ? "on" : "off");
  return (
    <div className="sil device" aria-hidden>
      <svg viewBox="0 0 120 168">
        <path className={c("case")} d="M28 8h64a6 6 0 0 1 6 6v132a6 6 0 0 1-6 6H28a6 6 0 0 1-6-6V14a6 6 0 0 1 6-6z" {...stroke} />
        <path d="M28 148h64M36 160h10M74 160h10" {...stroke} />
        <rect className={c("mb")} x="40" y="22" width="42" height="78" rx="2" {...stroke} />
        <rect className={c("cpu")} x="50" y="32" width="16" height="16" {...stroke} />
        <path className={c("ram")} d="M70 34v18M74 34v18M78 34v18" {...stroke} />
        <path className={c("cooler")} d="M46 28h24M50 24h16" {...stroke} />
        <rect className={c("gpu")} x="44" y="78" width="40" height="14" rx="2" {...stroke} />
        <rect className={c("ssd")} x="46" y="58" width="16" height="6" {...stroke} />
        <rect className={c("psu")} x="40" y="118" width="40" height="22" rx="2" {...stroke} />
        <circle className={c("fan")} cx="28" cy="40" r="6" {...stroke} />
      </svg>
    </div>
  );
}

function Gpu({ len }: { len: number }) {
  const fans = len >= 280 ? 3 : 2;
  const body = 70 + Math.min(150, Math.max(90, len * 0.45));
  return (
    <svg viewBox="0 0 240 72">
      <rect x="18" y="8" width={body} height="42" rx="8" {...stroke} />
      <rect x="6" y="10" width="14" height="48" rx="2" {...stroke} />
      {Array.from({ length: fans }, (_, i) => {
        const gap = body / (fans + 0.4);
        return <circle key={i} cx={36 + i * gap} cy="29" r="11" {...stroke} />;
      })}
      <rect x="48" y="50" width={Math.max(40, body - 70)} height="8" {...stroke} />
    </svg>
  );
}

function Board({ form }: { form: string }) {
  const h = form === "ITX" ? 108 : form === "mATX" ? 132 : form === "E-ATX" ? 168 : 156;
  const w = form === "E-ATX" ? 132 : form === "ITX" ? 108 : 118;
  return (
    <svg viewBox={`0 0 ${w + 16} ${h + 16}`}>
      <rect x="8" y="8" width={w} height={h} rx="4" {...stroke} />
      <rect x="14" y="16" width="18" height={h - 28} {...stroke} />
      <rect x="40" y="28" width="28" height="28" {...stroke} />
      <path d={`M78 30h${w - 86}M78 38h${w - 86}M78 46h${w - 86}`} {...stroke} />
      <path d={`M40 ${h - 36}h${w - 48}M40 ${h - 24}h${w - 56}`} {...stroke} />
    </svg>
  );
}

function Tower() {
  return (
    <svg viewBox="0 0 80 120">
      <path d="M18 8h44a4 4 0 0 1 4 4v92a4 4 0 0 1-4 4H18a4 4 0 0 1-4-4V12a4 4 0 0 1 4-4z" {...stroke} />
      <path d="M22 96h36M26 108h8M46 108h8" {...stroke} />
      <rect x="28" y="20" width="24" height="48" rx="2" {...stroke} />
    </svg>
  );
}

function Chip() {
  return (
    <svg viewBox="0 0 80 80">
      <rect x="22" y="22" width="36" height="36" rx="4" {...stroke} />
      <rect x="30" y="30" width="20" height="20" {...stroke} />
      <path d="M30 14v8M40 14v8M50 14v8M30 58v8M40 58v8M50 58v8M14 30h8M14 40h8M14 50h8M58 30h8M58 40h8M58 50h8" {...stroke} />
    </svg>
  );
}

function Stick() {
  return (
    <svg viewBox="0 0 140 48">
      <rect x="8" y="10" width="124" height="22" rx="2" {...stroke} />
      <path d="M20 16v10M32 16v10M44 16v10M56 16v10M68 16v10M80 16v10M92 16v10M104 16v10" {...stroke} />
      <path d="M16 32v6M124 32v6" {...stroke} />
    </svg>
  );
}

function Drive({ nvme }: { nvme: boolean }) {
  return nvme ? (
    <svg viewBox="0 0 160 36">
      <path d="M8 8h144v20H28L8 8z" {...stroke} />
      <rect x="118" y="14" width="22" height="8" {...stroke} />
    </svg>
  ) : (
    <svg viewBox="0 0 120 70">
      <rect x="10" y="12" width="100" height="46" rx="4" {...stroke} />
      <circle cx="28" cy="35" r="8" {...stroke} />
    </svg>
  );
}

function Cooler({ aio }: { aio: boolean }) {
  return aio ? (
    <svg viewBox="0 0 160 56">
      <rect x="8" y="8" width="100" height="28" rx="4" {...stroke} />
      <circle cx="32" cy="22" r="8" {...stroke} />
      <circle cx="58" cy="22" r="8" {...stroke} />
      <circle cx="84" cy="22" r="8" {...stroke} />
      <path d="M108 18h28M108 26h28" {...stroke} />
      <rect x="128" y="10" width="22" height="28" {...stroke} />
    </svg>
  ) : (
    <svg viewBox="0 0 70 90">
      <rect x="22" y="8" width="26" height="58" {...stroke} />
      <path d="M26 14h18M26 24h18M26 34h18M26 44h18M26 54h18" {...stroke} />
      <circle cx="35" cy="76" r="10" {...stroke} />
    </svg>
  );
}

function Psu() {
  return (
    <svg viewBox="0 0 120 70">
      <rect x="8" y="10" width="104" height="50" rx="4" {...stroke} />
      <circle cx="40" cy="35" r="14" {...stroke} />
      <circle cx="40" cy="35" r="4" {...stroke} />
      <path d="M78 24h22M78 34h22M78 44h22" {...stroke} />
    </svg>
  );
}

function Fan() {
  return (
    <svg viewBox="0 0 80 80">
      <rect x="8" y="8" width="64" height="64" rx="6" {...stroke} />
      <circle cx="40" cy="40" r="8" {...stroke} />
      <path d="M40 18c8 8 8 14 0 22M40 62c-8-8-8-14 0-22M18 40c8-8 14-8 22 0M62 40c-8 8-14 8-22 0" {...stroke} />
    </svg>
  );
}

function ShortCard() {
  return (
    <svg viewBox="0 0 150 48">
      <rect x="16" y="8" width="120" height="24" rx="3" {...stroke} />
      <rect x="6" y="8" width="12" height="32" {...stroke} />
      <rect x="40" y="32" width="60" height="6" {...stroke} />
    </svg>
  );
}

function Disc() {
  return (
    <svg viewBox="0 0 80 80">
      <rect x="14" y="10" width="52" height="60" rx="4" {...stroke} />
      <circle cx="40" cy="40" r="12" {...stroke} />
      <circle cx="40" cy="40" r="3" {...stroke} />
    </svg>
  );
}
