import { useEffect, useMemo, useRef, useState } from "react";
import { DB, MULTI, isHardware, specOf } from "@/lib/catalog";
import { issueAgainstBuild } from "@/lib/compat";
import { materialize } from "@/lib/builds";
import { money } from "@/lib/format";
import { useBuilder } from "@/lib/store";
import type { CatId, Line, Part, Prebuilt } from "@/lib/types";
import { verdicts, type FitStatus, type Verdict } from "@/lib/verdict";
import "./bench.css";

const CATS: { id: CatId; name: string; required?: boolean }[] = [
  { id: "cpu", name: "Processor", required: true },
  { id: "cooler", name: "CPU cooler", required: true },
  { id: "mb", name: "Motherboard", required: true },
  { id: "ram", name: "Memory", required: true },
  { id: "ssd", name: "Storage", required: true },
  { id: "gpu", name: "Graphics card" },
  { id: "case", name: "Case", required: true },
  { id: "psu", name: "Power supply", required: true },
  { id: "os", name: "Operating system" },
  { id: "fan", name: "Case fans" },
  { id: "sound", name: "Sound card" },
  { id: "nic", name: "Network" },
];

const BUDGETS = [1000, 1500, 2000, 2500, 3000, 5000];

function cad(n: number) {
  return `${money(n)} CAD`;
}

function headline(list: Verdict[]) {
  if (!list.length) return { word: "Nothing picked yet", cls: "" };
  if (list.some((row) => row.status === "incompatible")) return { word: "Does not fit", cls: "incompatible" };
  if (list.some((row) => row.status === "unknown")) return { word: "Missing a measurement", cls: "unknown" };
  if (list.some((row) => row.status === "conditional")) return { word: "Check before you buy", cls: "conditional" };
  return { word: "Fits on the data we have", cls: "compatible" };
}

function readyPool(use: string) {
  const keys =
    use === "game"
      ? ["rbx", "mc", "fort", "cs2", "wz", "cp1080", "cp2077"]
      : use === "create"
        ? ["u2000", "sky2", "u3000", "cad", "u5000", "3dm"]
        : ["c0", "u1000", "u1500", "u2000", "u2500", "u3000"];
  return keys
    .map((key) => DB.pb.find((part) => part.cat === "pb" && part.k === key))
    .filter((part): part is Prebuilt => Boolean(part));
}

export function Bench() {
  const cart = useBuilder((s) => s.cart);
  const add = useBuilder((s) => s.add);
  const del = useBuilder((s) => s.del);
  const loadCart = useBuilder((s) => s.loadCart);
  const clear = useBuilder((s) => s.clear);
  const saves = useBuilder((s) => s.saves);
  const saveCurrent = useBuilder((s) => s.saveCurrent);
  const deleteSave = useBuilder((s) => s.deleteSave);
  const showToast = useBuilder((s) => s.showToast);

  const [theme, setTheme] = useState<"dark" | "light">("dark");
  const [name, setName] = useState("My list");
  const [cat, setCat] = useState<CatId | null>(null);
  const [q, setQ] = useState("");
  const [sort, setSort] = useState<"price-asc" | "price-desc" | "name">("price-asc");
  const [onlyFit, setOnlyFit] = useState(true);
  const [advanced, setAdvanced] = useState(false);
  const [maxPrice, setMaxPrice] = useState("");
  const [socket, setSocket] = useState("");
  const [form, setForm] = useState("");
  const [ddr, setDdr] = useState("");
  const [drive, setDrive] = useState("");
  const [openId, setOpenId] = useState<string | null>(null);
  const [compare, setCompare] = useState<string[]>([]);
  const [report, setReport] = useState(false);
  const [guide, setGuide] = useState(false);
  const [use, setUse] = useState("game");
  const [budget, setBudget] = useState(1500);
  const [showSaves, setShowSaves] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [history, setHistory] = useState<Record<string, number>[]>([]);
  const audio = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    const stored = localStorage.getItem("bmpc-shelf-theme");
    if (stored === "light" || stored === "dark") setTheme(stored);
  }, []);

  const lines = useMemo(() => {
    const out: Line[] = [];
    for (const [id, qty] of Object.entries(cart)) {
      const part = Object.values(DB).flat().find((item) => item.id === id);
      if (!part || !isHardware(part) || qty < 1) continue;
      out.push({ part, qty });
    }
    return out;
  }, [cart]);

  const checks = useMemo(() => verdicts(cart), [cart]);
  const status = headline(checks);
  const total = lines.reduce((sum, line) => sum + line.part.p * line.qty, 0);
  const chosen = lines.length;

  function remember() {
    setHistory((prev) => [...prev, { ...useBuilder.getState().cart }].slice(-12));
  }

  function undo() {
    setHistory((prev) => {
      const last = prev[prev.length - 1];
      if (!last) return prev;
      loadCart(last);
      return prev.slice(0, -1);
    });
  }

  function openCat(next: CatId) {
    setCat(next);
    setQ("");
    setSocket("");
    setForm("");
    setDdr("");
    setDrive("");
    setOpenId(null);
  }

  const pool = cat ? (DB[cat] ?? []) : [];
  const shown = useMemo(() => {
    const query = q.trim().toLowerCase();
    const cap = Number(maxPrice);
    let list = pool.filter((part) => {
      if (!isHardware(part)) return false;
      if (advanced && maxPrice && !Number.isNaN(cap) && part.p > cap) return false;
      if (advanced && socket && "sock" in part && part.sock !== socket) return false;
      if (advanced && form && "form" in part && part.form !== form) return false;
      if (advanced && ddr && part.cat === "ram" && part.d !== ddr) return false;
      if (advanced && drive && part.cat === "ssd") {
        const nvme = /NVMe/.test(part.t);
        if (drive === "nvme" && !nvme) return false;
        if (drive === "sata" && nvme) return false;
      }
      if (!query) return true;
      return `${part.n} ${part.brand} ${specOf(part)}`.toLowerCase().includes(query);
    });
    if (onlyFit) list = list.filter((part) => isHardware(part) && !issueAgainstBuild(part, lines));
    list = [...list].sort((a, b) => {
      if (sort === "name") return a.n.localeCompare(b.n);
      if (sort === "price-desc") return b.p - a.p;
      return a.p - b.p;
    });
    return list;
  }, [pool, q, sort, onlyFit, advanced, maxPrice, socket, form, ddr, drive, lines]);

  const sockets = useMemo(
    () => [...new Set(pool.map((part) => ("sock" in part ? part.sock : "")).filter(Boolean))].sort(),
    [pool],
  );
  const forms = useMemo(
    () => [...new Set(pool.map((part) => ("form" in part ? part.form : "")).filter(Boolean))].sort(),
    [pool],
  );

  const ideas = useMemo(() => {
    const found = readyPool(use);
    const under = found.filter((part) => part.p <= budget).sort((a, b) => a.p - b.p);
    const ranked = under.length ? under : [...found].sort((a, b) => a.p - b.p).slice(0, 1);
    const picked = ranked.length <= 3 ? ranked : [ranked[0], ranked[Math.floor(ranked.length / 2)], ranked[ranked.length - 1]];
    return { over: !under.length, items: picked };
  }, [use, budget]);

  function share() {
    const url = `${location.origin}${location.pathname}#${btoa(JSON.stringify(cart))}`;
    navigator.clipboard.writeText(url).then(
      () => showToast("Link copied. The parts come back after you open Shelf again."),
      () => showToast("Could not copy the link."),
    );
  }

  function play() {
    const el = audio.current;
    if (!el) return;
    if (el.paused) {
      el.play().then(
        () => setPlaying(true),
        () => showToast("Can't play the music."),
      );
    } else {
      el.pause();
      setPlaying(false);
    }
  }

  function useReady(item: Prebuilt) {
    remember();
    loadCart(materialize(item.parts));
    setName(item.n);
    setGuide(false);
    setReport(true);
  }

  const compared = compare
    .map((id) => Object.values(DB).flat().find((part) => part.id === id))
    .filter((part): part is Part => Boolean(part));
  const active = CATS.find((item) => item.id === cat);

  return (
    <div className={`bench ${theme}`}>
      <audio ref={audio} src="dreams.mp3" preload="none" loop onPause={() => setPlaying(false)} />
      <header className="bench-top">
        <div>
          <p className="mark">Shelf</p>
          <h1>Build a computer from the shelf list</h1>
        </div>
        <div className="top-actions">
          <button type="button" onClick={play}>
            {playing ? "Pause" : "Play"}
          </button>
          <button
            type="button"
            onClick={() => {
              const next = theme === "dark" ? "light" : "dark";
              setTheme(next);
              localStorage.setItem("bmpc-shelf-theme", next);
            }}
          >
            {theme === "dark" ? "Light" : "Dark"}
          </button>
        </div>
      </header>
      <p className="fine">
        Canada Computers shelf prices, in Canadian dollars. Not checked today. No stock, shipping, or tax. No measured frame rates.
      </p>
      <div className={`bench-body ${cat ? "picking" : ""}`}>
        <section className="list">
          <div className="sum-bar">
            <input aria-label="List name" value={name} onChange={(e) => setName(e.target.value)} />
            <p className={`fit ${status.cls}`}>{status.word}</p>
            <p className="total">
              {cad(total)}
              <small>{chosen} selected</small>
            </p>
          </div>
          <div className="row-actions">
            <button type="button" onClick={() => setGuide(true)}>
              Help me choose
            </button>
            <button type="button" onClick={() => setReport((v) => !v)}>
              {report ? "Hide the check" : "Full check"}
            </button>
            <button type="button" onClick={undo} disabled={!history.length}>
              Undo
            </button>
            <button
              type="button"
              onClick={() => {
                saveCurrent(name);
                showToast("Saved on this device");
              }}
            >
              Save
            </button>
            <button type="button" onClick={() => setShowSaves((v) => !v)}>
              Saved
            </button>
            <button type="button" onClick={share}>
              Share
            </button>
            <button
              type="button"
              onClick={() => {
                remember();
                clear();
              }}
            >
              Clear
            </button>
          </div>
          {showSaves ? (
            <ul className="saves">
              {saves.map((save) => (
                <li key={save.id}>
                  <button
                    type="button"
                    onClick={() => {
                      remember();
                      loadCart(save.cart);
                      setName(save.name);
                    }}
                  >
                    {save.name}
                  </button>
                  <button type="button" onClick={() => deleteSave(save.id)} aria-label={`Delete ${save.name}`}>
                    Remove
                  </button>
                </li>
              ))}
              {!saves.length ? <li>No saved lists on this device.</li> : null}
            </ul>
          ) : null}
          <ol className="slots">
            {CATS.map((slot) => {
              const picked = lines.filter((line) => line.part.cat === slot.id);
              return (
                <li key={slot.id}>
                  <div className="slot-h">
                    <span>
                      {slot.name}
                      {slot.required && !picked.length ? " · needed" : ""}
                    </span>
                    <button type="button" onClick={() => openCat(slot.id)}>
                      {picked.length ? (MULTI[slot.id] ? "Add another" : "Replace") : "Choose"}
                    </button>
                  </div>
                  {picked.length ? (
                    picked.map((line) => (
                      <div key={line.part.id} className="picked">
                        <span className="mono" aria-hidden>
                          {line.part.brand.slice(0, 2).toUpperCase()}
                        </span>
                        <span>
                          <b>{line.part.n}</b>
                          <small>{specOf(line.part)}</small>
                        </span>
                        <em>{line.part.p ? cad(line.part.p * line.qty) : "Included"}</em>
                        <button
                          type="button"
                          onClick={() => {
                            remember();
                            del(line.part.id);
                          }}
                        >
                          Remove
                        </button>
                      </div>
                    ))
                  ) : (
                    <p className="empty">Nothing in this slot. The list can stay unfinished.</p>
                  )}
                </li>
              );
            })}
          </ol>
          {report ? (
            <section className="report">
              <h2>Full check</h2>
              <p className="fine">A blank is not a yes. If a measurement is missing, the row says unknown.</p>
              {!checks.length ? <p>Pick two parts that can disagree before there is anything to check.</p> : null}
              <ul>
                {checks.map((row) => (
                  <li key={row.id} className={row.status}>
                    <b>
                      {label(row.status)} · {row.title}
                    </b>
                    <p>{row.why}</p>
                    {row.fix ? <p>{row.fix}</p> : null}
                    {row.missing ? <p>Missing: {row.missing}</p> : null}
                  </li>
                ))}
              </ul>
              <h2>Before you pay</h2>
              <ul className="check">
                <li>Prices are a saved Canada Computers shelf list, not today’s price or stock.</li>
                <li>Shipping, tax, and the seller’s return rules are not in this list.</li>
                <li>BIOS support is not stored here. Check the board maker.</li>
                <li>Graphics-card thickness and memory height are not stored here.</li>
                <li>Power-cable counts are not stored here.</li>
                <li>There is no measured frame rate for any game in this catalog.</li>
              </ul>
            </section>
          ) : null}
        </section>
        <section className="picker">
          {!cat || !active ? (
            <p className="empty">Choose a slot on the left. Parts that will not fit stay hidden until you ask for them.</p>
          ) : (
            <>
              <div className="picker-h">
                <button type="button" className="back" onClick={() => setCat(null)}>
                  Back to the list
                </button>
                <h2>{active.name}</h2>
              </div>
              <div className="tools">
                <input value={q} placeholder={`Search ${active.name.toLowerCase()}`} onChange={(e) => setQ(e.target.value)} />
                <label>
                  Sort
                  <select value={sort} onChange={(e) => setSort(e.target.value as typeof sort)}>
                    <option value="price-asc">Price: low to high</option>
                    <option value="price-desc">Price: high to low</option>
                    <option value="name">Name</option>
                  </select>
                </label>
                <label className="checkline">
                  <input type="checkbox" checked={onlyFit} onChange={(e) => setOnlyFit(e.target.checked)} />
                  Hide parts that will not fit
                </label>
                <button type="button" onClick={() => setAdvanced((v) => !v)}>
                  {advanced ? "Simple filters" : "More filters"}
                </button>
              </div>
              {advanced ? (
                <div className="tools">
                  <label>
                    Max price
                    <input value={maxPrice} inputMode="decimal" placeholder="Any" onChange={(e) => setMaxPrice(e.target.value)} />
                  </label>
                  {sockets.length ? (
                    <label>
                      Socket
                      <select value={socket} onChange={(e) => setSocket(e.target.value)}>
                        <option value="">Any</option>
                        {sockets.map((item) => (
                          <option key={item}>{item}</option>
                        ))}
                      </select>
                    </label>
                  ) : null}
                  {forms.length ? (
                    <label>
                      Size
                      <select value={form} onChange={(e) => setForm(e.target.value)}>
                        <option value="">Any</option>
                        {forms.map((item) => (
                          <option key={item}>{item}</option>
                        ))}
                      </select>
                    </label>
                  ) : null}
                  {cat === "ram" ? (
                    <label>
                      Memory
                      <select value={ddr} onChange={(e) => setDdr(e.target.value)}>
                        <option value="">Any</option>
                        <option value="4">DDR4</option>
                        <option value="5">DDR5</option>
                      </select>
                    </label>
                  ) : null}
                  {cat === "ssd" ? (
                    <label>
                      Drive
                      <select value={drive} onChange={(e) => setDrive(e.target.value)}>
                        <option value="">Any</option>
                        <option value="nvme">NVMe</option>
                        <option value="sata">SATA</option>
                      </select>
                    </label>
                  ) : null}
                </div>
              ) : null}
              <ul className="parts">
                {shown.map((part) => {
                  const reason = isHardware(part) ? issueAgainstBuild(part, lines) : "";
                  const inList = Boolean(cart[part.id]);
                  return (
                    <li key={part.id} className={reason && !inList ? "no" : ""}>
                      <span className="mono" aria-hidden>
                        {part.brand.slice(0, 2).toUpperCase()}
                      </span>
                      <div>
                        <b>{part.n}</b>
                        <small>
                          {part.brand} · {specOf(part)}
                        </small>
                        <p className="offer">Canada Computers · shelf price · stock unknown · not a live check</p>
                        {reason && !inList ? <p className="bad">{reason}</p> : <p className="ok">{inList ? "In this list" : "No conflict with what you picked"}</p>}
                        {openId === part.id ? <p className="fine">{part.tags.join(" · ") || "No extra tags."} Product photos are not in this catalog.</p> : null}
                      </div>
                      <div className="buy">
                        <b>{part.p ? cad(part.p) : "Included"}</b>
                        <button
                          type="button"
                          disabled={Boolean(reason) && !inList}
                          onClick={() => {
                            remember();
                            if (inList) del(part.id);
                            else add(part.id);
                          }}
                        >
                          {inList ? "Remove" : reason ? "Will not fit" : "Add"}
                        </button>
                        <button type="button" onClick={() => setOpenId(openId === part.id ? null : part.id)}>
                          {openId === part.id ? "Hide" : "Details"}
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            setCompare((cur) => (cur.includes(part.id) ? cur.filter((id) => id !== part.id) : cur.length >= 3 ? cur : [...cur, part.id]))
                          }
                        >
                          {compare.includes(part.id) ? "Compared" : "Compare"}
                        </button>
                      </div>
                    </li>
                  );
                })}
              </ul>
              {!shown.length ? <p className="empty">Nothing matches. Clear the search, or show parts that will not fit.</p> : null}
              {compared.length > 1 ? (
                <div className="cmp">
                  {compared.map((part) => (
                    <article key={part.id}>
                      <b>{part.n}</b>
                      <p>{cad(part.p)}</p>
                      <p>{specOf(part)}</p>
                    </article>
                  ))}
                  <button type="button" onClick={() => setCompare([])}>
                    Clear compare
                  </button>
                </div>
              ) : null}
            </>
          )}
        </section>
      </div>
      {guide ? (
        <div className="sheet" role="dialog" aria-label="Help me choose">
          <div className="sheet-card">
            <h2>Help me choose</h2>
            <p className="fine">
              These are ready lists already checked against each other. They are not a live price search, and they are not a frame-rate estimate.
            </p>
            <div className="pills">
              {[
                ["game", "Gaming"],
                ["work", "Work and school"],
                ["create", "Video and 3D"],
              ].map(([id, text]) => (
                <button key={id} type="button" className={use === id ? "on" : ""} onClick={() => setUse(id)}>
                  {text}
                </button>
              ))}
            </div>
            <div className="pills">
              {BUDGETS.map((n) => (
                <button key={n} type="button" className={budget === n ? "on" : ""} onClick={() => setBudget(n)}>
                  ${n.toLocaleString()}
                </button>
              ))}
            </div>
            {ideas.over ? <p>Nothing in this set is under that budget. The closest ready list is over.</p> : null}
            <div className="ideas">
              {ideas.items.map((item, index) => (
                <button key={item.id} type="button" onClick={() => useReady(item)}>
                  <b>{index === 0 ? "Best value" : index === ideas.items.length - 1 && ideas.items.length > 1 ? "Higher" : "Balanced"}</b>
                  <span>{item.n}</span>
                  <small>{item.desc}</small>
                  <em>{cad(item.p)}</em>
                </button>
              ))}
            </div>
            <button type="button" onClick={() => setGuide(false)}>
              Close
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function label(status: FitStatus) {
  if (status === "compatible") return "Verified";
  if (status === "incompatible") return "Does not fit";
  if (status === "conditional") return "Only if";
  return "Unknown";
}
