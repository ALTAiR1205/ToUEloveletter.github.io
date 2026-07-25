import { forwardRef, useEffect, useMemo } from "react";
import {
  Bloom,
  EffectComposer,
  ToneMapping,
} from "@react-three/postprocessing";
import {
  BlendFunction,
  Effect,
  ToneMappingMode,
} from "postprocessing";
import { Uniform } from "three";

const screenFragmentShader = /* glsl */ `
  uniform float uTime;
  uniform float uChroma;
  uniform float uBend;
  uniform float uGrain;
  uniform float uVignette;

  float hash12(vec2 p) {
    vec3 p3 = fract(vec3(p.xyx) * 0.1031);
    p3 += dot(p3, p3.yzx + 33.33);
    return fract((p3.x + p3.y) * p3.z);
  }

  vec2 bentUv(vec2 uv) {
    vec2 p = uv * 2.0 - 1.0;
    float radius2 = dot(p, p);
    p *= 1.0 + uBend * radius2;
    return p * 0.5 + 0.5;
  }

  void mainImage(
    const in vec4 inputColor,
    const in vec2 uv,
    out vec4 outputColor
  ) {
    vec2 sampleUv = bentUv(uv);
    vec2 fromCenter = sampleUv - 0.5;
    float radius2 = dot(fromCenter, fromCenter);
    vec2 chroma = fromCenter * radius2 * uChroma;

    // Five restrained samples: the separation mostly appears near the lens
    // edge, while the centre (and therefore the title) remains legible.
    vec4 c0 = texture2D(inputBuffer, clamp(sampleUv, 0.001, 0.999));
    vec4 c1 = texture2D(inputBuffer, clamp(sampleUv + chroma * 1.5, 0.001, 0.999));
    vec4 c2 = texture2D(inputBuffer, clamp(sampleUv + chroma * 0.5, 0.001, 0.999));
    vec4 c3 = texture2D(inputBuffer, clamp(sampleUv - chroma * 0.5, 0.001, 0.999));
    vec4 c4 = texture2D(inputBuffer, clamp(sampleUv - chroma * 1.5, 0.001, 0.999));

    vec3 color = vec3(c1.r, (c0.g + c2.g + c3.g) / 3.0, c4.b);
    color = mix(color, c0.rgb, 0.64);

    // Unseen's finish is low-contrast and slightly hazy, rather than a hard
    // game-like grade. Keep this correction intentionally small.
    float luminance = dot(color, vec3(0.2126, 0.7152, 0.0722));
    color = mix(vec3(luminance), color, 0.95);
    color = (color - 0.5) * 0.965 + 0.505;

    float vignette = smoothstep(0.98, 0.22, length(uv - 0.5) * 1.32);
    color *= mix(1.0 - uVignette, 1.0, vignette);

    // Positive, fine-grained film noise, kept well below the official
    // amplitude because the Mars palette is already highly saturated.
    float grain = hash12(gl_FragCoord.xy + vec2(uTime * 61.7, uTime * 37.1));
    color += grain * uGrain;

    outputColor = vec4(color, c0.a);
  }
`;

class UnseenScreenEffect extends Effect {
  constructor() {
    super("UnseenScreenEffect", screenFragmentShader, {
      blendFunction: BlendFunction.NORMAL,
      uniforms: new Map([
        ["uTime", new Uniform(0)],
        ["uChroma", new Uniform(0.018)],
        ["uBend", new Uniform(-0.018)],
        ["uGrain", new Uniform(0.014)],
        ["uVignette", new Uniform(0.045)],
      ]),
    });
  }

  update(_renderer, _inputBuffer, deltaTime) {
    this.uniforms.get("uTime").value += deltaTime;
  }
}

const UnseenScreenPass = forwardRef(function UnseenScreenPass(
  _props,
  ref,
) {
  const effect = useMemo(() => new UnseenScreenEffect(), []);

  useEffect(() => () => effect.dispose(), [effect]);

  return <primitive ref={ref} object={effect} dispose={null} />;
});

export default function V9PostProcessing() {
  return (
    <EffectComposer multisampling={4} enableNormalPass={false}>
      <Bloom
        mipmapBlur
        intensity={0.075}
        radius={0.42}
        luminanceThreshold={0.78}
        luminanceSmoothing={0.24}
      />
      <ToneMapping mode={ToneMappingMode.ACES_FILMIC} middleGrey={0.62} />
      <UnseenScreenPass />
    </EffectComposer>
  );
}
