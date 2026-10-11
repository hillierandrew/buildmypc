import { useEffect, useMemo, useState } from "react";
import {
  Compass,
  Cpu,
  Gauge,
  Moon,
  Plus,
  Save,
  ShoppingBag,
  Smartphone,
  Sparkles,
  Trash2,
  Trophy,
} from "lucide-react";
import { CATS, DB, MULTI, REQUIRED, SLOTS, specOf } from "@/lib/catalog";
import { issueAgainstBuild } from "@/lib/compat";
import { money, storageLabel, TAX } from "@/lib/format";
import { currentSummary, LAYOUT_CHOICES, listParts, quoteText, useBuilder, type Filters } from "@/lib/store";
import { styleById } from "@/lib/ui-styles";
import type { CatId, Part } from "@/lib/types";
import { CatIcon } from "@/components/icons";
import { DeviceSilhouette, PartSilhouette } from "@/components/silhouette";

const GROUPS = ["Gaming", "Professional", "Everyday"];
const SHORT: Record<string, string> = {
  pb: "Builds",
  cpu: "CPU",
  mb: "Board",
  ram: "Memory",
  gpu: "GPU",
  ssd: "Storage",
  cooler: "Cooler",
  psu: "Power",
  case: "Case",
  fan: "Fans",
  sound: "Sound",
  nic: "Wi-Fi",
  os: "OS",
};

function resetFilters() {
  const b = useBuilder.getState();
  b.setQuery("");
  b.setTag("");
  b.setFilter("use", "");
  b.setFilter("plat", "");
  b.setFilter("sock", "");
  b.setFilter("ramSize", "");
  b.setFilter("ramType", "");
  b.setFilter("storType", "");
  b.setFilter("pMin", "");
  b.setFilter("pMax", "");
  b.setFilter("compatOnly", false);
  b.setFilter("sort", "price-asc");
}

function Qty({ id, n }: { id: string; n: number }) {
  const add = useBuilder((s) => s.add);
  const dec = useBuilder((s) => s.dec);
  return (
    <span className="qtyc">
      <button type="button" aria-label="Decrease quantity" onClick={() => dec(id)}>
        −
      </button>
      <span>{n}</span>
      <button type="button" aria-label="Increase quantity" onClick={() => add(id)}>
        +
      </button>
    </span>
  );
}

function Pips({ used, max, label, hot }: { used: number; max: number; label: string; hot: boolean }) {
  return (
    <span className="pips" title={`${hot ? used + " of " : ""}${max} ${label}`}>
      {Array.from({ length: Math.min(max, 8) }, (_, i) => (
        <i key={i} className={hot && i < used ? "on" : ""} />
      ))}
      <em>
        {hot ? `${used}/${max}` : max} {label}
      </em>
    </span>
  );
}

function Meter({
  label,
  used,
  max,
  unit,
}: {
  label: string;
  used: number;
  max?: number;
  unit?: string;
}) {
  const known = typeof max === "number";
  const over = known && used > (max ?? 0);
  const pct = known && max! > 0 ? Math.min(100, (used / max!) * 100) : used > 0 ? 100 : 0;
  const u = unit ?? "";
  return (
    <div className={`meter ${over ? "over" : ""}`}>
      <span>{label}</span>
      <i>
        <u style={{ width: `${pct}%` }} />
      </i>
      <b>
        {known ? `${used}${u}/${max}${u}` : `${used}${u}`}
      </b>
    </div>
  );
}

function verdict(gaming: number, ai: number, creator: number, empty: boolean, blocked: boolean) {
  if (empty) return "Pick a ready-made build or start with a processor.";
  if (blocked) return "Resolve the red issues before you buy.";
  if (gaming >= 7) return "Strong gaming rig.";
  if (ai >= 7) return "Enough VRAM to try local models.";
  if (creator >= 3.5) return "Comfortable for creation and compiles.";
  return "Balanced everyday machine.";
}

export function BuilderView() {
  const s = useBuilder();
  const summary = currentSummary(s.cart);
  const parts = useMemo(
    () => listParts(s, s.tab, s.query, s.tag),
    [s],
  );
  const tags = useMemo(() => {
    const set = new Set<string>();
    for (const p of DB[s.tab]) for (const t of p.tags) set.add(t);
    return [...set];
  }, [s.tab]);

  const errs = summary.issues.filter((i) => i.level === "err");
  const warns = summary.issues.filter((i) => i.level === "warn");
  const bad = errs.length + summary.required.length;
  const tone = !summary.lines.length ? "ok" : bad ? "bad" : warns.length ? "warn" : "ok";
  const label = !summary.lines.length
    ? "Ready to build"
    : bad
      ? `${bad} issue${bad === 1 ? "" : "s"}`
      : warns.length
        ? "Compatible, with notes"
        : "All components compatible";

  useEffect(() => {
    const fx = styleById(s.currentUI).scrollFx;
    if (!fx || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const grid = document.getElementById("grid");
    if (!grid) return;
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) e.target.classList.toggle("dim", !e.isIntersecting);
      },
      { root: grid, threshold: 0.4 },
    );
    grid.querySelectorAll(".pc").forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, [s.currentUI, s.tab, s.tag, s.query, parts.length]);

  async function copyQuote() {
    try {
      await navigator.clipboard.writeText(quoteText(summary));
      s.showToast("Quote copied");
    } catch {
      s.showToast("Could not copy the quote");
    }
  }

  async function share() {
    try {
      const hash = btoa(JSON.stringify(s.cart)).replace(/=+$/, "");
      const url = `${location.origin}${location.pathname}#${hash}`;
      history.replaceState(null, "", `#${hash}`);
      await navigator.clipboard.writeText(url);
      s.showToast("Link copied");
    } catch {
      s.showToast("Could not copy the link");
    }
  }

  function shop() {
    if (!summary.lines.length) {
      s.showToast("Add parts first");
      return;
    }
    const q = summary.lines.map((l) => l.part.n.split(" ").slice(0, 4).join(" ")).join(", ");
    window.open(`https://www.amazon.ca/s?k=${encodeURIComponent(q)}`, "_blank", "noopener,noreferrer");
    s.showToast("Opened an Amazon.ca search");
  }

  const n = summary.lines.reduce((a, l) => a + l.qty, 0);
  const filtered =
    Boolean(s.query || s.tag || s.filters.use || s.filters.compatOnly) ||
    s.filters.sort !== "price-asc" ||
    (!s.basicMode &&
      Boolean(
        s.filters.plat ||
          s.filters.sock ||
          s.filters.ramSize ||
          s.filters.ramType ||
          s.filters.storType ||
          s.filters.pMin ||
          s.filters.pMax,
      ));
  const [sheet, setSheet] = useState<null | "filters" | "cats" | "build" | "status" | "layout">(null);
  const [extras, setExtras] = useState(false);
  const toggle = (name: NonNullable<typeof sheet>) => setSheet((cur) => (cur === name ? null : name));

  useEffect(() => {
    const stage = document.querySelector(".stage");
    stage?.classList.toggle("show-dock", extras);
    return () => stage?.classList.remove("show-dock");
  }, [extras]);

  return (
    <div id="builder-app" className={sheet ? `sheet-${sheet}` : ""}>
      <BuildMeter lines={summary.lines} />
      <header className="bh">
        <div className="brand">
          <Cpu className="logo" aria-hidden />
          <span>
            BUILD<span className="mute">MY</span>PC
            <small>SYSTEM CONFIGURATOR</small>
          </span>
        </div>
        <input
          id="q"
          className="search"
          value={s.query}
          placeholder="Search parts, tags, brands"
          onChange={(e) => s.setQuery(e.target.value)}
          enterKeyHint="search"
          onKeyDown={(e) => {
            if (e.key === "Enter") (e.target as HTMLInputElement).blur();
          }}
        />
        <div className="right">
          <label className="budget-wrap">
            Budget
            <span>$</span>
            <input
              id="budHdr"
              type="number"
              min={0}
              value={s.budget}
              onChange={(e) => s.setBudget(Number(e.target.value) || 0)}
            />
          </label>
          <button type="button" className="icon-btn" id="tourBtn" title="Tour this skin" onClick={() => s.startTour()}>
            <Compass className="ico" aria-hidden />
            <span className="sr">Tour</span>
          </button>
          <button
            type="button"
            className="icon-btn"
            title="Cycle theme"
            onClick={() => {
              s.cycleTheme();
              s.showToast("Theme: " + useBuilder.getState().themeCycle);
            }}
          >
            <Moon className="ico" aria-hidden />
            <span className="sr">Theme</span>
          </button>
          <button
            type="button"
            className="icon-btn"
            title="Toggle compact layout"
            onClick={() => {
              s.cycleLayout();
              s.showToast(useBuilder.getState().layoutMode);
            }}
          >
            <Smartphone className="ico" aria-hidden />
            <span className="sr">Layout</span>
          </button>
        </div>
        <button
          type="button"
          className="layout-open"
          aria-expanded={sheet === "layout"}
          onClick={() => toggle("layout")}
        >
          Layout
        </button>
      </header>

      <div className="filt">
        <label className="phone-budget">
          Budget $
          <input
            type="number"
            min={0}
            inputMode="decimal"
            value={s.budget}
            onChange={(e) => s.setBudget(Number(e.target.value) || 0)}
          />
        </label>
        <label>
          For
          <select id="uc" value={s.filters.use} onChange={(e) => s.setFilter("use", e.target.value)}>
            <option value="">Any build</option>
            <option value="g">Gaming</option>
            <option value="s">Streaming</option>
            <option value="v">Video</option>
            <option value="c">CAD</option>
            <option value="a">Audio</option>
            <option value="i">AI</option>
            <option value="w">Server</option>
            <option value="p">Plex</option>
            <option value="m">Mining</option>
            <option value="o">Office</option>
          </select>
        </label>
        <label>
          Sort
          <select
            value={s.filters.sort}
            onChange={(e) => s.setFilter("sort", e.target.value as Filters["sort"])}
          >
            <option value="price-asc">Price up</option>
            <option value="price-desc">Price down</option>
            <option value="name">Name</option>
          </select>
        </label>
        <label className="adv">
          Platform
          <select value={s.filters.plat} onChange={(e) => s.setFilter("plat", e.target.value)}>
            <option value="">Any</option>
            <option value="AMD">AMD</option>
            <option value="Intel">Intel</option>
          </select>
        </label>
        <label className="adv">
          Socket
          <select value={s.filters.sock} onChange={(e) => s.setFilter("sock", e.target.value)}>
            <option value="">Any</option>
            <option value="AM4">AM4</option>
            <option value="AM5">AM5</option>
            <option value="LGA1700">LGA1700</option>
            <option value="LGA1851">LGA1851</option>
          </select>
        </label>
        <label className="adv">
          RAM
          <select value={s.filters.ramSize} onChange={(e) => s.setFilter("ramSize", e.target.value)}>
            <option value="">Any</option>
            <option value="16">16GB</option>
            <option value="32">32GB</option>
            <option value="48">48GB</option>
            <option value="64">64GB</option>
            <option value="96">96GB</option>
            <option value="128">128GB</option>
            <option value="192">192GB</option>
            <option value="256">256GB</option>
          </select>
        </label>
        <label className="adv">
          DDR
          <select value={s.filters.ramType} onChange={(e) => s.setFilter("ramType", e.target.value)}>
            <option value="">Any</option>
            <option value="4">DDR4</option>
            <option value="5">DDR5</option>
          </select>
        </label>
        <label className="adv">
          Storage
          <select value={s.filters.storType} onChange={(e) => s.setFilter("storType", e.target.value)}>
            <option value="">Any</option>
            <option value="NVMe Gen5">NVMe Gen5</option>
            <option value="NVMe Gen4">NVMe Gen4</option>
            <option value="SATA SSD">SATA SSD</option>
            <option value="HDD">HDD</option>
          </select>
        </label>
        <label className="adv price">
          Price
          <input
            type="number"
            placeholder="Min"
            value={s.filters.pMin}
            onChange={(e) => s.setFilter("pMin", e.target.value)}
          />
          <span>–</span>
          <input
            type="number"
            placeholder="Max"
            value={s.filters.pMax}
            onChange={(e) => s.setFilter("pMax", e.target.value)}
          />
        </label>
        <label className="check">
          <input
            type="checkbox"
            checked={s.filters.compatOnly}
            onChange={(e) => s.setFilter("compatOnly", e.target.checked)}
          />
          Fits this build
        </label>
        {filtered ? (
          <button type="button" className="texty" onClick={resetFilters}>
            Reset
          </button>
        ) : null}
      </div>

      <div id="compatPanel" className={`compat ${tone}`}>
        <button type="button" className="status" onClick={() => toggle("status")}>
          <span className="dot" />
          <span>{label}</span>
        </button>
        <div className="msgs">
          {!summary.lines.length ? <span className="m">Pick parts to get started.</span> : null}
          {summary.required.map((m) => (
            <span className="m warn" key={m}>
              {m}
            </span>
          ))}
          {summary.issues.map((m) => (
            <span className={`m ${m.level === "err" ? "err" : "warn"}`} key={m.msg}>
              {m.msg}
            </span>
          ))}
          {summary.mb ? (
            <span className="m">
              Board {summary.nvme}/{summary.mb.m2} M.2 · {summary.sata}/{summary.mb.sata} SATA · {summary.sticks}/
              {summary.mb.dimm} DIMM
              {summary.psu ? ` · ${summary.watts}/${summary.psu.w}W` : ` · ~${summary.watts}W`}
            </span>
          ) : null}
        </div>
      </div>

      <div className="actions">
        <button type="button" className="suggest" data-action="suggest" onClick={() => s.suggest()}>
          <Sparkles className="ico" aria-hidden /> Suggest
        </button>
        <button type="button" data-action="parts" onClick={() => s.openModal("components")}>
          <Plus className="ico" aria-hidden /> Add parts
        </button>
        <button type="button" data-action="bench" onClick={() => s.openModal("bench")}>
          <Gauge className="ico" aria-hidden /> Benchmarks
        </button>
        <button type="button" className="danger" data-action="clear" onClick={() => s.clear()}>
          <Trash2 className="ico" aria-hidden /> Clear
        </button>
        <button type="button" className="shop" data-action="shop" onClick={shop}>
          <ShoppingBag className="ico" aria-hidden /> Amazon
        </button>
        <button type="button" data-action="save" onClick={() => s.openModal("saves")}>
          <Save className="ico" aria-hidden /> Save
        </button>
        <button type="button" data-action="compare" onClick={() => s.openModal("compare")}>
          <Trophy className="ico" aria-hidden /> Compare
        </button>
        <button type="button" className="tour" data-action="tour" onClick={() => s.startTour()}>
          <Compass className="ico" aria-hidden /> Tour
        </button>
      </div>

      <div className="bm">
        <nav className="rail" id="rail" aria-label="Categories">
          {CATS.map(([id, name, icon]) => (
            <button
              type="button"
              key={id}
              className={`ri ${s.tab === id ? "on" : ""}`}
              onClick={() => s.setTab(id)}
            >
              <CatIcon name={icon} />
              <span>{name}</span>
              {countCat(s.cart, id) ? <i>{countCat(s.cart, id)}</i> : null}
            </button>
          ))}
        </nav>
        <main className="mid">
          <div className="tags" role="tablist" aria-label="Tags">
            <button type="button" className={`tg ${s.tag === "" ? "on" : ""}`} onClick={() => s.setTag("")}>
              All
            </button>
            {tags.map((t) => (
              <button type="button" key={t} className={`tg ${s.tag === t ? "on" : ""}`} onClick={() => s.setTag(t)}>
                {t}
              </button>
            ))}
          </div>
          {s.tab === "ssd" ? (
            <p className="hintline">
              Add as many as the board allows. NVMe uses an M.2 slot. SATA SSDs and HDDs each use a SATA port. Same
              model stacks with + / −.
            </p>
          ) : null}
          {s.tab === "ram" ? (
            <p className="hintline">Kits can stack until the motherboard DIMM slots are full. Stick count is checked.</p>
          ) : null}
          {s.tab === "fan" ? (
            <p className="hintline">Fans stack. Packs count as multiple mounts against the case.</p>
          ) : null}
          {s.filters.use && s.tab !== "pb" ? (
            <p className="hintline">The “For” filter applies to ready-made builds and Suggest, not this list.</p>
          ) : null}
          <div className="grid" id="grid">
            {parts.length === 0 ? (
              <div className="empty">
                <p>Nothing matches.</p>
                <button type="button" className="btn ghost" onClick={resetFilters}>
                  Reset filters
                </button>
              </div>
            ) : s.tab === "pb" ? (
              GROUPS.map((g) => {
                const rows = parts.filter((p) => p.cat === "pb" && p.g === g);
                if (!rows.length) return null;
                return (
                  <section key={g} className="group">
                    <h2 className="gh">{g}</h2>
                    {rows.map((p) => (
                      <article key={p.id} className="pc">
                        <button type="button" className="pc-hit" onClick={() => s.loadBuild(p.id)}>
                          <PartSilhouette part={p} />
                          <div className="pn">{p.n}</div>
                          <div className="ps">{p.cat === "pb" ? p.desc : ""}</div>
                          <div className="pt">
                            {p.tags.slice(0, 5).map((t, i) => (
                              <span key={`${p.id}-${i}`}>{t}</span>
                            ))}
                          </div>
                        </button>
                        <div className="pf">
                          <b>{money(p.p)}</b>
                          <button type="button" className="add" onClick={() => s.loadBuild(p.id)}>
                            Load
                          </button>
                        </div>
                      </article>
                    ))}
                  </section>
                );
              })
            ) : (
              parts.map((p) => <PartCard key={p.id} p={p} />)
            )}
          </div>
        </main>
        <aside className="bp" id="bp">
          <div className="phone-tools">
            <button type="button" onClick={() => s.openModal("bench")}>Benchmarks</button>
            <button type="button" onClick={() => s.openModal("saves")}>Save</button>
            <button type="button" onClick={() => s.openModal("compare")}>Compare</button>
            <button type="button" onClick={shop}>Amazon</button>
            <button type="button" onClick={() => s.startTour()}>Tour</button>
            <button type="button" onClick={() => s.clear()}>Clear</button>
            <button type="button" onClick={() => setExtras((v) => !v)}>
              {extras ? "Hide extras" : "Sound and skins"}
            </button>
          </div>
          <div className="tot">
            <h2>Your build</h2>
            <span className="st">
              {n} item{n === 1 ? "" : "s"}
            </span>
          </div>
          <DeviceSilhouette
            filled={{
              case: summary.lines.some((l) => l.part.cat === "case"),
              mb: summary.lines.some((l) => l.part.cat === "mb"),
              cpu: summary.lines.some((l) => l.part.cat === "cpu"),
              ram: summary.lines.some((l) => l.part.cat === "ram"),
              cooler: summary.lines.some((l) => l.part.cat === "cooler"),
              gpu: summary.lines.some((l) => l.part.cat === "gpu"),
              ssd: summary.lines.some((l) => l.part.cat === "ssd"),
              psu: summary.lines.some((l) => l.part.cat === "psu"),
              fan: summary.lines.some((l) => l.part.cat === "fan"),
            }}
          />
          <p className="verdict">{verdict(summary.scores.gaming, summary.scores.ai, summary.scores.creator, !summary.lines.length, bad > 0)}</p>
          <div className={`cp ${bad ? "" : "ok"}`}>
            {bad ? (
              <>
                <b>Compatibility</b>
                {summary.required.concat(errs.map((e) => e.msg)).map((m) => (
                  <span key={m}>{m}</span>
                ))}
              </>
            ) : (
              "All selected parts agree."
            )}
          </div>
          <div className="meters">
            <Meter label="M.2" used={summary.nvme} max={summary.mb?.m2} />
            <Meter label="SATA" used={summary.sata} max={summary.mb?.sata} />
            <Meter label="DIMM" used={summary.sticks} max={summary.mb?.dimm} />
            <Meter label="Fans" used={summary.fans} max={summary.case?.fx} />
            <Meter label="Load" used={summary.watts} max={summary.psu?.w} unit="W" />
          </div>
          {SLOTS.map(([id, name, icon]) => {
            const lines = summary.lines.filter((l) => l.part.cat === id);
            if (!lines.length) {
              return (
                <button type="button" key={id} className="sl e" onClick={() => s.setTab(id)}>
                  <CatIcon name={icon} />
                  <span className="body">
                    <small>{name}</small>
                    Select {name.toLowerCase()}
                  </span>
                </button>
              );
            }
            return lines.map((l) => (
              <div className="sl" key={l.part.id}>
                <CatIcon name={icon} />
                <span className="body">
                  <small>{name}</small>
                  {l.part.n}
                </span>
                {MULTI[id] ? <Qty id={l.part.id} n={l.qty} /> : null}
                <b>{money(l.part.p * l.qty)}</b>
                <button type="button" className="rm" aria-label={`Remove ${l.part.n}`} onClick={() => s.del(l.part.id)}>
                  ×
                </button>
              </div>
            ));
          })}
          <div className="kp">
            <div>
              <b>
                {summary.c}C / {summary.t}T
              </b>
              Cores
            </div>
            <div>
              <b>{summary.v}GB</b>
              VRAM
            </div>
            <div>
              <b>{summary.r}GB</b>
              Memory
            </div>
            <div>
              <b>{storageLabel(summary.st)}</b>
              Storage
            </div>
            <div>
              <b>
                {summary.nvme} / {summary.sata}
              </b>
              NVMe / SATA
            </div>
            <div>
              <b>{summary.psu ? `${summary.psu.w}W` : "—"}</b>
              PSU
            </div>
          </div>
          {(
            [
              ["Gaming", summary.scores.gaming],
              ["AI / LLM", summary.scores.ai],
              ["Creator", summary.scores.creator],
            ] as const
          ).map(([name, v]) => (
            <div className="bar" key={name}>
              <span className="lbl">{name}</span>
              <i>
                <u style={{ width: `${Math.min(100, v * 10)}%` }} />
              </i>
              <span className="val">{v.toFixed(1)}</span>
            </div>
          ))}
          <div className="totals">
            <div className="tot">
              <span>Subtotal</span>
              <span>{money(summary.tot)}</span>
            </div>
            <div className="tot">
              <span>HST 13% (ON)</span>
              <span>{money(summary.tot * TAX)}</span>
            </div>
            <div className="tot grand">
              <span>Total</span>
              <b>{money(summary.tot * (1 + TAX))}</b>
            </div>
            <p className="fine">Estimate only. Prices are catalog samples, not live store data.</p>
          </div>
          <button type="button" className="btn primary" onClick={copyQuote}>
            Copy quote
          </button>
          <button type="button" className="btn ghost" onClick={share}>
            Copy link
          </button>
        </aside>
      </div>
      {sheet ? (
        <button type="button" className="sheet-backdrop" aria-label="Close panel" onClick={() => setSheet(null)} />
      ) : null}
      {sheet === "cats" ? (
        <div className="phone-sheet" role="dialog" aria-label="Categories">
          {CATS.map(([id, name, icon]) => (
            <button
              type="button"
              key={id}
              className={s.tab === id ? "on" : ""}
              onClick={() => {
                s.setTab(id);
                setSheet(null);
              }}
            >
              <CatIcon name={icon} />
              <span>{name}</span>
            </button>
          ))}
        </div>
      ) : null}
      {sheet === "layout" ? (
        <div className="layout-list" role="dialog" aria-label="Layout">
          {(LAYOUT_CHOICES).map(({ id, label, blurb }) => (
            <button
              key={id}
              type="button"
              className={s.layoutMode === id ? "on" : ""}
              onClick={() => {
                s.setLayout(id);
                s.showToast(label);
                setSheet(null);
              }}
            >
              <b>{label}</b>
              <span>{blurb}</span>
            </button>
          ))}
          <button
            type="button"
            onClick={() => {
              s.cycleUI();
              const next = styleById(useBuilder.getState().currentUI);
              s.showToast(`${next.title} · ${next.password}`);
              setSheet(null);
            }}
          >
            <b>Next look</b>
            <span>Change the colors without a floating button.</span>
          </button>
        </div>
      ) : null}
      <nav className="thumb" aria-label="Phone controls">
        <button
          type="button"
          className={`layout-go ${sheet === "layout" ? "on" : ""}`}
          aria-expanded={sheet === "layout"}
          onClick={() => toggle("layout")}
        >
          Layout
          <small>{LAYOUT_CHOICES.find((item) => item.id === s.layoutMode)?.label ?? "Phone"}</small>
        </button>
        <button type="button" className={sheet === "filters" ? "on" : ""} onClick={() => toggle("filters")}>
          Filters
        </button>
        <button type="button" className={sheet === "cats" ? "on" : ""} onClick={() => toggle("cats")}>
          {SHORT[s.tab] ?? "Parts"}
        </button>
        <button type="button" onClick={() => s.suggest()}>
          Suggest
        </button>
        <button type="button" className={`cart-go ${sheet === "build" ? "on" : ""}`} onClick={() => toggle("build")}>
          {s.layoutMode === "phone2" ? (
            <>
              <b>Cart</b>
              <small>{n ? money(summary.tot) : "Empty"}</small>
            </>
          ) : s.layoutMode === "phone3" ? (
            <>
              <b>Cart</b>
              <small>{n ? money(summary.tot) : "Empty"}</small>
            </>
          ) : (
            <>
              <b>Build</b>
              <small>{n ? money(summary.tot) : "Empty"}</small>
            </>
          )}
        </button>
      </nav>
    </div>
  );
}

function BuildMeter({ lines }: { lines: { part: { cat: string } }[] }) {
  const done = REQUIRED.filter(([id]) => lines.some((line) => line.part.cat === id)).length;
  const pct = Math.round((done / REQUIRED.length) * 100);
  return (
    <aside className="meter-rail" aria-label={`Build ${pct} percent complete`}>
      <b>{pct}%</b>
      <div className="meter-track" aria-hidden>
        <i style={{ width: `${pct}%` }} />
      </div>
      <ol>
        {REQUIRED.map(([id, name]) => {
          const on = lines.some((line) => line.part.cat === id);
          return (
            <li key={id} className={on ? "on" : ""}>
              {on ? "In" : "Need"} {name.replace(/^A |^At least one /, "").toLowerCase()}
            </li>
          );
        })}
      </ol>
    </aside>
  );
}

function countCat(cart: Record<string, number>, id: CatId) {
  if (id === "pb") return 0;
  let n = 0;
  for (const [k, qty] of Object.entries(cart)) {
    const p = DB[id].find((x) => x.id === k);
    if (p) n += qty;
  }
  return n;
}

function PartCard({ p }: { p: Part }) {
  const s = useBuilder();
  const summary = currentSummary(s.cart);
  const qty = s.cart[p.id] || 0;
  const block = p.cat !== "pb" && !qty ? issueAgainstBuild(p, summary.lines) : "";
  const multi = p.cat !== "pb" && MULTI[p.cat];
  return (
    <article className={`pc ${qty ? "sel" : ""} ${block ? "dis" : ""}`}>
      <button type="button" className="pc-hit" disabled={!!block} onClick={() => { if (!block) s.pick(p.id); }}>
        <PartSilhouette part={p} />
        <div className="pn">{p.n}</div>
        <div className="ps">{specOf(p)}</div>
        {p.cat === "mb" ? (
          <div className="piprow">
            <Pips used={summary.nvme} max={p.m2} label="M.2" hot={summary.mb?.id === p.id} />
            <Pips used={summary.sata} max={p.sata} label="SATA" hot={summary.mb?.id === p.id} />
            <Pips used={summary.sticks} max={p.dimm} label="DIMM" hot={summary.mb?.id === p.id} />
          </div>
        ) : null}
        {p.cat === "ssd" ? (
          <div className="slot-tag">{/NVMe/.test(p.t) ? "Uses 1 M.2 slot" : "Uses 1 SATA port"}</div>
        ) : null}
        <div className="pt">
          {p.tags.slice(0, 5).map((t, i) => (
            <span key={`${p.id}-${i}`}>{t}</span>
          ))}
        </div>
        {block ? <div className="pr">{block}</div> : null}
      </button>
      <div className="pf">
        <b>{money(p.p)}</b>
        {qty && multi ? (
          <Qty id={p.id} n={qty} />
        ) : (
          <button type="button" className={qty ? "in" : "add"} disabled={!!block} onClick={() => { if (!block) s.pick(p.id); }}>
            {qty ? "In build" : block ? "Won't fit" : "Add"}
          </button>
        )}
      </div>
    </article>
  );
}
