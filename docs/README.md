# 文档总纲与 SSOT

## §0 事故复盘

本总纲记录本项目第一版的冻结口径：面向 Agnes 免费用户组 `default`，对外仅提供 `generate_images`，并由内部统一完成限流、下载与图片文件校验。历史冲突仅保留在下方冲突登记中，不代表当前仍支持旧能力。

## §1 文档地图

### 专属文档

| 文档 | 管什么 | 阶段 | 状态 | 权威度 |
|---|---|---|---|---|
| `DECISIONS.md` | 实施前冻结决策 | 冻结基线 | 🟢一致 | 最高 |
| `ARCHITECTURE.md` | 模块、类型、时序、安全边界 | 实现基线 | 🟢一致 | 高 |
| `API.md` | 统一图片生成工具协议 | 实现基线 | 🟢一致 | 高 |
| `RATE_LIMITING.md` | RPM 与批量限流 | 实现基线 | 🟢一致 | 高 |
| `SECURITY.md` | 凭据、路径、SSRF、发布边界 | 实现基线 | 🟢一致 | 高 |
| `QA_PLAN.md` | 测试矩阵与质量门禁 | 发布门禁 | 🟢一致 | 中 |
| `RELEASE.md` | GitHub/npm 开源发布清单 | 发布门禁 | 🟢一致 | 中 |

> 当前准备发布版本：`0.1.8`；发布方式为 GitHub Actions npm Trusted Publishing（OIDC）。
| `CONTRIBUTING.md` | 贡献约定 | 发布准备 | 🟢一致 | 中 |

### 仓库级共用文档

| 文档 | 管什么 | 阶段 | 状态 | 权威度 |
|---|---|---|---|---|
| `PROJECT_PLAN.md` | 产品范围与实施计划 | 实现基线 | 🟢一致 | 高 |
| `README.md` | 项目入口与导航 | 实现基线 | 🟢一致 | 中 |
| `OVERVIEW.md` | 本轮实施与审查概览 | 持续记录 | 🟢一致 | 低 |

阅读路径：新人先读 `README.md` → 本文 §2 → `DECISIONS.md`；改代码先读 `DECISIONS.md` → `API.md`/`ARCHITECTURE.md`；发布前读 `QA_PLAN.md` → `SECURITY.md` → `RELEASE.md`。

## §2 SSOT 权威口径表

> **规则：以下事实以本表和 `DECISIONS.md` 为唯一权威源。其它文档只能引用或按本表同步，不得保留冲突值。**

| 键 | 权威值 | 依据 |
|---|---|---|
| language / transport | TypeScript / MCP stdio | `DECISIONS.md` + 用户冻结方案 |
| license | MIT | `DECISIONS.md` + 用户冻结方案 |
| credentials | 仅 `AGNES_API_KEY`；默认模型配置为 `AGNES_MODEL` | D-001 |
| endpoint | 官方默认地址；不作为工具参数；仅测试可依赖注入覆盖 | D-001 |
| tools | 仅 `generate_images`：`items[]` 一项表示单张，多项表示批量；内部自动生成、下载和校验 | D-002 |
| batch input | `items[]` | D-002 |
| output | Agnes 上游固定请求 URL，统一自动下载到当前工作目录，不暴露 `url/base64` 选择 | 用户冻结方案 |
| size | 可选，默认 `1K`；仅 `1K`、`2K`、`3K`、`4K` | D-002 |
| ratio | 可选，默认 `1:1`；仅支持官方比例 | D-002 |
| continueOnError | 可选，默认 `false`；批量任务失败后停止 | D-003 |
| execution | 第一版同步等待、串行执行、最多 10 项；不实现异步 job 队列 | 用户冻结方案 |
| download | 生成后自动下载到 `process.cwd()/output` | D-004 |
| validate | 下载后自动校验图片 MIME、魔数和大小；不单独暴露 Tool | D-004 |
| RPM default | `1K=20`、`2K=10`、`3K=1`、`4K=1` | 用户冻结方案 |
| accounting | 每次真实上游请求计数；失败不退款 | D-003 |
| local path boundary | `process.cwd()` 沙箱；拒绝绝对路径、`..`、符号链接；不覆盖已有文件 | D-004 |

## §3 同步铁律

总原则：代码、决策或事实变更，文档必须在同一次工作内同步。

| 你改了什么 | 必须同步 |
|---|---|
| 工具字段或行为 | `API.md`、`ARCHITECTURE.md`、`PROJECT_PLAN.md`、QA 矩阵 |
| RPM、默认值或计费语义 | 先改 `DECISIONS.md` 与本表，再同步 `RATE_LIMITING.md`、QA、RELEASE |
| 安全边界 | `SECURITY.md`、`API.md`、`ARCHITECTURE.md` |
| 发布约束 | `QA_PLAN.md`、`RELEASE.md`、`README.md` |

必做：①先改 SSOT；②全仓搜索旧值；③更新状态与指针；④追加变更日志。禁止把冲突留到后续处理。

## §4 冲突登记

| ID | 冲突 | 严重度 | 处置 |
|---|---|---|---|
| C-001 | RPM 表含“允许发起”30/20 等非冻结值 | 高 | ✅ 已修为实际 RPM 冻结值 |
| C-002 | API 曾使用 `responseFormat`、`count`、`endpoint`，并暴露未冻结的 retry 字段 | 高 | ✅ 已统一为 `items[]`，移除 endpoint、retry 和输出格式工具参数 |
| C-003 | 精确尺寸被 API/限流文档放行 | 高 | ✅ 已限制为四档枚举 |
| C-004 | 下载和校验曾作为独立工具暴露 | 高 | ✅ 第一版收敛为生成工具内部自动下载与校验 |
| C-005 | 批量默认行为与冻结值冲突 | 中 | ✅ 已统一 `continueOnError=false`、串行执行 |

## §5 变更日志

| 日期 | 变更 | 责任人 |
|---|---|---|
| 2026-09-02 | 以 `DECISIONS.md` 为 SSOT，统一字段、工具、尺寸、RPM、批量和文件/网络边界；完成三批源码与安全优化，测试通过 | Luna |
| 2026-09-04 | 第一版收敛为单一 `generate_images` 工具：数组统一单图/批量，默认 1K/1:1，免费 default 实际 RPM 限流，自动下载与校验；不实现异步队列 | Luna |
