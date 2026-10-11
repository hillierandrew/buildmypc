import {
  AppWindow,
  AudioLines,
  Box,
  CircuitBoard,
  Cpu,
  Fan,
  HardDrive,
  MemoryStick,
  Monitor,
  Rocket,
  Snowflake,
  Wifi,
  Zap,
  type LucideIcon,
} from "lucide-react";
import type { CatId } from "@/lib/types";

const ICONS: Record<string, LucideIcon> = {
  rocket: Rocket,
  cpu: Cpu,
  circuit: CircuitBoard,
  memory: MemoryStick,
  gpu: Monitor,
  drive: HardDrive,
  snowflake: Snowflake,
  zap: Zap,
  box: Box,
  wind: Fan,
  audio: AudioLines,
  wifi: Wifi,
  app: AppWindow,
};

export function CatIcon({ name, className }: { name: string; className?: string }) {
  const Icon = ICONS[name] ?? Cpu;
  return <Icon className={className ?? "ico"} aria-hidden />;
}

export function iconForCat(id: CatId) {
  const map: Record<CatId, string> = {
    pb: "rocket",
    cpu: "cpu",
    mb: "circuit",
    ram: "memory",
    gpu: "gpu",
    ssd: "drive",
    cooler: "snowflake",
    psu: "zap",
    case: "box",
    fan: "wind",
    sound: "audio",
    nic: "wifi",
    os: "app",
  };
  return map[id];
}
