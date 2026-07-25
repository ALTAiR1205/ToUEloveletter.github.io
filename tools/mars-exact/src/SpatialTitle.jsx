import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal, useFrame, useThree } from "@react-three/fiber";
import { Text, useFBO } from "@react-three/drei";
import {
  Color,
  DoubleSide,
  MathUtils,
  Matrix4,
  Object3D,
  OrthographicCamera,
  Quaternion,
  Scene,
  Vector2,
  Vector3,
} from "three";

const base = import.meta.env.BASE_URL;
const REGULAR_FONT = `${base}assets/fonts/InstrumentSerif-Regular.ttf`;
const ITALIC_FONT = `${base}assets/fonts/InstrumentSerif-Italic.ttf`;

// The title is a texture on a fixed plane in the world, not a DOM overlay and
// not a billboard. This mirrors the important part of Unseen's approach:
// camera movement changes the perspective of the title just like any object.
const BASE_CAMERA_POSITION = new Vector3(4.078, 1.9, 4.691);
const ORIGINAL_TITLE_POSITION = new Vector3(0.55, 1.05, 0.62);

// Keep the same on-screen composition while lifting the title out of the
// grass: move it 55% closer along the exact camera-to-title ray and shrink it
// by the same ratio. Perspective therefore preserves its apparent size, while
// the lowest glyph stays about 0.3 world units above the tallest grass tips
// across the full width of the title.
const TITLE_DEPTH_RATIO = 0.45;
const TITLE_WORLD = BASE_CAMERA_POSITION.clone().lerp(
  ORIGINAL_TITLE_POSITION,
  TITLE_DEPTH_RATIO,
);
const TITLE_POSITION = TITLE_WORLD.toArray();
const TITLE_SCALE = 0.9 * TITLE_DEPTH_RATIO;

// 每个视图的相机基准位（与 BoundedCamera 一致，都朝原点看）。
const CAMERA_VIEWS = {
  letters: { azimuth: 41, polar: 73, radius: 6.5 },
  fragments: { azimuth: 9, polar: 78, radius: 6.2 },
};
const ORIGIN = new Vector3(0, 0, 0);
const UP = new Vector3(0, 1, 0);

function camPosition(v) {
  const phi = MathUtils.degToRad(v.polar);
  const theta = MathUtils.degToRad(v.azimuth);
  return new Vector3(
    v.radius * Math.sin(phi) * Math.sin(theta),
    v.radius * Math.cos(phi),
    v.radius * Math.sin(phi) * Math.cos(theta),
  );
}
function camQuaternion(pos) {
  return new Quaternion().setFromRotationMatrix(
    new Matrix4().lookAt(pos, ORIGIN, UP),
  );
}

// 信件视角下标题的世界朝向：正是现有代码 lookAt(相机) + rotateY(-0.12) 的结果。
const _titleProbe = new Object3D();
_titleProbe.position.copy(TITLE_WORLD);
_titleProbe.lookAt(BASE_CAMERA_POSITION);
_titleProbe.rotateY(-0.12);
_titleProbe.updateMatrixWorld();
const TITLE_WORLD_QUAT = _titleProbe.quaternion.clone();

// 把标题“相对信件相机”的位置/朝向抽出来，套到任意视角，保持相同构图。
const _lettersCamPos = camPosition(CAMERA_VIEWS.letters);
const _lettersCamQuat = camQuaternion(_lettersCamPos);
const _lettersCamQuatInv = _lettersCamQuat.clone().invert();
const TITLE_LOCAL_POS = TITLE_WORLD.clone()
  .sub(_lettersCamPos)
  .applyQuaternion(_lettersCamQuatInv);
const TITLE_LOCAL_QUAT = _lettersCamQuatInv.clone().multiply(TITLE_WORLD_QUAT);

function titleTargetFor(view) {
  const camPos = camPosition(CAMERA_VIEWS[view] || CAMERA_VIEWS.letters);
  const camQuat = camQuaternion(camPos);
  const position = TITLE_LOCAL_POS.clone()
    .applyQuaternion(camQuat)
    .add(camPos);
  const quaternion = camQuat.clone().multiply(TITLE_LOCAL_QUAT);
  return { position, quaternion };
}

const TITLE_TARGETS = {
  letters: titleTargetFor("letters"),
  fragments: titleTargetFor("fragments"),
};
// 交叉淡出淡入的时长（秒）：淡出 → 隐形时换字并转场 → 淡入。
// 三段合计 ≈ 相机换视角的时间，让镜头转到位时新标题正好浮现。
const FADE_OUT_DUR = 0.4;
const FADE_HOLD_DUR = 0.55;
const FADE_IN_DUR = 0.55;

const planeVertexShader = /* glsl */ `
  varying vec2 vUv;

  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const planeFragmentShader = /* glsl */ `
  uniform sampler2D uTitle;
  uniform float uTime;
  uniform float uOpacity;
  uniform vec2 uPointer;
  varying vec2 vUv;

  float maskAt(vec2 uv) {
    return texture2D(uTitle, clamp(uv, 0.001, 0.999)).a;
  }

  void main() {
    vec2 pointerUv = uPointer * 0.5 + 0.5;
    float pointerFalloff = smoothstep(0.42, 0.0, distance(vUv, pointerUv));

    // A deliberately tiny, slow displacement. The official site uses a fluid
    // texture; these two waves preserve the soft living edge without turning
    // the title into a wobbly special effect.
    vec2 flow = vec2(
      sin(vUv.y * 13.0 + uTime * 0.22),
      cos(vUv.x * 11.0 - uTime * 0.18)
    );
    flow *= 0.00075 + pointerFalloff * 0.0024;

    float core = maskAt(vUv + flow);
    float pink = maskAt(vUv + flow + vec2(0.0018, 0.0005));
    float blue = maskAt(vUv + flow - vec2(0.0015, 0.0007));
    float fringe = max(abs(pink - core), abs(blue - core));

    // A thin separation layer keeps the pale face legible over both bright
    // grass and dark tree trunks without looking like a CSS text shadow.
    float shadow = maskAt(vUv + flow + vec2(-0.0042, 0.0048));
    float spread = max(
      max(maskAt(vUv + flow + vec2(0.0032, 0.0)),
          maskAt(vUv + flow - vec2(0.0032, 0.0))),
      max(maskAt(vUv + flow + vec2(0.0, 0.0032)),
          maskAt(vUv + flow - vec2(0.0, 0.0032)))
    );
    float shadowOnly = clamp(shadow - core, 0.0, 1.0);
    float haloOnly = clamp(spread - max(core, shadowOnly), 0.0, 1.0);

    // Pearlescent face: warm at the lower edge, cooler in the highlights.
    vec3 pearlLow = vec3(0.72, 0.50, 0.64);
    vec3 pearlHigh = vec3(1.00, 0.86, 0.93);
    vec3 pearl = mix(pearlLow, pearlHigh, smoothstep(0.18, 0.82, vUv.y));
    float bevelHint =
      maskAt(vUv + flow + vec2(-0.0012, 0.0012)) -
      maskAt(vUv + flow - vec2(-0.0012, 0.0012));
    pearl *= 0.96 + bevelHint * 0.16;

    vec3 plumShadow = vec3(0.12, 0.045, 0.13);
    vec3 softHalo = vec3(0.95, 0.70, 0.88);
    vec3 fluidPink = vec3(0.933, 0.725, 0.965);
    vec3 fluidBlue = vec3(0.615, 0.690, 1.000);
    float colorAmount = fringe * (0.18 + pointerFalloff * 0.72);
    vec3 color = softHalo;
    color = mix(color, plumShadow, smoothstep(0.02, 0.55, shadowOnly));
    color = mix(color, pearl, smoothstep(0.025, 0.7, core));
    color = mix(
      color,
      mix(fluidPink, fluidBlue, vUv.x),
      colorAmount * 0.72
    );

    float alpha = max(
      core * 0.995,
      max(shadowOnly * 0.48, haloOnly * 0.22)
    );
    alpha = max(alpha, max(pink, blue) * 0.18);
    alpha *= uOpacity;
    if (alpha < 0.002) discard;
    gl_FragColor = vec4(color, alpha);
  }
`;

/* 两套悬浮标题。信件=VEGA/ALTAiR（星名）；碎碎念=英文占位词
   （Instrument Serif 无中文字形，标题层暂用英文；措辞可随时改）。 */
const TITLE_SETS = {
  letters: { eyebrow: "LOVE UNIVERSE · TO DU YE", top: "VEGA", bottom: "ALTAiR" },
  fragments: {
    eyebrow: "PASSING THOUGHTS · TO DU YE",
    top: "SOFT",
    bottom: "murmurs",
  },
};

function TitleTexture({ scene, view = "letters" }) {
  const mobileScale = useThree(({ size }) =>
    Math.min(1, Math.max(0.68, size.width / Math.max(size.height, 1))),
  );
  const set = TITLE_SETS[view] || TITLE_SETS.letters;

  return createPortal(
    <group scale={mobileScale}>
      <Text
        font={REGULAR_FONT}
        sdfGlyphSize={128}
        fontSize={0.16}
        letterSpacing={0.14}
        anchorX="center"
        anchorY="middle"
        position={[0, 1.03, 0]}
        color="white"
        outlineWidth={0.002}
        outlineColor="white"
      >
        {set.eyebrow}
      </Text>

      <Text
        font={REGULAR_FONT}
        sdfGlyphSize={128}
        fontSize={1.34}
        letterSpacing={-0.035}
        anchorX="center"
        anchorY="middle"
        position={[-0.16, 0.46, 0]}
        color="white"
        outlineWidth={0.009}
        outlineColor="white"
      >
        {set.top}
      </Text>

      <Text
        font={ITALIC_FONT}
        sdfGlyphSize={128}
        fontSize={1.3}
        letterSpacing={-0.045}
        anchorX="center"
        anchorY="middle"
        position={[0.08, -0.72, 0]}
        color="white"
        outlineWidth={0.009}
        outlineColor="white"
      >
        {set.bottom}
      </Text>
    </group>,
    scene,
  );
}

export default function SpatialTitle({ fadeOnScroll = false, view = "letters" }) {
  const groupRef = useRef();
  const materialRef = useRef();
  const [titleScene] = useState(() => new Scene());
  const [titleCamera] = useState(() => {
    const camera = new OrthographicCamera(-3.2, 3.2, 2, -2, 0.1, 20);
    camera.position.z = 10;
    return camera;
  });
  const target = useFBO(768, 512, {
    depthBuffer: true,
    stencilBuffer: false,
    samples: 0,
  });
  const responsiveScale = useThree(({ size }) =>
    Math.min(1, Math.max(0.68, size.width / Math.max(size.height, 1))),
  );

  const uniforms = useMemo(
    () => ({
      uTitle: { value: target.texture },
      uTime: { value: 0 },
      uOpacity: { value: 1 },
      uPointer: { value: new Vector2() },
    }),
    [target.texture],
  );

  /* 交叉淡出淡入：旧标题原位淡出 → 透明时换字并瞬移到新视角中心 → 淡入。
     displayView 滞后于 view，让贴图在淡出完成前仍显示旧文字。 */
  const [displayView, setDisplayView] = useState(view);
  const fade = useRef(1); // 视角切换引起的透明度 0..1
  const phase = useRef("idle"); // idle | out | hold | in
  const holdTime = useRef(0);

  useEffect(() => {
    if (!groupRef.current) return;
    /* 首挂载直接落到当前视角，不做动画 */
    if (!groupRef.current.userData.inited) {
      const t = TITLE_TARGETS[view] || TITLE_TARGETS.letters;
      groupRef.current.position.copy(t.position);
      groupRef.current.quaternion.copy(t.quaternion);
      groupRef.current.userData.inited = true;
      return;
    }
    /* 之后每次切换视角：启动淡出（位置先不动） */
    phase.current = "out";
    holdTime.current = 0;
  }, [view]);

  useFrame((state, delta) => {
    const { gl, pointer } = state;
    const d = Math.min(delta, 0.05); // 掉帧保护

    /* 视角切换的淡出→换字瞬移→淡入 状态机 */
    if (phase.current === "out") {
      fade.current -= d / FADE_OUT_DUR;
      if (fade.current <= 0) {
        fade.current = 0;
        const t = TITLE_TARGETS[view] || TITLE_TARGETS.letters;
        if (groupRef.current) {
          groupRef.current.position.copy(t.position); // 瞬移到新视角中心
          groupRef.current.quaternion.copy(t.quaternion);
        }
        setDisplayView(view); // 透明时换字
        phase.current = "hold";
        holdTime.current = 0;
      }
    } else if (phase.current === "hold") {
      holdTime.current += d;
      if (holdTime.current >= FADE_HOLD_DUR) phase.current = "in";
    } else if (phase.current === "in") {
      fade.current += d / FADE_IN_DUR;
      if (fade.current >= 1) {
        fade.current = 1;
        phase.current = "idle";
      }
    }

    const oldTarget = gl.getRenderTarget();
    const oldAutoClear = gl.autoClear;
    const oldAlpha = gl.getClearAlpha();
    const oldColor = gl.getClearColor(new Color());

    gl.autoClear = true;
    gl.setRenderTarget(target);
    gl.setClearColor(0x000000, 0);
    gl.clear(true, true, true);
    gl.render(titleScene, titleCamera);
    gl.setRenderTarget(oldTarget);
    gl.setClearColor(oldColor, oldAlpha);
    gl.autoClear = oldAutoClear;

    if (materialRef.current) {
      materialRef.current.uniforms.uTime.value += delta;
      materialRef.current.uniforms.uPointer.value.set(pointer.x, pointer.y);
      const scrollFade = fadeOnScroll
        ? 1 -
          Math.min(
            1,
            Math.max(
              0,
              window.scrollY / Math.max(window.innerHeight * 0.82, 1),
            ),
          )
        : 1;
      materialRef.current.uniforms.uOpacity.value =
        scrollFade * scrollFade * fade.current;
    }
  });

  return (
    <>
      <TitleTexture scene={titleScene} view={displayView} />

      <group
        ref={groupRef}
        position={TITLE_POSITION}
        quaternion={TITLE_TARGETS.letters.quaternion.toArray()}
        scale={responsiveScale * TITLE_SCALE}
      >
        <mesh frustumCulled={false}>
          <planeGeometry args={[5.4, 3.6]} />
          <shaderMaterial
            ref={materialRef}
            uniforms={uniforms}
            vertexShader={planeVertexShader}
            fragmentShader={planeFragmentShader}
            transparent
            depthTest
            depthWrite={false}
            side={DoubleSide}
            toneMapped={false}
          />
        </mesh>
      </group>
    </>
  );
}
