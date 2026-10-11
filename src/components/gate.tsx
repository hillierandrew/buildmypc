import { useEffect, useRef, useState } from "react";
import { PASSWORD_MAP } from "@/lib/ui-styles";
import { useBuilder } from "@/lib/store";

const SPRITE =
  "..........#######.|.........##.######|.........#########|.........#########|.........#####....|#.......######....|#......#######....|##....#########.#.|###..###########..|.################.|..##############..|...############...|....##########....|.....####..##.....|.....##....#......|.....#.....##.....".split(
    "|",
  );

export function Gate() {
  const openPw = useBuilder((s) => s.openPw);
  const closePw = useBuilder((s) => s.closePw);
  const pwOpen = useBuilder((s) => s.pwOpen);
  const unlock = useBuilder((s) => s.unlock);
  const enter = useBuilder((s) => s.enter);
  const [error, setError] = useState("");
  const [exile, setExile] = useState(false);
  const [devices, setDevices] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const dinoHits = useRef(0);
  const cactusHits = useRef(0);
  const nHits = useRef(0);
  const cHits = useRef(0);
  const pwOpenRef = useRef(pwOpen);
  const timer = useRef(0);
  const screamRef = useRef<{ stop: () => void } | null>(null);
  const [hacked, setHacked] = useState(false);
  pwOpenRef.current = pwOpen;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const g = canvas.getContext("2d");
    if (!g) return;
    let run = 0;
    let dy = 0;
    let vy = 0;
    let sc = 0;
    let dead = 0;
    const cac = [280, 520];
    let raf = 0;

    const jump = () => {
      if (pwOpenRef.current) return;
      run = 1;
      if (!dy && !vy) vy = 11;
    };

    const onPointer = (e: PointerEvent) => {
      if (pwOpenRef.current) return;
      const rect = canvas.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * canvas.width;
      const y = ((e.clientY - rect.top) / rect.height) * canvas.height;
      const onCactus = cac.some((cx) => x > cx - 8 && x < cx + 18 && y > 66 && y < 104);
      const onDino = x >= 16 && x <= 64 && y >= 36 && y <= 104;
      if (onCactus) {
        cactusHits.current += 1;
        if (cactusHits.current >= 3) {
          cactusHits.current = 0;
          enter("hub");
        }
        return;
      }
      if (onDino) {
        dinoHits.current += 1;
        if (dinoHits.current >= 3) {
          dinoHits.current = 0;
          openPw();
          return;
        }
      }
      jump();
    };
    const onKey = (e: KeyboardEvent) => {
      if (pwOpenRef.current) return;
      const tag = (e.target as HTMLElement | null)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "BUTTON") return;
      if (e.key === " " || e.key === "ArrowUp") {
        e.preventDefault();
        jump();
      }
    };
    canvas.addEventListener("pointerdown", onPointer);
    window.addEventListener("keydown", onKey);

    const frame = () => {
      g.clearRect(0, 0, 420, 110);
      g.fillStyle = dead ? "#c5221f" : "#535353";
      if (run) {
        sc += 0.15;
        for (let i = 0; i < cac.length; i += 1) {
          cac[i] = cac[i] < -30 ? cac[i] + 520 + Math.random() * 180 : cac[i] - 5;
        }
      }
      if (vy || dy) {
        dy += vy;
        vy -= 0.9;
        if (dy <= 0) {
          dy = 0;
          vy = 0;
        }
      }
      SPRITE.forEach((row, y) => {
        [...row].forEach((cell, x) => {
          if (cell === "#") g.fillRect(20 + x * 2, 70 - dy + y * 2, 2, 2);
        });
      });
      for (const x of cac) {
        g.fillRect(x, 74, 6, 25);
        g.fillRect(x - 5, 82, 5, 4);
        g.fillRect(x - 5, 82, 3, 11);
        g.fillRect(x + 6, 79, 5, 4);
        g.fillRect(x + 8, 71, 3, 11);
        if (run && dy < 16 && x < 58 && x + 16 > 24) {
          run = 0;
          sc = 0;
          dead = 14;
          cac[0] = 300;
          cac[1] = 560;
        }
      }
      if (dead) dead -= 1;
      g.fillStyle = "#535353";
      g.fillRect(0, 100, 420, 1.2);
      g.font = "12px ui-monospace, monospace";
      g.fillText(String(Math.floor(sc)).padStart(5, "0"), 360, 16);
      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);
    return () => {
      cancelAnimationFrame(raf);
      canvas.removeEventListener("pointerdown", onPointer);
      window.removeEventListener("keydown", onKey);
    };
  }, [enter, openPw]);

  useEffect(() => {
    if (!exile) return;
    const t = window.setTimeout(() => {
      const url = "https://www.bing.ca/";
      if (window.top && window.top !== window) {
        window.open(url, "_blank", "noopener,noreferrer");
        return;
      }
      window.location.href = url;
    }, 1100);
    return () => window.clearTimeout(t);
  }, [exile]);

  function submit(value: string) {
    window.clearTimeout(timer.current);
    const key = value.trim();
    const id = PASSWORD_MAP[key];
    if (id) {
      setError("");
      unlock(id);
      return;
    }
    if (!key) {
      setError("Enter a password.");
      return;
    }
    setError("ACCESS DENIED — that password is not on the list.");
    timer.current = window.setTimeout(() => setExile(true), 1100);
  }

  function hitN() {
    nHits.current += 1;
    if (nHits.current >= 3) {
      nHits.current = 0;
      useBuilder.getState().setEdition("shop");
      setDevices(true);
    }
  }

  function stopScream() {
    screamRef.current?.stop();
    screamRef.current = null;
    setHacked(false);
  }

  function startScream() {
    screamRef.current?.stop();
    const AC = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AC) return;
    const ctx = new AC();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sawtooth";
    osc.frequency.value = 180;
    gain.gain.value = 0.22;
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    let up = true;
    const id = window.setInterval(() => {
      const now = ctx.currentTime;
      osc.frequency.cancelScheduledValues(now);
      osc.frequency.setValueAtTime(up ? 160 : 920, now);
      osc.frequency.linearRampToValueAtTime(up ? 980 : 120, now + 0.16);
      up = !up;
    }, 160);
    const stop = () => {
      window.clearInterval(id);
      try {
        osc.stop();
        void ctx.close();
      } catch {
        /* already stopped */
      }
    };
    screamRef.current = { stop };
  }

  function hitO() {
    useBuilder.getState().setEdition("bench");
    enter("desk");
  }

  function hitC() {
    cHits.current += 1;
    if (cHits.current >= 10) {
      cHits.current = 0;
      startScream();
      setHacked(true);
    }
  }

  useEffect(() => {
    if (!hacked) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") stopScream();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [hacked]);

  useEffect(() => () => screamRef.current?.stop(), []);

  if (hacked) {
    return (
      <button type="button" className="hack" onClick={stopScream}>
        <span>lol you got hacked</span>
      </button>
    );
  }

  if (exile) {
    return (
      <div className="exile">
        <p className="exile-kicker">Unknown credential</p>
        <h1>ACCESS DENIED</h1>
        <p>That password is not on the list. You are being sent to Bing.</p>
        <a className="exile-go" href="https://www.bing.ca/">
          Continue to Bing
        </a>
      </div>
    );
  }

  return (
    <div className="dino">
      <div className="offline">
        <canvas ref={canvasRef} width={420} height={110} aria-label="Offline dinosaur" />
        <div id="main-message">
          <h1>
            No internet{" "}
            <button type="button" className="secret-n" onClick={hitC}>
              c
            </button>
            o
            <button type="button" className="secret-n" onClick={hitN}>
              n
            </button>
            <button type="button" className="secret-n" onClick={hitN}>
              n
            </button>
            e
            <button type="button" className="secret-n" onClick={hitC}>
              c
            </button>
            ti
            <button type="button" className="secret-n" onClick={hitO}>
              o
            </button>
            <button type="button" className="secret-n" onClick={hitN}>
              n
            </button>
          </h1>
          <p>Try:</p>
          <ul>
            <li>Checking the network cables, modem, and router</li>
            <li>Reconnecting to Wi-Fi</li>
            <li>Running Windows Network Diagnostics</li>
          </ul>
          <div className="code">ERR_INTERNET_DISCONNECTED</div>
        </div>
      </div>
      {devices ? (
        <div className="pw">
          <div className="pw-box chrome-box" role="dialog" aria-label="What device are you on">
            <button type="button" className="close" aria-label="Close" onClick={() => setDevices(false)}>
              ×
            </button>
            <h2>What device are you on?</h2>
            <p className="hint">This only picks the layout. Your parts stay with you.</p>
            <div className="device-list">
              {(
                [
                  ["phone", "iPhone"],
                  ["phone", "Android phone"],
                  ["desk", "Tablet"],
                  ["desk", "Desktop"],
                  ["phone3", "Kindle or e-reader"],
                ] as const
              ).map(([mode, label]) => (
                <button key={label} type="button" onClick={() => enter(mode)}>
                  {label}
                </button>
              ))}
            </div>
          </div>
        </div>
      ) : null}
      {pwOpen ? (
        <div className="pw">
          <form
            className="pw-box chrome-box"
            onSubmit={(e) => {
              e.preventDefault();
              const data = new FormData(e.currentTarget);
              submit(String(data.get("pw") ?? ""));
            }}
          >
            <button
              type="button"
              className="close"
              aria-label="Close"
              onClick={() => {
                window.clearTimeout(timer.current);
                setError("");
                closePw();
              }}
            >
              ×
            </button>
            <h2>System authentication</h2>
            <p className="hint">Enter an access password. Capital and lowercase are different skins.</p>
            <input
              name="pw"
              type="password"
              autoFocus
              autoComplete="off"
              enterKeyHint="done"
              placeholder="Password"
              aria-invalid={error ? true : undefined}
              aria-describedby={error ? "pw-err" : undefined}
            />
            {error ? (
              <p id="pw-err" className="pw-error" role="alert">
                {error}
              </p>
            ) : null}
            <div className="pw-actions">
              <button
                className="btn ghost"
                type="button"
                onClick={() => {
                  const el = document.activeElement;
                  if (el instanceof HTMLElement) el.blur();
                }}
              >
                Hide keyboard
              </button>
              <button className="btn primary" type="submit">
                Authenticate
              </button>
            </div>
          </form>
        </div>
      ) : null}
    </div>
  );
}
