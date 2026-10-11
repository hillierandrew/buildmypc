import { useEffect, useState } from "react";
import { CATS, REQUIRED, specOf } from "@/lib/catalog";
import { issueAgainstBuild } from "@/lib/compat";
import { money } from "@/lib/format";
import { currentSummary, listParts, useBuilder } from "@/lib/store";
import type { CatId, Part } from "@/lib/types";

export function DeviceBuilder() {
  const s = useBuilder();
  const summary = currentSummary(s.cart);
  const parts = listParts(s, s.tab, s.query, "");
  const [cursor, setCursor] = useState(0);
  const [buildOpen, setBuildOpen] = useState(s.layoutMode === "tablet");
  const mode = s.layoutMode;
  const done = REQUIRED.filter(([id]) => summary.lines.some((line) => line.part.cat === id)).length;
  const pct = Math.round((done / REQUIRED.length) * 100);
  const index = parts.length ? Math.min(cursor, parts.length - 1) : 0;
  const current = parts[index];

  useEffect(() => {
    setCursor(0);
  }, [s.tab, s.query]);

  function goCat(step: number) {
    const ids = CATS.map(([id]) => id);
    const at = ids.indexOf(s.tab);
    s.setTab(ids[(at + step + ids.length) % ids.length]);
  }

  function add(part: Part) {
    if (part.cat !== "pb" && issueAgainstBuild(part, summary.lines)) return;
    if (part.cat === "pb") s.loadBuild(part.id);
    else s.pick(part.id);
  }

  const list = (
    <ul className="dev-list">
      {parts.map((part, i) => {
        const reason = part.cat !== "pb" && !s.cart[part.id] ? issueAgainstBuild(part, summary.lines) : "";
        const on = mode === "berry" ? i === index : !!s.cart[part.id];
        return (
          <li key={part.id} className={`${on ? "on" : ""} ${reason ? "incompatible-greyed-out" : ""}`}>
            <button type="button" disabled={!!reason} onClick={() => (mode === "berry" ? setCursor(i) : add(part))}>
              <b>{part.n}</b>
              <span>{specOf(part)}</span>
              <em>{money(part.p)}</em>
              {reason ? <small>{reason}</small> : s.cart[part.id] ? <small>In the build</small> : null}
            </button>
          </li>
        );
      })}
      {!parts.length ? <li className="empty">Nothing in this list.</li> : null}
    </ul>
  );

  const page = current ? (
    <article className="dev-page">
      <p>
        {index + 1} of {parts.length}
      </p>
      <h2>{current.n}</h2>
      <p>{specOf(current)}</p>
      <p className="dev-price">{money(current.p)}</p>
      {current.cat !== "pb" && issueAgainstBuild(current, summary.lines) ? (
        <p className="dev-warn">{issueAgainstBuild(current, summary.lines)}</p>
      ) : (
        <p>{s.cart[current.id] ? "Already in the build." : "This part fits."}</p>
      )}
    </article>
  ) : (
    <p className="empty">Nothing in this list.</p>
  );

  const build = (
    <aside className="dev-build">
      <h2>Your build · {pct}%</h2>
      <ol>
        {REQUIRED.map(([id, name]) => (
          <li key={id} className={summary.lines.some((line) => line.part.cat === id) ? "on" : ""}>
            {name}
          </li>
        ))}
      </ol>
      {summary.lines.map((line) => (
        <button key={line.part.id} type="button" onClick={() => s.del(line.part.id)}>
          Remove {line.part.n}
        </button>
      ))}
      {!summary.lines.length ? <p>Nothing picked yet.</p> : <p>Total {money(summary.tot)}</p>}
    </aside>
  );

  return (
    <div className={`device-ui d-${mode}`}>
      <header className="dev-head">
        <b>{pct}% complete</b>
        <label>
          Category
          <select value={s.tab} onChange={(e) => s.setTab(e.target.value as CatId)}>
            {CATS.map(([id, name]) => (
              <option key={id} value={id}>
                {name}
              </option>
            ))}
          </select>
        </label>
        <input value={s.query} placeholder="Search" onChange={(e) => s.setQuery(e.target.value)} />
      </header>
      <div className={mode === "tablet" ? "dev-split" : "dev-main"}>
        {mode === "phone3" ? page : list}
        {mode === "tablet" || buildOpen ? build : null}
      </div>
      <div className="dev-bar">
        {mode === "phone3" ? (
          <>
            <button type="button" onClick={() => setCursor((n) => Math.max(0, n - 1))}>
              Previous
            </button>
            <button type="button" onClick={() => current && add(current)} disabled={!current || (current.cat !== "pb" && !!issueAgainstBuild(current, summary.lines))}>
              Add this
            </button>
            <button type="button" onClick={() => setCursor((n) => Math.min(parts.length - 1, n + 1))}>
              Next
            </button>
          </>
        ) : null}
        {mode === "berry" ? (
          <>
            <button type="button" onClick={() => setCursor((n) => Math.max(0, n - 1))}>
              Up
            </button>
            <button type="button" onClick={() => setCursor((n) => Math.min(parts.length - 1, n + 1))}>
              Down
            </button>
            <button type="button" onClick={() => current && add(current)} disabled={!current || (current.cat !== "pb" && !!issueAgainstBuild(current, summary.lines))}>
              Choose
            </button>
          </>
        ) : null}
        <button type="button" onClick={() => goCat(-1)}>
          Previous category
        </button>
        <button type="button" onClick={() => goCat(1)}>
          Next category
        </button>
        {mode !== "tablet" ? (
          <button type="button" onClick={() => setBuildOpen((v) => !v)}>
            {buildOpen ? "Hide build" : "Show build"}
          </button>
        ) : null}
      </div>
    </div>
  );
}
