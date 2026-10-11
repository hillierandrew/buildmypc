import { useEffect, useState } from "react";
import { DISGUISE_KEYS } from "@/lib/disguises";
import { LAYOUT_CHOICES, useBuilder } from "@/lib/store";
import { styleById } from "@/lib/ui-styles";
import { Bench } from "@/components/bench";
import { Configurator } from "@/components/configurator";
import { EasyBar } from "@/components/easy-bar";
import { Gate } from "@/components/gate";
import { Disguise, Toast } from "@/components/overlays";

export function Shell() {
  const unlocked = useBuilder((s) => s.unlocked);
  const erp = useBuilder((s) => s.erp);
  const surface = useBuilder((s) => s.surface);
  const currentUI = useBuilder((s) => s.currentUI);
  const themeCycle = useBuilder((s) => s.themeCycle);
  const layoutMode = useBuilder((s) => s.layoutMode);
  const edition = useBuilder((s) => s.edition);
  const basicMode = useBuilder((s) => s.basicMode);
  const disguise = useBuilder((s) => s.disguise);
  const modal = useBuilder((s) => s.modal);
  const tourOn = useBuilder((s) => s.tourOn);
  const setDisguise = useBuilder((s) => s.setDisguise);
  const closeModal = useBuilder((s) => s.closeModal);
  const endTour = useBuilder((s) => s.endTour);

  const style = styleById(currentUI);
  const picker = Boolean(style.picker);
  const simple = layoutMode === "phone3" || layoutMode === "android" || layoutMode === "tablet" || layoutMode === "berry";
  const themeClass =
    themeCycle === "light" ? "t-light" : themeCycle === "neon" ? "t-neon" : themeCycle === "dark-erp" ? "t-erp" : "";

  useEffect(() => {
    const root = document.documentElement;
    const vv = window.visualViewport;
    const apply = () => {
      const height = vv?.height ?? window.innerHeight;
      const offset = vv?.offsetTop ?? 0;
      const kb = Math.max(0, Math.round(window.innerHeight - height - offset));
      root.style.setProperty("--app-top", `${Math.round(offset)}px`);
      root.style.setProperty("--app-h", `${Math.round(height)}px`);
      root.style.setProperty("--kb", `${kb}px`);
      root.classList.toggle("kb-open", kb > 80);
    };
    apply();
    vv?.addEventListener("resize", apply);
    vv?.addEventListener("scroll", apply);
    window.addEventListener("resize", apply);
    const onFocus = (e: FocusEvent) => {
      const t = e.target;
      if (!(t instanceof HTMLInputElement || t instanceof HTMLTextAreaElement || t instanceof HTMLSelectElement)) return;
      window.setTimeout(() => t.scrollIntoView({ block: "center", inline: "nearest" }), 280);
    };
    document.addEventListener("focusin", onFocus);
    return () => {
      vv?.removeEventListener("resize", apply);
      vv?.removeEventListener("scroll", apply);
      window.removeEventListener("resize", apply);
      document.removeEventListener("focusin", onFocus);
    };
  }, []);

  useEffect(() => {
    if (!unlocked) document.title = "No internet connection";
    else if (edition === "bench") document.title = "Shelf";
    else if (erp) document.title = "Sales Order - ERP";
    else if (picker) document.title = "BuildMyPC Parts List";
    else document.title = "BuildMyPC";
  }, [unlocked, erp, picker, edition]);

  useEffect(() => {
    if (!unlocked) return;
    let buf = "";
    const onKey = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      const tag = (e.target as HTMLElement | null)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;
      if (e.key === "Escape") {
        if (useBuilder.getState().disguise) setDisguise(null);
        else if (useBuilder.getState().modal) closeModal();
        else if (useBuilder.getState().tourOn) endTour();
        return;
      }
      if (e.key.length !== 1 || !/[a-z]/i.test(e.key)) return;
      buf = (buf + e.key.toLowerCase()).slice(-24);
      for (const key of DISGUISE_KEYS) {
        if (buf.includes(key)) {
          setDisguise(key);
          buf = "";
          break;
        }
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [unlocked, disguise, modal, tourOn, setDisguise, closeModal, endTour]);

  const cls = [
    "stage",
    style.cls,
    themeClass,
    layoutMode !== "desk" && layoutMode !== "tablet" && layoutMode !== "tv" && layoutMode !== "console" && layoutMode !== "browser"
      ? "mobile-touch"
      : "",
    layoutMode === "phone2" ? "eats" : "",
    layoutMode === "phone3" ? "eink" : "",
    layoutMode === "android" ? "d-android" : "",
    layoutMode === "tablet" ? "d-tablet" : "",
    layoutMode === "tv" ? "d-tv" : "",
    layoutMode === "console" ? "d-console" : "",
    layoutMode === "ds" ? "d-ds" : "",
    layoutMode === "berry" ? "d-berry" : "",
    layoutMode === "browser" ? "d-browser" : "",
    basicMode ? "basic-mode" : "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div className={cls}>
      {!unlocked ? (
        <Gate />
      ) : (
        <>
          {edition === "bench" ? (
            <Bench />
          ) : (
            <>
              <Configurator />
              <EasyBar />
            </>
          )}
        </>
      )}
      {disguise ? <Disguise /> : null}
      <Toast />
      <KeyboardDone />
    </div>
  );
}

function hideKeyboard() {
  const el = document.activeElement;
  if (el instanceof HTMLElement) el.blur();
}

function KeyboardDone() {
  return (
    <button type="button" className="kb-dismiss" onClick={hideKeyboard}>
      Hide keyboard
    </button>
  );
}

function LayoutSwitch() {
  const mode = useBuilder((s) => s.layoutMode);
  const setLayout = useBuilder((s) => s.setLayout);
  const [open, setOpen] = useState(false);
  return (
    <div className={`layout-dock ${open ? "open" : ""}`}>
      <button type="button" className="layout-dock-go" aria-expanded={open} onClick={() => setOpen((v) => !v)}>
        Layouts
      </button>
      {open ? (
        <div className="layout-dock-list" role="group" aria-label="Layouts">
          {LAYOUT_CHOICES.map((item) => (
            <button
              key={item.id}
              type="button"
              className={mode === item.id ? "on" : ""}
              aria-pressed={mode === item.id}
              onClick={() => setLayout(item.id)}
            >
              {item.label}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}

function GlobeCycle() {
  const currentUI = useBuilder((s) => s.currentUI);
  const cycleUI = useBuilder((s) => s.cycleUI);
  const showToast = useBuilder((s) => s.showToast);
  const style = styleById(currentUI);
  return (
    <button
      type="button"
      id="globeBtn"
      className="globe-btn theme-btn"
      title={`${style.title}. Change the art style. Your parts stay.`}
      aria-label={`Theme. Current look ${style.title}. Switch art style.`}
      onClick={() => {
        cycleUI();
        const next = styleById(useBuilder.getState().currentUI);
        showToast(next.title);
      }}
    >
      Theme
    </button>
  );
}
