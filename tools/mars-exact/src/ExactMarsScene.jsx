import { useCallback, useMemo, useState } from "react";
import GrassField from "./vendor/grassField";
import SkyDome from "./vendor/skyDome/SkyDome";
import { SKY_PRESETS } from "./vendor/skyDome/constants";
import GrassLighting from "./vendor/GrassLighting";
import ShadowController from "./vendor/ShadowController";
import BoundedCamera from "./BoundedCamera";
import SpatialTitle from "./SpatialTitle";
import V9PostProcessing from "./V9PostProcessing";

const base = import.meta.env.BASE_URL;

export default function ExactMarsScene({
  legacyUi = false,
  view = "letters",
  onLoaded,
  onSkyPreset,
}) {
  const skyMode = view === "fragments" ? "sunset" : "day";
  const [activePreset, setActivePreset] = useState(SKY_PRESETS.day);
  const [bakeSignal, setBakeSignal] = useState(0);
  const grassUrl = `${base}assets/grass-scene.glb`;

  // The vendor preset was tuned as a component showcase. Pulling the fill
  // light down slightly restores shape and colour separation for a full-screen
  // composition without changing the original grass shaders.
  const lightingPreset = useMemo(
    () => ({
      ...activePreset,
      light: {
        ...activePreset.light,
        ambientIntensity: 1.35,
        dirIntensity: 2.45,
      },
    }),
    [activePreset],
  );

  const handlePreset = useCallback(
    (preset) => {
      setActivePreset(preset);
      onSkyPreset?.(preset);
    },
    [onSkyPreset],
  );

  const handleLoaded = useCallback(() => {
    setBakeSignal((value) => value + 1);
    onLoaded?.();
  }, [onLoaded]);

  return (
    <>
      <BoundedCamera view={view} />
      <GrassLighting preset={lightingPreset} />
      <ShadowController rebakeSignal={bakeSignal} />

      <SkyDome
        defaultMode="day"
        targetMode={skyMode}
        onPresetChange={handlePreset}
      />

      <GrassField
        preset="mars"
        url={grassUrl}
        barkTextures={[
          `${base}assets/textures/bark/bark_color.png`,
          `${base}assets/textures/bark/bark_AO.png`,
          `${base}assets/textures/bark/bark_height.png`,
        ]}
        flowerTexturesA={[
          `${base}assets/textures/flower/flowers.png`,
          `${base}assets/textures/flower/flowersRGB.png`,
          `${base}assets/textures/flower/flowersGradient.png`,
        ]}
        flowerTexturesB={[
          `${base}assets/textures/flower3/flowers.png`,
          `${base}assets/textures/flower3/flowersRGB.png`,
          `${base}assets/textures/flower3/flowersGradient.png`,
        ]}
        onLoaded={handleLoaded}
      />

      <SpatialTitle fadeOnScroll={legacyUi} view={view} />
      <V9PostProcessing />
    </>
  );
}
