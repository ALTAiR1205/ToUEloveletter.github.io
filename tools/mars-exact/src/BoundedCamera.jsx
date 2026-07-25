import { useEffect, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import {
  Euler,
  MathUtils,
  Matrix4,
  Quaternion,
  Vector2,
  Vector3,
} from "three";

/* 两组基准视角：信件（默认）与碎碎念（换个角度看同一片草场）。
   点按钮时相机在两者之间平滑摇过去，草场不动——只有镜头动。 */
const VIEWS = {
  letters: { azimuth: 41, polar: 73, radius: 6.5 },
  fragments: { azimuth: 9, polar: 78, radius: 6.2 },
};

const UNSEEN_PARALLAX = {
  yaw: 0.135,
  pitch: 0.035,
  roll: 0.05,
  fastLerpAt60Fps: 0.075,
  slowLerpAt60Fps: 0.02,
  pivotRatio: 0.69498,
};

/* 视角切换的插值速度（每帧 60fps 基准）。越小越慢、越有仪式感。 */
const VIEW_LERP_AT_60FPS = 0.028;

const ORIGIN = new Vector3(0, 0, 0);
const UP = new Vector3(0, 1, 0);

function computeView(v) {
  const phi = MathUtils.degToRad(v.polar);
  const theta = MathUtils.degToRad(v.azimuth);
  const position = new Vector3(
    v.radius * Math.sin(phi) * Math.sin(theta),
    v.radius * Math.cos(phi),
    v.radius * Math.sin(phi) * Math.cos(theta),
  );
  const quaternion = new Quaternion().setFromRotationMatrix(
    new Matrix4().lookAt(position, ORIGIN, UP),
  );
  return { position, quaternion };
}

export default function BoundedCamera({ view = "letters" }) {
  const pointer = useRef(new Vector2());
  const fastPointer = useRef(new Vector2());
  const slowPointer = useRef(new Vector2());

  const basePosition = useRef(new Vector3());
  const baseQuaternion = useRef(new Quaternion());
  const targetPosition = useRef(new Vector3());
  const targetQuaternion = useRef(new Quaternion());

  const cursorEuler = useRef(new Euler());
  const cursorQuaternion = useRef(new Quaternion());
  const camera = useThree((state) => state.camera);

  /* 首帧直接落在信件视角，不做动画 */
  useEffect(() => {
    const start = computeView(VIEWS.letters);
    basePosition.current.copy(start.position);
    baseQuaternion.current.copy(start.quaternion);
    targetPosition.current.copy(start.position);
    targetQuaternion.current.copy(start.quaternion);

    const handlePointerMove = (event) => {
      if (event.pointerType && event.pointerType !== "mouse") return;
      pointer.current.set(
        MathUtils.clamp((event.clientX / window.innerWidth) * 2 - 1, -1, 1),
        MathUtils.clamp(1 - (event.clientY / window.innerHeight) * 2, -1, 1),
      );
    };
    const resetPointer = () => pointer.current.set(0, 0);

    window.addEventListener("pointermove", handlePointerMove, { passive: true });
    window.addEventListener("blur", resetPointer);
    document.documentElement.addEventListener("pointerleave", resetPointer);
    return () => {
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("blur", resetPointer);
      document.documentElement.removeEventListener("pointerleave", resetPointer);
    };
  }, [camera]);

  /* 切换视图时，只更新目标；每帧向目标平滑靠近 */
  useEffect(() => {
    const next = computeView(VIEWS[view] || VIEWS.letters);
    targetPosition.current.copy(next.position);
    targetQuaternion.current.copy(next.quaternion);
  }, [view]);

  useFrame((_, delta) => {
    const frameScale = Math.min(delta * 60, 4);

    /* 基准视角向目标插值（换角度的动画） */
    const viewAlpha = 1 - Math.pow(1 - VIEW_LERP_AT_60FPS, frameScale);
    basePosition.current.lerp(targetPosition.current, viewAlpha);
    baseQuaternion.current.slerp(targetQuaternion.current, viewAlpha);

    /* 鼠标视差叠加在插值后的基准上 */
    const fastAlpha = 1 - Math.pow(1 - UNSEEN_PARALLAX.fastLerpAt60Fps, frameScale);
    const slowAlpha = 1 - Math.pow(1 - UNSEEN_PARALLAX.slowLerpAt60Fps, frameScale);
    fastPointer.current.lerp(pointer.current, fastAlpha);
    slowPointer.current.lerp(pointer.current, slowAlpha);

    camera.position.copy(basePosition.current);
    camera.quaternion.copy(baseQuaternion.current);

    /* 支点距离随半径变化（base 始终朝原点，长度即半径） */
    const pivotDistance =
      basePosition.current.length() * UNSEEN_PARALLAX.pivotRatio;
    camera.translateZ(-pivotDistance);

    cursorEuler.current.set(
      fastPointer.current.y * UNSEEN_PARALLAX.pitch,
      -fastPointer.current.x * UNSEEN_PARALLAX.yaw,
      0,
    );
    cursorQuaternion.current.setFromEuler(cursorEuler.current);
    camera.quaternion.multiply(cursorQuaternion.current);

    cursorEuler.current.set(
      0,
      0,
      -UNSEEN_PARALLAX.roll * (fastPointer.current.x - slowPointer.current.x),
    );
    cursorQuaternion.current.setFromEuler(cursorEuler.current);
    camera.quaternion.multiply(cursorQuaternion.current);

    camera.translateZ(pivotDistance);
    camera.updateMatrixWorld();
  });

  return null;
}
