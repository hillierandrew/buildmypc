export interface DisguiseResult {
  t: string;
  u: string;
  d: string;
}

export interface Disguise {
  title: string;
  logo: string;
  placeholder: string;
  results: DisguiseResult[];
}

export const DISGUISES: Record<string, Disguise> = {
  google: {
    title: "Google",
    logo: "Google",
    placeholder: "Search Google or type a URL",
    results: [
      {
        t: "BuildMyPC - AI PC Builder",
        u: "buildmypc.dev",
        d: "Build a custom PC with live compatibility checks and one-tap shopping.",
      },
      {
        t: "PC Part Picker - Best PC Builder",
        u: "pcpartpicker.com",
        d: "Build your dream PC with real-time price tracking from dozens of retailers.",
      },
      {
        t: "Tom's Hardware - Best PC Builds 2026",
        u: "tomshardware.com",
        d: "Expert-curated builds for every budget, from office PCs to enthusiast rigs.",
      },
    ],
  },
  amazon: {
    title: "Amazon.ca",
    logo: "amazon",
    placeholder: "Search Amazon.ca",
    results: [
      {
        t: "AMD Ryzen 7 9800X3D",
        u: "amazon.ca/dp/B0DKFXBLC1",
        d: "In Stock. Free delivery on orders over $35.",
      },
      {
        t: "Corsair Vengeance 32GB DDR5-6000",
        u: "amazon.ca/dp/B0C4Z9LDGH",
        d: "Compatible with AMD AM5 and Intel LGA1851 platforms.",
      },
      {
        t: "NVIDIA GeForce RTX 5080 16GB",
        u: "amazon.ca/dp/B0DGHYNF1L",
        d: "Usually ships within 3–5 days.",
      },
    ],
  },
  netflix: {
    title: "Netflix",
    logo: "NETFLIX",
    placeholder: "Search shows, movies, genres",
    results: [
      {
        t: "The Computer Chronicles (1983–2002)",
        u: "netflix.com/title/80201045",
        d: "A classic series covering the evolution of personal computing.",
      },
      {
        t: "Halt and Catch Fire",
        u: "netflix.com/title/70258993",
        d: "Drama about the personal computer boom of the 1980s.",
      },
      {
        t: "Silicon Valley",
        u: "netflix.com/title/80019312",
        d: "Comedy series about the cutthroat world of tech startups.",
      },
    ],
  },
  github: {
    title: "GitHub",
    logo: "GitHub",
    placeholder: "Search or jump to...",
    results: [
      {
        t: "torvalds/linux",
        u: "github.com/torvalds/linux",
        d: "Linux kernel source tree.",
      },
      {
        t: "microsoft/vscode",
        u: "github.com/microsoft/vscode",
        d: "Visual Studio Code.",
      },
      {
        t: "facebook/react",
        u: "github.com/facebook/react",
        d: "The library for web and native user interfaces.",
      },
    ],
  },
  kijiji: {
    title: "Kijiji",
    logo: "kijiji",
    placeholder: "Search kijiji.ca",
    results: [
      {
        t: "Gaming PC - Ryzen 7 9800X3D + RTX 5080",
        u: "kijiji.ca/v-desktop-computers/toronto",
        d: "Barely used, still under warranty.",
      },
      {
        t: "Dell Optiplex 7050",
        u: "kijiji.ca/v-desktop-computers/mississauga",
        d: "i5-7500, 8GB RAM, 256GB SSD. Office starter PC.",
      },
    ],
  },
  ebay: {
    title: "eBay",
    logo: "eBay",
    placeholder: "Search for anything",
    results: [
      {
        t: "AMD Ryzen 9 9950X3D - Brand New",
        u: "ebay.ca/itm/385829xxx",
        d: "Free shipping. 99.2% positive feedback.",
      },
      {
        t: "NVIDIA RTX 3090 Founders Edition - Used",
        u: "ebay.ca/itm/175598xxx",
        d: "Good condition, mining-free.",
      },
    ],
  },
  bing: {
    title: "Bing",
    logo: "Bing",
    placeholder: "Search the web",
    results: [
      {
        t: "Build a PC - parts and compatibility",
        u: "bing.com/search?q=pc+builder",
        d: "Guides, parts lists, and wattage calculators.",
      },
    ],
  },
};

export const DISGUISE_KEYS = Object.keys(DISGUISES);
