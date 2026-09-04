# agnes-image-mcp 项目总纲

> 📚 **本文档隶属 [文档总纲](docs/README.md)** — 关键事实以总纲 §2 SSOT 为准；修改本文档须遵守总纲 §3 同步铁律。
>
> 当前状态：第一版源码已实现，三批优化已完成，测试与类型检查通过。
>
> 本目录用于维护已实现、已发布并供多个项目使用的 Agnes Image 通用 MCP。

## 文档地图

| 文档 | 类型 | 状态 | 权威内容 |
|---|---|---|---|
| `PROJECT_PLAN.md` | 产品与范围 | 已完成初稿 | 项目目标、版本范围、官方接口基线、RPM |
| `docs/ARCHITECTURE.md` | 架构设计 | 实现基线 | 目录、模块、接口、限流、安全边界 |
| `docs/API.md` | 统一图片生成工具协议 | 实现基线 | `generate_images` 输入输出 |
| `docs/RATE_LIMITING.md` | 技术专题 | 实现基线 | 免费版 default RPM 与限流语义 |
| `docs/SECURITY.md` | 安全专题 | 实现基线 | 凭据、SSRF、路径、开源边界 |
| `docs/QA_PLAN.md` | QA 规划 | 发布门禁 | 测试矩阵与发布门禁 |
| `docs/CONTRIBUTING.md` | 开源协作 | 发布准备 | Issue、PR 与贡献约定 |
| `docs/RELEASE.md` | 发布清单 | 发布门禁 | GitHub/npm 发布门禁 |
| `docs/sequence-diagram.mermaid` | 图稿 | 已完成初稿 | 请求调用时序 |
| `docs/class-diagram.mermaid` | 图稿 | 已完成初稿 | 模块和接口关系 |
| `README.md` | 英文项目入口与导航 | 实现基线 | 安装、配置和工具说明 |
| `README.zh-CN.md` | 中文项目入口与使用说明 | 实现基线 | 中文安装、配置和发布说明 |
| `CHANGELOG.md` | 版本变更记录 | 已发布 | 版本与变更历史 |
| `OVERVIEW.md` | 实施与发布概览 | 持续更新 | 当前完成情况与验证记录 |

## SSOT 规则

- 所有冻结事实：以 [`docs/README.md`](docs/README.md) §2 SSOT 与 [`docs/DECISIONS.md`](docs/DECISIONS.md) 为唯一权威源。
- 其它文档只能引用这些事实，不重复维护另一份冲突的数值或字段表。

## 已冻结实施前提

1. 批量使用 `items[]`，第一版不使用 Agnes 官方 `n` 字段；
2. `generate_images` 内部仅接受 Agnes 返回的 HTTPS URL，自动下载到 `output/` 并校验；
3. Endpoint 固定官方默认地址，不作为工具参数；仅测试代码可依赖注入覆盖；
4. 文档、源码和发布流程已完成第一版收敛，当前 npm 已发布 `0.1.7`；后续按版本迭代维护。

## 当前维护约定

- 修改工具字段、行为或安全边界时，先更新 `docs/README.md` §2 SSOT，再同步相关文档。
- 发布新版本前执行 `docs/RELEASE.md` 中的发布门禁。
- 不把规划文档中的目标能力误认为当前已实现能力。
