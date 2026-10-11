import { useRef, useState } from "react";
import { t } from "@/lib/i18n";
import { useBuilder, type LayoutMode } from "@/lib/store";
import "./configurator.css";

const COLOURS = [
  ["light", "paper"],
  ["dark", "night"],
  ["green", "green"],
  ["blue", "blue"],
  ["red", "red"],
] as const;

const SIZES: [LayoutMode, string][] = [
  ["desk", "sizeDesk"],
  ["phone", "sizePhone"],
  ["tablet", "sizeTablet"],
  ["tv", "sizeTv"],
];

function sizeOn(mode: LayoutMode, id: LayoutMode) {
  if (id === "desk") return mode === "desk" || mode === "browser";
  if (id === "tablet") return mode === "tablet";
  if (id === "tv") return mode === "tv" || mode === "console";
  return mode === "phone" || mode === "phone2" || mode === "phone3" || mode === "android" || mode === "ds" || mode === "berry";
}

export function EasyBar() {
  const lang = useBuilder((s) => s.lang);
  const theme = useBuilder((s) => s.themeCycle);
  const layout = useBuilder((s) => s.layoutMode);
  const setThemeMode = useBuilder((s) => s.setThemeMode);
  const setLayout = useBuilder((s) => s.setLayout);
  const showToast = useBuilder((s) => s.showToast);
  const [open, setOpen] = useState(false);
  const [playing, setPlaying] = useState(false);
  const audio = useRef<HTMLAudioElement>(null);
  const look = theme === "dark" || theme === "green" || theme === "blue" || theme === "red" ? theme : "";

  function toggleMusic() {
    const el = audio.current;
    if (!el) return;
    if (!el.paused) {
      el.pause();
      setPlaying(false);
      return;
    }
    el.play().then(
      () => setPlaying(true),
      () => {
        setPlaying(false);
        showToast(t(lang, "noMusic"));
      },
    );
  }

  return (
    <div className={`easy-bar ${look}`.trim()} dir={lang === "ur" ? "rtl" : "ltr"}>
      <audio
        ref={audio}
        src="dreams.mp3"
        preload="none"
        loop
        onPause={() => setPlaying(false)}
        onPlay={() => setPlaying(true)}
      />
      {open ? (
        <div className="easy-panel">
          <p>{t(lang, "colour")}</p>
          <div className="easy-swatches">
            {COLOURS.map(([id, key]) => (
              <button key={id} type="button" className={`swatch ${id} ${theme === id ? "on" : ""}`} aria-pressed={theme === id} onClick={() => setThemeMode(id)}>
                {t(lang, key)}
              </button>
            ))}
          </div>
          <p>{t(lang, "size")}</p>
          <div className="easy-sizes">
            {SIZES.map(([id, key]) => (
              <button key={id} type="button" className={sizeOn(layout, id) ? "on" : ""} aria-pressed={sizeOn(layout, id)} onClick={() => setLayout(id)}>
                {t(lang, key)}
              </button>
            ))}
          </div>
        </div>
      ) : null}
      <button type="button" className={playing ? "on" : ""} aria-pressed={playing} onClick={toggleMusic}>
        {playing ? t(lang, "pause") : t(lang, "play")}
      </button>
      <button type="button" className={open ? "on" : ""} aria-expanded={open} onClick={() => setOpen((v) => !v)}>
        {t(lang, "look")}
      </button>
    </div>
  );
}
