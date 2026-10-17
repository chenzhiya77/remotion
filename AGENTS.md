# AGENTS.md

Remotion 视频仓库：多条独立片线共用**一个注册表**。所有 `Composition` / `Still` 都在 `src/Composition.tsx` 注册，`src/Root.tsx` 只挂载这个注册表。

## 路由表

| 路径                                               | 是什么                                                                    | 什么时候读                                                            |
| :------------------------------------------------- | :------------------------------------------------------------------------ | :-------------------------------------------------------------------- |
| `src/Composition.tsx`                              | 唯一的 Composition / Still 注册表                                         | 新增、改名、删除 composition 时                                       |
| `src/Root.tsx`                                     | 挂载 `ProjectCompositions` 的入口                                         | 排查整体挂载时                                                        |
| 根目录 `src/*.tsx`、`src/*-motion.ts`、`src/*.css` | 已有独立片线：TitleOpening、Query*、MindVoyage、Retrieval*、静态帧        | 任务点名某条旧线时                                                    |
| `src/mascot/` + `public/parts-*`                   | 共享剪纸角色 rig、manifest、落座解算与切件素材                            | 涉及角色形态、落座、坐标或切件时；这是美术源                          |
| `src/paper-frontier/shared/`                       | 纸雕世界共享层：Stage/背景、角色动作、流式文字、时间轴 config             | 做 paper-frontier 任一章时先读                                        |
| `src/paper-frontier/opening/`                      | 开场章节：Graybox 与四张 Poster Still；后续 `middle/`、`ending/` 与它并列 | 改开场画面、节拍或海报时                                              |
| `docs/specs/`                                      | 设计规格与交接稿                                                          | 需要设计意图、时值或历史决策时；先看文档 `Status`，Draft 不是实现契约 |
| `scripts/`                                         | 按片线归属的音频生成/检查脚本                                             | 要生成或校验某条线的音频时；按线匹配                                  |
| `public/` / `out/`                                 | 导入素材与音频 / 渲染产物                                                 | 找素材时读 `public/`；任务点名产物时读 `out/`（已被 gitignore）       |

## 不变量

- 新工作按 `src/<片线>/shared/` + `src/<片线>/<章节>/` 落位；`shared/` 放跨章节复用件，章节目录只放该章入口与专属实现。
- 新 Composition / Still 只在 `src/Composition.tsx` 注册一次；新 ID 用片线前缀，例如 `PaperFrontier...`。
- 片线内的修改留在本片线；旧根目录片线和 `src/mascot/` 美术件只在任务点名该线/该素材时改动。
- 闸门是 `npm run lint`（ESLint + tsc）加 `npx remotion compositions`（打包 + 注册检查）；预览用 `remotion render` / `remotion still`，仓库没有测试套件。
- 当前进度、版本号、产物文件名和视觉决策放 `docs/specs/` 或当轮任务；本文件只保留稳定约定。

## 读序

- paper-frontier 开场：`shared/config.ts` → `shared/Stage.tsx` → `shared/mascot-action.tsx` → `opening/Graybox.tsx` / `opening/Posters.tsx`。
- 旧 TitleOpening：先读 `docs/specs/` 里的开场规格 → `Opening.tsx` + `opening-motion.ts`。
- 其他片线：从 `src/Composition.tsx` 找到入口 → 入口组件 → 同名的 `*-motion.ts` / CSS。
