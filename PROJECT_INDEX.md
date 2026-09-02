# agnes-image-mcp 项目总纲

> 📚 **本文档隶属 [文档总纲](docs/README.md)** — 关键事实以总纲 §2 SSOT 为准；修改本文档须遵守总纲 §3 同步铁律。
>
> 当前状态：文档一致性已完成，源码实现待开始。
>
> 本目录用于后续创建独立、可开源、供多个项目使用的 Agnes Image 通用 MCP。

## 文档地图

| 文档 | 类型 | 状态 | 权威内容 |
|---|---|---|---|
| `PROJECT_PLAN.md` | 产品与范围 | 已完成初稿 | 项目目标、版本范围、官方接口基线、RPM |
| `docs/ARCHITECTURE.md` | 架构设计 | 待架构师复核 | 目录、模块、接口、限流、实施依赖 |
| `docs/API.md` | 协议草案 | 已完成初稿 | 四个 MCP 工具输入输出 |
| `docs/RATE_LIMITING.md` | 技术专题 | 已完成初稿 | 免费版 default RPM 与限流语义 |
| `docs/SECURITY.md` | 安全专题 | 已完成初稿 | 凭据、SSRF、路径、开源边界 |
| `docs/QA_PLAN.md` | QA 规划 | 已完成初稿 | 测试矩阵与发布门禁 |
| `docs/CONTRIBUTING.md` | 开源协作 | 已完成初稿 | Issue、PR 与贡献约定 |
| `docs/RELEASE.md` | 发布清单 | 已完成初稿 | GitHub 首次发布门禁 |
| `docs/sequence-diagram.mermaid` | 图稿 | 已完成初稿 | 请求调用时序 |
| `docs/class-diagram.mermaid` | 图稿 | 已完成初稿 | 模块和接口关系 |

## SSOT 规则

- 所有冻结事实：以 [`docs/README.md`](docs/README.md) §2 SSOT 与 [`docs/DECISIONS.md`](docs/DECISIONS.md) 为唯一权威源。
- 其它文档只能引用这些事实，不重复维护另一份冲突的数值或字段表。

## 已冻结实施前提

1. 批量使用 `items[]`，第一版不使用 Agnes 官方 `n` 字段；
2. `download_image` 仅接受 HTTPS URL，`validate_image` 第一版仅接受本地路径；
3. Endpoint 固定官方默认地址，不作为工具参数；仅测试代码可依赖注入覆盖；
4. 本轮文档一致性门禁已完成，下一步才进入源码实现。

## 实施前置条件

- 用户确认本规划初稿；
- 完成架构复核；
- 再进入代码实现阶段；
- 实现阶段不得把本目录的规划文档当作已完成代码能力。
