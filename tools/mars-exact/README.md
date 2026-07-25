# VEGALTAIR V9 · Mars Field

V9 当前只使用 Mars 草场作为 3D 场景底座。生产构建输出到
`../../demo/mars-exact/`，旧的 `demo/unseen.html` 只负责把原地址转到这里。

## 鼠标视差相机

相机设置集中在 `src/BoundedCamera.jsx`：

- 初始视角：水平 41°、垂直 73°、距离 6.5。
- 相机距离始终固定为 6.5，滚轮不能缩放。
- 不使用拖动控制；鼠标位置直接驱动相机视角。
- 左右最大偏移约 7.7°，上下最大偏移约 2°。
- 相机围绕镜头前方约 69.5% 距离的近端支点运动，而不是绕草场中心公转。
- 快、慢两层鼠标缓动形成平滑跟随，并在移动时产生很轻的动态侧倾。
- 鼠标离开页面或窗口失去焦点时，镜头会平滑回到初始构图。
- 变化只发生在相机上，草场模型不会移动。

以后想调整跟随幅度或速度，只需要修改 `INITIAL_VIEW` 和
`UNSEEN_PARALLAX`，不必碰其他 3D 代码。

## V9 场景质感层

- `src/SpatialTitle.jsx` 把 `VEGA / ALTAiR` 先渲染到低分辨率纹理，再贴到
  固定在 3D 世界中的平面上。它不是网页文字，也不会始终朝向相机。
- `src/V9PostProcessing.jsx` 使用很轻的五采样径向色散、桶形畸变、暗角和
  动态颗粒；Bloom 已降低到只修饰真正的高光。
- 标题字体是项目原本就在使用的 Instrument Serif，字体文件本地托管，
  完整的 SIL OFL 1.1 授权保存在 `public/assets/fonts/`。

远景维持 Mars 原始场景与 SkyDome，不再使用程序化延伸地形、简化草或
环形山体。以后若需要补远景，应制作与原 GLB 同风格的专用资产。

## 本地运行

```powershell
pnpm run dev
```

## 构建

```powershell
pnpm run build
```

Mars 场景来自 Christian Ortiz 的
[`stylized-components`](https://github.com/cortiz2894/stylized-components)，
按 MIT License 使用；完整授权文本与第三方说明保存在本项目中。
