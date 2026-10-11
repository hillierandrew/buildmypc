import { UI_STYLES } from "./ui-styles";

export interface TourStep {
  target: string;
  title: string;
  body: string;
}

const CORE: TourStep[] = [
  {
    target: ".brand",
    title: "Welcome",
    body: "This is a full PC configurator hiding behind the offline dino. Pick a budget, tap Suggest, and we fill a compatible build.",
  },
  {
    target: "#budHdr",
    title: "Budget",
    body: "Set a ceiling. Suggest picks the strongest prebuilt that still fits.",
  },
  {
    target: "#uc",
    title: "Use case",
    body: "Gaming, streaming, CAD, AI, Plex. This filters ready-made builds and what Suggest picks.",
  },
  {
    target: "[data-action='suggest']",
    title: "Suggest",
    body: "One tap loads a complete, compatibility-checked cart.",
  },
  {
    target: "#compatPanel",
    title: "Compatibility",
    body: "Socket, DDR, case clearance, PSU wattage, M.2, SATA and DIMM occupancy all live here.",
  },
  {
    target: "#rail",
    title: "Categories",
    body: "Ready-made builds, then every component. Storage, memory, and fans can be added more than once. Sound, network, and an OS are optional.",
  },
  {
    target: "#bp",
    title: "Cart",
    body: "Slot meters show M.2, SATA, DIMM, fan mounts, and PSU headroom. Copy a quote or a link when it looks right.",
  },
];

const PER_STYLE: Record<number, TourStep[]> = {
  2: [
    {
      target: ".elogo",
      title: "Stealth desk",
      body: "Looks like a sales-order ERP. Same catalog, different clothes — useful if someone glances at your screen.",
    },
    {
      target: ".esb",
      title: "Module rail",
      body: "The yellow row is the active parts list. Green dots already have lines on the order.",
    },
    {
      target: ".egrid",
      title: "Picking grid",
      body: "Click a row to add it. Status ERR means it fights something already on the order.",
    },
    {
      target: "#eord",
      title: "Order lines",
      body: "Quantities for drives, memory, and fans. Generate PO copies a quote. Same engine as the builder.",
    },
  ],
  67: [
    {
      target: ".picker-brand",
      title: "Parts list",
      body: "Password67 is a white-and-orange slot list. One row per component, price on the right. It is BuildMyPC, not another website.",
    },
    {
      target: ".picker-table-wrap",
      title: "The build",
      body: "Choose a slot. Selected parts, quantities, and a remove button stay in this table. It scrolls if the list is taller than the screen.",
    },
    {
      target: ".picker-products",
      title: "The catalog",
      body: "Every matching part is a row. Add is a real button. The table scrolls on its own, with a sticky header.",
    },
    {
      target: "#globeBtn",
      title: "Globe",
      body: "Bottom left on every screen. Each click loads the next password skin.",
    },
  ],
};

const END: TourStep[] = [
  {
    target: "#keysBtn",
    title: "Keyring",
    body: "Every password, what that skin does, and the cover words (google, amazon, netflix, github, kijiji, ebay, bing). Anything else is refused.",
  },
  {
    target: "#pcBtn",
    title: "Skins",
    body: "The globe in the bottom-left corner steps through every look, including Password67's parts list. Capital Password1–15 are the original skins. Lowercase password1–10 are the wild layouts.",
  },
  {
    target: "#musicCtl",
    title: "Room tone",
    body: "A generated drone, not a stream. Play, mute, and volume stay in this browser.",
  },
];

function styleTour(id: number): TourStep[] {
  const s = UI_STYLES.find((x) => x.id === id);
  if (!s) return CORE;
  if (PER_STYLE[id]) return PER_STYLE[id];
  return [
    {
      target: ".brand",
      title: s.title,
      body: `${s.desc} ${s.hint}`,
    },
    ...CORE.slice(1),
  ];
}

export function tourFor(id: number): TourStep[] {
  return [...styleTour(id), ...END];
}
