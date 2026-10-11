import { useState } from "react";
import { CATS } from "@/lib/catalog";
import { LAYOUT_CHOICES, useBuilder } from "@/lib/store";
import type { CatId } from "@/lib/types";

const JOBS: { name: string; build: string; why: string; tier: string }[] = [
  { name: "School and study", build: "e10", why: "A lab machine. Integrated graphics, small budget, nothing extra.", tier: "Value" },
  { name: "Office", build: "e1", why: "Documents and calls. A discrete GPU would be wasted money.", tier: "Value" },
  { name: "Gaming", build: "g2", why: "1440p is the balanced spot. The graphics card does more than the CPU.", tier: "Balanced" },
  { name: "Gaming and streaming", build: "g6", why: "Extra cores so the encode does not steal the game.", tier: "Performance" },
  { name: "Software development", build: "p6", why: "Cores, quiet cooling, and RAM for containers. No gaming GPU required.", tier: "Performance" },
  { name: "AI and local models", build: "p4", why: "VRAM and system RAM are the limit, not the case lights.", tier: "Enthusiast" },
  { name: "Cybersecurity", build: "p8", why: "Quiet, lots of cores, enough RAM for lab virtual machines.", tier: "Performance" },
  { name: "CAD and architecture", build: "p1", why: "Fast cores and a workstation card. Games cards are the wrong tool.", tier: "High performance" },
  { name: "3D and VFX", build: "p5", why: "The render cares about VRAM. This is the heavy catalog build.", tier: "Enthusiast" },
  { name: "Video and film", build: "p2", why: "Cores, 64GB, and a GPU that can scrub a timeline.", tier: "High performance" },
  { name: "Photography", build: "p11", why: "Quiet, enough storage for a catalog, and a mid GPU for exports.", tier: "Balanced" },
  { name: "Audio and music", build: "p3", why: "Quiet air cooling and a sound card. A big GPU just makes heat.", tier: "Balanced" },
  { name: "Home server or NAS", build: "e9", why: "Boot drive plus room for the big disks. Not a gaming PC.", tier: "Balanced" },
  { name: "School programs", build: "e10", why: "A classroom machine. Integrated graphics, small disk, nothing a lab cannot replace.", tier: "Value" },
  { name: "Networking", build: "p7", why: "Cores and RAM for labs, virtual machines, and a lot of browser tabs.", tier: "Performance" },
  { name: "Engineering", build: "p1", why: "Fast cores and a workstation card. A game card is the wrong tool for CAD.", tier: "High performance" },
  { name: "Music producer", build: "p3", why: "Quiet cooling and a sound card. A huge GPU only adds fan noise.", tier: "Balanced" },
  { name: "Radio broadcasting", build: "p10", why: "Capture, switch, and encode a live show without dropping the stream.", tier: "High performance" },
  { name: "Film finishing", build: "p14", why: "High VRAM so a grade and a timeline can stay open together.", tier: "Enthusiast" },
  { name: "Scientific computing", build: "p12", why: "Long jobs, datasets, and compiles. Not a living-room PC.", tier: "Performance" },
  { name: "Sim racing", build: "g8", why: "Fast cores and a wide card for a triple screen or a headset.", tier: "Enthusiast" },
  { name: "Point of sale", build: "e11", why: "A counter PC. Integrated graphics, small drive, easy to replace.", tier: "Value" },
];

export function Workshop() {
  const setSurface = useBuilder((s) => s.setSurface);
  const setTab = useBuilder((s) => s.setTab);
  const loadBuild = useBuilder((s) => s.loadBuild);
  const showToast = useBuilder((s) => s.showToast);
  const setLayout = useBuilder((s) => s.setLayout);
  const [picked, setPicked] = useState<(typeof JOBS)[number] | null>(null);

  function openBuilder(tab?: CatId) {
    if (tab) setTab(tab);
    setSurface("build");
  }

  function useJob(job: (typeof JOBS)[number]) {
    loadBuild(job.build);
    showToast(job.name);
    setPicked(job);
  }

  return (
    <div className="hub">
      <header className="hub-top">
        <div>
          <p className="hub-kicker">DREW.WTF</p>
          <h1>A workshop, not a brochure.</h1>
          <p>The useful part is the PC builder. Everything else on this page is a way into that.</p>
        </div>
        <button type="button" className="btn primary" onClick={() => openBuilder()}>
          Open the builder
        </button>
      </header>
      <section>
        <h2>What PC do I need?</h2>
        <p>Pick the job. You get a catalog build you can change, not a made-up spec sheet.</p>
        <div className="hub-jobs">
          {JOBS.map((job) => (
            <button key={job.name} type="button" className={picked?.name === job.name ? "on" : ""} onClick={() => useJob(job)}>
              <b>{job.name}</b>
              <span>{job.tier}</span>
            </button>
          ))}
        </div>
        {picked ? (
          <div className="hub-why">
            <p>
              <b>{picked.tier}.</b> {picked.why}
            </p>
            <button type="button" className="btn primary" onClick={() => openBuilder("pb")}>
              Change this build
            </button>
          </div>
        ) : null}
      </section>
      <section>
        <h2>Open it on a device</h2>
        <p>Same parts. The screen changes. Colors stay with that device.</p>
        <div className="hub-jobs">
          {LAYOUT_CHOICES.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => {
                setLayout(item.id);
                openBuilder();
              }}
            >
              <b>{item.label}</b>
              <span>{item.blurb}</span>
            </button>
          ))}
        </div>
      </section>
      <section>
        <h2>School programs</h2>
        <p>Three tracks. Each one loads a catalog build the class can change.</p>
        <div className="hub-jobs">
          {(
            [
              ["Networking engineering", "p7", "Labs, virtual machines, and more than one network port."],
              ["Music production", "p3", "Quiet cooling and a sound card. No extra fan noise."],
              ["ERP and databases", "p6", "Cores and RAM for a database class, not a gaming GPU."],
            ] as const
          ).map(([name, id, why]) => (
            <button
              key={name}
              type="button"
              onClick={() => {
                loadBuild(id);
                showToast(name);
                openBuilder();
              }}
            >
              <b>{name}</b>
              <span>{why}</span>
            </button>
          ))}
        </div>
      </section>
      <section>
        <h2>Hardware</h2>
        <div className="hub-jobs">
          {CATS.filter(([id]) => id !== "pb").map(([id, name]) => (
            <button key={id} type="button" onClick={() => openBuilder(id)}>
              <b>{name}</b>
            </button>
          ))}
        </div>
      </section>
    </div>
  );
}
