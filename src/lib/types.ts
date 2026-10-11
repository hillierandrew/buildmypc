export type CatId =
  | "pb"
  | "cpu"
  | "mb"
  | "ram"
  | "gpu"
  | "ssd"
  | "cooler"
  | "psu"
  | "case"
  | "fan"
  | "sound"
  | "nic"
  | "os";

export type FormFactor = "ITX" | "mATX" | "ATX" | "E-ATX";

export interface BasePart {
  cat: CatId;
  id: string;
  k: string;
  n: string;
  p: number;
  brand: string;
  tags: string[];
}

export interface CpuPart extends BasePart {
  cat: "cpu";
  sock: string;
  d: string;
  c: number;
  t: number;
  w: number;
  ig: number;
  oc: number;
  f: number;
}

export interface MbPart extends BasePart {
  cat: "mb";
  sock: string;
  d: string;
  form: FormFactor | string;
  wifi: number;
  oc: number;
  m2: number;
  sata: number;
  dimm: number;
}

export interface RamPart extends BasePart {
  cat: "ram";
  d: string;
  gb: number;
  mhz: number;
  lp: number;
  sticks: number;
}

export interface GpuPart extends BasePart {
  cat: "gpu";
  v: number;
  b: string;
  rec: number;
  len: number;
  tdp: number;
  f: number;
}

export interface SsdPart extends BasePart {
  cat: "ssd";
  gb: number;
  t: string;
}

export interface CoolerPart extends BasePart {
  cat: "cooler";
  t: string;
  size: number;
  tdp: number;
  s: string;
}

export interface PsuPart extends BasePart {
  cat: "psu";
  w: number;
  form: string;
}

export interface CasePart extends BasePart {
  cat: "case";
  form: FormFactor | string;
  rad: number;
  cl: number;
  gl: number;
  psu: string;
  fx: number;
  fz: string;
  fi: number;
}

export interface FanPart extends BasePart {
  cat: "fan";
  sz: number;
  pk: number;
  rgb: number;
}

export interface SoundPart extends BasePart {
  cat: "sound";
  ch: string;
  dac: string;
}

export interface NicPart extends BasePart {
  cat: "nic";
  speed: string;
  wifi: number;
}

export interface OsPart extends BasePart {
  cat: "os";
  edition: string;
}

export interface Prebuilt extends BasePart {
  cat: "pb";
  g: string;
  desc: string;
  parts: Part[];
}

export type Part =
  | CpuPart
  | MbPart
  | RamPart
  | GpuPart
  | SsdPart
  | CoolerPart
  | PsuPart
  | CasePart
  | FanPart
  | SoundPart
  | NicPart
  | OsPart
  | Prebuilt;

export type HardwarePart = Exclude<Part, Prebuilt>;

export interface Line {
  part: HardwarePart;
  qty: number;
}

export interface CompatIssue {
  level: "err" | "warn";
  msg: string;
}

export interface BuildSummary {
  lines: Line[];
  tot: number;
  c: number;
  t: number;
  v: number;
  r: number;
  st: number;
  nvme: number;
  sata: number;
  sticks: number;
  fans: number;
  watts: number;
  issues: CompatIssue[];
  required: string[];
  scores: { gaming: number; ai: number; creator: number };
  mb?: MbPart;
  cpu?: CpuPart;
  gpu?: GpuPart;
  psu?: PsuPart;
  case?: CasePart;
}

export interface SavedBuild {
  id: string;
  name: string;
  at: number;
  cart: Record<string, number>;
  ui: number;
}
