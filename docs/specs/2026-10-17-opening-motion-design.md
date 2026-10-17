# TitleOpening (9s) 开场动画重设计规格: 一镜到底 · 高处同行流式叙事 · 落下跑动追马跃乘

- **Date**: 2026-10-17
- **Status**: Draft (待审阅拍板后开工)
- **Baseline HEAD**: `4109a5b` (`feat(video): 48s 落库片源码线首次入库`, 开场线 4 个核心文件当前为工作树未跟踪状态)
- **Target Composition**: `TitleOpening` (`1920x1080`, `60fps`, `540 frames / 9.0s`, 见 [src/Composition.tsx:22-29](file:///E:/app/python/agent/remotion/src/Composition.tsx#L22))

---

## 1. 目标 (Goal)

将当前「排队式触发、道具定格、背景空洞、工程小字出戏」的 9 秒开场,重构为具有电影叙事感与场面调度 (Mise-en-scène) 的一镜到底开场:

1. **高处左鸭右文同行 + 流式提问叙事**: 鸭子开场位于屏幕中上方偏左位置,与右侧同一行的流式主叙事文字 (`"什么是 Harness RAG？"` → `"这是一场关于知识的旅程"`) 处于同一视觉水平带; 净空右上角地址、工程十字网格与上下英文小字。
2. **双线同动 + 马全程不停步**: 马从 `t = 0.0s` 起即从左侧地面迈步入画 (不等待文字出完), 全程保持向右行进 (`dx/dt > 0`), 彻底消除 `0..0.8s` 画外死等与 `3.15..5.5s` 驻停死等。
3. **高处落下 + 落地跑动追马 + 动态跃乘**: 保留鸭子从高处落下、眨眼换眼态 (`think -> wuyu -> zhuangsha -> normal`) 与触地挤压回弹 (`cushion`) 的核心角色戏份; 触地回弹后**零停顿**, 立即向右侧行进中的马**助跑追赶 (`Run-up`)**, 借跑动动量斜抛跃起, 落入正在前行中的马鞍并同步骑乘右行拉幕。
4. **活体「知识世界」场面调度**: 构建远景破晓体积光 + 中景漂浮知识手稿切片 (受骏马掠过气流吹拂偏转) + 近景散焦光尘与世界坐标马蹄微尘的三层视差原野, 让世界每一帧都在呼吸。

---

## 2. 背景与现状核查 (截至 HEAD `4109a5b` 工作树快照)

| 病灶分类 | 现象与视觉缺陷 | 源码位置与当前实现 |
| :--- | :--- | :--- |
| **1. 排队触发与两段死等**<br>*(Queued Timing & Dead Holds)* | ① `0.0..0.8s` 马在画外静止 (`x = -1500`), 等标题先淡入;<br>② `3.15..5.50s` 马停死在 `HORSE_PARK_X = 920` 长达 `2.35s`;<br>③ `3.50..4.20s` 鸭子落地后原地定格 `0.70s` 等起跳。 | • [src/opening-motion.ts:47-52](file:///E:/app/python/agent/remotion/src/opening-motion.ts#L47) (`STOMP_TIME = 3.05`, `FALL_START = 3.25`, `IMPACT = 3.5`, `MOUNT_START = 4.2`, `TOUCHDOWN = 5.4`, `WALK_OUT = 5.5`)<br>• [src/opening-motion.ts:61-65](file:///E:/app/python/agent/remotion/src/opening-motion.ts#L61) (`horseX`) |
| **2. 停步段马腿相位倒退抽搐**<br>*(Walk Phase Reversal)* | `walkPhase` 用绝对时间乘衰减系数 `(time * 1.9 * inSlope) % 1`, 在 `2.98..3.15s` `inSlope` 从 `1 -> 0` 时相位随时间倒退, 导致马腿在停步瞬间反向高频抽动。 | • [src/opening-motion.ts:67-71](file:///E:/app/python/agent/remotion/src/opening-motion.ts#L67) (`walkPhase`)<br>• [src/opening-motion.ts:79-100](file:///E:/app/python/agent/remotion/src/opening-motion.ts#L79) (`horseSpec`) |
| **3. 悬空标尺道具定格与居中挤压**<br>*(Static Prop & Center Crowding)* | 鸭子开场放在 `DUCK_SCREEN_X = 820`、`PEDESTAL_Y = 677`, 踩在一根死板的工程标尺 `.op-pedestal` 上干等 3 秒, 且与居中大标题 (`left: 960, top: 206`) 上下分离。 | • [src/opening-motion.ts:26-27](file:///E:/app/python/agent/remotion/src/opening-motion.ts#L26) (`DUCK_SCREEN_X = 820`, `HOVER_TY = -735`)<br>• [src/opening-motion.ts:40](file:///E:/app/python/agent/remotion/src/opening-motion.ts#L40) (`PEDESTAL_Y`)<br>• [src/Opening.tsx:154-184](file:///E:/app/python/agent/remotion/src/Opening.tsx#L154) (`.op-title`, `.op-pedestal`) |
| **4. 舞台小字与工程线出戏**<br>*(Immersion-breaking Clutter)* | 画面堆叠右上角两行 GitHub 地址、标题上下两行全大写工程小字 (`KNOWLEDGE ENGINE · PROLOGUE` / `STRUCTURED INGESTION...`)、4 组十字准星与中轴虚线。 | • [src/Opening.tsx:43-46](file:///E:/app/python/agent/remotion/src/Opening.tsx#L43) (`ADDRESSES`)<br>• [src/Opening.tsx:131-153](file:///E:/app/python/agent/remotion/src/Opening.tsx#L131) (`.op-editorial-grid`)<br>• [src/Opening.tsx:163-169](file:///E:/app/python/agent/remotion/src/Opening.tsx#L163) (`.op-kicker`, `.op-subtitle`)<br>• [src/Opening.tsx:185-192](file:///E:/app/python/agent/remotion/src/Opening.tsx#L185) (`.op-addresses`) |
| **5. 除角色外世界完全静止**<br>*(Empty World / No Mise-en-scène)* | 背景只有 3 个低透明度椭圆渐变 (`.op-mist-a/b/c`) 与 1 根 `3px` 直线 (`.op-ground`), 无空间纵深、无知识意象环境物、无角色与环境的气流/接触反馈。 | • [src/Opening.tsx:113-130](file:///E:/app/python/agent/remotion/src/Opening.tsx#L113) (`.op-mist`)<br>• [src/opening.css:36-61](file:///E:/app/python/agent/remotion/src/opening.css#L36) |

---

## 3. 术语表 (Glossary)

| 术语 | 含义与在本片中的落点 |
| :--- | :--- |
| **场面调度 (Mise-en-scène)** | 画面内一切视觉元素的空间组织与景深层次。在本片中指「远景破晓体积光 + 中景漂浮手稿切片 + 主舞台角色与流式叙事 + 近景散焦光尘」的四层空间。 |
| **环境叙事 (Environmental Storytelling)** | 不靠说明性小字, 而靠场景内的物体传递世界观。在本片中指漂浮的**知识手稿残页、章节印记与星轨弧线**, 预示即将揭开的 RAG 知识工程世界。 |
| **重叠动作 (Overlapping Action)** | 多个元素在同一时间窗口各自按自身节奏运动, 前一动作未停、后一动作已起。在本片中指「马从 `0s` 入画 + 高处流式提问 + 鸭子思考→落下→跑动追马→跃乘→续写第二句」全程交叠推进。 |
| **次级动作与活物感 (Secondary Motion & Alive Feel)** | 角色即使不在做主位移时, 也有呼吸、眨眼、视线跟随、衣帽/手部微摆; 环境物体受角色运动气流影响产生连锁反应 (马奔过吹动漂浮手稿)。 |

---

## 4. 核心设计 (Design Specification)

### 4.1 空间构图: 上中央「左鸭右流式文字」同行 + 下方地面奔马

```
+-----------------------------------------------------------------------------------+ 1920x1080
| [远景] 破晓斜射体积光束 (God Rays) + 知识星轨暗纹                                  |
|                                                                                   |
|    🦆 鸭子高处站位            "什么是 Harness RAG ？"                              | y ≈ 270
|   (x=340, 脚踩流光书卷托羽)   "这是一场关于知识的旅程"  (同行流式浮现 + 游标牵引)    | (上中央同行带)
|         │                                                                         |
|         │ ① 落下 (1.80s..2.12s, 眨眼切 wuyu -> zhuangsha)                         |
|         ▼                                                                         |
|   [中景] 漂浮的知识手稿残页 (随风微摆, 马掠过时受气流吹拂向右上翻飞)                |
|                                                                                   |
| ════════🐎 马从 t=0.0s 左入, 全程向右奔跑不停═══▶ [② 鸭落地跑动追马] ──▶ [③ 跃乘] ═| y = 980 (地面线)
|   [近景] 世界坐标马蹄微尘向后飘散 + 前景散焦光尘 (Bokeh)                           |
+-----------------------------------------------------------------------------------+
```

1. **高处同行带 (`y ≈ 270px`)**:
   - **鸭子开场位置**: 屏幕靠左 `DUCK_HOVER_SCREEN_X = 340`, `HOVER_TY = -1680` (对应屏幕脚底 `HOOF/BOOT_Y ≈ 340px`, 身体中心约在 `y = 265px`, 与右侧主叙事文字严格处于同一水平视觉带)。
   - **高处承托物**: 废除死板的工程标尺 `.op-pedestal`, 改为一缕**随流式文字生长而轻盈浮动的微光手稿托羽 (`.op-glyph-perch`)**, 在鸭子迈步跃下 (`t = 1.80s`) 时自然化作两缕书页光尘散开, 不再有「道具定格干等」的感觉。
   - **流式主叙事区 (`.op-stream-copy`)**: 左边缘起于 `x = 490px` (紧接高处鸭子右侧 `150px`), 垂直居中对齐 `y = 268px`, 分两句流式展开 (逐词组带 `blur(8px) -> 0`、`translateY(10px) -> 0` 与微光引导游标)。

### 4.2 文案与舞台元素「原文 → 改成」对照表

| 位置 | 原文 / 原元素 ([src/Opening.tsx](file:///E:/app/python/agent/remotion/src/Opening.tsx)) | 改成 | 理由与用例影响 |
| :--- | :--- | :--- | :--- |
| 主标题区<br>([src/Opening.tsx:154-170](file:///E:/app/python/agent/remotion/src/Opening.tsx#L154)) | `KNOWLEDGE ENGINE · PROLOGUE`<br>`harness / RAG`<br>`STRUCTURED INGESTION · ENTITY RESOLUTION · GROUNDED WIKI` | **流式第一句 (`0.12s .. 1.95s`)**:<br>`什么是 Harness RAG ？`<br>**流式第二句 (`2.15s .. 4.45s`)**:<br>`这是一场关于知识的旅程`<br>*(⚠️ 标点与分词节奏为我拟的默认排法, 见 §5 待裁项 D1; 只影响 `src/Opening.tsx` 1 处)* | 将静态工程封面改为与角色动作咬合的电影流式提问; 原 `check-opening.mjs` 只检 `titleState(t).opacity`, 改为检两段流式进度 `streamState(t)`。 |
| 右上角地址<br>([src/Opening.tsx:43-46](file:///E:/app/python/agent/remotion/src/Opening.tsx#L43), [185-192](file:///E:/app/python/agent/remotion/src/Opening.tsx#L185)) | `github.com/chenzhiya77/DeepDuck`<br>`github.com/chenzhiya77/deer-flow` | **删除** | 消除出戏的小字干扰。 |
| 十字准星网格<br>([src/Opening.tsx:131-153](file:///E:/app/python/agent/remotion/src/Opening.tsx#L131)) | `.op-editorial-grid` (中轴虚线 + 4 组十字准星) | **删除** | 消除工程图纸感, 让位于三层知识原野场景。 |
| 悬空标尺<br>([src/Opening.tsx:171-184](file:///E:/app/python/agent/remotion/src/Opening.tsx#L171)) | `.op-pedestal` (带左右刻度竖线的标尺横梁) | 替换为**流光手稿托羽 `.op-glyph-perch`** (随呼吸起伏, 鸭跃下时化光消散) | 消除「死板道具定格」感。 |

---

### 4.3 五拍连续运动时间线与数学契约 ([src/opening-motion.ts](file:///E:/app/python/agent/remotion/src/opening-motion.ts))

整段 `9.0s` 内, **马的速度 $v_{\text{horse}}(t) > 0$ 恒成立 (全程无驻停死等)**, 鸭子经历 **「高处思考 (`Hover`) → 失衡落下 (`Fall`) → 落地回弹 (`Cushion`) → 跑动追马 (`Run-up`) → 跃上行进中的马 (`Dynamic Mount`) → 骑乘右行拉幕 (`Ride & Reveal`)」**:

| 拍号 | 时间窗口 | 马的运动 (`horseX(t)`) | 鸭子的运动 (`seatTransform(t)` & `duckSpec(t)`) | 流式文字与场景 (`streamState(t)`) |
| :--- | :--- | :--- | :--- | :--- |
| **Beat 1**<br>双线启动 | `0.00s .. 1.80s` | 从 `t = 0.0s` 起即由 `x = -980` 向右奔入 (不等标题!), 在 `t = 1.80s` 抵达 `x = 180` (马头已进入鸭子正下方区域)。 | 站在左上高处 (`screenX = 340, screenY ≈ 340`), 眼态在 `0.25s` 眨眼切为 `think`; 身体随呼吸轻摆, 右手微抬朝向右侧正在流式生成的字句。 | 第一句 **「什么是 Harness RAG ？」** 按词组从左向右流式浮现 (`0.12s .. 1.85s`); 远景体积光与中景手稿随风缓慢漂移。 |
| **Beat 2**<br>高处落下 + 回弹 | `1.80s .. 2.38s` | 马继续向右行进 (`x: 180 -> 390`), 马身正从鸭子下方掠过并向鸭子右侧推进。 | • **`1.72s..1.80s` 预备 (`Anticipation`)**: 鸭子低头看马, 眨眼切 `wuyu`, 托羽化光散开;<br>• **`1.80s..2.12s` 竖直落下 (`Fall`)**: 从 `HOVER_TY` 加速坠至地面 `GROUND_TY = 63` ($u^2$ 重力曲线, 身体纵向拉伸 `sy: 1 -> 1.12`);<br>• **`2.12s..2.38s` 触地挤压回弹 (`Cushion`)**: 触地瞬间 (`2.12s`) 眨眼切 `zhuangsha`, 激起地面尘粒, 身体挤压 (`sy = 0.86`) 后迅速回弹蓄力 (`2.36s` 眨眼切回 `normal`)。 | 第一句定格微光; 下坠气流带动左侧两片手稿残页向下微沉。 |
| **Beat 3**<br>跑动追马<br>*(新增核心拍)* | `2.38s .. 3.15s` | 马**绝不刹停**, 继续向右巡航 (`x: 390 -> 670`), 此时马鞍位于屏幕 `x ≈ 640 -> 920` (在鸭子右侧前方)。 | **零停顿跑动追赶 (`Run-up`)**:<br>• 鸭子从落地位置 (`screenX = 340`) 身体前倾 `+8°`, 在地面上向右快跑追赶 (`screenX: 340 -> 610`);<br>• 双靴以 `3.5 Hz` 高频交替迈步 (`bootL/R: ±28°`), 双臂反向摆动 (`armL/R: ±32°`), 身体随步频带 `2x` 垂直弹跳 (`-14px * |sin|`), 脚下连续带起两簇向后飘散的跑动尘粒。 | **`2.15s` 起**第二句 **「这是一场关于知识的旅程」** 开始流式浮现, 文字向右生长的轨迹正好在视觉上方领跑鸭子的追马路线。 |
| **Beat 4**<br>动态跃乘 | `3.15s .. 4.25s` | 马保持向前行进 (`x: 670 -> 1060`), 在 `t = 4.25s` 鸭子落鞍瞬间马身顺势下沉缓冲 (`horseSaddleDip`, 下沉 `11px` 后回弹)。 | **移动中起跳上马 (`Dynamic Mount`)**:<br>• `3.15s..3.32s` 跑动中最后一步压低重心起跳 (`sy = 0.92`);<br>• `3.32s..4.25s` 斜抛腾空: 水平位移 `tx` 从跑动末端平滑插值锁入移动中的马鞍 `SEAT.tx = 130`, 垂直位移 `ty` 越过鞍桥最高点 `LAND_TY - 95` (在 `t = 4.00s` 切 `straddling` 前后分层), 于 `4.25s` 稳稳落入正在移动的马鞍! | 第二句在 `4.25s` 鸭子落鞍同一刻恰好流式写完最后一字, 形成「字落人落鞍」的视听高潮点; 周围手稿被跃乘冲击波向四周推开。 |
| **Beat 5**<br>骑乘右行 + 拉幕 | `4.25s .. 9.00s` | • `4.25s..5.20s`: 一人一马合流加速向右骑乘 (`x: 1060 -> 1360`);<br>• `5.20s..8.85s`: 牵引序幕画卷向右拉开 (`x: 1360 -> 2420`, 画卷左缘 `sheetEdgeX: 0 -> 1940`), 于 `8.85s` 驶出右画框。 | 落鞍后无缝接入骑乘随动: 鸭身随马步节奏前后摇摆 (`±3°`)、双靴滞后半拍交替荡漾 (`±6.5°`)、右手在 `4.6s..6.2s` 扬起挥手致意, 中途自然眨眼。 | • 流式文字随画卷在 `5.25s..6.80s` 向右优雅淡出;<br>• 底下 `KnowledgeJourney` 正片从 `FILM_START = 5.0s` 起预滚, `8.90s` 镜头帧级锁合正片轨迹。 |

#### 关键数学修复: 速度积分步伐相位 (`walkPhase`)
为彻底根除原版 `walkPhase` 在变速段相位倒退导致马腿抽搐的 bug ([src/opening-motion.ts:67-71](file:///E:/app/python/agent/remotion/src/opening-motion.ts#L67)), 新版马步相位直接由**马的屏幕位移积分**驱动:
$$\phi_{\text{walk}}(t) = \frac{x_{\text{horse}}(t) - x_{\text{horse}}(0)}{\Lambda_{\text{stride}}} \bmod 1 \quad (\Lambda_{\text{stride}} = 260\text{px})$$
- **物理效果**: 只要马向右走 ($\dot{x}_{\text{horse}}(t) > 0$), 相位 $\phi_{\text{walk}}(t)$ 严格单调递增; 马走得快步频自然加快, 马微降速迎鸭上马时步频自然放缓, **绝不倒退、绝不滑步 (Zero Foot-Sliding)**。

---

### 4.4 「知识世界」三层视差场面调度 ([src/Opening.tsx](file:///E:/app/python/agent/remotion/src/Opening.tsx) + [src/opening.css](file:///E:/app/python/agent/remotion/src/opening.css))

在序幕画卷 `MistSheet` 内构建有呼吸、有物理反馈的三层场景 (替代原有的工程网格与静态椭圆雾):

1. **远景层 (`.op-sky-canopy`, 视差系数 `0.15x`)**:
   - 两束斜倾 `-28°` 的破晓体积光束 (`God Rays`), 随时间缓慢呼吸脉动;
   - 一道横跨画幅的微光星轨弧线 (呼应底层正片的知识图谱弧线), 让背景不再是一张死白/死灰纸。
2. **中景环境叙事层 (`.op-manuscript-field`, 视差系数 `0.45x` + 骏马气流耦合)**:
   - 在舞台中景布置 **6 张半透明知识手稿残页 / 概念切片** (尺寸 `90x120px` 至 `150x190px`, 带有极淡的抽象段落横线与章节符印, **无任何可读小字**以免喧宾夺主);
   - **活物感气流物理公式**: 每张手稿除了自身的正弦微漂浮 ($\sin(\omega t + \phi)$) 外, 当 `horseX(t)` 掠过该手稿的水平坐标 $x_i$ 时, 产生一股向右上的**尾流冲量 (Wake Impulse)**:
     $$\Delta x_i(t) = A_i \cdot \text{wake}(t - t_{\text{pass}, i}), \quad \Delta \theta_i(t) = \Theta_i \cdot \text{wake}(t - t_{\text{pass}, i})$$
     使手稿在骏马奔过瞬间被气流掀起、向后上方翻飞再缓缓落回——让角色真正「活在场景的空气里」。
3. **近景与地面反馈层 (`.op-ground-world` + `.op-bokeh-layer`, 视差系数 `1.0x .. 1.35x`)**:
   - **地面长卷刻度**: 地面不再是一根死线, 而是带有透视微光节点与流动光脉冲的地平线轨;
   - **世界坐标马蹄与跑动微尘**: 鸭子触地 (`2.12s`)、鸭子跑动追马 (`2.38s..3.15s`) 与马蹄踏地时, 尘粒锚定在**世界地面坐标**向后上方消散, 而不是跟着马一起往前平移;
   - **前景散焦光尘 (`.op-bokeh`)**: 8 颗不同景深大小的柔光微粒在镜头最前景逆向缓慢漂浮, 赋予画面电影镜头的空气介质感。
4. **叙事视线闭环连接件: 流式游标俯冲化作地面引路丝线 (`.op-guide-thread`, 已裁定加入)**:
   - 在 `0.12s .. 4.25s` 牵引上方两行文字流式浮现的**微光游标 (Leading Spark)**, 在 `4.25s` 写完最后一字「程」(恰与鸭子跃入马鞍同帧) 后**不停留**, 沿一条三次贝塞尔弧线从字尾向右下方俯冲 (`4.25s .. 5.15s`), 落入奔马前方的地面并直接点燃 `5.20s` 拉开画卷的地面光轨 (`.op-draw-cord`), 将「提问 → 跃乘 → 拉幕」串成同一条不断裂的视觉引导线。

---

## 5. 待裁项与开放项 (Decisions)

- **D1**: **已裁定 甲** (2026-10-17) —— 上下双行左对齐流式独白 + `HARNESS / RAG` 胶囊印记。
- **D2**: **已裁定 甲** (2026-10-17) —— 随新五拍时间戳同步更新 `scripts/create-opening-audio.mjs` 并重生成 `public/opening-sound.wav`。
- **D3 (新增补充)**: **已裁定 加上** (2026-10-17) —— 加入「流式游标俯冲化作地面引路丝线 (`Eye-Trace Thread`)」。
- **D4 (色调方案)**: **出关键帧对比图中** —— 对比 `parchment` (1. 破晓羊皮纸手稿原野) 与 `dusk` (2. 暮色星图原野) 两套色调关键帧后定夺。

### D1: 流式主叙事文字的排版与落版锚点 (已裁定: 甲)
- **在问什么**: 上方同一行流式浮现 `"什么是 Harness RAG？"` 与 `"这是一场关于知识的旅程"` 时, 两句话如何排布, 以及是否保留小号品牌名 `harness / RAG`?
- **选项含义**:
  - **甲 (推荐｜上下双行左对齐流式独白)**: 在鸭子右侧同一视觉高度带内, 第一行流式写出 **「什么是 Harness RAG ？」** (`56px`, 粗黑墨色), 紧接着正下方第二行流式写出 **「这是一场关于知识的旅程」** (`44px`, 温润青灰墨色, 其中 `知识的旅程` 带柔光高光), 并在左上角极克制地附一枚 `14px` 胶囊印记 `HARNESS / RAG`; 整体像电影开场旁白字幕。
  - **乙 (单行长卷流式)**: 两句话在同一水平线上从左到右连排 (`什么是 Harness RAG？  这是一场关于知识的旅程`), 彻底不出现任何 `harness / RAG` 英文标牌。
- **推荐理由**: 甲方案在 `x = 490..1760` 宽度内字号更大、电影感与主次层级更强, 且第一行提问、第二行回答的视觉节拍更清晰。
- **选错后果**: 仅影响 [src/Opening.tsx](file:///E:/app/python/agent/remotion/src/Opening.tsx) 与 [src/opening.css](file:///E:/app/python/agent/remotion/src/opening.css) 中文字容器的排版样式, 运动数学完全相同, 随时可改。

### D2: 音轨 [public/opening-sound.wav](file:///E:/app/python/agent/remotion/public/opening-sound.wav) 是否随新五拍时间戳重生成
- **在问什么**: 画面节拍从旧版「`0.8s` 马入画、`3.5s` 鸭落地、`4.35s` 起跳」提前到了新版「`0.0s` 马入画、`2.12s` 鸭落地、`2.38s` 跑动追马、`3.15s` 起跳、`4.25s` 落鞍」, 是否同步更新 [scripts/create-opening-audio.mjs](file:///E:/app/python/agent/remotion/scripts/create-opening-audio.mjs) 并重新生成 `public/opening-sound.wav`?
- **选项含义**:
  - **甲 (推荐｜音画严格同步重生成)**: 修改 [scripts/create-opening-audio.mjs:201-266](file:///E:/app/python/agent/remotion/scripts/create-opening-audio.mjs#L201) 的音效触发点 (从 `0.0s` 起即有由远及近的马蹄声、`2.12s` 落地声、`2.4..3.1s` 鸭子急促跑动脚步声、`3.2s` 跃起风声、`4.25s` 落鞍皮革声、`5.2s` 拉幕声), 重新生成 `9.000s` 的 `public/opening-sound.wav`。
  - **乙 (只改画面, 不动音频文件)**: 保持现有 `public/opening-sound.wav` 字节不变, 只改 4 个画面与守卫文件。
- **推荐理由**: 既然去掉了前 `0.8s` 的死等并把落下/上马提前了 `1.2s`, 同步音轨才能让马蹄、落地、跑动追马与落鞍每一拍都踩在声音点上。
- **选错后果**: 若选乙, 画面里鸭子 `2.12s` 已经落地跑动, 但落地音效到 `3.5s` 才响, 会出现音画错位。

---

## 6. 向后兼容与改动边界 (Scope & Compatibility)

1. **只动 `TitleOpening` 所属文件**:
   - 必改: [src/opening-motion.ts](file:///E:/app/python/agent/remotion/src/opening-motion.ts)、[src/Opening.tsx](file:///E:/app/python/agent/remotion/src/Opening.tsx)、[src/opening.css](file:///E:/app/python/agent/remotion/src/opening.css)、[scripts/check-opening.mjs](file:///E:/app/python/agent/remotion/scripts/check-opening.mjs)
   - 按 D2 裁定联动: [scripts/create-opening-audio.mjs](file:///E:/app/python/agent/remotion/scripts/create-opening-audio.mjs)、[public/opening-sound.wav](file:///E:/app/python/agent/remotion/public/opening-sound.wav)
2. **零侵入已入库正片与共享绑定**:
   - 已入库的 48s 正片 ([src/KnowledgeJourney.tsx](file:///E:/app/python/agent/remotion/src/KnowledgeJourney.tsx)、[src/journey-motion.ts](file:///E:/app/python/agent/remotion/src/journey-motion.ts)、[src/journey.css](file:///E:/app/python/agent/remotion/src/journey.css)) **零修改**;
   - 角色切件绑定 ([src/mascot/CowboyCutUser.tsx](file:///E:/app/python/agent/remotion/src/mascot/CowboyCutUser.tsx)、[src/mascot/HorseCut.tsx](file:///E:/app/python/agent/remotion/src/mascot/HorseCut.tsx)、[src/mascot/seat-solver.ts](file:///E:/app/python/agent/remotion/src/mascot/seat-solver.ts)) **零修改**, 全部通过 `Opening.tsx` 与 `opening-motion.ts` 的关节驱动参数实现。

---

## 7. 验证与守卫口径 (Verification & Gates)

1. **运动数学守卫 (`node scripts/check-opening.mjs`)**:
   - **全程无死等守卫**: 采样 `t ∈ [0, 8.80]` 任意时刻, 断言马的速度 `(horseX(t + dt) - horseX(t)) / dt > 80 px/s` 恒成立, 且 `walkPhase(t)` 严格单调递增 (零倒退);
   - **高处左鸭同行守卫**: 断言 `t ∈ [0, 1.75]` 鸭子屏幕坐标 `screenX === 340 ± 1`、位于流式文字左侧同一水平带;
   - **五拍相位边界零跳变 (`seam`)**: 断言 `hover -> fall (1.80s)`、`fall -> cushion (2.12s)`、`cushion -> runUp (2.38s)`、`runUp -> mount (3.15s)`、`mount -> ride (4.25s)` 五个交接点两侧 `tx / ty` 差值 `< 0.01px`;
   - **跑动追马正向推进守卫**: 断言 `t ∈ [2.38, 3.15]` 鸭子屏幕横坐标 `screenX(t)` 严格单调递增, 且双靴旋转角出现完整的交替步频周期;
   - **流式叙事与拉幕交接守卫**: 断言第一句在 `1.95s` 前完成流式浮现、第二句在 `4.45s` 前完成流式浮现; 断言 `sheetEdgeX(8.9) >= 1920` 且正片镜头在 `8.95s` 与 `globalCameraAt` 误差 `< 1e-6`。
2. **代码静态门禁**: `npm run lint` (`eslint src && tsc`) 零错误。
3. **视觉实测交付**: 渲染关键拍序列帧 (含 `0.8s` 左鸭右流式提问、`2.0s` 落下、`2.75s` 落地跑动追马、`3.65s` 动态跃乘、`4.6s` 骑乘同框流式全句、`6.5s` 拉幕交接) 供直观审阅。

---

## 8. 下一步指令

审阅本规格后:
- 若认可推荐配置 (D1=甲, D2=甲), 回复 **「开工」** 即可, 我将直接按本规格完成代码实现、音轨同步、守卫验证与关键帧预览。
- 若需调整 D1/D2 或任意时间点, 直接回复编号 (如 **「D1乙, D2甲, 开工」**) 或直接手改本文件后告知我。
