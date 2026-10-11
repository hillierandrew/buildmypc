import { useEffect, useMemo, useState } from "react";
import { DB, REQUIRED, specOf } from "@/lib/catalog";
import { issueAgainstBuild, summarize } from "@/lib/compat";
import { BUDGET_KEYS, CHEAP_KEY, GAME_KEYS, MAX_KEY, caseChoices, gapsFor, linesFrom, materialize, soundChoices, spread, withPart, withoutCat } from "@/lib/builds";
import { money } from "@/lib/format";
import { LANGS, isLang, t } from "@/lib/i18n";
import { useBuilder } from "@/lib/store";
import type { CatId, Line, Part } from "@/lib/types";
import "./configurator.css";

const NAV: [CatId, string, boolean][] = [
  ["cpu", "cat_cpu", true],
  ["mb", "cat_mb", true],
  ["cooler", "cat_cooler", true],
  ["ram", "cat_ram", true],
  ["gpu", "cat_gpu", false],
  ["ssd", "cat_ssd", true],
  ["psu", "cat_psu", true],
  ["case", "cat_case", true],
  ["os", "cat_os", false],
  ["fan", "cat_fan", false],
  ["sound", "cat_sound", false],
  ["nic", "cat_nic", false],
];

const GAP_ORDER: CatId[] = ["gpu", "ssd", "cooler", "psu", "case", "sound"];
const BUDGETS = [1000, 1500, 2000, 2500, 3000, 5000];

const USES: { id: string; label: string; entry: string; balanced: string; high: string; enthusiast: string }[] = [
  { id: "game", label: "use_game", entry: "g4", balanced: "g2", high: "g7", enthusiast: "g3" },
  { id: "school", label: "use_school", entry: "e10", balanced: "e1", high: "e8", enthusiast: "e8" },
  { id: "work", label: "use_work", entry: "e1", balanced: "e8", high: "e8", enthusiast: "p6" },
  { id: "code", label: "use_code", entry: "e1", balanced: "p6", high: "p6", enthusiast: "p7" },
  { id: "ai", label: "use_ai", entry: "e7", balanced: "p4", high: "p4", enthusiast: "p4" },
  { id: "video", label: "use_video", entry: "e7", balanced: "p2", high: "p14", enthusiast: "p14" },
  { id: "cad", label: "use_cad", entry: "p11", balanced: "cad", high: "p9", enthusiast: "p5" },
  { id: "music", label: "use_music", entry: "p3", balanced: "p3", high: "e6", enthusiast: "e6" },
  { id: "stream", label: "use_stream", entry: "g2", balanced: "g6", high: "g6", enthusiast: "g3" },
  { id: "daily", label: "use_daily", entry: "e3", balanced: "e1", high: "e8", enthusiast: "e8" },
  { id: "nas", label: "use_nas", entry: "e2", balanced: "e9", high: "p7", enthusiast: "p7" },
  { id: "other", label: "use_other", entry: "e1", balanced: "g2", high: "p2", enthusiast: "p5" },
];

type Tier = "entry" | "balanced" | "high" | "enthusiast";
type Care = "performance" | "price" | "quiet" | "upgrade";
type SortKey = "value" | "price-asc" | "price-desc" | "perf";
type Screen = "home" | "ask" | "finish" | "build";

function prebuilt(key: string) {
  const found = DB.pb.find((p) => p.k === key);
  return found && found.cat === "pb" ? found : undefined;
}

function blocked(part: Part, lines: Line[]) {
  if (part.cat === "pb") return "";
  return issueAgainstBuild(part, lines);
}

function ThemeSwitch({ lang }: { lang: string }) {
  const theme = useBuilder((s) => s.themeCycle);
  const setThemeMode = useBuilder((s) => s.setThemeMode);
  const light = theme === "light";
  return (
    <div className="theme-pair" role="group" aria-label={`${t(lang, "light")} / ${t(lang, "dark")}`}>
      <button type="button" className={light ? "on" : ""} aria-pressed={light} onClick={() => setThemeMode("light")}>
        {t(lang, "light")}
      </button>
      <button type="button" className={!light ? "on" : ""} aria-pressed={!light} onClick={() => setThemeMode("dark")}>
        {t(lang, "dark")}
      </button>
    </div>
  );
}

function LangRow({ lang }: { lang: string }) {
  const setLang = useBuilder((s) => s.setLang);
  return (
    <div className="langs" role="group" aria-label={t(lang, "language")}>
      {LANGS.map((item) => (
        <button key={item.id} type="button" className={lang === item.id ? "on" : ""} aria-pressed={lang === item.id} onClick={() => setLang(item.id)}>
          {item.label}
        </button>
      ))}
    </div>
  );
}

export function Configurator() {
  const cart = useBuilder((s) => s.cart);
  const budget = useBuilder((s) => s.budget);
  const setBudget = useBuilder((s) => s.setBudget);
  const add = useBuilder((s) => s.add);
  const del = useBuilder((s) => s.del);
  const loadCart = useBuilder((s) => s.loadCart);
  const clear = useBuilder((s) => s.clear);
  const saves = useBuilder((s) => s.saves);
  const saveCurrent = useBuilder((s) => s.saveCurrent);
  const deleteSave = useBuilder((s) => s.deleteSave);
  const showToast = useBuilder((s) => s.showToast);
  const themeCycle = useBuilder((s) => s.themeCycle);
  const lang = useBuilder((s) => s.lang);
  const setLang = useBuilder((s) => s.setLang);
  const setThemeMode = useBuilder((s) => s.setThemeMode);

  const tr = (key: string, vars?: Record<string, string>) => t(lang, key, vars);
  const named = (key: string, fallback: string) => {
    const text = tr(key);
    return text === key ? fallback : text;
  };

  const [screen, setScreen] = useState<Screen>("home");
  const [step, setStep] = useState(0);
  const [useId, setUseId] = useState("game");
  const [tier, setTier] = useState<Tier>("balanced");
  const [res, setRes] = useState<"1080" | "1440" | "4k">("1440");
  const [windows, setWindows] = useState(true);
  const [care, setCare] = useState<Care>("performance");
  const [cat, setCat] = useState<CatId>("cpu");
  const [q, setQ] = useState("");
  const [sort, setSort] = useState<SortKey>("value");
  const [onlyFit, setOnlyFit] = useState(true);
  const [expert, setExpert] = useState(false);
  const [brand, setBrand] = useState("");
  const [sock, setSock] = useState("");
  const [openId, setOpenId] = useState<string | null>(null);
  const [compare, setCompare] = useState<string[]>([]);
  const [limit, setLimit] = useState(16);
  const [buildName, setBuildName] = useState("My PC");
  const [showSaves, setShowSaves] = useState(false);
  const [mobileBuild, setMobileBuild] = useState(false);
  const [pending, setPending] = useState<{ id: string; gaps: CatId[] } | null>(null);

  useEffect(() => {
    const storedLang = localStorage.getItem("bmpc-lang");
    const storedTheme = localStorage.getItem("bmpc-theme");
    if (storedLang && isLang(storedLang)) setLang(storedLang);
    if (storedTheme === "light" || storedTheme === "dark") setThemeMode(storedTheme);
  }, [setLang, setThemeMode]);

  useEffect(() => {
    document.documentElement.lang = lang === "zh" ? "zh-Hans" : lang;
    document.documentElement.dir = lang === "ur" ? "rtl" : "ltr";
  }, [lang]);

  const summary = useMemo(() => summarize(cart, Object.fromEntries(Object.values(DB).flat().map((p) => [p.id, p]))), [cart]);
  const lines = summary.lines;
  const over = budget > 0 && summary.tot > budget;
  const missing = REQUIRED.filter(([id]) => !lines.some((l) => l.part.cat === id));
  const hard = summary.issues.filter((i) => i.level === "err");
  const state: "empty" | "bad" | "incomplete" | "ok" = !lines.length ? "empty" : hard.length ? "bad" : missing.length ? "incomplete" : "ok";
  const stateText = state === "ok" ? tr("compatible") : state === "bad" ? tr("incompatible") : state === "incomplete" ? tr("incomplete") : tr("empty");

  const pool = DB[cat] ?? [];
  const brands = useMemo(() => [...new Set(pool.map((p) => p.brand).filter(Boolean))].sort(), [pool]);
  const sockets = useMemo(
    () => (cat === "cpu" || cat === "mb" ? [...new Set(pool.map((p) => ("sock" in p ? p.sock : "")).filter(Boolean))].sort() : []),
    [pool, cat],
  );

  const shown = useMemo(() => {
    const query = q.trim().toLowerCase();
    let list = pool.filter((p) => {
      if (brand && p.brand !== brand) return false;
      if (sock && "sock" in p && p.sock !== sock) return false;
      if (!query) return true;
      const blob = `${p.n} ${p.brand} ${p.tags.join(" ")} ${specOf(p)}`.toLowerCase();
      return blob.includes(query);
    });
    if (onlyFit) list = list.filter((p) => !blocked(p, lines));
    const perf = (p: Part) => ("f" in p && typeof p.f === "number" ? p.f : 0);
    list = [...list].sort((a, b) => {
      if (sort === "price-asc") return a.p - b.p;
      if (sort === "price-desc") return b.p - a.p;
      if (sort === "perf") return perf(b) - perf(a) || a.p - b.p;
      return a.p / Math.max(1, perf(a) || 1) - b.p / Math.max(1, perf(b) || 1);
    });
    return list;
  }, [pool, q, brand, sock, onlyFit, sort, lines]);

  function openCat(next: CatId) {
    setCat(next);
    setQ("");
    setBrand("");
    setSock("");
    setLimit(16);
    setOpenId(null);
    setScreen("build");
    setMobileBuild(false);
  }

  function openReady(key: string, withWindows?: boolean) {
    const chosen = prebuilt(key);
    if (!chosen) return;
    loadCart(materialize(chosen.parts, withWindows));
    setPending({ id: chosen.id, gaps: gapsFor(chosen.parts) });
    setBuildName(named(`name_${chosen.k}`, chosen.n));
    setScreen("finish");
    showToast(named(`name_${chosen.k}`, chosen.n));
  }

  function finishWizard() {
    const use = USES.find((u) => u.id === useId) ?? USES[0];
    let key = use[tier];
    if (useId === "game") {
      if (res === "1080") key = tier === "entry" || care === "price" ? "mc" : "fort";
      if (res === "1440") key = care === "price" ? "sky2" : "cs2";
      if (res === "4k") key = tier === "enthusiast" || care === "performance" ? "cp2077" : "cp1080";
    }
    if (care === "price" && useId !== "game") key = use.entry;
    if (care === "quiet") key = "e6";
    if (care === "upgrade" && useId !== "game") key = use.high;
    let chosen = prebuilt(key) ?? prebuilt(use.balanced) ?? prebuilt(use.entry);
    if (chosen && budget && chosen.p > budget) {
      const ladder = [...BUDGET_KEYS, use.entry, use.balanced, use.high, use.enthusiast, "c0", "lol", "rbx", "mc"]
        .map((k) => prebuilt(k))
        .filter((p): p is NonNullable<typeof p> => Boolean(p))
        .filter((p) => p.p <= budget)
        .sort((a, b) => b.p - a.p);
      if (ladder[0]) chosen = ladder[0];
    }
    if (!chosen) return;
    openReady(chosen.k, windows);
  }

  function share() {
    const url = `${location.origin}${location.pathname}#${btoa(JSON.stringify(cart))}`;
    navigator.clipboard.writeText(url).then(
      () => showToast(tr("share")),
      () => showToast(tr("nothing")),
    );
  }

  const open = openId ? pool.find((p) => p.id === openId) : null;
  const compared = compare.map((id) => Object.values(DB).flat().find((p) => p.id === id)).filter((p): p is Part => Boolean(p));
  const light = themeCycle === "light";
  const dir = lang === "ur" ? "rtl" : "ltr";
  const tone = light ? "light" : "dark";

  const tips: { text: string; run?: () => void; label?: string }[] = [];
  if (missing.length) tips.push({ text: tr("stillNeed", { list: missing.map(([id]) => tr(`cat_${id}`)).join(", ") }) });
  if (over) {
    const optional = [...lines].filter((l) => l.part.cat === "fan" || (l.part.cat === "sound" && l.part.p > 0) || l.part.cat === "nic").sort((a, b) => b.part.p - a.part.p)[0];
    tips.push({
      text: tr("overBudget", { n: money(summary.tot - budget) }),
      run: optional ? () => del(optional.part.id) : undefined,
      label: optional ? tr("removePart", { n: optional.part.n }) : undefined,
    });
  }
  if (summary.cpu && summary.gpu && summary.gpu.f > summary.cpu.f + 2) {
    const better = DB.cpu.find((p) => p.cat === "cpu" && p.sock === summary.cpu?.sock && p.f > (summary.cpu?.f ?? 0) && p.p <= (summary.cpu?.p ?? 0) + 150);
    tips.push({
      text: tr("gpuAhead"),
      run: better ? () => add(better.id) : undefined,
      label: better ? tr("usePart", { n: better.n }) : undefined,
    });
  }

  function Row({ k }: { k: string }) {
    const item = prebuilt(k);
    if (!item) return null;
    return (
      <button type="button" className="build-row" onClick={() => openReady(k)}>
        <span className="txt">
          <b>{named(`name_${k}`, item.n)}</b>
          <span>{named(`blurb_${k}`, item.desc)}</span>
        </span>
        <em>{item.g === "Bundle" ? tr("from", { n: money(item.p) }) : money(item.p)}</em>
      </button>
    );
  }

  if (screen === "home") {
    const bundles = DB.pb.filter((p) => p.cat === "pb" && p.g === "Bundle");
    return (
      <div className={`cfg home ${tone}`} dir={dir}>
        <div className="sheet">
          <div className="shop-top">
            <h1>{tr("shop")}</h1>
            <ThemeSwitch lang={lang} />
          </div>
          <p className="lead">{tr("intro")}</p>
          <section className="group">
            <h2>{tr("priced")}</h2>
            <div className="build-list">
              <Row k={CHEAP_KEY} />
              <Row k={MAX_KEY} />
            </div>
          </section>
          <section className="group">
            <h2>{tr("budgets")}</h2>
            <div className="build-list">
              {BUDGET_KEYS.map((k) => (
                <Row key={k} k={k} />
              ))}
            </div>
          </section>
          <section className="group">
            <h2>{tr("games")}</h2>
            <div className="build-list">
              {GAME_KEYS.map((k) => (
                <Row key={k} k={k} />
              ))}
            </div>
          </section>
          <section className="group">
            <h2>{tr("bundles")}</h2>
            <p className="lead">{tr("bundleLead")}</p>
            <div className="build-list">
              {bundles.map((item) => (
                <Row key={item.k} k={item.k} />
              ))}
            </div>
          </section>
          <p className="end-links">
            <button type="button" className="text" onClick={() => { setStep(0); setScreen("ask"); }}>
              {tr("questions")}
            </button>
            <button type="button" className="text" onClick={() => { clear(); openCat("cpu"); }}>
              {tr("manual")}
            </button>
          </p>
          <LangRow lang={lang} />
        </div>
      </div>
    );
  }

  if (screen === "ask") {
    return (
      <div className={`cfg home ${tone}`} dir={dir}>
        <div className="sheet">
          <div className="shop-top">
            <button type="button" className="text" onClick={() => (step === 0 ? setScreen("home") : setStep((n) => n - 1))}>
              {tr("back")}
            </button>
            <ThemeSwitch lang={lang} />
          </div>
          {step === 0 ? (
            <>
              <h1>{tr("useQ")}</h1>
              <div className="pills">
                {USES.map((u) => (
                  <button key={u.id} type="button" className={useId === u.id ? "on" : ""} onClick={() => { setUseId(u.id); setStep(1); }}>
                    {tr(u.label)}
                  </button>
                ))}
              </div>
            </>
          ) : null}
          {step === 1 ? (
            <>
              <h1>{tr("budgetQ")}</h1>
              <div className="pills">
                {BUDGETS.map((n) => (
                  <button key={n} type="button" className={budget === n ? "on" : ""} onClick={() => { setBudget(n); setStep(2); }}>
                    ${n.toLocaleString()}
                  </button>
                ))}
              </div>
            </>
          ) : null}
          {step === 2 && useId === "game" ? (
            <>
              <h1>{tr("resQ")}</h1>
              <div className="pills">
                {(["1080", "1440", "4k"] as const).map((r) => (
                  <button key={r} type="button" className={res === r ? "on" : ""} onClick={() => { setRes(r); setStep(3); }}>
                    {r === "4k" ? "4K" : `${r}p`}
                  </button>
                ))}
              </div>
            </>
          ) : null}
          {step === 2 && useId !== "game" ? (
            <>
              <h1>{tr("tierQ")}</h1>
              <div className="pills">
                {(["entry", "balanced", "high", "enthusiast"] as const).map((id) => (
                  <button key={id} type="button" className={tier === id ? "on" : ""} onClick={() => { setTier(id); setStep(3); }}>
                    {tr(`tier_${id}`)}
                  </button>
                ))}
              </div>
            </>
          ) : null}
          {step === 3 ? (
            <>
              <h1>{tr("winQ")}</h1>
              <p className="lead">{tr("winNote")}</p>
              <div className="pills">
                <button type="button" className={windows ? "on" : ""} onClick={() => { setWindows(true); setStep(4); }}>
                  {tr("winYes")}
                </button>
                <button type="button" className={!windows ? "on" : ""} onClick={() => { setWindows(false); setStep(4); }}>
                  {tr("winNo")}
                </button>
              </div>
            </>
          ) : null}
          {step === 4 ? (
            <>
              <h1>{tr("careQ")}</h1>
              <div className="pills">
                {(["performance", "price", "quiet", "upgrade"] as const).map((id) => (
                  <button key={id} type="button" className={care === id ? "on" : ""} onClick={() => setCare(id)}>
                    {tr(`care_${id}`)}
                  </button>
                ))}
              </div>
              <button type="button" className="go" onClick={finishWizard}>
                {tr("showBuild")}
              </button>
            </>
          ) : null}
          <LangRow lang={lang} />
        </div>
      </div>
    );
  }

  if (screen === "finish" && pending) {
    const chosen = DB.pb.find((p) => p.id === pending.id);
    const title = chosen && chosen.cat === "pb" ? named(`name_${chosen.k}`, chosen.n) : buildName;
    const gaps = GAP_ORDER.filter((id) => pending.gaps.includes(id));
    const receipt = lines.filter((l) => !pending.gaps.includes(l.part.cat));
    const cases = caseChoices(linesFrom(cart));
    const sounds = soundChoices(linesFrom(cart));
    const current = (id: CatId) => lines.find((l) => l.part.cat === id)?.part.id;

    function pick(id: string) {
      loadCart(withPart(useBuilder.getState().cart, id));
    }

    return (
      <div className={`cfg finish ${tone}`} dir={dir}>
        <div className="sheet">
          <div className="finish-head">
            <div>
              <button type="button" className="text" onClick={() => setScreen("home")}>
                {tr("back")}
              </button>
              <h1>{title}</h1>
              <p className="price-lg">{money(summary.tot)}</p>
            </div>
            <button type="button" className="go" onClick={() => setScreen("build")}>
              {tr("looksGood")}
            </button>
          </div>
          <ThemeSwitch lang={lang} />
          <p className="lead">{tr("swapNote")}</p>
          {hard.map((issue) => (
            <p key={issue.msg} className="why">
              {issue.msg}
            </p>
          ))}
          <h2>{tr("receipt")}</h2>
          <ul className="receipt">
            {receipt.map((l) => (
              <li key={l.part.id}>
                <span>
                  {tr(`cat_${l.part.cat}`)} · {l.part.n}
                </span>
                <em>{l.part.p ? money(l.part.p * l.qty) : tr("included")}</em>
              </li>
            ))}
          </ul>
          {gaps.map((id) => {
            if (id === "case") {
              return (
                <section key={id}>
                  <h2>{tr("cat_case")}</h2>
                  <h3>{tr("caseMid")}</h3>
                  <div className="picks">
                    {cases.mid.map((p) => (
                      <button key={p.id} type="button" className={cart[p.id] ? "on" : ""} onClick={() => pick(p.id)}>
                        <span>
                          <b>{p.n}</b>
                          <small>{specOf(p)}</small>
                        </span>
                        <em>{money(p.p)}</em>
                      </button>
                    ))}
                  </div>
                  {cases.other.length ? <h3>{tr("caseOther")}</h3> : null}
                  <div className="picks">
                    {cases.other.map((p) => (
                      <button key={p.id} type="button" className={cart[p.id] ? "on" : ""} onClick={() => pick(p.id)}>
                        <span>
                          <b>{p.n}</b>
                          <small>{specOf(p)}</small>
                        </span>
                        <em>{money(p.p)}</em>
                      </button>
                    ))}
                  </div>
                </section>
              );
            }
            if (id === "sound") {
              return (
                <section key={id}>
                  <h2>{tr("soundCards")}</h2>
                  <div className="picks">
                    {sounds.map((p) => (
                      <button key={p.id} type="button" className={cart[p.id] ? "on" : ""} onClick={() => pick(p.id)}>
                        <span>
                          <b>{p.n}</b>
                          <small>{specOf(p)}</small>
                        </span>
                        <em>{p.p ? money(p.p) : tr("included")}</em>
                      </button>
                    ))}
                  </div>
                </section>
              );
            }
            const options = spread(id, lines, current(id));
            return (
              <section key={id}>
                <h2>{tr(`cat_${id}`)}</h2>
                <div className="picks">
                  {id === "gpu" && summary.cpu?.ig ? (
                    <button type="button" className={!summary.gpu ? "on" : ""} onClick={() => loadCart(withoutCat(useBuilder.getState().cart, "gpu"))}>
                      <span>
                        <b>{tr("optionalGpu")}</b>
                      </span>
                    </button>
                  ) : null}
                  {options.map((p) => (
                    <button key={p.id} type="button" className={cart[p.id] ? "on" : ""} onClick={() => pick(p.id)}>
                      <span>
                        <b>{p.n}</b>
                        <small>{specOf(p)}</small>
                      </span>
                      <em>{p.p ? money(p.p) : tr("included")}</em>
                    </button>
                  ))}
                </div>
                <button type="button" className="text" onClick={() => openCat(id)}>
                  {tr("seeAll", { name: tr(`cat_${id}`) })}
                </button>
              </section>
            );
          })}
          <p className="end-links">
            <button type="button" className="text" onClick={() => setScreen("build")}>
              {tr("changeAny")}
            </button>
          </p>
          <LangRow lang={lang} />
        </div>
      </div>
    );
  }

  return (
    <div className={`cfg ${tone}`} dir={dir}>
      <header className="top">
        <button type="button" className="text" onClick={() => setScreen("home")}>
          {tr("shop")}
        </button>
        <button type="button" className="text" onClick={() => { setStep(0); setScreen("ask"); }}>
          {tr("help")}
        </button>
        <input
          value={q}
          placeholder={tr("search", { name: tr(NAV.find((c) => c[0] === cat)?.[1] ?? "parts") })}
          onChange={(e) => { setQ(e.target.value); setLimit(16); }}
        />
        <span className={over ? "bad" : ""}>
          {money(summary.tot)}
          {budget ? ` / ${money(budget)}` : ""}
        </span>
        <ThemeSwitch lang={lang} />
        <button type="button" className="build-toggle" onClick={() => setMobileBuild((v) => !v)}>
          {mobileBuild ? tr("parts") : tr("yourBuild")}
        </button>
      </header>
      <div className={`body ${mobileBuild ? "show-build" : ""}`}>
        <aside className="sum">
          <div className="sum-h">
            <input aria-label={tr("buildName")} value={buildName} onChange={(e) => setBuildName(e.target.value)} />
            <b className={`flag ${state === "ok" ? "ok" : state === "bad" ? "bad" : ""}`}>
              {state === "ok" ? "✓ " : state === "bad" ? "✕ " : state === "incomplete" ? "⚠ " : ""}
              {stateText}
            </b>
          </div>
          <p className="money">
            {money(summary.tot)}
            {budget ? <small>{over ? ` ${tr("overBy", { n: money(summary.tot - budget) })}` : ` ${tr("left", { n: money(budget - summary.tot) })}`}</small> : null}
          </p>
          {summary.watts ? (
            <p className="fine">{tr("watts", { n: String(summary.watts), w: String(Math.ceil((summary.watts * 1.2) / 50) * 50) })}</p>
          ) : null}
          <ol className="slots">
            {NAV.map(([id, name, required]) => {
              const picked = lines.filter((l) => l.part.cat === id);
              return (
                <li key={id}>
                  <button type="button" className={cat === id ? "on" : ""} onClick={() => openCat(id)}>
                    <span>
                      {tr(name)}
                      {required && !picked.length ? ` · ${tr("needed")}` : ""}
                    </span>
                    <b>{picked.length ? picked.map((l) => l.part.n).join(", ") : tr("notSelected")}</b>
                    <em>{picked.length ? money(picked.reduce((a, l) => a + l.part.p * l.qty, 0)) : ""}</em>
                  </button>
                </li>
              );
            })}
          </ol>
          {hard.map((i) => (
            <p key={i.msg} className="why">
              ✕ {i.msg}
            </p>
          ))}
          {tips.map((tip) => (
            <p key={tip.text} className="why">
              {tip.text}{" "}
              {tip.run && tip.label ? (
                <button type="button" onClick={tip.run}>
                  {tip.label}
                </button>
              ) : null}
            </p>
          ))}
          <div className="row">
            <button type="button" onClick={() => setExpert((v) => !v)}>
              {expert ? tr("simple") : tr("expert")}
            </button>
            <button type="button" onClick={() => saveCurrent(buildName)}>
              {tr("save")}
            </button>
            <button type="button" onClick={() => setShowSaves((v) => !v)}>
              {tr("saved")}
            </button>
            <button type="button" onClick={share}>
              {tr("share")}
            </button>
            <button type="button" onClick={() => clear()}>
              {tr("clear")}
            </button>
          </div>
          {showSaves ? (
            <ul className="saves">
              {saves.map((sv) => (
                <li key={sv.id}>
                  <button type="button" onClick={() => loadCart(sv.cart)}>
                    {sv.name}
                  </button>
                  <button type="button" onClick={() => deleteSave(sv.id)} aria-label={tr("delete", { n: sv.name })}>
                    ×
                  </button>
                </li>
              ))}
              {!saves.length ? <li>{tr("noSaves")}</li> : null}
            </ul>
          ) : null}
          <p className="fine">{tr("priceNote")}</p>
          <LangRow lang={lang} />
        </aside>
        <main className="catalog">
          <div className="tools">
            <label>
              {tr("sort")}
              <select value={sort} onChange={(e) => setSort(e.target.value as SortKey)}>
                <option value="value">{tr("value")}</option>
                <option value="price-asc">{tr("priceAsc")}</option>
                <option value="price-desc">{tr("priceDesc")}</option>
                <option value="perf">{tr("perf")}</option>
              </select>
            </label>
            {brands.length > 1 ? (
              <label>
                {tr("maker")}
                <select value={brand} onChange={(e) => setBrand(e.target.value)}>
                  <option value="">{tr("any")}</option>
                  {brands.map((b) => (
                    <option key={b}>{b}</option>
                  ))}
                </select>
              </label>
            ) : null}
            {sockets.length ? (
              <label>
                {tr("socket")}
                <select value={sock} onChange={(e) => setSock(e.target.value)}>
                  <option value="">{tr("any")}</option>
                  {sockets.map((s) => (
                    <option key={s}>{s}</option>
                  ))}
                </select>
              </label>
            ) : null}
            <label className="check">
              <input type="checkbox" checked={onlyFit} onChange={(e) => setOnlyFit(e.target.checked)} />
              {tr("onlyFit")}
            </label>
          </div>
          <ul className="parts">
            {shown.slice(0, limit).map((p) => {
              const reason = blocked(p, lines);
              const inBuild = !!cart[p.id];
              return (
                <li key={p.id} className={reason && !inBuild ? "incompatible-greyed-out" : inBuild ? "in" : ""}>
                  <div>
                    <b>{p.n}</b>
                    <span>{p.brand}</span>
                    <p>{specOf(p)}</p>
                    {expert ? <p className="fine">{p.tags.join(" · ")}</p> : null}
                    {reason && !inBuild ? <p className="why">✕ {reason}</p> : <p className="ok">{inBuild ? `✓ ${tr("inBuild")}` : `✓ ${tr("fits")}`}</p>}
                  </div>
                  <div className="buy">
                    <b>{p.p ? money(p.p) : tr("included")}</b>
                    <button type="button" disabled={!!reason && !inBuild} onClick={() => (inBuild ? del(p.id) : add(p.id))}>
                      {inBuild ? tr("remove") : reason ? tr("wontFit") : tr("add")}
                    </button>
                    <button type="button" className="text" onClick={() => setOpenId(openId === p.id ? null : p.id)}>
                      {openId === p.id ? tr("close") : tr("details")}
                    </button>
                    <button
                      type="button"
                      className="text"
                      onClick={() => setCompare((cur) => (cur.includes(p.id) ? cur.filter((id) => id !== p.id) : cur.length >= 4 ? cur : [...cur, p.id]))}
                    >
                      {compare.includes(p.id) ? tr("compared") : tr("compare")}
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
          {shown.length > limit ? (
            <button type="button" className="more" onClick={() => setLimit((n) => n + 16)}>
              {tr("showMore", { n: String(shown.length - limit) })}
            </button>
          ) : null}
          {!shown.length ? <p className="lead">{tr("nothing")}</p> : null}
          {open ? (
            <section className="detail">
              <h2>{open.n}</h2>
              <p>
                {open.brand} · {money(open.p)} · {tr("catalogPrice")}
              </p>
              <p>{specOf(open)}</p>
              <p>{open.tags.join(" · ")}</p>
              <button type="button" onClick={() => add(open.id)} disabled={!!blocked(open, lines)}>
                {tr("addTo")}
              </button>
              <button type="button" onClick={() => setOpenId(null)}>
                {tr("close")}
              </button>
            </section>
          ) : null}
          {compared.length > 1 ? (
            <section className="detail">
              <h2>{tr("compare")}</h2>
              <div className="cmp">
                {compared.map((p) => (
                  <article key={p.id}>
                    <b>{p.n}</b>
                    <p>{money(p.p)}</p>
                    <p>{specOf(p)}</p>
                    <button type="button" onClick={() => add(p.id)}>
                      {tr("add")}
                    </button>
                  </article>
                ))}
              </div>
              <button type="button" onClick={() => setCompare([])}>
                {tr("clearCompare")}
              </button>
            </section>
          ) : null}
          <LangRow lang={lang} />
        </main>
      </div>
    </div>
  );
}
