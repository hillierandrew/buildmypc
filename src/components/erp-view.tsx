import { useState } from "react";
import { CATS, MULTI, SLOTS, specOf } from "@/lib/catalog";
import { issueAgainstBuild } from "@/lib/compat";
import { money } from "@/lib/format";
import { currentSummary, listParts, quoteText, useBuilder } from "@/lib/store";
import type { CatId } from "@/lib/types";
import { DeviceSilhouette, PartSilhouette } from "@/components/silhouette";

const TOOLS: { name: string; pane: "home" | "parts" | "order" | "notes" }[] = [
  { name: "What's missing", pane: "home" },
  { name: "Pick parts", pane: "parts" },
  { name: "Your order", pane: "order" },
  { name: "Compatibility", pane: "notes" },
];

export function ErpView() {
  const s = useBuilder();
  const summary = currentSummary(s.cart);
  const rows = listParts(s, s.tab, s.query, "");
  const bad = summary.required.concat(summary.issues.filter((i) => i.level === "err").map((i) => i.msg));
  const n = summary.lines.reduce((a, l) => a + l.qty, 0);
  const catName = CATS.find((c) => c[0] === s.tab)?.[1] ?? "";
  const [pane, setPane] = useState<"home" | "parts" | "order" | "notes">("parts");

  async function po() {
    try {
      await navigator.clipboard.writeText(quoteText(summary));
      s.showToast("PO copied");
    } catch {
      s.showToast("Could not copy");
    }
  }

  return (
    <div id="erp">
      <header className="eh">
        <div className="elogo">
          Enterprise ERP
          <small>Resource planning</small>
        </div>
        <div className="ealert">
          {n
            ? `${n} line${n === 1 ? "" : "s"} on order${bad.length ? ` — ${bad.length} issue${bad.length === 1 ? "" : "s"}` : ""}`
            : "0 items"}
        </div>
        <select aria-label="Desk" defaultValue="PC Build Desk">
          <option>PC Build Desk</option>
        </select>
        <button type="button" className="ebtn" onClick={() => s.cycleTheme()}>
          Theme
        </button>
        <button type="button" className="ebtn" onClick={() => s.startTour()}>
          Tour
        </button>
      </header>
      <div className="etabs">
        {(
          [
            ["home", "Home"],
            ["parts", "Parts desk"],
            ["order", "Your order"],
            ["notes", "Messages"],
          ] as const
        ).map(([id, label]) => (
          <button key={id} type="button" className={`etab ${pane === id ? "on" : ""}`} onClick={() => setPane(id)}>
            {label}
          </button>
        ))}
      </div>
      <div className="erp-mobile">
        {CATS.map(([id, name]) => (
          <button type="button" key={id} className={s.tab === id ? "on" : ""} onClick={() => s.setTab(id)}>
            {name}
          </button>
        ))}
      </div>
      <div className="ebody">
        <aside className="esb">
          {TOOLS.map((tool) => (
            <button key={tool.name} type="button" className={`esi ${pane === tool.pane ? "on" : ""}`} onClick={() => setPane(tool.pane)}>
              <span className="dot" />
              {tool.name}
            </button>
          ))}
          <button type="button" className="esi" onClick={() => s.suggest()}>
            <span className="dot" />
            Suggest a build
          </button>
          <button type="button" className="esi" onClick={po}>
            <span className="dot" />
            Copy the list
          </button>
          <button type="button" className="esi" onClick={() => s.clear()}>
            <span className="dot" />
            Clear the build
          </button>
          {CATS.map(([id, name]) => (
            <button
              type="button"
              key={id}
              className={`esi ${s.tab === id ? "on" : ""}`}
              onClick={() => {
                s.setTab(id as CatId);
                setPane("parts");
              }}
            >
              <span className={`dot ${count(s.cart, id) ? "live" : ""}`} />
              {name}
            </button>
          ))}
        </aside>
        <div className="emain">
          {pane === "home" ? (
            <div className="ehome">
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
              <div className="ett">Still needed</div>
              {SLOTS.filter(([id]) => !summary.lines.some((l) => l.part.cat === id)).map(([id, name]) => (
                <button
                  key={id}
                  type="button"
                  className="ebtn"
                  onClick={() => {
                    s.setTab(id);
                    setPane("parts");
                  }}
                >
                  Add {name.toLowerCase()}
                </button>
              ))}
              {!SLOTS.some(([id]) => !summary.lines.some((l) => l.part.cat === id)) ? <p>Every category has a part.</p> : null}
            </div>
          ) : null}
          {pane === "notes" ? (
            <div className="enotes">
              <div className="ett">Compatibility</div>
              {bad.length ? (
                bad.map((m) => (
                  <p className="err" key={m}>
                    {m}
                  </p>
                ))
              ) : (
                <p>No compatibility problems in this order.</p>
              )}
            </div>
          ) : null}
          {pane === "parts" ? (
            <>
          <div className="ett">Component picking — {catName}</div>
          <div className="etool">
            <input
              id="eq"
              value={s.query}
              placeholder="Description, spec, or tag"
              onChange={(e) => s.setQuery(e.target.value)}
            />
            <label>
              Budget
              <input
                id="ebud"
                type="number"
                value={s.budget}
                onChange={(e) => s.setBudget(Number(e.target.value) || 0)}
              />
            </label>
            <button type="button" className="ebtn" onClick={() => s.suggest()}>
              Suggest
            </button>
            <button type="button" className="ebtn" onClick={() => s.clear()}>
              Clear
            </button>
          </div>
          <div className="egrid">
            <table>
              {s.tab === "pb" ? (
                <>
                  <thead>
                    <tr>
                      <th />
                      <th>Template</th>
                      <th>Group</th>
                      <th>Notes</th>
                      <th className="r">Est. price</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((p, i) =>
                      p.cat === "pb" ? (
                        <tr key={p.id} onClick={() => s.loadBuild(p.id)}>
                          <td className="n">{i + 1}</td>
                          <td>
                            <PartSilhouette part={p} />
                            <b>{p.n}</b>
                            <br />
                            {p.desc}
                          </td>
                          <td>{p.g}</td>
                          <td>{p.tags.join(", ")}</td>
                          <td className="r">{p.p.toFixed(2)}</td>
                        </tr>
                      ) : null,
                    )}
                  </tbody>
                </>
              ) : (
                <>
                  <thead>
                    <tr>
                      <th />
                      <th>Item</th>
                      <th>Key specs</th>
                      <th>Tags</th>
                      <th>Status</th>
                      <th className="r">Unit price</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((p, i) => {
                      const qty = s.cart[p.id] || 0;
                      const err = p.cat !== "pb" && !qty ? issueAgainstBuild(p, summary.lines) : "";
                      return (
                        <tr key={p.id} className={qty ? "sel" : ""} onClick={() => s.pick(p.id)}>
                          <td className="n">{i + 1}</td>
                          <td>
                            <PartSilhouette part={p} />
                            {p.n}
                          </td>
                          <td>{specOf(p)}</td>
                          <td>{p.tags.slice(0, 4).join(", ")}</td>
                          <td className={err ? "err" : ""}>
                            {qty ? `On order${qty > 1 ? ` ×${qty}` : ""}` : err ? `ERR: ${err}` : "OK"}
                          </td>
                          <td className="r">{p.p.toFixed(2)}</td>
                        </tr>
                      );
                    })}
                    {!rows.length ? (
                      <tr>
                        <td colSpan={6}>0 records.</td>
                      </tr>
                    ) : null}
                  </tbody>
                </>
              )}
            </table>
          </div>
            </>
          ) : null}
          {pane === "order" || pane === "parts" ? (
          <div className="eord" id="eord">
            <div className="ett">Sales order lines</div>
            <table>
              <thead>
                <tr>
                  <th />
                  <th>Description</th>
                  <th>Category</th>
                  <th>Qty</th>
                  <th className="r">Unit</th>
                  <th className="r">Line</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {SLOTS.flatMap(([id, name]) =>
                  summary.lines
                    .filter((l) => l.part.cat === id)
                    .map((l, i) => (
                      <tr key={l.part.id}>
                        <td className="n">{i + 1}</td>
                        <td>{l.part.n}</td>
                        <td>{name}</td>
                        <td>
                          {MULTI[id] ? (
                            <>
                              <button type="button" className="lk" onClick={() => s.dec(l.part.id)}>
                                −
                              </button>{" "}
                              {l.qty}{" "}
                              <button type="button" className="lk" onClick={() => s.add(l.part.id)}>
                                +
                              </button>
                            </>
                          ) : (
                            l.qty
                          )}
                        </td>
                        <td className="r">{l.part.p.toFixed(2)}</td>
                        <td className="r">{(l.part.p * l.qty).toFixed(2)}</td>
                        <td>
                          <button type="button" className="lk" onClick={() => s.del(l.part.id)}>
                            Remove
                          </button>
                        </td>
                      </tr>
                    )),
                )}
                {!summary.lines.length ? (
                  <tr>
                    <td colSpan={7}>No lines yet.</td>
                  </tr>
                ) : null}
              </tbody>
            </table>
            <div className="esum">
              {summary.c}C / {summary.t}T · {summary.v}GB VRAM · {summary.r}GB RAM · {summary.nvme} NVMe · {summary.sata}{" "}
              SATA
              {summary.mb ? ` · board ${summary.mb.m2} M.2 / ${summary.mb.sata} SATA / ${summary.mb.dimm} DIMM` : ""} ·
              Subtotal {money(summary.tot)} · Total {money(summary.tot * 1.13)}{" "}
              <button type="button" className="ebtn" onClick={po}>
                Generate PO
              </button>
              {bad.map((m) => (
                <div className="err" key={m}>
                  ERR: {m}
                </div>
              ))}
            </div>
          </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}

function count(cart: Record<string, number>, id: string) {
  return Object.keys(cart).some((k) => k.startsWith(`${id}-`));
}
