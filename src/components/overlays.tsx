import { useEffect, useState } from "react";
import { CATS, specOf } from "@/lib/catalog";
import { issueAgainstBuild } from "@/lib/compat";
import { DISGUISES } from "@/lib/disguises";
import { money } from "@/lib/format";
import { currentSummary, listParts, useBuilder, type Filters } from "@/lib/store";
import { tourFor } from "@/lib/tours";
import { UI_STYLES } from "@/lib/ui-styles";
import type { CatId } from "@/lib/types";

const PER = 12;

export function Toast() {
  const toast = useBuilder((s) => s.toast);
  if (!toast) return null;
  return (
    <div id="toast" role="status">
      {toast}
    </div>
  );
}

export function Disguise() {
  const key = useBuilder((s) => s.disguise);
  const setDisguise = useBuilder((s) => s.setDisguise);
  const showToast = useBuilder((s) => s.showToast);
  if (!key) return null;
  const d = DISGUISES[key];
  if (!d) return null;
  return (
    <div id="disguise" data-brand={key}>
      <button type="button" className="dis-close" onClick={() => setDisguise(null)} aria-label="Close cover">
        ×
      </button>
      <div className="dis-header">
        <div className="dis-logo">{d.logo}</div>
        <input className="dis-search" placeholder={d.placeholder} aria-label={d.placeholder} />
      </div>
      <div className="dis-body">
        {d.results.map((r) => (
          <button
            type="button"
            className="dis-result"
            key={r.u}
            onClick={() => showToast("That page is part of the cover.")}
          >
            <h3>{r.t}</h3>
            <div className="url">{r.u}</div>
            <div className="desc">{r.d}</div>
          </button>
        ))}
      </div>
    </div>
  );
}

export function Overlays() {
  const modal = useBuilder((s) => s.modal);
  const closeModal = useBuilder((s) => s.closeModal);
  const tourOn = useBuilder((s) => s.tourOn);
  return (
    <>
      {modal ? (
        <div
          className="modal show"
          onClick={(e) => {
            if (e.target === e.currentTarget) closeModal();
          }}
        >
          <div className="box" role="dialog" aria-modal="true">
            <button type="button" className="close" aria-label="Close" onClick={() => closeModal()}>
              ×
            </button>
            {modal === "components" ? <Components /> : null}
            {modal === "bench" ? <Bench /> : null}
            {modal === "compare" ? <Compare /> : null}
            {modal === "saves" ? <Saves /> : null}
            {modal === "keys" ? <Keys /> : null}
          </div>
        </div>
      ) : null}
      {tourOn ? <Tour /> : null}
    </>
  );
}

function Components() {
  const s = useBuilder();
  const summary = currentSummary(s.cart);
  const list = listParts({ ...s, filters: { ...s.filters } }, s.dgCat, s.dgQ, "");
  const pages = Math.max(1, Math.ceil(list.length / PER));
  const page = Math.min(s.dgPage, pages - 1);
  const slice = list.slice(page * PER, page * PER + PER);
  return (
    <>
      <h2>Add components</h2>
      <p className="sub">Same filters as the main list. Click a row to add it. Storage, memory, and fans stack.</p>
      <div className="dg-tools">
        <select
          aria-label="Category"
          value={s.dgCat}
          onChange={(e) => s.setDg({ dgCat: e.target.value as CatId, dgPage: 0 })}
        >
          {CATS.filter((c) => c[0] !== "pb").map(([id, name]) => (
            <option key={id} value={id}>
              {name}
            </option>
          ))}
        </select>
        <input
          value={s.dgQ}
          placeholder="Search components"
          onChange={(e) => s.setDg({ dgQ: e.target.value, dgPage: 0 })}
        />
        <select
          aria-label="Sort"
          value={s.filters.sort}
          onChange={(e) => s.setFilter("sort", e.target.value as Filters["sort"])}
        >
          <option value="price-asc">Price up</option>
          <option value="price-desc">Price down</option>
          <option value="name">Name</option>
        </select>
      </div>
      <div className="datagrid">
        <table>
          <thead>
            <tr>
              <th>Description</th>
              <th>Tags</th>
              <th>Status</th>
              <th className="r">Price</th>
            </tr>
          </thead>
          <tbody>
            {slice.map((p) => {
              const qty = s.cart[p.id] || 0;
              const err = p.cat !== "pb" && !qty ? issueAgainstBuild(p, summary.lines) : "";
              return (
                <tr key={p.id} className={qty ? "sel" : ""} onClick={() => s.pick(p.id)}>
                  <td>
                    <div className="nm">{p.n}</div>
                    <div className="spec">{specOf(p)}</div>
                  </td>
                  <td>
                    <div className="tags">
                      {p.tags.slice(0, 4).map((t, i) => (
                        <span key={`${p.id}-${i}`}>{t}</span>
                      ))}
                    </div>
                  </td>
                  <td className={err ? "err" : "okcell"}>
                    {qty ? `In build${qty > 1 ? ` ×${qty}` : ""}` : err || "OK"}
                  </td>
                  <td className="r price">{money(p.p)}</td>
                </tr>
              );
            })}
            {!slice.length ? (
              <tr>
                <td colSpan={4}>No parts match.</td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
      <div className="dg-foot">
        <span>
          {list.length} item{list.length === 1 ? "" : "s"}
        </span>
        <div className="pager">
          <button type="button" disabled={page === 0} onClick={() => s.setDg({ dgPage: page - 1 })}>
            Prev
          </button>
          <span>
            {page + 1} / {pages}
          </span>
          <button type="button" disabled={page >= pages - 1} onClick={() => s.setDg({ dgPage: page + 1 })}>
            Next
          </button>
        </div>
      </div>
    </>
  );
}

function Bench() {
  const cart = useBuilder((s) => s.cart);
  const summary = currentSummary(cart);
  const g = summary.scores.gaming;
  const graphics = Boolean(summary.gpu || summary.cpu?.ig);
  const fps = graphics
    ? {
        "1080p esports": Math.round(70 + g * 26 + summary.c * 2),
        "1080p AAA": Math.round(28 + g * 12 + summary.c),
        "1440p AAA": Math.round(16 + g * 9 + summary.v),
        "4K AAA": Math.round(8 + g * 6 + summary.v * 0.6),
      }
    : null;
  const score = Math.round(g * 120 + summary.scores.ai * 180 + summary.scores.creator * 90 + summary.c * 40 + summary.r);
  return (
    <>
      <h2>Performance estimates</h2>
      <p className="sub">Rough figures from the parts in this cart. Not a lab result.</p>
      <div className="bench-grid">
        <Card k="Score" v={String(score)} u="pts" d="CPU, GPU, memory, rolled together." />
        <Card k="Cores" v={`${summary.c} / ${summary.t}`} d="Physical / threads." />
        <Card k="VRAM" v={String(summary.v)} u="GB" d="Graphics memory." />
        <Card k="Memory" v={String(summary.r)} u="GB" d="System RAM." />
        <Card k="NVMe" v={String(summary.nvme)} d={summary.mb ? `of ${summary.mb.m2} M.2 slots` : "No board yet"} />
        <Card k="SATA" v={String(summary.sata)} d={summary.mb ? `of ${summary.mb.sata} ports` : "No board yet"} />
      </div>
      <h3 className="gh">Estimated FPS</h3>
      <div className="bench-grid">
        {fps
          ? Object.entries(fps).map(([k, v]) => <Card key={k} k={k} v={String(v)} u="FPS" d="High settings, average." />)
          : <p className="sub">Add a processor with graphics, or a graphics card.</p>}
      </div>
    </>
  );
}

function Card({ k, v, u, d }: { k: string; v: string; u?: string; d: string }) {
  return (
    <div className="bench-card">
      <div className="lbl">{k}</div>
      <div className="val">
        {v}
        {u ? <span className="unit">{u}</span> : null}
      </div>
      <div className="desc">{d}</div>
    </div>
  );
}

function Compare() {
  const s = useBuilder();
  const summary = currentSummary(s.cart);
  const rows = listParts(s, "pb", "", "");
  return (
    <>
      <h2>Community builds</h2>
      <p className="sub">Each one is a compatible starting point. Load replaces the cart.</p>
      <div className="compare-grid">
        {rows.map((p) => {
          if (p.cat !== "pb") return null;
          const diff = Math.round(p.p - summary.tot);
          return (
            <button
              type="button"
              className="compare-card"
              key={p.id}
              onClick={() => {
                s.loadBuild(p.id);
                s.closeModal();
                s.showToast(`Loaded ${p.n}`);
              }}
            >
              <div className="title">{p.n}</div>
              <div className="desc">{p.desc}</div>
              <div className="price">
                {money(p.p)}{" "}
                <span className={diff > 0 ? "up" : "down"}>
                  {diff > 0 ? "+" : ""}
                  {money(diff)}
                </span>
              </div>
            </button>
          );
        })}
      </div>
    </>
  );
}

function Saves() {
  const s = useBuilder();
  const [name, setName] = useState("My build");
  return (
    <>
      <h2>Saved builds</h2>
      <p className="sub">Stored in this browser only. Restore replaces the cart.</p>
      <div className="dg-tools">
        <input value={name} aria-label="Build name" onChange={(e) => setName(e.target.value)} />
        <button
          type="button"
          className="btn primary slim"
          onClick={() => {
            if (!Object.keys(s.cart).length) {
              s.showToast("Nothing to save");
              return;
            }
            s.saveCurrent(name.trim() || "Untitled build");
          }}
        >
          Save current
        </button>
      </div>
      {!s.saves.length ? <p className="sub">No saves yet.</p> : null}
      <ul className="savelist">
        {s.saves.map((sv) => (
          <li key={sv.id}>
            <div>
              <b>{sv.name}</b>
              <small>
                {new Date(sv.at).toLocaleString()} · {Object.keys(sv.cart).length} lines
              </small>
            </div>
            <button
              type="button"
              className="btn ghost slim"
              onClick={() => {
                s.loadCart(sv.cart);
                s.showToast(`Restored ${sv.name}`);
              }}
            >
              Restore
            </button>
            <button type="button" className="btn ghost slim" onClick={() => s.deleteSave(sv.id)}>
              Delete
            </button>
          </li>
        ))}
      </ul>
    </>
  );
}

function Keys() {
  return (
    <>
      <h2>Password keyring</h2>
      <p className="sub">
        Capital Password1–15 keep the original skins. Lowercase password1–10 are different layouts. Anything else
        warns, then sends you to Bing.
      </p>
      <div className="datagrid">
        <table className="keytable">
          <thead>
            <tr>
              <th>Password</th>
              <th>Skin</th>
              <th>What it does</th>
            </tr>
          </thead>
          <tbody>
            {UI_STYLES.map((u) => (
              <tr key={u.id}>
                <td className="mono">{u.password}</td>
                <td>{u.title}</td>
                <td>
                  {u.desc} {u.hint}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="sub">
        After you are in, type google, amazon, netflix, github, kijiji, ebay, or bing outside a text field for a cover page. Escape closes it. Tour walks whatever skin you are on.
      </p>
    </>
  );
}

function Tour() {
  const currentUI = useBuilder((s) => s.currentUI);
  const tourIdx = useBuilder((s) => s.tourIdx);
  const nextTour = useBuilder((s) => s.nextTour);
  const prevTour = useBuilder((s) => s.prevTour);
  const endTour = useBuilder((s) => s.endTour);
  const steps = tourFor(currentUI);
  const step = steps[tourIdx];
  const [box, setBox] = useState<{ l: number; t: number; w: number; h: number; tipL: number; tipT: number } | null>(
    null,
  );

  useEffect(() => {
    const all = tourFor(currentUI);
    const current = all[tourIdx];
    if (!current) {
      endTour();
      return;
    }
    const el = document.querySelector(current.target);
    if (!el) {
      nextTour();
      return;
    }
    el.scrollIntoView({ block: "center", inline: "nearest" });
    const place = () => {
      const r = el.getBoundingClientRect();
      const tipW = Math.min(320, window.innerWidth - 24);
      const tipL = Math.min(Math.max(12, r.left), window.innerWidth - tipW - 12);
      let tipT = r.bottom + 12;
      if (tipT > window.innerHeight - 170) tipT = Math.max(12, r.top - 160);
      setBox({ l: r.left - 6, t: r.top - 6, w: r.width + 12, h: r.height + 12, tipL, tipT });
    };
    const t = window.setTimeout(place, 80);
    window.addEventListener("resize", place);
    return () => {
      window.clearTimeout(t);
      window.removeEventListener("resize", place);
    };
  }, [tourIdx, currentUI, endTour, nextTour]);

  if (!step) return null;
  const last = tourIdx >= steps.length - 1;
  return (
    <div className="tour-overlay show">
      {box ? <div className="tour-spot" style={{ left: box.l, top: box.t, width: box.w, height: box.h }} /> : null}
      <div className="tour-tip" style={box ? { left: box.tipL, top: box.tipT } : { left: 16, top: 16 }}>
        <h4>{step.title}</h4>
        <p>{step.body}</p>
        <div className="foot">
          <span className="count">
            {tourIdx + 1} / {steps.length}
          </span>
          <div className="btns">
            {tourIdx > 0 ? (
              <button type="button" onClick={() => prevTour()}>
                Back
              </button>
            ) : null}
            <button type="button" className="primary" onClick={() => (last ? endTour() : nextTour())}>
              {last ? "Finish" : "Next"}
            </button>
            <button type="button" onClick={() => endTour()}>
              Skip
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
