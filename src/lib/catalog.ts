import type {
  CasePart,
  CatId,
  CpuPart,
  FormFactor,
  HardwarePart,
  MbPart,
  Part,
  Prebuilt,
  RamPart,
} from "./types";

export const CATS: [CatId, string, string][] = [
  ["pb", "Ready-made builds", "rocket"],
  ["cpu", "Processor", "cpu"],
  ["mb", "Motherboard", "circuit"],
  ["ram", "Memory", "memory"],
  ["gpu", "Graphics card", "gpu"],
  ["ssd", "Storage", "drive"],
  ["cooler", "CPU cooler", "snowflake"],
  ["psu", "Power supply", "zap"],
  ["case", "Case", "box"],
  ["fan", "Case fans", "wind"],
  ["sound", "Sound card", "audio"],
  ["nic", "Network", "wifi"],
  ["os", "Operating system", "app"],
];

export const SLOTS = CATS.filter((c) => c[0] !== "pb");
export const MULTI: Partial<Record<CatId, boolean>> = {
  ram: true,
  ssd: true,
  fan: true,
};
export const REQUIRED: [CatId, string][] = [
  ["cpu", "A processor"],
  ["mb", "A motherboard"],
  ["ram", "At least one memory kit"],
  ["ssd", "At least one storage drive"],
  ["cooler", "A CPU cooler"],
  ["case", "A case"],
  ["psu", "A power supply"],
];
export const RK: Record<string, number> = { ITX: 1, mATX: 2, ATX: 3, "E-ATX": 4 };

const FLD: Record<string, string> = {
  cpu: "k n p sock d c t w ig oc f brand",
  mb: "k n p sock d form wifi oc brand",
  ram: "k n p d gb mhz lp brand",
  gpu: "k n p v b rec len tdp f brand",
  ssd: "k n p gb t brand",
  cooler: "k n p t size tdp s brand",
  psu: "k n p w form brand",
  case: "k n p form rad cl gl psu brand",
  fan: "k n p sz pk rgb brand",
  sound: "k n p ch dac brand",
  nic: "k n p speed wifi brand",
  os: "k n p edition brand",
};

const ROWS: Record<string, (string | number)[][]> = {
  cpu: [
    ["r5600", "AMD Ryzen 5 5600", 159, "AM4", "4", 6, 12, 65, 0, 1, 4, "AMD"],
    ["r5600g", "AMD Ryzen 5 5600G", 189, "AM4", "4", 6, 12, 65, 1, 1, 3, "AMD"],
    ["r5700x3d", "AMD Ryzen 7 5700X3D", 329, "AM4", "4", 8, 16, 105, 0, 0, 6, "AMD"],
    ["r7600", "AMD Ryzen 5 7600", 269, "AM5", "5", 6, 12, 88, 1, 1, 6, "AMD"],
    ["r7600x3d", "AMD Ryzen 5 7600X3D", 349, "AM5", "5", 6, 12, 65, 1, 0, 7, "AMD"],
    ["r9600x", "AMD Ryzen 5 9600X", 329, "AM5", "5", 6, 12, 88, 1, 1, 7, "AMD"],
    ["r7700", "AMD Ryzen 7 7700", 389, "AM5", "5", 8, 16, 88, 1, 1, 7, "AMD"],
    ["r7800x3d", "AMD Ryzen 7 7800X3D", 549, "AM5", "5", 8, 16, 120, 1, 0, 9, "AMD"],
    ["r9700x", "AMD Ryzen 7 9700X", 469, "AM5", "5", 8, 16, 88, 1, 1, 8, "AMD"],
    ["r9800x3d", "AMD Ryzen 7 9800X3D", 689, "AM5", "5", 8, 16, 120, 1, 0, 10, "AMD"],
    ["r9900x", "AMD Ryzen 9 9900X", 569, "AM5", "5", 12, 24, 162, 1, 1, 8, "AMD"],
    ["r9900x3d", "AMD Ryzen 9 9900X3D", 799, "AM5", "5", 12, 24, 120, 1, 0, 9, "AMD"],
    ["r9950x", "AMD Ryzen 9 9950X", 899, "AM5", "5", 16, 32, 170, 1, 1, 9, "AMD"],
    ["r9950x3d", "AMD Ryzen 9 9950X3D", 969, "AM5", "5", 16, 32, 200, 1, 1, 10, "AMD"],
    ["i3-12100", "Intel Core i3-12100", 169, "LGA1700", "45", 4, 8, 89, 1, 0, 3, "Intel"],
    ["i3-14100", "Intel Core i3-14100", 189, "LGA1700", "45", 4, 8, 89, 1, 0, 3, "Intel"],
    ["i5-12400", "Intel Core i5-12400", 229, "LGA1700", "45", 6, 12, 117, 1, 0, 5, "Intel"],
    ["i5-14400f", "Intel Core i5-14400F", 249, "LGA1700", "45", 10, 16, 148, 0, 0, 6, "Intel"],
    ["i5-14400", "Intel Core i5-14400", 239, "LGA1700", "45", 10, 16, 148, 1, 0, 6, "Intel"],
    ["i5-14600k", "Intel Core i5-14600K", 399, "LGA1700", "45", 14, 20, 181, 1, 1, 8, "Intel"],
    ["i7-14700k", "Intel Core i7-14700K", 549, "LGA1700", "45", 20, 28, 253, 1, 1, 9, "Intel"],
    ["i9-14900k", "Intel Core i9-14900K", 699, "LGA1700", "45", 24, 32, 253, 1, 1, 10, "Intel"],
    ["u5-225f", "Intel Core Ultra 5 225F", 209, "LGA1851", "5", 10, 10, 65, 0, 1, 6, "Intel"],
    ["u5-245k", "Intel Core Ultra 5 245K", 399, "LGA1851", "5", 14, 14, 159, 1, 1, 8, "Intel"],
    ["u7-265k", "Intel Core Ultra 7 265K", 549, "LGA1851", "5", 20, 20, 250, 1, 1, 9, "Intel"],
    ["u9-285k", "Intel Core Ultra 9 285K", 799, "LGA1851", "5", 24, 24, 250, 1, 1, 10, "Intel"],
  ],
  mb: [
    ["b550m", "MSI B550M PRO-VDH WiFi", 149, "AM4", "4", "mATX", 1, 1, "MSI"],
    ["b550f", "ASUS ROG STRIX B550-F GAMING WIFI II", 249, "AM4", "4", "ATX", 1, 1, "ASUS"],
    ["a620m", "GIGABYTE A620M S2H", 119, "AM5", "5", "mATX", 0, 0, "GIGABYTE"],
    ["b650", "GIGABYTE B650 EAGLE AX", 229, "AM5", "5", "ATX", 1, 1, "GIGABYTE"],
    ["b650m", "MSI MAG B650M Mortar WiFi", 249, "AM5", "5", "mATX", 1, 1, "MSI"],
    ["b650i", "ASUS ROG STRIX B650E-I GAMING WIFI", 429, "AM5", "5", "ITX", 1, 1, "ASUS"],
    ["x870", "MSI MAG X870 Tomahawk WiFi", 389, "AM5", "5", "ATX", 1, 1, "MSI"],
    ["x870e", "ASUS ROG STRIX X870E-E GAMING WIFI", 699, "AM5", "5", "ATX", 1, 1, "ASUS"],
    ["proartx", "ASUS ProArt X870E Creator", 749, "AM5", "5", "ATX", 1, 1, "ASUS"],
    ["b760m4", "GIGABYTE B760M DS3H DDR4", 139, "LGA1700", "4", "mATX", 0, 0, "GIGABYTE"],
    ["b760m5", "GIGABYTE B760M AORUS ELITE AX", 259, "LGA1700", "5", "mATX", 1, 0, "GIGABYTE"],
    ["z790d4", "ASUS PRIME Z790-P WIFI D4", 289, "LGA1700", "4", "ATX", 1, 1, "ASUS"],
    ["z790", "MSI PRO Z790-A WiFi", 339, "LGA1700", "5", "ATX", 1, 1, "MSI"],
    ["z790i", "ASUS ROG STRIX Z790-I GAMING WIFI", 569, "LGA1700", "5", "ITX", 1, 1, "ASUS"],
    ["b860m", "ASUS PRIME B860M-A WiFi", 239, "LGA1851", "5", "mATX", 1, 0, "ASUS"],
    ["z890", "MSI MAG Z890 TOMAHAWK WiFi", 419, "LGA1851", "5", "ATX", 1, 1, "MSI"],
    ["z890e", "ASUS ROG STRIX Z890-E GAMING WIFI", 729, "LGA1851", "5", "ATX", 1, 1, "ASUS"],
    ["z890c", "GIGABYTE Z890 AORUS MASTER", 679, "LGA1851", "5", "ATX", 1, 1, "GIGABYTE"],
  ],
  ram: [
    ["d4-16", "TEAMGROUP T-Force Vulcan 16GB (2x8) DDR4-3200", 55, "4", 16, 3200, 0, "TEAMGROUP"],
    ["d4-32", "Corsair Vengeance LPX 32GB (2x16) DDR4-3600", 99, "4", 32, 3600, 1, "Corsair"],
    ["d4-64", "G.SKILL Ripjaws V 64GB (2x32) DDR4-3600", 199, "4", 64, 3600, 0, "G.SKILL"],
    ["d5-16", "Kingston FURY Beast 16GB (2x8) DDR5-5600", 89, "5", 16, 5600, 0, "Kingston"],
    ["d5-32lp", "Crucial Pro 32GB (2x16) DDR5-5600 Low Profile", 129, "5", 32, 5600, 1, "Crucial"],
    ["d5-32", "Corsair Vengeance 32GB (2x16) DDR5-6000 CL30", 179, "5", 32, 6000, 0, "Corsair"],
    ["d5-32x", "G.SKILL Trident Z5 RGB 32GB (2x16) DDR5-6400", 229, "5", 32, 6400, 0, "G.SKILL"],
    ["d5-64", "G.SKILL Trident Z5 RGB 64GB (2x32) DDR5-6400", 329, "5", 64, 6400, 0, "G.SKILL"],
    ["d5-96", "Corsair Dominator Titanium 96GB (2x48) DDR5-6600", 599, "5", 96, 6600, 0, "Corsair"],
    ["d5-128", "Crucial Pro 128GB (2x64) DDR5-5600", 649, "5", 128, 5600, 1, "Crucial"],
    ["d5-192", "Corsair Vengeance 192GB (4x48) DDR5-5200", 1199, "5", 192, 5200, 0, "Corsair"],
    ["d5-256", "G.SKILL Flare X5 256GB (4x64) DDR5-6000", 1999, "5", 256, 6000, 1, "G.SKILL"],
    ["d5-48", "G.SKILL Trident Z5 48GB (2x24) DDR5-6000", 219, "5", 48, 6000, 0, "G.SKILL"],
    ["d5-32-7200", "G.SKILL Trident Z5 RGB 32GB (2x16) DDR5-7200", 259, "5", 32, 7200, 0, "G.SKILL"],
  ],
  gpu: [
    ["rtx1030", "NVIDIA GeForce GT 1030 2GB Low Profile", 99, 2, "N", 300, 150, 30, 2, "NVIDIA"],
    ["rtx3050", "NVIDIA GeForce RTX 3050 6GB", 219, 6, "N", 450, 200, 70, 4, "NVIDIA"],
    ["b580", "Intel Arc B580 12GB", 349, 12, "I", 550, 272, 190, 5, "Intel"],
    ["4060", "NVIDIA GeForce RTX 4060 8GB", 389, 8, "N", 550, 200, 115, 5, "NVIDIA"],
    ["4060ti", "NVIDIA GeForce RTX 4060 Ti 16GB", 629, 16, "N", 550, 250, 165, 6, "NVIDIA"],
    ["4070s", "NVIDIA GeForce RTX 4070 SUPER 12GB", 859, 12, "N", 650, 242, 220, 7, "NVIDIA"],
    ["4070tis", "NVIDIA GeForce RTX 4070 Ti SUPER 16GB", 1149, 16, "N", 750, 305, 285, 8, "NVIDIA"],
    ["4080s", "NVIDIA GeForce RTX 4080 SUPER 16GB", 1499, 16, "N", 750, 310, 320, 9, "NVIDIA"],
    ["4090", "NVIDIA GeForce RTX 4090 24GB", 2999, 24, "N", 850, 336, 450, 10, "NVIDIA"],
    ["5060", "NVIDIA GeForce RTX 5060 8GB", 429, 8, "N", 550, 240, 145, 5, "NVIDIA"],
    ["5060ti", "NVIDIA GeForce RTX 5060 Ti 16GB", 599, 16, "N", 600, 244, 180, 6, "NVIDIA"],
    ["5070", "NVIDIA GeForce RTX 5070 12GB", 779, 12, "N", 650, 242, 250, 7, "NVIDIA"],
    ["5070ti", "NVIDIA GeForce RTX 5070 Ti 16GB", 1149, 16, "N", 750, 300, 300, 8, "NVIDIA"],
    ["5080", "NVIDIA GeForce RTX 5080 16GB", 1599, 16, "N", 850, 304, 360, 9, "NVIDIA"],
    ["5090", "NVIDIA GeForce RTX 5090 32GB", 3299, 32, "N", 1000, 336, 575, 10, "NVIDIA"],
    ["7600", "AMD Radeon RX 7600 8GB", 329, 8, "A", 550, 204, 165, 4, "AMD"],
    ["7800xt", "AMD Radeon RX 7800 XT 16GB", 679, 16, "A", 700, 267, 263, 7, "AMD"],
    ["7900xt", "AMD Radeon RX 7900 XT 20GB", 949, 20, "A", 750, 276, 315, 8, "AMD"],
    ["7900xtx", "AMD Radeon RX 7900 XTX 24GB", 1349, 24, "A", 800, 287, 355, 9, "AMD"],
    ["9060xt", "AMD Radeon RX 9060 XT 16GB", 459, 16, "A", 550, 240, 160, 6, "AMD"],
    ["9070", "AMD Radeon RX 9070 16GB", 849, 16, "A", 650, 260, 220, 8, "AMD"],
    ["9070xt", "AMD Radeon RX 9070 XT 16GB", 949, 16, "A", 750, 330, 304, 8, "AMD"],
    ["rtx2000", "NVIDIA RTX 2000 Ada 16GB Low Profile", 949, 16, "N", 300, 167, 70, 5, "NVIDIA"],
    ["rtx4000", "NVIDIA RTX 4000 SFF Ada 20GB Low Profile", 1999, 20, "N", 300, 168, 70, 6, "NVIDIA"],
    ["rtx5000", "NVIDIA RTX 5000 Ada 32GB", 4499, 32, "N", 400, 267, 250, 8, "NVIDIA"],
  ],
  ssd: [
    ["p3-500", "Crucial P3 Plus 500GB NVMe", 49, 500, "NVMe Gen4", "Crucial"],
    ["p3-1", "Crucial P3 Plus 1TB NVMe", 99, 1000, "NVMe Gen4", "Crucial"],
    ["p3-2", "Crucial P3 Plus 2TB NVMe", 149, 2000, "NVMe Gen4", "Crucial"],
    ["sn770-1", "WD Black SN770 1TB NVMe", 119, 1000, "NVMe Gen4", "WD"],
    ["sn770-2", "WD Black SN770 2TB NVMe", 169, 2000, "NVMe Gen4", "WD"],
    ["990evo-1", "Samsung 990 EVO Plus 1TB NVMe", 129, 1000, "NVMe Gen4", "Samsung"],
    ["990evo-2", "Samsung 990 EVO Plus 2TB NVMe", 219, 2000, "NVMe Gen4", "Samsung"],
    ["990evo-4", "Samsung 990 EVO Plus 4TB NVMe", 349, 4000, "NVMe Gen4", "Samsung"],
    ["sn850x-1", "WD Black SN850X 1TB NVMe", 129, 1000, "NVMe Gen4", "WD"],
    ["sn850x-2", "WD Black SN850X 2TB NVMe", 239, 2000, "NVMe Gen4", "WD"],
    ["sn850x-4", "WD Black SN850X 4TB NVMe", 429, 4000, "NVMe Gen4", "WD"],
    ["990pro-2", "Samsung 990 Pro 2TB NVMe", 279, 2000, "NVMe Gen4", "Samsung"],
    ["990pro-4", "Samsung 990 Pro 4TB NVMe", 579, 4000, "NVMe Gen4", "Samsung"],
    ["kc3000-2", "Kingston KC3000 2TB NVMe", 149, 2000, "NVMe Gen4", "Kingston"],
    ["mp600-2", "Corsair MP600 PRO LPX 2TB NVMe", 159, 2000, "NVMe Gen4", "Corsair"],
    ["t705-1", "Crucial T705 1TB NVMe", 189, 1000, "NVMe Gen5", "Crucial"],
    ["t705-2", "Crucial T705 2TB NVMe", 459, 2000, "NVMe Gen5", "Crucial"],
    ["t705-4", "Crucial T705 4TB NVMe", 899, 4000, "NVMe Gen5", "Crucial"],
    ["9100-2", "Samsung 9100 Pro 2TB NVMe", 349, 2000, "NVMe Gen5", "Samsung"],
    ["9100-4", "Samsung 9100 Pro 4TB NVMe", 549, 4000, "NVMe Gen5", "Samsung"],
    ["870-500", "Samsung 870 EVO 500GB 2.5\" SSD", 59, 500, "SATA SSD", "Samsung"],
    ["870-1", "Samsung 870 EVO 1TB 2.5\" SSD", 139, 1000, "SATA SSD", "Samsung"],
    ["870-2", "Samsung 870 EVO 2TB 2.5\" SSD", 179, 2000, "SATA SSD", "Samsung"],
    ["870-4", "Samsung 870 EVO 4TB 2.5\" SSD", 449, 4000, "SATA SSD", "Samsung"],
    ["mx500-1", "Crucial MX500 1TB 2.5\" SSD", 79, 1000, "SATA SSD", "Crucial"],
    ["mx500-2", "Crucial MX500 2TB 2.5\" SSD", 139, 2000, "SATA SSD", "Crucial"],
    ["bc-2t", "Seagate BarraCuda 2TB HDD", 69, 2000, "HDD", "Seagate"],
    ["bc-4t", "Seagate BarraCuda 4TB HDD", 119, 4000, "HDD", "Seagate"],
    ["bc-8t", "Seagate BarraCuda 8TB HDD", 189, 8000, "HDD", "Seagate"],
    ["ih-4t", "Seagate IronWolf 4TB NAS HDD", 129, 4000, "HDD", "Seagate"],
    ["ih-8t", "Seagate IronWolf 8TB NAS HDD", 239, 8000, "HDD", "Seagate"],
    ["ih-16t", "Seagate IronWolf Pro 16TB NAS HDD", 499, 16000, "HDD", "Seagate"],
    ["exos-18", "Seagate Exos X18 18TB Enterprise HDD", 329, 18000, "HDD", "Seagate"],
    ["exos-22", "Seagate Exos X22 22TB Enterprise HDD", 429, 22000, "HDD", "Seagate"],
    ["wr-4t", "WD Red Plus 4TB NAS HDD", 119, 4000, "HDD", "WD"],
    ["wr-8t", "WD Red Plus 8TB NAS HDD", 199, 8000, "HDD", "WD"],
    ["wr-12t", "WD Red Plus 12TB NAS HDD", 359, 12000, "HDD", "WD"],
    ["wg-8t", "WD Gold 8TB Enterprise HDD", 249, 8000, "HDD", "WD"],
    ["wg-20t", "WD Gold 20TB Enterprise HDD", 599, 20000, "HDD", "WD"],
    ["wg-22t", "WD Gold 22TB Enterprise HDD", 549, 22000, "HDD", "WD"],
    ["sky-8t", "WD SkyHawk 8TB Surveillance HDD", 189, 8000, "HDD", "WD"],
  ],
  cooler: [
    ["stock", "Stock AMD/Intel Cooler", 0, "Air", 70, 125, "", "OEM"],
    ["ax120", "Thermalright Assassin X 120 SE", 29, "Air", 148, 180, "", "Thermalright"],
    ["pa120", "Thermalright Peerless Assassin 120 SE", 49, "Air", 155, 250, "", "Thermalright"],
    ["dh15", "Noctua NH-D15 G2", 169, "Air", 168, 300, "", "Noctua"],
    ["l9i", "Noctua NH-L9i-17xx Low Profile", 69, "Air", 37, 65, "I", "Noctua"],
    ["l9a", "Noctua NH-L9a-AM5 Low Profile", 69, "Air", 37, 65, "A", "Noctua"],
    ["lf240", "Arctic Liquid Freezer III 240 AIO", 119, "AIO", 240, 300, "", "Arctic"],
    ["lf360", "Arctic Liquid Freezer III 360 AIO", 159, "AIO", 360, 400, "", "Arctic"],
    ["lf420", "Arctic Liquid Freezer III 420 AIO", 199, "AIO", 420, 420, "", "Arctic"],
    ["h100i", "Corsair iCUE H100i Elite 240 AIO", 189, "AIO", 240, 300, "", "Corsair"],
    ["h150i", "Corsair iCUE H150i Elite 360 AIO", 239, "AIO", 360, 400, "", "Corsair"],
    ["kraken", "NZXT Kraken Elite 360 LCD AIO", 399, "AIO", 360, 400, "", "NZXT"],
  ],
  psu: [
    ["smart500", "Thermaltake Smart 500W 80+", 49, 500, "ATX", "Thermaltake"],
    ["bq550", "be quiet! Pure Power 12 M 550W Gold", 99, 550, "ATX", "be quiet!"],
    ["cx650", "Corsair CX650 650W Bronze", 99, 650, "ATX", "Corsair"],
    ["rm750e", "Corsair RM750e 750W Gold", 149, 750, "ATX", "Corsair"],
    ["mag850", "MSI MAG A850GL PCIE5 850W Gold", 169, 850, "ATX", "MSI"],
    ["rm850e", "Corsair RM850e 850W Gold", 179, 850, "ATX", "Corsair"],
    ["rm1000x", "Corsair RM1000x 1000W Gold", 269, 1000, "ATX", "Corsair"],
    ["rm1200", "Corsair RM1200x SHIFT 1200W Gold", 339, 1200, "ATX", "Corsair"],
    ["hx1500", "Corsair HX1500i 1500W Platinum", 499, 1500, "ATX", "Corsair"],
    ["sf750", "Corsair SF750 750W Platinum SFX", 229, 750, "SFX", "Corsair"],
    ["sf850", "Corsair SF850 850W Platinum SFX", 279, 850, "SFX", "Corsair"],
    ["sf1000", "Corsair SF1000 1000W Platinum SFX", 339, 1000, "SFX", "Corsair"],
  ],
  fan: [
    ["p12", "Arctic P12 PWM PST 120mm", 13, 120, 1, 0, "Arctic"],
    ["p14", "Arctic P14 PWM PST 140mm", 14, 140, 1, 0, "Arctic"],
    ["nfa12", "Noctua NF-A12x25 PWM 120mm", 38, 120, 1, 0, "Noctua"],
    ["nfa14", "Noctua NF-A14 PWM 140mm", 34, 140, 1, 0, "Noctua"],
    ["nfa9", "Noctua NF-A9 PWM 92mm (SFF)", 26, 92, 1, 0, "Noctua"],
    ["sw4", "be quiet! Silent Wings 4 140mm PWM", 34, 140, 1, 0, "be quiet!"],
    ["sp120", "Corsair iCUE SP120 RGB ELITE 120mm 3-pack", 49, 120, 3, 1, "Corsair"],
    ["tl12", "Thermalright TL-C12C X3 120mm 3-pack", 39, 120, 3, 0, "Thermalright"],
    ["sl120", "Lian Li UNI FAN SL120 V2 120mm 3-pack", 89, 120, 3, 1, "Lian Li"],
    ["sl140", "Lian Li UNI FAN SL140 V2 140mm 3-pack", 99, 140, 3, 1, "Lian Li"],
    ["sl140x", "Lian Li UNI FAN SL140 V2 140mm reverse", 109, 140, 3, 1, "Lian Li"],
  ],
  case: [
    ["xtpro", "Phanteks XT Pro Mid Tower", 69, "ATX", 360, 180, 415, "ATX", "Phanteks"],
    ["air100", "Montech AIR 100 ARGB Micro-ATX", 79, "mATX", 240, 160, 330, "ATX", "Montech"],
    ["h5", "NZXT H5 Flow Mid Tower", 119, "ATX", 280, 165, 365, "ATX", "NZXT"],
    ["4000d", "Corsair 4000D Airflow Mid Tower", 129, "ATX", 360, 170, 360, "ATX", "Corsair"],
    ["popsil", "Fractal Design Pop Silent Mid Tower", 129, "ATX", 280, 170, 405, "ATX", "Fractal"],
    ["lancool", "Lian Li Lancool 216 Mid Tower", 139, "ATX", 360, 180, 392, "ATX", "Lian Li"],
    ["h6", "NZXT H6 Flow Mid Tower", 169, "ATX", 360, 163, 365, "ATX", "NZXT"],
    ["meshify", "Fractal Design Meshify 2 Mid Tower", 179, "ATX", 360, 185, 440, "ATX", "Fractal"],
    ["north", "Fractal Design North Mid Tower", 199, "ATX", 360, 170, 355, "ATX", "Fractal"],
    ["o11", "Lian Li O11 Dynamic EVO", 229, "ATX", 360, 167, 426, "ATX", "Lian Li"],
    ["o11xl", "Lian Li O11 Dynamic EVO XL", 259, "E-ATX", 420, 167, 460, "ATX", "Lian Li"],
    ["nr200", "Cooler Master NR200P Mini-ITX", 139, "ITX", 280, 155, 330, "SFX", "Cooler Master"],
    ["terra", "Fractal Design Terra Mini-ITX", 239, "ITX", 0, 77, 322, "SFX", "Fractal"],
    ["ridge", "Fractal Design Ridge Mini-ITX", 239, "ITX", 0, 70, 325, "SFX", "Fractal"],
  ],
  sound: [
    ["snd-on", "Onboard audio (Realtek ALC1220)", 0, "7.1", "Onboard", "Realtek"],
    ["ae5", "Creative Sound Blaster AE-5 Plus", 129, "5.1", "PCIe DAC", "Creative"],
    ["ae7", "Creative Sound Blaster AE-7", 199, "5.1", "PCIe DAC", "Creative"],
    ["x4", "Creative Sound Blaster X4", 149, "7.1", "USB DAC", "Creative"],
    ["stx2", "ASUS Essence STX II 7.1", 249, "7.1", "PCIe DAC", "ASUS"],
    ["scarlett", "Focusrite Scarlett 2i2 4th Gen", 199, "2.0", "USB interface", "Focusrite"],
    ["id4", "Audient iD4 MkII", 179, "2.0", "USB interface", "Audient"],
    ["goxlr", "TC Helicon GoXLR Mini", 229, "2.0", "USB mixer", "TC Helicon"],
    ["evo4", "Audient EVO 4", 129, "2.0", "USB interface", "Audient"],
  ],
  nic: [
    ["nic-on", "Onboard Ethernet (1GbE)", 0, "1GbE", 0, "Realtek"],
    ["i226", "Intel I226-V 2.5GbE PCIe", 39, "2.5GbE", 0, "Intel"],
    ["x540", "Intel X540-T2 10GbE Dual Port", 189, "10GbE", 0, "Intel"],
    ["ax210", "Intel Wi-Fi 6E AX210", 29, "Wi-Fi 6E", 6, "Intel"],
    ["axe54", "ASUS PCE-AXE5400 WiFi 6E", 49, "Wi-Fi 6E", 6, "ASUS"],
    ["be200", "Intel Wi-Fi 7 BE200", 39, "Wi-Fi 7", 7, "Intel"],
    ["mt7925", "MediaTek Wi-Fi 7 RZ616", 45, "Wi-Fi 7", 7, "MediaTek"],
  ],
  os: [
    ["os-none", "No operating system", 0, "None", "None"],
    ["w11h", "Windows 11 Home", 139, "Home", "Microsoft"],
    ["w11p", "Windows 11 Pro", 199, "Pro", "Microsoft"],
    ["w11oem", "Windows 11 Pro OEM", 129, "Pro OEM", "Microsoft"],
  ],
};

const XB: Record<string, [number, number, number]> = {
  b550m: [2, 4, 4],
  b550f: [2, 4, 4],
  a620m: [1, 4, 2],
  b650: [3, 4, 4],
  b650m: [2, 4, 4],
  b650i: [2, 2, 2],
  x870: [3, 4, 4],
  x870e: [4, 4, 4],
  proartx: [5, 4, 4],
  b760m4: [2, 4, 4],
  b760m5: [2, 4, 4],
  z790d4: [3, 4, 4],
  z790: [4, 6, 4],
  z790i: [2, 2, 2],
  b860m: [2, 4, 4],
  z890: [4, 4, 4],
  z890e: [4, 4, 4],
  z890c: [5, 6, 4],
};

const XC: Record<string, [number, string, number]> = {
  air100: [6, "120", 3],
  h5: [5, "120,140", 2],
  "4000d": [6, "120,140", 2],
  popsil: [6, "120,140", 2],
  lancool: [6, "120,140", 2],
  h6: [8, "120,140", 3],
  meshify: [9, "120,140", 3],
  north: [7, "120,140", 2],
  o11: [9, "120,140", 0],
  o11xl: [10, "120,140", 0],
  nr200: [4, "92,120", 2],
  terra: [3, "120,140", 0],
  ridge: [3, "120,140", 0],
  xtpro: [6, "120,140", 3],
};

function fs(g: number) {
  return g >= 1000 ? `${g / 1000}TB` : `${g}GB`;
}

function tagsFor(o: Record<string, unknown>) {
  const t: string[] = [];
  const cat = o.cat as string;
  switch (cat) {
    case "cpu": {
      t.push(String(o.sock), ...[...String(o.d)].map((d) => "DDR" + d));
      t.push(o.ig ? "Integrated graphics" : "No iGPU");
      t.push(o.oc ? "Overclockable" : "Locked");
      if ((o.f as number) >= 8) t.push("Gaming");
      if ((o.t as number) >= 20) t.push("Creator / Pro");
      if ((o.p as number) < 260) t.push("Budget");
      if ((o.p as number) > 700) t.push("Enthusiast");
      if (o.ig && (o.t as number) <= 12) t.push("Office / HTPC");
      if (o.sock === "AM4") t.push("DDR4 Platform");
      if (o.sock === "AM5") t.push("AM5 Platform");
      if (o.sock === "LGA1700") t.push("LGA1700");
      if (o.sock === "LGA1851") t.push("LGA1851");
      break;
    }
    case "mb": {
      t.push(String(o.sock), ...[...String(o.d)].map((d) => "DDR" + d), String(o.form));
      t.push(o.wifi ? "WiFi" : "No WiFi");
      if (o.oc) t.push("Overclockable");
      if (o.form === "ITX") t.push("SFF");
      if (o.form === "mATX") t.push("Compact");
      if (o.form === "E-ATX") t.push("Workstation");
      if ((o.m2 as number) >= 3) t.push(`${o.m2}× M.2`);
      if ((o.dimm as number) >= 4) t.push(`${o.dimm} RAM slots`);
      if ((o.sata as number) >= 4) t.push(`${o.sata} SATA`);
      break;
    }
    case "ram": {
      t.push("DDR" + o.d, `${o.gb}GB`, `${o.mhz}MHz`);
      if (o.lp) t.push("Low profile");
      if ((o.gb as number) >= 64) t.push("Creator / AI");
      if ((o.gb as number) >= 128) t.push("Workstation");
      if ((o.mhz as number) >= 6000) t.push("High speed");
      if (o.gb === 16) t.push("Budget");
      if (o.gb === 32) t.push("Standard");
      t.push(`${o.sticks} sticks`);
      break;
    }
    case "gpu": {
      t.push(({ N: "NVIDIA", A: "AMD", I: "Intel" } as Record<string, string>)[String(o.b)] ?? "GPU");
      t.push(`${o.v}GB VRAM`);
      if ((o.f as number) >= 7) t.push("Gaming");
      if ((o.f as number) >= 9) t.push("4K Gaming");
      if ((o.v as number) >= 16) t.push("AI / LLM");
      if ((o.v as number) >= 24) t.push("AI Workstation");
      if ((o.len as number) <= 250) t.push("SFF GPU");
      if ((o.len as number) <= 170) t.push("Low profile");
      if ((o.tdp as number) >= 300) t.push("High wattage");
      if ((o.tdp as number) <= 100) t.push("Low power");
      if ((o.rec as number) <= 450) t.push("Small PSU OK");
      if ((o.rec as number) >= 850) t.push("Big PSU needed");
      break;
    }
    case "ssd": {
      t.push(String(o.t), fs(o.gb as number), /NVMe/.test(String(o.t)) ? "NVMe" : "SATA");
      if (/Gen5/.test(String(o.t))) t.push("Fastest");
      if (/Gen4/.test(String(o.t))) t.push("Fast");
      if (/HDD/.test(String(o.t))) t.push("Bulk storage");
      if ((o.gb as number) >= 2000) t.push("Large");
      if ((o.gb as number) >= 4000) t.push("Massive");
      if ((o.gb as number) <= 1000) t.push("Budget");
      break;
    }
    case "cooler": {
      t.push(o.t === "AIO" ? "Liquid" : "Air");
      if (o.t === "Air" && (o.size as number) <= 70) t.push("Low profile", "SFF");
      if (o.t === "Air" && (o.size as number) >= 160) t.push("Tall", "Big air");
      if (o.t === "AIO") t.push(`${o.size}mm radiator`);
      if ((o.tdp as number) >= 300) t.push("High TDP");
      if ((o.tdp as number) <= 100) t.push("Small CPU");
      if (o.p === 0) t.push("Stock");
      break;
    }
    case "psu": {
      t.push(`${o.w}W`, String(o.form));
      if (o.form === "SFX") t.push("SFF PSU");
      if ((o.w as number) >= 1000) t.push("Enthusiast");
      if ((o.w as number) >= 1500) t.push("Workstation");
      if ((o.w as number) <= 550) t.push("Budget");
      if ((o.w as number) >= 750) t.push("High-end");
      break;
    }
    case "case": {
      t.push(String(o.form));
      if (o.form === "ITX") t.push("SFF");
      if (o.form === "mATX") t.push("Compact");
      if (o.form === "ATX") t.push("Mid tower");
      if (o.form === "E-ATX") t.push("Big");
      if ((o.gl as number) >= 380) t.push("Long GPU");
      if ((o.cl as number) >= 170) t.push("Tall cooler");
      if ((o.rad as number) >= 360) t.push("360 radiator");
      if ((o.rad as number) >= 420) t.push("420 radiator");
      if (o.psu === "SFX") t.push("SFX PSU");
      break;
    }
    case "fan": {
      t.push(`${o.sz}mm`, (o.pk as number) > 1 ? `${o.pk}-pack` : "Single");
      if (o.rgb) t.push("ARGB");
      if ((o.sz as number) >= 140) t.push("Large");
      if ((o.sz as number) <= 92) t.push("SFF");
      if ((o.pk as number) >= 3) t.push("Bundle");
      break;
    }
    case "sound": {
      t.push(String(o.ch), String(o.dac));
      if (o.p === 0) t.push("Onboard");
      if (/USB/.test(String(o.dac))) t.push("External");
      if (/PCIe/.test(String(o.dac))) t.push("Internal card");
      if (/interface|mixer/.test(String(o.dac))) t.push("Creator");
      break;
    }
    case "nic": {
      t.push(String(o.speed));
      if ((o.wifi as number) > 0) t.push("WiFi");
      else t.push("Wired");
      if (o.p === 0) t.push("Onboard");
      if (/10GbE/.test(String(o.speed))) t.push("Workstation");
      break;
    }
    case "os": {
      t.push(String(o.edition));
      if (o.p === 0) t.push("Bring your own");
      if (/Pro/.test(String(o.edition))) t.push("Business");
      break;
    }
  }
  return [...new Set(t)];
}

export function specOf(o: Part): string {
  switch (o.cat) {
    case "cpu":
      return `${o.c} cores / ${o.t} threads · up to ${o.w}W`;
    case "mb":
      return `${o.sock} · DDR${o.d} · ${o.form}${o.wifi ? " · WiFi" : ""} · ${o.m2}× M.2 · ${o.sata} SATA · ${o.dimm} DIMM`;
    case "ram":
      return `${o.gb}GB · DDR${o.d}-${o.mhz} · ${o.sticks} sticks`;
    case "gpu":
      return `${o.v}GB VRAM · ${o.tdp}W · ${o.len}mm · PSU ${o.rec}W+`;
    case "ssd":
      return `${fs(o.gb)} · ${o.t}`;
    case "cooler":
      return `${o.t === "AIO" ? o.size + "mm radiator" : o.size + "mm tall"} · rated ${o.tdp}W`;
    case "psu":
      return `${o.w}W · ${o.form}`;
    case "case":
      return `${o.form} · GPU up to ${o.gl}mm · cooler up to ${o.cl}mm`;
    case "fan":
      return `${o.sz}mm · ${o.pk > 1 ? o.pk + "-pack" : "single"}`;
    case "sound":
      return `${o.ch} · ${o.dac}`;
    case "nic":
      return `${o.speed}${o.wifi ? " · Wi-Fi " + o.wifi : ""}`;
    case "os":
      return o.edition;
    case "pb":
      return o.desc;
  }
}

export const DB: Record<CatId, Part[]> = {
  pb: [],
  cpu: [],
  mb: [],
  ram: [],
  gpu: [],
  ssd: [],
  cooler: [],
  psu: [],
  case: [],
  fan: [],
  sound: [],
  nic: [],
  os: [],
};

for (const c of Object.keys(ROWS)) {
  const f = FLD[c].split(" ");
  DB[c as CatId] = ROWS[c]
    .map((r) => {
      const o: Record<string, unknown> = { cat: c, id: `${c}-${r[0]}` };
      f.forEach((x, i) => {
        o[x] = r[i];
      });
      if (c === "ram") {
        const m = String(o.n).match(/(\d+)\s*x\s*\d+/i);
        o.sticks = m ? Number(m[1]) : 2;
      }
      o.tags = tagsFor(o);
      return o as unknown as Part;
    })
    .sort((a, b) => a.p - b.p);
}

for (const k of Object.keys(XB)) {
  const mb = DB.mb.find((p) => p.k === k) as MbPart | undefined;
  if (mb) {
    mb.m2 = XB[k][0];
    mb.sata = XB[k][1];
    mb.dimm = XB[k][2];
    mb.tags = tagsFor(mb as unknown as Record<string, unknown>);
  }
}
for (const k of Object.keys(XC)) {
  const cs = DB.case.find((p) => p.k === k) as CasePart | undefined;
  if (cs) {
    cs.fx = XC[k][0];
    cs.fz = XC[k][1];
    cs.fi = XC[k][2];
  }
}

const PRE: [string, string, string, string, string, string][] = [
  ["g1", "Gaming", "Esports 1080p (Fortnite, Valorant, CS2)", "Gaming,240 FPS,Value", "High frame rates in competitive games.", "r7600,b650m,d5-16,9060xt,p3-1,pa120,rm750e,air100"],
  ["g2", "Gaming", "1440p High Refresh", "Gaming,1440p,NVIDIA", "Smooth 1440p at high settings.", "r9600x,b650,d5-32,5070,990evo-1,pa120,rm750e,h5"],
  ["g3", "Gaming", "4K Ultra / Max Settings", "Gaming,4K,Enthusiast", "Top-end gaming with ray tracing.", "r9800x3d,x870,d5-32,5080,990pro-2,lf360,rm1000x,north"],
  ["g4", "Gaming", "Budget Gaming (DDR4)", "Gaming,DDR4,Budget", "Lowest price that still plays 1080p well.", "r5600,b550m,d4-16,7600,p3-1,ax120,cx650,air100"],
  ["g5", "Gaming", "Small Form Factor Gaming", "Gaming,SFF,Mini-ITX", "Compact case, full-size performance.", "r9700x,b650i,d5-32lp,5070,990evo-1,pa120,sf750,nr200"],
  ["g6", "Gaming", "Streaming PC", "Streaming,Creator,RGB", "Multi-core for encoding while gaming.", "r9700x,b650,d5-32,5070,990pro-2,lf360,rm850e,h6"],
  ["g7", "Gaming", "Budget 4K", "Gaming,4K,Value", "Entry-level 4K with modern upscaling.", "r9600x,b650,d5-32,5070ti,990evo-2,lf360,rm850e,north"],
  ["p1", "Professional", "AutoCAD / Revit / SolidWorks", "CAD,Workstation,Single-thread", "Fast cores, 64GB RAM and workstation GPU.", "i7-14700k,z790,d5-64,rtx2000,990pro-2,lf360,rm750e,4000d"],
  ["p2", "Professional", "Video Editing (Premiere, DaVinci)", "Video,Creator,Quick Sync", "Many cores, 64GB RAM and strong GPU.", "u7-265k,z890,d5-64,5070ti,990pro-2,lf360,rm850e,h6"],
  ["p3", "Professional", "DJ / Music Production / Audio", "Audio,Quiet,No GPU needed", "Quiet air cooling and a dedicated sound card.", "r7700,b650m,d5-32lp,,990evo-2,dh15,bq550,popsil"],
  ["p4", "Professional", "AI / Local LLM Workstation", "AI,CUDA,128GB RAM", "32GB VRAM and 128GB RAM for local models.", "r9950x3d,x870e,d5-128,5090,990pro-4,lf360,rm1200,o11"],
  ["p5", "Professional", "3D / Blender / VFX", "3D,Creator,Rendering", "High VRAM for GPU render farms.", "r9950x,x870e,d5-96,5090,990pro-4,lf420,rm1200,o11xl"],
  ["p6", "Professional", "Software Development", "Dev,Multi-core,Quiet", "Lots of cores for compiles and containers.", "r9950x,x870,d5-64,,990pro-2,dh15,bq550,popsil"],
  ["p7", "Professional", "Virtual Machines / Homelab", "VM,Multi-core,128GB RAM", "Threads and memory for many concurrent VMs.", "r9900x,x870,d5-128,,990pro-4,lf360,rm1000x,o11"],
  ["p8", "Professional", "Cybersecurity / Pentesting", "Cyber,Multi-core,Quiet", "VM-heavy workloads and lab environments.", "r9900x,x870,d5-64,,990pro-2,dh15,rm750e,popsil"],
  ["e1", "Everyday", "Office / School (no GPU needed)", "Office,Budget,DDR4,Integrated graphics", "Documents, browsing and video calls.", "i5-12400,b760m4,d4-16,,p3-1,ax120,smart500,air100"],
  ["e2", "Everyday", "Home Media Server / Plex", "Plex,Quiet,Budget", "Transcoding with Intel Quick Sync.", "i5-14400,b760m5,d5-32,,870-4,ax120,cx650,popsil"],
  ["e3", "Everyday", "Family PC", "Family,Budget,DDR4", "Reliable, quiet, and easy to upgrade.", "i5-12400,b760m4,d4-16,,870-1,stock,smart500,air100"],
  ["e4", "Everyday", "Crypto Mining Rig", "Mining,Multi-GPU,Airflow", "A GPU that fits the case, with airflow to spare.", "r5600,b550m,d4-16,7600,p3-1,ax120,cx650,o11"],
  ["e5", "Everyday", "Ultra Compact ITX", "SFF,Mini-ITX,Budget", "Gaming in a small form factor.", "r7600,b650i,d5-32lp,9060xt,990evo-1,stock,sf750,terra"],
  ["e6", "Everyday", "Silent / Audiophile PC", "Quiet,Audio,No RGB", "Sound-dampened case, discrete audio.", "r7700,b650,d5-32lp,rtx2000,990pro-2,dh15,bq550,popsil"],
  ["e7", "Everyday", "Creator Starter Kit", "Creator,Budget,RGB", "Entry-level video and photo editing.", "r9600x,b650,d5-32,4060ti,990evo-2,pa120,rm750e,h5"],
  ["e8", "Everyday", "Multi-Monitor Productivity", "Productivity,Multi-monitor,Low power", "Lots of outputs, quiet, efficient.", "u5-245k,z890,d5-64,rtx2000,990pro-2,dh15,rm750e,popsil"],
  ["e9", "Everyday", "NAS / Bulk Storage Tower", "NAS,HDD,Quiet", "NVMe boot plus four big SATA drives.", "r7700,x870,d5-32,,p3-1,pa120,rm850e,o11"],
  ["g8", "Gaming", "Sim Racing and Flight Sim", "Gaming,Sim,High refresh", "Fast cores and a wide GPU for sim titles.", "r9800x3d,x870,d5-32,5080,990pro-2,lf360,rm1000x,north"],
  ["g9", "Gaming", "Indie and Retro 1080p", "Gaming,Indie,Budget,DDR4", "Light games and older titles without a huge bill.", "r5600,b550m,d4-16,4060,p3-1,ax120,cx650,air100"],
  ["g10", "Gaming", "VR Ready Rig", "Gaming,VR,1440p", "Headroom for a headset and high settings.", "r7800x3d,b650,d5-32,5070ti,990pro-2,lf360,rm850e,h6"],
  ["g11", "Gaming", "Living Room 4K", "Gaming,4K,Living room", "A console-style tower for the TV.", "r9600x,b650,d5-32,5070,990evo-1,pa120,rm750e,h5"],
  ["g12", "Gaming", "LAN Party Box", "Gaming,LAN,Value", "Easy to carry, still plays current games.", "r7600,b650m,d5-16,5060,p3-1,pa120,rm750e,air100"],
  ["p9", "Professional", "Architecture Visualization", "CAD,Architecture,Workstation", "Models, walkthroughs, and big scene files.", "r9700x,x870,d5-64,5070ti,990pro-2,lf360,rm850e,h6"],
  ["p10", "Professional", "Broadcast and Live Production", "Video,Broadcast,Creator", "Capture, switch, and encode a live show.", "i7-14700k,z790,d5-64,4070s,990pro-2,lf360,rm850e,4000d"],
  ["p11", "Professional", "Photo Studio", "Photo,Creator,Quiet", "Raw catalogs, exports, and a quiet desk.", "r9600x,b650,d5-32,4060ti,990evo-2,pa120,rm750e,h5"],
  ["p12", "Professional", "Scientific Computing", "Science,Multi-core,Workstation", "Compiles, datasets, and long jobs.", "r9950x,x870,d5-64,,990pro-2,dh15,rm750e,popsil"],
  ["p13", "Professional", "Industrial HMI and SCADA", "Industrial,Office,Integrated graphics", "A quiet desk PC for plant screens.", "i5-14400,b760m5,d5-32,,870-1,ax120,cx650,popsil"],
  ["p14", "Professional", "Film Color and Finishing", "Video,Film,Creator", "High VRAM for timelines and grades.", "u7-265k,z890,d5-64,5080,990pro-4,lf360,rm1000x,h6"],
  ["p15", "Professional", "CAD Render Node", "CAD,Rendering,Workstation", "A render box with a workstation card.", "i9-14900k,z790,d5-64,rtx4000,990pro-2,lf360,rm1000x,4000d"],
  ["e10", "Everyday", "Classroom Lab", "Office,School,Budget,Integrated graphics", "A fleet-friendly PC for a lab.", "i3-12100,b760m4,d4-16,,p3-500,stock,smart500,air100"],
  ["e11", "Everyday", "Point of Sale", "Office,Retail,Integrated graphics", "A small counter PC with integrated graphics.", "i3-14100,b760m4,d4-16,,870-500,stock,smart500,air100"],
  ["e12", "Everyday", "Call Center Desk", "Office,Quiet,Integrated graphics", "Documents, a softphone, and a headset.", "i5-12400,b760m4,d4-16,,870-1,ax120,smart500,air100"],
  ["c0", "Value", "Cheapest PC", "Budget,Office,Mid tower,Onboard", "Lowest total that still turns on. Onboard graphics, a mid tower, onboard sound.", "i3-12100,b760m4,d4-16,,p3-500,stock,smart500,xtpro"],
  ["x0", "Enthusiast", "Most expensive PC", "Enthusiast,Workstation,Sound card", "The priciest part in each slot, and they still fit in one case.", "r9950x3d,proartx,d5-256,rtx5000,t705-4,kraken,hx1500,o11xl"],
  ["fort", "Gaming", "Fortnite", "Gaming,Esports,Mid tower,Sound card", "High frame rates, a mid tower, and a sound card for footsteps.", "r7600x3d,b650,d5-32,5060ti,990evo-1,pa120,rm750e,lancool"],
  ["cad", "Professional", "AutoCAD", "CAD,Workstation,Mid tower", "A workstation card and 64GB, for drawings rather than ray tracing.", "i7-14700k,z790,d5-64,rtx2000,990pro-2,lf360,rm850e,4000d"],
  ["3dm", "Professional", "3DMark", "Benchmark,Enthusiast,4K", "Built to post a score. Hot, loud, and expensive on purpose.", "r9800x3d,x870e,d5-32-7200,5090,9100-2,lf420,rm1200,o11xl"],
  ["wz", "Gaming", "Warzone", "Gaming,Battle royale,Mid tower,Sound card", "A big map, a lot of video memory, and a fast X3D chip.", "r9800x3d,b650,d5-32,5070ti,990pro-2,lf360,rm1000x,meshify"],
  ["pubg", "Gaming", "PUBG", "Gaming,Battle royale,Mid tower,Sound card", "Same idea as Warzone, a step easier on the wallet.", "r9600x,b650,d5-32,5070,sn850x-1,pa120,rm750e,north"],
  ["mc", "Gaming", "Minecraft", "Gaming,Mods,Mid tower", "Room for mods and shaders, without a workstation bill.", "r7700,b650,d5-32,5060,p3-2,pa120,rm750e,lancool"],
  ["rbx", "Gaming", "Roblox", "Gaming,Budget,Integrated graphics,Mid tower", "An APU in a mid tower. Roblox does not need a graphics card.", "r5600g,b550m,d4-16,,p3-500,stock,smart500,xtpro"],
  ["val", "Gaming", "Valorant", "Gaming,Esports,Budget,Mid tower", "A light game, a fast chip, and a modest card.", "r7600,b650m,d5-16,4060,p3-1,pa120,cx650,h5"],
  ["cs2", "Gaming", "Counter-Strike 2", "Gaming,Esports,Mid tower,Sound card", "Competitive frame rates, plus a sound card.", "r7800x3d,b650,d5-32,5070,990evo-1,pa120,rm750e,4000d"],
  ["cp2077", "Gaming", "Cyberpunk 2077", "Gaming,Single-player,4K,Mid tower", "A heavy single-player game at high settings.", "r9700x,x870,d5-32,5080,990pro-2,lf360,rm1000x,meshify"],
  ["lol", "Gaming", "League of Legends", "Gaming,Budget,Mid tower", "Cheap, quiet, and finished.", "r5600,b550m,d4-16,7600,p3-1,ax120,cx650,xtpro"],
  ["b-am5", "Bundle", "AM5 starter bundle", "Bundle,AM5,Gaming", "Ryzen 5, a B650 board, 32GB, and a tower cooler.", "r7600,b650,d5-32,,,pa120,,"],
  ["b-am4", "Bundle", "AM4 budget bundle", "Bundle,AM4,Budget,DDR4", "Last-generation Ryzen, DDR4, and a cheap cooler.", "r5600,b550m,d4-16,,,ax120,,"],
  ["b-off", "Bundle", "Office Intel bundle", "Bundle,Office,Integrated graphics", "Intel with graphics. Fine for class, browsing, and documents.", "i5-12400,b760m4,d4-16,,p3-1,stock,,"],
  ["b-x3d", "Bundle", "X3D esports bundle", "Bundle,Gaming,Esports", "The chip people buy for shooters, with a board, memory, and cooler.", "r7800x3d,b650,d5-32,,,pa120,,"],
  ["b-cre", "Bundle", "Creator bundle", "Bundle,Creator,Video", "More cores, 64GB, a fast drive, and a 360mm cooler.", "r9700x,x870,d5-64,,990pro-2,lf360,,"],
];

const PRE_EXTRA: Record<string, string[]> = {
  g1: ["snd-on", "nic-on", "w11h"],
  g2: ["snd-on", "nic-on", "w11h"],
  g3: ["ae5", "be200", "w11p"],
  g6: ["goxlr", "axe54", "w11p"],
  p3: ["stx2", "nic-on", "w11p"],
  p4: ["snd-on", "x540", "w11p"],
  e2: ["snd-on", "i226", "os-none"],
  e6: ["ae7", "nic-on", "w11p"],
  e9: ["snd-on", "i226", "os-none"],
  g8: ["ae5", "be200", "w11p"],
  g10: ["snd-on", "nic-on", "w11h"],
  p10: ["goxlr", "i226", "w11p"],
  p13: ["snd-on", "i226", "w11p"],
  e10: ["snd-on", "nic-on", "w11oem"],
  e12: ["snd-on", "nic-on", "w11oem"],
  c0: ["snd-on", "nic-on", "os-none"],
  x0: ["stx2", "x540", "w11p", "sl140x"],
  fort: ["ae5", "nic-on", "w11h"],
  cad: ["snd-on", "nic-on", "w11p"],
  "3dm": ["snd-on", "nic-on", "w11p"],
  wz: ["ae7", "nic-on", "w11h"],
  pubg: ["ae5", "nic-on", "w11h"],
  mc: ["snd-on", "nic-on", "w11h"],
  rbx: ["snd-on", "nic-on", "w11h"],
  val: ["snd-on", "nic-on", "w11h"],
  cs2: ["ae5", "nic-on", "w11h"],
  cp2077: ["snd-on", "nic-on", "w11h"],
  lol: ["snd-on", "nic-on", "w11h"],
};

const CORE_CATS: CatId[] = ["cpu", "mb", "ram", "gpu", "ssd", "cooler", "psu", "case"];

DB.pb = PRE.map((r) => {
  const o: Prebuilt = {
    cat: "pb",
    id: "pb-" + r[0],
    k: r[0],
    g: r[1],
    n: r[2],
    tags: r[3].split(","),
    desc: r[4],
    p: 0,
    brand: "",
    parts: [],
  };
  o.parts = r[5]
    .split(",")
    .map((k, i) => {
      if (!k) return null;
      return DB[CORE_CATS[i]].find((p) => p.k === k) ?? null;
    })
    .filter((p): p is Part => Boolean(p));
  const extras = PRE_EXTRA[r[0]] ?? [];
  for (const k of extras) {
    let found: Part | undefined;
    for (const cat of Object.keys(DB) as CatId[]) {
      found = DB[cat].find((p) => p.k === k);
      if (found) break;
    }
    if (found && found.cat !== "pb") o.parts.push(found);
  }
  if (r[0] === "e9") {
    const extraDrives = ["ih-8t", "ih-8t", "wr-12t", "bc-8t"]
      .map((k) => DB.ssd.find((p) => p.k === k))
      .filter((p): p is Part => Boolean(p));
    o.parts.push(...extraDrives);
  }
  o.p = o.parts.reduce((a, p) => a + p.p, 0);
  return o;
});

export const PM: Record<string, Part> = {};
for (const arr of Object.values(DB)) {
  for (const p of arr) PM[p.id] = p;
}

export function isNvme(p: Part) {
  return p.cat === "ssd" && /NVMe/.test(p.t);
}
export function isSataDrive(p: Part) {
  return p.cat === "ssd" && !/NVMe/.test(p.t);
}

export function byKey(cat: CatId, k: string) {
  return DB[cat].find((p) => p.k === k);
}

export function isCpu(p: Part): p is CpuPart {
  return p.cat === "cpu";
}
export function isMb(p: Part): p is MbPart {
  return p.cat === "mb";
}
export function isRam(p: Part): p is RamPart {
  return p.cat === "ram";
}
export function isHardware(p: Part): p is HardwarePart {
  return p.cat !== "pb";
}

export const FORM_RANK = RK;
export type { FormFactor };
