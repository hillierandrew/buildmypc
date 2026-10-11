import { useEffect, useMemo } from "react";
import { CATS, DB, MULTI, specOf } from "@/lib/catalog";
import { issueAgainstBuild } from "@/lib/compat";
import { money, TAX } from "@/lib/format";
import { currentSummary, listParts, quoteText, useBuilder } from "@/lib/store";
import type { CatId, Part } from "@/lib/types";

const ORDER: CatId[] = ["cpu", "cooler", "mb", "ram", "ssd", "gpu", "case", "psu", "fan", "sound", "nic", "os"];

const LABEL: Record<string, string> = Object.fromEntries(CATS.map(([id, name]) => [id, name]));

export function PickerView() {
  const s = useBuilder();
  const summary = currentSummary(s.cart);
  const tab: CatId = s.tab === "pb" ? "cpu" : s.tab;
  const parts = useMemo(() => listParts({ ...s, tab }, tab, s.query, ""), [s, tab]);

  useEffect(() => {
    if (s.tab === "pb") s.setTab("cpu");
  }, [s.tab, s.setTab]);

  const tax = Math.round(summary.tot * TAX * 100) / 100;
  const grand = summary.tot + tax;
  const errs = summary.issues.filter((i) => i.level === "err");

  async function copyQuote() {
    try {
      await navigator.clipboard.writeText(quoteText(summary));
      s.showToast("Quote copied");
    } catch {
      s.showToast("Could not copy the quote");
    }
  }

  function shop() {
    if (!summary.lines.length) {
      s.showToast("Add parts first");
      return;
    }
    const q = summary.lines.map((l) => l.part.n.split(" ").slice(0, 4).join(" ")).join(", ");
    window.open(`https://www.amazon.ca/s?k=${encodeURIComponent(q)}`, "_blank", "noopener,noreferrer");
  }

  return (
    <div id="picker-app">
      <header className="picker-top">
        <div className="picker-brand">
          <span className="picker-mark" aria-hidden />
          <span>
            BUILD LIST
            <small>BuildMyPC parts table</small>
          </span>
        </div>
        <input
          id="pickerSearch"
          className="picker-search"
          value={s.query}
          placeholder="Search this category"
          onChange={(e) => s.setQuery(e.target.value)}
          enterKeyHint="search"
          onKeyDown={(e) => {
            if (e.key === "Enter") (e.target as HTMLInputElement).blur();
          }}
        />
        <label className="picker-budget">
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
      </header>

      <div className="picker-actions">
        <button type="button" className="suggest" data-action="suggest" onClick={() => s.suggest()}>
          Suggest
        </button>
        <button type="button" onClick={() => s.openModal("components")}>
          All parts
        </button>
        <button type="button" onClick={() => s.openModal("bench")}>
          Benchmarks
        </button>
        <button type="button" onClick={() => s.openModal("saves")}>
          Save
        </button>
        <button type="button" onClick={() => s.openModal("compare")}>
          Compare
        </button>
        <button type="button" onClick={shop}>
          Amazon
        </button>
        <button type="button" onClick={() => void copyQuote()}>
          Copy quote
        </button>
        <button type="button" onClick={() => s.startTour()}>
          Tour
        </button>
        <button type="button" className="danger" onClick={() => s.clear()}>
          Clear
        </button>
      </div>

      <div className="picker-table-wrap">
        <table className="picker-table">
          <thead>
            <tr>
              <th>Component</th>
              <th>Selection</th>
              <th>Price</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {ORDER.map((cat) => {
              const lines = summary.lines.filter((l) => l.part.cat === cat);
              if (!lines.length) {
                return (
                  <tr key={cat} className={tab === cat ? "on" : ""}>
                    <td>{LABEL[cat]}</td>
                    <td>
                      <button type="button" className="choose" onClick={() => s.setTab(cat)}>
                        Choose a {LABEL[cat]}
                      </button>
                    </td>
                    <td />
                    <td />
                  </tr>
                );
              }
              return lines.map((l) => (
                <tr key={l.part.id} className={tab === cat ? "on" : ""}>
                  <td>{LABEL[cat]}</td>
                  <td>
                    <button type="button" className="sel-name" onClick={() => s.setTab(cat)}>
                      {l.part.n}
                      <small>{specOf(l.part)}</small>
                    </button>
                  </td>
                  <td className="r">{money(l.part.p * l.qty)}</td>
                  <td className="qty">
                    {MULTI[cat] ? (
                      <span className="qtyc">
                        <button type="button" aria-label="Decrease" onClick={() => s.dec(l.part.id)}>
                          −
                        </button>
                        <span>{l.qty}</span>
                        <button type="button" aria-label="Increase" onClick={() => s.add(l.part.id)}>
                          +
                        </button>
                      </span>
                    ) : (
                      <button type="button" className="rm" onClick={() => s.del(l.part.id)}>
                        Remove
                      </button>
                    )}
                  </td>
                </tr>
              ));
            })}
          </tbody>
          <tfoot>
            <tr>
              <td colSpan={2}>
                Estimated wattage {summary.watts}W
                {summary.psu ? ` · supply ${summary.psu.w}W` : ""}
                {summary.mb ? ` · M.2 ${summary.nvme}/${summary.mb.m2} · SATA ${summary.sata}/${summary.mb.sata}` : ""}
              </td>
              <td className="r">{money(summary.tot)}</td>
              <td />
            </tr>
            <tr>
              <td colSpan={2}>Ontario HST {Math.round(TAX * 100)}%</td>
              <td className="r">{money(tax)}</td>
              <td />
            </tr>
            <tr className="grand">
              <td colSpan={2}>Total</td>
              <td className="r">{money(grand)}</td>
              <td />
            </tr>
          </tfoot>
        </table>
      </div>

      <div id="compatPanel" className={`picker-notes ${errs.length || summary.required.length ? "bad" : "ok"}`}>
        {!summary.lines.length ? <span>Choose a component to start a list.</span> : null}
        {summary.required.map((m) => (
          <span key={m}>{m}</span>
        ))}
        {summary.issues.map((m) => (
          <span key={m.msg} className={m.level}>
            {m.msg}
          </span>
        ))}
        {summary.lines.length && !errs.length && !summary.required.length ? <span>No hard conflicts in this list.</span> : null}
      </div>

      <div className="picker-products">
        <div className="picker-catbar">
          {ORDER.map((cat) => (
            <button type="button" key={cat} className={tab === cat ? "on" : ""} onClick={() => s.setTab(cat)}>
              {LABEL[cat]}
              <i>{count(s.cart, cat)}</i>
            </button>
          ))}
        </div>
        <div className="picker-scroll">
          <table>
            <thead>
              <tr>
                <th>{LABEL[tab]}</th>
                <th>Specs</th>
                <th>Price</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {parts.map((p) => (
                <ProductRow key={p.id} p={p} />
              ))}
              {!parts.length ? (
                <tr>
                  <td colSpan={4}>Nothing in this category matches the search.</td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function count(cart: Record<string, number>, cat: CatId) {
  let n = 0;
  for (const [id, qty] of Object.entries(cart)) {
    if (DB[cat].some((p) => p.id === id)) n += qty;
  }
  return n;
}

function ProductRow({ p }: { p: Part }) {
  const s = useBuilder();
  const summary = currentSummary(s.cart);
  const qty = s.cart[p.id] || 0;
  if (p.cat === "pb") return null;
  const block = !qty ? issueAgainstBuild(p, summary.lines) : "";
  return (
    <tr className={qty ? "sel" : block ? "dis" : ""}>
      <td>{p.n}</td>
      <td>
        {specOf(p)}
        {block ? <small className="block">{block}</small> : null}
      </td>
      <td className="r">{money(p.p)}</td>
      <td>
        {qty && MULTI[p.cat] ? (
          <span className="qtyc">
            <button type="button" aria-label="Decrease" onClick={() => s.dec(p.id)}>
              −
            </button>
            <span>{qty}</span>
            <button type="button" aria-label="Increase" onClick={() => s.add(p.id)}>
              +
            </button>
          </span>
        ) : (
          <button type="button" className={qty ? "in" : "add"} onClick={() => s.pick(p.id)}>
            {qty ? "Remove" : "Add"}
          </button>
        )}
      </td>
    </tr>
  );
}
