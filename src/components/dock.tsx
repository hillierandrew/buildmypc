import { useEffect, useRef, useState } from "react";
import { KeyRound, Pause, Play, Volume2, VolumeX } from "lucide-react";
import { useBuilder } from "@/lib/store";
import { styleById, UI_STYLES } from "@/lib/ui-styles";

export function Dock() {
  const currentUI = useBuilder((s) => s.currentUI);
  const setUI = useBuilder((s) => s.setUI);
  const cycleUI = useBuilder((s) => s.cycleUI);
  const basicMode = useBuilder((s) => s.basicMode);
  const setBasic = useBuilder((s) => s.setBasic);
  const showToast = useBuilder((s) => s.showToast);
  const openModal = useBuilder((s) => s.openModal);
  const [open, setOpen] = useState(false);
  const [badge, setBadge] = useState(true);
  const tone = useRoomTone();
  const style = styleById(currentUI);

  useEffect(() => {
    setBadge(true);
    const t = window.setTimeout(() => setBadge(false), 4200);
    return () => window.clearTimeout(t);
  }, [currentUI]);

  return (
    <div className="dock">
      <div className={`badge ${badge ? "show" : ""}`} aria-live="polite">
        <span>{style.title}</span>
        <small>{style.password}</small>
      </div>
      <div id="musicCtl">
        <button type="button" title={tone.on ? "Pause" : "Play room tone"} onClick={() => void tone.toggle()}>
          {tone.on ? <Pause className="ico" aria-hidden /> : <Play className="ico" aria-hidden />}
        </button>
        <button type="button" title={tone.muted ? "Unmute" : "Mute"} onClick={() => tone.setMuted(!tone.muted)}>
          {tone.muted || tone.vol === 0 ? <VolumeX className="ico" aria-hidden /> : <Volume2 className="ico" aria-hidden />}
        </button>
        <input
          type="range"
          min={0}
          max={100}
          value={Math.round(tone.vol * 100)}
          aria-label="Volume"
          onChange={(e) => tone.setVol(Number(e.target.value) / 100)}
        />
      </div>
      <div id="modeToggle">
        <button
          type="button"
          className={basicMode ? "on" : ""}
          onClick={() => {
            setBasic(true);
            showToast("Basic mode");
          }}
        >
          Basic
        </button>
        <button
          type="button"
          className={!basicMode ? "on" : ""}
          onClick={() => {
            setBasic(false);
            showToast("Advanced mode");
          }}
        >
          Advanced
        </button>
      </div>
      <div className="pillrow">
        <button type="button" id="keysBtn" className="dock-key" title="Password keyring" onClick={() => openModal("keys")}>
          <KeyRound className="ico" aria-hidden />
          <span>Keys</span>
        </button>
        <div id="uiPill" className={open ? "" : "collapsed"}>
          <button type="button" id="pcBtn" className="pcBtn" title="Next skin" onClick={() => cycleUI()}>
            <span className="globe-emoji" aria-hidden>
              🌍
            </span>
          </button>
          <button
            type="button"
            className="pill-toggle"
            aria-expanded={open}
            title={open ? "Hide skins" : "Show skins"}
            onClick={() => setOpen((v) => !v)}
          >
            {open ? "×" : "Skins"}
          </button>
          <div className="main">
            {UI_STYLES.map((u) => (
              <button
                type="button"
                key={u.id}
                className={`uiBtn ${currentUI === u.id ? "active" : ""}`}
                title={`${u.title} — ${u.password}`}
                onClick={() => {
                  if (currentUI !== u.id) setUI(u.id);
                }}
              >
                <span aria-hidden>🌍</span>
                <em>{u.id}</em>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function useRoomTone() {
  const ctx = useRef<AudioContext | null>(null);
  const gain = useRef<GainNode | null>(null);
  const [on, setOn] = useState(false);
  const [muted, setMuted] = useState(false);
  const [vol, setVolState] = useState(0.35);

  const setVol = (v: number) => {
    setVolState(v);
    if (gain.current) gain.current.gain.value = muted ? 0 : v * 0.12;
  };

  const applyMute = (m: boolean) => {
    setMuted(m);
    if (gain.current) gain.current.gain.value = m ? 0 : vol * 0.12;
  };

  const ensure = () => {
    if (ctx.current) return ctx.current;
    const c = new AudioContext();
    const g = c.createGain();
    g.gain.value = muted ? 0 : vol * 0.12;
    const filter = c.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.value = 420;
    const a = c.createOscillator();
    const b = c.createOscillator();
    a.type = "sine";
    b.type = "triangle";
    a.frequency.value = 98;
    b.frequency.value = 146.8;
    a.connect(filter);
    b.connect(filter);
    filter.connect(g);
    g.connect(c.destination);
    a.start();
    b.start();
    ctx.current = c;
    gain.current = g;
    return c;
  };

  const toggle = async () => {
    const c = ensure();
    if (c.state === "suspended" || !on) {
      await c.resume();
      setOn(true);
    } else {
      await c.suspend();
      setOn(false);
    }
  };

  return { on, muted, vol, toggle, setMuted: applyMute, setVol };
}
