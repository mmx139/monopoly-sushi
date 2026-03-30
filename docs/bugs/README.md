# Bug 状态定义

## 状态说明

| 状态 | 含义 | 何时使用 | 谁可以定义这个状态 |
|------|------|----------|--------------|
| **Open** | 待处理 | 发现bug，尚未开始修复 | 用户 |
| **Pending on Verify** | 待验证 | 修复完成，等待用户测试验证 | Claude Code |
| **Pending Develop** | 待开发 | 该功能已知未实现，属于规划中的功能，非bug | Claude Code |
| **Fixed** | 已修复 | 用户确认验证通过 | 用户 |
| **Won't Fix** | 不修复 | 不是问题或无法复现 | Claude Code |

## 状态转换

```
Open → Pending on Verify → Fixed/
                         ↓
                     用户确认:
                     ✓ 通过 → Fixed
                     ✗ 不通过 → Open (附注说明)

Open → Pending Develop (功能未实现，非bug)

Open → Won't Fix (确认非问题)
```

## 优先级定义

| 优先级 | 含义 |
|--------|------|
| **P0** | 崩溃/系统不可用/核心功能失效 |
| **P1** | 功能异常但可绕过 |
| **P2** | 界面/体验问题 |
| **P3** | 轻微问题 |

## 注意事项

- 对于Fixed状态的bug，修复者只更新修复时间和根因，不改变状态
- 只有用户可以改为 Fixed
- Pending on Verify 状态下如果用户测试不通过，改为 Open 并重新分配
