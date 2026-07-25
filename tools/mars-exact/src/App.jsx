import { Suspense, useCallback, useState } from "react";
import { Canvas } from "@react-three/fiber";
import { useProgress } from "@react-three/drei";
import { Leva } from "leva";
import { PCFSoftShadowMap } from "three";
import ExactMarsScene from "./ExactMarsScene";
import { SKY_PRESETS } from "./vendor/skyDome/constants";
import LegacyV9UI from "./LegacyV9UI";

function ProgressOverlay({ ready, legacyUi }) {
  const { progress } = useProgress();

  if (legacyUi) {
    return (
      <div
        className={`loading legacy-loading ${ready ? "is-ready" : ""}`}
      >
        <div className="legacy-loading-number">
          {String(Math.round(progress)).padStart(3, "0")}
        </div>
        <div className="legacy-loading-label">
          VEGALTAIR® — LOADING MARS WORLD
        </div>
      </div>
    );
  }

  return (
    <div className={`loading ${ready ? "is-ready" : ""}`}>
      <p>
        正在载入 V9 · {legacyUi ? "INITIAL UI × MARS" : "Mars 草场"}
      </p>
      <div>
        <i style={{ transform: `scaleX(${Math.max(0.04, progress / 100)})` }} />
      </div>
      <span>{Math.round(progress)}%</span>
    </div>
  );
}

export default function App() {
  const legacyUi =
    new URLSearchParams(window.location.search).get("look") === "legacy-ui";
  const [ready, setReady] = useState(false);
  const [skyFilter, setSkyFilter] = useState(SKY_PRESETS.day.filter);
  /* view: "letters"（默认·白天） | "fragments"（碎碎念·黄昏+换角度） */
  const [view, setView] = useState("letters");
  const toggleView = useCallback(
    () => setView((v) => (v === "letters" ? "fragments" : "letters")),
    [],
  );
  const handleReady = useCallback(() => setReady(true), []);

  return (
    <main className={`exact-mars ${legacyUi ? "is-legacy-ui" : ""}`}>
      <Leva hidden />

      <Canvas
        className="scene-canvas"
        shadows={{ type: PCFSoftShadowMap }}
        camera={{ position: [8, 6, 8], fov: 50, near: 0.1, far: 3000 }}
        gl={{
          antialias: true,
          alpha: false,
          powerPreference: "high-performance",
        }}
        dpr={1.2}
        style={{
          background: "#0d1a10",
          position: legacyUi ? "fixed" : "relative",
          inset: legacyUi ? 0 : undefined,
          zIndex: 0,
        }}
      >
        <Suspense fallback={null}>
          <ExactMarsScene
            legacyUi={legacyUi}
            view={view}
            onLoaded={handleReady}
            onSkyPreset={(preset) => setSkyFilter(preset.filter)}
          />
        </Suspense>
      </Canvas>

      <div
        className="sky-filter"
        style={{
          backgroundColor: skyFilter.color,
          opacity: skyFilter.opacity,
        }}
        aria-hidden="true"
      />

      <h1 className="sr-only">
        VEGA ALTAiR · Love Universe · To Du Ye
      </h1>

      {legacyUi ? (
        <LegacyV9UI view={view} onToggleView={toggleView} />
      ) : (
        <>
          <header>
            <div>
              <strong>V9</strong>
              <span>LOVE UNIVERSE · MARS FIELD</span>
            </div>
            <a className="look-switch" href="?look=legacy-ui">
              查看初版 UI 融合
            </a>
          </header>

          <footer>
            <a href="../../index.html">VEGALTAiR</a>
            <a
              href="https://github.com/cortiz2894/stylized-components"
              target="_blank"
              rel="noreferrer"
            >
              MARS SCENE · CHRISTIAN ORTIZ (CORTIZ) · MIT
            </a>
          </footer>
        </>
      )}

      <ProgressOverlay ready={ready} legacyUi={legacyUi} />
    </main>
  );
}
