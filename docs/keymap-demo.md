# 多键序列快捷键演示

## 🎯 新功能介绍

Navigator 现在支持强大的多键序列快捷键系统，基于 Trie 字典树和状态机实现。

## 🔑 核心特性

### 1. 多键序列支持
- `gg` - 跳转到第一页
- `nc` - 创建批注
- `ne` - 编辑批注  
- `nd` - 删除批注
- `nl` - 列出所有批注
- `sf` - 向前搜索
- `sb` - 向后搜索

### 2. 智能超时机制
- **立即响应**: 如果按键序列完整且没有后续可能，立即执行
- **延迟响应**: 如果按键序列完整但有后续可能（如 `g` 后可能是 `gg`），等待1秒后执行
- **序列重置**: 如果1秒内没有后续输入或输入无效，重置状态机

### 3. 实时状态显示
状态栏左侧会显示当前输入的按键序列：
- 按 `n` 后状态栏显示 `n`
- 继续按 `c` 执行创建批注操作

## 🎮 使用演示

### 基础导航（单键）
```
j     # 下一页（立即执行）
k     # 上一页（立即执行）
G     # 最后一页（立即执行）
```

### 多键序列
```
g → g    # 第一页（g后等待1秒或立即按g）
n → c    # 创建批注
n → e    # 编辑批注
n → d    # 删除批注
n → l    # 列出批注
s → f    # 向前搜索
s → b    # 向后搜索
```

### 混合场景
```
g        # 显示"g"，等待1秒自动清除
g + g    # 快速连按，立即跳转到第一页
n        # 显示"n"，等待后续输入
n + c    # 创建批注
n + x    # 无效序列，重置状态
```

## 🏗️ 技术实现

### Trie 字典树结构
```
root
├── j (nextPage)
├── k (previousPage)  
├── g
│   └── g (firstPage)
├── G (lastPage)
├── n
│   ├── c (annotation.create)
│   ├── e (annotation.edit)
│   ├── d (annotation.delete)
│   └── l (annotation.list)
└── s
    ├── f (search.forward)
    └── b (search.backward)
```

### 状态机逻辑
1. **输入按键** → 检查是否匹配有效前缀
2. **有效前缀** → 更新当前序列，检查是否完整
3. **完整序列** → 
   - 无后续可能 → 立即执行
   - 有后续可能 → 设置1秒超时
4. **无效输入** → 重置状态机

### 超时处理
```typescript
// 情况1: 终止状态且没有后续按键 → 立即响应
if (currentAction && !hasChildren) {
  const action = currentAction
  this.reset()
  return { action, shouldContinue: false }
}

// 情况2: 终止状态但有后续按键 → 等待确认时间后响应  
else if (currentAction && hasChildren) {
  this.timeoutId = setTimeout(() => {
    this.reset()
    this.executeAction(action)
  }, this.CONFIRMATION_TIMEOUT)
}

// 情况3: 非终止状态 → 等待更多输入，设置超时清空
else {
  this.timeoutId = setTimeout(() => {
    this.reset()
  }, this.CONFIRMATION_TIMEOUT)
}
```

## 🎨 用户体验

### 视觉反馈
- 状态栏实时显示当前按键序列
- 按键序列以黄色高亮显示
- 帮助面板显示所有可用快捷键

### 错误处理
- 无效按键序列自动重置
- 超时机制防止状态卡死
- 控制台日志显示动作执行情况

### 扩展性
- 易于添加新的多键序列
- 支持任意长度的按键序列
- 可配置超时时间

## 🚀 未来扩展

### 短期计划
- [ ] 支持数字前缀（如 `3j` = 向下3页）
- [ ] 支持修饰键组合（Ctrl/Alt）
- [ ] 可视化快捷键冲突检测

### 长期计划  
- [ ] 用户自定义快捷键
- [ ] 快捷键配置文件导入/导出
- [ ] 上下文相关的快捷键（基于当前视图）

这个新的快捷键系统为 Navigator 提供了强大而灵活的操作方式，完全符合 vim-friendly 的设计理念！ 